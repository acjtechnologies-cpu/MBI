import { useState, useMemo } from 'react'

function slotCls(nom) {
  if (!nom) return 'mb-slot mb-s'
  const n = nom.toLowerCase()
  if (n.includes('plomb')) return 'mb-slot mb-p'
  if (n.includes('tungst')) return 'mb-slot mb-t'
  return 'mb-slot mb-l'
}

function calcMasse(model, soutes, slots) {
  let m = model.masseVide
  soutes.forEach(s => {
    ;[...(slots[s.id]?.G||[]), ...(slots[s.id]?.D||[])].forEach(b => { m += b.masse })
  })
  return m
}

function calcCGDelta(baseCfg, soutes, baseSlots, customSlots) {
  let deltaMoment = 0, deltaMasse = 0
  soutes.forEach(s => {
    const baseAll = [...(baseSlots[s.id]?.G||[]), ...(baseSlots[s.id]?.D||[])]
    const custAll = [...(customSlots[s.id]?.G||[]), ...(customSlots[s.id]?.D||[])]
    const mBase = baseAll.reduce((a,b) => a + b.masse, 0)
    const mCust = custAll.reduce((a,b) => a + b.masse, 0)
    const diff = mCust - mBase
    if (diff !== 0) {
      deltaMasse += diff
      deltaMoment += diff * s.distanceBA
    }
  })
  const masseTotale = baseCfg.m + deltaMasse
  if (masseTotale <= 0) return { cg: baseCfg.cg, variation: 0, isSafe: true, masseTotale: baseCfg.m }
  const newCG = (baseCfg.m * baseCfg.cg + deltaMoment) / masseTotale
  const variation = Number((newCG - baseCfg.cg).toFixed(2))
  const isSafe = Math.abs(variation) <= 3.0
  return { cg: Number(newCG.toFixed(2)), variation, isSafe, masseTotale }
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
  { border:'rgba(255,215,0,.4)', label:'rgba(255,200,80,.9)' },
  { border:'rgba(26,115,232,.45)', label:'rgba(100,170,255,.9)' },
  { border:'rgba(63,185,80,.4)', label:'rgba(63,185,80,.9)' },
]

const NAV_BTN = {
  flex:1, height:38, borderRadius:8, border:'1px solid #30363d',
  background:'#161b22', color:'#fff', fontSize:22, fontWeight:900,
  cursor:'pointer', touchAction:'manipulation', display:'flex',
  alignItems:'center', justifyContent:'center'
}

const CG_TOLERANCE = 3.0

export default function MatriceInteractive({ model, soutes, matrix, MAT_KEYS, ci, targetGAuto, onAppliquer }) {
  const [matrixIdx, setMatrixIdx] = useState(null)
  const [customSlots, setCustomSlots] = useState(null)
  const [baseCfg, setBaseCfg] = useState(null)
  const [baseSlots, setBaseSlots] = useState(null)

  const selectedIdx = matrixIdx !== null ? matrixIdx : ci
  const displayCfg = selectedIdx >= 0 && selectedIdx < matrix.length ? matrix[selectedIdx] : null
  const isEditing = customSlots !== null

  const masseCustom = useMemo(() => customSlots ? calcMasse(model, soutes, customSlots) : null, [customSlots, model, soutes])

  const cgResult = useMemo(() => {
    if (!isEditing || !baseCfg || !baseSlots || !customSlots) return null
    return calcCGDelta(baseCfg, soutes, baseSlots, customSlots)
  }, [isEditing, baseCfg, baseSlots, customSlots, soutes])

  const masseAff = isEditing ? masseCustom : displayCfg?.m ?? null
  const cgAff = cgResult ? cgResult.cg : displayCfg?.cg ?? null
  const variation = cgResult ? cgResult.variation : 0
  const cgIsSafe = cgResult ? cgResult.isSafe : true
  const dm = masseAff !== null ? masseAff - targetGAuto : 0
  const deltaCG = cgAff !== null ? cgAff - model.cgVide : 0
  const faiMax = Math.round((model.surface || 57) * 75)
  const chargeAl = masseAff ? (masseAff / (model.surface || 57)).toFixed(1) : null
  const isFaiOver = masseAff > faiMax
  const deltaNorm = Math.abs(deltaCG) / CG_TOLERANCE
  const cgColor = deltaNorm <= 0.3 ? '#3fb950' : deltaNorm <= 0.7 ? '#f0a500' : '#f85149'

  function startEdit() {
    if (!displayCfg) return
    const s = slotsFromCfg(soutes, MAT_KEYS, displayCfg)
    setCustomSlots(s)
    setBaseCfg(displayCfg)
    setBaseSlots(s)
  }

  function stopEdit() {
    setCustomSlots(null)
    setBaseCfg(null)
    setBaseSlots(null)
  }

  function addBloc(souteId, side) {
    const s = soutes.find(x => x.id === souteId)
    const base = baseSlots?.[souteId]?.[side] || []
    const mat = base.length > 0 ? base[base.length-1] : (s?.materiaux?.[0] || {nom:'Laiton', masse:71})
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
      return <div key={i} className={bi < blocs.length ? slotCls(blocs[bi]?.nom) : 'mb-slot mb-s'} />
    })
  }

  return (
    <div className="mb-matrix">
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
          <div style={{fontSize:9, color:'#8b949e'}}>{'\u0394'}{dm>0?'+':''}{dm}g</div>
        </div>
      </div>

      <div className="mb-sg">
        {matrix.map((row, i) => (
          <div key={i}
            className={`mb-rb${selectedIdx===i?' sel':i===ci?' near':''}`}
            onClick={() => { setMatrixIdx(selectedIdx===i?null:i); stopEdit() }}>
            {row.n}
          </div>
        ))}
      </div>

      <div className="mb-m-soutes">
        {soutes.map((soute, idx) => {
          const col = COLORS[idx] || COLORS[0]
          const cap = soute.capacite || 5
          const matKey = MAT_KEYS[idx] || 'av'
          const b = displayCfg ? (displayCfg[matKey]||{}) : {}
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
                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'G')}>{'\u25b2'}</button>
                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bG.length}{'\u00d7'}{bG[0]?.masse||mat.masse}g</div>
                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'G')}>{'\u25bc'}</button>
                  </div>
                  <div style={{flex:1, display:'flex', gap:3, alignItems:'center'}}>
                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'D')}>{'\u25bc'}</button>
                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bD.length}{'\u00d7'}{bD[0]?.masse||mat.masse}g</div>
                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'D')}>{'\u25b2'}</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="mb-m-info" style={{flexDirection:'column', gap:6}}>
          <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
            <div>
              <div style={{fontSize:20, fontWeight:900, color: isFaiOver ? '#f85149' : '#3fb950'}}>
                {masseAff ? (masseAff/1000).toFixed(3)+' kg' : '\u2014'}
              </div>
              <div style={{fontSize:9, color:isFaiOver?'#f85149':isEditing?'#f0a500':'#8b949e'}}>
                {isEditing ? '\u26a0 Hors matrice' : displayCfg ? `cfg #${displayCfg.n}` : '\u2014'}{chargeAl && ` \u00b7 ${chargeAl} g/dm\u00b2`}{isFaiOver && ' \u26d4 FAI'}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{display:'flex', alignItems:'baseline', justifyContent:'flex-end', gap:4}}>
                {isEditing && variation !== 0 && (
                  <span style={{fontSize:10, color: cgIsSafe ? (Math.abs(variation)<=1?'#3fb950':'#f0a500') : '#f85149'}}>
                    {variation>0?'+':''}{variation.toFixed(2)}mm
                  </span>
                )}
                <span style={{fontSize:20, fontWeight:900, color: cgIsSafe ? cgColor : '#f85149'}}>
                  {cgAff?.toFixed(1)??'\u2014'} mm
                </span>
              </div>
              {!isEditing && <div style={{fontSize:9, color:'#8b949e'}}>CG</div>}
              {isEditing && !cgIsSafe && <div style={{fontSize:9, color:'#f85149', fontWeight:700}}>DANGER {'\u00b1'}3mm</div>}
              <div style={{width:80, height:6, background:'#21262d', borderRadius:3, marginTop:3, marginLeft:'auto', overflow:'hidden', position:'relative'}}>
                <div style={{position:'absolute', left:'50%', width:1, height:'100%', background:'#444'}} />
                <div style={{
                  position:'absolute',
                  left: deltaCG >= 0 ? '50%' : `${50 - Math.min(Math.abs(deltaCG)/CG_TOLERANCE,1)*50}%`,
                  width: `${Math.min(Math.abs(deltaCG)/CG_TOLERANCE,1)*50}%`,
                  height:'100%', borderRadius:3,
                  background: cgColor
                }} />
              </div>
            </div>
          </div>
          <div style={{display:'flex', gap:6, width:'100%'}}>
            {!isEditing && displayCfg && (
              <button onClick={startEdit} style={{flex:1, height:36, background:'#1a3a5a', border:'1px solid #1a73e8', borderRadius:8, color:'#60a5fa', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation'}}>
                {'\u270f\ufe0f'} {'\u00c9'}diter
              </button>
            )}
            {isEditing && (
              <button onClick={stopEdit} style={{width:36, height:36, background:'#1c2128', border:'1px solid #444', borderRadius:8, color:'#8b949e', fontSize:14, cursor:'pointer', touchAction:'manipulation'}}>
                {'\u2715'}
              </button>
            )}
            {displayCfg && (
              <button onClick={()=>onAppliquer(masseAff??displayCfg.m)} style={{flex:1, height:36, background:'#0d4a36', border:'1px solid #238636', borderRadius:8, color:'#3fb950', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation'}}>
                {'\u2713'} APPLIQUER
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
