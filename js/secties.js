/**
 * Scroll-choreografie van de secties.
 *
 * reveal.js zorgt voor de basis: alles met .reveal komt netjes in beeld. Dit
 * bestand tilt dat naar het niveau van een bureau-site voor de onderdelen waar
 * dat wat oplevert — kopteksten die woord voor woord opbouwen, kaarten die in
 * volgorde binnenkomen, een tijdlijn die zich tekent terwijl je scrolt.
 *
 * Aanknopingspunten staan als data-attributen in index.html:
 *   data-kop         kopblok (oogje + titel + alinea) dat gestaffeld opbouwt
 *   data-groep       raster of lijst waarvan de kinderen na elkaar binnenkomen
 *   data-tijdlijn    de werkwijze-tijdlijn, met eigen opbouw
 *   data-sectielijn  sectie die bovenaan een accentlijn laat intekenen
 *
 * Drie regels die dit bestand streng volgt:
 *
 *  1. NIETS BLIJFT VERBORGEN. Elk element dat hier onzichtbaar wordt gezet,
 *     krijgt de klasse .anim-verborgen. Gaat er iets mis, dan maakt toonAlles()
 *     uit reveal.js precies die elementen alsnog zichtbaar. Elke sectie draait
 *     bovendien in zijn eigen foutafscherming, zodat één probleem niet de rest
 *     meesleept.
 *  2. ALLEEN TRANSFORM EN OPACITY. Geen enkele animatie raakt eigenschappen
 *     waarvoor de browser de lay-out opnieuw moet berekenen.
 *  3. EENMALIG, NIET DOORLOPEND. Binnenkomst-animaties spelen één keer
 *     (`once: true`). Alleen de parallax volgt de scrollpositie nog, en die
 *     staat stil zodra jij stilstaat. Nergens wordt een sectie vastgezet
 *     (`pin`) om een animatie af te dwingen — scrollen moet altijd meteen
 *     reageren, ook halverwege een animatie.
 */

const BEWEGING = '(prefers-reduced-motion: no-preference)';
const VANAF_TABLET = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';

/** Markeert elementen als "door ons verborgen", zodat het vangnet ze terugvindt. */
function verbergen(gsap, elementen, vars) {
  elementen.forEach((el) => el.classList.add('anim-verborgen'));
  gsap.set(elementen, vars);
}

/** Maakt elementen die deze module verborgen had alsnog zichtbaar. */
function tonen(elementen) {
  elementen.forEach((el) => {
    el.classList.remove('anim-verborgen');
    el.classList.add('in-view');
    el.style.opacity = '';
    el.style.transform = '';
  });
}

/**
 * Splitst de tekst van een element in woorden, elk met een eigen maskerlaagje.
 * Alleen losse tekst wordt aangeraakt; eventuele elementen binnenin (een <br>,
 * een gekleurd stukje) blijven staan zoals ze zijn.
 */
function splitsInWoorden(el) {
  if (!el || el.dataset.gesplitst) return [];
  const woorden = [];

  Array.from(el.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;

    const fragment = document.createDocumentFragment();
    // Splitsen op spaties, maar de spaties zelf behouden zodat de tekst
    // exact hetzelfde blijft lezen en afbreken.
    node.textContent.split(/(\s+)/).forEach((deel) => {
      if (!deel) return;
      if (!deel.trim()) {
        fragment.appendChild(document.createTextNode(deel));
        return;
      }
      const buiten = document.createElement('span');
      buiten.className = 'anim-woord';
      const binnen = document.createElement('span');
      binnen.className = 'anim-woord-in';
      binnen.textContent = deel;
      buiten.appendChild(binnen);
      fragment.appendChild(buiten);
      woorden.push(binnen);
    });

    el.replaceChild(fragment, node);
  });

  el.dataset.gesplitst = '1';
  return woorden;
}

export function initSecties() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  /** Voert één onderdeel uit; loopt het mis, dan wordt de inhoud alsnog getoond. */
  function onderdeel(naam, elementen, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`[elleven] scroll-animatie "${naam}" faalde:`, err);
      tonen(elementen);
    }
  }

  /* ====================================================== kopteksten ===== */

  mm.add(BEWEGING, () => {
    document.querySelectorAll('[data-kop]').forEach((kop, i) => {
      const kinderen = Array.from(kop.children);
      onderdeel(`kop ${i + 1}`, [kop, ...kinderen], () => {
        // Het kopblok zelf draagt .reveal en is dus door CSS verborgen. Dat
        // zetten we hier uit: vanaf nu animeren de losse onderdelen, niet het blok.
        kop.classList.add('in-view');
        gsap.set(kop, { opacity: 1, y: 0 });

        const titel = kop.querySelector('h1, h2');
        const woorden = titel ? splitsInWoorden(titel) : [];
        const rest = kinderen.filter((el) => el !== titel);

        const tl = gsap.timeline({
          scrollTrigger: { trigger: kop, start: 'top 86%', once: true },
        });

        const boven = rest.filter((el) => titel && el.compareDocumentPosition(titel) & Node.DOCUMENT_POSITION_FOLLOWING);
        const onder = rest.filter((el) => !boven.includes(el));

        if (boven.length) {
          verbergen(gsap, boven, { opacity: 0, y: 12 });
          tl.to(boven, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }
        if (woorden.length) {
          verbergen(gsap, woorden, { yPercent: 100, opacity: 0 });
          tl.to(woorden, {
            yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
            stagger: 0.035,
          }, boven.length ? '-=0.28' : 0);
        }
        if (onder.length) {
          verbergen(gsap, onder, { opacity: 0, y: 16 });
          tl.to(onder, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.45');
        }
      });
    });
  });

  /* ========================================================== groepen ===== */

  mm.add(BEWEGING, () => {
    document.querySelectorAll('[data-groep]').forEach((groep, i) => {
      const items = Array.from(groep.children);
      if (!items.length) return;

      onderdeel(`groep ${i + 1}`, items, () => {
        verbergen(gsap, items, { opacity: 0, y: 34 });

        // batch() verzamelt de elementen die tegelijk in beeld komen en laat die
        // als groepje binnenkomen. Bij een lange lijst zoals de FAQ voorkomt dat
        // zowel één lange wachtrij als twintig losse, rommelige animaties.
        ScrollTrigger.batch(items, {
          start: 'top 88%',
          once: true,
          onEnter: (groepje) =>
            gsap.to(groepje, {
              opacity: 1, y: 0,
              duration: 0.7, ease: 'power2.out',
              stagger: 0.08, overwrite: true,
            }),
        });
      });
    });
  });

  /* ==================================================== accentlijnen ===== */

  mm.add(BEWEGING, () => {
    const secties = Array.from(document.querySelectorAll('[data-sectielijn]'));
    const triggers = [];
    onderdeel('sectielijnen', [], () => {
      secties.forEach((sectie) => {
        // De lijn is pure decoratie (een ::before met een CSS-overgang). We
        // zetten alleen een klasse; de animatie zelf doet CSS. Mislukt dit, dan
        // blijft de lijn onzichtbaar en doet de bestaande rand gewoon zijn werk.
        triggers.push(ScrollTrigger.create({
          trigger: sectie,
          start: 'top 92%',
          once: true,
          onEnter: () => sectie.classList.add('lijn-in'),
        }));
      });
    });
    return () => {
      triggers.forEach((t) => t.kill());
      secties.forEach((s) => s.classList.remove('lijn-in'));
    };
  });

  /* ======================================================== parallax ===== */

  // Alleen vanaf tablet: de gloedlagen zijn zwaar vervaagde vlakken, en die in
  // beweging houden is op een telefoon de duurste bewerking van de hele pagina.
  mm.add(VANAF_TABLET, () => {
    // De werkwijze-sectie doet bewust niet mee: de losstaande stappen daar
    // lenen zich niet voor een meebewegende gloedlaag op de achtergrond.
    const lagen = Array.from(document.querySelectorAll('main section[id] > div.absolute.pointer-events-none'))
      .filter((laag) => !laag.closest('section').querySelector('[data-tijdlijn]'));
    const tweens = [];
    onderdeel('parallax', [], () => {
      lagen.forEach((laag, i) => {
        const sectie = laag.closest('section');
        if (!sectie) return;
        tweens.push(gsap.fromTo(laag,
          { yPercent: -8 },
          {
            yPercent: 8 + (i % 2) * 4, ease: 'none',
            scrollTrigger: {
              trigger: sectie,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
          }));
      });
    });
    return () => tweens.forEach((t) => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
  });

  /* ======================================================== tijdlijn ===== */

  // GEEN PIN MEER HIER — dat is een bewuste reparatie, geen gemiste kans.
  // De sectie werd voorheen op grote schermen vastgezet (`pin: true`) terwijl
  // de verbindingslijn zich op het ritme van de scroll tekende: mooi bedoeld,
  // maar het effect daarvan is dat de pagina een tijdlang niet meebeweegt met
  // de scrollbeweging van de bezoeker. Dat voelt aan als een vastgelopen
  // pagina, ook al werkt scrollen zelf gewoon door — en dat gevoel weegt
  // zwaarder dan het visuele effect. Dit was ook precies de plek waar de
  // tijdlijn eerder leeg kon blijven staan na een directe sprong naar
  // #werkwijze (zie de git-geschiedenis). Door hier, net als de rest van de
  // pagina, gewoon één keer binnen te komen (`once: true`) zonder pin of
  // scrub, verdwijnt die hele categorie problemen in één keer.
  const tijdlijn = document.querySelector('[data-tijdlijn]');
  if (tijdlijn) {
    const stappen = Array.from(tijdlijn.querySelectorAll('.reveal'));
    const lijnBreed = tijdlijn.querySelector('.hidden.sm\\:block[aria-hidden="true"]');
    const lijnSmal = tijdlijn.querySelector('.sm\\:hidden[aria-hidden="true"]');

    mm.add(BEWEGING, () => {
      onderdeel('tijdlijn', stappen, () => {
        const lijn = window.matchMedia('(min-width: 640px)').matches ? lijnBreed : lijnSmal;
        const horizontaal = lijn === lijnBreed;

        verbergen(gsap, stappen, { opacity: 0, y: 26 });
        if (lijn) {
          gsap.set(lijn, horizontaal
            ? { scaleX: 0, transformOrigin: 'left center' }
            : { scaleY: 0, transformOrigin: 'center top' });
        }

        const tl = gsap.timeline({
          scrollTrigger: { trigger: tijdlijn, start: 'top 80%', once: true },
        });
        if (lijn) {
          tl.to(lijn, {
            ...(horizontaal ? { scaleX: 1 } : { scaleY: 1 }),
            duration: 0.8, ease: 'power2.inOut',
          }, 0);
        }
        stappen.forEach((stap, i) => {
          tl.to(stap, { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out' }, 0.15 + i * 0.12);
        });
      });
    });
  }

  /* ---------------------------------------------------------------------- */

  // Na het laden van lettertypes en afbeeldingen verschuift de pagina nog licht;
  // de triggerposities moeten dan opnieuw worden berekend.
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
