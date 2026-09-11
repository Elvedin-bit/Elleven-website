/**
 * Contactformulier.
 *
 * De inzending gaat naar Netlify Forms. Netlify herkent het formulier door de
 * HTML bij elke build te scannen, dus de opbouw in index.html — het attribuut
 * data-netlify, het verborgen veld form-name, het honeypot-veld en de veldnamen
 * naam/email/telefoon/pakket/bericht — moet ongewijzigd blijven. Verandert daar
 * iets aan, dan stopt de herkenning zonder foutmelding en verdwijnen aanvragen
 * in het niets. De netlify-functie submission-created.js hangt aan diezelfde
 * veldnamen voor de bevestigingsmail.
 */

export function initForm() {
  const pakketSelect = document.getElementById('pakket');
  const form = document.getElementById('contact-form');

  // De knoppen bij de pakketten vullen alvast de juiste keuze in het formulier in.
  document.querySelectorAll('.pakket-cta').forEach((btn) => {
    btn.addEventListener('click', () => {
      const keuze = btn.getAttribute('data-pakket');
      if (!pakketSelect || !keuze) return;
      const opt = Array.from(pakketSelect.options).find((o) => o.value === keuze);
      if (opt) pakketSelect.value = keuze;
    });
  });

  if (!form) return;

  const formStatus = document.getElementById('form-status');
  const submitButton = form.querySelector('button[type="submit"]');

  function toonStatus(bericht, isFout) {
    if (!formStatus) return;
    formStatus.textContent = bericht;
    formStatus.classList.remove('hidden');
    formStatus.classList.toggle('form-status-error', Boolean(isFout));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    if (submitButton) submitButton.disabled = true;

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    })
      .then((response) => {
        // BELANGRIJK: fetch() weigert alleen bij een netwerkfout. Een 404 of 500
        // van Netlify — bijvoorbeeld wanneer de formulierherkenning stilvalt na
        // een aanpassing aan de markup — komt hier gewoon als een 'geslaagde'
        // respons binnen. Zonder deze controle zou de bezoeker een bevestiging
        // zien terwijl de aanvraag nergens aankomt.
        if (!response.ok) {
          throw new Error('Netlify gaf status ' + response.status);
        }
        toonStatus('Bedankt! Uw aanvraag is verstuurd, we nemen snel contact op.', false);
        form.reset();
      })
      .catch(() => {
        toonStatus(
          'Er ging iets mis bij het versturen. Probeer het opnieuw of mail ons rechtstreeks op info@e11even.be.',
          true
        );
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
      });
  });
}
