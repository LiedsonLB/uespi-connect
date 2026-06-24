// ─── Adicione ao seu arquivo de rotas (ex: meetings.routes.js) ───────────────
//
// Importe as novas funções:
// const { inviteAgent, saveMeetingNote, saveMeetingSummary } = require('./meetings.agent.controller');
//
// Cole as rotas abaixo junto com as outras rotas de /meetings:

// Convidar o agente IA para uma sala específica
router.post('/:id/invite-agent', protect, inviteAgent);

// Receber notas do agente (chamado pelo Python via aiohttp)
router.post('/notes', saveMeetingNote);

// Receber resumo da reunião ao final
router.post('/summary', saveMeetingSummary);