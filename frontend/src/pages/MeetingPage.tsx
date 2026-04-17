// frontend/src/pages/MeetingPage.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  MessageSquare,
  PhoneOff,
  Circle,
  Users,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

import {
  LiveKitRoom,
  useParticipants,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";

import {
  Room,
  Track,
  Participant,
  RoomEvent,
  RemoteParticipant,
  ConnectionState,
} from "livekit-client";

// ======================================================
// VIDEO PARTICIPANT
// ======================================================

function ParticipantVideo({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    const room = (participant as any).room;
    const localIdentity = room?.localParticipant?.identity;
    setIsLocal(participant.identity === localIdentity);

    const attachTracks = () => {
      participant.trackPublications.forEach((pub) => {
        const track = pub.track;
        if (!track) return;

        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          setIsVideoReady(true);
        }

        if (track.kind === Track.Kind.Audio && audioRef.current) {
          track.attach(audioRef.current);
        }
      });
    };

    const detachTracks = () => {
      participant.trackPublications.forEach((pub) => {
        const track = pub.track;
        if (!track) return;
        track.detach();
      });
      setIsVideoReady(false);
    };

    attachTracks();
    participant.on(RoomEvent.TrackSubscribed, attachTracks);
    participant.on(RoomEvent.TrackUnsubscribed, detachTracks);

    const handleIsSpeaking = (speaking: boolean) => {
      setIsSpeaking(speaking);
    };
    (participant as any).on(RoomEvent.ActiveSpeakersChanged, handleIsSpeaking);

    return () => {
      participant.off(RoomEvent.TrackSubscribed, attachTracks);
      participant.off(RoomEvent.TrackUnsubscribed, detachTracks);
      (participant as any).off(RoomEvent.ActiveSpeakersChanged, handleIsSpeaking);
      detachTracks();
    };
  }, [participant]);

  const initials =
    participant.name?.slice(0, 2).toUpperCase() ||
    participant.identity.slice(0, 2).toUpperCase();

  const hasVideo = [...participant.trackPublications.values()].some(
    (p) => p.kind === Track.Kind.Video && p.isSubscribed
  );

  return (
    <Card className="aspect-video relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
        style={{ display: hasVideo && isVideoReady ? "block" : "none" }}
      />
      <audio ref={audioRef} autoPlay />

      {(!hasVideo || !isVideoReady) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl font-bold text-white transition-all ${isSpeaking ? 'ring-4 ring-green-500' : ''}`}>
            {initials}
          </div>
        </div>
      )}

      {isSpeaking && hasVideo && (
        <div className="absolute top-2 left-2">
          <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">
            Falando...
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
        <Badge variant="secondary" className="bg-black/50 text-white">
          {participant.name || participant.identity}
          {isLocal && " (Você)"}
        </Badge>
      </div>
    </Card>
  );
}

// ======================================================
// CONTROLS
// ======================================================

function MeetingControls({
  room,
  onLeave,
  toggleChat,
  showChat,
  serverUrl,
  token,
}: {
  room: Room;
  onLeave: () => void;
  toggleChat: () => void;
  showChat: boolean;
  serverUrl: string;
  token: string;
}) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [screen, setScreen] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const local = room.localParticipant;

  // Verificar estado da conexão
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(room.state === ConnectionState.Connected);
    };

    room.on(RoomEvent.ConnectionStateChanged, checkConnection);
    checkConnection();

    return () => {
      room.off(RoomEvent.ConnectionStateChanged, checkConnection);
    };
  }, [room]);

  const toggleMic = async () => {
    if (!isConnected) {
      toast.error("Aguardando conexão...");
      return;
    }
    try {
      await local.setMicrophoneEnabled(!mic);
      setMic(!mic);
      toast.success(mic ? "Microfone desligado" : "Microfone ligado");
    } catch (error) {
      toast.error("Erro ao alternar microfone");
    }
  };

  const toggleCamera = async () => {
    if (!isConnected) {
      toast.error("Aguardando conexão...");
      return;
    }
    try {
      await local.setCameraEnabled(!cam);
      setCam(!cam);
      toast.success(cam ? "Câmera desligada" : "Câmera ligada");
    } catch (error) {
      toast.error("Erro ao alternar câmera");
    }
  };

  const toggleScreen = async () => {
    if (!isConnected) {
      toast.error("Aguardando conexão...");
      return;
    }
    try {
      await local.setScreenShareEnabled(!screen);
      setScreen(!screen);
      toast.success(screen ? "Compartilhamento encerrado" : "Compartilhando tela");
    } catch (error) {
      toast.error("Erro ao compartilhar tela");
    }
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    toast.loading("Reconectando...", { id: "reconnect" });
    try {
      await room.disconnect();
      await room.connect(serverUrl, token);
      toast.success("Reconectado!", { id: "reconnect" });
    } catch (error) {
      toast.error("Falha na reconexão", { id: "reconnect" });
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <Card className="p-3 flex justify-center gap-2 flex-wrap bg-background/95 backdrop-blur">
      <Button
        size="icon"
        variant={mic ? "default" : "destructive"}
        onClick={toggleMic}
        className="rounded-full w-12 h-12"
        disabled={!isConnected}
      >
        {mic ? <Mic /> : <MicOff />}
      </Button>

      <Button
        size="icon"
        variant={cam ? "default" : "destructive"}
        onClick={toggleCamera}
        className="rounded-full w-12 h-12"
        disabled={!isConnected}
      >
        {cam ? <Camera /> : <CameraOff />}
      </Button>

      <Button
        size="icon"
        variant="default"
        onClick={toggleScreen}
        className="rounded-full w-12 h-12"
        disabled={!isConnected}
      >
        <Monitor />
      </Button>

      <Button
        size="icon"
        variant={showChat ? "secondary" : "default"}
        onClick={toggleChat}
        className="rounded-full w-12 h-12"
      >
        <MessageSquare />
      </Button>

      <Button
        size="icon"
        variant="outline"
        onClick={handleReconnect}
        disabled={isReconnecting}
        className="rounded-full w-12 h-12"
      >
        <RefreshCw className={`w-4 h-4 ${isReconnecting ? 'animate-spin' : ''}`} />
      </Button>

      <Button
        size="icon"
        variant="destructive"
        onClick={onLeave}
        className="rounded-full w-12 h-12"
      >
        <PhoneOff />
      </Button>
    </Card>
  );
}

// ======================================================
// CHAT
// ======================================================

function ChatPanel({ room }: { room: Room }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const send = () => {
    if (!input.trim()) return;

    const payload = new TextEncoder().encode(
      JSON.stringify({
        type: "chat",
        text: input,
        user: room.localParticipant.identity,
        timestamp: new Date().toISOString(),
      })
    );

    room.localParticipant.publishData(payload, { reliable: true });
    setMessages((p) => [...p, { user: "Você", text: input, isLocal: true }]);
    setInput("");
    toast.success("Mensagem enviada");
  };

  useEffect(() => {
    const handler = (data: Uint8Array, p?: RemoteParticipant) => {
      const msg = JSON.parse(new TextDecoder().decode(data));
      if (msg.type === "chat") {
        setMessages((prev) => [
          ...prev,
          { user: p?.identity || msg.user, text: msg.text, isLocal: false },
        ]);
        if (p?.identity !== room.localParticipant.identity) {
          toast.info(`💬 ${p?.identity}: ${msg.text}`, { duration: 3000 });
        }
      }
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="w-96 flex flex-col h-[600px] bg-background">
      <div className="p-3 border-b">
        <h3 className="font-semibold">Chat da Reunião</h3>
        <p className="text-xs text-muted-foreground">{messages.length} mensagens</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg ${m.isLocal
              ? "bg-primary text-primary-foreground ml-8"
              : "bg-muted mr-8"
              }`}
          >
            <p className="text-sm">{m.text}</p>
            <p className="text-xs opacity-70 mt-1">{m.user}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} size="sm">
          Enviar
        </Button>
      </div>
    </Card>
  );
}

// ======================================================
// CONTENT
// ======================================================

function MeetingContent({
  showChat,
  toggleChat,
  onLeave,
  serverUrl,
  token,
  roomName,
  userEmail,
}: any) {
  const participants = useParticipants();
  const room = useRoomContext();
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isPublishingReady, setIsPublishingReady] = useState(false);
  const hasCalledLeave = useRef(false);
  const isLeaving = useRef(false);

  // Função para obter ícone da conexão
  const getConnectionIcon = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return <Wifi className="w-4 h-4 text-green-500" />;
      case ConnectionState.Reconnecting:
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  // Função para obter texto da conexão
  const getConnectionText = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return "Conectado";
      case ConnectionState.Reconnecting:
        return "Reconectando...";
      case ConnectionState.Connecting:
        return "Conectando...";
      default:
        return "Desconectado";
    }
  };

  // Função para registrar saída da reunião
  const registerLeave = async () => {
    if (hasCalledLeave.current || isLeaving.current) {
      console.log("⚠️ Saída já registrada, ignorando...");
      return;
    }

    isLeaving.current = true;

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      console.log("👋 Registrando saída da reunião:", roomName);
      const response = await apiFetch(`/meetings/${roomName}/leave`, {
        method: "POST",
        body: JSON.stringify({ identity: userEmail }),
      });

      if (response.ok) {
        hasCalledLeave.current = true;
        console.log("✅ Saída registrada com sucesso");
      }
    } catch (error) {
      console.error("❌ Erro ao registrar saída:", error);
    } finally {
      isLeaving.current = false;
    }
  };

  useEffect(() => {
    const updateState = () => {
      const newState = room.state;
      setConnectionState(newState);

      if (newState === ConnectionState.Connected) {
        setTimeout(() => {
          setIsPublishingReady(true);
          console.log("✅ Conexão estável, pronto para publicar tracks");
        }, 1000);
      } else {
        setIsPublishingReady(false);
      }
    };

    room.on(RoomEvent.ConnectionStateChanged, updateState);
    updateState();

    const handleBeforeUnload = () => {
      const blob = new Blob([JSON.stringify({ identity: userEmail })], { type: 'application/json' });
      navigator.sendBeacon(`http://localhost:3000/api/meetings/${roomName}/leave`, blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (connectionState === ConnectionState.Connected && !hasCalledLeave.current) {
        registerLeave();
      }
    };
  }, [room, roomName, userEmail]);

  useEffect(() => {
    const handleDisconnected = () => {
      if (!hasCalledLeave.current) {
        registerLeave();
      }
    };

    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room]);

  const handleLeave = async () => {
    await registerLeave();
    onLeave();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <div>
          <h1 className="font-bold text-xl">Reunião ao Vivo</h1>
          <div className="flex items-center gap-2 mt-1">
            {getConnectionIcon()}
            <span className="text-xs text-muted-foreground">
              {getConnectionText()}
              {!isPublishingReady && connectionState === ConnectionState.Connected &&
                " (Inicializando...)"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>{participants.length} participante(s)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Circle className="w-3 h-3 text-red-500 animate-pulse" />
            <span>AO VIVO</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
            {participants.map((p) => (
              <ParticipantVideo key={p.identity} participant={p} />
            ))}
          </div>
          <MeetingControls
            room={room}
            onLeave={handleLeave}
            toggleChat={toggleChat}
            showChat={showChat}
            serverUrl={serverUrl}
            token={token}
          />
        </div>
        {showChat && <ChatPanel room={room} />}
      </div>
    </div>
  );
}
// ======================================================
// PAGE PRINCIPAL
// ======================================================

export default function MeetingPage() {
  const { roomName } = useParams<{ roomName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [shouldConnect, setShouldConnect] = useState(false);

  // Verificar permissões de mídia
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log("🔍 Verificando permissões de mídia...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        stream.getTracks().forEach(track => track.stop());
        console.log("✅ Permissões concedidas");
        toast.success("Câmera e microfone acessíveis");
        return true;
      } catch (err: any) {
        console.error("❌ Permissão negada:", err);

        if (err.name === 'NotAllowedError') {
          toast.error("Permissão negada!", {
            description: "Clique no cadeado na barra de endereço e permita câmera/microfone",
            duration: 10000,
          });
        } else if (err.name === 'NotFoundError') {
          toast.error("Nenhuma câmera/microfone encontrado");
        }
        return false;
      }
    };

    if (roomName && user) {
      checkPermissions().then(hasPermission => {
        if (hasPermission) {
          setShouldConnect(true);
        }
      });
    }
  }, [roomName, user]);

  // Obter token
  useEffect(() => {
    async function getToken() {
      try {
        setIsLoading(true);
        setError("");

        if (!roomName) {
          throw new Error("ID da reunião não encontrado");
        }

        if (!user?.email) {
          throw new Error("Usuário não autenticado");
        }

        console.log("🎯 Conectando à sala:", roomName);
        console.log("👤 Usuário:", user.email);

        const response = await apiFetch(`/meetings/${roomName}/join`, {
          method: "POST",
          body: JSON.stringify({
            identity: user.email,
            name: user.name || user.email.split("@")[0],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao entrar na reunião");
        }

        const data = await response.json();
        console.log("✅ Token recebido");

        setToken(data.token);
        setUrl(data.url || "ws://localhost:7880");

      } catch (err: any) {
        console.error("❌ Erro:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (shouldConnect) {
      getToken();
    }
  }, [user, roomName, shouldConnect]);

  if (isLoading || !shouldConnect) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">
            {!shouldConnect ? "Verificando permissões..." : "Entrando na reunião..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">❌ {error}</p>
          <Button onClick={() => navigate("/meetings")}>
            Voltar para lista de reuniões
          </Button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Aguardando token...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <LiveKitRoom
        serverUrl={url}
        token={token}
        connect={true}
        audio={true}
        video={true}
        onConnected={() => {
          console.log("🎉 LiveKit conectado!");
          toast.success("Conectado à reunião!");
        }}
        onDisconnected={() => {
          console.log("🔌 Desconectado do LiveKit");
          toast.warning("Você saiu da reunião");
          navigate("/meetings");
        }}
        onError={(error) => {
          console.error("Erro no LiveKit:", error);
          toast.error("Erro na conexão: " + error.message);
        }}
        className="h-full p-4"
      >
        <MeetingContent
          showChat={showChat}
          toggleChat={() => setShowChat(!showChat)}
          onLeave={() => {
            toast.custom((t) => (
              <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
                <div>
                  <p className="font-semibold">Sair da reunião?</p>
                  <p className="text-sm text-muted-foreground">Tem certeza que deseja sair?</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.dismiss(t)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      toast.dismiss(t);
                      navigate("/meetings");
                    }}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            ), { duration: Infinity });
          }}
          serverUrl={url}
          token={token}
          roomName={roomName}
          userEmail={user?.email}
        />
      </LiveKitRoom>
    </div>
  );
}