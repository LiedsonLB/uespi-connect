// frontend/src/pages/MeetingPage.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
  MessageSquare, PhoneOff, Users, Wifi, WifiOff,
  Hand, Smile, X, ChevronRight, FlipHorizontal,
  Presentation,
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

import messageSoundUrl from "@/assets/message_sound.mp3";
import handSoundUrl from "@/assets/hand_notification.mp3";
import { SlidePresentation, useSlideReceiver } from "./SlidePresentation";

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

interface ChatMessage {
  user: string;
  text: string;
  isLocal: boolean;
}

// ─── Role Detection ───────────────────────────────────────────────────────────

type ParticipantRole = "vip" | "professor" | "student";

function getParticipantRole(identity: string): ParticipantRole {
  if (identity === "fliedsonbbarros@aluno.uespi.br") return "vip";
  if (identity === "liedson.b9@gmail.com") return "vip";
  if (identity.endsWith("@prp.uespi.br")) return "professor";
  return "student";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMOJI_LIST = [
  "👍", "❤️", "😂", "😮", "👏", "🎉",
  "🔥", "💯", "🙌", "😍", "🥰", "🤩",
  "😎", "🤔", "✨", "💪", "🎊", "🥳",
  "😭", "🤯", "👀", "💀", "😨", "🤦‍♂️",
];

const GIF_REACTIONS = [
  { label: "Festa", url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" },
  { label: "Pensamento", url: "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyYTJ6YmE1cDRpYmgxZnd2ZDN5dWp5amQzYjU4cGNoc2lhZzBtNGtxdSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/kNpNw0eB1w4qDYA7hS/giphy_s.gif" },
  { label: "Divino", url: "https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif" },
  { label: "Assustado", url: "https://www.papodebar.com/wp-content/uploads/2011/05/gato-assustado.gif" },
  { label: "Humrum", url: "https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUydmJnNHJiZHpkbm5tYmF2cWJ2cHZ0dWM1ZXY4emZneGoyNnJlZ3M3byZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3UcFqCm4r6ix9dpS/200w.gif" },
  { label: "Incrível", url: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  !("getDisplayMedia" in (navigator.mediaDevices || {}));

function resolveProfilePicture(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.includes("googleusercontent.com") || url.includes("ggpht.com"))
    return url.replace(/=s\d+-c/, "=s200-c");
  return url;
}

// ─── Sound Hook ───────────────────────────────────────────────────────────────

function useNotificationSound(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio(src);
    audioRef.current.volume = 0.4;
    audioRef.current.loop = false;
    audioRef.current.onended = () => { isPlayingRef.current = false; };
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, [src]);

  return useCallback(() => {
    if (audioRef.current && !isPlayingRef.current) {
      isPlayingRef.current = true;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { isPlayingRef.current = false; });
    }
  }, []);
}

// ─── Role Frame ───────────────────────────────────────────────────────────────

function RoleFrame({
  role,
  size,
  children,
  compact = false,
}: {
  role: ParticipantRole;
  size?: number;
  children: React.ReactNode;
  compact?: boolean;
}) {
  if (role === "student") return <>{children}</>;

  if (role === "vip") {
    return (
      <div className="relative" style={size ? { width: size, height: size } : {}}>
        <div
          className="absolute inset-0 rounded-full z-0"
          style={{
            padding: compact ? 2 : 3,
            background:
              "conic-gradient(from 0deg, #FFD700, #FFA500, #FF69B4, #9400D3, #0000FF, #00FF00, #FFFF00, #FFD700)",
            animation: "spin 3s linear infinite",
            borderRadius: "50%",
          }}
        >
          <div className="w-full h-full rounded-full bg-[#0d1117]" />
        </div>
        <div
          className="absolute inset-0 rounded-full z-0 blur-sm opacity-60"
          style={{
            background:
              "conic-gradient(from 0deg, #FFD700, #FFA500, #FF69B4, #9400D3, #0000FF, #00FF00, #FFFF00, #FFD700)",
            animation: "spin 3s linear infinite",
          }}
        />
        <div className="relative z-10 w-full h-full">{children}</div>
        {!compact && (
          <div
            className="absolute z-20 flex items-center justify-center rounded-full bg-yellow-400 border-2 border-[#0d1117] shadow-lg"
            style={{
              bottom: -6,
              left: "90%",
              transform: "translateX(-50%)",
              fontSize: size ? size * 0.22 : 14,
              width: size ? size * 0.38 : 24,
              height: size ? size * 0.38 : 24,
            }}
          >
            👑
          </div>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="relative" style={size ? { width: size, height: size } : {}}>
      <div
        className="absolute inset-0 rounded-full z-0"
        style={{
          padding: compact ? 2 : 3,
          background: "linear-gradient(135deg, #6366f1, #818cf8, #4f46e5, #a5b4fc)",
          borderRadius: "50%",
        }}
      >
        <div className="w-full h-full rounded-full bg-[#0d1117]" />
      </div>
      <div
        className="absolute inset-0 rounded-full z-0 blur-sm opacity-40"
        style={{
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
        }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
      {!compact && (
        <div
          className="absolute z-20 flex items-center justify-center rounded-full bg-indigo-500 border-2 border-[#0d1117] shadow-lg"
          style={{
            bottom: -6,
            left: "90%",
            transform: "translateX(-50%)",
            fontSize: size ? size * 0.2 : 12,
            width: size ? size * 0.36 : 22,
            height: size ? size * 0.36 : 22,
          }}
        >
          🎓
        </div>
      )}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────

function RoleTileBadge({ role }: { role: ParticipantRole }) {
  if (role === "student") return null;
  if (role === "vip") {
    return (
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg"
        style={{
          background: "linear-gradient(90deg, #FFD700, #FFA500)",
          color: "#000",
          boxShadow: "0 0 8px 2px rgba(255,215,0,0.5)",
        }}>
        👑 LB
      </div>
    );
  }
  return (
    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg bg-indigo-600 text-white">
      🎓 Professor(a)
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  name, picture, size = 64, isSpeaking = false, handRaised = false, role = "student",
}: {
  name: string; picture?: string; size?: number; isSpeaking?: boolean; handRaised?: boolean; role?: ParticipantRole;
}) {
  const initials = name?.slice(0, 2).toUpperCase() || "??";
  const colors = ["#1a73e8", "#0f9d58", "#f4b400", "#db4437", "#673ab7", "#e91e63", "#00bcd4", "#ff5722"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const [imgError, setImgError] = useState(false);
  const resolvedPicture = resolveProfilePicture(picture);

  const inner = (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full flex-shrink-0 transition-all duration-200 ${isSpeaking ? "ring-4 ring-green-400 ring-offset-2 ring-offset-black" : ""
        }`}
    >
      {resolvedPicture && !imgError ? (
        <img src={resolvedPicture} alt={name} referrerPolicy="no-referrer" crossOrigin="anonymous"
          className="w-full h-full rounded-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold select-none"
          style={{ backgroundColor: color, fontSize: size * 0.35 }}>
          {initials}
        </div>
      )}
      {isSpeaking && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        </div>
      )}
      {handRaised && (
        <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center animate-bounce"
          style={{ width: size * 0.42, height: size * 0.42, fontSize: size * 0.22 }}>
          ✋
        </div>
      )}
    </div>
  );

  return (
    <RoleFrame role={role} size={size}>
      {inner}
    </RoleFrame>
  );
}

// ─── Participant Tile ─────────────────────────────────────────────────────────

function ParticipantTile({
  participant, profilePicture, compact = false, handRaised = false, isSpeaking = false,
}: {
  participant: Participant; profilePicture?: string; compact?: boolean; handRaised?: boolean; isSpeaking?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isLocal = participant instanceof LocalParticipant;
  const role = getParticipantRole(participant.identity);

  useEffect(() => {
    const attachVideo = () => {
      const pub = [...participant.trackPublications.values()].find(p => {
        if (p.source !== Track.Source.Camera) return false;
        if (p.isMuted) return false;
        return isLocal ? !!p.track : p.isSubscribed && !!p.track;
      });
      if (pub?.track && videoRef.current) { pub.track.attach(videoRef.current); setHasVideo(true); }
      else { if (videoRef.current) videoRef.current.srcObject = null; setHasVideo(false); }
    };
    const attachAudio = () => {
      const pub = [...participant.trackPublications.values()].find(p => {
        if (p.source !== Track.Source.Microphone) return false;
        return isLocal ? !!p.track : p.isSubscribed && !!p.track;
      });
      setIsMuted(!pub || pub.isMuted);
      if (pub?.track && audioRef.current && !isLocal) pub.track.attach(audioRef.current);
    };
    attachVideo(); attachAudio();
    const events = [
      RoomEvent.TrackSubscribed, RoomEvent.TrackUnsubscribed,
      RoomEvent.LocalTrackPublished, RoomEvent.LocalTrackUnpublished,
      RoomEvent.TrackMuted, RoomEvent.TrackUnmuted,
    ];
    events.forEach(e => { participant.on(e, attachVideo); participant.on(e, attachAudio); });
    return () => {
      events.forEach(e => { participant.off(e, attachVideo); participant.off(e, attachAudio); });
      participant.trackPublications.forEach(p => p.track?.detach());
    };
  }, [participant, isLocal]);

  const name = participant.name || participant.identity;

  const speakingRing = isSpeaking
    ? role === "vip"
      ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30"
      : role === "professor"
        ? "ring-2 ring-indigo-400 shadow-lg shadow-indigo-400/20"
        : "ring-2 ring-green-400 shadow-lg shadow-green-400/20"
    : role === "vip"
      ? "ring-2 ring-yellow-500/50"
      : role === "professor"
        ? "ring-1 ring-indigo-500/40"
        : "ring-1 ring-white/10";

  if (compact) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden bg-[#111827] flex-shrink-0 transition-all duration-200 ${speakingRing}`}
        style={{ width: 160, height: 90 }}
      >
        {role === "vip" && (
          <div className="absolute inset-0 z-0 opacity-10"
            style={{ background: "linear-gradient(135deg, #FFD700 0%, transparent 60%)" }} />
        )}
        {role === "professor" && (
          <div className="absolute inset-0 z-0 opacity-10"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, transparent 60%)" }} />
        )}
        <video ref={videoRef} autoPlay playsInline muted={isLocal}
          className="w-full h-full object-cover relative z-10" style={{ display: hasVideo ? "block" : "none" }} />
        <audio ref={audioRef} autoPlay />
        {!hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Avatar name={name} picture={profilePicture} size={40} isSpeaking={isSpeaking} handRaised={handRaised} role={role} />
          </div>
        )}
        {handRaised && <div className="absolute top-1 right-1 text-base animate-bounce leading-none z-20">✋</div>}
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between z-20">
          <span className="text-white text-[10px] font-medium truncate drop-shadow">{isLocal ? "Você" : name}</span>
          {isMuted && <MicOff className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />}
        </div>
        {isSpeaking && <div className="absolute top-1 left-1 z-20"><SpeakingBars role={role} /></div>}
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#1c1f23] transition-all duration-200 ${speakingRing}`}>
      {role === "vip" && (
        <div className="absolute inset-0 z-0 opacity-[0.07]"
          style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, transparent 100%)" }} />
      )}
      {role === "professor" && (
        <div className="absolute inset-0 z-0 opacity-[0.07]"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #818cf8 50%, transparent 100%)" }} />
      )}
      <video ref={videoRef} autoPlay playsInline muted={isLocal}
        className="w-full h-full object-cover relative z-10" style={{ display: hasVideo ? "block" : "none" }} />
      <audio ref={audioRef} autoPlay />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Avatar name={name} picture={profilePicture} size={72} isSpeaking={isSpeaking} handRaised={handRaised} role={role} />
        </div>
      )}
      <RoleTileBadge role={role} />
      {handRaised && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg whitespace-nowrap">
          ✋ Mão levantada
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {isSpeaking && <SpeakingBars role={role} />}
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

// ─── Screen Share Tile com Áudio ───────────────────────────────────────────

function ScreenShareTile({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    const isLocal = participant instanceof LocalParticipant;
    
    const attach = () => {
      // Vídeo
      const videoPub = [...participant.trackPublications.values()].find(p =>
        p.source === Track.Source.ScreenShare && p.track && (isLocal ? true : p.isSubscribed)
      );
      if (videoPub?.track && videoRef.current) {
        videoPub.track.attach(videoRef.current);
      }
      
      // Áudio do sistema
      const audioPub = [...participant.trackPublications.values()].find(p =>
        p.source === Track.Source.ScreenShareAudio && p.track && !isLocal && p.isSubscribed
      );
      if (audioPub?.track && audioRef.current) {
        audioPub.track.attach(audioRef.current);
        audioRef.current.muted = false;
        audioRef.current.volume = 1;
        setHasAudio(true);
      } else {
        setHasAudio(false);
      }
    };
    
    attach();
    
    participant.on(RoomEvent.LocalTrackPublished, attach);
    participant.on(RoomEvent.TrackSubscribed, attach);
    participant.on(RoomEvent.TrackUnsubscribed, attach);
    
    return () => {
      participant.off(RoomEvent.LocalTrackPublished, attach);
      participant.off(RoomEvent.TrackSubscribed, attach);
      participant.off(RoomEvent.TrackUnsubscribed, attach);
      
      [...participant.trackPublications.values()]
        .filter(p => p.source === Track.Source.ScreenShare || p.source === Track.Source.ScreenShareAudio)
        .forEach(p => p.track?.detach());
    };
  }, [participant]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden ring-1 ring-white/10">
      <video ref={videoRef} autoPlay playsInline muted={participant instanceof LocalParticipant} className="w-full h-full object-contain" />
      <audio ref={audioRef} autoPlay />
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-2">
        <span>📺 {participant.name || participant.identity} está compartilhando</span>
        {hasAudio && <span className="text-green-400">🔊 Áudio do sistema</span>}
      </div>
    </div>
  );
}

// ─── Slide Tile ───────────────────────────────────────────────────────────────

function SlideTile({ slideDataUrl, presenterName }: { slideDataUrl?: string; presenterName: string }) {
  if (!slideDataUrl) return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden ring-2 ring-blue-500/50 bg-black flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/40 text-sm">Recebendo slides de {presenterName}…</p>
    </div>
  );
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden ring-2 ring-blue-500/50">
      <img src={slideDataUrl} alt="Slide" className="w-full h-full object-contain bg-black" />
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
        📽️ {presenterName} está apresentando
      </div>
    </div>
  );
}

// ─── Speaking Bars ────────────────────────────────────────────────────────────

function SpeakingBars({ role = "student" }: { role?: ParticipantRole }) {
  const color =
    role === "vip" ? "#FFD700" :
      role === "professor" ? "#818cf8" :
        "#4ade80";
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="w-[3px] rounded-full animate-pulse"
          style={{
            backgroundColor: color,
            height: `${40 + i * 20}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.6s",
          }} />
      ))}
    </div>
  );
}

// ─── Floating Reaction ────────────────────────────────────────────────────────

function FloatingReaction({ reaction, onDone }: { reaction: Reaction; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  const isGif = reaction.emoji.startsWith("http");
  return (
    <div className="pointer-events-none fixed z-50"
      style={{ left: reaction.x + "%", bottom: "120px", animation: "floatUp 3.5s ease-out forwards" }}>
      {isGif ? (
        <div className="relative flex flex-col items-center gap-1">
          <img src={reaction.emoji} alt="gif" className="w-24 h-24 rounded-2xl object-cover shadow-2xl border-2 border-white/20" />
          <span className="text-white/80 text-[10px] bg-black/60 px-2 py-0.5 rounded-full">{reaction.user}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl drop-shadow-lg leading-none">{reaction.emoji}</span>
          <span className="text-white/80 text-[10px] bg-black/60 px-2 py-0.5 rounded-full">{reaction.user}</span>
        </div>
      )}
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#1c1f23] border border-white/10 rounded-2xl shadow-2xl p-3 w-72 sm:w-80 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">Reações</span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {EMOJI_LIST.map(e => (
          <button key={e} onClick={() => { onSelect(e);}}
            className="text-2xl p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all text-center leading-none">
            {e}
          </button>
        ))}
      </div>
      <div className="border-t border-white/10 pt-2">
        <p className="text-white/50 text-xs mb-2">GIFs rápidos</p>
        <div className="grid grid-cols-3 gap-1.5">
          {GIF_REACTIONS.map(g => (
            <button key={g.label} onClick={() => { onSelect(g.url);}}
              className="relative rounded-xl overflow-hidden bg-white/5 hover:ring-2 hover:ring-blue-400 active:scale-95 transition-all group" style={{ aspectRatio: "1" }}>
              <img src={g.url} alt={g.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-1">
                <span className="text-white text-[9px] font-semibold">{g.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({ room, messages, onSend, onClose }: {
  room: Room; messages: ChatMessage[]; onSend: (t: string) => void; onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const send = useCallback(() => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  }, [input, onSend]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-2xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-semibold">Chat na reunião</span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && <p className="text-white/30 text-sm text-center mt-8">Nenhuma mensagem ainda</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.isLocal ? "items-end" : "items-start"}`}>
            <span className="text-white/40 text-[10px] mb-0.5">{m.user}</span>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.isLocal ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm"
              }`}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-blue-500/50 transition-colors">
          <input className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
            placeholder="Enviar mensagem..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()} />
          <button onClick={send} className="text-blue-400 hover:text-blue-300 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Controls Bar com Áudio na Transmissão ───────────────────────────────────

function ControlsBar({
  room, onLeave, onToggleChat, showChat, onToggleParticipants, showParticipants,
  participantCount, reactions, onReaction, raisedHands, localHandRaised, onToggleHand,
  isMobile, onTogglePresentation, showPresentation,
}: {
  room: Room; onLeave: () => void;
  onToggleChat: () => void; showChat: boolean;
  onToggleParticipants: () => void; showParticipants: boolean;
  participantCount: number;
  reactions: Reaction[]; onReaction: (e: string) => void;
  raisedHands: Set<string>; localHandRaised: boolean; onToggleHand: () => void;
  isMobile: boolean;
  onTogglePresentation: () => void; showPresentation: boolean;
}) {
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [screen, setScreen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [connected, setConnected] = useState(false);
  const [time, setTime] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const micPending = useRef(false);
  const camPending = useRef(false);
  const screenPending = useRef(false);

  useEffect(() => {
    const check = () => setConnected(room.state === ConnectionState.Connected);
    room.on(RoomEvent.ConnectionStateChanged, check); check();
    return () => { room.off(RoomEvent.ConnectionStateChanged, check); };
  }, [room]);

  useEffect(() => {
    const syncMic = () => {
      const enabled = room.localParticipant.isMicrophoneEnabled;
      setMic(enabled);
    };
    const syncCam = () => {
      const enabled = room.localParticipant.isCameraEnabled;
      setCam(enabled);
    };
    const syncScreen = () => {
      const enabled = [...room.localParticipant.trackPublications.values()].some(
        p => p.source === Track.Source.ScreenShare && !p.isMuted && p.track
      );
      setScreen(enabled);
    };

    room.localParticipant.on(RoomEvent.LocalTrackPublished, syncMic);
    room.localParticipant.on(RoomEvent.LocalTrackPublished, syncCam);
    room.localParticipant.on(RoomEvent.LocalTrackPublished, syncScreen);
    room.localParticipant.on(RoomEvent.LocalTrackUnpublished, syncMic);
    room.localParticipant.on(RoomEvent.LocalTrackUnpublished, syncCam);
    room.localParticipant.on(RoomEvent.LocalTrackUnpublished, syncScreen);
    room.localParticipant.on(RoomEvent.TrackMuted, syncMic);
    room.localParticipant.on(RoomEvent.TrackMuted, syncCam);
    room.localParticipant.on(RoomEvent.TrackUnmuted, syncMic);
    room.localParticipant.on(RoomEvent.TrackUnmuted, syncCam);

    return () => {
      room.localParticipant.off(RoomEvent.LocalTrackPublished, syncMic);
      room.localParticipant.off(RoomEvent.LocalTrackPublished, syncCam);
      room.localParticipant.off(RoomEvent.LocalTrackPublished, syncScreen);
      room.localParticipant.off(RoomEvent.LocalTrackUnpublished, syncMic);
      room.localParticipant.off(RoomEvent.LocalTrackUnpublished, syncCam);
      room.localParticipant.off(RoomEvent.LocalTrackUnpublished, syncScreen);
      room.localParticipant.off(RoomEvent.TrackMuted, syncMic);
      room.localParticipant.off(RoomEvent.TrackMuted, syncCam);
      room.localParticipant.off(RoomEvent.TrackUnmuted, syncMic);
      room.localParticipant.off(RoomEvent.TrackUnmuted, syncCam);
    };
  }, [room]);

  useEffect(() => {
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const toggleMic = async () => {
    if (!connected || micPending.current) return;
    micPending.current = true;
    try {
      const next = !room.localParticipant.isMicrophoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(next);
      setMic(next);
    } catch (err: any) {
      toast.error("Erro ao alternar microfone");
    } finally {
      micPending.current = false;
    }
  };

  const toggleCam = async () => {
    if (!connected || camPending.current) return;
    camPending.current = true;
    try {
      const next = !room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(next, { facingMode });
      setCam(next);
    } catch (err: any) {
      toast.error("Erro ao alternar câmera");
    } finally {
      camPending.current = false;
    }
  };

  const flipCamera = async () => {
    if (!connected || !cam || camPending.current) return;
    camPending.current = true;
    try {
      const next = facingMode === "user" ? "environment" : "user";
      setFacingMode(next);
      await room.localParticipant.setCameraEnabled(false);
      await room.localParticipant.setCameraEnabled(true, { facingMode: next });
    } catch (err: any) {
      toast.error("Erro ao virar câmera");
    } finally {
      camPending.current = false;
    }
  };

  // 🔴 FUNÇÃO MODIFICADA PARA CAPTURAR ÁUDIO DO SISTEMA
  const toggleScreen = async () => {
    if (!connected || screenPending.current) return;
    screenPending.current = true;
    
    try {
      if (!screen) {
        // Solicitar compartilhamento de tela COM ÁUDIO
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true  // ← Isso captura o áudio do sistema
        });
        
        // Publicar vídeo
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          await room.localParticipant.publishTrack(videoTrack, {
            source: Track.Source.ScreenShare,
            name: 'screen_video',
          });
          
          // Auto-parar quando usuário clicar em "Parar compartilhamento"
          videoTrack.onended = () => {
            setScreen(false);
          };
        }
        
        // Publicar áudio do sistema separadamente
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          await room.localParticipant.publishTrack(audioTrack, {
            source: Track.Source.ScreenShareAudio,
            name: 'screen_audio',
          });
          toast.success("Compartilhando tela com áudio do sistema");
        } else {
          toast.info("Compartilhando tela (sem áudio)");
        }
        
        setScreen(true);
        
      } else {
        // Parar compartilhamento
        const publications = Array.from(room.localParticipant.trackPublications.values());
        for (const pub of publications) {
          if (pub.source === Track.Source.ScreenShare || 
              pub.source === Track.Source.ScreenShareAudio) {
            await room.localParticipant.unpublishTrack(pub.track);
            if (pub.track) {
              pub.track.stop();
            }
          }
        }
        setScreen(false);
        toast.info("Compartilhamento de tela encerrado");
      }
    } catch (err: any) {
      console.error("Screen share error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        // Usuário cancelou ou negou permissão
        setScreen(false);
      } else {
        toast.error("Erro ao compartilhar tela: " + err.message);
      }
    } finally {
      screenPending.current = false;
    }
  };

  const Btn = ({
    onClick, icon, label, badge, active, danger, highlight, disabled, showLabel = true,
  }: {
    onClick: () => void; icon: React.ReactNode; label: string;
    badge?: number; active?: boolean; danger?: boolean; highlight?: boolean;
    disabled?: boolean; showLabel?: boolean;
  }) => (
    <div className="flex flex-col items-center gap-1">
      <button onClick={disabled ? undefined : onClick}
        className={`relative flex items-center justify-center rounded-full transition-all duration-150 active:scale-95
          ${isMobile ? "w-11 h-11" : "w-12 h-12"}
          ${disabled ? "opacity-30 cursor-not-allowed bg-white/5 text-white/30" :
            danger ? "bg-red-600 hover:bg-red-500 text-white" :
              highlight ? "bg-yellow-400 hover:bg-yellow-300 text-black" :
                active === false ? "bg-red-600/90 hover:bg-red-500 text-white" :
                  "bg-white/10 hover:bg-white/20 text-white"}`}>
        {icon}
        {!!badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      {showLabel && !isMobile && (
        <span className="text-white/40 text-[10px] select-none leading-none">{label}</span>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(1.1); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {reactions.map(r => <FloatingReaction key={r.id} reaction={r} onDone={() => { }} />)}
      {showEmoji && <EmojiPicker onSelect={onReaction} onClose={() => setShowEmoji(false)} />}

      {isMobile ? (
        <div className="bg-[#0d1117] border-t border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {connected ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                <span className="text-white/50 text-xs font-mono tabular-nums">{formatTime(time)}</span>
              </div>
              <div className="flex items-center gap-1 text-white/40 text-xs">
                <Users className="w-3 h-3" /><span>{participantCount}</span>
              </div>
              {raisedHands.size > 0 && (
                <div className="flex items-center gap-1 text-yellow-400 text-xs font-semibold animate-pulse">
                  <span>✋</span><span>{raisedHands.size}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={onToggleParticipants}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${showParticipants ? "bg-white/20 text-white" : "bg-white/8 text-white/50 hover:bg-white/12"}`}>
                <Users className="w-3 h-3" /><span>{participantCount}</span>
              </button>
              <button onClick={onToggleChat}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${showChat ? "bg-blue-600 text-white" : "bg-white/8 text-white/50 hover:bg-white/12"}`}>
                <MessageSquare className="w-3 h-3" /><span>Chat</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-around px-2 py-3">
            <Btn onClick={toggleMic} active={mic} icon={mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />} label="Mic" />
            <Btn onClick={toggleCam} active={cam} icon={cam ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />} label="Câm" />
            {cam && <Btn onClick={flipCamera} icon={<FlipHorizontal className="w-5 h-5" />} label="Virar" />}
            <Btn onClick={() => setShowEmoji(v => !v)} icon={<Smile className="w-5 h-5" />} label="React" />
            <Btn onClick={onToggleHand} highlight={localHandRaised} icon={<Hand className="w-5 h-5" />} label={localHandRaised ? "Baixar" : "Mão"} />
            <Btn onClick={toggleScreen} icon={screen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />} label={screen ? "Parar" : "Tela"} />
            <Btn disabled onClick={onTogglePresentation} icon={<Presentation className="w-5 h-5" />} label={showPresentation ? "Fechar" : "Slides"} highlight={showPresentation} />
            <button onClick={onLeave}
              className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-6 py-3 bg-[#111827] border-t border-white/5 flex-shrink-0">
          <div className="flex items-center gap-4 w-56">
            <div className="flex items-center gap-1.5">
              {connected ? <Wifi className="w-3.5 h-3.5 text-green-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
              <span className="text-white/40 text-xs font-mono tabular-nums">{formatTime(time)}</span>
            </div>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Users className="w-3 h-3" /><span>{participantCount}</span>
            </div>
            {raisedHands.size > 0 && (
              <div className="flex items-center gap-1 text-yellow-400 text-xs font-semibold animate-pulse">
                <span>✋</span><span>{raisedHands.size}</span>
              </div>
            )}
          </div>

          <div className="flex items-end gap-3">
            <Btn onClick={toggleMic} active={mic} icon={mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />} label={mic ? "Silenciar" : "Ativar mic"} />
            <Btn onClick={toggleCam} active={cam} icon={cam ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />} label={cam ? "Desligar cam" : "Ligar cam"} />
            <Btn onClick={toggleScreen} icon={screen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />} label={screen ? "Parar" : "Tela"} />
            <Btn onClick={() => setShowEmoji(v => !v)} icon={<Smile className="w-5 h-5" />} label="Reações" />
            <Btn onClick={onToggleHand} highlight={localHandRaised} icon={<Hand className="w-5 h-5" />} label={localHandRaised ? "Baixar mão" : "Levantar mão"} />
            <Btn onClick={toggleScreen} icon={screen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />} label={screen ? "Parar" : "Tela"} />
            <Btn disabled onClick={onTogglePresentation} icon={<Presentation className="w-5 h-5" />} label={showPresentation ? "Fechar slides" : "Slides"} highlight={showPresentation} />
            <div className="flex flex-col items-center gap-1 ml-2">
              <button onClick={onLeave}
                className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all">
                <PhoneOff className="w-5 h-5" />
              </button>
              <span className="text-white/40 text-[10px]">Sair</span>
            </div>
          </div>

          <div className="flex items-end gap-3 w-56 justify-end">
            <Btn onClick={onToggleParticipants} icon={<Users className="w-5 h-5" />} label="Participantes" badge={participantCount} />
            <Btn onClick={onToggleChat} icon={<MessageSquare className="w-5 h-5" />} label="Chat" />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Participants Panel ───────────────────────────────────────────────────────

function ParticipantsPanel({ participants, onClose, profilePictures, raisedHands }: {
  participants: Participant[]; onClose: () => void;
  profilePictures: Record<string, string>; raisedHands: Set<string>;
}) {
  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-2xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-white font-semibold">Participantes ({participants.length})</span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {participants.map(p => {
          const role = getParticipantRole(p.identity);
          return (
            <div key={p.identity}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${role === "vip" ? "hover:bg-yellow-500/10" :
                  role === "professor" ? "hover:bg-indigo-500/10" :
                    "hover:bg-white/5"
                }`}>
              <Avatar name={p.name || p.identity} picture={profilePictures[p.identity]} size={36}
                handRaised={raisedHands.has(p.identity)} role={role} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate flex items-center gap-2">
                  {p.name || p.identity}
                  {p instanceof LocalParticipant && <span className="text-white/40 text-xs">(Você)</span>}
                  {raisedHands.has(p.identity) && <span className="text-yellow-400 animate-bounce">✋</span>}
                  {role === "vip" && <span className="text-yellow-400 text-xs font-bold">👑</span>}
                  {role === "professor" && <span className="text-indigo-400 text-xs font-bold">🎓</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Meeting Content ──────────────────────────────────────────────────────────

function MeetingContent({
  showChat: initChat, roomName, userEmail, currentUser, onLeave,
}: {
  showChat: boolean; roomName: string;
  userEmail: string; currentUser: UserData | null; onLeave: () => void;
}) {
  const participants = useParticipants();
  const room = useRoomContext();

  const [showChat, setShowChat] = useState(initChat);
  const [showParticipants, setShowParticipants] = useState(false);
  const [screenSharer, setScreenSharer] = useState<Participant | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [iAmPresenting, setIAmPresenting] = useState(false);

  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handler = (speakers: Participant[]) => {
      setActiveSpeakers(new Set(speakers.map(s => s.identity)));
    };
    room.on(RoomEvent.ActiveSpeakersChanged, handler);
    return () => { room.off(RoomEvent.ActiveSpeakersChanged, handler); };
  }, [room]);

  const { slideDataUrl, presenterName, isActive: slideActive } = useSlideReceiver(room);

  const hasCalledLeave = useRef(false);
  const localHandRaised = raisedHands.has(userEmail);
  const mobile = isMobileDevice();

  const playMessageSound = useNotificationSound(messageSoundUrl);
  const playHandSound = useNotificationSound(handSoundUrl);

  const profilePictures: Record<string, string> = {};
  if (currentUser?.profilePicture && currentUser?.email) {
    const r = resolveProfilePicture(currentUser.profilePicture);
    if (r) profilePictures[currentUser.email] = r;
  }
  participants.forEach(p => {
    if (p.metadata) {
      try {
        const meta = JSON.parse(p.metadata);
        if (meta.profilePicture) {
          const r = resolveProfilePicture(meta.profilePicture);
          if (r) profilePictures[p.identity] = r;
        }
      } catch { }
    }
  });

  useEffect(() => {
    if (!room || !currentUser?.profilePicture) return;
    room.localParticipant.setMetadata(JSON.stringify({ profilePicture: currentUser.profilePicture })).catch(console.error);
  }, [room, currentUser?.profilePicture]);

  const showChatRef = useRef(showChat);
  showChatRef.current = showChat;

  useEffect(() => {
    const handler = (data: Uint8Array, p?: RemoteParticipant) => {
      try {
        const text = new TextDecoder().decode(data);
        if (text.includes('"slide_chunk"')) return;

        const msg = JSON.parse(text);

        if (msg.type === "chat") {
          const senderName = p?.name || p?.identity || msg.user || "Desconhecido";
          setChatMessages(prev => [...prev, { user: senderName, text: msg.text, isLocal: false }]);
          playMessageSound();
          if (!showChatRef.current) toast(`💬 ${senderName}: ${msg.text}`, { duration: 4000 });
        }

        if (msg.type === "reaction") {
          const id = Math.random().toString(36).slice(2);
          const x = 10 + Math.random() * 70;
          const name = p?.name || p?.identity || "Alguém";
          setReactions(r => [...r, { id, emoji: msg.emoji, user: name, x }]);
          setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3500);
        }

        if (msg.type === "hand_raise") {
          const identity = p?.identity || msg.identity;
          if (!identity) return;
          setRaisedHands(prev => {
            const next = new Set(prev);
            if (msg.raised) {
              next.add(identity);
              playHandSound();
              toast(`✋ ${p?.name || p?.identity || "Alguém"} levantou a mão`, { duration: 3000 });
            } else {
              next.delete(identity);
            }
            return next;
          });
        }
      } catch { }
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room, playMessageSound, playHandSound]);

  const handleSendChat = useCallback((text: string) => {
    const payload = new TextEncoder().encode(JSON.stringify({
      type: "chat", text,
      user: room.localParticipant.name || room.localParticipant.identity,
      timestamp: new Date().toISOString(),
    }));
    room.localParticipant.publishData(payload, { reliable: true });
    setChatMessages(prev => [...prev, { user: "Você", text, isLocal: true }]);
  }, [room]);

  const handleReaction = useCallback((emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    const x = 10 + Math.random() * 70;
    setReactions(r => [...r, { id, emoji, user: "Você", x }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3500);
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: "reaction", emoji })),
      { reliable: false }
    );
  }, [room]);

  const handleToggleHand = useCallback(() => {
    const newRaised = !localHandRaised;
    setRaisedHands(prev => {
      const next = new Set(prev);
      newRaised ? next.add(userEmail) : next.delete(userEmail);
      return next;
    });
    if (newRaised) toast("✋ Você levantou a mão", { duration: 2000 });
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: "hand_raise", raised: newRaised, identity: userEmail })),
      { reliable: true }
    );
  }, [room, localHandRaised, userEmail]);

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
    if (iAmPresenting) {
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify({ type: "presentation_control", action: "stop", presenterEmail: userEmail })),
        { reliable: true }
      );
    }
    try {
      await apiFetch(`/meetings/${roomName}/leave`, {
        method: "POST",
        body: JSON.stringify({ identity: userEmail }),
      });
    } catch { }
  }, [roomName, userEmail, iAmPresenting, room]);

  useEffect(() => {
    const fn = () => {
      navigator.sendBeacon(
        `${window.location.origin}/api/meetings/${roomName}/leave`,
        new Blob([JSON.stringify({ identity: userEmail })], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [roomName, userEmail]);

  const handleLeave = async () => { await registerLeave(); onLeave(); };

  const sideOpen = showChat || showParticipants;

  const getGridStyle = (count: number): React.CSSProperties => {
    if (mobile) return { gridTemplateColumns: "1fr", gridAutoRows: `${Math.floor(100 / Math.max(count, 1))}%` };
    const cols = count <= 1 ? 1 : count === 2 ? 2 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    return { gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: "1fr" };
  };

  const showRemoteSlides = slideActive && !iAmPresenting;

  return (
    <div className="flex flex-col h-full select-none bg-[#0d1117]">

      {iAmPresenting && (
        <SlidePresentation
          room={room}
          currentUserEmail={userEmail}
          onClose={() => setIAmPresenting(false)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0 p-2 gap-2">

          {showRemoteSlides ? (
            <div className="flex-1 flex flex-col sm:flex-row gap-2 min-h-0">
              <div className="flex-1 min-h-0 min-w-0">
                <SlideTile slideDataUrl={slideDataUrl} presenterName={presenterName} />
              </div>
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto pb-1 sm:pb-0 flex-shrink-0">
                {participants.map(p => (
                  <ParticipantTile key={p.identity} participant={p}
                    profilePicture={profilePictures[p.identity]} compact
                    handRaised={raisedHands.has(p.identity)}
                    isSpeaking={activeSpeakers.has(p.identity)} />
                ))}
              </div>
            </div>

          ) : screenSharer ? (
            <div className="flex-1 flex flex-col sm:flex-row gap-2 min-h-0">
              <div className="flex-1 min-h-0 min-w-0">
                <ScreenShareTile participant={screenSharer} />
              </div>
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto pb-1 sm:pb-0 flex-shrink-0">
                {participants.map(p => (
                  <ParticipantTile key={p.identity} participant={p}
                    profilePicture={profilePictures[p.identity]} compact
                    handRaised={raisedHands.has(p.identity)}
                    isSpeaking={activeSpeakers.has(p.identity)} />
                ))}
              </div>
            </div>

          ) : (
            <div className="flex-1 grid gap-2 min-h-0" style={getGridStyle(participants.length)}>
              {participants.map(p => (
                <ParticipantTile key={p.identity} participant={p}
                  profilePicture={profilePictures[p.identity]}
                  handRaised={raisedHands.has(p.identity)}
                  isSpeaking={activeSpeakers.has(p.identity)} />
              ))}
            </div>
          )}
        </div>

        {sideOpen && (
          <>
            {mobile && (
              <div className="fixed inset-0 z-30 bg-black/60"
                onClick={() => { setShowChat(false); setShowParticipants(false); }} />
            )}
            <div className={`bg-[#111827] flex flex-col overflow-hidden ${mobile ? "fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl" : "w-80 flex-shrink-0 border-l border-white/5"
              }`} style={mobile ? { height: "62vh" } : { height: "100%" }}>
              {showChat && (
                <ChatPanel room={room} messages={chatMessages} onSend={handleSendChat} onClose={() => setShowChat(false)} />
              )}
              {showParticipants && !showChat && (
                <ParticipantsPanel participants={participants} onClose={() => setShowParticipants(false)}
                  profilePictures={profilePictures} raisedHands={raisedHands} />
              )}
            </div>
          </>
        )}
      </div>

      <ControlsBar
        room={room}
        onLeave={handleLeave}
        onToggleChat={() => { setShowChat(v => !v); setShowParticipants(false); }}
        showChat={showChat}
        onToggleParticipants={() => { setShowParticipants(v => !v); setShowChat(false); }}
        showParticipants={showParticipants}
        onTogglePresentation={() => setIAmPresenting(v => !v)}
        showPresentation={iAmPresenting}
        participantCount={participants.length}
        reactions={reactions}
        onReaction={handleReaction}
        raisedHands={raisedHands}
        localHandRaised={localHandRaised}
        onToggleHand={handleToggleHand}
        isMobile={mobile}
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [shouldConnect, setShouldConnect] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      } catch (err: any) {
        if (err.name === "NotAllowedError") toast.error("Permissão de microfone negada.");
      } finally {
        setShouldConnect(true);
      }
    };
    if (roomName && user) init();
  }, [roomName, user]);

  useEffect(() => {
    if (!shouldConnect) return;
    (async () => {
      try {
        setIsLoading(true);
        if (!roomName || !user?.email) throw new Error("Dados inválidos");
        const response = await apiFetch(`/meetings/${roomName}/join`, {
          method: "POST",
          body: JSON.stringify({
            identity: user.email,
            name: user.name || user.email.split("@")[0],
            metadata: JSON.stringify({ profilePicture: user.profilePicture || "" }),
          }),
        });
        const data = await response.json();
        setToken(data.token);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [shouldConnect, user, roomName]);

  if (isLoading || !shouldConnect) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">
            {!shouldConnect ? "Verificando permissões..." : "Entrando na reunião..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0d1117] gap-4">
      <p className="text-red-400 text-lg">❌ {error}</p>
      <Button onClick={() => navigate("/meetings")} variant="outline">Voltar para reuniões</Button>
    </div>
  );

  if (!token) return (
    <div className="flex items-center justify-center h-screen bg-[#0d1117]">
      <p className="text-white/40">Aguardando token...</p>
    </div>
  );

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0d1117]">
      <LiveKitRoom
        serverUrl={`${window.location.origin}/livekit`}
        // serverUrl={import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7880"}
        token={token}
        connect={true}
        audio={false}
        video={false}
        onConnected={() => toast.success("Conectado à reunião!")}
        onDisconnected={() => { toast.warning("Você saiu da reunião"); navigate("/meetings"); }}
        onError={err => toast.error("Erro: " + err.message)}
        className="h-full"
      >
        <MeetingContent
          showChat={false}
          roomName={roomName!}
          userEmail={user?.email || ""}
          currentUser={user as UserData}
          onLeave={() => navigate("/meetings")}
        />
      </LiveKitRoom>
    </div>
  );
}