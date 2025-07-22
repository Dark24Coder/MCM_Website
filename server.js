// server.js
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mcm_secret_key_2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mcm_db'
});

// Connexion à la base de données
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à MySQL:', err);
        return;
    }
    console.log('Connecté à MySQL');
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide' });
        }
        req.user = user;
        next();
    });
};

// Middleware de vérification des rôles
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        next();
    };
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe, role, commission_id, service_id } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const checkUser = 'SELECT * FROM users WHERE email = ?';
        db.query(checkUser, [email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Cet email est déjà utilisé' });
            }

            // Hacher le mot de passe
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

            // Insérer le nouvel utilisateur
            const insertUser = 'INSERT INTO users (nom, prenom, email, mot_de_passe, role, commission_id, service_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.query(insertUser, [nom, prenom, email, hashedPassword, role, commission_id, service_id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Erreur lors de la création du compte' });
                }

                res.status(201).json({ message: 'Compte créé avec succès' });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        // Vérifier si l'utilisateur existe
        const query = 'SELECT * FROM users WHERE email = ?';
        db.query(query, [email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            const user = results[0];

            // Vérifier le mot de passe
            const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
            if (!validPassword) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            // Générer le token JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role,
                    commission_id: user.commission_id,
                    service_id: user.service_id 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    role: user.role,
                    commission_id: user.commission_id,
                    service_id: user.service_id
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Routes pour les commissions
app.get('/api/commissions', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM commissions';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

// Routes pour les services
app.get('/api/services', authenticateToken, (req, res) => {
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
});

app.get('/api/services/commission/:commissionId', authenticateToken, (req, res) => {
    const { commissionId } = req.params;
    const query = 'SELECT * FROM services WHERE commission_id = ?';
    db.query(query, [commissionId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

app.post('/api/services', authenticateToken, checkRole(['superadmin', 'adminCom']), (req, res) => {
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
});

// Routes pour les membres
app.get('/api/membres', authenticateToken, (req, res) => {
    let query = `
        SELECT m.*, s.nom as service_nom, c.nom as commission_nom
        FROM membres m
        LEFT JOIN services s ON m.service_id = s.id
        LEFT JOIN commissions c ON s.commission_id = c.id
    `;
    let params = [];

    // Filtrer selon le rôle
    if (req.user.role === 'admin') {
        query += ' WHERE m.service_id = ?';
        params = [req.user.service_id];
    } else if (req.user.role === 'adminCom') {
        query += ' WHERE c.id = ?';
        params = [req.user.commission_id];
    }

    db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

app.get('/api/membres/service/:serviceId', authenticateToken, (req, res) => {
    const { serviceId } = req.params;
    
    // Vérifier les permissions
    if (req.user.role === 'admin' && req.user.service_id !== parseInt(serviceId)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const query = `
        SELECT m.*, s.nom as service_nom, c.nom as commission_nom
        FROM membres m
        LEFT JOIN services s ON m.service_id = s.id
        LEFT JOIN commissions c ON s.commission_id = c.id
        WHERE m.service_id = ?
    `;
    
    db.query(query, [serviceId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

app.post('/api/membres', authenticateToken, (req, res) => {
    const { nom, prenom, sexe, date_naissance, email, telephone, service_id } = req.body;

    // Vérifier les permissions
    if (req.user.role === 'admin' && req.user.service_id !== parseInt(service_id)) {
        return res.status(403).json({ error: 'Vous ne pouvez ajouter des membres que dans votre service' });
    }

    if (req.user.role === 'adminCom') {
        // Vérifier que le service appartient à sa commission
        const checkService = 'SELECT * FROM services WHERE id = ? AND commission_id = ?';
        db.query(checkService, [service_id, req.user.commission_id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(403).json({ error: 'Service non autorisé pour votre commission' });
            }
            
            insertMember();
        });
    } else {
        insertMember();
    }

    function insertMember() {
        const query = 'INSERT INTO membres (nom, prenom, sexe, date_naissance, email, telephone, service_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [nom, prenom, sexe, date_naissance, email, telephone, service_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de l\'ajout du membre' });
            }
            res.status(201).json({ message: 'Membre ajouté avec succès', id: result.insertId });
        });
    }
});

app.put('/api/membres/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nom, prenom, sexe, date_naissance, email, telephone, service_id } = req.body;

    // Vérifier les permissions
    const checkPermission = `
        SELECT m.*, s.commission_id 
        FROM membres m 
        LEFT JOIN services s ON m.service_id = s.id 
        WHERE m.id = ?
    `;
    
    db.query(checkPermission, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Membre non trouvé' });
        }

        const member = results[0];
        
        if (req.user.role === 'admin' && req.user.service_id !== member.service_id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        if (req.user.role === 'adminCom' && req.user.commission_id !== member.commission_id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Mettre à jour le membre
        const updateQuery = 'UPDATE membres SET nom = ?, prenom = ?, sexe = ?, date_naissance = ?, email = ?, telephone = ?, service_id = ? WHERE id = ?';
        db.query(updateQuery, [nom, prenom, sexe, date_naissance, email, telephone, service_id, id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de la modification' });
            }
            res.json({ message: 'Membre modifié avec succès' });
        });
    });
});

app.delete('/api/membres/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Vérifier les permissions
    const checkPermission = `
        SELECT m.*, s.commission_id 
        FROM membres m 
        LEFT JOIN services s ON m.service_id = s.id 
        WHERE m.id = ?
    `;
    
    db.query(checkPermission, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Membre non trouvé' });
        }

        const member = results[0];
        
        if (req.user.role === 'admin' && req.user.service_id !== member.service_id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        if (req.user.role === 'adminCom' && req.user.commission_id !== member.commission_id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Supprimer le membre
        const deleteQuery = 'DELETE FROM membres WHERE id = ?';
        db.query(deleteQuery, [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de la suppression' });
            }
            res.json({ message: 'Membre supprimé avec succès' });
        });
    });
});

// Routes pour les utilisateurs (gestion des admins)
app.get('/api/users', authenticateToken, checkRole(['superadmin']), (req, res) => {
    const query = `
        SELECT u.*, c.nom as commission_nom, s.nom as service_nom
        FROM users u
        LEFT JOIN commissions c ON u.commission_id = c.id
        LEFT JOIN services s ON u.service_id = s.id
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        // Ne pas renvoyer les mots de passe
        const users = results.map(user => {
            const { mot_de_passe, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        
        res.json(users);
    });
});

app.put('/api/users/:id/role', authenticateToken, checkRole(['superadmin']), (req, res) => {
    const { id } = req.params;
    const { role, commission_id, service_id } = req.body;

    const query = 'UPDATE users SET role = ?, commission_id = ?, service_id = ? WHERE id = ?';
    db.query(query, [role, commission_id, service_id, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la modification' });
        }
        res.json({ message: 'Rôle modifié avec succès' });
    });
});

app.delete('/api/users/:id', authenticateToken, checkRole(['superadmin']), (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
        res.json({ message: 'Utilisateur supprimé avec succès' });
    });
});

// Route pour modifier son profil
app.put('/api/profile', authenticateToken, async (req, res) => {
    const { nom, prenom, email, mot_de_passe } = req.body;
    const userId = req.user.id;

    try {
        let query = 'UPDATE users SET nom = ?, prenom = ?, email = ?';
        let params = [nom, prenom, email];

        if (mot_de_passe) {
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
            query += ', mot_de_passe = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        db.query(query, params, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de la modification' });
            }
            res.json({ message: 'Profil modifié avec succès' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Routes pour servir les pages frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/superadmin', (req, res) => {
    res.sendFile(path.join(__dirname, 'superadmin.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/adminCom', (req, res) => {
    res.sendFile(path.join(__dirname, 'adminCom.html'));
});

// Gestion des erreurs
process.on('uncaughtException', (err) => {
    console.error('Erreur non gérée:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Promesse rejetée non gérée:', err);
    process.exit(1);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});