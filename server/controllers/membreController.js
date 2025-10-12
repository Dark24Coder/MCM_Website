const db = require('../config/db');

const getMembres = (req, res) => {
    let query = `
        SELECT m.*, s.nom as service_nom, c.nom as commission_nom
        FROM membres m
        LEFT JOIN services s ON m.service_id = s.id
        LEFT JOIN commissions c ON s.commission_id = c.id
    `;
    let params = [];

    // Filtrer selon le rôle
    if (req.user.role === 'admin') {
        query += ' WHERE m.service_id = $1';
        params = [req.user.service_id];
    } else if (req.user.role === 'adminCom') {
        query += ' WHERE c.id = $1';
        params = [req.user.commission_id];
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erreur getMembres:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
};

const getMembresByService = (req, res) => {
    const { serviceId } = req.params;
    
    console.log(`Récupération des membres du service ${serviceId} par utilisateur ${req.user.email} (${req.user.role})`);
    
    // Vérifier les permissions
    if (req.user.role === 'admin' && req.user.service_id !== parseInt(serviceId)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const query = `
        SELECT m.*, s.nom as service_nom, c.nom as commission_nom
        FROM membres m
        LEFT JOIN services s ON m.service_id = s.id
        LEFT JOIN commissions c ON s.commission_id = c.id
        WHERE m.service_id = $1
    `;
    
    db.query(query, [serviceId], (err, results) => {
        if (err) {
            console.error('Erreur getMembresByService:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        console.log(`${results.length} membres trouvés pour le service ${serviceId}`);
        res.json(results);
    });
};

const getMembreById = (req, res) => {
    const { id } = req.params;
    
    console.log(`Récupération du membre ID ${id} par utilisateur ${req.user.email}`);
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID de membre invalide' });
    }

    const query = `
        SELECT m.*, s.nom as service_nom, c.nom as commission_nom
        FROM membres m
        LEFT JOIN services s ON m.service_id = s.id
        LEFT JOIN commissions c ON s.commission_id = c.id
        WHERE m.id = $1
    `;
    
    db.query(query, [parseInt(id)], (err, results) => {
        if (err) {
            console.error('Erreur getMembreById:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        if (results.length === 0) {
            console.log(`Membre non trouvé avec l'ID: ${id}`);
            return res.status(404).json({ error: 'Membre non trouvé' });
        }
        
        const membre = results[0];
        
        // Vérifier les permissions
        if (req.user.role === 'admin' && req.user.service_id !== membre.service_id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        if (req.user.role === 'adminCom' && req.user.commission_id !== membre.commission_id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        
        console.log(`Membre trouvé: ${membre.nom} ${membre.prenom}`);
        res.json(membre);
    });
};

const createMembre = (req, res) => {
    const { nom, prenom, sexe, date_naissance, email, telephone, service_id } = req.body;

    console.log(`Création d'un membre par ${req.user.email}:`, { nom, prenom, service_id });

    // Validation des données requises
    if (!nom || !prenom || !sexe || !date_naissance || !service_id) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Vérifier les permissions
    if (req.user.role === 'admin' && req.user.service_id !== parseInt(service_id)) {
        return res.status(403).json({ error: 'Vous ne pouvez ajouter des membres que dans votre service' });
    }

    if (req.user.role === 'adminCom') {
        // Vérifier que le service appartient à sa commission
        const checkService = 'SELECT * FROM services WHERE id = $1 AND commission_id = $2';
        db.query(checkService, [service_id, req.user.commission_id], (err, results) => {
            if (err) {
                console.error('Erreur vérification service:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            if (results.length === 0) {
                return res.status(403).json({ error: 'Service non autorisé pour votre commission' });
            }
            
            insertMember();
        });
    } else {
        insertMember();
    }

    function insertMember() {
        const query = `
            INSERT INTO membres (nom, prenom, sexe, date_naissance, email, telephone, service_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
        `;
        db.query(query, [nom, prenom, sexe, date_naissance, email, telephone, service_id], (err, result) => {
            if (err) {
                console.error('Erreur insertion membre:', err);
                return res.status(500).json({ error: 'Erreur lors de l\'ajout du membre' });
            }
            const insertId = result[0].id;
            console.log(`Membre ajouté avec succès, ID: ${insertId}`);
            res.status(201).json({ 
                message: 'Membre ajouté avec succès', 
                id: insertId,
                membre: { id: insertId, nom, prenom, sexe, date_naissance, email, telephone, service_id }
            });
        });
    }
};

const updateMembre = (req, res) => {
    const { id } = req.params;
    const { nom, prenom, sexe, date_naissance, email, telephone, service_id } = req.body;

    console.log(`Modification du membre ID ${id} par ${req.user.email}`);

    if (!nom || !prenom || !sexe || !date_naissance || !service_id) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Vérifier les permissions
    const checkPermission = `
        SELECT m.*, s.commission_id 
        FROM membres m 
        LEFT JOIN services s ON m.service_id = s.id 
        WHERE m.id = $1
    `;
    
    db.query(checkPermission, [id], (err, results) => {
        if (err) {
            console.error('Erreur vérification permission:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        if (results.length === 0) {
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
        const updateQuery = `
            UPDATE membres 
            SET nom = $1, prenom = $2, sexe = $3, date_naissance = $4, email = $5, telephone = $6, service_id = $7, updated_at = NOW() 
            WHERE id = $8
        `;
        db.query(updateQuery, [nom, prenom, sexe, date_naissance, email, telephone, service_id, id], (err, result) => {
            if (err) {
                console.error('Erreur mise à jour membre:', err);
                return res.status(500).json({ error: 'Erreur lors de la modification' });
            }
            console.log(`Membre ${id} modifié avec succès`);
            res.json({ 
                message: 'Membre modifié avec succès',
                membre: { id, nom, prenom, sexe, date_naissance, email, telephone, service_id }
            });
        });
    });
};

const deleteMembre = (req, res) => {
    const { id } = req.params;

    console.log(`Suppression du membre ID ${id} par ${req.user.email}`);

    // Vérifier les permissions
    const checkPermission = `
        SELECT m.*, s.commission_id 
        FROM membres m 
        LEFT JOIN services s ON m.service_id = s.id 
        WHERE m.id = $1
    `;
    
    db.query(checkPermission, [id], (err, results) => {
        if (err) {
            console.error('Erreur vérification permission suppression:', err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        
        if (results.length === 0) {
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
        const deleteQuery = 'DELETE FROM membres WHERE id = $1';
        db.query(deleteQuery, [id], (err, result) => {
            if (err) {
                console.error('Erreur suppression membre:', err);
                return res.status(500).json({ error: 'Erreur lors de la suppression' });
            }
            console.log(`Membre ${id} supprimé avec succès`);
            res.json({ message: 'Membre supprimé avec succès' });
        });
    });
};

module.exports = { 
    getMembres, 
    getMembresByService,
    getMembreById,
    createMembre, 
    updateMembre, 
    deleteMembre 
};