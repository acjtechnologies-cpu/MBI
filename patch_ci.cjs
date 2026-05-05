const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// ci doit toujours suivre targetGAuto (vent) pas targetG (kgManuel)
c = c.replace(
  'const ci            = matrix.length > 0 ? findNearest(matrix, targetG) : -1',
  'const ci            = matrix.length > 0 ? findNearest(matrix, targetGAuto) : -1'
);

// Reset kgManuel quand on revient sur MATRICE
c = c.replace(
  "if (tab === 'matrix' && ci >= 0) setMatrixIdx(ci)",
  "if (tab === 'matrix' && ci >= 0) { setMatrixIdx(ci); setKgManuel(null); }"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
