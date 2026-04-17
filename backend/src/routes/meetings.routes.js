// backend/src/routes/meetings.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/meetings.controller');

router.post('/', controller.createMeeting); // nova rota para criar uma reunião
router.post('/:id/join', controller.joinMeeting); // nova rota para entrar em uma reunião, incrementa o número de participantes
router.get('/', controller.listMeetings); // listar todas as salas de reunião
router.get('/:id', controller.getMeeting); // detalhes de uma sala de reunião
router.get('/:id/participants', controller.getMeetingParticipants); // numero de participantes de uma sala
router.put('/:id', controller.updateMeeting); // Editar o nome da sala da reunião
router.delete('/:id', controller.deleteMeeting); // deletar uma sala de reunião
router.post('/:id/leave', controller.leaveMeeting); // nova rota para sair de uma reunião, decrementa o número de participantes

module.exports = router;