const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

const anchor = '  const displayCfg    = matrixIdx !== null ? matrix[matrixIdx] : cfg\r\n';
const vars = `  const displayCfg    = matrixIdx !== null ? matrix[matrixIdx] : cfg\r\n
  // Custom slots CG/masse
  const cgCustom = customSlots ? (() => {
    let mom = model.masseVide * model.cgVide, tot = model.masseVide
    soutes.forEach(s => { (customSlots[s.id]||[]).forEach(b => { mom += b.masse * s.distanceBA; tot += b.masse }) })
    return tot > model.masseVide ? mom / tot : model.cgVide
  })() : null
  const masseCustom = customSlots ? (() => {
    let m = model.masseVide
    soutes.forEach(s => { (customSlots[s.id]||[]).forEach(b => { m += b.masse }) })
    return m
  })() : null
  const isHorsMatrice = customSlots !== null

  function initFromCfg(row) {
    if (!row) return
    const slots = {}
    soutes.forEach((s, i) => {
      const matKey = MAT_KEYS[i] || 'av'
      const b = row[matKey] || {}
      const mat = s.materiaux?.[0] || { nom:'Laiton', masse:71 }
      if (Array.isArray(b.G)) {
        slots[s.id] = [...(b.G||[]), ...(b.D||[])]
      } else {
        const n = (b.G||0) + (b.D||0)
        slots[s.id] = Array.from({length:n}, () => ({...mat}))
      }
    })
    setCustomSlots(slots)
  }
  function addBloc(sid, mat) {
    setCustomSlots(prev => { const c2 = {...(prev||{})}; c2[sid] = [...(c2[sid]||[]), {...mat}]; return c2 })
  }
  function removeBloc(sid) {
    setCustomSlots(prev => { if (!prev?.[sid]?.length) return prev; const c2 = {...prev}; c2[sid] = c2[sid].slice(0,-1); return c2 })
  }\r\n`;

if (c.includes(anchor)) {
  c = c.replace(anchor, vars);
  fs.writeFileSync(file, c, 'utf8');
  console.log('OK');
} else {
  console.log('ERREUR anchor non trouve');
}
