const db = require('../config/db');

// Services prédéfinis par commission
const servicesByCommission = {
    1: [ // Evangélisation
        { id: 1, nom: 'Prédication', commission_id: 1 },
        { id: 2, nom: 'Formation biblique', commission_id: 1 },
        { id: 3, nom: 'Missions', commission_id: 1 }
    ],
    2: [ // Multimédia et Audiovisuel
        { id: 4, nom: 'Son et éclairage', commission_id: 2 },
        { id: 5, nom: 'Vidéo et streaming', commission_id: 2 },
        { id: 6, nom: 'Photographie', commission_id: 2 }
    ],
    3: [ // Presse et Documentation
        { id: 7, nom: 'Rédaction', commission_id: 3 },
        { id: 8, nom: 'Archives', commission_id: 3 },
        { id: 9, nom: 'Communication', commission_id: 3 }
    ],
    4: [ // Chœur
        { id: 10, nom: 'Chant principal', commission_id: 4 },
        { id: 11, nom: 'Instruments', commission_id: 4 },
        { id: 12, nom: 'Direction musicale', commission_id: 4 }
    ],
    5: [ // Accueil
        { id: 13, nom: 'Réception', commission_id: 5 },
        { id: 14, nom: 'Orientation', commission_id: 5 },
        { id: 15, nom: 'Information', commission_id: 5 }
    ],
    6: [ // Comptabilité
        { id: 16, nom: 'Trésorerie', commission_id: 6 },
        { id: 17, nom: 'Budget', commission_id: 6 },
        { id: 18, nom: 'Contrôle', commission_id: 6 }
    ],
    7: [ // Organisation et Logistique
        { id: 19, nom: 'Événements', commission_id: 7 },
        { id: 20, nom: 'Matériel', commission_id: 7 },
        { id: 21, nom: 'Transport', commission_id: 7 }
    ],
    8: [ // Liturgie MCM bénin service délégué
        { id: 22, nom: 'Cérémonies', commission_id: 8 },
        { id: 23, nom: 'Protocole', commission_id: 8 },
        { id: 24, nom: 'Sacristie', commission_id: 8 }
    ]
};

const getPublicServicesByCommission = (req, res) => {
    const { commissionId } = req.params;
    const commissionIdInt = parseInt(commissionId);
    const services = servicesByCommission[commissionIdInt] || [];
    res.json(services);
};

const getServices = (req, res) => {
    const query = `
        SELECT s.*, c.nom as commission_nom 
        FROM services s 
        LEFT JOIN commissions c ON s.commission_id = c.id
    `;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
};

const getServicesByCommission = (req, res) => {
    const { commissionId } = req.params;
    const query = 'SELECT * FROM services WHERE commission_id = ?';
    db.query(query, [commissionId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
};

const createService = (req, res) => {
    const { nom, commission_id } = req.body;
    
    // Vérifier si adminCom peut créer dans sa commission
    if (req.user.role === 'adminCom' && req.user.commission_id !== parseInt(commission_id)) {
        return res.status(403).json({ error: 'Vous ne pouvez créer des services que dans votre commission' });
    }

    const query = 'INSERT INTO services (nom, commission_id) VALUES (?, ?)';
    db.query(query, [nom, commission_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la création du service' });
        }
        res.status(201).json({ message: 'Service créé avec succès', id: result.insertId });
    });
};

module.exports = { 
    getPublicServicesByCommission, 
    getServices, 
    getServicesByCommission, 
    createService 
};