const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'setOffset(Math.max(-500, Math.min(500, offsetStore + dir * 42)))',
  'const next42 = offsetStore + dir * 42; const nextOff = (offsetStore !== 0 && Math.sign(next42) !== Math.sign(offsetStore)) ? 0 : Math.max(-500, Math.min(500, next42)); setOffset(nextOff)'
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK - passage obligatoire par 0');
