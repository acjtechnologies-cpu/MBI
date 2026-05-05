const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf('cgAff');
console.log('idx:', idx);
const idx2 = c.indexOf('cgAff', idx + 1);
const idx3 = c.lastIndexOf('cgAff');
console.log('positions cgAff:', idx, idx2, idx3);
console.log(JSON.stringify(c.slice(idx3 - 30, idx3 + 200)));
