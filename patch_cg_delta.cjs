const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Remplace calcCG par calcCGDeltaF3F
const oldCalcCG = `function calcCG(model, soutes, slots) {
  let mom = model.masseVide * model.cgVide, tot = model.masseVide
  soutes.forEach(s => {
    const G = slots[s.id]?.G || [], D = slots[s.id]?.D || []
    ;[...G,...D].forEach(b => { mom += b.masse * s.distanceBA; tot += b.masse })
  })
  return tot > model.masseVide ? mom / tot : model.cgVide
}`;

const newCalcFn = `function calcCG(model, soutes, slots) {
  let mom = model.masseVide * model.cgVide, tot = model.masseVide
  soutes.forEach(s => {
    const G = slots[s.id]?.G || [], D = slots[s.id]?.D || []
    ;[...G,...D].forEach(b => { mom += b.masse * s.distanceBA; tot += b.masse })
  })
  return tot > model.masseVide ? mom / tot : model.cgVide
}

const MAX_DELTA_CG = 3.0

function calcCGDeltaF3F(baseCfg, soutes, baseSlots, customSlots) {
  let deltaMoment = 0, deltaMasse = 0
  soutes.forEach(s => {
    const baseAll = [...(baseSlots[s.id]?.G||[]), ...(baseSlots[s.id]?.D||[])]
    const custAll = [...(customSlots[s.id]?.G||[]), ...(customSlots[s.id]?.D||[])]
    const diff = custAll.length - baseAll.length
    if (diff !== 0) {
      const mat = custAll[0] || baseAll[0] || { masse: 71 }
      deltaMasse  += diff * mat.masse
      deltaMoment += diff * mat.masse * s.distanceBA
    }
  })
  const masseTotale = baseCfg.m + deltaMasse
  if (masseTotale <= 0) return { cg: baseCfg.cg, variation: 0, isSafe: true, status: 'OK', masseTotale: baseCfg.m }
  const newCG = (baseCfg.m * baseCfg.cg + deltaMoment) / masseTotale
  const variation = newCG - baseCfg.cg
  const isSafe = Math.abs(variation) <= MAX_DELTA_CG
  return {
    cg: Number(newCG.toFixed(2)),
    variation: Number(variation.toFixed(2)),
    isSafe,
    status: isSafe ? 'OK' : 'DANGER',
    masseTotale
  }
}`;

c = c.replace(oldCalcCG, newCalcFn);

// 2. Remplace cgAff/cgDelta/variation par calcCGDeltaF3F
c = c.replace(
  '  const cgBase   = isEditing && baseCfg ? baseCfg.cg : displayCfg?.cg ?? null\n  const cgDelta  = isEditing && baseCfg ? cgCustom - calcCG(model, soutes, slotsFromCfg(soutes, MAT_KEYS, baseCfg)) : 0\n  const cgAff    = cgBase !== null ? cgBase + cgDelta : null',
  '  const cgResult  = isEditing && baseCfg && cgCalcBase !== null\n    ? calcCGDeltaF3F(baseCfg, soutes, slotsFromCfg(soutes, MAT_KEYS, baseCfg), customSlots)\n    : null\n  const cgAff     = cgResult ? cgResult.cg : displayCfg?.cg ?? null'
);

// 3. Fix variation et cgDelta
c = c.replace(
  '  const variation = isEditing && cgCalcBase !== null ? cgCustom - cgCalcBase : 0\n  const cgDelta   = variation',
  '  const variation = cgResult ? cgResult.variation : 0\n  const cgDelta   = variation\n  const cgIsSafe  = cgResult ? cgResult.isSafe : true'
);

// 4. Remplace affichage CG
const start = c.indexOf("<div style={{textAlign:'right'}}>", c.indexOf('mb-m-info'));
const endMark = "          </div>\n          <div style={{display:'flex', gap:6";
const end = c.indexOf(endMark, start);

const newDisplay = `<div style={{textAlign:'right'}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'flex-end', gap:4}}>
                {isEditing && variation !== 0 && (
                  <span style={{fontSize:10, color: cgIsSafe ? (Math.abs(variation)<=1?'#3fb950':'#f0a500') : '#f85149'}}>
                    {variation>0?'+':''}{variation.toFixed(2)}mm
                  </span>
                )}
                <span style={{fontSize:20, fontWeight:900, color: cgIsSafe ? cgColor : '#f85149', animation: !cgIsSafe ? 'blink 0.5s infinite' : 'none'}}>
                  {cgAff?.toFixed(1)??'\u2014'} mm
                </span>
              </div>
              {!isEditing && <div style={{fontSize:9, color:'#8b949e'}}>CG</div>}
              {isEditing && !cgIsSafe && <div style={{fontSize:9, color:'#f85149', fontWeight:700}}>DANGER \u00b13mm</div>}
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
            </div>
`;

c = c.slice(0, start) + newDisplay + c.slice(end);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
