const webrtcService = require('../services/webrtc.service');

class RoomController {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('join-room', ({ room, name, role }) => {
        socket.data.room = room;
        socket.data.name = name;
        socket.data.role = role || 'guest';
        
        socket.join(room);
        webrtcService.addMember(room, socket.id, { name, role: socket.data.role });
        
        const existingUsers = webrtcService.getExistingUsers(room);
        socket.emit('existing-users', existingUsers);
        socket.to(room).emit('user-joined', { id: socket.id, name, role: socket.data.role });
      });
      
      socket.on('signal', ({ targetId, data }) => {
        this.io.to(targetId).emit('signal', {
          fromId: socket.id,
          fromName: socket.data.name || 'Participante',
          fromRole: socket.data.role || 'guest',
          data
        });
      });
      
      socket.on('leave-room', () => {
        const room = socket.data.room;
        if (!room) return;
        
        const member = webrtcService.removeMember(room, socket.id);
        if (member) {
          socket.to(room).emit('user-left', { id: socket.id, name: member.name });
        }
        
        socket.leave(room);
        socket.data.room = null;
      });
      
      socket.on('disconnect', () => {
        const room = socket.data.room;
        if (!room) return;
        
        const member = webrtcService.removeMember(room, socket.id);
        if (member) {
          socket.to(room).emit('user-left', { id: socket.id, name: member.name });
        }
      });
    });
  }
}

module.exports = RoomController;