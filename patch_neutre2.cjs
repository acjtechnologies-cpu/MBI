const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

// Supprime ligne neutre du chartData
const lines = c.split('\n');
const filtered = lines.filter(l => !l.includes('neutre:') || l.includes('//'));
if (filtered.length < lines.length) {
  c = filtered.join('\n');
  fs.writeFileSync(file, c, 'utf8');
  console.log('OK - neutre supprime');
} else {
  console.log('Non trouve');
}
