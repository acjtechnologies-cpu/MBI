const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

const idx = c.indexOf('m0kg.toFixed(3)');
const start = c.lastIndexOf('<div style={{ textAlign:\'center\' }}>', idx);
const end = c.indexOf('</div>', c.indexOf('</div>', c.indexOf('</div>', start) + 1) + 1) + 6;

console.log('Bloc:', JSON.stringify(c.slice(start, end).slice(0, 80)));

const rep = `<div style={{ textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:900, color: dm === 0 ? '#8b949e' : dm > 0 ? '#3fb950' : '#f85149', lineHeight:1 }}>
                  {cfg ? (dm > 0 ? '+' : '') + dm + 'g' : '\u2014'}
                </div>
                <div style={{ fontSize:9, color:'#8b949e', marginTop:3 }}>
                  \u0394 config vs cible
                </div>
              </div>`;

c = c.slice(0, start) + rep + c.slice(end);
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
