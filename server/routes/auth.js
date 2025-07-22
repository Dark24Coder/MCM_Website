const express = require('express');
const router = express.Router();

// Connexion
router.post('/login', (req, res) => {
    res.send('Connexion');
});

// Inscription
router.post('/register', (req, res) => {
    res.send('Inscription');
});

module.exports = router;