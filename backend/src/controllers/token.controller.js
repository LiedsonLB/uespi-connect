const { AccessToken } = require('livekit-server-sdk');

// Certifique-se que está exportando como função
exports.createToken = async (req, res) => {
    try {
        const { roomName, identity, name } = req.body;
        
        console.log('📝 Token request:', { roomName, identity, name });
        
        if (!roomName) {
            return res.status(400).json({ error: 'roomName é obrigatório' });
        }
        
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: identity,
                name: name || identity,
            }
        );
        
        at.addGrant({
            roomJoin: true,
            room: roomName,  // ← CRÍTICO
            canPublish: true,
            canSubscribe: true,
        });
        
        const token = await at.toJwt();
        
        res.json({
            token: token,
            url: process.env.PUBLIC_LIVEKIT_URL
        });
        
    } catch (err) {
        console.error('❌ Erro:', err);
        res.status(500).json({ error: err.message });
    }
};