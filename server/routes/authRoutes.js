const express = require('express');
const rateLimit = require('express-rate-limit');

// Import des contrôleurs
const { 
    register, 
    login, 
    sendTemporaryPassword, 
    changeTemporaryPassword,
    sendValidationCode,
    validateCode,
    resendValidationCode,
    testEmail
} = require('../controllers/authController');

const router = express.Router();

/**
 * CONFIGURATION DES LIMITEURS DE REQUÊTES
 */

// Limiteur général pour toutes les routes d'authentification
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requêtes par IP toutes les 15 minutes
    message: {
        error: 'Trop de requêtes, veuillez réessayer dans 15 minutes',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiteur strict pour les tentatives de connexion
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Augmenté pour les tests
    message: {
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// Limiteur pour la création de comptes
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 20, // Augmenté pour les tests
    message: {
        error: 'Trop de créations de compte. Réessayez dans 1 heure.',
        retryAfter: '1 heure'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiteur pour l'envoi de codes/mots de passe temporaires
const recoveryLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Augmenté pour les tests
    message: {
        error: 'Trop de demandes de récupération. Réessayez dans 10 minutes.',
        retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * MIDDLEWARE DE VALIDATION DES DONNÉES
 */

// Validation des données d'inscription
const validateRegisterData = (req, res, next) => {
    const { nom, prenom, email, telephone, mot_de_passe, role } = req.body;
    
    console.log('🔍 Validation des données d\'inscription:', { nom, prenom, email, role });
    
    // Vérifications de base
    if (!nom || !prenom || !email || !telephone || !mot_de_passe || !role) {
        console.log('❌ Champs manquants dans la validation');
        return res.status(400).json({
            error: 'Tous les champs obligatoires doivent être remplis',
            requiredFields: ['nom', 'prenom', 'email', 'telephone', 'mot_de_passe', 'role']
        });
    }

    // Nettoyer et valider les données
    req.body.nom = nom.trim();
    req.body.prenom = prenom.trim();
    req.body.email = email.trim().toLowerCase();
    req.body.telephone = telephone.trim();

    // Validation longueurs
    if (req.body.nom.length < 2 || req.body.nom.length > 50) {
        return res.status(400).json({
            error: 'Le nom doit contenir entre 2 et 50 caractères'
        });
    }

    if (req.body.prenom.length < 2 || req.body.prenom.length > 50) {
        return res.status(400).json({
            error: 'Le prénom doit contenir entre 2 et 50 caractères'
        });
    }

    console.log('✅ Validation des données d\'inscription réussie');
    next();
};

// Validation des données de connexion
const validateLoginData = (req, res, next) => {
    const { email, mot_de_passe } = req.body;
    
    console.log('🔍 Validation des données de connexion pour:', email);
    
    if (!email || !mot_de_passe) {
        console.log('❌ Champs manquants pour la connexion');
        return res.status(400).json({
            error: 'Email et mot de passe requis'
        });
    }

    // Nettoyer les données
    req.body.email = email.trim().toLowerCase();
    
    console.log('✅ Validation des données de connexion réussie');
    next();
};

/**
 * MIDDLEWARE DE LOGGING
 */
const logAuthAttempt = (action) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const timestamp = new Date().toISOString();
        
        console.log(`🔐 [${timestamp}] ${action} - IP: ${ip}`);
        
        // Log les données importantes (sans les mots de passe)
        if (req.body.email) {
            console.log(`📧 Email: ${req.body.email}`);
        }
        
        next();
    };
};

/**
 * ROUTES D'AUTHENTIFICATION
 */

// Application du limiteur général à toutes les routes
router.use(generalLimiter);

// Route d'inscription
router.post('/register', 
    registerLimiter,
    logAuthAttempt('REGISTER'),
    validateRegisterData,
    register
);

// Route de connexion
router.post('/login', 
    loginLimiter,
    logAuthAttempt('LOGIN'),
    validateLoginData,
    login
);

// Route d'envoi de mot de passe temporaire
router.post('/send-temporary-password', 
    recoveryLimiter,
    logAuthAttempt('RECOVERY_REQUEST'),
    (req, res, next) => {
        // Validation spécifique pour la récupération
        const { type, target } = req.body;
        
        if (!type || !target) {
            return res.status(400).json({
                error: 'Type et cible requis',
                supportedTypes: ['email', 'sms']
            });
        }

        if (!['email', 'sms'].includes(type)) {
            return res.status(400).json({
                error: 'Type invalide',
                supportedTypes: ['email', 'sms']
            });
        }

        next();
    },
    sendTemporaryPassword
);

// Route de changement de mot de passe temporaire
router.post('/change-temporary-password', 
    logAuthAttempt('PASSWORD_CHANGE'),
    (req, res, next) => {
        const { temporaryPassword, newPassword } = req.body;
        
        if (!temporaryPassword || !newPassword) {
            return res.status(400).json({
                error: 'Mot de passe temporaire et nouveau mot de passe requis'
            });
        }

        if (temporaryPassword.length < 6 || temporaryPassword.length > 20) {
            return res.status(400).json({
                error: 'Format de mot de passe temporaire invalide'
            });
        }

        next();
    },
    changeTemporaryPassword
);

// Route d'envoi de code de validation
router.post('/send-validation-code', 
    recoveryLimiter,
    logAuthAttempt('VALIDATION_CODE_SEND'),
    (req, res, next) => {
        const { type, target } = req.body;
        
        if (!type || !target) {
            return res.status(400).json({
                error: 'Type et cible requis'
            });
        }

        if (!['email', 'sms'].includes(type)) {
            return res.status(400).json({
                error: 'Type invalide',
                supportedTypes: ['email', 'sms']
            });
        }

        next();
    },
    sendValidationCode
);

// Route de validation de code
router.post('/validate-code', 
    logAuthAttempt('CODE_VALIDATION'),
    (req, res, next) => {
        const { token, code } = req.body;
        
        if (!token || !code) {
            return res.status(400).json({
                error: 'Token et code requis'
            });
        }

        // Validation format du code (6 chiffres)
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                error: 'Le code doit contenir exactement 6 chiffres'
            });
        }

        next();
    },
    validateCode
);

// Route de renvoi de code de validation
router.post('/resend-validation-code', 
    recoveryLimiter,
    logAuthAttempt('CODE_RESEND'),
    resendValidationCode
);

// Route de test d'envoi d'email
router.post('/test-email', 
    logAuthAttempt('TEST_EMAIL'), 
    testEmail
);

/**
 * ROUTES DE SANTÉ ET INFORMATIONS
 */

// Route de vérification du statut du service
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'MCM Authentication Service',
        version: '1.0.0'
    });
});

// Route d'information sur les critères de mot de passe
router.get('/password-requirements', (req, res) => {
    res.json({
        requirements: {
            minLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            maxLength: 128
        },
        tips: [
            'Utilisez au moins 8 caractères',
            'Incluez des lettres minuscules et majuscules',
            'Ajoutez au moins un chiffre',
            'Évitez les mots de passe trop simples',
            'Ne réutilisez pas d\'anciens mots de passe'
        ]
    });
});

/**
 * GESTION DES ERREURS GLOBALES POUR LES ROUTES AUTH
 */
router.use((err, req, res, next) => {
    console.error('❌ Erreur dans les routes d\'authentification:', err);
    
    // Erreur de validation JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token invalide'
        });
    }

    // Erreur de token expiré
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expiré'
        });
    }

    // Erreur de base de données
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
            error: 'Erreur de base de données'
        });
    }

    // Erreur générale
    res.status(500).json({
        error: 'Erreur serveur interne',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur inattendue s\'est produite'
    });
});

module.exports = router;