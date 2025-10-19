import db from '../config/db.js';

const fixedCommissions = [
    { id: 1, nom: 'Evangélisation' },
    { id: 2, nom: 'Multimédia et Audiovisuel' },
    { id: 3, nom: 'Presse et Documentation' },
    { id: 4, nom: 'Chœur' },
    { id: 5, nom: 'Accueil' },
    { id: 6, nom: 'Comptabilité' },
    { id: 7, nom: 'Organisation et Logistique' },
    { id: 8, nom: 'Liturgie MCM bénin service délégué' }
];

export const getPublicCommissions = (req, res) => {
    res.json(fixedCommissions);
};

export const getCommissions = (req, res) => {
    const query = 'SELECT * FROM commissions ORDER BY nom';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur getCommissions:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results.rows);
    });
};