import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";

type Status = {
  online: boolean;
  webrtc: "unknown" | "ok" | "failed";
  ice: "checking" | "connected" | "failed";
  latency: number | null;
};

export function NetworkDiagnostic() {
  const [status, setStatus] = useState<Status>({
    online: navigator.onLine,
    webrtc: "unknown",
    ice: "checking",
    latency: null,
  });

  const checkLatency = async () => {
    const start = Date.now();
    try {
      await fetch("/api/ping");
      setStatus((s) => ({ ...s, latency: Date.now() - start }));
    } catch {
      setStatus((s) => ({ ...s, latency: null }));
    }
  };

  const checkWebRTC = async () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      let iceComplete = false;

      pc.createDataChannel("test");

      const timeout = setTimeout(() => {
        if (!iceComplete) {
          setStatus((s) => ({
            ...s,
            webrtc: "failed",
            ice: "failed",
          }));
          pc.close();
        }
      }, 5000);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          setStatus((s) => ({
            ...s,
            webrtc: "ok",
          }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;

        if (state === "connected" || state === "completed") {
          iceComplete = true;
          clearTimeout(timeout);

          setStatus((s) => ({
            ...s,
            ice: "connected",
            webrtc: "ok",
          }));

          pc.close();
        }

        if (state === "failed") {
          iceComplete = true;
          clearTimeout(timeout);

          setStatus((s) => ({
            ...s,
            ice: "failed",
            webrtc: "failed",
          }));

          pc.close();
        }
      };

      await pc.createOffer().then((offer) => pc.setLocalDescription(offer));
    } catch (err) {
      setStatus((s) => ({
        ...s,
        webrtc: "failed",
        ice: "failed",
      }));
    }
  };

  useEffect(() => {
    checkWebRTC();
    checkLatency();

    const onOnline = () =>
      setStatus((s) => ({ ...s, online: true }));

    const onOffline = () =>
      setStatus((s) => ({ ...s, online: false }));

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const healthy =
    status.online &&
    status.webrtc === "ok" &&
    status.ice === "connected" &&
    (status.latency ?? 0) < 200;

  if (healthy) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-yellow-50 border-yellow-200 max-w-sm z-50">
      <div className="flex gap-2">
        <AlertCircle className="text-yellow-600" />
        <div className="text-sm">
          <p className="font-semibold">Conexão instável</p>

          <ul className="text-xs mt-2 space-y-1">
            {!status.online && <li>❌ Offline</li>}
            {status.webrtc === "failed" && <li>❌ WebRTC falhou</li>}
            {status.ice === "failed" && <li>❌ ICE não conectou</li>}
            {status.latency && status.latency > 200 && (
              <li>⚠️ Latência alta: {status.latency}ms</li>
            )}
          </ul>

          <Button
            className="mt-2 w-full"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retestar
          </Button>
        </div>
      </div>
    </Card>
  );
}