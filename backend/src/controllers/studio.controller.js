const path = require('path');
const fs = require('fs');
const dataService = require('../services/data.service');
const { renderPage, esc, nav, modeLabel, getChannelRecordings } = require('../utils/render');
const config = require('../config');

class StudioController {
  async studioPage(req, res) {
    const user = req.session.user;
    const channel = req.channel;
    
    const guestLink = `https://${config.DOMAIN}/guest/${channel.name}/${channel.guestKey}`;
    const recordings = getChannelRecordings(channel.name).slice(0, 20);
    
    res.send(renderPage(`Estúdio ${channel.name}`, `
      ${nav(user)}
      <div class="wrap grid">
        <div class="grid-main">
          <div class="host-area">
            <div class="card">
              <div class="section-title">
                <h2 style="margin:0">Host / Estúdio</h2>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <span class="badge">${esc(channel.title)}</span>
                  <span class="badge">${modeLabel(channel.mode)}</span>
                </div>
              </div>
              
              <p>Controle o seu canal, escolha a câmera, acompanhe o nível de áudio e convide participantes.</p>
              
              <div class="copybox">
                <input readonly value="${esc(guestLink)}" id="guestLink">
                <button class="btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('guestLink').value)">Copiar link</button>
              </div>
              
              <div class="spacer"></div>
              
              <div class="grid">
                ${channel.mode !== 'audio' ? `
                <select id="cameraSelect">
                  <option value="">Selecionar câmera</option>
                </select>` : ''}
                ${channel.mode !== 'video' ? `
                <div>
                  <div class="small">Nível do microfone</div>
                  <div class="vu"><span id="vuFill"></span></div>
                </div>` : ''}
              </div>
              
              <div class="spacer"></div>
              
              <div class="toolbar">
                <button id="joinBtn">Entrar no estúdio</button>
                ${channel.mode !== 'audio' ? `<button id="flipBtn" class="btn-secondary">Virar câmera</button>` : ''}
                <button id="leaveBtn" class="btn-secondary">Sair</button>
                ${channel.mode !== 'video' ? `<button id="muteAudio" class="btn-secondary">Mute áudio</button>` : ''}
                ${channel.mode !== 'audio' ? `<button id="muteVideo" class="btn-secondary">Desligar vídeo</button>` : ''}
                ${channel.mode !== 'audio' ? `<button id="mirrorBtn" class="btn-secondary">Espelhar preview</button>` : ''}
                <button id="fullscreenBtn" class="btn-warn">Fullscreen</button>
                <button id="startRec" class="btn-ok">Iniciar gravação</button>
                <button id="stopRec" class="btn-danger">Parar gravação</button>
              </div>
              
              <div class="spacer"></div>
              <div id="status" class="notice">Pronto para entrar.</div>
            </div>
            
            <div class="card">
              <h2>Host ao vivo</h2>
              <div class="video-card" id="hostCard">
                ${channel.mode === 'audio'
                  ? `<div style="display:grid;place-items:center;height:260px;background:linear-gradient(180deg,#0d1630,#0a1123)">
                       <div style="text-align:center">
                         <img src="/public/logo-gltec.png" style="max-width:180px;width:70%;height:auto;opacity:.95">
                         <div style="margin-top:12px;font-weight:700">Canal em modo só áudio</div>
                       </div>
                     </div>`
                  : `<video id="localVideo" autoplay muted playsinline></video>`}
                <div class="video-badges">
                  <span class="vbadge">HOST</span>
                  <span class="vbadge">${modeLabel(channel.mode)}</span>
                </div>
                <div class="label">${esc(user.username)}</div>
              </div>
            </div>
          </div>
          
          <div class="guest-area">
            <div class="card">
              <h2>Participantes ao vivo</h2>
              <p>Convidados conectados ao canal em tempo real.</p>
              <div class="videos" id="videos"></div>
            </div>
            
            <div class="card">
              <h2>Gravações</h2>
              ${recordings.length ? `<ul>${recordings.map(r => `<li><a target="_blank" href="${r.url}">${esc(r.file)}</a></li>`).join('')}</ul>` : '<p>Nenhuma gravação ainda.</p>'}
            </div>
          </div>
        </div>
      </div>
      
      ${this.getStudioScript(channel)}
    `));
  }
  
  async guestPage(req, res) {
    const channel = req.channel;
    
    res.send(renderPage(`Convidado ${channel.name}`, `
      <div class="wrap">
        <div class="topbar" style="margin-bottom:18px">
          <div class="brand">
            <img src="/public/logo-gltec.png" alt="GL Tec">
            <div>
              <div class="title">Convidado</div>
              <div class="sub">${esc(channel.title)} · ${esc(channel.name)} · ${modeLabel(channel.mode)}</div>
            </div>
          </div>
        </div>
        
        <div class="grid-main">
          <div class="card">
            <div class="section-title">
              <h1 style="margin:0">Entrar ao vivo</h1>
              <span class="badge">${modeLabel(channel.mode)}</span>
            </div>
            <p>Digite seu nome, escolha a câmera quando houver vídeo e entre na sala.</p>
            
            <div class="grid">
              <input id="guestName" placeholder="Seu nome">
              ${channel.mode !== 'audio' ? `
              <select id="cameraSelect">
                <option value="">Selecionar câmera</option>
              </select>` : ''}
              ${channel.mode !== 'video' ? `
              <div>
                <div class="small">Nível do microfone</div>
                <div class="vu"><span id="vuFill"></span></div>
              </div>` : ''}
            </div>
            
            <div class="spacer"></div>
            
            <div class="toolbar">
              <button id="joinBtn">Entrar agora</button>
              ${channel.mode !== 'audio' ? `<button id="flipBtn" class="btn-secondary">Virar câmera</button>` : ''}
              <button id="leaveBtn" class="btn-secondary">Sair</button>
              ${channel.mode !== 'audio' ? `<button id="mirrorBtn" class="btn-secondary">Espelhar preview</button>` : ''}
            </div>
            
            <div class="spacer"></div>
            <div id="status" class="notice">Aguardando entrada.</div>
          </div>
          
          <div class="card">
            <h2>Seu preview</h2>
            <div class="video-card" id="guestLocalCard">
              ${channel.mode === 'audio'
                ? `<div style="display:grid;place-items:center;height:260px;background:linear-gradient(180deg,#0d1630,#0a1123)">
                     <div style="text-align:center">
                       <img src="/public/logo-gltec.png" style="max-width:180px;width:70%;height:auto;opacity:.95">
                       <div style="margin-top:12px;font-weight:700">Convidado em modo só áudio</div>
                     </div>
                   </div>`
                : `<video id="localVideo" autoplay muted playsinline></video>`}
              <div class="video-badges">
                <span class="vbadge">CONVIDADO</span>
                <span class="vbadge">${modeLabel(channel.mode)}</span>
              </div>
              <div class="label">Você</div>
            </div>
          </div>
        </div>
        
        <div class="card" style="margin-top:18px">
          <h2>Participantes ao vivo</h2>
          <div class="videos" id="videos"></div>
        </div>
      </div>
      
      ${this.getGuestScript(channel)}
    `));
  }
  
  async uploadRecording(req, res) {
    const channel = req.params.channel;
    const user = req.session.user;
    
    if (!dataService.canAccessChannel(user, channel)) {
      return res.status(403).json({ message: 'Sem acesso' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo ausente' });
    }
    
    const dir = path.join(config.RECORDINGS_DIR, channel);
    fs.mkdirSync(dir, { recursive: true });
    
    const channelData = dataService.findChannelByName(channel);
    const ext = channelData && channelData.mode === 'audio' ? 'webm' : 'webm';
    const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${user.username}.${ext}`;
    const finalPath = path.join(dir, filename);
    
    fs.renameSync(req.file.path, finalPath);
    
    res.json({ message: 'Gravação salva com sucesso', file: filename });
  }
  
  getStudioScript(channel) {
    const config = require('../config');
    return `
      <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/simple-peer@9.11.1/simplepeer.min.js"></script>
      <script>
        const ROOM = ${JSON.stringify(channel.name)};
        const NAME = ${JSON.stringify(req.session.user.username)};
        const CHANNEL_MODE = ${JSON.stringify(channel.mode)};
        const ICE = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:${config.DOMAIN}:3478', username: ${JSON.stringify(config.TURN_USER)}, credential: ${JSON.stringify(config.TURN_PASS)} }
        ];
        
        // ... resto do script (mesmo código do original)
      </script>
    `;
  }
  
  getGuestScript(channel) {
    const config = require('../config');
    return `
      <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/simple-peer@9.11.1/simplepeer.min.js"></script>
      <script>
        const ROOM = ${JSON.stringify(channel.name)};
        const CHANNEL_MODE = ${JSON.stringify(channel.mode)};
        const ICE = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:${config.DOMAIN}:3478', username: ${JSON.stringify(config.TURN_USER)}, credential: ${JSON.stringify(config.TURN_PASS)} }
        ];
        
        // ... resto do script (mesmo código do original)
      </script>
    `;
  }
}

module.exports = new StudioController();