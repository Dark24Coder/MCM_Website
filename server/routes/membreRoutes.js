const express = require('express');
const { 
    getMembres,
    getMembresByService,
    getMembreById,
    createMembre,
    updateMembre,
    deleteMembre 
} = require('../controllers/membreController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Routes pour les membres
router.get('/', authenticateToken, getMembres);
router.get('/service/:serviceId', authenticateToken, getMembresByService);
router.get('/:id', authenticateToken, getMembreById);
router.post('/', authenticateToken, createMembre);
router.put('/:id', authenticateToken, updateMembre);
router.delete('/:id', authenticateToken, deleteMembre);

module.exports = router;