/**
 * Hero — de GSAP-laag.
 *
 * De entree zelf zit in CSS (zie src/css/input.css). Dat is bewust: de kop is
 * het grootste tekstelement van de pagina en mag niet op een scriptbestand
 * wachten. Wat hier gebeurt, is precies datgene wat CSS niet goed kan en wat de
 * hero van "netjes" naar "duur" tilt:
 *
 *   1. muisparallax op de sfeerlagen — alleen op een echte aanwijzer;
 *   2. (de magnetische knoppen zijn verhuisd naar js/micro.js);
 *   3. de hero die bij het wegscrollen rustig wegdrijft.
 *
 * Alles verloopt via transform en opacity, dus zonder herberekening van de
 * lay-out. gsap.matchMedia() zorgt ervoor dat elk stukje alleen draait onder de
 * juiste omstandigheden, en ruimt zichzelf op zodra die veranderen — bij het
 * draaien van een telefoon of wanneer iemand tijdens het bezoek minder beweging
 * instelt.
 */

const DESKTOP = '(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
const BEWEGING = '(prefers-reduced-motion: no-preference)';

export function initHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const gsap = window.gsap;
  // Zonder GSAP blijft de CSS-entree gewoon staan; de hero is dan compleet,
  // alleen zonder deze extra's. Niets te repareren, dus stilletjes stoppen.
  if (!gsap) return;

  const mm = gsap.matchMedia();

  /* ------------------------------------------------ 1. muisparallax ------ */

  mm.add(DESKTOP, () => {
    const lagen = Array.from(hero.querySelectorAll('[data-parallax]'));
    const inhoud = hero.querySelector('[data-hero-inhoud]');
    if (!lagen.length && !inhoud) return;

    // quickTo maakt één herbruikbare setter per eigenschap; veel goedkoper dan
    // bij elke muisbeweging een nieuwe tween opbouwen.
    const volgers = lagen.map((el) => ({
      diepte: parseFloat(el.dataset.parallax) || 1,
      x: gsap.quickTo(el, 'xPercent', { duration: 1.1, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'yPercent', { duration: 1.1, ease: 'power3.out' }),
    }));

    // De tekst zelf beweegt maar een paar pixels mee: net genoeg om diepte te
    // suggereren, te weinig om te storen bij het lezen.
    const inhoudX = inhoud ? gsap.quickTo(inhoud, 'x', { duration: 1.2, ease: 'power3.out' }) : null;
    const inhoudY = inhoud ? gsap.quickTo(inhoud, 'y', { duration: 1.2, ease: 'power3.out' }) : null;

    function opMuis(e) {
      const hx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 links, 1 rechts
      const hy = (e.clientY / window.innerHeight - 0.5) * 2;  // -1 boven, 1 onder
      volgers.forEach((v) => { v.x(hx * v.diepte); v.y(hy * v.diepte); });
      if (inhoudX) { inhoudX(hx * -6); inhoudY(hy * -4); }
    }

    function opVerlaten() {
      volgers.forEach((v) => { v.x(0); v.y(0); });
      if (inhoudX) { inhoudX(0); inhoudY(0); }
    }

    window.addEventListener('mousemove', opMuis, { passive: true });
    document.addEventListener('mouseleave', opVerlaten);

    return () => {
      window.removeEventListener('mousemove', opMuis);
      document.removeEventListener('mouseleave', opVerlaten);
      // Alleen x/y opruimen: yPercent hoort bij de scroll-animatie hieronder.
      gsap.set([...lagen, inhoud].filter(Boolean), { clearProps: 'x,y,xPercent,yPercent' });
    };
  });

  /* --------------------------------------------- 2. magnetische knoppen -- */

  // Verhuisd naar js/micro.js: die knoppen staan inmiddels door de hele pagina
  // en werden hier alleen voor de hero afgehandeld. Alles met data-magnetisch
  // wordt daar in één keer opgepakt.

  /* ------------------------------------------- 3. wegdrijven bij scrollen -- */

  mm.add(BEWEGING, () => {
    const ScrollTrigger = window.ScrollTrigger;
    const inhoud = hero.querySelector('[data-hero-inhoud]');
    if (!ScrollTrigger || !inhoud) return;

    // Let op: hier mag alleen de inhoud van de hero bewegen. De navbar, de
    // canvas-achtergrond en de WhatsApp-knop staan op position: fixed en zouden
    // zich aan een getransformeerde voorouder vastklampen in plaats van aan het
    // scherm. Die staan dan ook allemaal buiten deze sectie.
    const tween = gsap.to(inhoud, {
      yPercent: -14,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      gsap.set(inhoud, { clearProps: 'yPercent,opacity' });
    };
  });
}
