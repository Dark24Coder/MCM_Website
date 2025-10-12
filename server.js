require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

// Import des routes
const authRoutes = require('./server/routes/authRoutes');
const commissionRoutes = require('./server/routes/commissionRoutes');
const serviceRoutes = require('./server/routes/serviceRoutes');
const membreRoutes = require('./server/routes/membreRoutes');
const userRoutes = require('./server/routes/userRoutes');

// Import de la configuration DB
require('./server/config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * CONFIGURATION DE SÉCURITÉ (Helmet)
 * Ajustée pour autoriser les fichiers CSS externes (comme all.min.css)
 */
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "fonts.googleapis.com",
                    "cdnjs.cloudflare.com",
                    "unpkg.com",
                ],
                fontSrc: [
                    "'self'",
                    "fonts.gstatic.com",
                    "cdnjs.cloudflare.com",
                    "data:",
                ],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "cdnjs.cloudflare.com",
                    "unpkg.com",
                    "cdn.jsdelivr.net",
                ],
                scriptSrcAttr: ["'unsafe-inline'"],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

/**
 * CONFIGURATION DES LOGS
 */
if (NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

/**
 * MIDDLEWARE DE BASE
 */
app.use(
    cors({
    origin:
        NODE_ENV === 'production'
        ? [
            'https://votre-domaine.com',
            'https://www.votre-domaine.com',
            ]
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:5501',
            'http://127.0.0.1:5501',
            ],
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
);

app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use(
    express.static(path.join(__dirname, 'public'), {
        maxAge: NODE_ENV === 'production' ? '1d' : '0',
        etag: true,
    })
);

/**
 * MIDDLEWARE DE LOGGING DES REQUÊTES
 */
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;

    if (NODE_ENV === 'development') {
    console.log(`📡 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${ip}`);

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const logBody = { ...req.body };
        if (logBody.mot_de_passe) logBody.mot_de_passe = '[MASKED]';
        if (logBody.password) logBody.password = '[MASKED]';
        console.log('📦 Body:', JSON.stringify(logBody, null, 2));
    }
    }

    next();
});

/**
 * ROUTES API
 */
console.log('🔗 Chargement des routes API...');
app.use('/api/auth', authRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/membres', membreRoutes);
app.use('/api/users', userRoutes);

/**
 * ROUTES FRONTEND
 */
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'index.html'))
);
app.get('/login', (req, res) =>
    res.sendFile(path.join(__dirname, 'login.html'))
);
app.get('/password-recovery', (req, res) =>
    res.sendFile(path.join(__dirname, 'password-recovery.html'))
);
app.get('/superadmin', (req, res) =>
    res.sendFile(path.join(__dirname, 'superadmin.html'))
);
app.get('/admin', (req, res) =>
    res.sendFile(path.join(__dirname, 'admin.html'))
);
app.get('/adminCom', (req, res) =>
    res.sendFile(path.join(__dirname, 'adminCom.html'))
);
app.get('/dashboard', (req, res) =>
    res.sendFile(path.join(__dirname, 'dashboard.html'))
);

/**
 * API DE SANTÉ ET MONITORING
 */
app.get('/api/health', (req, res) => {
    res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: '1.0.0',
        services: {
        database: 'connected',
        auth: 'active',
        email: process.env.EMAIL_USER ? 'configured' : 'not configured',
        sms: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured',
        },
    });
});

app.get('/api/version', (req, res) => {
    res.json({
        name: 'MCM Management System',
        version: '1.0.0',
        description: 'Système de gestion pour MCM',
        author: 'Équipe de développement MCM',
        buildDate: new Date().toISOString(),
    });
});

/**
 * ERREUR 404
 */
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
        console.log(`❌ Route API non trouvée: ${req.method} ${req.originalUrl}`);
        res.status(404).json({
        error: 'Endpoint non trouvé',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        });
    } else {
        res.redirect('/');
    }
});

/**
 * GESTION GLOBALE DES ERREURS
 */
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const errorId = Math.random().toString(36).substr(2, 9);

    console.error(`❌ [${timestamp}] Erreur ${errorId}:`, err);

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
        error: 'JSON invalide',
        errorId,
        message: 'Veuillez vérifier la syntaxe de votre requête',
        });
    }

    if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'request entity too large') {
        return res.status(413).json({
        error: 'Fichier trop volumineux',
        errorId,
        message: 'La taille du fichier dépasse la limite autorisée',
        });
    }

    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
        error: 'Erreur CORS',
        errorId,
        message: 'Origine non autorisée',
        });
    }

    const statusCode = err.statusCode || err.status || 500;
    const message =
        NODE_ENV === 'production'
        ? "Une erreur inattendue s'est produite"
        : err.message;

    res.status(statusCode).json({
        error: 'Erreur serveur',
        errorId,
        message,
        timestamp,
        ...(NODE_ENV === 'development' && { stack: err.stack }),
    });
});

/**
 * ARRÊT PROPRE DU SERVEUR
 */
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Signal ${signal} reçu. Arrêt en cours...`);

    const server = app.listen();
    server.close(() => {
    console.log('📡 Serveur HTTP fermé.');

    const db = require('./server/config/db');
    if (db && db.end) {
        db.end(() => {
        console.log('🗄️  Connexion base de données fermée.');
        process.exit(0);
        });
    } else {
        process.exit(0);
    }
    });

    setTimeout(() => {
        console.error('⚠️  Arrêt forcé après timeout.');
        process.exit(1);
    }, 10000);
};

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
    console.error('💥 Erreur non gérée:', err);
    if (NODE_ENV === 'production') {
        gracefulShutdown('uncaughtException');
    } else {
        console.error('Stack trace:', err.stack);
        process.exit(1);
    }
});

process.on('unhandledRejection', (err, promise) => {
    console.error('💥 Promesse rejetée non gérée:', err);
    if (NODE_ENV === 'production') {
        gracefulShutdown('unhandledRejection');
    } else {
        console.error('Promise:', promise);
        console.error('Stack trace:', err.stack);
        process.exit(1);
    }
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * DÉMARRAGE DU SERVEUR
 */
const server = app.listen(PORT, () => {
    console.log('🎯 MCM Management System démarré !');
    console.log('🔗 URL locale: http://localhost:' + PORT);
    console.log('📧 Email configuré:', process.env.EMAIL_USER ? '✅' : '❌');
    console.log('📱 SMS configuré:', process.env.TWILIO_ACCOUNT_SID ? '✅' : '❌');
    console.log('🗄️  Base de données:', 'En cours de vérification...');
});

server.timeout = NODE_ENV === 'production' ? 120000 : 30000;

module.exports = app;
