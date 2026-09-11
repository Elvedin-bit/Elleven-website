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
 *     (`once: true`). Alleen de parallax en de tijdlijn volgen de scrollpositie,
 *     en die staan stil zodra jij stilstaat.
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
    // De werkwijze-sectie doet niet mee: die wordt hieronder vastgezet, en een
    // gloedlaag die blijft schuiven terwijl de sectie stilstaat oogt vreemd.
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

  const tijdlijn = document.querySelector('[data-tijdlijn]');
  if (tijdlijn) {
    const stappen = Array.from(tijdlijn.querySelectorAll('.reveal'));
    const lijnBreed = tijdlijn.querySelector('.hidden.sm\\:block[aria-hidden="true"]');
    const lijnSmal = tijdlijn.querySelector('.sm\\:hidden[aria-hidden="true"]');

    /**
     * Bouwt de tijdlijn op: de verbindingslijn tekent zich, en elke stap komt
     * daarna aan de beurt. Met `vast` staat de sectie tijdens dat opbouwen stil,
     * zodat de vier stappen echt als een reeks lezen in plaats van voorbij te
     * schuiven.
     *
     * DE STAPPEN HANGEN BEWUST NIET AAN DE SCRUB — en dat is een reparatie, geen
     * stijlkeuze. Ze deden dat eerst wel, en dat brak op een manier die je alleen
     * ziet als je hem toevallig zo tegenkomt: wie in de navigatie op "Werkwijze"
     * klikte, landde een paar tientallen pixels vóór het beginpunt van de pin.
     * De scrub stond dan op nul, dus alle vier de stappen stonden op opacity 0 en
     * de bezoeker keek naar een kop met een leeg kader eronder. Hetzelfde gold
     * voor een directe link naar #werkwijze, voor de terugknop van de browser en
     * voor herladen op die scrollpositie.
     *
     * Dat is de valkuil van scrubben: de animatie loopt net zo hard terug als
     * vooruit, dus inhoud die eraan hangt kan altijd weer verdwijnen. De regel
     * bovenaan dit bestand zegt het al — binnenkomst speelt één keer, alleen
     * decoratie volgt de scrollpositie. De tijdlijn was de enige plek die zich
     * daar niet aan hield.
     *
     * Nu doet de pin waar hij goed in is: de sectie stilzetten en de
     * verbindingslijn zich laten tekenen op het ritme van de scroll. De stappen
     * komen via hun eigen trigger met `once`, in dezelfde volgorde en met
     * dezelfde stagger als voorheen — maar ze gaan nooit meer terug.
     */
    function bouwTijdlijn(vast) {
      const sectie = tijdlijn.closest('section');
      const lijn = window.matchMedia('(min-width: 640px)').matches ? lijnBreed : lijnSmal;
      const horizontaal = lijn === lijnBreed;

      verbergen(gsap, stappen, { opacity: 0, y: 26 });
      if (lijn) {
        gsap.set(lijn, horizontaal
          ? { scaleX: 0, transformOrigin: 'left center' }
          : { scaleY: 0, transformOrigin: 'center top' });
      }

      // De stappen: altijd eenmalig, of de sectie nu vastgezet wordt of niet.
      const stapTl = gsap.timeline({
        scrollTrigger: { trigger: tijdlijn, start: 'top 80%', once: true },
      });
      stappen.forEach((stap, i) => {
        stapTl.to(stap, { opacity: 1, y: 0, duration: 0.34, ease: 'power2.out' }, i * 0.12);
      });

      // De lijn: decoratie, dus die mag wél aan de scrollpositie hangen wanneer
      // de sectie wordt vastgezet. Verdwijnt hij bij terugscrollen, dan mist er
      // niets wezenlijks — de tekst blijft staan.
      const lijnTl = gsap.timeline({
        scrollTrigger: vast
          ? { trigger: sectie, start: 'center center', end: '+=70%', pin: true, scrub: 0.6, anticipatePin: 1 }
          : { trigger: tijdlijn, start: 'top 80%', once: true },
      });
      if (lijn) {
        lijnTl.to(lijn, horizontaal ? { scaleX: 1 } : { scaleY: 1 }, 0);
      }
      // Wat lege tijd aan het eind: zo staat de afgebouwde tijdlijn nog even
      // compleet in beeld voordat de sectie weer losgelaten wordt.
      if (vast) lijnTl.to({}, { duration: 0.3 });

      return [stapTl, lijnTl];
    }

    // Vastzetten gebeurt alleen wanneer de sectie ook echt in het scherm past.
    // De sectie is rond de 860 px hoog, dus daaronder zou de boven- of onderkant
    // wegvallen — en een halve animatie is slechter dan een gewone opbouw.
    // Omdat dit een mediaquery is en geen eenmalige meting, schakelt hij netjes
    // om wanneer iemand zijn venster kleiner maakt of zijn tablet draait.
    mm.add({
      vast: '(min-width: 1024px) and (min-height: 900px) and (prefers-reduced-motion: no-preference)',
      los: '(prefers-reduced-motion: no-preference)',
    }, (context) => {
      const sectie = tijdlijn.closest('section');
      const past = Boolean(context.conditions.vast) && sectie && sectie.offsetHeight <= window.innerHeight;
      let tijdlijnen = [];
      onderdeel('tijdlijn', stappen, () => { tijdlijnen = bouwTijdlijn(past); });
      return () => {
        tijdlijnen.forEach((tl) => {
          if (!tl) return;
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
          tl.kill();
        });
        tonen(stappen);
      };
    });
  }

  /* ---------------------------------------------------------------------- */

  // Na het laden van lettertypes en afbeeldingen verschuift de pagina nog licht;
  // de triggerposities moeten dan opnieuw worden berekend.
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
