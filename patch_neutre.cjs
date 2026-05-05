const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

// Trouve et supprime le dataset P4 neutre
const start = c.indexOf("{ label: 'P4 neutre'");
if (start === -1) { console.log('non trouve'); process.exit(1); }
const end = c.indexOf('order: 4 },', start) + 'order: 4 },'.length;
console.log('Supprime:', JSON.stringify(c.slice(start, end).slice(0, 60)));
c = c.slice(0, start) + c.slice(end);

// Supprime aussi ch.data.datasets[1].data = chartData.neutre si present
c = c.replace(/ch\.data\.datasets\[1\]\.data = chartData\.neutre\s*\n?/, '');

fs.writeFileSync(file, c, 'utf8');
console.log('OK - P4 neutre supprime');
