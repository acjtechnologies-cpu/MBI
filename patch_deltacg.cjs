const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Ajoute constante apres les COLORS
c = c.replace(
  'const NAV_BTN = {',
  'const CG_TOLERANCE = 3.0 // mm marge statique universelle F3F\n\nconst NAV_BTN = {'
);

// 2. Ajoute baseCfg state
c = c.replace(
  '  const [customSlots, setCustomSlots] = useState(null)',
  '  const [customSlots, setCustomSlots] = useState(null)\n  const [baseCfg,      setBaseCfg]      = useState(null)'
);

// 3. startEdit sauvegarde baseCfg
c = c.replace(
  '  function startEdit() {\n    if (displayCfg) setCustomSlots(slotsFromCfg(soutes, MAT_KEYS, displayCfg))\n  }',
  '  function startEdit() {\n    if (!displayCfg) return\n    setCustomSlots(slotsFromCfg(soutes, MAT_KEYS, displayCfg))\n    setBaseCfg(displayCfg)\n  }'
);

// 4. cgAff utilise delta depuis baseCfg
c = c.replace(
  '  const cgAff    = isEditing ? cgCustom    : displayCfg?.cg ?? null',
  '  const cgAff    = isEditing && baseCfg ? baseCfg.cg + (cgCustom - calcCG(model, soutes, slotsFromCfg(soutes, MAT_KEYS, baseCfg))) : displayCfg?.cg ?? null'
);

// 5. Ajoute deltaCG et couleur apres cgAff
c = c.replace(
  '  const dm       = masseAff !== null ? masseAff - targetGAuto : 0',
  '  const dm       = masseAff !== null ? masseAff - targetGAuto : 0\n  const deltaCG   = cgAff !== null ? cgAff - model.cgVide : 0\n  const deltaNorm = Math.abs(deltaCG) / CG_TOLERANCE\n  const cgColor   = deltaNorm <= 0.3 ? \'#3fb950\' : deltaNorm <= 0.7 ? \'#f0a500\' : deltaNorm <= 1.0 ? \'#f85149\' : \'#ff0000\''
);

// 6. Reset baseCfg quand on quitte edition
c = c.replace(
  "onClick={()=>setCustomSlots(null)}",
  "onClick={()=>{setCustomSlots(null);setBaseCfg(null)}}"
);

// 7. Remplace affichage CG par version coloree avec barre
c = c.replace(
  `            <div style={{textAlign:'right'}}>
              <div style={{fontSize:20, fontWeight:900, color:'#58a6ff'}}>
                {cgAff?.toFixed(1)??'\u2014'} mm
              </div>
              <div style={{fontSize:9, color:'#8b949e'}}>CG</div>
            </div>`,
  `            <div style={{textAlign:'right'}}>
              <div style={{fontSize:20, fontWeight:900, color:cgColor}}>
                {cgAff?.toFixed(1)??'\u2014'} mm
              </div>
              <div style={{fontSize:9, color:'#8b949e'}}>
                CG {deltaCG !== 0 ? (deltaCG > 0 ? '+' : '') + deltaCG.toFixed(1) + 'mm' : ''}
              </div>
              {deltaCG !== 0 && (
                <div style={{width:80, height:6, background:'#21262d', borderRadius:3, marginTop:3, marginLeft:'auto', overflow:'hidden', position:'relative'}}>
                  <div style={{position:'absolute', left:'50%', width:1, height:'100%', background:'#444'}} />
                  <div style={{
                    position:'absolute',
                    left: deltaCG > 0 ? '50%' : \`\${50 - Math.min(deltaNorm,1)*50}%\`,
                    width: \`\${Math.min(deltaNorm,1)*50}%\`,
                    height:'100%', borderRadius:3,
                    background: cgColor
                  }} />
                </div>
              )}
            </div>`
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
