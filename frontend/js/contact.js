// ============================================================
// Formulaire de contact — validation côté client + appel API
// NB : la validation client est un confort UX, la validation
// réelle et la sécurité sont assurées côté serveur (routes/contact.js)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const alertBox = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');

  function setError(rowId, hasError) {
    const row = document.getElementById(rowId);
    row.classList.toggle('invalid', hasError);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    let valid = true;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const consent = form.consent.checked;

    setError('row-name', name.length < 2);
    if (name.length < 2) valid = false;

    setError('row-email', !isValidEmail(email));
    if (!isValidEmail(email)) valid = false;

    setError('row-message', message.length < 10);
    if (message.length < 10) valid = false;

    setError('row-consent', !consent);
    if (!consent) valid = false;

    return valid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.className = 'form-alert';
    alertBox.textContent = '';

    if (!validate()) return;

    // Honeypot rempli => probable bot, on abandonne silencieusement
    if (form.website.value.trim() !== '') {
      alertBox.className = 'form-alert success';
      alertBox.textContent = 'Votre message a bien été envoyé.';
      form.reset();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          company: form.company.value.trim(),
          message: form.message.value.trim(),
          consent: form.consent.checked,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alertBox.className = 'form-alert success';
        alertBox.textContent = 'Merci, votre message a bien été envoyé. Nous revenons vers vous rapidement.';
        form.reset();
      } else {
        alertBox.className = 'form-alert error';
        alertBox.textContent = data.error || 'Une erreur est survenue. Merci de réessayer.';
      }
    } catch (err) {
      alertBox.className = 'form-alert error';
      alertBox.textContent = 'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer le message';
    }
  });
});
