// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const apiController = require('../controllers/api.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/login', (req, res) => authController.login(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/logout', (req, res) => authController.logout(req, res));
router.get('/dashboard', requireAuth, (req, res) => authController.dashboard(req, res));

// Rota para criar usuário (via Google)
router.post('/admin/users', (req, res) => apiController.adminCreateUser(req, res));

router.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  return res.redirect('/login');
});

module.exports = router;