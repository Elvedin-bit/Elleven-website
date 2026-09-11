/**
 * Dienstenkaarten: binnenkomst, volgnummers en de interactie erop.
 *
 * De sectie heeft een eigen module omdat de binnenkomst en de nummers samen één
 * beweging vormen — de kaart komt op, het nummer telt mee — en dat laat zich niet
 * vangen in het algemene reveal-systeem. js/reveal.js laat [data-dienst] daarom
 * met rust.
 *
 * De interactie bestaat in twee smaken, en welke je krijgt hangt niet af van de
 * schermbreedte maar van wat het apparaat kán:
 *
 *   (hover: hover) + (pointer: fine)  muis: de kaart kantelt licht naar de
 *                                     cursor toe en een zachte gloed volgt hem
 *   (hover: none)                     aanraakscherm: de kaart die in beeld staat
 *                                     krijgt hetzelfde accent, zonder tikken
 *
 * Het kantelen blijft bewust klein (maximaal vier graden). Genoeg om de kaart
 * te laten leven, ver genoeg van het overdreven gekantel dat een site goedkoop
 * laat ogen.
 */

const MUIS = '(hover: hover) and (pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)';
const AANRAAK = '(hover: none) and (prefers-reduced-motion: no-preference)';
const BEWEGING = '(prefers-reduced-motion: no-preference)';

const MAX_KANTEL = 4;   // graden
const MAX_LIFT = 8;     // pixels

export function initDiensten() {
  const kaarten = Array.from(document.querySelectorAll('[data-dienst]'));
  if (!kaarten.length) return;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  /** Laat de kaarten alsnog zien wanneer hier iets misgaat. */
  function tonen() {
    kaarten.forEach((kaart) => {
      kaart.classList.remove('anim-verborgen');
      kaart.classList.add('in-view');
      kaart.style.opacity = '';
      kaart.style.transform = '';
      const nr = kaart.querySelector('.dienst-nummer');
      if (nr) nr.textContent = String(kaart.dataset.nummer || '').padStart(2, '0');
    });
  }

  function afgeschermd(naam, fn) {
    try { fn(); } catch (err) {
      console.error(`[elleven] diensten — "${naam}" faalde:`, err);
      tonen();
    }
  }

  /* ============================================ binnenkomst + nummers ==== */

  mm.add(BEWEGING, () => {
    afgeschermd('binnenkomst', () => {
      kaarten.forEach((kaart) => {
        kaart.classList.add('anim-verborgen');
        // Meteen op nul zetten, nu de kaart nog onzichtbaar is. Zou dat pas
        // gebeuren wanneer het optellen begint, dan zie je het nummer eerst even
        // op zijn eindwaarde staan en daarna terugvallen.
        const nr = kaart.querySelector('.dienst-nummer');
        if (nr) nr.textContent = '00';
      });
      // rotateX geeft de kaart net iets meer dan een schuif: hij komt op je toe.
      gsap.set(kaarten, { opacity: 0, y: 38, rotationX: -6, transformPerspective: 900 });

      ScrollTrigger.batch(kaarten, {
        start: 'top 88%',
        once: true,
        onEnter: (groepje) => {
          gsap.to(groepje, {
            opacity: 1, y: 0, rotationX: 0,
            duration: 0.75, ease: 'power2.out',
            stagger: 0.09, overwrite: true,
            onComplete() {
              // Bewust GÉÉN clearProps hier: dat wist de volledige inline-transform,
              // waarna de verborgen begintoestand uit de CSS (translateY(28px)) weer
              // bovenkomt en de kaart 28 pixels te laag blijft staan. Het perspectief
              // laten we juist staan — de muis-interactie hieronder heeft het nodig.
              this.targets().forEach((k) => k.classList.remove('anim-verborgen'));
            },
          });

          groepje.forEach((kaart, i) => {
            const nr = kaart.querySelector('.dienst-nummer');
            const doel = parseInt(kaart.dataset.nummer, 10);
            if (!nr || !doel) return;
            const teller = { n: 0 };
            gsap.to(teller, {
              n: doel,
              duration: 0.7,
              delay: 0.12 + i * 0.09,
              ease: 'power1.out',
              onUpdate: () => { nr.textContent = String(Math.round(teller.n)).padStart(2, '0'); },
              onComplete: () => { nr.textContent = String(doel).padStart(2, '0'); },
            });
          });
        },
      });
    });
  });

  /* ====================================================== muisinteractie == */

  mm.add(MUIS, () => {
    const opruimers = [];

    afgeschermd('muisinteractie', () => {
      kaarten.forEach((kaart) => {
        const naarRX = gsap.quickTo(kaart, 'rotationX', { duration: 0.5, ease: 'power3.out' });
        const naarRY = gsap.quickTo(kaart, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        const naarY = gsap.quickTo(kaart, 'y', { duration: 0.5, ease: 'power3.out' });

        function beweeg(e) {
          // Nog bezig met binnenkomen? Dan niet ingrijpen; anders vechten de
          // binnenkomst-tween en deze interactie om dezelfde transform.
          if (kaart.classList.contains('anim-verborgen')) return;
          const r = kaart.getBoundingClientRect();
          const hx = (e.clientX - r.left) / r.width;   // 0 links .. 1 rechts
          const hy = (e.clientY - r.top) / r.height;   // 0 boven .. 1 onder
          // De gloed volgt de cursor; CSS leest deze twee waarden uit.
          kaart.style.setProperty('--mx', (hx * 100).toFixed(1) + '%');
          kaart.style.setProperty('--my', (hy * 100).toFixed(1) + '%');
          naarRY((hx - 0.5) * 2 * MAX_KANTEL);
          naarRX(-(hy - 0.5) * 2 * MAX_KANTEL);
        }

        function binnen() {
          if (kaart.classList.contains('anim-verborgen')) return;
          naarY(-MAX_LIFT);
        }
        function buiten() {
          naarRX(0); naarRY(0); naarY(0);
          kaart.style.removeProperty('--mx');
          kaart.style.removeProperty('--my');
        }

        kaart.addEventListener('mouseenter', binnen);
        kaart.addEventListener('mousemove', beweeg);
        kaart.addEventListener('mouseleave', buiten);

        opruimers.push(() => {
          kaart.removeEventListener('mouseenter', binnen);
          kaart.removeEventListener('mousemove', beweeg);
          kaart.removeEventListener('mouseleave', buiten);
          // Terugzetten op nul in plaats van clearProps, om dezelfde reden als hierboven.
          gsap.set(kaart, { rotationX: 0, rotationY: 0, y: 0 });
          kaart.style.removeProperty('--mx');
          kaart.style.removeProperty('--my');
        });
      });
    });

    return () => opruimers.forEach((fn) => fn());
  });

  /* ================================================== aanraakinteractie == */

  mm.add(AANRAAK, () => {
    const raster = kaarten[0].parentElement;
    let trigger;

    // Precies één kaart tegelijk: die waarvan het midden het dichtst bij het
    // midden van het scherm ligt. Per kaart een eigen bereik gebruiken leverde
    // twee tegelijk oplichtende kaarten op, en dat leest als een storing.
    function kiesActieve() {
      const midden = window.innerHeight / 2;
      let beste = null;
      let kleinste = Infinity;
      kaarten.forEach((kaart) => {
        const r = kaart.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const afstand = Math.abs(r.top + r.height / 2 - midden);
        if (afstand < kleinste) { kleinste = afstand; beste = kaart; }
      });
      kaarten.forEach((kaart) => kaart.classList.toggle('dienst-actief', kaart === beste));
    }

    afgeschermd('aanraakinteractie', () => {
      trigger = ScrollTrigger.create({
        trigger: raster,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: kiesActieve,
        onToggle: kiesActieve,
      });
      kiesActieve();
    });

    return () => {
      if (trigger) trigger.kill();
      kaarten.forEach((k) => k.classList.remove('dienst-actief'));
    };
  });
}
