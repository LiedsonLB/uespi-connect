const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

function loadJSON(file, fallback) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function shortId() {
  return uuidv4().replace(/-/g, '').slice(0, 10);
}

class DataService {
  constructor() {
    this.initData();
  }

  initData() {
    let channels = loadJSON(config.CHANNELS_FILE, []);
    if (!channels.length) {
      channels = [
        { id: shortId(), name: 'tv1', title: 'TV 1', guestKey: shortId() + shortId().slice(0, 6), active: true, mode: 'av' },
        { id: shortId(), name: 'tv2', title: 'TV 2', guestKey: shortId() + shortId().slice(0, 6), active: true, mode: 'av' }
      ];
      saveJSON(config.CHANNELS_FILE, channels);
    } else {
      let changed = false;
      channels = channels.map(c => {
        if (!c.mode) {
          changed = true;
          return { ...c, mode: 'av' };
        }
        return c;
      });
      if (changed) saveJSON(config.CHANNELS_FILE, channels);
    }

    let users = loadJSON(config.USERS_FILE, []);
    if (!users.length) {
      users = [
        {
          id: shortId(),
          username: 'admin',
          passwordHash: bcrypt.hashSync('admin123', 10),
          role: 'admin',
          channel: null,
          active: true
        },
        {
          id: shortId(),
          username: 'tv1',
          passwordHash: bcrypt.hashSync('tv123', 10),
          role: 'user',
          channel: 'tv1',
          active: true
        },
        {
          id: shortId(),
          username: 'tv2',
          passwordHash: bcrypt.hashSync('tv123', 10),
          role: 'user',
          channel: 'tv2',
          active: true
        }
      ];
      saveJSON(config.USERS_FILE, users);
    }

    for (const c of channels) {
      const dir = path.join(config.RECORDINGS_DIR, c.name);
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  getUsers() {
    return loadJSON(config.USERS_FILE, []);
  }

  getChannels() {
    return loadJSON(config.CHANNELS_FILE, []);
  }

  saveUsers(users) {
    saveJSON(config.USERS_FILE, users);
  }

  saveChannels(channels) {
    saveJSON(config.CHANNELS_FILE, channels);
  }

  findUserByUsername(username) {
    return this.getUsers().find(u => u.username === username);
  }

  findChannelByName(name) {
    return this.getChannels().find(c => c.name === name && c.active);
  }

  getActiveChannels() {
    return this.getChannels().filter(c => c.active);
  }

  getUserChannels(user) {
    const channels = this.getActiveChannels();
    if (user.role === 'admin') return channels;
    return channels.filter(c => c.name === user.channel);
  }

  createChannel(data) {
    const channels = this.getChannels();
    if (channels.find(c => c.name === data.name)) return null;
    
    const newChannel = {
      id: shortId(),
      ...data,
      guestKey: shortId() + shortId().slice(0, 6),
      active: true
    };
    
    channels.push(newChannel);
    this.saveChannels(channels);
    
    const dir = path.join(config.RECORDINGS_DIR, data.name);
    fs.mkdirSync(dir, { recursive: true });
    
    return newChannel;
  }

  createUser(data) {
    const users = this.getUsers();
    if (users.find(u => u.username === data.username)) return null;
    
    const newUser = {
      id: shortId(),
      ...data,
      passwordHash: bcrypt.hashSync(data.password, 10),
      active: true
    };
    
    users.push(newUser);
    this.saveUsers(users);
    
    return newUser;
  }

  toggleUserActive(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user && user.username !== 'admin') {
      user.active = !user.active;
      this.saveUsers(users);
      return user;
    }
    return null;
  }

  resetGuestKey(channelName) {
    const channels = this.getChannels();
    const channel = channels.find(c => c.name === channelName);
    if (channel) {
      channel.guestKey = shortId() + shortId().slice(0, 6);
      this.saveChannels(channels);
      return channel;
    }
    return null;
  }

  canAccessChannel(user, channelName) {
    if (!user) return false;
    return user.role === 'admin' || user.channel === channelName;
  }
}

module.exports = new DataService();