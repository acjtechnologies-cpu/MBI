const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Dans doChange case vent, reset kgManuel
c = c.replace(
  "case 'vent':\r\n        dir > 0 ? incrementParam('vent') : decrementParam('vent'); break",
  "case 'vent':\r\n        dir > 0 ? incrementParam('vent') : decrementParam('vent')\r\n        setKgManuel(null); break"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
