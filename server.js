const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware²
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./server/routes/auth.routes'));
app.use('/api/membres', require('./server/routes/membres.routes'));
app.use('/api/services', require('./server/routes/services.routes'));
app.use('/api/users', require('./server/routes/users.routes'));
app.use('/api/profile', require('./server/routes/profile.routes'));

// Pages HTML
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/superadmin', (_, res) => res.sendFile(path.join(__dirname, 'public/superadmin.html')));
app.get('/login', (_, res) => res.sendFile(path.join(__dirname, 'public/login.html')));

// Démarrage
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});