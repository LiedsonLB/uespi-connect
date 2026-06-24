// frontend/src/pages/SlidePresentation.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import {
  X, ChevronLeft, ChevronRight, Upload,
  Maximize2, Minimize2, FileText, Loader2,
} from "lucide-react";
import { Room, RoomEvent, RemoteParticipant, DataPacket_Kind } from "livekit-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SlideData { title: string; html: string; }
export const SLIDES_DATA: SlideData[] = [];
export function SlideView({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
  }, [html]);
  return <iframe ref={ref} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Slide" />;
}

// ─── pdf.js ───────────────────────────────────────────────────────────────────

declare global { interface Window { pdfjsLib: any; } }

async function getPdfJsLib() {
  if (window.pdfjsLib) return window.pdfjsLib;
  const lib = await import(/* @vite-ignore */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs") as any;
  lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs";
  window.pdfjsLib = lib;
  return lib;
}

async function renderPageToDataUrl(pdfDoc: any, pageNum: number, scale = 2): Promise<string> {
  const page     = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement("canvas");
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.85);
}

// ─── Chunk helpers ────────────────────────────────────────────────────────────
// LiveKit DataChannel: limite ~64KB por publish.
// Dividimos a dataUrl em pedaços de 48KB.

const CHUNK_SIZE = 48 * 1024; // bytes

function sendInChunks(
  room: Room,
  slideIndex: number,
  dataUrl: string,
  action: "start" | "slide_change"
) {
  const encoder = new TextEncoder();
  const bytes   = encoder.encode(dataUrl);
  const total   = Math.ceil(bytes.length / CHUNK_SIZE);

  for (let i = 0; i < total; i++) {
    const chunk   = bytes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const header  = encoder.encode(JSON.stringify({
      type:        "slide_chunk",
      action,
      slideIndex,
      chunkIndex:  i,
      totalChunks: total,
    }) + "\n");
    // payload = header + chunk data
    const payload = new Uint8Array(header.length + chunk.length);
    payload.set(header, 0);
    payload.set(chunk, header.length);
    room.localParticipant.publishData(payload, { reliable: true });
  }
}

// ─── Slide Canvas ─────────────────────────────────────────────────────────────

function SlideCanvas({ dataUrl }: { dataUrl: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <img src={dataUrl} alt="Slide" className="w-full h-full object-contain" draggable={false} />
    </div>
  );
}

// ─── SlidePresentation (presenter panel) ─────────────────────────────────────

export function SlidePresentation({
  room,
  currentUserEmail,
  onClose,
}: {
  room: Room;
  currentUserEmail: string;
  onClose: () => void;
}) {
  const [slides,       setSlides]       = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading,    setIsLoading]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [error,        setError]        = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileName,     setFileName]     = useState<string | null>(null);
  const [isDragging,   setIsDragging]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const slidesRef    = useRef<string[]>([]);
  slidesRef.current  = slides;

  const broadcast = useCallback((index: number, action: "start" | "slide_change" | "stop") => {
    if (action === "stop") {
      const payload = new TextEncoder().encode(JSON.stringify({ type: "presentation_control", action: "stop", presenterEmail: currentUserEmail }));
      room.localParticipant.publishData(payload, { reliable: true });
      return;
    }
    const dataUrl = slidesRef.current[index];
    if (!dataUrl) return;
    // Primeiro envia um aviso de "começa a receber chunks para este slide"
    const header = new TextEncoder().encode(JSON.stringify({
      type:       "presentation_control",
      action,
      slideIndex: index,
      presenterEmail: currentUserEmail,
    }));
    room.localParticipant.publishData(header, { reliable: true });
    // Depois envia a imagem em chunks
    sendInChunks(room, index, dataUrl, action);
  }, [room, currentUserEmail]);

  const processPDF = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { setError("Envie apenas PDFs."); return; }
    if (file.size > 50 * 1024 * 1024)   { setError("Limite: 50 MB.");       return; }

    setIsLoading(true); setError(null); setSlides([]); setProgress(0); setFileName(file.name);

    try {
      const lib      = await getPdfJsLib();
      const pdfDoc   = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
      const n        = pdfDoc.numPages;
      setTotalPages(n);

      const rendered: string[] = [];
      for (let i = 1; i <= n; i++) {
        const url = await renderPageToDataUrl(pdfDoc, i, 2);
        rendered.push(url);
        setProgress(i);
        setSlides(prev => [...prev, url]);
      }

      setCurrentIndex(0);
      broadcast(0, "start"); // usará rendered[0] via slidesRef após setState flushed
      // slidesRef.current ainda pode ser [] aqui; forçamos o envio direto:
      const header = new TextEncoder().encode(JSON.stringify({
        type: "presentation_control", action: "start", slideIndex: 0, presenterEmail: currentUserEmail,
      }));
      room.localParticipant.publishData(header, { reliable: true });
      sendInChunks(room, 0, rendered[0], "start");
    } catch (e: any) {
      setError(e.message || "Erro ao processar.");
    } finally {
      setIsLoading(false);
    }
  }, [broadcast, room, currentUserEmail]);

  const handleFile = useCallback((f?: File | null) => { if (f) processPDF(f); }, [processPDF]);

  const goTo = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    setCurrentIndex(index);
    const header = new TextEncoder().encode(JSON.stringify({
      type: "presentation_control", action: "slide_change", slideIndex: index, presenterEmail: currentUserEmail,
    }));
    room.localParticipant.publishData(header, { reliable: true });
    sendInChunks(room, index, slides[index], "slide_change");
  };

  const handleStop = () => { broadcast(currentIndex, "stop"); onClose(); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!slides.length) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(currentIndex + 1);
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goTo(currentIndex - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [slides, currentIndex]);

  const panelClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-[#0d1117]"
    : "fixed bottom-20 right-4 z-50 w-[560px] h-[400px] flex flex-col bg-[#111827] rounded-2xl shadow-2xl border border-white/10 overflow-hidden";

  return (
    <div className={panelClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-white text-sm font-semibold truncate">{fileName ?? "Apresentação de Slides"}</span>
          {slides.length > 0 && <span className="text-white/40 text-xs flex-shrink-0">{currentIndex + 1} / {slides.length}</span>}
          {isLoading && totalPages > 0 && <span className="text-blue-400 text-xs flex-shrink-0">({progress}/{totalPages})</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {slides.length > 0 && (
            <button onClick={() => { setSlides([]); setFileName(null); fileInputRef.current?.click(); }}
              className="text-white/50 hover:text-white text-xs border border-white/20 rounded-lg px-2 py-1 hover:border-white/40 transition-colors">
              Novo PDF
            </button>
          )}
          <button onClick={() => setIsFullscreen(v => !v)} className="text-white/50 hover:text-white transition-colors">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={handleStop} className="text-white/50 hover:text-red-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111827]/90 z-10 gap-3">
            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            <p className="text-white text-sm font-medium">
              {totalPages > 0 ? `Renderizando página ${progress} de ${totalPages}…` : "Carregando PDF…"}
            </p>
            {totalPages > 0 && (
              <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(progress / totalPages) * 100}%` }} />
              </div>
            )}
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 z-10">
            <p className="text-red-400 text-sm text-center">{error}</p>
            <button onClick={() => { setError(null); setFileName(null); }}
              className="text-white/60 text-xs underline hover:text-white transition-colors">Tentar novamente</button>
          </div>
        )}

        {!slides.length && !isLoading && !error && (
          <div
            className={`flex-1 flex flex-col items-center justify-center gap-4 p-6 cursor-pointer transition-all ${isDragging ? "bg-blue-500/10 border-2 border-dashed border-blue-500/60" : ""}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-white/40" />
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-medium">Envie um arquivo PDF</p>
              <p className="text-white/40 text-xs mt-1">Arraste aqui ou clique para selecionar</p>
            </div>
            <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all">
              <Upload className="w-4 h-4" /> Selecionar PDF
            </button>
            <p className="text-white/20 text-xs">Máx. 50 MB</p>
          </div>
        )}

        {slides.length > 0 && !error && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0"><SlideCanvas dataUrl={slides[currentIndex]} /></div>
            <div className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border-t border-white/10 flex-shrink-0">
              <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all active:scale-95">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 max-w-xs overflow-x-auto py-1">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className={`flex-shrink-0 h-1.5 rounded-full transition-all ${i === currentIndex ? "w-5 bg-blue-400" : "w-1.5 bg-white/20 hover:bg-white/40"}`} />
                ))}
              </div>
              <button onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === slides.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all active:scale-95">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
        onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}

// ─── SlideReceiver ────────────────────────────────────────────────────────────
// Hook usado pelo MeetingPage para reconstruir o slide recebido em chunks.

interface ChunkBuffer {
  total:  number;
  chunks: Map<number, Uint8Array>;
}

export function useSlideReceiver(room: Room) {
  const [slideDataUrl,   setSlideDataUrl]   = useState<string | undefined>();
  const [presenterName,  setPresenterName]  = useState<string>("");
  const [presenterEmail, setPresenterEmail] = useState<string>("");
  const [isActive,       setIsActive]       = useState(false);

  const buffers = useRef<Map<number, ChunkBuffer>>(new Map());

  useEffect(() => {
    const handler = (data: Uint8Array, participant?: RemoteParticipant) => {
      const text = new TextDecoder().decode(data);

      // Tenta ler como chunk (header\nchunkBytes)
      const newlineIdx = text.indexOf("\n");
      if (newlineIdx !== -1) {
        try {
          const header = JSON.parse(text.slice(0, newlineIdx));
          if (header.type === "slide_chunk") {
            const { slideIndex, chunkIndex, totalChunks } = header;
            if (!buffers.current.has(slideIndex)) {
              buffers.current.set(slideIndex, { total: totalChunks, chunks: new Map() });
            }
            const buf = buffers.current.get(slideIndex)!;
            buf.total = totalChunks;
            // chunk bytes estão depois do \n
            buf.chunks.set(chunkIndex, data.slice(newlineIdx + 1));

            if (buf.chunks.size === buf.total) {
              // Reconstrói a dataUrl
              const parts: Uint8Array[] = [];
              for (let i = 0; i < buf.total; i++) parts.push(buf.chunks.get(i)!);
              const full    = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
              let offset    = 0;
              for (const p of parts) { full.set(p, offset); offset += p.length; }
              const url = new TextDecoder().decode(full);
              setSlideDataUrl(url);
              buffers.current.delete(slideIndex);
            }
            return;
          }
        } catch {}
      }

      // Tenta como mensagem de controle JSON puro
      try {
        const msg = JSON.parse(text);
        if (msg.type !== "presentation_control") return;
        const name = participant?.name || participant?.identity || msg.presenterEmail || "Apresentador";
        if (msg.action === "start" || msg.action === "slide_change") {
          setIsActive(true);
          setPresenterName(name);
          setPresenterEmail(msg.presenterEmail || "");
          // A imagem chegará via chunks logo em seguida
        }
        if (msg.action === "stop") {
          setIsActive(false);
          setSlideDataUrl(undefined);
          setPresenterName("");
          buffers.current.clear();
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room]);

  return { slideDataUrl, presenterName, presenterEmail, isActive };
}