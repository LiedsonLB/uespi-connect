// backend/src/lib/database.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'uespi_connect',
  user: process.env.DB_USER || 'uespi_user',
  password: process.env.DB_PASSWORD || 'uespi123',
});

// Criar tabelas
const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        channel VARCHAR(50),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela de reuniões
    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_by VARCHAR(100),
        participants INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP
      )
    `);
    
    // Tabela de participantes em reuniões (histórico)
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id SERIAL PRIMARY KEY,
        meeting_id VARCHAR(50) REFERENCES meetings(id) ON DELETE CASCADE,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        duration INTEGER
      )
    `);
    
    // Tabela de canais (se existir)
    await client.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255),
        guest_key VARCHAR(100),
        active BOOLEAN DEFAULT true,
        mode VARCHAR(10) DEFAULT 'av',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Banco de dados inicializado');
    
    // Inserir usuário admin padrão se não existir
    const bcrypt = require('bcryptjs');
    const adminExists = await client.query('SELECT * FROM users WHERE username = $1', ['admin@uespi.br']);
    
    if (adminExists.rows.length === 0) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (id, username, password_hash, role, active) VALUES ($1, $2, $3, $4, $5)',
        ['admin1', 'admin@uespi.br', passwordHash, 'admin', true]
      );
      console.log('✅ Usuário admin criado');
    }
    
    // =============================================
    // MIGRAR USUÁRIOS DO JSON PARA O POSTGRESQL
    // =============================================
    console.log('📦 Verificando migração de usuários do JSON...');
    
    try {
      const dataService = require('../services/data.service');
      const jsonUsers = dataService.getUsers();
      const usersService = require('../services/users.db.service');
      
      let migratedCount = 0;
      
      for (const user of jsonUsers) {
        const existing = await usersService.findUserByUsername(user.username);
        if (!existing) {
          await usersService.createUser({
            username: user.username,
            password: user.password || 'migrated123',
            role: user.role,
            channel: user.channel
          });
          console.log(`📦 Usuário migrado: ${user.username} (${user.role})`);
          migratedCount++;
        }
      }
      
      if (migratedCount > 0) {
        console.log(`✅ Migração concluída! ${migratedCount} usuários migrados.`);
      } else {
        console.log('✅ Nenhum usuário novo para migrar.');
      }
      
    } catch (error) {
      console.error('❌ Erro na migração de usuários:', error.message);
      console.log('⚠️ Continuando sem migração...');
    }
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
  } finally {
    client.release();
  }
};

initDatabase();

module.exports = { pool };