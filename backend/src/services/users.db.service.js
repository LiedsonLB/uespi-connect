// backend/src/services/users.db.service.js
const { pool } = require('../lib/database');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

class UsersDBService {
  async createUser(userData) {
    const id = uuid().replace(/-/g, '').slice(0, 10);
    const { username, password, role, channel } = userData;
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const finalRole = role || this.determineRole(username);
    const finalChannel = channel || null;
    
    const query = `
      INSERT INTO users (id, username, password_hash, role, channel, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, role, channel, active, created_at
    `;
    
    const values = [id, username, passwordHash, finalRole, finalChannel, true];
    
    try {
      const result = await pool.query(query, values);
      console.log('✅ Usuário criado:', username, 'Role:', finalRole);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return null;
    }
  }

  determineRole(username) {
    if (username.includes('@aluno.uespi.br')) return 'aluno';
    if (username.includes('@uespi.br')) return 'professor';
    if (username.includes('@prp.uespi.br')) return 'professor';
    if (username.includes('@gmail.com')) return 'admin';
    return 'user';
  }

  async findUserByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error.message);
      return null;
    }
  }

  async getUsers() {
    const query = 'SELECT id, username, role, channel, active, created_at FROM users ORDER BY created_at DESC';
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return [];
    }
  }
}

module.exports = new UsersDBService();