// backend/src/controllers/meetings.controller.js
const { AccessToken } = require('livekit-server-sdk');
const meetingsService = require('../services/meetings.db.service');

exports.createMeeting = async (req, res) => {
  try {
    const { title } = req.body;
    const createdBy = req.session?.user?.username || 'unknown';
    
    const meeting = await meetingsService.createMeeting({ title, createdBy });
    
    console.log('✅ Sala criada no banco:', meeting.id);
    res.status(201).json(meeting);
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao criar reunião' });
  }
};

exports.listMeetings = async (req, res) => {
  try {
    const meetings = await meetingsService.getMeetings();
    res.json(meetings);
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao listar reuniões' });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await meetingsService.getMeetingById(id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Reunião não encontrada' });
    }
    
    res.json(meeting);
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar reunião' });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const meeting = await meetingsService.updateMeeting(id, { title });
    
    if (!meeting) {
      return res.status(404).json({ error: 'Reunião não encontrada' });
    }
    
    res.json(meeting);
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar reunião' });
  }
};

exports.joinMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { identity, name } = req.body;
    
    let meeting = await meetingsService.getMeetingById(id);
    
    if (!meeting) {
      meeting = await meetingsService.createMeeting({
        title: `Reunião ${id.substring(0, 8)}`,
        createdBy: 'auto'
      });
    }
    
    await meetingsService.incrementParticipants(id);
    
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity, name: name || identity, ttl: '2h' }
    );
    
    token.addGrant({
      roomJoin: true,
      room: id,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    
    const jwt = await token.toJwt();
    
    res.json({
      token: jwt,
      url: process.env.LIVEKIT_URL,
      room: id,
    });
    
  } catch (err) {
    console.error('❌ Erro:', err);
    res.status(500).json({ error: 'Falha ao entrar na reunião' });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await meetingsService.deleteMeeting(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Reunião não encontrada' });
    }
    
    res.json({ message: 'Reunião deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao deletar reunião' });
  }
};

exports.getMeetingParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await meetingsService.getMeetingById(id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Reunião não encontrada' });
    }
    
    res.json({ count: meeting.participants || 0, roomId: id });
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: 'Erro ao buscar participantes' });
  }
};

exports.leaveMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const { identity } = req.body;
        
        console.log(`👋 Usuário ${identity} saindo da sala ${id}`);
        
        const meeting = meetingsService.getMeetingById(id);
        
        if (!meeting) {
            return res.status(404).json({ error: 'Reunião não encontrada' });
        }
        
        const newCount = Math.max(0, (meeting.participants || 0) - 1);
        await meetingsService.updateMeeting(id, { participants: newCount });
        
        console.log(`📊 Participantes restantes na sala ${id}: ${newCount}`);
        
        res.json({ 
            success: true, 
            participants: newCount 
        });
        
    } catch (err) {
        console.error('❌ Erro ao sair da reunião:', err);
        res.status(500).json({ error: 'Falha ao sair da reunião' });
    }
};