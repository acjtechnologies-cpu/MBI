const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf('m0kg.toFixed(3)');
console.log(JSON.stringify(c.slice(idx - 150, idx + 150)));
