/**
 * Navigatie en vaste schermelementen: het mobiele menu, de meelopende navbar,
 * het scrollen naar ankers en de zwevende WhatsApp-knop.
 *
 * Deze zaken staan samen omdat ze alle drie reageren op de scrollpositie. Ze
 * delen daarom bewust één scroll-listener in plaats van elk een eigen listener,
 * en elke toestandswissel wordt maar één keer doorgevoerd in plaats van bij
 * iedere scrollbeweging opnieuw klassen te zetten.
 *
 * Waarom hier géén ScrollTrigger: dit is de basisbediening van de site. Die moet
 * blijven werken, ook als GSAP om welke reden dan ook niet laadt. ScrollTrigger
 * wordt ingezet waar het echt iets toevoegt — de scroll-animaties in reveal.js.
 *
 * HET SCROLLEN NAAR EEN ANKER GAAT VIA DE BROWSER ZELF, NIET VIA GSAP.
 * Dat stond hier eerder anders (een GSAP-tween met ScrollToPlugin), met als
 * reden dat CSS' eigen `scroll-behavior: smooth` zou botsen met de gepinde
 * werkwijze-tijdlijn. Die pin bestaat niet meer (zie js/secties.js), dus die
 * reden is vervallen — en de eigen tween had een risico dat native scrollen
 * niet heeft: GSAP's `autoKill` breekt de animatie af zodra het ook maar íets
 * aan scroll-input detecteert, en op een telefoon geeft een tik op een link
 * bijna altijd een minuscuul stukje eigen scrollbeweging mee. Vaker dan je zou
 * denken bleef de pagina daardoor op mobiel halverwege een sectie hangen.
 * `Element.scrollIntoView()` kent dat probleem niet: de browser regelt zelf de
 * animatie, respecteert `scroll-padding-top` (dezelfde navbar-compensatie als
 * voorheen) en breekt nooit halverwege af.
 */

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

  // Bij een bewegingsvoorkeur voor "minder animatie" springt de pagina meteen
  // naar de sectie; anders animeert scroll-behavior: smooth uit de CSS mee.
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

      // scrollIntoView() houdt vanzelf rekening met scroll-padding-top (de
      // navbar-compensatie uit src/css/input.css) en blijft, anders dan een
      // GSAP-tween met autoKill, gewoon doorlopen ook als er onderweg een
      // heel klein beetje eigen scroll-input bij komt — precies wat er op
      // een telefoon bij een gewone tik al kan gebeuren.
      doel.scrollIntoView({ behavior: wilMinderBeweging ? 'auto' : 'smooth', block: 'start' });

      if (history.replaceState) history.replaceState(null, '', href);
    });
  });
}
