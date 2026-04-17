const path = require('path');
const fs = require('fs');

module.exports = {
  DOMAIN: process.env.DOMAIN || 'localhost',
  SESSION_SECRET: process.env.SESSION_SECRET || 'change-me',
  TURN_USER: process.env.TURN_USER || 'studio',
  TURN_PASS: process.env.TURN_PASS || 'studio123',
  PORT: process.env.PORT || 3000,
  
  DATA_DIR: path.join(__dirname, '../../data'),
  RECORDINGS_DIR: path.join(__dirname, '../../recordings'),
  
  USERS_FILE: path.join(__dirname, '../../data/users.json'),
  CHANNELS_FILE: path.join(__dirname, '../../data/channels.json'),
  
  initDirectories: () => {
    fs.mkdirSync(module.exports.DATA_DIR, { recursive: true });
    fs.mkdirSync(module.exports.RECORDINGS_DIR, { recursive: true });
  }
};