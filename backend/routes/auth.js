// ============================================================
// Routes — /api/auth/register, /login, /logout, /me
// ============================================================
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// ---------- Inscription ----------
router.post(
  '/register',
  registerLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).escape(),
    body('email').trim().isEmail().normalizeEmail().isLength({ max: 150 }),
    // Mot de passe : 10 caractères minimum. On n'impose pas de règles de complexité
    // trop strictes (source de mots de passe faibles réutilisés) mais on encourage
    // la longueur, qui est le facteur le plus important.
    body('password').isLength({ min: 10, max: 128 }),
    body('consent').isBoolean().custom((v) => v === true),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Merci de vérifier les champs du formulaire.' });
    }

    const { name, email, password, consent } = req.body;
    if (!consent) {
      return res.status(400).json({ error: 'Le consentement est requis.' });
    }

    try {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        // Message générique pour ne pas confirmer l'existence d'un compte à un tiers
        return res.status(400).json({ error: 'Impossible de créer le compte avec ces informations.' });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const stmt = db.prepare(`
        INSERT INTO users (name, email, password_hash, consent_at)
        VALUES (?, ?, ?, datetime('now'))
      `);
      const info = stmt.run(name, email, passwordHash);

      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur.' });
        req.session.userId = info.lastInsertRowid;
        return res.status(201).json({ success: true });
      });
    } catch (err) {
      console.error('Erreur inscription :', err);
      return res.status(500).json({ error: 'Une erreur est survenue. Merci de réessayer.' });
    }
  }
);

// ---------- Connexion ----------
router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').isLength({ min: 1, max: 128 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Identifiants incorrects.' });
    }

    const { email, password } = req.body;

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      // Réponse volontairement identique que l'utilisateur existe ou non
      const genericError = { error: 'Identifiants incorrects.' };
      if (!user) return res.status(401).json(genericError);

      // Verrouillage temporaire après plusieurs échecs (anti brute-force ciblé)
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return res.status(423).json({ error: 'Compte temporairement verrouillé. Réessayez plus tard.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        const failedCount = (user.failed_login_count || 0) + 1;
        let lockedUntil = null;
        if (failedCount >= MAX_FAILED_ATTEMPTS) {
          lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000).toISOString();
        }
        db.prepare('UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?')
          .run(failedCount, lockedUntil, user.id);
        return res.status(401).json(genericError);
      }

      // Connexion réussie : réinitialiser le compteur d'échecs
      db.prepare('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?').run(user.id);

      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: 'Erreur serveur.' });
        req.session.userId = user.id;
        return res.json({ success: true });
      });
    } catch (err) {
      console.error('Erreur connexion :', err);
      return res.status(500).json({ error: 'Une erreur est survenue. Merci de réessayer.' });
    }
  }
);

// ---------- Déconnexion ----------
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ---------- Session actuelle ----------
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Non authentifié.' });
  res.json(user);
});

module.exports = router;
