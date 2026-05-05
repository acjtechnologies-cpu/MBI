const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf(' MATRICE\n');
if (idx !== -1) {
  const start = idx - 4;
  console.log('Avant:', JSON.stringify(c.slice(start, idx+1)));
  c = c.slice(0, start) + '\uD83D\uDCCB' + c.slice(idx);
  console.log('OK');
}
fs.writeFileSync(file, c, 'utf8');
