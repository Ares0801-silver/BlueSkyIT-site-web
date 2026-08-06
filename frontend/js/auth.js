// ============================================================
// Authentification espace client — appels API + validation UX
// La sécurité réelle (hachage, sessions) est gérée côté serveur
// ============================================================

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setRowError(rowId, hasError) {
  const row = document.getElementById(rowId);
  if (row) row.classList.toggle('invalid', hasError);
}

function showAlert(type, message) {
  const box = document.getElementById('formAlert');
  if (!box) return;
  box.className = `form-alert ${type}`;
  box.textContent = message;
}

// ---------- Connexion ----------
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    let valid = true;
    setRowError('row-email', !isValidEmail(email));
    if (!isValidEmail(email)) valid = false;
    setRowError('row-password', password.length === 0);
    if (password.length === 0) valid = false;
    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion…';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        window.location.href = 'espace-client.html';
      } else {
        // Message volontairement générique : ne pas révéler si l'email existe ou non
        showAlert('error', data.error || 'Identifiants incorrects.');
      }
    } catch (err) {
      showAlert('error', 'Impossible de contacter le serveur.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
    }
  });
}

// ---------- Inscription ----------
function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const submitBtn = document.getElementById('submitBtn');
  const pwBar = document.getElementById('pwBar');

  form.password.addEventListener('input', () => {
    const score = passwordScore(form.password.value);
    const pct = (score / 4) * 100;
    const colors = ['#C0392B', '#C0392B', '#E0A030', '#3E9BDB', '#1E8A5F'];
    pwBar.style.width = pct + '%';
    pwBar.style.background = colors[score];
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const password2 = form.password2.value;
    const consent = form.consent.checked;

    let valid = true;
    setRowError('row-name', name.length < 2);
    if (name.length < 2) valid = false;

    setRowError('row-email', !isValidEmail(email));
    if (!isValidEmail(email)) valid = false;

    setRowError('row-password', password.length < 10);
    if (password.length < 10) valid = false;

    setRowError('row-password2', password !== password2);
    if (password !== password2) valid = false;

    setRowError('row-consent', !consent);
    if (!consent) valid = false;

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Création du compte…';

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, consent }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        window.location.href = 'espace-client.html';
      } else {
        showAlert('error', data.error || 'Impossible de créer le compte.');
      }
    } catch (err) {
      showAlert('error', 'Impossible de contacter le serveur.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Créer mon compte';
    }
  });
}

// ---------- Protection de l'espace client ----------
async function guardDashboard() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) {
      window.location.href = 'connexion.html';
      return;
    }
    const data = await res.json();
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    if (nameEl) nameEl.textContent = data.name || 'client';
    if (emailEl) emailEl.textContent = data.email || '';
  } catch (err) {
    window.location.href = 'connexion.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
      window.location.href = 'connexion.html';
    });
  }
}
