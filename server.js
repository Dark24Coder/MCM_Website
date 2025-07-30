const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Assure-toi que le chemin est correct

const app = express();
const PORT = process.env.PORT || 3000;

// Origines autorisées
const allowedOrigins = [
    'https://mcm-website-eosin.vercel.app',
    'http://localhost:3000'  // pour développement local
];

// Configuration CORS
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true); // Postman, etc.
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = "L'origine CORS n'est pas autorisée.";
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route test base de données
app.get('/api/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            console.error('Erreur requête DB:', err);
            return res.status(500).json({ error: 'Erreur base de données' });
        }
        res.json({ result: results[0].solution });
    });
});

// Routes API
app.use('/api/auth', require('./server/routes/auth.routes'));
app.use('/api/membres', require('./server/routes/membres.routes'));
app.use('/api/services', require('./server/routes/services.routes'));
app.use('/api/users', require('./server/routes/users.routes'));
app.use('/api/profile', require('./server/routes/profile.routes'));

// Routes pages HTML
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/superadmin', (_, res) => res.sendFile(path.join(__dirname, 'public/superadmin.html')));
app.get('/login', (_, res) => res.sendFile(path.join(__dirname, 'public/login.html')));

// Démarrage serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
