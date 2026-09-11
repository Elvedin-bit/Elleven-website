/**
 * Tailwind-configuratie voor de Elleven-website.
 *
 * ACHTERGROND: deze configuratie is in september 2026 gereconstrueerd uit de
 * gecompileerde styles.css, omdat het originele configuratiebestand verloren was
 * gegaan. De kleurwaarden hieronder zijn letterlijk overgenomen uit die build en
 * bepalen de volledige huisstijl — pas ze niet aan zonder dat dat de bedoeling is.
 *
 * Draaien vanuit deze map: `npm run build` (of `npm run watch:css` tijdens werk).
 * De uitvoer gaat naar ../styles.css, precies waar index.html hem verwacht.
 */
module.exports = {
  // Ook de losse JS-modules meescannen: die zetten klassen als .in-view en
  // .wa-fab-visible, die anders bij het opschonen zouden wegvallen.
  content: ['../index.html', '../js/**/*.js'],

  theme: {
    extend: {
      colors: {
        bg: '#000000',
        surface: '#1c1c1e',
        surface2: '#2c2c2e',
        muted: '#86868b',
        neon: '#39ff9e',
        // 'cyan' was in de oude build één vlakke kleur, waardoor Tailwinds eigen
        // cyan-schaal werd overschreven en cyan-400 nooit bestond — de oorzaak van
        // zeven kapotte knopgradiënten. Met DEFAULT + 400 werken zowel de bestaande
        // klassen (text-cyan, bg-cyan/10) als to-cyan-400 nu gewoon.
        cyan: {
          DEFAULT: '#22d3ee',
          400: '#22d3ee',
        },
        line: 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        heading: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px -10px rgba(57,255,158,0.28)',
      },
    },
  },

  plugins: [],
};
