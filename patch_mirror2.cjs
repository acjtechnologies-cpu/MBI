const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace('{renderSideSlots(bG, cap, true)}', '{renderSideSlots(bG, cap, false)}');
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
