import db from '../config/db.js';

const servicesByCommission = {
    1: [
        { id: 1, nom: 'Prédication', commission_id: 1 },
        { id: 2, nom: 'Formation biblique', commission_id: 1 },
        { id: 3, nom: 'Missions', commission_id: 1 }
    ],
    2: [
        { id: 4, nom: 'Son et éclairage', commission_id: 2 },
        { id: 5, nom: 'Vidéo et streaming', commission_id: 2 },
        { id: 6, nom: 'Photographie', commission_id: 2 }
    ],
    3: [
        { id: 7, nom: 'Rédaction', commission_id: 3 },
        { id: 8, nom: 'Archives', commission_id: 3 },
        { id: 9, nom: 'Communication', commission_id: 3 }
    ],
    4: [
        { id: 10, nom: 'Chant principal', commission_id: 4 },
        { id: 11, nom: 'Instruments', commission_id: 4 },
        { id: 12, nom: 'Direction musicale', commission_id: 4 }
    ],
    5: [
        { id: 13, nom: 'Réception', commission_id: 5 },
        { id: 14, nom: 'Orientation', commission_id: 5 },
        { id: 15, nom: 'Information', commission_id: 5 }
    ],
    6: [
        { id: 16, nom: 'Trésorerie', commission_id: 6 },
        { id: 17, nom: 'Budget', commission_id: 6 },
        { id: 18, nom: 'Contrôle', commission_id: 6 }
    ],
    7: [
        { id: 19, nom: 'Événements', commission_id: 7 },
        { id: 20, nom: 'Matériel', commission_id: 7 },
        { id: 21, nom: 'Transport', commission_id: 7 }
    ],
    8: [
        { id: 22, nom: 'Cérémonies', commission_id: 8 },
        { id: 23, nom: 'Protocole', commission_id: 8 },
        { id: 24, nom: 'Sacristie', commission_id: 8 }
    ]
};

export const getPublicServicesByCommission = (req, res) => {
    const { commissionId } = req.params;
    const commissionIdInt = parseInt(commissionId);
    const services = servicesByCommission[commissionIdInt] || [];
    res.json(services);
};

export const getServices = (req, res) => {
    const query = 'SELECT * FROM services ORDER BY nom';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur getServices:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results.rows);
    });
};

export const getServicesByCommission = (req, res) => {
    const { commissionId } = req.params;
    const query = 'SELECT * FROM services WHERE commission_id = $1 ORDER BY nom';
    db.query(query, [commissionId], (err, results) => {
        if (err) {
            console.error('Erreur getServicesByCommission:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results.rows);
    });
};

export const createService = (req, res) => {
    const { nom, commission_id } = req.body;

    if (!nom || !commission_id) {
        return res.status(400).json({ error: 'Nom et commission_id requis' });
    }

    if (req.user.role === 'adminCom' && req.user.commission_id !== parseInt(commission_id)) {
        return res.status(403).json({ error: 'Vous ne pouvez créer des services que dans votre commission' });
    }

    const query = 'INSERT INTO services (nom, commission_id, created_at) VALUES ($1, $2, NOW()) RETURNING id';
    db.query(query, [nom, commission_id], (err, result) => {
        if (err) {
            console.error('Erreur createService:', err);
            return res.status(500).json({ error: 'Erreur lors de la création du service' });
        }
        res.status(201).json({ 
            message: 'Service créé avec succès', 
            id: result.rows[0].id,
            service: { id: result.rows[0].id, nom, commission_id }
        });
    });
};