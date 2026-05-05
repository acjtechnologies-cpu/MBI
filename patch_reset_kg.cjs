const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Ajoute useEffect reset kgManuel quand vent change
const anchor = '  useEffect(() => {\n    if (tab === \'matrix\' && ci >= 0) { setMatrixIdx(ci); setKgManuel(null); }\n  }, [tab, ci])';

const newEffect = `  useEffect(() => {
    if (tab === 'matrix' && ci >= 0) { setMatrixIdx(ci); setKgManuel(null); }
  }, [tab, ci])

  // Reset kgManuel quand vent change
  useEffect(() => { setKgManuel(null) }, [params.vent])`;

if (c.includes(anchor)) {
  c = c.replace(anchor, newEffect);
  console.log('OK');
} else {
  console.log('ERREUR');
}
fs.writeFileSync(file, c, 'utf8');
