/**
 * Geanimeerde achtergrond: sterrenveld + holografisch datanetwerk.
 *
 * Galaxy-sfeer: twinkelende sterren, drijvende multi-kleur datapunten die met
 * elkaar verbinden, en af en toe een vallende ster. Beslaat als vast element de
 * volledige pagina, reageert licht op de muis en respecteert de
 * bewegingsvoorkeur van de bezoeker.
 *
 * PRESTATIES — waarom deze versie goedkoper is dan de oorspronkelijke:
 *  - De gloed om elk datapunt werd met ctx.shadowBlur getekend, een van de
 *    duurste bewerkingen die canvas kent, en dat per deeltje per frame. Dat is
 *    vervangen door een tweede, grotere cirkel met lage dekking: visueel vrijwel
 *    gelijk, een fractie van de kosten.
 *  - Het aantal deeltjes is verlaagd. De verbindingslijnen vragen een
 *    vergelijking van elk paar, dus die kosten groeien kwadratisch met het
 *    aantal punten.
 *  - Mobiel stond zwaarder ingesteld dan desktop, terwijl daar juist de minste
 *    rekenkracht en de batterij zit. Dat is omgedraaid, met daarbovenop een
 *    begrenzing op ongeveer 30 beelden per seconde.
 * Dit alles moest goedkoper worden vóórdat er scroll-animaties bovenop komen.
 */

const COLORS = ['57,255,158', '34,211,238', '167,139,250', '244,114,182']; // groen, cyaan, violet, roze
const TAU = Math.PI * 2;

export function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mouse = { x: null, y: null, radius: 150 };
  let w = 0, h = 0, dpr = 1, t = 0, rafId = null, laatsteFrame = 0;
  let stars = [], particles = [], shootingStars = [], framesUntilShoot = 200;
  let isMobile = false;

  function initStars() {
    const count = Math.min(isMobile ? 120 : 200, Math.max(60, Math.round((w * h) / 7000)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.1 + 0.3,
      base: 0.25 + Math.random() * 0.55,
      speed: 0.4 + Math.random() * 1.1,
      phase: Math.random() * TAU,
    }));
  }

  function initParticles() {
    // Mobiel bewust dunner: minder punten betekent kwadratisch minder
    // lijnvergelijkingen, en daar zit op een telefoon de pijn.
    const maxPunten = isMobile ? 40 : 72;
    const dichtheid = isMobile ? 14000 : 11000;
    const count = Math.min(maxPunten, Math.max(24, Math.round((w * h) / dichtheid)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.5 + 0.6,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    }));
  }

  function spawnShootingStar() {
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
    const speed = 9 + Math.random() * 7;
    shootingStars.push({
      x: Math.random() * w * 0.6 + w * 0.2,
      y: Math.random() * h * 0.2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 34 + Math.random() * 18,
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    isMobile = w < 640;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
    initParticles();
    // Zonder deze hertekening bleef de achtergrond leeg achter bij bezoekers met
    // een bewegingsvoorkeur, want dan draait er geen lus die opnieuw tekent.
    if (prefersReduced) drawFrame();
  }

  function tekenSterren() {
    for (const s of stars) {
      const a = s.base * (0.55 + 0.45 * Math.sin(t * 0.02 * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fillStyle = `rgba(235,240,255,${a.toFixed(3)})`;
      ctx.fill();
    }
  }

  function tekenVallendeSterren() {
    if (!prefersReduced) {
      framesUntilShoot -= 1;
      if (framesUntilShoot <= 0) {
        spawnShootingStar();
        framesUntilShoot = 260 + Math.random() * 340;
      }
    }
    shootingStars = shootingStars.filter((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life += 1;
      const alpha = 1 - s.life / s.maxLife;
      if (alpha <= 0 || s.x > w + 60 || s.y > h + 60) return false;
      const tx = s.x - s.vx * 4.5;
      const ty = s.y - s.vy * 4.5;
      const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, `rgba(255,255,255,${(0.9 * alpha).toFixed(3)})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      return true;
    });
  }

  function tekenDatapunten() {
    const kernAlpha = isMobile ? 0.85 : 0.6;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

      if (mouse.x !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius && dist > 0.01) {
          const force = (1 - dist / mouse.radius) * 0.015;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Zachte halo (vervangt het dure ctx.shadowBlur) ...
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.2, 0, TAU);
      ctx.fillStyle = `rgba(${p.c},0.13)`;
      ctx.fill();
      // ... en daarbovenop de kern van het punt.
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = `rgba(${p.c},${kernAlpha})`;
      ctx.fill();
    }
  }

  function tekenVerbindingen() {
    const maxDist = isMobile ? 100 : 130;
    const lineAlpha = isMobile ? 0.09 : 0.055;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        // Goedkope voorselectie: pas de wortel trekken als het paar überhaupt
        // binnen bereik kán liggen.
        if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(255,255,255,${lineAlpha * (1 - dist / maxDist)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, w, h);
    t += 1;
    tekenSterren();
    tekenVallendeSterren();
    tekenDatapunten();
    tekenVerbindingen();
  }

  function loop(nu) {
    rafId = requestAnimationFrame(loop);
    // Op mobiel ongeveer 30 in plaats van 60 beelden per seconde: nauwelijks
    // zichtbaar bij deze trage beweging, maar het halveert het rekenwerk.
    if (isMobile && nu - laatsteFrame < 32) return;
    laatsteFrame = nu;
    drawFrame();
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    } else if (!prefersReduced && rafId === null) {
      rafId = requestAnimationFrame(loop);
    }
  });

  resize();
  if (prefersReduced) {
    drawFrame(); // één rustig beeld, geen doorlopende animatie of vallende sterren
  } else {
    rafId = requestAnimationFrame(loop);
  }
}
