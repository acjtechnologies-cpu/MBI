const fs = require('fs');
const c = fs.readFileSync('C:\\Users\\Public\\Documents\\mbi-vnext\\src\\stores\\modelStore.js', 'utf8');
const idx = c.indexOf('{n:10,');
console.log(JSON.stringify(c.slice(idx, idx + 250)));
