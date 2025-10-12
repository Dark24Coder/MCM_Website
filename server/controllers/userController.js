const bcrypt = require('bcryptjs');
const db = require('../config/db');

const getUsers = (req, res) => {
    console.log(`Récupération des utilisateurs par ${req.user.email} (${req.user.role})`);
    
    const query = `
        SELECT u.*, c.nom as commission_nom, s.nom as service_nom
        FROM users u
        LEFT JOIN commissions c ON u.commission_id = c.id
        LEFT JOIN services s ON u.service_id = s.id
        ORDER BY u.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur getUsers:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        // Ne pas renvoyer les mots de passe
        const users = results.map(user => {
            const { mot_de_passe, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        
        console.log(`${users.length} utilisateurs récupérés`);
        res.json(users);
    });
};

// FONCTION AJOUTÉE - Récupérer un utilisateur par ID
const getUserById = (req, res) => {
    const { id } = req.params;
    
    console.log(`Récupération de l'utilisateur ID ${id} par ${req.user.email}`);
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const query = `
        SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.commission_id, u.service_id, u.is_active, u.created_at,
               c.nom as commission_nom, s.nom as service_nom
        FROM users u
        LEFT JOIN commissions c ON u.commission_id = c.id
        LEFT JOIN services s ON u.service_id = s.id
        WHERE u.id = ?
    `;
    
    db.query(query, [parseInt(id)], (err, results) => {
        if (err) {
            console.error('Erreur getUserById:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        if (results.length === 0) {
            console.log(`Utilisateur non trouvé avec l'ID: ${id}`);
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        console.log(`Utilisateur trouvé: ${results[0].nom} ${results[0].prenom}`);
        res.json(results[0]);
    });
};

// FONCTION AJOUTÉE - Récupérer le profil de l'utilisateur connecté
const getUserProfile = (req, res) => {
    const userId = req.user.id;
    
    console.log(`Récupération du profil utilisateur ID ${userId}`);
    
    const query = `
        SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.role, u.commission_id, u.service_id,
               c.nom as commission_nom, s.nom as service_nom
        FROM users u
        LEFT JOIN commissions c ON u.commission_id = c.id
        LEFT JOIN services s ON u.service_id = s.id
        WHERE u.id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur getUserProfile:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        
        res.json(results[0]);
    });
};

const updateUserRole = (req, res) => {
    const { id } = req.params;
    const { role, commission_id, service_id } = req.body;

    console.log(`Modification du rôle utilisateur ID ${id} par ${req.user.email}`);

    const query = 'UPDATE users SET role = ?, commission_id = ?, service_id = ?, updated_at = NOW() WHERE id = ?';
    db.query(query, [role, commission_id, service_id, id], (err, result) => {
        if (err) {
            console.error('Erreur updateUserRole:', err);
            return res.status(500).json({ error: 'Erreur lors de la modification' });
        }
        console.log(`Rôle utilisateur ${id} modifié avec succès`);
        res.json({ message: 'Rôle modifié avec succès' });
    });
};

const deleteUser = (req, res) => {
    const { id } = req.params;

    console.log(`Suppression utilisateur ID ${id} par ${req.user.email}`);

    // Vérifier qu'on ne supprime pas son propre compte
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erreur deleteUser:', err);
            return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
        console.log(`Utilisateur ${id} supprimé avec succès`);
        res.json({ message: 'Utilisateur supprimé avec succès' });
    });
};

const updateProfile = async (req, res) => {
    const { nom, prenom, email, mot_de_passe } = req.body;
    const userId = req.user.id;

    console.log(`Mise à jour profil utilisateur ID ${userId}`);

    // Validation des données
    if (!nom || !prenom || !email) {
        return res.status(400).json({ error: 'Nom, prénom et email requis' });
    }

    try {
        // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
        const checkEmailQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
        
        db.query(checkEmailQuery, [email, userId], async (err, emailResults) => {
            if (err) {
                console.error('Erreur vérification email:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            
            if (emailResults.length > 0) {
                return res.status(409).json({ error: 'Cet email est déjà utilisé par un autre utilisateur' });
            }

            try {
                let query = 'UPDATE users SET nom = ?, prenom = ?, email = ?, updated_at = NOW()';
                let params = [nom, prenom, email];

                if (mot_de_passe && mot_de_passe.trim() !== '') {
                    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);
                    query += ', mot_de_passe = ?';
                    params.push(hashedPassword);
                }

                query += ' WHERE id = ?';
                params.push(userId);

                db.query(query, params, (err, result) => {
                    if (err) {
                        console.error('Erreur updateProfile:', err);
                        return res.status(500).json({ error: 'Erreur lors de la modification' });
                    }
                    console.log(`Profil utilisateur ${userId} modifié avec succès`);
                    res.json({ 
                        success: true,
                        message: 'Profil modifié avec succès',
                        user: { id: userId, nom, prenom, email }
                    });
                });
            } catch (hashError) {
                console.error('Erreur hachage mot de passe:', hashError);
                res.status(500).json({ error: 'Erreur lors du traitement du mot de passe' });
            }
        });
    } catch (error) {
        console.error('Erreur updateProfile générale:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = { 
    getUsers, 
    getUserById,        
    getUserProfile,     
    updateUserRole, 
    deleteUser, 
    updateProfile 
};