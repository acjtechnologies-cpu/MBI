const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Trouve le bloc CG dans le footer
const startMark = "<div style={{textAlign:'right'}}>";
const footerIdx = c.indexOf('mb-m-info');
const cgStart = c.indexOf(startMark, footerIdx);
const cgEnd = c.indexOf('</div>\n          </div>\n          <div style={{display:\'flex\', gap:6', cgStart);

if (cgStart === -1) {
  // Essai avec \r\n
  const cgEnd2 = c.indexOf("</div>\r\n          </div>\r\n          <div style={{display:'flex', gap:6", cgStart);
  if (cgEnd2 !== -1) {
    console.log('Bloc CG trouve (CRLF), longueur:', cgEnd2 - cgStart);
    const newCG = `<div style={{textAlign:'right'}}>
              {isEditing && cgDelta !== 0 && (
                <div style={{fontSize:9, color:'#8b949e', marginBottom:2}}>
                  CG {baseCfg?.cg?.toFixed(1)} <span style={{color:cgDelta>0?'#f0a500':'#58a6ff'}}>{cgDelta>0?'+':''}{cgDelta.toFixed(1)}mm</span>
                </div>
              )}
              <div style={{fontSize:20, fontWeight:900, color:cgColor}}>
                {cgAff?.toFixed(1)??'\u2014'} mm
              </div>
              <div style={{fontSize:9, color:'#8b949e'}}>{isEditing ? '' : 'CG'}</div>
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
    c = c.slice(0, cgStart) + newCG + c.slice(cgEnd2);
    fs.writeFileSync(file, c, 'utf8');
    console.log('OK');
  } else {
    console.log('ERREUR bloc CG non trouve');
  }
} else {
  console.log('ERREUR start non trouve');
}
