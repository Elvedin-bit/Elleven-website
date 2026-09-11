/**
 * Startpunt van alle JavaScript op de site.
 *
 * Alles stond tot september 2026 in één groot script onderaan index.html. Het
 * probleem daarmee: de pagina verbergt inhoud tot JavaScript die weer zichtbaar
 * maakt, dus één fout ergens bovenin dat script liet de halve site onzichtbaar
 * achter terwijl de server netjes meldde dat alles in orde was.
 *
 * Daarom start elk onderdeel hier apart en afgeschermd. Valt er één om, dan
 * blijft de rest gewoon werken, en de inhoud wordt hoe dan ook zichtbaar
 * gemaakt.
 */

import { initBackground } from './background.js';
import { initNav } from './nav.js';
import { initForm } from './form.js';
import { initHero } from './hero.js';
import { initReveal, toonAlles } from './reveal.js';
import { initSecties } from './secties.js';
import { initDiensten } from './diensten.js';
import { initMicro } from './micro.js';
import { initLaadscherm } from './laadscherm.js';

function start(naam, fn) {
  try {
    fn();
    return true;
  } catch (err) {
    console.error(`[elleven] onderdeel "${naam}" kon niet starten:`, err);
    return false;
  }
}

// Het laadscherm als eerste: die overlay hangt voor de pagina en moet zo snel
// mogelijk aan zijn korte reeks beginnen.
start('laadscherm', initLaadscherm);

// Jaartal in de voettekst.
start('voettekst', () => {
  const jaar = document.getElementById('year');
  if (jaar) jaar.textContent = new Date().getFullYear();
});

// De animatielaag eerst: die bepaalt of inhoud zichtbaar wordt. Mislukt hij,
// dan zetten we alles alsnog meteen zichtbaar.
if (!start('animaties', initReveal)) {
  toonAlles();
}

// De sectie-choreografie komt ná de basis: die claimt de elementen met een
// eigen opbouw. Valt dit om, dan heeft de basis hierboven alles al gedekt.
start('sectie-animaties', initSecties);
start('diensten', initDiensten);
start('micro-interacties', initMicro);

start('hero', initHero);
start('navigatie', initNav);
start('formulier', initForm);
start('achtergrond', initBackground);

// Allerlaatste vangnet. Draaien de scroll-animaties, dan is inhoud die nog
// onzichtbaar is gewoon inhoud waar de bezoeker nog niet naartoe gescrold heeft —
// daar blijven we vanaf. Alleen wanneer er helemaal geen animaties actief zijn
// én er toch iets verborgen staat, is er echt iets misgegaan en tonen we alles.
window.setTimeout(() => {
  const ST = window.ScrollTrigger;
  const animatiesDraaien = Boolean(ST && typeof ST.getAll === 'function' && ST.getAll().length);
  if (animatiesDraaien) return;

  const verborgen = document.querySelector('.reveal:not(.in-view), .anim-verborgen');
  if (!verborgen) return;
  if (window.getComputedStyle(verborgen).opacity === '0') {
    console.warn('[elleven] inhoud bleef verborgen — vangnet toont alles alsnog.');
    toonAlles();
  }
}, 4000);
