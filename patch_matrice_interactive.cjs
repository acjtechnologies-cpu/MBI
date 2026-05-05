const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Ajoute useState customSlots apres matrixIdx
c = c.replace(
  "const [matrixIdx,     setMatrixIdx]     = useState(null)",
  "const [matrixIdx,     setMatrixIdx]     = useState(null)\n  const [customSlots,   setCustomSlots]   = useState(null) // null = suit matrice"
);

// 2. Ajoute calcul CG custom apres displayCfg
c = c.replace(
  "  // -\" Sync ballastSnap",
  `  // Calcul CG custom depuis customSlots
  const cgCustom = customSlots ? (() => {
    let momentTotal = model.masseVide * model.cgVide
    let masseTotal  = model.masseVide
    soutes.forEach(s => {
      const blocs = customSlots[s.id] || []
      blocs.forEach(b => {
        momentTotal += b.masse * s.distanceBA
        masseTotal  += b.masse
      })
    })
    return masseTotal > model.masseVide ? momentTotal / masseTotal : model.cgVide
  })() : null
  const masseCustom = customSlots ? (() => {
    let m = model.masseVide
    soutes.forEach(s => { (customSlots[s.id]||[]).forEach(b => { m += b.masse }) })
    return m
  })() : null
  const isHorsMatrice = customSlots !== null

  // Init customSlots depuis une config matrice
  function initFromCfg(row) {
    if (!row) return
    const slots = {}
    soutes.forEach((s, idx) => {
      const matKey = MAT_KEYS[idx] || 'av'
      const b = row[matKey] || {}
      const side = b.G
      if (Array.isArray(side)) {
        const all = [...(b.G||[]), ...(b.D||[])]
        slots[s.id] = all
      } else {
        const nom = b.matG || ''
        const mat = s.materiaux?.[0] || { nom, masse: 71 }
        const n = (b.G||0) + (b.D||0)
        slots[s.id] = Array.from({length: n}, () => ({ nom: mat.nom, masse: mat.masse }))
      }
    })
    setCustomSlots(slots)
  }

  function addBloc(souteId, mat) {
    setCustomSlots(prev => {
      const cur = prev ? {...prev} : {}
      cur[souteId] = [...(cur[souteId]||[]), mat]
      return cur
    })
  }

  function removeBloc(souteId) {
    setCustomSlots(prev => {
      if (!prev?.[souteId]?.length) return prev
      const cur = {...prev}
      cur[souteId] = cur[souteId].slice(0, -1)
      return cur
    })
  }

  // -" Sync ballastSnap`
);

console.log('Etat OK');
fs.writeFileSync(file, c, 'utf8');
console.log('OK - state custom ajoute');
