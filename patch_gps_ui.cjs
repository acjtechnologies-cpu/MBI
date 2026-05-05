const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Titre GPS overlay
const idxGps = c.indexOf('Position GPS');
console.log('GPS title avant:', JSON.stringify(c.slice(idxGps-6, idxGps+12)));
const gpsStart = idxGps - 4;
c = c.slice(0, gpsStart) + '\uD83D\uDCCD ' + c.slice(idxGps);

// Bouton Utiliser
c = c.replace('- Utiliser {Math.round(gpsData.alt)} m', '\uD83D\uDCCD Utiliser {Math.round(gpsData.alt)} m');

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
