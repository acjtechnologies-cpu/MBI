const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/height:'9vh', maxHeight:70, minHeight:48/g, "height:'11vh', maxHeight:80, minHeight:55");
c = c.replace(/height:'9vh', maxHeight:70/g, "height:'11vh', maxHeight:80");
c = c.replace('.mi-side{display:flex;gap:2px;padding:2px;border-radius:6px;flex:1;height:9vh;max-height:70px;min-height:48px}',
              '.mi-side{display:flex;gap:2px;padding:3px;border-radius:6px;flex:1;height:11vh;max-height:80px}');
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
