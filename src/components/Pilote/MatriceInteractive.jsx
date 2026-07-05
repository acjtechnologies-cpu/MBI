import { useRef, useState } from 'react'
import { useMatrixStore } from './matrixStore'

function slotCls(nom) {
  if (!nom) return 'mb-slot mb-s'
  const n = nom.toLowerCase()
  if (n.includes('plomb')) return 'mb-slot mb-p'
  if (n.includes('tungst')) return 'mb-slot mb-t'
  return 'mb-slot mb-l'
}

const COLORS = [
  { border: 'rgba(255,215,0,.4)', label: 'rgba(255,200,80,.9)' },
  { border: 'rgba(26,115,232,.45)', label: 'rgba(100,170,255,.9)' },
  { border: 'rgba(63,185,80,.4)', label: 'rgba(63,185,80,.9)' },
]

const CG_TOLERANCE = 3.0
const REMOVE_THRESHOLD = 20 // px avant qu'un swipe-out soit considéré comme "engagé"
const DM_OPTIMAL_MARGIN = 40 // g — demi-largeur de la zone optimale
const DM_VISUAL_MAX = 200 // g — au-delà, le curseur sature en bout de barre

function renderSideSlots(blocs, cap, isLeft) {
  return Array.from({ length: cap }).map((_, i) => {
    const bi = isLeft ? (cap - 1 - i) : i
    return <div key={i} className={bi < blocs.length ? slotCls(blocs[bi]?.nom) : 'mb-slot mb-s'} />
  })
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function countAt(matrix, soutesArr, matKeys, idx, souteId, side) {
  const i = soutesArr.findIndex(s => s.id === souteId)
  const key = matKeys[i] || 'av'
  return matrix[idx]?.[key]?.[side]?.length ?? 0
}

// Aperçu non-committé : même formule incrémentale que calcCGDelta (moment/masse),
// appliquée à un seul bloc hypothétique. sign = +1 (ajout) ou -1 (retrait).
function previewDelta(displayCfg, soute, material, sign) {
  const newMass = displayCfg.m + sign * material.masse
  const newMoment = displayCfg.m * displayCfg.cg + sign * material.masse * soute.distanceBA
  const newCG = newMass > 0 ? newMoment / newMass : displayCfg.cg
  return { m: Math.round(newMass), cg: Number(newCG.toFixed(2)) }
}

// Position en % sur la bande CG : ±2x CG_TOLERANCE remplit toute la largeur, la zone
// sûre (±1x tolérance) occupe le tiers central (25%-75%) — même seuils que cgColor.
function cgToPercent(cg, cgVide) {
  const norm = (cg - cgVide) / CG_TOLERANCE
  return Math.max(0, Math.min(100, 50 + norm * 25))
}

// Position du curseur "Alignement Cible Météo" : les DM_OPTIMAL_MARGIN premiers
// grammes occupent ±20% (zone 30%-70%, très dilatée), le reste jusqu'à DM_VISUAL_MAX
// occupe les 30% restants de chaque côté (amorti, zone 70-100% / 0-30%).
function dmToVisualPercent(dm) {
  if (Math.abs(dm) <= DM_OPTIMAL_MARGIN) {
    return 50 + (dm / DM_OPTIMAL_MARGIN) * 20
  }
  const sign = dm > 0 ? 1 : -1
  const excess = Math.min(Math.abs(dm) - DM_OPTIMAL_MARGIN, DM_VISUAL_MAX - DM_OPTIMAL_MARGIN)
  return 50 + sign * 20 + sign * (excess / (DM_VISUAL_MAX - DM_OPTIMAL_MARGIN)) * 30
}

export default function MatriceInteractive({ targetGAuto, onAppliquer, onBack }) {
  const model = useMatrixStore(s => s.model)
  const soutes = useMatrixStore(s => s.soutes)
  const MAT_KEYS = useMatrixStore(s => s.MAT_KEYS)
  const matrix = useMatrixStore(s => s.matrix)
  const ci = useMatrixStore(s => s.ci)
  const setCi = useMatrixStore(s => s.setCi)

  const [drag, setDrag] = useState(null)
  const [shakeKey, setShakeKey] = useState(null)
  const zonesRef = useRef({})
  const dragActiveRef = useRef(false)
  const lastGestureRef = useRef(0)

  const setZoneRef = (souteId, side) => (node) => {
    if (node) zonesRef.current[`${souteId}-${side}`] = node
    else delete zonesRef.current[`${souteId}-${side}`]
  }

  const handlers = useRef({}).current
  if (!handlers.move) {
    handlers.move = (e) => {
      setDrag((d) => {
        if (!d) return d
        const x = e.clientX, y = e.clientY
        if (d.type === 'add') {
          let targetSide = null
          const draggedUp = (d.startY || d.y) - y
          if (draggedUp > 20) for (const side of ['G', 'D']) {
            const zone = zonesRef.current[`${d.souteId}-${side}`]
            if (zone && pointInRect(x, y, zone.getBoundingClientRect())) { targetSide = side; break }
          }
          return { ...d, x, y, targetSide }
        }
        const moved = d.moved || Math.hypot(x - d.startX, y - d.startY) > REMOVE_THRESHOLD
        return { ...d, x, y, moved }
      })
    }
    handlers.up = (e) => {
      lastGestureRef.current = Date.now()
      dragActiveRef.current = false
      window.removeEventListener('pointermove', handlers.move)
      window.removeEventListener('pointerup', handlers.up)
      let committed = false
      setDrag((d) => {
        if (!d || committed) return null
        committed = true
        const st = useMatrixStore.getState()

        if (d.type === 'add' && d.targetSide) {
          const before = countAt(st.matrix, st.soutes, st.MAT_KEYS, st.ci, d.souteId, d.targetSide)
          st.addBloc(st.ci, d.souteId, d.targetSide, d.material)
          const after = countAt(useMatrixStore.getState().matrix, st.soutes, st.MAT_KEYS, st.ci, d.souteId, d.targetSide)
          if (after === before) {
            const key = `${d.souteId}-${d.targetSide}`
            setShakeKey(key)
            window.setTimeout(() => setShakeKey(k => (k === key ? null : k)), 300)
          }
        } else if (d.type === 'remove' && d.moved) {
          const zone = zonesRef.current[`${d.souteId}-${d.side}`]
          const rect = zone?.getBoundingClientRect()
          const stillInside = rect && pointInRect(e.clientX, e.clientY, rect)
          if (!stillInside) st.removeBloc(st.ci, d.souteId, d.side)
        }
        return null
      })
    }
  }

  function startGesture(initial) {
    if (dragActiveRef.current) return
    if (Date.now() - lastGestureRef.current < 200) return
    dragActiveRef.current = true
    setDrag(initial)
    window.addEventListener('pointermove', handlers.move)
    window.addEventListener('pointerup', handlers.up)
  }

  if (!model || !matrix[ci]) return null

  const displayCfg = matrix[ci]

  // Aperçu en cours (si un geste actif vise une cible valide), sinon null.
  let preview = null
  if (drag?.type === 'add' && drag.targetSide) {
    const soute = soutes.find(s => s.id === drag.souteId)
    if (soute) preview = previewDelta(displayCfg, soute, drag.material, +1)
  } else if (drag?.type === 'remove' && drag.moved) {
    const soute = soutes.find(s => s.id === drag.souteId)
    const souteIdx = soutes.findIndex(s => s.id === drag.souteId)
    const key = MAT_KEYS[souteIdx] || 'av'
    const sideArr = displayCfg[key]?.[drag.side] || []
    const lastBlock = sideArr[sideArr.length - 1]
    if (soute && lastBlock) preview = previewDelta(displayCfg, soute, lastBlock, -1)
  }

  // Valeurs réellement affichées : prédictives pendant un geste actif, sinon committées.
  const masseAff = preview ? preview.m : displayCfg.m
  const cgAff = preview ? preview.cg : displayCfg.cg

  const dm = masseAff - targetGAuto
  const isOptimalConfig = Math.abs(dm) <= DM_OPTIMAL_MARGIN
  const visualPercent = dmToVisualPercent(dm)

  const faiMax = Math.round((model.surface || 57) * 75)
  const chargeAl = (masseAff / (model.surface || 57)).toFixed(1)
  const isFaiOver = masseAff > faiMax
  const deltaCG = cgAff - model.cgVide
  const deltaNorm = Math.abs(deltaCG) / CG_TOLERANCE
  const cgColor = deltaNorm <= 0.3 ? '#3fb950' : deltaNorm <= 0.7 ? '#f0a500' : '#f85149'

  // Config existante la plus proche de la cible météo (mise en avant discrète dans le Quick-Switch)
  const bestConfigIdx = matrix.reduce((bestIdx, row, index) => {
    return Math.abs(row.m - targetGAuto) < Math.abs(matrix[bestIdx].m - targetGAuto) ? index : bestIdx
  }, 0)

  return (
    <div className="mb-matrix" style={{ position: 'relative' }}>
<div className="mb-m-hdr">
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>🎯 {model.nom} — Matrice Prédicteur</div>
          <div style={{ fontSize: 9, color: '#8b949e', marginTop: 1 }}>
            Cible IQA courante : <span style={{ color: '#58a6ff', fontWeight: 'bold' }}>{targetGAuto}g</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: isOptimalConfig ? '#3fb950' : dm > 0 ? '#f0a500' : '#f85149' }}>
            {masseAff}g
          </div>
          <div style={{ fontSize: 9, color: isOptimalConfig ? '#3fb950' : '#8b949e', fontWeight: isOptimalConfig ? 'bold' : 'normal' }}>
            {dm === 0 ? 'CIBLE ATTEINTE' : `${dm > 0 ? '▲ +' : '▼ '}${dm}g`}
          </div>
        </div>
      </div>

      <div className="mb-sg">
        {matrix.map((row, i) => {
          const isBestMatch = i === bestConfigIdx
          return (
            <div
              key={i}
              className={`mb-rb${ci === i ? ' sel' : ''}`}
              style={{ position: 'relative', borderBottom: isBestMatch ? '2px solid #58a6ff' : undefined }}
              onClick={() => setCi(i)}
            >
              {row.n}
              {isBestMatch && <span style={{ position: 'absolute', top: -2, right: 2, fontSize: 7, color: '#58a6ff' }}>★</span>}
            </div>
          )
        })}
      </div>

      <div className="mb-m-soutes">
        {soutes.map((soute, idx) => {
          const col = COLORS[idx] || COLORS[0]
          const cap = soute.capacite || 5
          const matKey = MAT_KEYS[idx] || 'av'
          const b = displayCfg[matKey] || {}
          const bG = b.G || []
          const bD = b.D || []
          const mat = soute.materiaux?.[0] || { nom: 'Laiton', masse: 71 }

          const isArmed = drag?.type === 'add' && drag.souteId === soute.id
          const isDimmed = drag?.type === 'add' && drag.souteId !== soute.id

          return (
            <div
              key={idx}
              className="mb-m-row-wrap"
              style={{
                transition: 'opacity .15s ease, filter .15s ease',
                opacity: isDimmed ? 0.35 : 1,
                filter: isDimmed ? 'grayscale(1)' : 'none',
              }}
            >
              <div className="mb-m-lbl" style={{ color: col.label }}>{soute.nom}</div>
              <div className="mb-m-row">
                <div
                  ref={setZoneRef(soute.id, 'G')}
                  className={`mb-m-side mb-m-side-l${shakeKey === `${soute.id}-G` ? ' shake' : ''}`}
                  style={{
                    border: `1.5px solid ${isArmed && drag.targetSide === 'G' ? '#3fb950' : col.border}`,
                    background: isArmed && drag.targetSide === 'G' ? 'rgba(63,185,80,.12)' : undefined,
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => {
                    if (!bG.length) return
                    e.currentTarget.setPointerCapture(e.pointerId)
                    startGesture({ type: 'remove', souteId: soute.id, side: 'G', x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false })
                  }}
                >
                  {renderSideSlots(bG, cap, false)}
                </div>
                <div
                  ref={setZoneRef(soute.id, 'D')}
                  className={`mb-m-side${shakeKey === `${soute.id}-D` ? ' shake' : ''}`}
                  style={{
                    border: `1.5px solid ${isArmed && drag.targetSide === 'D' ? '#3fb950' : col.border}`,
                    background: isArmed && drag.targetSide === 'D' ? 'rgba(63,185,80,.12)' : undefined,
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => {
                    if (!bD.length) return
                    e.currentTarget.setPointerCapture(e.pointerId)
                    startGesture({ type: 'remove', souteId: soute.id, side: 'D', x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false })
                  }}
                >
                  {renderSideSlots(bD, cap, false)}
                </div>
              </div>

              <div className="mb-m-dock" style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                {(soute.materiaux || [mat]).filter(m => m.masse > 0).map((matChip, mi) => {
                  const n = (matChip.nom || '').toLowerCase()
                  const chipBorder = n.includes('tungst') ? 'rgba(26,115,232,.55)' : n.includes('plomb') ? 'rgba(160,160,180,.45)' : 'rgba(255,215,0,.4)'
                  const chipColor  = n.includes('tungst') ? 'rgba(100,170,255,.9)' : n.includes('plomb') ? 'rgba(200,200,210,.9)' : 'rgba(255,200,80,.9)'
                  return (
                    <button
                      key={mi}
                      className="mb-dock-chip"
                      style={{ border: `1px solid ${chipBorder}`, color: chipColor }}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        startGesture({ type: 'add', souteId: soute.id, material: matChip, x: e.clientX, y: e.clientY, startY: e.clientY, targetSide: null })
                      }}
                    >
                      {matChip.nom} {matChip.masse}g
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Alignement Cible Météo — curseur amorti, dilaté sur la zone optimale ±40g */}
        <div className="mb-trend-container" style={{ margin: '8px 0', background: '#161b22', borderRadius: 6, padding: '6px 10px', border: '1px solid #21262d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#8b949e', marginBottom: 3 }}>
            <span>Alignement Cible Météo</span>
            <span style={{ fontWeight: 'bold', color: isOptimalConfig ? '#3fb950' : '#f0a500' }}>
              {isOptimalConfig ? 'Prêt à lancer ✓' : dm > 0 ? 'Trop lourd' : 'Trop léger'}
            </span>
          </div>
          <div style={{ height: 6, background: '#30363d', borderRadius: 3, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '30%', right: '30%', top: 0, bottom: 0, background: 'rgba(63,185,80,.08)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: isOptimalConfig ? '#3fb950' : '#8b949e', zIndex: 3 }} />
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(96, Math.max(4, visualPercent))}%`,
                transform: 'translateX(-50%)',
                top: -2, width: 10, height: 10, borderRadius: '50%',
                background: isOptimalConfig ? '#3fb950' : '#f0a500',
                boxShadow: '0 0 6px rgba(0,0,0,0.5)',
                zIndex: 4,
                transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>
        </div>

        {/* CG_TrendLine — bande dédiée juste au-dessus de la barre de stats. Marqueur clair = CG
            committé ; marqueur coloré + bande = aperçu prédictif pendant un geste actif (ajout/retrait). */}
        <div className="mb-m-cgline" style={{ position: 'relative', height: 10, background: '#161b22', borderRadius: 5, margin: '0 0 8px', overflow: 'hidden', border: '1px solid #21262d' }}>
          <div style={{ position: 'absolute', left: '25%', width: '50%', top: 0, bottom: 0, background: 'rgba(63,185,80,.10)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#444' }} />
          {preview && (
            <div
              style={{
                position: 'absolute', top: 1, bottom: 1,
                left: `${Math.min(cgToPercent(displayCfg.cg, model.cgVide), cgToPercent(preview.cg, model.cgVide))}%`,
                width: `${Math.abs(cgToPercent(preview.cg, model.cgVide) - cgToPercent(displayCfg.cg, model.cgVide))}%`,
                background: cgColor, borderRadius: 4,
              }}
            />
          )}
          <div style={{ position: 'absolute', top: -1, bottom: -1, width: 2, borderRadius: 1, left: `${cgToPercent(displayCfg.cg, model.cgVide)}%`, background: '#c9d1d9' }} />
          {preview && (
            <div style={{ position: 'absolute', top: -1, bottom: -1, width: 2, borderRadius: 1, left: `${cgToPercent(preview.cg, model.cgVide)}%`, background: cgColor }} />
          )}
        </div>

        <div className="mb-m-info" style={{ flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: isFaiOver ? '#f85149' : '#3fb950' }}>
                {(masseAff / 1000).toFixed(3)} kg
              </div>
              <div style={{ fontSize: 9, color: isFaiOver ? '#f85149' : '#8b949e' }}>
                cfg #{displayCfg.n} · {chargeAl} g/dm²{isFaiOver && ' ⛔ FAI'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: cgColor }}>{cgAff.toFixed(1)} mm</span>
              <div style={{ fontSize: 9, color: '#8b949e' }}>CG</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6, width:'100%' }}>
          {onBack && (
            <button onClick={onBack} style={{ width:44, height:36, background:'#161b22', border:'1px solid #30363d', borderRadius:8, color:'#58a6ff', fontSize:20, cursor:'pointer', touchAction:'manipulation', flexShrink:0 }}>&#8592;</button>
          )}
          <button
            onClick={() => onAppliquer(masseAff)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              flex: 1, height: 36,
              background: isOptimalConfig ? '#0d4a36' : '#21262d',
              border: isOptimalConfig ? '1px solid #238636' : '1px solid #30363d',
              borderRadius: 8,
              color: isOptimalConfig ? '#3fb950' : '#8b949e',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            ✓ APPLIQUER LA CONFIGURATION {isOptimalConfig ? 'IDÉALE' : ''}
          </button>
          </div>
        </div>
      </div>

      {drag && (
        <div
          style={{
            position: 'fixed', left: drag.x, top: drag.y, width: 18, height: 18,
            marginLeft: -9, marginTop: -9, borderRadius: 4, pointerEvents: 'none', zIndex: 999,
            background: drag.type === 'add' ? '#e8b923' : '#f85149',
            opacity: drag.type === 'remove' && !drag.moved ? 0 : 0.9,
            boxShadow: '0 2px 8px rgba(0,0,0,.4)',
          }}
        />
      )}
    </div>
  )
}
