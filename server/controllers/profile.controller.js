const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.updateProfile = async (req, res) => {
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
            if (err) return res.status(500).json({ error: 'Erreur modification profil' });
            res.json({ message: 'Profil mis à jour' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
