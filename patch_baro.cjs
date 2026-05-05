const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// dm doit comparer cfg.m vs targetGAuto (vent) - pas kgManuel
c = c.replace(
  'const dm            = cfg ? cfg.m - targetG : 0',
  'const dm            = cfg ? cfg.m - targetGAuto : 0'
);

// kgVal affiche la masse finale (avec kgManuel si actif)
// mais le barographe suit toujours cfg (vent)

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
