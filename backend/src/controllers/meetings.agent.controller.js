// backend/src/controllers/meetings.agent.controller.js
const { AgentDispatchClient } = require('livekit-server-sdk');

// ── POST /api/meetings/:id/invite-agent ───────────────────────────────────────
// Chamado pelo frontend quando o usuário clica em "Chamar Assistente IA"
exports.inviteAgent = async (req, res) => {
  try {
    const { id } = req.params; // id = roomName (ex: "sala-123")

    // ws:// → http://  |  wss:// → https://
    const livekitHost = process.env.LIVEKIT_URL.replace(/^wss?/, (m) =>
      m === 'wss' ? 'https' : 'http'
    );

    const dispatchClient = new AgentDispatchClient(livekitHost, {
      apiKey:    process.env.LIVEKIT_API_KEY,
      apiSecret: process.env.LIVEKIT_API_SECRET,
    });

    await dispatchClient.createDispatch(id, 'uespi-assistant');

    console.log(`[Agent] ✅ Dispatch criado — sala: ${id}`);
    return res.json({ success: true, message: 'Assistente IA convidado para a sala' });
  } catch (err) {
    console.error('[Agent] ❌ Erro ao criar dispatch:', err);
    return res.status(500).json({ error: 'Falha ao convidar assistente IA', detail: err.message });
  }
};

// ── POST /api/meetings/notes ──────────────────────────────────────────────────
// Recebe notas do agente Python (chamada interna, sem auth)
exports.saveMeetingNote = async (req, res) => {
  try {
    const { note, room, timestamp } = req.body;

    if (!note || !room) {
      return res.status(400).json({ error: 'note e room são obrigatórios' });
    }

    console.log(`[Notes] 📝 Nota salva — sala: ${room} | ${note.slice(0, 80)}...`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Notes] ❌ Erro ao salvar nota:', err);
    return res.status(500).json({ error: 'Falha ao salvar nota' });
  }
};

// ── POST /api/meetings/summary ────────────────────────────────────────────────
// Recebe transcrição completa ao fim da reunião (chamada interna, sem auth)
exports.saveMeetingSummary = async (req, res) => {
  try {
    const { room, transcript, generated_at, total_lines } = req.body;

    if (!room || !transcript) {
      return res.status(400).json({ error: 'room e transcript são obrigatórios' });
    }

    // ── Adapte para o seu ORM ──────────────────────────────────────────────
    // Prisma:
    // await prisma.meetingSummary.create({
    //   data: { roomName: room, transcript, generatedAt: new Date(generated_at), totalLines: total_lines }
    // });
    // ──────────────────────────────────────────────────────────────────────

    console.log(`[Summary] 📄 Resumo salvo — sala: ${room} | ${total_lines} linhas`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[Summary] ❌ Erro ao salvar resumo:', err);
    return res.status(500).json({ error: 'Falha ao salvar resumo' });
  }
};