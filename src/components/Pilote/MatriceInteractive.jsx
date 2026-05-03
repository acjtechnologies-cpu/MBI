import { useState, useMemo } from 'react'

function matCls(nom) {
  if (!nom) return ''
  const n = nom.toLowerCase()
  if (n.includes('plomb'))  return 'p'
  if (n.includes('tungst')) return 't'
  return 'l'
}

function calcCG(model, soutes, slots) {
  let mom = model.masseVide * model.cgVide, tot = model.masseVide
  soutes.forEach(s => {
    const G = slots[s.id]?.G || [], D = slots[s.id]?.D || []
    ;[...G,...D].forEach(b => { mom += b.masse * s.distanceBA; tot += b.masse })
  })
  return tot > model.masseVide ? mom / tot : model.cgVide
}

function calcMasse(model, soutes, slots) {
  let m = model.masseVide
  soutes.forEach(s => {
    const G = slots[s.id]?.G||[], D = slots[s.id]?.D||[]
    ;[...G,...D].forEach(b => { m += b.masse })
  })
  return m
}

function slotsFromCfg(soutes, MAT_KEYS, row) {
  const slots = {}
  soutes.forEach((s, i) => {
    const b = row[MAT_KEYS[i]||'av'] || {}
    const mat = s.materiaux?.[0] || { nom:'Laiton', masse:71 }
    if (Array.isArray(b.G)) {
      slots[s.id] = { G: b.G.map(x=>({...x})), D: (b.D||[]).map(x=>({...x})) }
    } else {
      slots[s.id] = {
        G: Array.from({length:b.G||0}, ()=>({nom:b.matG||mat.nom, masse:mat.masse})),
        D: Array.from({length:b.D||0}, ()=>({nom:b.matD||mat.nom, masse:mat.masse}))
      }
    }
  })
  return slots
}

const COLORS = [
  { border:'rgba(255,215,0,.4)',   label:'rgba(255,200,80,.9)' },
  { border:'rgba(26,115,232,.45)', label:'rgba(100,170,255,.9)' },
  { border:'rgba(63,185,80,.4)',   label:'rgba(63,185,80,.9)' },
]

const NAV_BTN = {
  flex:1, height:38, borderRadius:8, border:'1px solid #30363d',
  background:'#161b22', color:'#fff', fontSize:22, fontWeight:900,
  cursor:'pointer', touchAction:'manipulation', display:'flex',
  alignItems:'center', justifyContent:'center',
  WebkitTapHighlightColor:'transparent'
}

export default function MatriceInteractive({ model, soutes, matrix, MAT_KEYS, ci, targetGAuto, onAppliquer }) {
  const [matrixIdx,   setMatrixIdx]   = useState(null)
  const [customSlots, setCustomSlots] = useState(null)

  const selectedIdx = matrixIdx !== null ? matrixIdx : ci
  const displayCfg  = selectedIdx >= 0 && selectedIdx < matrix.length ? matrix[selectedIdx] : null
  const isEditing   = customSlots !== null

  const masseCustom = useMemo(() => customSlots ? calcMasse(model, soutes, customSlots) : null, [customSlots, model, soutes])
  const cgCustom    = useMemo(() => customSlots ? calcCG(model, soutes, customSlots)    : null, [customSlots, model, soutes])

  const masseAff = isEditing ? masseCustom : displayCfg?.m ?? null
  const cgAff    = isEditing ? cgCustom    : displayCfg?.cg ?? null
  const dm       = masseAff !== null ? masseAff - targetGAuto : 0

  function startEdit() {
    if (displayCfg) setCustomSlots(slotsFromCfg(soutes, MAT_KEYS, displayCfg))
  }

  function addBloc(souteId, side) {
    const s   = soutes.find(x => x.id === souteId)
    const mat = s?.materiaux?.[0] || {nom:'Laiton', masse:71}
    const cap = s?.capacite || 5
    setCustomSlots(prev => {
      const cur = prev[souteId][side]
      if (cur.length >= cap) return prev
      return {...prev, [souteId]: {...prev[souteId], [side]: [...cur, {...mat}]}}
    })
  }

  function removeBloc(souteId, side) {
    setCustomSlots(prev => {
      const cur = prev[souteId][side]
      if (!cur.length) return prev
      return {...prev, [souteId]: {...prev[souteId], [side]: cur.slice(0,-1)}}
    })
  }

  function renderSideSlots(blocs, cap, isLeft) {
    return Array.from({length: cap}).map((_, i) => {
      const bi = isLeft ? (cap - 1 - i) : i
      return <div key={i} className={`mb-m-slot${bi < blocs.length ? ' '+matCls(blocs[bi]?.nom) : ''}`} />
    })
  }

  return (
    <div className="mb-matrix">
      {/* Header */}
      <div className="mb-m-hdr">
        <div>
          <div style={{fontSize:13, fontWeight:800}}>🎯 {model.nom} — Matrice</div>
          <div style={{fontSize:9, color:'#8b949e', marginTop:1}}>
            {matrix.length} configs · cible {targetGAuto}g
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:14, fontWeight:900, color: Math.abs(dm)<=30?'#3fb950':dm>0?'#f0a500':'#f85149'}}>
            {masseAff ? masseAff+'g' : '-'}
          </div>
          <div style={{fontSize:9, color:'#8b949e'}}>Δ{dm>0?'+':''}{dm}g</div>
        </div>
      </div>

      {/* Grille chips */}
      <div className="mb-sg">
        {matrix.map((row, i) => (
          <div key={i}
            className={`mb-rb${selectedIdx===i?' sel':i===ci?' near':''}`}
            onClick={() => { setMatrixIdx(selectedIdx===i?null:i); setCustomSlots(null) }}>
            {row.n}
          </div>
        ))}
      </div>

      {/* Soutes */}
      <div className="mb-m-soutes">
        {soutes.map((soute, idx) => {
          const col     = COLORS[idx] || COLORS[0]
          const cap     = soute.capacite || 5
          const matKey  = MAT_KEYS[idx] || 'av'
          const b       = displayCfg ? (displayCfg[matKey]||{}) : {}
          const bG = isEditing ? (customSlots[soute.id]?.G||[])
            : Array.isArray(b.G) ? b.G : Array.from({length:b.G||0},()=>({nom:b.matG||'Laiton'}))
          const bD = isEditing ? (customSlots[soute.id]?.D||[])
            : Array.isArray(b.D) ? b.D : Array.from({length:b.D||0},()=>({nom:b.matD||'Laiton'}))
          const mat = soute.materiaux?.[0] || {nom:'Laiton', masse:71}

          return (
            <div key={idx} className="mb-m-row-wrap">
              <div className="mb-m-lbl" style={{color:col.label}}>{soute.nom}</div>
              <div className="mb-m-row">
                <div className="mb-m-side mb-m-side-l" style={{border:`1.5px solid ${col.border}`}}>
                  {renderSideSlots(bG, cap, false)}
                </div>
                <div className="mb-m-side" style={{border:`1.5px solid ${col.border}`}}>
                  {renderSideSlots(bD, cap, false)}
                </div>
              </div>
              {isEditing && (
                <div style={{display:'flex', gap:6, marginTop:2}}>
                  <div style={{flex:1, display:'flex', gap:3, alignItems:'center'}}>
                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'G')}>▼</button>
                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bG.length}×{mat.masse}g</div>
                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'G')}>▲</button>
                  </div>
                  <div style={{flex:1, display:'flex', gap:3, alignItems:'center'}}>
                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'D')}>▼</button>
                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bD.length}×{mat.masse}g</div>
                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'D')}>▲</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Footer */}
        <div className="mb-m-info" style={{flexDirection:'column', gap:6}}>
          <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
            <div>
              <div style={{fontSize:20, fontWeight:900, color:'#3fb950'}}>
                {masseAff ? (masseAff/1000).toFixed(3)+' kg' : '—'}
              </div>
              <div style={{fontSize:9, color:isEditing?'#f0a500':'#8b949e'}}>
                {isEditing ? '⚠ Hors matrice' : displayCfg ? `cfg #${displayCfg.n}` : '—'}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:20, fontWeight:900, color:'#58a6ff'}}>
                {cgAff?.toFixed(1)??'—'} mm
              </div>
              <div style={{fontSize:9, color:'#8b949e'}}>CG</div>
            </div>
          </div>
          <div style={{display:'flex', gap:6, width:'100%'}}>
            {!isEditing && displayCfg && (
              <button onClick={startEdit} style={{flex:1, height:36, background:'#1a3a5a', border:'1px solid #1a73e8', borderRadius:8, color:'#60a5fa', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation'}}>
                ✏️ Éditer
              </button>
            )}
            {isEditing && (
              <button onClick={()=>setCustomSlots(null)} style={{width:36, height:36, background:'#1c2128', border:'1px solid #444', borderRadius:8, color:'#8b949e', fontSize:14, cursor:'pointer', touchAction:'manipulation'}}>
                ✕
              </button>
            )}
            {displayCfg && (
              <button onClick={()=>onAppliquer(masseAff??displayCfg.m)} style={{flex:1, height:36, background:'#0d4a36', border:'1px solid #238636', borderRadius:8, color:'#3fb950', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation'}}>
                ✓ APPLIQUER
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
