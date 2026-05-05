const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
const c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf('58a6ff');
console.log('idx:', idx);
console.log(JSON.stringify(c.slice(idx - 60, idx + 300)));
