// components/NetworkDiagnostic.tsx
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function NetworkDiagnostic() {
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    rtcCapable: false,
    publicIp: null,
    latency: null,
  });

  const checkWebRTC = async () => {
    try {
      // Verificar se WebRTC é suportado
      const pc = new RTCPeerConnection();
      const hasWebRTC = !!pc;
      pc.close();
      
      // Verificar se consegue obter IP público
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      
      setNetworkStatus(prev => ({
        ...prev,
        rtcCapable: hasWebRTC,
        publicIp: data.ip,
      }));
    } catch (error) {
      console.error('WebRTC check failed:', error);
    }
  };

  const checkLatency = async () => {
    const start = Date.now();
    try {
      await fetch('/api/ping');
      const latency = Date.now() - start;
      setNetworkStatus(prev => ({ ...prev, latency }));
    } catch (error) {
      console.error('Latency check failed:', error);
    }
  };

  useEffect(() => {
    checkWebRTC();
    checkLatency();
    
    const handleOnline = () => setNetworkStatus(prev => ({ ...prev, online: true }));
    const handleOffline = () => setNetworkStatus(prev => ({ ...prev, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (networkStatus.online && networkStatus.rtcCapable && networkStatus.latency && networkStatus.latency < 200) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-yellow-50 border-yellow-200 z-50 max-w-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-yellow-800">Problemas de Conexão Detectados</h4>
          <div className="text-xs text-yellow-700 mt-1 space-y-1">
            {!networkStatus.online && <p>❌ Sem conexão com a internet</p>}
            {!networkStatus.rtcCapable && <p>❌ WebRTC não suportado neste navegador</p>}
            {networkStatus.latency && networkStatus.latency > 200 && 
              <p>⚠️ Alta latência: {networkStatus.latency}ms</p>
            }
            <p className="mt-2">Tente:</p>
            <ul className="list-disc list-inside ml-2">
              <li>Usar uma rede diferente</li>
              <li>Desativar VPN/Proxy</li>
              <li>Usar Chrome ou Firefox</li>
              <li>Verificar firewall</li>
            </ul>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2 w-full"
            onClick={() => window.location.reload()}
          >
            Recarregar Página
          </Button>
        </div>
      </div>
    </Card>
  );
}