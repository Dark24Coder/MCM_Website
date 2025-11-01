import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { forgotPasswordEmailTemplate } from './../utils/emailTemplate.js'

const JWT_SECRET = process.env.JWT_SECRET || 'mcm_secret_key_2024';


import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesPath = path.join(__dirname);

// Stockage temporaire pour codes de validation et mots de passe temporaires
const validationCodes = new Map();
const temporaryPasswords = new Map();

// ======================
// INSCRIPTION (REGISTER)
// ======================
export const register = async (req, res) => {
    try {
        console.log('📥 Nouvelle demande d\'inscription reçue');
        console.log('📋 Données reçues:', req.body);
        
        const { nom, prenom, email, telephone, mot_de_passe, role, commission_id, service_id } = req.body;

        // Validation des champs obligatoires
        if (!nom || !prenom || !email || !telephone || !mot_de_passe || !role) {
            console.log('❌ Champs manquants');
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Format d\'email invalide:', email);
            return res.status(400).json({ error: 'Format d\'email invalide' });
        }

        // Validation mot de passe
        if (mot_de_passe.length < 8) {
            console.log('❌ Mot de passe trop court');
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
        }

        // Validation du rôle
        const validRoles = ['admin', 'adminCom', 'superadmin'];
        if (!validRoles.includes(role)) {
            console.log('❌ Rôle invalide:', role);
            return res.status(400).json({ error: 'Rôle invalide' });
        }

        // Validation selon le rôle
        if (role === 'adminCom' && !commission_id) {
            return res.status(400).json({ error: 'La commission est requise pour un Admin de Commission' });
        }

        if (role === 'admin' && (!commission_id || !service_id)) {
            return res.status(400).json({ error: 'La commission et le service sont requis pour un Admin de Service' });
        }

        // Vérifier si l'utilisateur existe déjà
        const checkUser = 'SELECT * FROM users WHERE email = $1 OR telephone = $2';
        
        db.query(checkUser, [email, telephone], async (err, results) => {
            if (err) {
                console.error('❌ Erreur vérification utilisateur:', err);
                return res.status(500).json({ error: 'Erreur serveur lors de la vérification' });
            }

            if (results.rows.length > 0) {
                const existingUser = results.rows[0];
                if (existingUser.email === email) {
                    console.log('❌ Email déjà utilisé:', email);
                    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
                }
                if (existingUser.telephone === telephone) {
                    console.log('❌ Téléphone déjà utilisé:', telephone);
                    return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
                }
            }

            try {
                // Hacher le mot de passe
                console.log('🔐 Hashage du mot de passe...');
                const saltRounds = 12;
                const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

                const commissionIdInt = commission_id ? parseInt(commission_id, 10) : null;
                const serviceIdInt = service_id ? parseInt(service_id, 10) : null;

                // Construire la requête selon le rôle
                let insertQuery;
                let values;

                if (role === 'superadmin') {
                    // SuperAdmin: pas de commission ni service
                    insertQuery = `
                        INSERT INTO users 
                        (nom, prenom, email, telephone, mot_de_passe, role, created_at, email_verified, is_active) 
                        VALUES ($1, $2, $3, $4, $5, $6, NOW(), FALSE, TRUE)
                        RETURNING id, nom, prenom, email, telephone, role
                    `;
                    values = [nom, prenom, email, telephone, hashedPassword, role];
                } else if (role === 'adminCom') {
                    // AdminCom: commission uniquement
                    insertQuery = `
                        INSERT INTO users 
                        (nom, prenom, email, telephone, mot_de_passe, role, commission_id, created_at, email_verified, is_active) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), FALSE, TRUE)
                        RETURNING id, nom, prenom, email, telephone, role, commission_id
                    `;
                    values = [nom, prenom, email, telephone, hashedPassword, role, commissionIdInt];
                } else {
                    // Admin: commission et service
                    insertQuery = `
                        INSERT INTO users 
                        (nom, prenom, email, telephone, mot_de_passe, role, commission_id, service_id, created_at, email_verified, is_active) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), FALSE, TRUE)
                        RETURNING id, nom, prenom, email, telephone, role, commission_id, service_id
                    `;
                    values = [nom, prenom, email, telephone, hashedPassword, role, commissionIdInt, serviceIdInt];
                }

                console.log('📝 Exécution de la requête INSERT');
                
                db.query(insertQuery, values, (err, result) => {
                    if (err) {
                        console.error('❌ Erreur insertion utilisateur:', err);
                        return res.status(500).json({ error: 'Erreur lors de la création du compte' });
                    }

                    const newUser = result.rows[0];
                    console.log(`✅ Nouveau compte créé: ${email} - ${role} - ID: ${newUser.id}`);

                    res.status(201).json({
                        success: true,
                        message: 'Compte créé avec succès',
                        user: newUser
                    });
                });
            } catch (hashError) {
                console.error('❌ Erreur hachage mot de passe:', hashError);
                return res.status(500).json({ error: 'Erreur lors du traitement du mot de passe' });
            }
        });
    } catch (error) {
        console.error('❌ Erreur générale inscription:', error);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
};

// ======================
// CONNEXION (LOGIN) - AVEC GESTION COMPTE SUPPRIMÉ
// ======================
export const login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        console.log(`📥 Tentative de connexion pour: ${email}`);

        // Validation des champs
        if (!email || !mot_de_passe) {
            console.log('❌ Champs manquants pour la connexion');
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Validation format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Format email invalide pour connexion');
            return res.status(400).json({ error: 'Format d\'email invalide' });
        }

        // Rechercher l'utilisateur dans la base de données
        const findUser = 'SELECT * FROM users WHERE email = $1';
        
        db.query(findUser, [email], async (err, results) => {
            if (err) {
                console.error('❌ Erreur base de données lors de la connexion:', err);
                return res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
            }

            // ✅ GESTION COMPTE SUPPRIMÉ/INEXISTANT (404)
            if (results.rows.length === 0) {
                console.log(`❌ Compte introuvable (supprimé ou inexistant): ${email}`);
                return res.status(404).json({ 
                    error: 'Compte introuvable. Veuillez contacter le SuperAdmin si vous pensez qu\'il s\'agit d\'une erreur.',
                    accountDeleted: true
                });
            }

            const user = results.rows[0];
            console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

            // ✅ GESTION COMPTE INACTIF (403)
            if (!user.is_active) {
                console.log(`❌ Compte inactif: ${email}`);
                return res.status(403).json({ 
                    error: 'Votre compte a été désactivé. Contactez l\'administrateur.',
                    accountInactive: true
                });
            }

            try {
                // Vérification du mot de passe
                if (!user.mot_de_passe) {
                    console.log('❌ Aucun mot de passe stocké pour cet utilisateur');
                    return res.status(500).json({ error: 'Problème de configuration du compte' });
                }

                const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
                
                // ✅ GESTION MOT DE PASSE INCORRECT (401)
                if (!isPasswordValid) {
                    console.log(`❌ Mot de passe incorrect pour: ${email}`);
                    return res.status(401).json({ 
                        error: 'Email ou mot de passe incorrect',
                        wrongPassword: true
                    });
                }

                console.log(`✅ Mot de passe correct pour: ${email}`);

                // Générer le token JWT
                const tokenPayload = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    commission_id: user.commission_id,
                    service_id: user.service_id
                };

                const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

                // Mettre à jour la dernière connexion (sans bloquer la réponse)
                const updateLastLogin = 'UPDATE users SET last_login = NOW() WHERE id = $1';
                db.query(updateLastLogin, [user.id], (updateErr) => {
                    if (updateErr) {
                        console.error('⚠️ Erreur mise à jour dernière connexion:', updateErr);
                    }
                });

                // Préparer les données utilisateur (sans le mot de passe)
                const userData = {
                    id: user.id,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    telephone: user.telephone,
                    role: user.role,
                    commission_id: user.commission_id,
                    service_id: user.service_id,
                    email_verified: user.email_verified,
                    is_active: user.is_active
                };

                console.log(`✅ Connexion réussie pour: ${email} (${user.role})`);

                res.json({
                    success: true,
                    message: 'Connexion réussie',
                    token: token,
                    user: userData
                });

            } catch (bcryptError) {
                console.error('❌ Erreur lors de la comparaison du mot de passe:', bcryptError);
                return res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
            }
        });

    } catch (error) {
        console.error('❌ Erreur générale connexion:', error);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
};

// ======================
// GET PROFILE
// ======================
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = 'SELECT id, email, nom, prenom, role, commission_id, service_id, telephone, email_verified, is_active FROM users WHERE id = $1';
        
        db.query(query, [userId], (err, result) => {
            if (err) {
                console.error('❌ Erreur getProfile:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Utilisateur introuvable' });
            }

            res.json(result.rows[0]);
        });

    } catch (error) {
        console.error('❌ Erreur getProfile:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ======================
// UPDATE PROFILE
// ======================
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nom, prenom, email, mot_de_passe } = req.body;

        // Vérifier si l'utilisateur existe
        const checkQuery = 'SELECT * FROM users WHERE id = $1';
        
        db.query(checkQuery, [userId], async (err, checkResult) => {
            if (err) {
                console.error('❌ Erreur vérification utilisateur:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Utilisateur introuvable' });
            }

            // Si email change, vérifier qu'il n'est pas déjà utilisé
            if (email && email !== checkResult.rows[0].email) {
                const emailCheckQuery = 'SELECT id FROM users WHERE email = $1 AND id != $2';
                
                const emailCheckResult = await new Promise((resolve, reject) => {
                    db.query(emailCheckQuery, [email, userId], (emailErr, emailResult) => {
                        if (emailErr) reject(emailErr);
                        else resolve(emailResult);
                    });
                });
                
                if (emailCheckResult.rows.length > 0) {
                    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
                }
            }

            let updateQuery;
            let values;

            if (mot_de_passe) {
                // Avec changement de mot de passe
                const hashedPassword = await bcrypt.hash(mot_de_passe, 12);
                updateQuery = `
                    UPDATE users 
                    SET nom = $1, prenom = $2, email = $3, mot_de_passe = $4, updated_at = NOW() 
                    WHERE id = $5 
                    RETURNING id, email, nom, prenom, role, commission_id, service_id, telephone
                `;
                values = [nom, prenom, email, hashedPassword, userId];
            } else {
                // Sans changement de mot de passe
                updateQuery = `
                    UPDATE users 
                    SET nom = $1, prenom = $2, email = $3, updated_at = NOW() 
                    WHERE id = $4 
                    RETURNING id, email, nom, prenom, role, commission_id, service_id, telephone
                `;
                values = [nom, prenom, email, userId];
            }

            db.query(updateQuery, values, (updateErr, result) => {
                if (updateErr) {
                    console.error('❌ Erreur updateProfile:', updateErr);
                    return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
                }

                console.log('✅ Profil mis à jour avec succès');

                res.json({
                    message: 'Profil mis à jour avec succès',
                    user: result.rows[0]
                });
            });
        });

    } catch (error) {
        console.error('❌ Erreur updateProfile:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ======================
// FONCTIONS UTILITAIRES
// ======================

const generateValidationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// ======================
// MOT DE PASSE TEMPORAIRE
// ======================
export const sendTemporaryPassword = async (req, res) => {
    try {
        const { type, target } = req.body;
        console.log(`📥 Demande mot de passe temporaire - Type: ${type}, Target: ${target}`);

        if (!type || !target) {
            return res.status(400).json({ error: 'Type et cible requis' });
        }

        if (type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(target)) {
                return res.status(400).json({ error: 'Adresse email invalide' });
            }
        } else if (type === 'sms') {
            const phoneRegex = /^(\+229)?[0-9]{8,}$/;
            if (!phoneRegex.test(target.replace(/\s/g, ''))) {
                return res.status(400).json({ error: 'Numéro de téléphone invalide' });
            }
        } else {
            return res.status(400).json({ error: 'Type invalide. Utilisez "email" ou "sms"' });
        }

        const checkField = type === 'email' ? 'email' : 'telephone';
        const checkUser = `SELECT * FROM users WHERE ${checkField} = $1`;
        
        db.query(checkUser, [target], (err, results) => {
            if (err) {
                console.error('❌ Erreur vérification utilisateur pour récupération:', err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }

            if (results.rows.length === 0) {
                return res.status(404).json({ error: 'Aucun compte trouvé avec cette information' });
            }

            const temporaryPassword = generateTemporaryPassword();
            const expiry = Date.now() + 30 * 60 * 1000;

            temporaryPasswords.set(target, {
                password: temporaryPassword,
                expiry,
                used: false,
                userId: results.rows[0].id
            });

            console.log(`✅ Mot de passe temporaire généré pour ${target}`);

            res.json({
                success: true,
                message: 'Mot de passe temporaire envoyé',
                ...(process.env.NODE_ENV === 'development' && { temporaryPassword })
            });
        });

    } catch (error) {
        console.error('❌ Erreur envoi mot de passe temporaire:', error);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
};

export const changeTemporaryPassword = async (req, res) => {
    try {
        const { temporaryPassword, newPassword } = req.body;
        console.log('📥 Demande changement mot de passe temporaire');

        if (!temporaryPassword || !newPassword) {
            return res.status(400).json({ error: 'Mot de passe temporaire et nouveau mot de passe requis' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
        }

        if (temporaryPassword === newPassword) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent du mot de passe temporaire' });
        }

        let foundTarget = null;
        let foundData = null;

        for (const [target, data] of temporaryPasswords.entries()) {
            if (data.password === temporaryPassword && !data.used) {
                if (Date.now() <= data.expiry) {
                    foundTarget = target;
                    foundData = data;
                    break;
                }
            }
        }

        if (!foundTarget) {
            return res.status(400).json({ error: 'Mot de passe temporaire invalide, expiré ou déjà utilisé' });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            const updatePassword = 'UPDATE users SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2';
            
            db.query(updatePassword, [hashedPassword, foundData.userId], (err, result) => {
                if (err) {
                    console.error('❌ Erreur mise à jour mot de passe:', err);
                    return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
                }

                temporaryPasswords.delete(foundTarget);
                console.log(`✅ Mot de passe changé avec succès pour l'utilisateur ID: ${foundData.userId}`);

                res.json({
                    success: true,
                    message: 'Mot de passe changé avec succès'
                });
            });

        } catch (hashError) {
            console.error('❌ Erreur hachage nouveau mot de passe:', hashError);
            return res.status(500).json({ error: 'Erreur lors du traitement du nouveau mot de passe' });
        }

    } catch (error) {
        console.error('❌ Erreur changement mot de passe temporaire:', error);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
};

// ======================
// CODES DE VALIDATION
// ======================
export const sendValidationCode = async (req, res) => {
    try {
        const { type, target } = req.body;
        console.log(`📥 Demande code validation - Type: ${type}, Target: ${target}`);

        if (!type || !target) {
            return res.status(400).json({ error: 'Type et cible requis' });
        }

        if (type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(target)) {
                return res.status(400).json({ error: 'Adresse email invalide' });
            }
        } else if (type === 'sms') {
            const phoneRegex = /^(\+229)?[0-9]{8,}$/;
            if (!phoneRegex.test(target.replace(/\s/g, ''))) {
                return res.status(400).json({ error: 'Numéro de téléphone invalide' });
            }
        } else {
            return res.status(400).json({ error: 'Type invalide. Utilisez "email" ou "sms"' });
        }

        const code = generateValidationCode();
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = Date.now() + 10 * 60 * 1000;

        validationCodes.set(token, {
            code,
            target,
            type,
            expiry
        });

        console.log(`✅ Code de validation généré pour ${target} par ${type}`);

        res.json({
            success: true,
            message: 'Code de validation envoyé',
            token,
            ...(process.env.NODE_ENV === 'development' && { code })
        });

    } catch (error) {
        console.error('❌ Erreur envoi code de validation:', error);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
};

export const validateCode = async (req, res) => {
    try {
        const { token, code } = req.body;
        console.log('📥 Validation code');

        if (!token || !code) {
            return res.status(400).json({ error: 'Token et code requis' });
        }

        const validationData = validationCodes.get(token);

        if (!validationData) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        if (Date.now() > validationData.expiry) {
            validationCodes.delete(token);
            return res.status(400).json({ error: 'Code expiré' });
        }

        if (validationData.code !== code) {
            return res.status(400).json({ error: 'Code incorrect' });
        }

        validationCodes.delete(token);
        console.log(`✅ Code validé pour ${validationData.target}`);

        res.json({
            success: true,
            message: 'Code validé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur validation code:', error);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
};

export const resendValidationCode = async (req, res) => {
    try {
        console.log('📥 Demande de renvoi de code de validation');
        return sendValidationCode(req, res);
    } catch (error) {
        console.error('❌ Erreur renvoi code:', error);
        res.status(500).json({ error: 'Erreur serveur interne' });
    }
};

export const forgetPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ code: "error", message: "Champs email manquant" });
        }

        db.query("SELECT * FROM users WHERE email=$1", [email], async (err, result) => {
            if (err) {
                return res.status(404).json({ message : "Utilisateur non trouvé"})
            }

            if (!result) {
                return res.status(404).json({ message : "Utilisateur non trouvé"})
            }
            
            console.log(result.rows[0].email)

            const emailToken = jwt.sign(
                { id: result.rows[0].id, email: result.rows[0].email },
                process.env.EMAIL_SECRET || "emailsecretkey",
                { expiresIn: "10m" }
            );
            const confirmUrl = `http://localhost:3000/newPassword/${emailToken}`; 
            
            await forgotPasswordEmailTemplate(
                result.rows[0].email,
                `${result.rows[0].prenom} ${result.rows[0].nom}`,
                confirmUrl
            );

            return res.status(201).json({ code: "succes", message: "Email envoyé" });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ code: "error", message: "Erreur serveur" });
    }
}

export const checkForgotPasswordToken = async (req, res) => {
    const { token } = req.params 
    try {
        const checkToken = jwt.verify(token, process.env.EMAIL_SECRET || "emailsecretkey")
        res.status(404).sendFile(path.join(templatesPath, '../../public/templates/new-password.html'), err => {
            if (err) {
                console.error('Erreur lors de la lecture de 404.html:', err);
                res.status(404).send('Page non trouvée');
            }
        });
    } catch(err) {
        console.log(err)
        res.status(404).sendFile(path.join(templatesPath, '../../public/templates/404.html'), err => {
            if (err) {
                console.error('Erreur lors de la lecture de 404.html:', err);
                res.status(404).send('Page non trouvée');
            }
        });
    }  
}

export const updatePassword = async (req, res) => {
    const { token } = req.params 
    const { password } = req.body
    try {
        const checkToken = jwt.verify(token, process.env.EMAIL_SECRET || "emailsecretkey")

        db.query("SELECT * FROM users WHERE email=$1", [checkToken.email], async (err, result) => {
            if (err) {
                return res.status(404).json({ message : "Utilisateur non trouvé"})
            }

            if (!result) {
                return res.status(404).json({ message : "Utilisateur non trouvé"})
            }
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            db.query("UPDATE users SET mot_de_passe=$1 WHERE email=$2", [hashedPassword, checkToken.email], async (err, result) => {
                if (err) {
                    console.log(err)
                    return res.status(404).json({ message : "Utilisateur non trouvé"})
                }

                if (!result) {
                    return res.status(404).json({ message : "Utilisateur non trouvé"})
                }
            
                return res.status(201).json({ code: "success", message: "Mot de passe modifié avec succès" });
            });
        });

        // res.status(404).sendFile(path.join(templatesPath, '../../public/templates/new-password.html'), err => {
        //     if (err) {
        //         console.error('Erreur lors de la lecture de 404.html:', err);
        //         res.status(404).send('Page non trouvée');
        //     }
        // });
    } catch(err) {
        console.log(err)
        res.status(404).sendFile(path.join(templatesPath, '../../public/templates/404.html'), err => {
            if (err) {
                console.error('Erreur lors de la lecture de 404.html:', err);
                res.status(404).send('Page non trouvée');
            }
        });
    }  
}
