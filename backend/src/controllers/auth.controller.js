// backend/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const usersService = require('../services/users.db.service');

class AuthController {
  async login(req, res) {
    const { username, password } = req.body;
    
    console.log('📝 Tentativa de login:', { username });
    
    try {
      // Buscar usuário no PostgreSQL
      let user = await usersService.findUserByUsername(username);
      
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
        user = await usersService.createUser({
          username: username,
          password: password,
          role: role,
          channel: null
        });
        
        if (!user) {
          console.log('❌ Erro ao criar usuário:', username);
          return res.status(500).json({ 
            error: 'Erro ao criar usuário' 
          });
        }
        
        console.log('✅ Usuário criado automaticamente:', username, 'Role:', role);
      }
      
      // Verificar se usuário está ativo
      if (!user.active) {
        console.log('❌ Usuário inativo:', username);
        return res.status(401).json({ 
          error: 'Usuário inativo' 
        });
      }
      
      // Verificar senha
      if (!bcrypt.compareSync(password, user.password_hash)) {
        console.log('❌ Senha inválida para:', username);
        return res.status(401).json({ 
          error: 'Credenciais inválidas' 
        });
      }
      
      // Criar sessão
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
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
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

  async dashboard(req, res) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.json({ user: req.session.user });
  }
}

module.exports = new AuthController();