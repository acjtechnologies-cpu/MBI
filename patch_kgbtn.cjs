const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Le bouton KG affiche kgVal (targetGAuto/1000) pas kgManuel directement
c = c.replace(
  "const kgVal         = targetG / 1000",
  "const kgVal         = (selectedParam === 'kg' && kgManuel !== null) ? kgManuel : targetGAuto / 1000"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
