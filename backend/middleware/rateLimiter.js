// ============================================================
// Limiteurs de débit — protègent contre le brute-force et le spam
// ============================================================
const rateLimit = require('express-rate-limit');

// Formulaire de contact : 5 envois / 15 min / IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de messages envoyés. Merci de réessayer plus tard.' },
});

// Connexion : 10 tentatives / 15 min / IP (protège contre le brute-force de mots de passe)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Merci de réessayer plus tard.' },
});

// Inscription : 5 comptes / heure / IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de création de compte. Merci de réessayer plus tard.' },
});

module.exports = { contactLimiter, loginLimiter, registerLimiter };
