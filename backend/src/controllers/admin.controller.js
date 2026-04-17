const dataService = require('../services/data.service');
const { renderPage, esc, nav, modeLabel } = require('../utils/render');

class AdminController {
  async adminPage(req, res) {
    const users = dataService.getUsers();
    const channels = dataService.getChannels();
    
    const rowsUsers = users.map(u => `
      <tr>
        <td>${esc(u.username)}</td>
        <td>${esc(u.role)}</td>
        <td>${u.channel ? esc(u.channel) : '-'}</td>
        <td>${u.active ? '<span class="badge">Ativo</span>' : '<span class="badge">Inativo</span>'}</td>
        <td>
          <form method="post" action="/admin/toggle-user/${encodeURIComponent(u.id)}">
            <button class="${u.active ? 'btn-danger' : 'btn-ok'}" type="submit">${u.active ? 'Desativar' : 'Ativar'}</button>
          </form>
        </td>
       </tr>`).join('');
    
    const rowsChannels = channels.map(c => `
      <tr>
        <td>${esc(c.name)}</td>
        <td>${esc(c.title)}</td>
        <td>${modeLabel(c.mode)}</td>
        <td>${c.active ? '<span class="badge">Ativo</span>' : '<span class="badge">Inativo</span>'}</td>
        <td><a href="/studio/${encodeURIComponent(c.name)}">Abrir estúdio</a></td>
        <td>
          <form method="post" action="/admin/reset-guest/${encodeURIComponent(c.name)}">
            <button type="submit" class="btn-secondary">Novo link</button>
          </form>
        </td>
       </tr>`).join('');
    
    res.send(renderPage('Admin', `
      ${nav(req.session.user)}
      <div class="wrap grid">
        <div class="grid grid-2">
          <div class="card">
            <h2>Criar canal</h2>
            <form class="grid" method="post" action="/admin/create-channel">
              <input name="name" placeholder="Ex.: tv3" required>
              <input name="title" placeholder="Ex.: TV 3" required>
              <select name="mode" required>
                <option value="av">Áudio + vídeo</option>
                <option value="audio">Só áudio</option>
                <option value="video">Só vídeo</option>
              </select>
              <button type="submit">Criar canal</button>
            </form>
          </div>
          
          <div class="card">
            <h2>Criar usuário</h2>
            <form class="grid" method="post" action="/admin/create-user">
              <input name="username" placeholder="Usuário" required>
              <input name="password" type="text" placeholder="Senha inicial" required>
              <select name="role" id="roleSelect" onchange="document.getElementById('channelWrap').style.display=this.value==='user'?'block':'none'">
                <option value="user">Usuário do canal</option>
                <option value="admin">Admin</option>
              </select>
              <div id="channelWrap">
                <select name="channel">
                  ${channels.filter(c => c.active).map(c => `<option value="${esc(c.name)}">${esc(c.title)} (${esc(c.name)})</option>`).join('')}
                </select>
              </div>
              <button type="submit">Criar usuário</button>
            </form>
          </div>
        </div>
        
        <div class="card">
          <h2>Usuários</h2>
          <table>
            <thead><tr><th>Usuário</th><th>Perfil</th><th>Canal</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>${rowsUsers}</tbody>
          </table>
        </div>
        
        <div class="card">
          <h2>Canais</h2>
          <table>
            <thead><tr><th>Canal</th><th>Título</th><th>Plano</th><th>Status</th><th>Estúdio</th><th>Convidado</th></tr></thead>
            <tbody>${rowsChannels}</tbody>
          </table>
        </div>
      </div>
    `));
  }
  
  async createChannel(req, res) {
    const { name, title, mode } = req.body;
    const channel = dataService.createChannel({ name, title, mode: mode || 'av' });
    
    if (!channel) {
      return res.send('Canal já existe.');
    }
    
    res.redirect('/admin');
  }
  
  async createUser(req, res) {
    const { username, password, role, channel } = req.body;
    const user = dataService.createUser({
      username,
      password,
      role,
      channel: role === 'user' ? channel : null
    });
    
    if (!user) {
      return res.send('Usuário já existe.');
    }
    
    res.redirect('/admin');
  }
  
  async toggleUser(req, res) {
    dataService.toggleUserActive(req.params.id);
    res.redirect('/admin');
  }
  
  async resetGuestKey(req, res) {
    dataService.resetGuestKey(req.params.channel);
    res.redirect('/admin');
  }
}

module.exports = new AdminController();