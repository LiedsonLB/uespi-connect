// backend/src/services/meetings.db.service.js
const { pool } = require('../lib/database');
const { v4: uuid } = require('uuid');

class MeetingsDBService {
  async createMeeting(meetingData) {
    const id = uuid();
    const { title, createdBy } = meetingData;
    
    const query = `
      INSERT INTO meetings (id, title, created_by, participants, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [id, title || `Reunião`, createdBy || 'unknown', 0, 'active'];
    
    try {
      const result = await pool.query(query, values);
      console.log('✅ Reunião criada no banco:', id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao criar reunião:', error);
      throw error;
    }
  }
  
  async getMeetings() {
    const query = `
      SELECT * FROM meetings 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar reuniões:', error);
      return [];
    }
  }
  
  async getMeetingById(id) {
    const query = 'SELECT * FROM meetings WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar reunião:', error);
      return null;
    }
  }
  
  async updateMeeting(id, updates) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.title) {
      fields.push(`title = $${index++}`);
      values.push(updates.title);
    }
    
    if (updates.status) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    
    if (updates.participants !== undefined) {
      fields.push(`participants = $${index++}`);
      values.push(updates.participants);
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    values.push(id);
    
    const query = `UPDATE meetings SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao atualizar reunião:', error);
      return null;
    }
  }
  
  async deleteMeeting(id) {
    const query = 'DELETE FROM meetings WHERE id = $1 RETURNING id';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Erro ao deletar reunião:', error);
      return false;
    }
  }
  
  async incrementParticipants(id) {
    const query = `
      UPDATE meetings 
      SET participants = participants + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING participants
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0]?.participants || 0;
    } catch (error) {
      console.error('❌ Erro ao incrementar participantes:', error);
      return 0;
    }
  }
  
  async addParticipantHistory(meetingId, userId) {
    const query = `
      INSERT INTO meeting_participants (meeting_id, user_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [meetingId, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao adicionar histórico:', error);
      return null;
    }
  }
}

module.exports = new MeetingsDBService();