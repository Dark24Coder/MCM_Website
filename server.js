/**
 * ================================
 * 🌐 MCM Management System Server
 * ================================
 */

import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';

import db from './server/config/db.js';

// 🚀 IMPORTATION DE TOUTES LES ROUTES
import authRoutes from './server/routes/authRoutes.js';
import commissionRoutes from './server/routes/commissionRoutes.js';
import serviceRoutes from './server/routes/serviceRoutes.js';
import membreRoutes from './server/routes/membreRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import { appMiddleware } from './server/middlewares/appMiddleware.js'; //Pour faire des contrôles sur n'importe qu'elle requête envoyé
import { checkForgotPasswordToken, updatePassword } from './server/controllers/authController.js'


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());
app.use(appMiddleware);
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, JS, images, etc.)
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Chemin des templates
const templatesPath = path.join(__dirname, 'public', 'templates');

// =============================
// 🔗 Connexion PostgreSQL
// =============================
let pool;

try {
    if (process.env.DATABASE_URL) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    } else {
        pool = new Pool({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER || 'postgres',
            password: String(process.env.DB_PASSWORD || '').trim(),
            database: process.env.DB_NAME || 'mcm_db',
            ssl: false
        });
    }

    const client = await pool.connect();
    console.log("✅ Connecté à PostgreSQL");
    console.log(`📍 Base: ${process.env.DB_NAME}`);
    client.release();
} catch (err) {
    console.error("❌ Erreur de connexion à PostgreSQL:", err.message);
}

// =============================
// 📧 Configuration Email
// =============================
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    console.log("📧 Email configuré: ✅");
} else {
    console.log("📧 Email non configuré");
}

// =============================
// 🚀 ROUTES API - ENREGISTREMENT
// =============================

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes des commissions
app.use('/api/commissions', commissionRoutes);

// Routes des services
app.use('/api/services', serviceRoutes);

// Routes des membres
app.use('/api/membres', membreRoutes);

// Routes des utilisateurs
app.use('/api/users', userRoutes);

// =============================
// 🧭 ROUTES FRONTEND
// =============================

// Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(templatesPath, 'accueil.html'));
});

// Routes d'authentification
app.get('/login', (req, res) => {
    res.sendFile(path.join(templatesPath, 'login.html'));
});

app.get('/password-recovery', (req, res) => {
    res.sendFile(path.join(templatesPath, 'password-recovery.html'));
});

app.get('/newPassword/:token', checkForgotPasswordToken);
app.post('/newPassword/:token/complete', updatePassword);

// Routes des dashboards
app.get('/superadmin', (req, res) => {
    res.sendFile(path.join(templatesPath, 'superadmin.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(templatesPath, 'admin.html'));
});

app.get('/adminCom', (req, res) => {
    res.sendFile(path.join(templatesPath, 'adminCom.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(templatesPath, 'dashboard.html'));
});

// Servir les fichiers statiques du dossier templates
app.use(express.static(path.join(__dirname, 'public', 'templates')));

// =============================
// ❌ GESTION 404
// =============================
app.use((req, res, next) => {
    // Pour les routes API
    if (req.originalUrl.startsWith('/api/')) {
        console.log(`❌ Route API non trouvée: ${req.method} ${req.originalUrl}`);
        return res.status(404).json({
            error: 'Endpoint non trouvé',
            path: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
        });
    }

    // Pour les routes frontend
    console.log(`❌ Page non trouvée: ${req.originalUrl}`);
    res.status(404).sendFile(path.join(templatesPath, '404.html'), err => {
        if (err) {
            console.error('Erreur lors de la lecture de 404.html:', err);
            res.status(404).send('Page non trouvée');
        }
    });
});

// =============================
// 🚀 Lancement du serveur
// =============================
app.listen(PORT, () => {
    console.log(`\n🎯 MCM Management System démarré !`);
    console.log(`🔗 URL locale: http://localhost:${PORT}`);
    console.log(`📝 Environnement: ${NODE_ENV}\n`);
});