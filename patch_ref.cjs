const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\stores\\modelStore.js';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/masse_ref_8ms: 3[\r\n\s]+\.[\r\n\s]+474,/g, 'masse_ref_8ms: 3.474,');
c = c.replace(/masse_ref_8ms: 3[\r\n\s]+\.[\r\n\s]+330,/g, 'masse_ref_8ms: 3.330,');
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
