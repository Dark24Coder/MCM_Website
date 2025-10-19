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

// 🚀 IMPORTATION DE TOUTES LES ROUTES
import authRoutes from './server/routes/authRoutes.js';
import commissionRoutes from './server/routes/commissionRoutes.js';
import serviceRoutes from './server/routes/serviceRoutes.js';
import membreRoutes from './server/routes/membreRoutes.js';
import userRoutes from './server/routes/userRoutes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, JS, images, etc.)
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Chemin des templates
const templatesPath = path.join(__dirname, 'public', 'templates');

// =============================
// 🔗 Connexion PostgreSQL (Neon)
// =============================
let pool;

try {
    // Priority 1: DATABASE_URL (Neon)
    if (process.env.DATABASE_URL) {
        console.log("🌍 Mode PRODUCTION - Connexion Neon");
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    } 
    // Priority 2: Variables d'environnement locales
    else if (process.env.DB_HOST) {
        console.log("💻 Mode DÉVELOPPEMENT - Connexion locale");
        pool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: String(process.env.DB_PASSWORD || '').trim(),
            database: process.env.DB_NAME,
            ssl: false
        });
    }
    else {
        throw new Error("❌ Aucune configuration de base de données trouvée !");
    }

    // Test connexion
    const client = await pool.connect();
    console.log("✅ Connecté à PostgreSQL");
    console.log(`📍 Base: ${process.env.DB_NAME || 'neondb'}`);
    client.release();
} catch (err) {
    console.error("❌ Erreur de connexion à PostgreSQL:", err.message);
    process.exit(1);
}

// Export pool pour utiliser dans les routes
export { pool };

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

// Export transporter pour utiliser dans les routes
export { transporter };

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