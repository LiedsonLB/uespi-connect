// backend/src/routes/meetings.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/meetings.controller');
const agentController = require('../controllers/meetings.agent.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// ── Reuniões ──────────────────────────────────────────────────────────────────
router.post('/',                 controller.createMeeting);
router.post('/:id/join',         controller.joinMeeting);
router.get('/',                  controller.listMeetings);
router.get('/:id',               controller.getMeeting);
router.get('/:id/participants',  controller.getMeetingParticipants);
router.put('/:id',               controller.updateMeeting);
router.delete('/:id',            controller.deleteMeeting);
router.post('/:id/leave',        controller.leaveMeeting);

// ── Agente IA ─────────────────────────────────────────────────────────────────
// Convidar o agente para uma sala (chamado pelo frontend — requer login)
router.post('/:id/invite-agent', requireAuth, agentController.inviteAgent);

// Receber notas do agente Python via aiohttp (chamada interna, sem auth)
router.post('/notes',   agentController.saveMeetingNote);

// Receber resumo da reunião ao final (chamada interna, sem auth)
router.post('/summary', agentController.saveMeetingSummary);

module.exports = router;