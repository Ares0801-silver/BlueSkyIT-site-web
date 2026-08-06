# Blue Sky IT — Site web

Projet complet : site vitrine + espace client sécurisé, pour BLUE SKY IT (SARL AU).

## Structure du projet

```
blueskyit/
├── frontend/          Site statique (HTML/CSS/JS, aucune compilation nécessaire)
│   ├── index.html, a-propos.html, services.html, contact.html
│   ├── connexion.html, inscription.html, espace-client.html
│   ├── mentions-legales.html, politique-confidentialite.html
│   ├── css/style.css
│   └── js/ (main.js, contact.js, auth.js)
└── backend/            API Node.js / Express (contact + authentification)
    ├── server.js
    ├── routes/ (contact.js, auth.js)
    ├── middleware/ (auth.js, rateLimiter.js)
    └── db/ (init.js — base SQLite, créée automatiquement au démarrage)
```

## ⚠️ À compléter avant mise en ligne

Le contenu contient des indications `à confirmer` / `à compléter` (badges jaunes sur le
site) à remplacer par les vraies informations légales avant publication :

- Adresse du siège social
- Numéro de Registre du Commerce (RC)
- Identifiant Commun de l'Entreprise (ICE)
- Adresse e-mail professionnelle définitive
- Nom et coordonnées de l'hébergeur (une fois choisi)

Ces champs se trouvent dans `frontend/mentions-legales.html`, `politique-confidentialite.html`
et `contact.html`.

---

## Démarrer le projet en local

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Puis ouvrir `.env` et :
- Générer un vrai `SESSION_SECRET` avec :
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- Ajuster `FRONTEND_ORIGIN` selon l'adresse d'où le site sera servi.

Démarrer le serveur :
```bash
npm start
```
Le backend écoute par défaut sur `http://localhost:3000`. Une base SQLite
(`db/blueskyit.db`) est créée automatiquement au premier lancement.

### 2. Frontend

Le frontend est 100% statique : ouvrir `frontend/index.html` dans un navigateur,
ou le servir avec un petit serveur local, par exemple :
```bash
cd frontend
npx serve .
```

Si le frontend n'est pas servi sur `http://localhost:5500` (valeur par défaut de
`FRONTEND_ORIGIN`), modifier soit le `.env` du backend, soit la variable
`API_BASE` en haut de `frontend/js/main.js`.

---

## Déploiement en production — points de sécurité obligatoires

Avant de mettre le site en ligne pour de vrai, vérifier impérativement :

1. **HTTPS activé** sur le nom de domaine (ex : Let's Encrypt / certificat de l'hébergeur).
2. Dans `.env` :
   - `NODE_ENV=production`
   - `COOKIE_SECURE=true` (sinon les cookies de session ne seront pas protégés)
   - `SESSION_SECRET` = valeur aléatoire longue, différente de celle de test
   - `FRONTEND_ORIGIN` = l'URL exacte du site en production
3. Le fichier `.env` ne doit **jamais** être commité dans Git (déjà exclu si vous
   utilisez un `.gitignore` standard Node — sinon, l'ajouter).
4. Sauvegarder régulièrement le fichier `backend/db/blueskyit.db` (il contient les
   comptes clients et les messages reçus).
5. Brancher un vrai envoi d'e-mail pour le formulaire de contact — actuellement le
   message est stocké en base mais aucun e-mail n'est envoyé à l'équipe. Voir le
   commentaire `NOTE DÉPLOIEMENT` dans `backend/routes/contact.js` (solutions
   possibles : Nodemailer + un fournisseur SMTP, ou une API comme Resend/SendGrid).
6. Compléter les mentions légales avec les vraies données (voir section précédente).

## Sécurité déjà en place

- Mots de passe hachés avec bcrypt (jamais stockés en clair)
- Sessions signées, cookies `httpOnly` + `sameSite=lax` (+ `secure` en prod)
- Verrouillage temporaire d'un compte après 5 échecs de connexion
- Limitation de débit sur le formulaire de contact, la connexion et l'inscription
  (protection anti-spam / anti brute-force)
- Validation et échappement de toutes les entrées utilisateur côté serveur
  (protection contre les injections et le XSS) — la validation côté client dans
  le navigateur est un confort, pas une protection en soi
- En-têtes de sécurité HTTP via Helmet
- CORS restreint à l'origine du frontend déclarée en configuration
- Aucune donnée sensible collectée ; adresses IP jamais stockées en clair (seulement hachées, à des fins anti-abus)
- Contenu conforme RGPD (UE) et loi marocaine 09-08 : consentement explicite,
  politique de confidentialité, droits d'accès/rectification/suppression détaillés

## Ce qui reste à faire pour une V2 (espace client)

Actuellement l'espace client affiche un tableau de bord minimal (nom, email,
statut). Pour aller plus loin (suivi des demandes de maintenance, factures, etc.),
il faudra définir précisément les données à afficher et étendre le schéma de la
base de données en conséquence.
