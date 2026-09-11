/**
 * Navigatie en vaste schermelementen: het mobiele menu, de meelopende navbar,
 * het geanimeerd scrollen naar ankers en de zwevende WhatsApp-knop.
 *
 * Deze zaken staan samen omdat ze alle drie reageren op de scrollpositie. Ze
 * delen daarom bewust één scroll-listener in plaats van elk een eigen listener,
 * en elke toestandswissel wordt maar één keer doorgevoerd in plaats van bij
 * iedere scrollbeweging opnieuw klassen te zetten.
 *
 * Waarom hier géén ScrollTrigger: dit is de basisbediening van de site. Die moet
 * blijven werken, ook als GSAP om welke reden dan ook niet laadt. ScrollTrigger
 * wordt ingezet waar het echt iets toevoegt — de scroll-animaties in reveal.js.
 * Voor het geanimeerde scrollen naar een anker gebruiken we GSAP wél, met een
 * gewone sprong als terugval.
 */

// Moet gelijk blijven aan scroll-padding-top in src/css/input.css (5rem).
const NAVBAR_OFFSET = 80;

export function initNav() {
  const navbar = document.getElementById('navbar');
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('icon-open');
  const iconClose = document.getElementById('icon-close');
  const waFab = document.getElementById('wa-fab');

  /* ------------------------------------------------------------ menu ----- */

  function closeMenu() {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
    iconOpen.classList.remove('hidden');
    iconClose.classList.add('hidden');
  }

  function toggleMenu() {
    const isHidden = mobileMenu.classList.toggle('hidden');
    menuBtn.setAttribute('aria-expanded', String(!isHidden));
    iconOpen.classList.toggle('hidden', !isHidden);
    iconClose.classList.toggle('hidden', isHidden);
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', toggleMenu);
    document.querySelectorAll('.mobile-link').forEach((el) => el.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        closeMenu();
        menuBtn.focus();
      }
    });
  }

  /* ----------------------------------------- navbar + zwevende knop ------ */

  let navGescrold = null;
  function setNavGescrold(aan) {
    if (!navbar || navGescrold === aan) return;
    navGescrold = aan;
    navbar.classList.toggle('bg-black/50', aan);
    navbar.classList.toggle('border-white/10', aan);
    navbar.classList.toggle('shadow-lg', aan);
    navbar.classList.toggle('shadow-black/40', aan);
    navbar.classList.toggle('bg-white/[0.03]', !aan);
    navbar.classList.toggle('border-white/[0.06]', !aan);
  }

  let fabZichtbaar = null;
  function setFabZichtbaar(aan) {
    if (!waFab || fabZichtbaar === aan) return;
    fabZichtbaar = aan;
    waFab.classList.toggle('wa-fab-visible', aan);
  }

  let wachtOpFrame = false;
  function opScroll() {
    if (wachtOpFrame) return;
    wachtOpFrame = true;
    requestAnimationFrame(() => {
      wachtOpFrame = false;
      const y = window.scrollY;
      setNavGescrold(y > 12);
      setFabZichtbaar(y > 400);
    });
  }

  window.addEventListener('scroll', opScroll, { passive: true });

  // Begintoestand meteen goed zetten, ook als de pagina al gescrold opent.
  setNavGescrold(window.scrollY > 12);
  setFabZichtbaar(window.scrollY > 400);

  /* -------------------------------------------- scrollen naar ankers ----- */

  // scroll-behavior: smooth is bewust van <html> gehaald. Daarmee animeert de
  // browser de scrollpositie zelf, buiten GSAP om, en dat botst met ScrollTrigger
  // zodra er scroll-gekoppelde animaties bijkomen. GSAP doet het scrollen nu
  // zelf, met dezelfde navbar-compensatie als voorheen.
  const gsap = window.gsap;
  const kanAnimeren = Boolean(gsap && window.ScrollToPlugin);
  const wilMinderBeweging = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    let doel;
    try {
      doel = document.querySelector(href);
    } catch {
      return; // ongeldige selector, laat de browser het afhandelen
    }
    if (!doel) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();

      if (kanAnimeren && !wilMinderBeweging) {
        gsap.to(window, {
          duration: 0.9,
          ease: 'power2.inOut',
          scrollTo: { y: doel, offsetY: NAVBAR_OFFSET, autoKill: true },
        });
      } else {
        const y = doel.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
        window.scrollTo(0, Math.max(0, y));
      }

      if (history.replaceState) history.replaceState(null, '', href);
    });
  });
}
