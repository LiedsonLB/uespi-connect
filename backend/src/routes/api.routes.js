// backend/src/routes/api.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const dataService = require('../services/data.service');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.get('/check-cookie', (req, res) => {
  res.json({
    cookies: req.headers.cookie,
    sessionId: req.sessionID,
    sessionUser: req.session.user,
    headers: req.headers
  });
});

// Login COM CRIAÇÃO AUTOMÁTICA
router.post('/login', (req, res) => {
  console.log('🔐 Tentativa de login:', req.body.username);

  const { username, password } = req.body;
  let users = dataService.getUsers();
  let user = users.find(u => u.username === username);

  // Se usuário não existe, criar automaticamente
  if (!user) {
    console.log('📝 Usuário não encontrado, criando automaticamente...');

    // Determinar role baseada no email
    let role = 'user';
    if (username.includes('@aluno.uespi.br')) role = 'aluno';
    else if (username.includes('@uespi.br')) role = 'professor';
    else if (username.includes('@prp.uespi.br')) role = 'professor';
    else if (username.includes('@gmail.com')) role = 'admin';

    // Criar o usuário
    user = dataService.createUser({
      username: username,
      password: password,
      role: role,
      channel: null
    });

    if (!user) {
      console.log('❌ Erro ao criar usuário:', username);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    console.log('✅ Usuário criado automaticamente:', username, 'Role:', role);
    // Recarregar usuários
    users = dataService.getUsers();
    user = users.find(u => u.username === username);
  }

  if (!user || !user.active || !bcrypt.compareSync(password, user.passwordHash)) {
    console.log('❌ Login falhou para:', username);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
    channel: user.channel
  };

  // Salvar sessão explicitamente
  req.session.save((err) => {
    if (err) {
      console.error('Erro ao salvar sessão:', err);
      return res.status(500).json({ error: 'Erro ao criar sessão' });
    }

    console.log('✅ Login realizado:', username);
    console.log('📝 Sessão ID:', req.sessionID);
    console.log('👤 Usuário na sessão:', req.session.user);

    res.json({
      success: true,
      user: req.session.user
    });
  });
});

// Usuário atual (para debug)
router.get('/debug-session', (req, res) => {
  console.log('🔍 Debug sessão:');
  console.log('Session ID:', req.sessionID);
  console.log('Session:', req.session);
  console.log('User:', req.session.user);

  res.json({
    sessionId: req.sessionID,
    session: req.session,
    user: req.session.user,
    cookies: req.headers.cookie
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Usuário atual
router.get('/me', (req, res) => {
  console.log('🔍 /me - Session ID:', req.sessionID);
  console.log('🔍 /me - User:', req.session.user);

  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json(req.session.user);
});

router.get('/users/by-email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await usersService.findUserByUsername(email);
    if (user) {
      res.json({
        profilePicture: user.profile_picture,
        name: user.name,
        email: user.username
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Listar canais
router.get('/channels', (req, res) => {
  console.log('🔍 /channels - Session ID:', req.sessionID);
  console.log('🔍 /channels - User:', req.session.user);

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
});

// Admin - Listar usuários
router.get('/admin/users', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const users = dataService.getUsers();
  res.json(users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    channel: u.channel,
    active: u.active
  })));
});

// Admin - Criar usuário
router.post('/admin/users', (req, res) => {
  console.log('🔐 Criar usuário:', req.body);

  const { username, password, role, channel } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  const newUser = dataService.createUser({
    username,
    password,
    role: role || 'user',
    channel: channel || null
  });

  if (!newUser) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  res.json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    }
  });
});

module.exports = router;