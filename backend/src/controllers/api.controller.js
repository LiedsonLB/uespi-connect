// backend/src/controllers/api.controller.js
const bcrypt = require('bcryptjs');
const usersService = require('../services/users.db.service');
const dataService = require('../services/data.service');

class ApiController {
  async health(req, res) {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  async login(req, res) {
    const { username, password } = req.body;
    
    console.log('📝 Tentativa de login:', { username });
    
    // Buscar usuário no PostgreSQL
    const user = await usersService.findUserByUsername(username);
    
    if (!user || !user.active) {
      console.log('❌ Usuário não encontrado ou inativo:', username);
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        needsCreation: true 
      });
    }
    
    if (!bcrypt.compareSync(password, user.password_hash)) {
      console.log('❌ Senha inválida para:', username);
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }
    
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      channel: user.channel
    };
    
    console.log('✅ Login realizado:', username);
    
    res.json({ 
      success: true, 
      user: req.session.user 
    });
  }

  async logout(req, res) {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  }

  async me(req, res) {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    res.json(req.session.user);
  }

  async channels(req, res) {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const channels = dataService.getActiveChannels();
    
    if (req.session.user.role === 'admin') {
      res.json(channels);
    } else {
      const userChannels = channels.filter(c => c.name === req.session.user.channel);
      res.json(userChannels);
    }
  }

  async channelByName(req, res) {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const { name } = req.params;
    const channel = dataService.findChannelByName(name);
    
    if (!channel) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    if (!dataService.canAccessChannel(req.session.user, channel.name)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const response = { ...channel };
    if (req.session.user.role !== 'admin') {
      delete response.guestKey;
    }
    
    res.json(response);
  }

  async recordings(req, res) {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const { channel } = req.params;
    const fs = require('fs');
    const path = require('path');
    const config = require('../config');
    
    if (!dataService.canAccessChannel(req.session.user, channel)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const dir = path.join(config.RECORDINGS_DIR, channel);
    if (!fs.existsSync(dir)) {
      return res.json([]);
    }
    
    const recordings = fs.readdirSync(dir)
      .sort()
      .reverse()
      .map(file => ({
        name: file,
        url: `/recordings/${channel}/${file}`,
        size: fs.statSync(path.join(dir, file)).size,
        createdAt: fs.statSync(path.join(dir, file)).birthtime
      }));
    
    res.json(recordings);
  }

  async adminUsers(req, res) {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const users = await usersService.getUsers();
    res.json(users);
  }

  async adminCreateUser(req, res) {
    const { username, password, role, channel } = req.body;
    
    console.log('📝 Criando usuário via API:', { username, role, channel });
    
    // Verificar se usuário já existe no PostgreSQL
    const existingUser = await usersService.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    // Determinar role baseada no email se não for fornecida
    let finalRole = role;
    if (!finalRole) {
      if (username.includes('@aluno.uespi.br')) finalRole = 'aluno';
      else if (username.includes('@uespi.br')) finalRole = 'professor';
      else if (username.includes('@prp.uespi.br')) finalRole = 'professor';
      else finalRole = 'admin';
    }
    
    // Determinar channel baseado na role
    let finalChannel = channel;
    if (finalRole !== 'admin' && !finalChannel) {
      finalChannel = null;
    }
    
    const newUser = await usersService.createUser({
      username,
      password,
      role: finalRole,
      channel: finalChannel
    });
    
    if (!newUser) {
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
    
    console.log('✅ Usuário criado:', username, 'com role:', finalRole);
    
    res.status(201).json(newUser);
  }

  async adminChannels(req, res) {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const channels = dataService.getChannels();
    res.json(channels);
  }

  async resetGuestKey(req, res) {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { channel } = req.params;
    const result = dataService.resetGuestKey(channel);
    
    if (!result) {
      return res.status(404).json({ error: 'Canal não encontrado' });
    }
    
    res.json({ success: true, guestKey: result.guestKey });
  }
}

module.exports = new ApiController();