const { pool } = require('../lib/database');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

class UsersDBService {
  async createUser(userData) {
    const id = uuid().replace(/-/g, '').slice(0, 10);
    const { username, name, profile_picture, password, role, channel } = userData;
    const passwordHash = bcrypt.hashSync(password, 10);

    const finalRole = role || this.determineRole(username);
    const finalChannel = channel || null;
    const finalName = name || username.split('@')[0];

    const query = `
      INSERT INTO users (id, username, name, profile_picture, password_hash, role, channel, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, name, profile_picture, role, channel, active, created_at
    `;

    const values = [id, username, finalName, profile_picture || null, passwordHash, finalRole, finalChannel, true];

    try {
      const result = await pool.query(query, values);
      console.log('✅ Usuário criado:', username, 'Role:', finalRole);
      return result.rows[0];
    } catch (error) {
      console.error('❌ ERRO SQL COMPLETO:', error);
      throw error;
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
    const query = `
    SELECT id, username, name, profile_picture,
          password_hash,
          role, channel, active, created_at
    FROM users
    WHERE username = $1
    `;

    try {
      const result = await pool.query(query, [username]);
      const user = result.rows[0];

      if (user) {
        // Garantir que os campos existam
        user.name = user.name || user.username.split('@')[0];
      }

      return user || null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error.message);
      return null;
    }
  }

  async updateUserProfile(username, userData) {
    const { name, profile_picture } = userData;
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name),
          profile_picture = COALESCE($2, profile_picture),
          updated_at = CURRENT_TIMESTAMP
      WHERE username = $3
      RETURNING id, username, name, profile_picture, role
    `;

    try {
      const result = await pool.query(query, [name, profile_picture, username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error.message);
      return null;
    }
  }

  async getUsers() {
    const query = 'SELECT id, username, name, profile_picture, role, channel, active, created_at FROM users ORDER BY created_at DESC';

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