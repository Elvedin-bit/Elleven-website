/**
 * Micro-interacties: de cursorring en de magnetische knoppen.
 *
 * EEN KEUZE DIE UITLEG VERDIENT — DE NATIVE CURSOR BLIJFT STAAN.
 * De gebruikelijke bureau-truc is de systeemcursor verbergen en er een eigen
 * vorm voor in de plaats tekenen. Dat doen we hier bewust niet:
 *
 *   - Een nagetekende cursor loopt per definitie achter op de echte muispositie.
 *     Je maakt daarmee precies datgene trager dat het gevoeligst is voor
 *     vertraging. Op een site die bezoekers naar een formulier of een
 *     WhatsApp-knop moet leiden werkt dat tegen het doel in.
 *   - Wie zijn cursor in Windows of macOS heeft vergroot of op hoog contrast
 *     heeft staan, doet dat om een reden. Die instelling overrulen is geen
 *     stijlkeuze maar een toegankelijkheidsprobleem.
 *   - Tekstvelden hebben een tekstcursor nodig, uitgeschakelde knoppen een
 *     verbodsteken. Dat allemaal nabouwen levert niets op en gaat ergens stuk.
 *
 * Wat we wél doen: een zachte ring die de cursor volgt en reageert op wat
 * eronder ligt. Het premium-gevoel zonder de precisie op te offeren. Wil je
 * alsnog de volledige vervanging, dan is VERBERG_NATIVE_CURSOR de enige knop
 * die om moet — maar lees eerst het bovenstaande.
 */

const VERBERG_NATIVE_CURSOR = false;

const MUIS = '(hover: hover) and (pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)';

// Elementen waarboven de ring groeit: alles waar je op kunt klikken.
const KLIKBAAR = 'a[href], button, summary, [role="button"]';
// Elementen waar de ring juist wegmoet: daar hoort de tekstcursor het beeld te bepalen.
const TEKSTVELD = 'input, textarea, select';

export function initMicro() {
  const gsap = window.gsap;
  if (!gsap) return;

  const mm = gsap.matchMedia();

  /* ==================================================== cursorring ====== */

  mm.add(MUIS, () => {
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    if (VERBERG_NATIVE_CURSOR) document.documentElement.classList.add('cursor-verborgen');

    // quickTo: één herbruikbare setter in plaats van bij elke muisbeweging een
    // nieuwe tween. De ring loopt bewust een fractie achter — dat is wat hem
    // vloeiend laat aanvoelen — maar de echte cursor blijft er los van staan.
    const naarX = gsap.quickTo(ring, 'x', { duration: 0.32, ease: 'power3' });
    const naarY = gsap.quickTo(ring, 'y', { duration: 0.32, ease: 'power3' });

    let geplaatst = false;
    function opMuis(e) {
      if (!geplaatst) {
        // Eerste keer zonder animatie neerzetten, anders schiet de ring vanuit
        // de linkerbovenhoek het scherm in.
        gsap.set(ring, { x: e.clientX, y: e.clientY });
        ring.classList.add('cursor-ring-aan');
        geplaatst = true;
        return;
      }
      naarX(e.clientX);
      naarY(e.clientY);
    }

    function schaal(naar) {
      gsap.to(ring, { scale: naar, duration: 0.32, ease: 'power3.out', overwrite: 'auto' });
    }

    // Eén luisteraar op het document in plaats van één per knop: die vuurt
    // alleen bij het passeren van een elementgrens, niet bij elke beweging.
    function opOver(e) {
      const doel = e.target instanceof Element ? e.target : null;
      if (!doel) return;
      if (doel.closest(TEKSTVELD)) { ring.classList.add('cursor-ring-uit'); return; }
      ring.classList.remove('cursor-ring-uit');
      if (doel.closest(KLIKBAAR)) {
        ring.classList.add('cursor-ring-actief');
        schaal(1.9);
      }
    }

    function opUit(e) {
      const doel = e.target instanceof Element ? e.target : null;
      if (doel && doel.closest(TEKSTVELD)) ring.classList.remove('cursor-ring-uit');
      if (doel && doel.closest(KLIKBAAR)) {
        ring.classList.remove('cursor-ring-actief');
        schaal(1);
      }
    }

    const verlaat = () => ring.classList.remove('cursor-ring-aan');
    const keerTerug = () => { if (geplaatst) ring.classList.add('cursor-ring-aan'); };

    window.addEventListener('mousemove', opMuis, { passive: true });
    document.addEventListener('mouseover', opOver, { passive: true });
    document.addEventListener('mouseout', opUit, { passive: true });
    document.addEventListener('mouseleave', verlaat);
    document.addEventListener('mouseenter', keerTerug);

    return () => {
      window.removeEventListener('mousemove', opMuis);
      document.removeEventListener('mouseover', opOver);
      document.removeEventListener('mouseout', opUit);
      document.removeEventListener('mouseleave', verlaat);
      document.removeEventListener('mouseenter', keerTerug);
      document.documentElement.classList.remove('cursor-verborgen');
      ring.remove();
    };
  });

  /* ============================================ magnetische knoppen ===== */

  mm.add(MUIS, () => {
    const knoppen = Array.from(document.querySelectorAll('[data-magnetisch]'));
    if (!knoppen.length) return;

    const opruimers = knoppen.map((knop) => {
      const naarX = gsap.quickTo(knop, 'x', { duration: 0.45, ease: 'power3.out' });
      const naarY = gsap.quickTo(knop, 'y', { duration: 0.45, ease: 'power3.out' });

      function beweeg(e) {
        const r = knop.getBoundingClientRect();
        // Hooguit een paar pixels: de knop komt naar je toe in plaats van dat je
        // hem moet najagen. Meer uitslag maakt aanklikken juist moeilijker.
        naarX(((e.clientX - (r.left + r.width / 2)) / r.width) * 14);
        naarY(((e.clientY - (r.top + r.height / 2)) / r.height) * 10);
      }
      function terug() { naarX(0); naarY(0); }

      knop.addEventListener('mousemove', beweeg);
      knop.addEventListener('mouseleave', terug);
      knop.addEventListener('blur', terug);

      return () => {
        knop.removeEventListener('mousemove', beweeg);
        knop.removeEventListener('mouseleave', terug);
        knop.removeEventListener('blur', terug);
        gsap.set(knop, { x: 0, y: 0 });
      };
    });

    return () => opruimers.forEach((fn) => fn());
  });
}
