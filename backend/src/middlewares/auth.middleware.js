const dataService = require('../services/data.service');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Acesso negado');
  }
  next();
}

function requireChannelAccess(channelName) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) return res.redirect('/login');
    
    const channel = dataService.findChannelByName(req.params[channelName] || req.body.channel);
    if (!channel) return res.status(404).send('Canal não encontrado');
    
    if (!dataService.canAccessChannel(user, channel.name)) {
      return res.status(403).send('Acesso negado');
    }
    
    req.channel = channel;
    next();
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireChannelAccess
};