/**
 * Scroll-animaties met GSAP ScrollTrigger.
 *
 * Dit is de plek waar het redesign verder wordt uitgebouwd. De opzet is bewust
 * gescheiden in twee lagen:
 *
 *   1. toonAlles()  — de vangnetfunctie. Kan altijd worden aangeroepen en zet
 *                     alle inhoud onmiddellijk zichtbaar.
 *   2. de animaties — draaien alleen wanneer GSAP daadwerkelijk geladen is én de
 *                     bezoeker beweging niet heeft afgeraden.
 *
 * Waarom die scheiding: elementen met .reveal starten in CSS onzichtbaar. Gaat
 * er iets mis in deze laag, dan moet de pagina alsnog leesbaar zijn in plaats
 * van leeg te blijven. Vandaar dat elke uitvalsweg op toonAlles() uitkomt.
 *
 * De hero doet hier bewust niet aan mee: die animeert via pure CSS, zodat de
 * belangrijkste tekst van de pagina niet op JavaScript hoeft te wachten.
 */

const VERTRAGINGEN = { d1: 0.08, d2: 0.16, d3: 0.24, d4: 0.32 };

/** Zet alle animeerbare elementen ineens zichtbaar. Altijd veilig aan te roepen. */
export function toonAlles() {
  // Ook .anim-verborgen: dat is de markering die js/secties.js zet op alles wat
  // het zelf onzichtbaar maakt, zodat één vangnet voor beide systemen volstaat.
  document.querySelectorAll('.reveal, .anim-verborgen').forEach((el) => {
    el.classList.remove('anim-verborgen');
    el.classList.add('in-view');
    // Eventuele door GSAP achtergelaten inline-stijlen weghalen, anders winnen
    // die het van de klasse hierboven en blijft het element alsnog onzichtbaar.
    el.style.opacity = '';
    el.style.transform = '';
  });
}

function vertragingVan(el) {
  for (const klasse in VERTRAGINGEN) {
    if (el.classList.contains(klasse)) return VERTRAGINGEN[klasse];
  }
  return 0;
}

export function initReveal() {
  // Elementen met een eigen choreografie in js/secties.js slaan we hier over,
  // anders zouden twee animaties om hetzelfde element vechten.
  const elementen = Array.from(document.querySelectorAll('.reveal')).filter(
    (el) => !el.matches('[data-kop], [data-dienst]') && !el.closest('[data-groep], [data-tijdlijn]')
  );
  if (!elementen.length) return;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  // Geen GSAP beschikbaar: toon alles meteen in plaats van een lege pagina.
  if (!gsap || !ScrollTrigger) {
    toonAlles();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // GSAP houdt zich niet vanzelf aan de bewegingsvoorkeur van het systeem;
  // matchMedia regelt dat hier expliciet, en schakelt ook netjes om wanneer de
  // bezoeker die voorkeur tijdens het bezoek wijzigt.
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: reduce)', () => {
    toonAlles();
  });

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    elementen.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: vertragingVan(el),
          ease: 'power2.out',
          overwrite: 'auto',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });

    // Opruimen wanneer de voorkeur omslaat: laat de inhoud zichtbaar achter.
    return () => toonAlles();
  });

  // Na het laden van lettertypes verschuift de tekst nog licht; de
  // triggerposities moeten dan opnieuw berekend worden.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
  }
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
