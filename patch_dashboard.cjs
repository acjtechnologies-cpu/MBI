const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Onglets corrompus
c = c.replace('- CALCULATEUR', '\u2696\uFE0F CALCULATEUR');
c = c.replace('\u00f0\u0178\u201c\u201a MATRICE', '\uD83D\uDCCB MATRICE');
c = c.replace('\u00f0\u0178\u017d\u00af {model.nom} - Matrice', '\uD83C\uDFAF {model.nom} \u2014 Matrice');

// 2. ventLabel corrompu
c = c.replace(
  '? `VENT m/s - ${model.nom} - \u00cf -{altCorrection}g`',
  '? `VENT m/s \u2014 ${model.nom} \u2014 \u03c1 -${altCorrection}g`'
);
c = c.replace(
  ': `VENT m/s - ${model.nom}`',
  ': `VENT m/s \u2014 ${model.nom}`'
);

// 3. altCorrection affichage corrompu
c = c.replace('-altCorrection} g', '${altCorrection}g');

// 4. Poly4 databar corrompu
c = c.replace(
  'Poly4{altitude > 0 ? <span style={{ color:\'#a78bfa\' }}> -kgVal.toFixed(3)}</span> : \'\'}',
  'Poly4{altitude > 0 ? <span style={{ color:\'#a78bfa\' }}> \u2192{kgVal.toFixed(3)}</span> : \'\'}'
);

// 5. DEDUIT corrompu
c = c.replace('D\u00c3\u2030DUIT', 'D\u00c9DUIT');

// 6. Boutons fleches verticales comme Poly4
c = c.replace(
  'onTouchCancel={handleRelease}>\u2212</button>',
  'onTouchCancel={handleRelease}>\u25b2</button>'
);
c = c.replace(
  'onTouchCancel={handleRelease}>+</button>',
  'onTouchCancel={handleRelease}>\u25bc</button>'
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK - Dashboard corrige');
