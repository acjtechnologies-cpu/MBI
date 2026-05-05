const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

const old = `                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:900, color:'#8b949e', lineHeight:1 }}>
                    {m0kg.toFixed(3)}
                  </div>
                  <div style={{ fontSize:9, color:'#8b949e', marginTop:3 }}>
                    Poly4{altitude > 0 ? <span style={{ color:'#a78bfa' }}> \u2192{kgVal.toFixed(3)}</span> : ''}
                  </div>
                </div>`;

const rep = `                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:26, fontWeight:900, color: dm === 0 ? '#8b949e' : dm > 0 ? '#3fb950' : '#f85149', lineHeight:1 }}>
                    {cfg ? (dm > 0 ? '+' : '') + dm + 'g' : '\u2014'}
                  </div>
                  <div style={{ fontSize:9, color:'#8b949e', marginTop:3 }}>
                    {\u0394} config vs cible
                  </div>
                </div>`;

if (c.includes(old)) {
  c = c.replace(old, rep);
  console.log('OK');
} else {
  console.log('ERREUR - non trouve');
}
fs.writeFileSync(file, c, 'utf8');
