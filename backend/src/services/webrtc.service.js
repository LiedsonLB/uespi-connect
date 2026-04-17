class WebRTCService {
  constructor() {
    this.roomMembers = new Map();
  }

  getRoomMembers(room) {
    return this.roomMembers.get(room) || new Map();
  }

  addMember(room, socketId, data) {
    if (!this.roomMembers.has(room)) {
      this.roomMembers.set(room, new Map());
    }
    const members = this.roomMembers.get(room);
    members.set(socketId, data);
  }

  removeMember(room, socketId) {
    if (!this.roomMembers.has(room)) return null;
    const members = this.roomMembers.get(room);
    const member = members.get(socketId);
    members.delete(socketId);
    
    if (members.size === 0) {
      this.roomMembers.delete(room);
    }
    
    return member;
  }

  getExistingUsers(room) {
    const members = this.getRoomMembers(room);
    return [...members.entries()].map(([id, info]) => ({
      id,
      name: info.name,
      role: info.role
    }));
  }
}

module.exports = new WebRTCService();