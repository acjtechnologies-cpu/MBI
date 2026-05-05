const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Verifie si cgCalcBase existe deja
if (!c.includes('cgCalcBase')) {
  c = c.replace(
    '  const [baseCfg,      setBaseCfg]      = useState(null)',
    '  const [baseCfg,      setBaseCfg]      = useState(null)\n  const [cgCalcBase,   setCgCalcBase]   = useState(null)'
  );

  c = c.replace(
    '    setCustomSlots(slotsFromCfg(soutes, MAT_KEYS, displayCfg))\n    setBaseCfg(displayCfg)',
    '    const s = slotsFromCfg(soutes, MAT_KEYS, displayCfg)\n    setCustomSlots(s)\n    setBaseCfg(displayCfg)\n    setCgCalcBase(calcCG(model, soutes, s))'
  );

  c = c.replace(
    '{setCustomSlots(null);setBaseCfg(null)}',
    '{setCustomSlots(null);setBaseCfg(null);setCgCalcBase(null)}'
  );
  console.log('cgCalcBase ajoute');
}

// Fix cgDelta = variation blocs (pas vs cgVide)
c = c.replace(
  "  const cgDelta   = isEditing && baseCfg ? cgAff - baseCfg.cg : 0",
  "  const variation = isEditing && cgCalcBase !== null ? cgCustom - cgCalcBase : 0\n  const cgDelta   = variation"
);

// Fix cgAff
c = c.replace(
  "  const cgAff    = isEditing && baseCfg ? baseCfg.cg + (cgCustom - calcCG(model, soutes, slotsFromCfg(soutes, MAT_KEYS, baseCfg))) : displayCfg?.cg ?? null",
  "  const cgAff    = isEditing && baseCfg && cgCalcBase !== null ? baseCfg.cg + (cgCustom - cgCalcBase) : displayCfg?.cg ?? null"
);

// Remplace affichage CG
const start = c.indexOf("<div style={{textAlign:'right'}}>", c.indexOf('mb-m-info'));
const endSearch = "            </div>";
let end = c.indexOf(endSearch, start);
// Cherche la fin du bloc CG (apres la barre)
for (let i = 0; i < 6; i++) end = c.indexOf(endSearch, end + 1);

const newCG = `<div style={{textAlign:'right'}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'flex-end', gap:4}}>
                {isEditing && variation !== 0 && (
                  <span style={{fontSize:10, color:variation>0?'#f0a500':'#58a6ff'}}>Var {variation>0?'+':''}{variation.toFixed(2)}mm</span>
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

// On va pas chercher la fin parfaite, on remplace par index
const cgBlockEnd = c.indexOf("          </div>\n          <div style={{display:'flex', gap:6", start);
if (cgBlockEnd !== -1) {
  c = c.slice(0, start) + newCG + c.slice(cgBlockEnd);
  console.log('Affichage remplace');
} else {
  console.log('Fin bloc CG non trouvee, on ecrit quand meme');
  fs.writeFileSync(file, c, 'utf8');
}

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
