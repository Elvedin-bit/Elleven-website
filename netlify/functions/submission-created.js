// Netlify roept deze functie automatisch aan bij elke nieuwe inzending van
// een formulier op de site — dat gebeurt puur op basis van de bestandsnaam
// "submission-created", er is geen extra webhook-configuratie nodig.
//
// Doel: de bezoeker die het contactformulier invult automatisch een korte
// bevestigingsmail sturen ("uw aanvraag is ontvangen"), naast de interne
// meldingen naar info@e11even.be / Gmail die al via Netlify Form notifications
// lopen.
//
// Vereist in Netlify (Site configuration -> Environment variables):
//   RESEND_API_KEY      - API-sleutel van resend.com (verplicht)
//   RESEND_FROM_EMAIL   - bv. "Elleven <info@e11even.be>" (optioneel; zonder
//                          deze variabele wordt Resend's test-adres gebruikt,
//                          wat prima werkt maar minder professioneel oogt)

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const payload = body.payload || {};
    const data = payload.data || {};

    const email = data.email;
    const naam = (data.naam || '').trim() || 'daar';

    // Alleen reageren op inzendingen van het contactformulier mét een e-mailadres.
    if (payload.form_name !== 'contact' || !email) {
      return { statusCode: 200, body: 'Genegeerd: geen contactformulier of geen e-mailadres.' };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY ontbreekt in de omgevingsvariabelen — bevestigingsmail niet verstuurd.');
      return { statusCode: 200, body: 'RESEND_API_KEY ontbreekt.' };
    }

    const from = process.env.RESEND_FROM_EMAIL || 'Elleven <onboarding@resend.dev>';

    const html = `
      <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c1c1e; line-height: 1.6;">
        <p style="font-size: 16px;">Beste ${escapeHtml(naam)},</p>
        <p style="font-size: 15px;">
          Bedankt voor uw aanvraag via de website van Elleven. Uw bericht is goed aangekomen
          en we nemen zo snel mogelijk contact met u op om een gratis, vrijblijvende kennismaking in te plannen.
        </p>
        <p style="font-size: 15px;">
          Liever meteen contact? Stuur gerust een WhatsApp-bericht via
          <a href="https://wa.me/32486734845" style="color:#0aa06e; text-decoration:none;">+32 486 73 48 45</a>
          of mail naar <a href="mailto:info@e11even.be" style="color:#0aa06e; text-decoration:none;">info@e11even.be</a>.
        </p>
        <p style="font-size: 15px; margin-top: 24px;">
          Met vriendelijke groeten,<br />
          Elleven &mdash; Website &amp; Automatisering
        </p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Bedankt voor uw aanvraag — Elleven',
        html,
      }),
    });

    if (!res.ok) {
      console.error('Resend gaf een foutstatus terug:', res.status, await res.text());
      return { statusCode: 200, body: 'Resend-fout gelogd, formulier bleef wel werken.' };
    }

    return { statusCode: 200, body: 'Bevestigingsmail verstuurd.' };
  } catch (err) {
    console.error('Onverwachte fout in submission-created functie:', err);
    // Altijd 200 teruggeven: een fout hier mag de formulierinzending zelf nooit blokkeren.
    return { statusCode: 200, body: 'Fout gelogd.' };
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
