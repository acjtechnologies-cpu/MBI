const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

const start = c.indexOf("<div style={{textAlign:'right'}}>", c.indexOf('mb-m-info'));
const end = c.indexOf("</div>\n            </div>", start) + "</div>\n            </div>".length;

console.log('start:', start, 'end:', end);

const newCG = `<div style={{textAlign:'right'}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'flex-end', gap:4}}>
                {isEditing && cgDelta !== 0 && (
                  <span style={{fontSize:10, color:cgDelta>0?'#f0a500':'#58a6ff'}}>{cgDelta>0?'+':''}{cgDelta.toFixed(1)}mm</span>
                )}
                <span style={{fontSize:20, fontWeight:900, color:cgColor}}>{cgAff?.toFixed(1)??'\u2014'} mm</span>
              </div>
              {!isEditing && <div style={{fontSize:9, color:'#8b949e'}}>CG</div>}
              <div style={{width:80, height:6, background:'#21262d', borderRadius:3, marginTop:3, marginLeft:'auto', overflow:'hidden', position:'relative'}}>
                <div style={{position:'absolute', left:'50%', width:1, height:'100%', background:'#444'}} />
                <div style={{
                  position:'absolute',
                  left: deltaCG >= 0 ? '50%' : \`\${50 - Math.min(Math.abs(deltaCG)/CG_TOLERANCE,1)*50}%\`,
                  width: \`\${Math.min(Math.abs(deltaCG)/CG_TOLERANCE,1)*50}%\`,
                  height:'100%', borderRadius:3,
                  background: cgColor
                }} />
              </div>
            </div>`;

c = c.slice(0, start) + newCG + c.slice(end);
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
