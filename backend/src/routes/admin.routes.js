const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/admin', requireAuth, requireAdmin, (req, res) => adminController.adminPage(req, res));
router.post('/admin/create-channel', requireAuth, requireAdmin, (req, res) => adminController.createChannel(req, res));
router.post('/admin/create-user', requireAuth, requireAdmin, (req, res) => adminController.createUser(req, res));
router.post('/admin/toggle-user/:id', requireAuth, requireAdmin, (req, res) => adminController.toggleUser(req, res));
router.post('/admin/reset-guest/:channel', requireAuth, requireAdmin, (req, res) => adminController.resetGuestKey(req, res));

module.exports = router;