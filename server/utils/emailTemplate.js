import { sendEmail } from './emailService.js'

export const forgotPasswordEmailTemplate = async (email, fullName, url) => {
    await sendEmail({
        to: email,
        subject: "Modifier votre mot de passe",
        text: `Bonjour ${fullName}, suivez ce lien pour modifier votre mot de passe valable pendant 1 minute: ${url}`,
        html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Réinitialisation du mot de passe</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .header {
      background-color: #004aad;
      color: #fff;
      text-align: center;
      padding: 25px 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 25px;
      line-height: 1.6;
    }
    .content h2 {
      color: #004aad;
      margin-bottom: 15px;
      font-size: 20px;
    }
    .button {
      display: inline-block;
      background-color: #004aad;
      color: #fff !important;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 8px;
      margin-top: 20px;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 13px;
      color: #999;
      background-color: #fafafa;
      border-top: 1px solid #eee;
    }
    @media (max-width: 600px) {
      .content, .header, .footer {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Réinitialisation du mot de passe</h1>
    </div>

    <div class="content">
      <h2>Bonjour ${fullName},</h2>
      <p>Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte <strong>MCM</strong>.</p>
      <p>Veuillez cliquer sur le bouton ci-dessous pour modifier votre mot de passe. Ce lien est valable pendant <strong>1 minute</strong>.</p>

      <p style="text-align: center;">
        <a href="${url}" class="button" target="_blank">Modifier mon mot de passe</a>
      </p>

      <p>Si vous n'avez pas fait cette demande, ignorez simplement cet e-mail. Votre mot de passe restera inchangé.</p>

      <p style="margin-top: 30px;">Cordialement,<br>L’équipe MCM 💼</p>
    </div>

    <div class="footer">
      <p>&copy; 2025 MCM. Tous droits réservés.</p>
      <p>Ne répondez pas directement à cet e-mail automatique.</p>
    </div>
  </div>
</body>
</html>`
    });
}
