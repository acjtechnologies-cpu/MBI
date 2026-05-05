const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf('displayCfg && (');
console.log(JSON.stringify(c.slice(idx + 700, idx + 1100)));
