// ============================================================
// BLUE SKY IT — Composants partagés (header / footer / menu)
// ============================================================

function renderHeader(active) {
  const links = [
    { href: 'index.html', label: 'Accueil', key: 'accueil' },
    { href: 'a-propos.html', label: 'À propos', key: 'apropos' },
    { href: 'services.html', label: 'Services', key: 'services' },
    { href: 'contact.html', label: 'Contact', key: 'contact' },
  ];

  const linkHtml = links.map(l =>
    `<li><a href="${l.href}" class="${active === l.key ? 'active' : ''}">${l.label}</a></li>`
  ).join('');

  return `
  <header class="site-header">
    <div class="header-inner">
      <a href="index.html" class="brand">
        <img src="assets/logo.png" alt="Blue Sky IT" style="height:34px;object-fit:contain;object-position:left;width:150px;">
      </a>
      <button class="menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false" id="menuToggle">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links" id="navLinks">
        ${linkHtml}
        <li><a href="connexion.html" class="nav-cta">Espace client</a></li>
      </ul>
    </div>
  </header>`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <img src="assets/logo.png" alt="Blue Sky IT">
          </div>
          <p style="max-width:32ch;color:#8CA3B8;font-size:0.9rem;">
            Programmation, analyse-conception et conseil de gestion informatique, entre le Maroc et la France.
          </p>
        </div>
        <div>
          <h4>Navigation</h4>
          <ul>
            <li><a href="index.html">Accueil</a></li>
            <li><a href="a-propos.html">À propos</a></li>
            <li><a href="services.html">Services</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Légal</h4>
          <ul>
            <li><a href="mentions-legales.html">Mentions légales</a></li>
            <li><a href="politique-confidentialite.html">Politique de confidentialité</a></li>
            <li><a href="connexion.html">Espace client</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${year} Blue Sky IT — SARL AU. Tous droits réservés.</span>
        <span>Casablanca, Maroc</span>
      </div>
    </div>
  </footer>`;
}

function mountLayout(active) {
  const headerMount = document.getElementById('header-mount');
  const footerMount = document.getElementById('footer-mount');
  if (headerMount) headerMount.outerHTML = renderHeader(active);
  if (footerMount) footerMount.outerHTML = renderFooter();

  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('navLinks');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
}

// Point d'entrée backend — à adapter selon l'environnement de déploiement
const API_BASE = window.API_BASE || 'http://localhost:3000/api';
