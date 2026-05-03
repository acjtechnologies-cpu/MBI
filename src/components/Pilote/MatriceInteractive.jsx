import { useState, useMemo } from 'react'

// Calcul CG depuis blocs custom
function calcCG(model, soutes, customSlots) {
  let mom = model.masseVide * model.cgVide
  let tot = model.masseVide
  soutes.forEach(s => {
    ;(customSlots[s.id] || []).forEach(b => {
      mom += b.masse * s.distanceBA
      tot += b.masse
    })
  })
  return tot > model.masseVide ? mom / tot : model.cgVide
}

function calcMasse(model, soutes, customSlots) {
  let m = model.masseVide
  soutes.forEach(s => { (customSlots[s.id] || []).forEach(b => { m += b.masse }) })
  return m
}

const COLORS = [
  { border: 'rgba(255,215,0,.4)',   label: 'rgba(255,200,80,.9)' },
  { border: 'rgba(26,115,232,.45)', label: 'rgba(100,170,255,.9)' },
  { border: 'rgba(63,185,80,.4)',   label: 'rgba(63,185,80,.9)' },
]

function matClsFromNom(nom) {
  if (!nom) return ''
  const n = nom.toLowerCase()
  if (n.includes('plomb'))  return 'p'
  if (n.includes('tungst')) return 't'
  return 'l'
}

function isNewFormat(side) { return Array.isArray(side) }

export default function MatriceInteractive({ model, soutes, matrix, MAT_KEYS, ci, targetG, setOffset, offsetVal }) {
  const [matrixIdx,   setMatrixIdx]   = useState(null)
  const [customSlots, setCustomSlots] = useState(null)

  const displayCfg = matrixIdx !== null ? matrix[matrixIdx] : (ci >= 0 ? matrix[ci] : null)
  const isHors     = customSlots !== null

  const masseCustom = useMemo(() => customSlots ? calcMasse(model, soutes, customSlots) : null, [customSlots, model, soutes])
  const cgCustom    = useMemo(() => customSlots ? calcCG(model, soutes, customSlots) : null, [customSlots, model, soutes])

  const masseAff = isHors ? masseCustom : displayCfg?.m ?? null
  const cgAff    = isHors ? cgCustom    : displayCfg?.cg ?? null
  const dm       = masseAff !== null ? masseAff - targetG : 0

  function initFromCfg(row) {
    if (!row) return
    const slots = {}
    soutes.forEach((s, i) => {
      const matKey = MAT_KEYS[i] || 'av'
      const b = row[matKey] || {}
      const mat = s.materiaux?.[0] || { nom: 'Laiton', masse: 71 }
      if (isNewFormat(b.G)) {
        slots[s.id] = [...(b.G || []), ...(b.D || [])]
      } else {
        const n = (b.G || 0) + (b.D || 0)
        slots[s.id] = Array.from({ length: n }, () => ({ ...mat }))
      }
    })
    setCustomSlots(slots)
  }

  function addBloc(sid) {
    const soute = soutes.find(s => s.id === sid)
    const mat   = soute?.materiaux?.[0] || { nom: 'Laiton', masse: 71 }
    setCustomSlots(prev => {
      const c = { ...(prev || {}) }
      if ((c[sid] || []).length >= (soute?.capacite || 5)) return prev
      c[sid] = [...(c[sid] || []), { ...mat }]
      return c
    })
  }

  function removeBloc(sid) {
    setCustomSlots(prev => {
      if (!prev?.[sid]?.length) return prev
      const c = { ...prev }
      c[sid] = c[sid].slice(0, -1)
      return c
    })
  }

  function renderSide(side, nom, cap) {
    const slots = []
    if (isNewFormat(side)) {
      for (let i = 0; i < cap; i++)
        slots.push(<div key={i} className={`mb-m-slot${i < side.length ? ' ' + matClsFromNom(side[i]?.nom) : ''}`} />)
    } else {
      const n = side || 0
      for (let i = 0; i < cap; i++)
        slots.push(<div key={i} className={`mb-m-slot${i < n ? ' ' + matClsFromNom(nom) : ''}`} />)
    }
    return slots
  }

  function getSides(souteIdx, row) {
    const matKey = MAT_KEYS[souteIdx] || 'av'
    const b = row ? (row[matKey] || {}) : {}
    const capG = isNewFormat(b.G) ? (b.G||[]).length : (b.G||0)
    const capD = isNewFormat(b.D) ? (b.D||[]).length : (b.D||0)
    const cap  = Math.max(capG, capD, 3)
    return { G: b.G, D: b.D, nomG: b.matG||'', nomD: b.matD||'', cap }
  }

  function renderCustomSlots(souteIdx, cap, sid) {
    const blocs = customSlots?.[sid] || []
    return Array.from({ length: cap }).map((_, i) => (
      <div key={i} className={`mb-m-slot${i < blocs.length ? ' ' + matClsFromNom(blocs[i]?.nom) : ''}`} />
    ))
  }

  return (
    <div className="mb-matrix">
      {/* Header */}
      <div className="mb-m-hdr">
        <div>
          <div style={{ fontSize:13, fontWeight:800 }}>🎯 {model.nom} — Matrice</div>
          <div style={{ fontSize:9, color:'#8b949e', marginTop:1 }}>
            {matrix.length} configs - cible {targetG}g
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:14, fontWeight:900, color: dm > 0 ? '#3fb950' : dm < 0 ? '#f85149' : '#8b949e' }}>
            {masseAff ? masseAff + 'g' : '-'}
          </div>
          <div style={{ fontSize:9, color:'#8b949e' }}>
            {masseAff ? `Δ${dm > 0 ? '+' : ''}${dm}g` : '-'}
          </div>
        </div>
      </div>

      {/* Grille chips */}
      <div className="mb-sg">
        {matrix.map((row, i) => (
          <div key={i}
            className={`mb-rb${matrixIdx === i ? ' sel' : i === ci ? ' near' : ''}`}
            onClick={() => { setMatrixIdx(matrixIdx === i ? null : i); setCustomSlots(null) }}>
            {row.n}
          </div>
        ))}
      </div>

      {/* Slots visuels */}
      <div className="mb-m-soutes">
        {soutes.map((soute, idx) => {
          const cap = soute.capacite || 3
          const col = COLORS[idx] || COLORS[0]
          return (
            <div key={idx} className="mb-m-row-wrap">
              <div className="mb-m-lbl" style={{ color: col.label }}>{soute.nom}</div>
              <div className="mb-m-row">
                {(() => {
                  const sides = getSides(idx, displayCfg)
                  const blocs = customSlots?.[soute.id] || []
                  const half  = Math.ceil(blocs.length / 2)
                  return (<>
                    <div className="mb-m-side mb-m-side-l" style={{ border: `1.5px solid ${col.border}` }}>
                      {isHors ? blocs.slice(0,half).map((b,i)=><div key={i} className={`mb-m-slot ${matClsFromNom(b.nom)}`}/>) : renderSide(sides.G, sides.nomG, sides.cap)}
                    </div>
                    <div className="mb-m-side" style={{ border: `1.5px solid ${col.border}` }}>
                      {isHors ? blocs.slice(half).map((b,i)=><div key={i} className={`mb-m-slot ${matClsFromNom(b.nom)}`}/>) : renderSide(sides.D, sides.nomD, sides.cap)}
                    </div>
                  </>)
                })()}
              </div>
              {/* Boutons +/- en mode édition */}
              {isHors && (
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0' }}>
                  <button onClick={() => removeBloc(soute.id)} style={{ width:30, height:30, borderRadius:6, border:'1px solid #444', background:'#1c2128', color:'#fff', fontSize:18, cursor:'pointer', touchAction:'manipulation' }}>-</button>
                  <div style={{ flex:1, textAlign:'center', fontSize:10, color:'#8b949e' }}>
                    {(customSlots?.[soute.id]||[]).length} × {soute.materiaux?.[0]?.masse||71}g
                  </div>
                  <button onClick={() => addBloc(soute.id)} style={{ width:30, height:30, borderRadius:6, border:'1px solid #444', background:'#1c2128', color:'#fff', fontSize:18, cursor:'pointer', touchAction:'manipulation' }}>+</button>
                </div>
              )}
            </div>
          )
        })}

        {/* Footer masse/CG */}
        <div className="mb-m-info" style={{ flexDirection:'column', gap:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:'#3fb950' }}>
                {masseAff ? (masseAff/1000).toFixed(3) + ' kg' : '-'}
              </div>
              <div style={{ fontSize:9, color: isHors ? '#f0a500' : '#8b949e' }}>
                {isHors ? '⚠ Hors matrice' : displayCfg ? `cfg #${displayCfg.n}` : '-'}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:18, fontWeight:900, color:'#58a6ff' }}>
                {cgAff?.toFixed(1) ?? '-'} mm
              </div>
              <div style={{ fontSize:9, color:'#8b949e' }}>CG</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, width:'100%' }}>
            {displayCfg && !customSlots && (
              <button onClick={() => initFromCfg(displayCfg)} style={{ flex:1, height:36, background:'#1a3a5a', border:'1px solid #1a73e8', borderRadius:8, color:'#60a5fa', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation' }}>
                ✏️ Éditer
              </button>
            )}
            {customSlots && (
              <button onClick={() => setCustomSlots(null)} style={{ width:36, height:36, background:'#1c2128', border:'1px solid #444', borderRadius:8, color:'#8b949e', fontSize:14, cursor:'pointer', touchAction:'manipulation' }}>
                ✕
              </button>
            )}
            {masseAff && (
              <button onClick={() => {
                const delta = masseAff - targetG
                setOffset(Math.max(-500, Math.min(500, offsetVal + delta)))
              }} style={{ flex:1, height:36, background:'#0d4a36', border:'1px solid #238636', borderRadius:8, color:'#3fb950', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation' }}>
                ✓ APPLIQUER
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
