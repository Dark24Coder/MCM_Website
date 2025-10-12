// utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // Pour charger les variables d'environnement

// 🔑 Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  service: 'gmail', // On utilise Gmail ici
  auth: {
    user: process.env.EMAIL_USER, // Ton email depuis le .env
    pass: process.env.EMAIL_PASS  // Mot de passe d'application Gmail
  }
});

/**
 * Envoi d'un email de bienvenue
 * @param {string} to - Email destinataire
 * @param {string} nom - Nom de l'utilisateur
 * @param {string} prenom - Prénom de l'utilisateur
 */
const sendWelcomeEmail = (to, nom, prenom) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Bienvenue sur MCM 🎉',
    text: `Bonjour ${prenom} ${nom},\n\nBienvenue sur notre plateforme MCM. Nous sommes ravis de vous compter parmi nous !\n\nCordialement,\nL’équipe MCM`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error('Erreur envoi email:', err);
    else console.log('✅ Email de bienvenue envoyé: ' + info.response);
  });
};

/**
 * Envoi d'un mot de passe temporaire
 * @param {string} to - Email destinataire
 * @param {string} temporaryPassword - Mot de passe temporaire
 */
const sendTemporaryPasswordEmail = (to, temporaryPassword) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Mot de passe temporaire MCM',
    text: `Voici votre mot de passe temporaire : ${temporaryPassword}\nVeuillez le changer dès que possible après connexion.`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error('Erreur envoi mot de passe temporaire:', err);
    else console.log('✅ Email mot de passe temporaire envoyé: ' + info.response);
  });
};

/**
 * Envoi d'un code de validation (6 chiffres)
 * @param {string} to - Email destinataire
 * @param {string} code - Code de validation
 */
const sendValidationCodeEmail = (to, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Code de validation MCM',
        text: `Votre code de validation est : ${code}\nIl est valable 10 minutes.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Erreur envoi code validation:', err);
        else console.log('✅ Email code validation envoyé: ' + info.response);
    });
};

/**
 * Renvoi du code de validation
 * @param {string} to - Email destinataire
 * @param {string} code - Nouveau code de validation
 */
const resendValidationCodeEmail = (to, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Renvoi du code de validation MCM',
        text: `Voici votre nouveau code de validation : ${code}\nIl est valable 10 minutes.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Erreur renvoi code validation:', err);
        else console.log('✅ Email renvoi code validation envoyé: ' + info.response);
    });
};

module.exports = {
    sendWelcomeEmail,
    sendTemporaryPasswordEmail,
    sendValidationCodeEmail,
    resendValidationCodeEmail
};
