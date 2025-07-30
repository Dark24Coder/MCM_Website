const db = require('../config/db');

exports.getMembres = (req, res) => {
    let query = `
        SELECT m.*, s.nom as service_nom, c.nom as commission_nom
        FROM membres m
        LEFT JOIN services s ON m.service_id = s.id
        LEFT JOIN commissions c ON s.commission_id = c.id
    `;
    let params = [];
    if (req.user.role === 'admin') {
        query += ' WHERE m.service_id = ?';
        params = [req.user.service_id];
    } else if (req.user.role === 'adminCom') {
        query += ' WHERE c.id = ?';
        params = [req.user.commission_id];
    }
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        res.json(results);
    });
};

exports.getMembresByService = (req, res) => {
    const { serviceId } = req.params;
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
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        res.json(results);
    });
};