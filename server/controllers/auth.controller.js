const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mcm_secret_key_2024';

exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe, role, commission_id, service_id } = req.body;
        if (!nom || !prenom || !email || !mot_de_passe || !role) {
            return res.status(400).json({ error: 'Champs obligatoires manquants' });
        }
        const checkUser = 'SELECT * FROM users WHERE email = ?';
        db.query(checkUser, [email], async (err, results) => {
            if (results.length > 0) return res.status(400).json({ error: 'Email déjà utilisé' });
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
            const insert = 'INSERT INTO users (nom, prenom, email, mot_de_passe, role, commission_id, service_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.query(insert, [nom, prenom, email, hashedPassword, role, commission_id || null, service_id || null],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Erreur création utilisateur' });
                    res.status(201).json({ message: 'Compte créé', user: { id: result.insertId, nom, prenom, email, role } });
                });
        });
    } catch (e) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.login = async (req, res) => {
    const { email, mot_de_passe } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (!results.length) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        const user = results[0];
        const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, commission_id: user.commission_id, service_id: user.service_id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user });
    });
};
