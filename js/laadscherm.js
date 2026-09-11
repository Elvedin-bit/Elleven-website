/**
 * Laadscherm.
 *
 * Een overlay bij het laden is een risico: hij stelt per definitie het moment uit
 * waarop de bezoeker inhoud ziet, en dat is precies waar de laadscore op meet.
 * Daarom is hij hier zo kort mogelijk gehouden en aan strikte voorwaarden gebonden:
 *
 *   - alleen bij het eerste bezoek van een browsersessie (sessionStorage);
 *   - nooit bij prefers-reduced-motion;
 *   - nooit zonder JavaScript of zonder sessieopslag;
 *   - op een telefoon korter en eenvoudiger dan op desktop;
 *   - hij wacht nergens op. Geen window.load, geen lettertypes, geen netwerk.
 *     Sterker nog: de minimale duur wordt geteld vanaf het begin van het laden,
 *     dus wanneer de scripts traag binnenkomen vertrekt de overlay meteen in
 *     plaats van er nog eens een halve seconde bovenop te doen.
 *
 * De opbouw van het merkteken zelf staat in CSS, niet hier. De overlay is er al
 * bij het eerste beeld, terwijl GSAP en de modules nog onderweg zijn; zou de
 * animatie daarop wachten, dan staart een bezoeker met een trage verbinding eerst
 * naar een leeg zwart vlak. GSAP doet hier alleen de uitloop.
 *
 * De beslissing om hem te tonen valt in een inline script in de <head>, vóór het
 * eerste beeld, zodat er geen flits van onafgedekte inhoud is. Dat script zet ook
 * een vangnettimer: mocht dit bestand niet laden, dan haalt die de klasse .laadt
 * er alsnog af en komt de pagina gewoon vrij.
 *
 * De hero-animatie staat stil zolang .laadt actief is. We halen die klasse weg op
 * het moment dat de overlay begint weg te schuiven, niet erna — zo bouwt de hero
 * zich op terwijl het paneel oplicht, in plaats van pas daarna.
 */

const MOBIEL = '(max-width: 767px)';

export function initLaadscherm() {
  const scherm = document.getElementById('laad-scherm');
  const html = document.documentElement;

  // Geen overlay nodig (geen eerste bezoek, bewegingsvoorkeur, privémodus):
  // het inline script heeft .laadt dan nooit gezet.
  if (!scherm || !html.classList.contains('laadt')) {
    if (scherm) scherm.remove();
    return;
  }

  /** Alles opruimen en de pagina vrijgeven. Mag meerdere keren worden aangeroepen. */
  function vrijgeven() {
    clearTimeout(window.__ellevenVangnet);
    html.classList.remove('laadt');
    if (scherm.isConnected) scherm.remove();
  }

  const gsap = window.gsap;
  if (!gsap) { vrijgeven(); return; }

  // Zolang deze klasse erop staat blijft de overlay zichtbaar, ook nadat .laadt
  // van <html> is gehaald. Anders zou het paneel halverwege zijn uitloop
  // verdwijnen in plaats van wegschuiven.
  scherm.classList.add('laad-scherm-zichtbaar');

  const kort = window.matchMedia(MOBIEL).matches;

  // Minimale totale duur, gerekend vanaf het begin van het laden van de pagina.
  // De opbouw van het merkteken draait al in CSS; hier bepalen we alleen wanneer
  // het paneel wegschuift. Waren de scripts traag, dan is die tijd allang om en
  // vertrekt de overlay onmiddellijk — geen kunstmatige wachttijd bovenop een
  // trage verbinding, wat precies de fout is die laadschermen irritant maakt.
  const MIN_TOTAAL = kort ? 400 : 560;
  const wachten = Math.max(0, MIN_TOTAAL - performance.now()) / 1000;

  try {
    const tl = gsap.timeline({ onComplete: vrijgeven, onInterrupt: vrijgeven });

    // Op het moment dat het paneel begint weg te schuiven: kliks mogen er weer
    // doorheen en de hero start zijn eigen opbouw, zodat die zichtbaar wordt
    // terwijl het paneel oplicht in plaats van erachter te zijn afgelopen.
    tl.add(() => {
      scherm.classList.add('laad-scherm-weg');
      html.classList.remove('laadt');
      clearTimeout(window.__ellevenVangnet);
    }, wachten);

    tl.to(scherm, {
      yPercent: -100,
      duration: kort ? 0.36 : 0.46,
      ease: 'power3.inOut',
    }, wachten);

    tl.to(scherm.querySelector('.laad-merk'), {
      opacity: 0,
      duration: kort ? 0.2 : 0.26,
      ease: 'power2.in',
    }, wachten);
  } catch (err) {
    console.error('[elleven] laadscherm faalde:', err);
    vrijgeven();
  }
}
