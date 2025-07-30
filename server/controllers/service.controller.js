const db = require('../config/db');

exports.getServices = (req, res) => {
    const query = `
        SELECT s.*, c.nom as commission_nom 
        FROM services s 
        LEFT JOIN commissions c ON s.commission_id = c.id`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        res.json(results);
    });
};

exports.getServicesByCommission = (req, res) => {
    const { commissionId } = req.params;
    const query = 'SELECT * FROM services WHERE commission_id = ?';
    db.query(query, [commissionId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        res.json(results);
    });
};
