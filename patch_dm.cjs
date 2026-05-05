const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

const old = `                  <div style={{ fontSize:9, color:'#8b949e', marginTop:3 }}>
                    {cfg ? \`cfg #\${cfg.n}\` : 'Poly4'}
                    {dm !== 0 && cfg && (
                      <span style={{ color: dm > 0 ? '#3fb950' : '#f85149' }}>
                        {' '}({dm > 0 ? '+' : ''}{dm}g)
                      </span>
                    )}
                  </div>`;

const rep = `                  <div style={{ fontSize:9, color:'#8b949e', marginTop:3 }}>
                    {cfg ? \`cfg #\${cfg.n}\` : '—'}
                  </div>`;

if (c.includes(old)) {
  c = c.replace(old, rep);
  console.log('OK - dm doublon supprime');
} else {
  console.log('ERREUR - non trouve');
}
fs.writeFileSync(file, c, 'utf8');
