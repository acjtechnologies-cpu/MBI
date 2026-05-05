const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// ventLabel altitude corrompu
const idx = c.indexOf("? `VENT m/s - ${model.nom} - ");
if (idx !== -1) {
  const end = c.indexOf('g`', idx) + 2;
  c = c.slice(0, idx) + "? `VENT m/s \u2014 ${model.nom} \u2014 \u03c1 -${altCorrection}g`" + c.slice(end);
  console.log('ventLabel OK');
}

// MATRICE emoji corrompu
c = c.replace('\u00f0\u0178\u201c\u201a MATRICE', '\uD83D\uDCCB MATRICE');
const matIdx = c.indexOf("MATRICE");
const emojiBefore = c.slice(matIdx - 4, matIdx);
console.log('MATRICE emoji avant:', JSON.stringify(emojiBefore));

// Fix brute force MATRICE
c = c.replace(/[\u00c0-\u00ff][\u00c0-\u00ff][\u00c0-\u00ff][\u00c0-\u00ff] MATRICE/, '\uD83D\uDCCB MATRICE');

// altCorrection affichage - enleve le $ parasite
c = c.replace('>${altCorrection}g<', '>{altCorrection}g<');

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
