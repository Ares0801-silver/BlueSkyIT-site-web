// ============================================================
// Route — POST /api/contact
// ============================================================
const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { contactLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// IP hachée (jamais stockée en clair) — utilisée uniquement pour repérer les abus
function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip)).digest('hex');
}

router.post(
  '/',
  contactLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).escape(),
    body('email').trim().isEmail().normalizeEmail().isLength({ max: 150 }),
    body('company').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).escape(),
    body('message').trim().isLength({ min: 10, max: 2000 }).escape(),
    body('consent').isBoolean().custom((v) => v === true),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Merci de vérifier les champs du formulaire.' });
    }

    const { name, email, company, message, consent } = req.body;
    if (!consent) {
      return res.status(400).json({ error: 'Le consentement est requis.' });
    }

    const ipHash = hashIp(req.ip);

    try {
      const stmt = db.prepare(`
        INSERT INTO contact_messages (name, email, company, message, consent_at, ip_hash)
        VALUES (?, ?, ?, ?, datetime('now'), ?)
      `);
      stmt.run(name, email, company || null, message, ipHash);

      // NOTE DÉPLOIEMENT : brancher ici un envoi d'e-mail (ex: nodemailer, Resend, SendGrid)
      // pour notifier l'équipe Blue Sky IT d'un nouveau message.

      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('Erreur enregistrement message de contact :', err);
      return res.status(500).json({ error: 'Une erreur est survenue. Merci de réessayer.' });
    }
  }
);

module.exports = router;
