const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf('displayCfg && (');
// Cherche 600 chars apres le debut
console.log(JSON.stringify(c.slice(idx + 400, idx + 800)));
