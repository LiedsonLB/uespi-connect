// src/routes/token.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/token.controller');

// Certifique-se que controller.createToken existe
if (!controller.createToken) {
    console.error('❌ controller.createToken não encontrado!');
}

router.post('/token', controller.createToken);

module.exports = router;  // ← Exporta o router, não o objeto