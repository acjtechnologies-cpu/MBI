const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// APPLIQUER ne fixe plus kgManuel - juste switch tab
c = c.replace(
  "{ const m = isHorsMatrice ? masseCustom : displayCfg.m; setKgManuel(m/1000); setTab('calc'); }",
  "{ setKgManuel(null); setTab('calc'); }"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
