// server/utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Envoi d'un email de bienvenue
 * @param {string} to - Email destinataire
 * @param {string} nom - Nom de l'utilisateur
 * @param {string} prenom - Prénom de l'utilisateur
 */
export const sendWelcomeEmail = (to, nom, prenom) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Bienvenue sur MCM 🎉',
    text: `Bonjour ${prenom} ${nom},\n\nBienvenue sur notre plateforme MCM. Nous sommes ravis de vous compter parmi nous !\n\nCordialement,\nL'équipe MCM`,
    html: `
      <h2>Bienvenue sur MCM 🎉</h2>
      <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
      <p>Bienvenue sur notre plateforme MCM. Nous sommes ravis de vous compter parmi nous !</p>
      <p>Cordialement,<br>L'équipe MCM</p>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ Erreur envoi email bienvenue:', err);
    } else {
      console.log('✅ Email de bienvenue envoyé à:', to);
    }
  });
};

/**
 * Envoi d'un mot de passe temporaire
 * @param {string} to - Email destinataire
 * @param {string} temporaryPassword - Mot de passe temporaire
 */
export const sendTemporaryPasswordEmail = (to, temporaryPassword) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Mot de passe temporaire MCM',
    text: `Voici votre mot de passe temporaire : ${temporaryPassword}\nVeuillez le changer dès que possible après connexion.`,
    html: `
      <h2>Mot de passe temporaire MCM</h2>
      <p>Voici votre mot de passe temporaire :</p>
      <h3 style="background: #f0f0f0; padding: 10px; border-radius: 5px;">${temporaryPassword}</h3>
      <p><strong>Veuillez le changer dès que possible après connexion.</strong></p>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ Erreur envoi mot de passe temporaire:', err);
    } else {
      console.log('✅ Email mot de passe temporaire envoyé à:', to);
    }
  });
};

/**
 * Envoi d'un code de validation
 * @param {string} to - Email destinataire
 * @param {string} code - Code de validation
 */
export const sendValidationCodeEmail = (to, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Code de validation MCM',
    text: `Votre code de validation est : ${code}\nIl est valable 10 minutes.`,
    html: `
      <h2>Code de validation MCM</h2>
      <p>Votre code de validation est :</p>
      <h3 style="background: #f0f0f0; padding: 10px; border-radius: 5px;">${code}</h3>
      <p><small>Il est valable 10 minutes.</small></p>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ Erreur envoi code validation:', err);
    } else {
      console.log('✅ Email code validation envoyé à:', to);
    }
  });
};

/**
 * Renvoi du code de validation
 * @param {string} to - Email destinataire
 * @param {string} code - Nouveau code de validation
 */
export const resendValidationCodeEmail = (to, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Renvoi du code de validation MCM',
    text: `Voici votre nouveau code de validation : ${code}\nIl est valable 10 minutes.`,
    html: `
      <h2>Renvoi du code de validation MCM</h2>
      <p>Voici votre nouveau code de validation :</p>
      <h3 style="background: #f0f0f0; padding: 10px; border-radius: 5px;">${code}</h3>
      <p><small>Il est valable 10 minutes.</small></p>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ Erreur renvoi code validation:', err);
    } else {
      console.log('✅ Email renvoi code validation envoyé à:', to);
    }
  });
};