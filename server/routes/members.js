const express = require('express');
const router = express.Router();

// Ajouter un membre
router.post('/', (req, res) => {
    res.send('Membre ajouté');
});

// Modifier un membre
router.put('/:id', (req, res) => {
    res.send('Membre modifié');
});

// Supprimer un membre
router.delete('/:id', (req, res) => {
    res.send('Membre supprimé');
});

// Voir membres d’un service
router.get('/service/:serviceId', (req, res) => {
    res.send('Liste des membres');
});

module.exports = router;