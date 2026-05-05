const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

const idx = c.indexOf("cfg ? `cfg #");
const start = c.lastIndexOf('<div style={{ fontSize:9', idx);
const end = c.indexOf('</div>', c.indexOf('</div>', start) + 1) + 6;
console.log('Bloc:', JSON.stringify(c.slice(start, end).slice(0,80)));

const rep = `<div style={{ fontSize:9, color:'#8b949e', marginTop:3 }}>
                  {cfg ? \`cfg #\${cfg.n}\` : '\u2014'}
                </div>`;

c = c.slice(0, start) + rep + c.slice(end);
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
