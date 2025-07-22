const express = require('express');
const router = express.Router();

// Voir superadmins
router.get('/dg', (req, res) => {
    res.send('Liste des DG');
});

// Ajouter DG
router.post('/dg', (req, res) => {
    res.send('DG ajouté');
});

// Supprimer DG
router.delete('/dg/:id', (req, res) => {
    res.send('DG supprimé');
});

module.exports = router;