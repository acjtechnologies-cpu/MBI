const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\stores\\modelStore.js';
const c = fs.readFileSync(file, 'utf8');
// Cherche config n:7 Pike
const idx = c.indexOf('{n:7,');
console.log(JSON.stringify(c.slice(idx, idx + 200)));
