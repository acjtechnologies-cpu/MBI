const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf('displayCfg && (');
console.log('idx:', idx);
console.log(JSON.stringify(c.slice(idx, idx + 500)));
