const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Supprime la 2eme declaration de baseCfg
const first = c.indexOf('const [baseCfg,');
const second = c.indexOf('const [baseCfg,', first + 1);
if (second !== -1) {
  const lineEnd = c.indexOf('\n', second) + 1;
  c = c.slice(0, second) + c.slice(lineEnd);
  console.log('OK - doublon supprime');
} else {
  console.log('Pas de doublon');
}
fs.writeFileSync(file, c, 'utf8');
