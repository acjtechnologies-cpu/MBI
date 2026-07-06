import { useRef, useState } from 'react'
import { useMatrixStore } from './matrixStore'

function slotCls(nom) {
  if (!nom) return 'mb-slot mb-s'
  const n = nom.toLowerCase()
  if (n.includes('plomb')) return 'mb-slot mb-p'
  if (n.includes('tungst')) return 'mb-slot mb-t'
  return 'mb-slot mb-l'
}

function chipStyle(nomMat) {
  const n = (nomMat || '').toLowerCase()
  if (n.includes('tungst')) return { border: 'rgba(26,115,232,.55)',  color: 'rgba(100,170,255,.9)' }
  if (n.includes('plomb'))  return { border: 'rgba(160,160,180,.45)', color: 'rgba(200,200,210,.9)' }
  return                           { border: 'rgba(255,215,0,.4)',    color: 'rgba(255,200,80,.9)'  }
}

const COLORS = [
  { border: 'rgba(255,215,0,.4)',    label: 'rgba(255,200,80,.9)' },
  { border: 'rgba(26,115,232,.45)',  label: 'rgba(100,170,255,.9)' },
  { border: 'rgba(63,185,80,.4)',    label: 'rgba(63,185,80,.9)' },
]

const CG_TOLERANCE   = 3.0
const REMOVE_THRESHOLD = 20
const DM_OPT_MARGIN  = 40
const DM_VIS_MAX     = 200

function renderSideSlots(blocs, cap, isLeft) {
  return Array.from({ length: cap }).map((_, i) => {
    const bi = isLeft ? (cap - 1 - i) : i
    return <div key={i} className={bi < blocs.length ? slotCls(blocs[bi]?.nom) : 'mb-slot mb-s'} />
  })
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function countAt(matrix, idx, souteId, side) {
  return matrix[idx]?.[souteId]?.[side]?.length ?? 0
}

function previewDelta(displayCfg, soute, material, sign) {
  const newMass   = displayCfg.m + sign * material.masse
  const newMoment = displayCfg.m * displayCfg.cg + sign * material.masse * soute.distanceBA
  const newCG     = newMass > 0 ? newMoment / newMass : displayCfg.cg
  return { m: Math.round(newMass), cg: Number(newCG.toFixed(2)) }
}

function cgToPercent(cg, cgVide) {
  return Math.max(0, Math.min(100, 50 + ((cg - cgVide) / CG_TOLERANCE) * 25))
}

function dmToVisualPercent(dm) {
  if (Math.abs(dm) <= DM_OPT_MARGIN) return 50 + (dm / DM_OPT_MARGIN) * 20
  const sign  = dm > 0 ? 1 : -1
  const excess = Math.min(Math.abs(dm) - DM_OPT_MARGIN, DM_VIS_MAX - DM_OPT_MARGIN)
  return 50 + sign * 20 + sign * (excess / (DM_VIS_MAX - DM_OPT_MARGIN)) * 30
}

export default function MatriceInteractive({ targetGAuto, onAppliquer, onBack, onSaveMatrix }) {
  const model    = useMatrixStore(s => s.model)
  const soutes   = useMatrixStore(s => s.soutes)
  const matrix   = useMatrixStore(s => s.matrix)
  const ci       = useMatrixStore(s => s.ci)
  const setCi           = useMatrixStore(s => s.setCi)
  const duplicateConfig = useMatrixStore(s => s.duplicateConfig)

  const [drag,     setDrag]     = useState(null)
  const [shakeKey, setShakeKey] = useState(null)

  const zonesRef       = useRef({})
  const dragActiveRef  = useRef(false)
  const lastGestureRef = useRef(0)
  const dragStateRef   = useRef(null)
  const onSaveRef = useRef(null)
  onSaveRef.current = onSaveMatrix

  const setZoneRef = (souteId, side) => (node) => {
    if (node) zonesRef.current[`${souteId}-${side}`] = node
    else delete zonesRef.current[`${souteId}-${side}`]
  }

  // Handlers recréés à chaque render — refs stables donc pas de double-registration
  const handlersRef = useRef({})
  handlersRef.current.move = (e) => {
    setDrag((d) => {
      if (!d) return d
      const x = e.clientX, y = e.clientY
      if (d.type === 'add') {
        let targetSide = null
        const draggedUp = (d.startY || d.y) - y
        if (draggedUp > 20) {
          for (const side of ['G', 'D']) {
            const zone = zonesRef.current[`${d.souteId}-${side}`]
            if (zone && pointInRect(x, y, zone.getBoundingClientRect())) { targetSide = side; break }
          }
        }
        const next = { ...d, x, y, targetSide }
        dragStateRef.current = next
        return next
      }
      const moved  = d.moved || Math.hypot(x - d.startX, y - d.startY) > REMOVE_THRESHOLD
      const nextR  = { ...d, x, y, moved }
      dragStateRef.current = nextR
      return nextR
    })
  }
  handlersRef.current.up = (e) => {
    const d = dragStateRef.current
    dragStateRef.current = null
    lastGestureRef.current = Date.now()
    dragActiveRef.current  = false
    window.removeEventListener('pointermove', handlersRef.current.move)
    window.removeEventListener('pointerup',   handlersRef.current.up)
    setDrag(null)

    if (!d) return
    window.setTimeout(() => onSaveRef.current?.(), 50)
    const st = useMatrixStore.getState()

    if (d.type === 'add' && d.targetSide) {
      const before = countAt(st.matrix, st.ci, d.souteId, d.targetSide)
      st.addBloc(st.ci, d.souteId, d.targetSide, d.material)
      const after  = countAt(useMatrixStore.getState().matrix, st.ci, d.souteId, d.targetSide)
      if (after === before) {
        const key = `${d.souteId}-${d.targetSide}`
        setShakeKey(key)
        window.setTimeout(() => setShakeKey(k => (k === key ? null : k)), 300)
      }
    } else if (d.type === 'remove' && d.moved) {
      const zone        = zonesRef.current[`${d.souteId}-${d.side}`]
      const rect        = zone?.getBoundingClientRect()
      const stillInside = rect && pointInRect(e.clientX, e.clientY, rect)
      if (!stillInside) st.removeBloc(st.ci, d.souteId, d.side)
    }
  }

  function startGesture(initial) {
    if (dragActiveRef.current) return
    if (Date.now() - lastGestureRef.current < 200) return
    dragActiveRef.current  = true
    dragStateRef.current   = initial
    setDrag(initial)
    window.addEventListener('pointermove', handlersRef.current.move)
    window.addEventListener('pointerup',   handlersRef.current.up)
  }

  const safeCi = Math.min(ci, (matrix?.length || 1) - 1)
  if (!model || !matrix?.length || !matrix[safeCi]) return null

  const displayCfg = matrix[safeCi]

  let preview = null
  if (drag?.type === 'add' && drag.targetSide) {
    const soute = soutes.find(s => s.id === drag.souteId)
    if (soute) preview = previewDelta(displayCfg, soute, drag.material, +1)
  } else if (drag?.type === 'remove' && drag.moved) {
    const soute    = soutes.find(s => s.id === drag.souteId)
    const souteIdx = soutes.findIndex(s => s.id === drag.souteId)
    const key      = soute.id
    const sideArr  = displayCfg[key]?.[drag.side] || []
    const lastBlock = sideArr[sideArr.length - 1]
    if (soute && lastBlock) preview = previewDelta(displayCfg, soute, lastBlock, -1)
  }

  const masseAff = preview ? preview.m : displayCfg.m
  const cgAff    = preview ? preview.cg : displayCfg.cg

  const dm              = masseAff - targetGAuto
  const isOptimalConfig = Math.abs(dm) <= DM_OPT_MARGIN
  const visualPercent   = dmToVisualPercent(dm)
  const faiMax          = Math.round((model.surface || 57) * 75)
  const chargeAl        = (masseAff / (model.surface || 57)).toFixed(1)
  const isFaiOver       = masseAff > faiMax
  const deltaCG         = cgAff - model.cgVide
  const deltaNorm       = Math.abs(deltaCG) / CG_TOLERANCE
  const cgColor         = deltaNorm <= 0.3 ? '#3fb950' : deltaNorm <= 0.7 ? '#f0a500' : '#f85149'

  const bestConfigIdx = matrix.reduce((best, row, i) =>
    Math.abs(row.m - targetGAuto) < Math.abs(matrix[best].m - targetGAuto) ? i : best, 0)

  return (
    <div className="mb-matrix" style={{ position: 'relative' }}>
      <div className="mb-m-hdr">
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>🎯 {model.nom} — Matrice Prédicteur</div>
          <div style={{ fontSize: 9, color: '#8b949e', marginTop: 1 }}>
            Cible IQA : <span style={{ color: '#58a6ff', fontWeight: 'bold' }}>{targetGAuto}g</span>
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
          const isBest = i === bestConfigIdx
          return (
            <div key={i}
              className={`mb-rb${ci === i ? ' sel' : ''}`}
              style={{ position: 'relative', borderBottom: isBest ? '2px solid #58a6ff' : undefined }}
              onClick={() => setCi(i)}
            >
              {row.n}
              {isBest && <span style={{ position: 'absolute', top: -2, right: 2, fontSize: 7, color: '#58a6ff' }}>★</span>}
            </div>
          )
        })}
      </div>

      <div className="mb-m-soutes">
        {soutes.map((soute, idx) => {
          const col    = COLORS[idx] || COLORS[0]
          const cap    = soute.capacite || 5
          const b      = displayCfg[soute.id] || {}
          const bG     = b.G || []
          const bD     = b.D || []
          const mat    = soute.materiaux?.[0] || { nom: 'Laiton', masse: 71 }

          const isArmed  = drag?.type === 'add' && drag.souteId === soute.id
          const isDimmed = drag?.type === 'add' && drag.souteId !== soute.id

          return (
            <div key={idx} className="mb-m-row-wrap" style={{
              transition: 'opacity .15s ease, filter .15s ease',
              opacity: isDimmed ? 0.35 : 1,
              filter:  isDimmed ? 'grayscale(1)' : 'none',
            }}>
              <div className="mb-m-lbl" style={{ color: col.label }}>{soute.nom}</div>
              <div className="mb-m-row">
                <div
                  ref={setZoneRef(soute.id, 'G')}
                  className={`mb-m-side mb-m-side-l${shakeKey === `${soute.id}-G` ? ' shake' : ''}`}
                  style={{
                    border:     `1.5px solid ${isArmed && drag.targetSide === 'G' ? '#3fb950' : col.border}`,
                    background: isArmed && drag.targetSide === 'G' ? 'rgba(63,185,80,.12)' : undefined,
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => {
                    if (!bG.length) return
                    startGesture({ type: 'remove', souteId: soute.id, side: 'G', x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false })
                  }}
                >
                  {renderSideSlots(bG, cap, false)}
                </div>
                <div
                  ref={setZoneRef(soute.id, 'D')}
                  className={`mb-m-side${shakeKey === `${soute.id}-D` ? ' shake' : ''}`}
                  style={{
                    border:     `1.5px solid ${isArmed && drag.targetSide === 'D' ? '#3fb950' : col.border}`,
                    background: isArmed && drag.targetSide === 'D' ? 'rgba(63,185,80,.12)' : undefined,
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => {
                    if (!bD.length) return
                    startGesture({ type: 'remove', souteId: soute.id, side: 'D', x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false })
                  }}
                >
                  {renderSideSlots(bD, cap, false)}
                </div>
              </div>

              <div className="mb-m-dock" style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                {(soute.materiaux || [mat]).filter(m => m.masse > 0).map((matChip, mi) => {
                  const cs = chipStyle(matChip.nom)
                  return (
                    <button key={mi} className="mb-dock-chip"
                      style={{ border: `1px solid ${cs.border}`, color: cs.color }}
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

        {/* Bandeau Alignement Cible Météo */}
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
            <div style={{
              position: 'absolute',
              left: `${Math.min(96, Math.max(4, visualPercent))}%`,
              transform: 'translateX(-50%)',
              top: -2, width: 10, height: 10, borderRadius: '50%',
              background: isOptimalConfig ? '#3fb950' : '#f0a500',
              boxShadow: '0 0 6px rgba(0,0,0,0.5)', zIndex: 4,
              transition: 'left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />
          </div>
        </div>

        {/* CG TrendLine */}
        <div className="mb-m-cgline" style={{ position: 'relative', height: 10, background: '#161b22', borderRadius: 5, margin: '0 0 8px', overflow: 'hidden', border: '1px solid #21262d' }}>
          <div style={{ position: 'absolute', left: '25%', width: '50%', top: 0, bottom: 0, background: 'rgba(63,185,80,.10)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#444' }} />
          {preview && (
            <div style={{
              position: 'absolute', top: 1, bottom: 1,
              left:  `${Math.min(cgToPercent(displayCfg.cg, model.cgVide), cgToPercent(preview.cg, model.cgVide))}%`,
              width: `${Math.abs(cgToPercent(preview.cg, model.cgVide) - cgToPercent(displayCfg.cg, model.cgVide))}%`,
              background: cgColor, borderRadius: 4,
            }} />
          )}
          <div style={{ position: 'absolute', top: -1, bottom: -1, width: 2, borderRadius: 1, left: `${cgToPercent(displayCfg.cg, model.cgVide)}%`, background: '#c9d1d9' }} />
          {preview && (
            <div style={{ position: 'absolute', top: -1, bottom: -1, width: 2, borderRadius: 1, left: `${cgToPercent(preview.cg, model.cgVide)}%`, background: cgColor }} />
          )}
        </div>

        {/* Stats + boutons */}
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
          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
            {onBack && (
              <button
                onClick={onBack}
                onPointerDown={e => e.stopPropagation()}
                style={{ width: 44, height: 36, background: '#161b22', border: '1px solid #30363d', borderRadius: 8, color: '#58a6ff', fontSize: 20, cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}
              >←</button>
            )}
            <button
              onClick={() => {
                onSaveMatrix?.()
                const next = (ci + 1) % matrix.length
                duplicateConfig(ci, next)
              }}
              onPointerDown={e => e.stopPropagation()}
              style={{ height: 36, padding: '0 12px', background: '#1a2a4a', border: '1px solid #1a73e8', borderRadius: 8, color: '#60a5fa', fontSize: 11, fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}
            >
              +Config
            </button>
            <button
              onClick={() => onAppliquer(masseAff)}
              onPointerDown={e => e.stopPropagation()}
              style={{
                flex: 1, height: 36,
                background: isOptimalConfig ? '#0d4a36' : '#21262d',
                border:     isOptimalConfig ? '1px solid #238636' : '1px solid #30363d',
                borderRadius: 8,
                color:      isOptimalConfig ? '#3fb950' : '#8b949e',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              ✓ APPLIQUER {isOptimalConfig ? 'IDÉALE' : ''}
            </button>
          </div>
        </div>
      </div>

      {drag && (
        <div style={{
          position: 'fixed', left: drag.x, top: drag.y, width: 18, height: 18,
          marginLeft: -9, marginTop: -9, borderRadius: 4, pointerEvents: 'none', zIndex: 999,
          background: drag.type === 'add' ? '#e8b923' : '#f85149',
          opacity:    drag.type === 'remove' && !drag.moved ? 0 : 0.9,
          boxShadow: '0 2px 8px rgba(0,0,0,.4)',
        }} />
      )}
    </div>
  )
}
