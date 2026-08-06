// ============================================================
// BLUE SKY IT — Serveur backend
// ============================================================
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');

const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Nécessaire si déployé derrière un proxy (Nginx, Render, etc.) pour que
// req.ip et les cookies "secure" fonctionnent correctement.
app.set('trust proxy', 1);

// ---------- Sécurité HTTP de base ----------
app.use(helmet());

// ---------- CORS — n'autorise que le frontend déclaré ----------
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5500',
    credentials: true,
  })
);

// ---------- Parsing JSON (taille limitée pour éviter les abus) ----------
app.use(express.json({ limit: '20kb' }));

// ---------- Sessions ----------
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'change_this_to_a_long_random_value') {
  if (isProd) {
    throw new Error('SESSION_SECRET doit être défini avec une vraie valeur secrète en production.');
  }
  console.warn('[AVERTISSEMENT] SESSION_SECRET par défaut utilisé — à changer avant la mise en production.');
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_only_secret_do_not_use_in_prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true', // true obligatoire en production (HTTPS)
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 heures
    },
  })
);

// ---------- Routes API ----------
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---------- Gestion des routes inconnues ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

// ---------- Gestion centralisée des erreurs ----------
// Empêche toute fuite de détails techniques (stack trace, etc.) vers le client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Une erreur interne est survenue.' });
});

app.listen(PORT, () => {
  console.log(`Blue Sky IT backend démarré sur http://localhost:${PORT}`);
});
