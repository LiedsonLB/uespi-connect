// frontend/src/pages/MeetingPage.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
  MessageSquare, PhoneOff, Users, RefreshCw, Wifi, WifiOff,
  MoreVertical, Hand, Smile, X, ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

import {
  LiveKitRoom,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";

import {
  Room, Track, Participant, RoomEvent, RemoteParticipant,
  ConnectionState, LocalParticipant,
} from "livekit-client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserData {
  name: string;
  profilePicture?: string;
  email: string;
  initials: string;
  [key: string]: any;
}

interface Reaction {
  id: string;
  emoji: string;
  user: string;
  x: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOJI_LIST = ["👍","❤️","😂","😮","👏","🎉","🔥","💯","🙌","😍","🤔","👎"];
const GIF_REACTIONS = [
  { label: "🥳 Party", url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" },
  { label: "😂 Laugh", url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif" },
  { label: "👏 Clap",  url: "https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif" },
  { label: "🔥 Fire",  url: "https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif" },
];

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  name,
  picture,
  size = 64,
  isSpeaking = false,
}: {
  name: string;
  picture?: string;
  size?: number;
  isSpeaking?: boolean;
}) {
  const initials = name?.slice(0, 2).toUpperCase() || "??";
  const colors = [
    "#1a73e8","#0f9d58","#f4b400","#db4437",
    "#673ab7","#e91e63","#00bcd4","#ff5722",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full flex-shrink-0 transition-all duration-200 ${
        isSpeaking ? "ring-4 ring-green-400 ring-offset-2 ring-offset-black" : ""
      }`}
    >
      {picture ? (
        console.log("Avatar picture:", picture),
        <img
          src={picture}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold select-none"
          style={{ backgroundColor: color, fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}
      {isSpeaking && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}

// ─── Participant Tile ─────────────────────────────────────────────────────────

function ParticipantTile({
  participant,
  profilePicture,
  compact = false,
}: {
  participant: Participant;
  profilePicture?: string;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isLocal = participant instanceof LocalParticipant;

  useEffect(() => {
    const attachVideo = () => {
      const videoPub = [...participant.trackPublications.values()].find(pub => {
        if (pub.source !== Track.Source.Camera) return false;
        if (pub.isMuted) return false;
        if (isLocal) return !!pub.track;
        return pub.isSubscribed && !!pub.track;
      });

      if (videoPub?.track && videoRef.current) {
        videoPub.track.attach(videoRef.current);
        setHasVideo(true);
      } else {
        if (videoRef.current) videoRef.current.srcObject = null;
        setHasVideo(false);
      }
    };

    const attachAudio = () => {
      const audioPub = [...participant.trackPublications.values()].find(pub => {
        if (pub.source !== Track.Source.Microphone) return false;
        if (isLocal) return !!pub.track;
        return pub.isSubscribed && !!pub.track;
      });
      setIsMuted(!audioPub || audioPub.isMuted);
      if (audioPub?.track && audioRef.current && !isLocal) {
        audioPub.track.attach(audioRef.current);
      }
    };

    attachVideo();
    attachAudio();

    participant.on(RoomEvent.TrackSubscribed, attachVideo);
    participant.on(RoomEvent.TrackUnsubscribed, attachVideo);
    participant.on(RoomEvent.LocalTrackPublished, attachVideo);
    participant.on(RoomEvent.LocalTrackUnpublished, attachVideo);
    participant.on(RoomEvent.TrackMuted, attachVideo);
    participant.on(RoomEvent.TrackUnmuted, attachVideo);
    participant.on(RoomEvent.TrackMuted, attachAudio);
    participant.on(RoomEvent.TrackUnmuted, attachAudio);

    return () => {
      participant.off(RoomEvent.TrackSubscribed, attachVideo);
      participant.off(RoomEvent.TrackUnsubscribed, attachVideo);
      participant.off(RoomEvent.LocalTrackPublished, attachVideo);
      participant.off(RoomEvent.LocalTrackUnpublished, attachVideo);
      participant.off(RoomEvent.TrackMuted, attachVideo);
      participant.off(RoomEvent.TrackUnmuted, attachVideo);
      participant.off(RoomEvent.TrackMuted, attachAudio);
      participant.off(RoomEvent.TrackUnmuted, attachAudio);
      participant.trackPublications.forEach(pub => pub.track?.detach());
    };
  }, [participant, isLocal]);

  // Speaking ring
  useEffect(() => {
    const room = (participant as any)._room as Room | undefined;
    if (!room) return;
    const handler = (speakers: Participant[]) => {
      setIsSpeaking(speakers.some(s => s.identity === participant.identity));
    };
    room.on(RoomEvent.ActiveSpeakersChanged, handler);
    return () => { room.off(RoomEvent.ActiveSpeakersChanged, handler); };
  }, [participant]);

  const name = participant.name || participant.identity;

  if (compact) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden bg-[#111827] flex-shrink-0 transition-all duration-200 ${
          isSpeaking ? "ring-2 ring-green-400" : "ring-1 ring-white/10"
        }`}
        style={{ width: 160, height: 90 }}
      >
        <video
          ref={videoRef}
          autoPlay playsInline muted={isLocal}
          className="w-full h-full object-cover"
          style={{ display: hasVideo ? "block" : "none" }}
        />
        <audio ref={audioRef} autoPlay />
        {!hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar name={name} picture={profilePicture} size={40} isSpeaking={isSpeaking} />
          </div>
        )}
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between">
          <span className="text-white text-[10px] font-medium truncate drop-shadow">{isLocal ? "Você" : name}</span>
          {isMuted && <MicOff className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />}
        </div>
        {isSpeaking && (
          <div className="absolute top-1 left-1">
            <SpeakingBars />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#1c1f23] transition-all duration-200 ${
        isSpeaking ? "ring-2 ring-green-400 shadow-lg shadow-green-400/20" : "ring-1 ring-white/10"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay playsInline muted={isLocal}
        className="w-full h-full object-cover"
        style={{ display: hasVideo ? "block" : "none" }}
      />
      <audio ref={audioRef} autoPlay />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={name} picture={profilePicture} size={72} isSpeaking={isSpeaking} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSpeaking && <SpeakingBars />}
          <span className="text-white text-sm font-medium drop-shadow">{isLocal ? "Você" : name}</span>
        </div>
        {isMuted && (
          <div className="w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center">
            <MicOff className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screen Share Tile ────────────────────────────────────────────────────────

function ScreenShareTile({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const isLocal = participant instanceof LocalParticipant;
    const attach = () => {
      const screenPub = [...participant.trackPublications.values()].find(pub =>
        pub.source === Track.Source.ScreenShare && pub.track &&
        (isLocal ? true : pub.isSubscribed)
      );
      if (screenPub?.track && videoRef.current) {
        screenPub.track.attach(videoRef.current);
      }
    };

    attach();
    participant.on(RoomEvent.LocalTrackPublished, attach);
    participant.on(RoomEvent.TrackSubscribed, attach);

    return () => {
      participant.off(RoomEvent.LocalTrackPublished, attach);
      participant.off(RoomEvent.TrackSubscribed, attach);
      [...participant.trackPublications.values()]
        .find(p => p.source === Track.Source.ScreenShare)
        ?.track?.detach();
    };
  }, [participant]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden ring-1 ring-white/10">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
        📺 {participant.name || participant.identity} está compartilhando
      </div>
    </div>
  );
}

// ─── Speaking Bars ────────────────────────────────────────────────────────────

function SpeakingBars() {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="w-[3px] bg-green-400 rounded-full animate-pulse"
          style={{
            height: `${40 + i * 20}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Floating Reaction ────────────────────────────────────────────────────────

function FloatingReaction({ reaction, onDone }: { reaction: Reaction; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="pointer-events-none fixed z-50 text-4xl animate-bounce"
      style={{
        left: reaction.x + "%",
        bottom: "120px",
        animation: "floatUp 3s ease-out forwards",
      }}
    >
      {reaction.emoji}
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#1c1f23] border border-white/10 rounded-2xl shadow-2xl p-3 w-80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">Reações</span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {EMOJI_LIST.map(e => (
          <button
            key={e}
            onClick={() => { onSelect(e); onClose(); }}
            className="text-2xl p-1.5 rounded-lg hover:bg-white/10 transition-colors text-center"
          >
            {e}
          </button>
        ))}
      </div>
      <div className="border-t border-white/10 pt-2">
        <p className="text-white/50 text-xs mb-2">GIFs rápidos</p>
        <div className="grid grid-cols-2 gap-1.5">
          {GIF_REACTIONS.map(g => (
            <button
              key={g.label}
              onClick={() => { onSelect(g.url); onClose(); }}
              className="relative rounded-lg overflow-hidden h-14 bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <img src={g.url} alt={g.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="absolute inset-0 flex items-end justify-start p-1">
                <span className="text-white text-[10px] font-medium bg-black/50 px-1 rounded">{g.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({ room, onClose }: { room: Room; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const send = useCallback(() => {
    if (!input.trim()) return;
    const payload = new TextEncoder().encode(JSON.stringify({
      type: "chat", text: input,
      user: room.localParticipant.name || room.localParticipant.identity,
      timestamp: new Date().toISOString(),
    }));
    room.localParticipant.publishData(payload, { reliable: true });
    setMessages(p => [...p, { user: "Você", text: input, isLocal: true }]);
    setInput("");
  }, [input, room]);

  useEffect(() => {
    const handler = (data: Uint8Array, p?: RemoteParticipant) => {
      const msg = JSON.parse(new TextDecoder().decode(data));
      if (msg.type === "chat") {
        setMessages(prev => [...prev, { user: p?.name || p?.identity || msg.user, text: msg.text, isLocal: false }]);
      }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-2xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-semibold">Chat na reunião</span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <p className="text-white/30 text-sm text-center mt-8">Nenhuma mensagem ainda</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.isLocal ? "items-end" : "items-start"}`}>
            <span className="text-white/40 text-[10px] mb-0.5">{m.user}</span>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
              m.isLocal
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-white/10 text-white rounded-tl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-blue-500/50 transition-colors">
          <input
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
            placeholder="Enviar mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button onClick={send} className="text-blue-400 hover:text-blue-300 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Controls Bar ─────────────────────────────────────────────────────────────

function ControlsBar({
  room,
  onLeave,
  onToggleChat,
  showChat,
  onToggleParticipants,
  showParticipants,
  serverUrl,
  token,
  participantCount,
}: {
  room: Room;
  onLeave: () => void;
  onToggleChat: () => void;
  showChat: boolean;
  onToggleParticipants: () => void;
  showParticipants: boolean;
  serverUrl: string;
  token: string;
  participantCount: number;
}) {
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(true);
  const [screen, setScreen] = useState(false);
  const [hand, setHand] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => setConnected(room.state === ConnectionState.Connected);
    room.on(RoomEvent.ConnectionStateChanged, check);
    check();
    return () => { room.off(RoomEvent.ConnectionStateChanged, check); };
  }, [room]);

  // Meeting timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const toggleMic = async () => {
    if (!connected) return;
    await room.localParticipant.setMicrophoneEnabled(!mic);
    setMic(!mic);
  };

  const toggleCam = async () => {
    if (!connected) return;
    await room.localParticipant.setCameraEnabled(!cam);
    setCam(!cam);
  };

  const toggleScreen = async () => {
    if (!connected) return;
    await room.localParticipant.setScreenShareEnabled(!screen);
    setScreen(!screen);
  };

  const toggleHand = () => {
    setHand(!hand);
    if (!hand) toast("✋ Você levantou a mão", { duration: 2000 });
  };

  const sendReaction = (emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    const x = 20 + Math.random() * 60;
    setReactions(r => [...r, { id, emoji, user: "Você", x }]);

    // broadcast via data channel
    const payload = new TextEncoder().encode(JSON.stringify({ type: "reaction", emoji }));
    room.localParticipant.publishData(payload, { reliable: false });
  };

  const ControlBtn = ({
    active, danger, onClick, icon, label, badge,
  }: {
    active?: boolean; danger?: boolean; onClick: () => void;
    icon: React.ReactNode; label: string; badge?: number;
  }) => (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 ${
          danger
            ? "bg-red-600 hover:bg-red-500 text-white"
            : active === false
            ? "bg-red-600/90 hover:bg-red-500 text-white"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
            {badge}
          </span>
        )}
      </button>
      <span className="text-white/50 text-[10px] select-none">{label}</span>
    </div>
  );

  return (
    <>
      {/* Floating reactions */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
      `}</style>
      {reactions.map(r => (
        <FloatingReaction key={r.id} reaction={r} onDone={() => setReactions(prev => prev.filter(x => x.id !== r.id))} />
      ))}

      {showEmoji && (
        <EmojiPicker onSelect={sendReaction} onClose={() => setShowEmoji(false)} />
      )}

      <div className="relative flex items-center justify-between px-6 py-3 rounded-2xl bg-[#111827] backdrop-blur-md border-t border-white/5">
        {/* Left: time + connection */}
        <div className="flex items-center gap-3 w-48">
          <div className="flex items-center gap-1.5">
            {connected
              ? <Wifi className="w-3.5 h-3.5 text-green-400" />
              : <WifiOff className="w-3.5 h-3.5 text-red-400" />
            }
            <span className="text-white/40 text-xs font-mono">{formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <Users className="w-3 h-3" />
            <span>{participantCount}</span>
          </div>
        </div>

        {/* Center: controls */}
        <div className="flex items-end gap-3">
          <ControlBtn
            active={mic}
            onClick={toggleMic}
            icon={mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            label={mic ? "Silenciar" : "Ativar mic"}
          />
          <ControlBtn
            active={cam}
            onClick={toggleCam}
            icon={cam ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            label={cam ? "Desligar cam" : "Ligar cam"}
          />
          <ControlBtn
            onClick={toggleScreen}
            icon={screen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            label={screen ? "Parar" : "Apresentar"}
          />
          <ControlBtn
            onClick={() => setShowEmoji(v => !v)}
            icon={<Smile className="w-5 h-5" />}
            label="Reações"
          />
          <ControlBtn
            onClick={toggleHand}
            icon={<Hand className="w-5 h-5" />}
            label={hand ? "Baixar mão" : "Levantar mão"}
          />

          {/* Leave */}
          <div className="flex flex-col items-center gap-1 ml-2">
            <button
              onClick={onLeave}
              className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-150"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
            <span className="text-white/50 text-[10px]">Sair</span>
          </div>
        </div>

        {/* Right: chat + participants */}
        <div className="flex items-end gap-3 w-48 justify-end">
          <ControlBtn
            onClick={onToggleParticipants}
            icon={<Users className="w-5 h-5" />}
            label="Participantes"
            badge={participantCount}
          />
          <ControlBtn
            onClick={onToggleChat}
            icon={<MessageSquare className="w-5 h-5" />}
            label="Chat"
          />
          <ControlBtn
            onClick={() => {}}
            icon={<MoreVertical className="w-5 h-5" />}
            label="Mais"
          />
        </div>
      </div>
    </>
  );
}

// ─── Participants Panel ───────────────────────────────────────────────────────

function ParticipantsPanel({
  participants,
  onClose,
  profilePictures,
}: {
  participants: Participant[];
  onClose: () => void;
  profilePictures: Record<string, string>;
}) {
  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-2xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-semibold">Participantes ({participants.length})</span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {participants.map(p => (
          <div key={p.identity} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
            <Avatar
              name={p.name || p.identity}
              picture={profilePictures[p.identity]}
              size={36}
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {p.name || p.identity}
                {p instanceof LocalParticipant && <span className="text-white/40 ml-1">(Você)</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Meeting Content ──────────────────────────────────────────────────────────

function MeetingContent({
  showChat: initChat,
  serverUrl,
  token,
  roomName,
  userEmail,
  currentUser,
  onLeave,
}: {
  showChat: boolean;
  serverUrl: string;
  token: string;
  roomName: string;
  userEmail: string;
  currentUser: UserData | null;
  onLeave: () => void;
}) {
  const participants = useParticipants();
  const room = useRoomContext();
  const [showChat, setShowChat] = useState(initChat);
  const [showParticipants, setShowParticipants] = useState(false);
  const [screenSharer, setScreenSharer] = useState<Participant | null>(null);
  const hasCalledLeave = useRef(false);

  // Profile pictures map: identity -> url
  // Local user from currentUser, remote users from participant.metadata (JSON)
  const profilePictures: Record<string, string> = {};
  if (currentUser?.profilePicture && currentUser?.email) {
    profilePictures[currentUser.email] = currentUser.profilePicture;
  }
  participants.forEach(p => {
    if (p.metadata) {
      try {
        const meta = JSON.parse(p.metadata);
        if (meta.profilePicture) profilePictures[p.identity] = meta.profilePicture;
      } catch {}
    }
  });

  // Detect screen share
  useEffect(() => {
    const check = () => {
      const sharer = participants.find(p =>
        [...p.trackPublications.values()].some(pub =>
          pub.source === Track.Source.ScreenShare && pub.track &&
          (p instanceof LocalParticipant ? true : pub.isSubscribed)
        )
      );
      setScreenSharer(sharer || null);
    };
    check();
    room.on(RoomEvent.TrackSubscribed, check);
    room.on(RoomEvent.TrackUnsubscribed, check);
    room.on(RoomEvent.LocalTrackPublished, check);
    room.on(RoomEvent.LocalTrackUnpublished, check);
    return () => {
      room.off(RoomEvent.TrackSubscribed, check);
      room.off(RoomEvent.TrackUnsubscribed, check);
      room.off(RoomEvent.LocalTrackPublished, check);
      room.off(RoomEvent.LocalTrackUnpublished, check);
    };
  }, [room, participants]);

  const registerLeave = useCallback(async () => {
    if (hasCalledLeave.current) return;
    hasCalledLeave.current = true;
    try {
      await apiFetch(`/meetings/${roomName}/leave`, {
        method: "POST",
        body: JSON.stringify({ identity: userEmail }),
      });
    } catch {}
  }, [roomName, userEmail]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const blob = new Blob([JSON.stringify({ identity: userEmail })], { type: "application/json" });
      navigator.sendBeacon(`${window.location.origin}/api/meetings/${roomName}/leave`, blob);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomName, userEmail]);

  const handleLeave = async () => {
    await registerLeave();
    onLeave();
  };

  const sideOpen = showChat || showParticipants;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Main area */}
      <div className="flex flex-1 min-h-0 gap-2 p-2">

        {/* Video area */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">
          {screenSharer ? (
            // Screen share layout: big screen + sidebar participants
            <div className="flex-1 flex gap-2 min-h-0">
              <div className="flex-1 min-w-0">
                <ScreenShareTile participant={screenSharer} />
              </div>
              <div className="flex flex-col gap-2 w-44 overflow-y-auto">
                {participants.map(p => (
                  <ParticipantTile
                    key={p.identity}
                    participant={p}
                    profilePicture={profilePictures[p.identity]}
                    compact
                  />
                ))}
              </div>
            </div>
          ) : (
            // Grid layout
            <div
              className="flex-1 grid gap-2 min-h-0"
              style={{
                gridTemplateColumns: participants.length === 1
                  ? "1fr"
                  : participants.length === 2
                  ? "repeat(2, 1fr)"
                  : participants.length <= 4
                  ? "repeat(2, 1fr)"
                  : participants.length <= 6
                  ? "repeat(3, 1fr)"
                  : "repeat(4, 1fr)",
                gridAutoRows: "1fr",
              }}
            >
              {participants.map(p => (
                <ParticipantTile
                  key={p.identity}
                  participant={p}
                  profilePicture={profilePictures[p.identity]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        {sideOpen && (
          <div className="w-80 flex-shrink-0">
            {showChat && (
              <ChatPanel room={room} onClose={() => setShowChat(false)} />
            )}
            {showParticipants && !showChat && (
              <ParticipantsPanel
                participants={participants}
                onClose={() => setShowParticipants(false)}
                profilePictures={profilePictures}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <ControlsBar
        room={room}
        onLeave={handleLeave}
        onToggleChat={() => { setShowChat(v => !v); setShowParticipants(false); }}
        showChat={showChat}
        onToggleParticipants={() => { setShowParticipants(v => !v); setShowChat(false); }}
        showParticipants={showParticipants}
        serverUrl={serverUrl}
        token={token}
        participantCount={participants.length}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeetingPage() {
  const { roomName } = useParams<{ roomName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [shouldConnect, setShouldConnect] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(t => t.stop());
        setShouldConnect(true);
      } catch (err: any) {
        if (err.name === "NotAllowedError") {
          toast.error("Permissão negada. Permita câmera e microfone.");
        } else {
          setShouldConnect(true); // continue anyway
        }
      }
    };
    if (roomName && user) checkPermissions();
  }, [roomName, user]);

  useEffect(() => {
    if (!shouldConnect) return;
    async function getToken() {
      try {
        setIsLoading(true);
        if (!roomName || !user?.email) throw new Error("Dados inválidos");
        const response = await apiFetch(`/meetings/${roomName}/join`, {
          method: "POST",
          body: JSON.stringify({ identity: user.email, name: user.name || user.email.split("@")[0] }),
        });
        const data = await response.json();
        setToken(data.token);
        setUrl(data.url || import.meta.env.VITE_LIVEKIT_URL || "ws://177.136.252.12:7880");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    getToken();
  }, [shouldConnect, user, roomName]);

  if (isLoading || !shouldConnect) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            {!shouldConnect ? "Verificando permissões..." : "Entrando na reunião..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-400 text-lg">❌ {error}</p>
        <Button onClick={() => navigate("/meetings")} variant="outline">
          Voltar para reuniões
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Aguardando token...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden" style={{ height: "calc(100vh - 115px)" }}>
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect={true}
        audio={true}
        video={true}
        onConnected={() => toast.success("Conectado à reunião!")}
        onDisconnected={() => { toast.warning("Você saiu da reunião"); navigate("/meetings"); }}
        onError={err => toast.error("Erro: " + err.message)}
        className="h-full"
      >
        <MeetingContent
          showChat={false}
          serverUrl={url}
          token={token}
          roomName={roomName!}
          userEmail={user?.email || ""}
          currentUser={user as UserData}
          onLeave={() => navigate("/meetings")}
        />
      </LiveKitRoom>
    </div>
  );
}