const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Trouve le bloc exact de la colonne Poly4 (colonne 2)
const marker = 'Poly4{altitude > 0 ? <span style={{ color:\'#a78bfa\' }}>';
const idx = c.indexOf(marker);
const colStart = c.lastIndexOf('<div style={{ textAlign:\'center\' }}>', idx);
const colEnd = c.indexOf('</div>', c.indexOf('</div>', c.indexOf('</div>', colStart) + 1) + 1) + 6;

console.log('Colonne Poly4:', JSON.stringify(c.slice(colStart, colEnd).slice(0, 60)));

const newCol = `<div style={{ textAlign:'center' }}>
                <div style={{ fontSize:26, fontWeight:900, color: dm === 0 ? '#8b949e' : dm > 0 ? '#3fb950' : '#f85149', lineHeight:1 }}>
                  {cfg ? (dm > 0 ? '+' : '') + dm + 'g' : '\u2014'}
                </div>
                <div style={{ fontSize:9, color:'#8b949e', marginTop:3 }}>
                  \u0394 config vs cible
                </div>
              </div>`;

c = c.slice(0, colStart) + newCol + c.slice(colEnd);

// Supprime aussi dm doublon dans colonne 1
c = c.replace(
  `{dm !== 0 && cfg && (\r\n                    <span style={{ color: dm > 0 ? '#3fb950' : '#f85149' }}>\r\n                      {' '}({dm > 0 ? '+' : ''}{dm}g)\r\n                    </span>\r\n                  )}`,
  ''
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
