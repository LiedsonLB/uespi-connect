// backend/src/services/meetings.service.js
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const config = require('../config');

// Arquivo para persistir reuniões
const MEETINGS_FILE = path.join(__dirname, '../../data/meetings.json');

// Garantir que o diretório data existe
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class MeetingsService {
  constructor() {
    this.initMeetings();
  }

  initMeetings() {
    if (!fs.existsSync(MEETINGS_FILE)) {
      fs.writeFileSync(MEETINGS_FILE, JSON.stringify([], null, 2));
    }
  }

  getMeetings() {
    try {
      const data = fs.readFileSync(MEETINGS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler reuniões:', error);
      return [];
    }
  }

  saveMeetings(meetings) {
    try {
      fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2));
      return true;
    } catch (error) {
      console.error('Erro ao salvar reuniões:', error);
      return false;
    }
  }

  createMeeting(meetingData) {
    const meetings = this.getMeetings();
    
    const newMeeting = {
      id: uuid(),
      title: meetingData.title || `Reunião ${meetings.length + 1}`,
      createdAt: new Date().toISOString(),
      createdBy: meetingData.createdBy || 'unknown',
      participants: 0,
      status: 'active'
    };
    
    meetings.push(newMeeting);
    this.saveMeetings(meetings);
    
    console.log('✅ Reunião salva em arquivo:', newMeeting.id);
    return newMeeting;
  }

  getMeetingById(id) {
    const meetings = this.getMeetings();
    return meetings.find(m => m.id === id);
  }

  updateMeeting(id, updates) {
    const meetings = this.getMeetings();
    const index = meetings.findIndex(m => m.id === id);
    
    if (index === -1) return null;
    
    meetings[index] = { ...meetings[index], ...updates };
    this.saveMeetings(meetings);
    
    return meetings[index];
  }

  deleteMeeting(id) {
    const meetings = this.getMeetings();
    const filtered = meetings.filter(m => m.id !== id);
    
    if (filtered.length === meetings.length) return false;
    
    this.saveMeetings(filtered);
    return true;
  }

  incrementParticipants(id) {
    const meetings = this.getMeetings();
    const meeting = meetings.find(m => m.id === id);
    
    if (meeting) {
      meeting.participants = (meeting.participants || 0) + 1;
      this.saveMeetings(meetings);
      return meeting.participants;
    }
    return 0;
  }

  decrementParticipants(id) {
    const meetings = this.getMeetings();
    const meeting = meetings.find(m => m.id === id);
    
    if (meeting && meeting.participants > 0) {
      meeting.participants = meeting.participants - 1;
      this.saveMeetings(meetings);
      return meeting.participants;
    }
    return 0;
  }
}

module.exports = new MeetingsService();