const nodemailer = require('nodemailer');

// SMTP is optional so the server still boots before the owner fills in
// EMAIL_HOST / EMAIL_USER / EMAIL_PASS. When unset, sendMail falls back to
// logging the email to the server console (handy for local testing).
const configured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
  : null;

async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    const err = new Error(
      'Email is not configured. Set EMAIL_HOST, EMAIL_USER and EMAIL_PASS in .env to send real emails.'
    );
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `S.L.A Fruit Shop <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
}

module.exports = { sendMail };
