const express = require('express');
const router = express.Router();
const studioController = require('../controllers/studio.controller');
const { requireAuth, requireChannelAccess } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/studio/:channel', requireAuth, requireChannelAccess('channel'), (req, res) => studioController.studioPage(req, res));
router.get('/guest/:channel/:key', requireChannelAccess('channel'), (req, res) => studioController.guestPage(req, res));
router.post('/api/upload/:channel', requireAuth, upload.single('video'), (req, res) => studioController.uploadRecording(req, res));

module.exports = router;