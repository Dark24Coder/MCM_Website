const db = require('../config/db');

exports.getAllUsers = (req, res) => {
    const query = `
        SELECT u.*, c.nom as commission_nom, s.nom as service_nom
        FROM users u
        LEFT JOIN commissions c ON u.commission_id = c.id
        LEFT JOIN services s ON u.service_id = s.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        const users = results.map(({ mot_de_passe, ...rest }) => rest);
        res.json(users);
    });
};

exports.updateUserRole = (req, res) => {
    const { id } = req.params;
    const { role, commission_id, service_id } = req.body;
    const query = 'UPDATE users SET role = ?, commission_id = ?, service_id = ? WHERE id = ?';
    db.query(query, [role, commission_id, service_id, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erreur modification role' });
        res.json({ message: 'Rôle mis à jour' });
    });
};

exports.deleteUser = (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erreur suppression utilisateur' });
        res.json({ message: 'Utilisateur supprimé' });
    });
};