import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useESPStore } from '../../stores/espStore'
import { useShallow } from 'zustand/react/shallow'
import { useModelStore } from '../../stores/modelStore'
import GliderBrowser from '../GliderBrowser'
import MatriceInteractive from './MatriceInteractive'
import { useMatrixStore } from './matrixStore'
import '../../styles/matrix-gestures.css'
import NezCGLine from './NezCGLine'

// -”€ Poly4 fallback (Mamba - pas de model.poly4) -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
const P4 = { A4:-1.728e-4, A3:8.178e-3, A2:-0.14980, A1:1.34713, A0:-1.19522, vMin:4.05, vMax:15.30 }
function poly4Fallback(v) {
  v = Math.max(P4.vMin, Math.min(P4.vMax, v))
  return P4.A4*v**4 + P4.A3*v**3 + P4.A2*v**2 + P4.A1*v + P4.A0
}

// -”€ Poly4 table (Pike - interpolation depuis model.poly4) -”€-”€-”€-”€-”€-”€-”€-”€-”€-
const P4_REF_8MS = 3.474 // Poly4(8.0) reference Pike 0m K=1.00
function getMasse0m(v, p4) {
  if (!p4) return poly4Fallback(v)
  if (p4.type === 'coefficients') {
    v = Math.max(p4.vMin||4.05, Math.min(p4.vMax||15.30, v))
    return p4.A4*v**4 + p4.A3*v**3 + p4.A2*v**2 + p4.A1*v + p4.A0
  }
  if (p4.type !== 'table') return poly4Fallback(v)
  const T = p4
  if (v <= T.vent[0]) return T.masse[0]
  if (v >= T.vent[T.vent.length - 1]) return T.masse[T.masse.length - 1]
  for (let i = 0; i < T.vent.length - 1; i++) {
    if (v >= T.vent[i] && v <= T.vent[i + 1]) {
      const t = (v - T.vent[i]) / (T.vent[i + 1] - T.vent[i])
      return T.masse[i] + t * (T.masse[i + 1] - T.masse[i])
    }
  }
  return T.masse[0]
}

function ventFromMasse(targetKg, p4, kPente, modelOff, offVal, alt) {
  let lo = 4.0, hi = 15.5
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    const m0 = getMasse0m(mid, p4)
    const mAlt = getMasseAlt(m0, alt)
    const tg = mAlt * kPente + modelOff / 1000 + offVal / 1000
    if (tg < targetKg) lo = mid; else hi = mid
  }
  return +((lo + hi) / 2).toFixed(1)
}

function getMasseAlt(m0, alt) {
  if (alt <= 0) return m0
  return m0 * Math.pow(1 - (0.0065 * alt) / 288.15, 5.25588)
}

function findNearest(matrix, tg) {
  let best = 0, bd = Infinity
  for (let i = 0; i < matrix.length; i++) {
    const d = Math.abs(matrix[i].m - tg)
    if (d < bd) { bd = d; best = i }
  }
  return best
}

// -”€ Détection format slots -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€
// Ancien format Mamba : cfg.av = { G: 2, D: 1, matG: 'Laiton', matD: 'Laiton' }
// Nouveau format Pike : cfg.av = { G: [{nom:'Laiton', masse:42},...], D: [...] }
function isNewFormat(side) {
  return Array.isArray(side)
}

// -”€ MAT_KEYS dynamiques selon nombre de soutes -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€
// 2 soutes - ['av', 'ar']   (Pike)
// 3 soutes - ['av', 'c', 'ar'] (Mamba)
function getMatKeys(nbSoutes) {
  if (nbSoutes === 2) return ['av', 'ar']
  if (nbSoutes >= 3) return ['av', 'c', 'ar']
  return ['av']
}

// -”€ Couleur slot selon matériau -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
function slotClsFromNom(nom) {
  if (!nom) return 'mb-slot mb-s'
  const n = nom.toLowerCase()
  if (n.includes('plomb'))  return 'mb-slot mb-p'
  if (n.includes('tungst')) return 'mb-slot mb-t'
  return 'mb-slot mb-l'
}


// -”€ CSS -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
const CSS = `
.mb-app{display:flex;flex-direction:column;height:100%;max-width:420px;margin:0 auto;background:#05070a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;user-select:none}
.mb-tabs{display:flex;gap:4px;padding:6px 6px 0;height:42px;flex-shrink:0}
.mb-tab{flex:1;padding:8px 0;border-radius:8px 8px 0 0;border:none;cursor:pointer;font-size:13px;font-weight:700;background:#1a1f2a;color:#8b949e;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mb-tab.on{background:#161b22;color:#fff;border-bottom:2px solid #3fb950}
.mb-calc{display:flex;flex-direction:column;flex:1;padding:4px;min-height:0}
.mb-vent{height:7vh;background:linear-gradient(135deg,#0e4429,#1a5a3a);border-radius:12px;text-align:center;border:2px solid #238636;display:flex;flex-direction:column;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4);margin-bottom:6px;flex-shrink:0;position:relative;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mb-vent.active{background:linear-gradient(135deg,#1a73e8,#1557b0);border-color:#fff;box-shadow:0 0 20px rgba(26,115,232,.7)}
.mb-vent-val{font-size:36px;font-weight:900;line-height:1}
.mb-vent-lbl{font-size:11px;font-weight:700;opacity:.95;margin-top:2px;letter-spacing:1px}
.mb-gps-btn{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;background:#065f46;border:2px solid #34d399;color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mb-gps-btn.capturing{background:#1a3a8f;border-color:#60a5fa;animation:mbpulse 1s infinite}
@keyframes mbpulse{0%,100%{opacity:1}50%{opacity:.5}}
.mb-baro{flex:1;display:flex;flex-direction:column;padding:0;min-height:0}
.mb-row-wrap{display:flex;flex-direction:column;flex:1}
.mb-row-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;padding-left:6px}
.mb-row{display:flex;justify-content:center;gap:4px;flex:1}
.mb-side{display:flex;gap:2px;width:48%;border-radius:6px;padding:2px;background:rgba(255,255,255,.02)}
.mb-side-l{flex-direction:row-reverse}
.mb-slot{flex:1;height:100%;border-radius:4px;background:rgba(255,255,255,.04);border:1px solid #1e2530}
.mb-s{background:#1a2535;opacity:.15;border:1px dashed rgba(255,255,255,.07)}
.mb-l{background:linear-gradient(135deg,#c8a030,#e8b840);box-shadow:inset 0 0 10px rgba(255,200,0,.5);border:1px solid rgba(255,255,255,.3)}
.mb-p{background:linear-gradient(135deg,#708090,#8a9aaa);box-shadow:inset 0 0 10px rgba(100,170,255,.3);border:1px solid rgba(255,255,255,.25)}
.mb-t{background:linear-gradient(135deg,#2255aa,#3377cc);box-shadow:inset 0 0 10px rgba(100,170,255,.3);border:1px solid rgba(100,180,255,.3)}
.mb-data{min-height:50px;flex-shrink:0;display:flex;justify-content:space-around;align-items:center;padding:8px 12px;background:#0d1117;border:1px solid #30363d;border-radius:12px;margin:4px 0}




.mb-alt{display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.25);border-radius:8px;padding:4px 12px;margin:2px 0;min-height:28px}
.mb-ab-lbl{font-size:9px;color:#8b949e;font-weight:700;letter-spacing:.5px;display:block}
.mb-ab-val{font-size:14px;font-weight:900;color:#a78bfa}
.mb-ctrl{height:26vh;min-height:185px;flex-shrink:0;background:#0d1117;border-radius:12px;padding:10px;border:1px solid #30363d;display:flex;flex-direction:column;gap:8px}
.mb-ctrl-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;flex-grow:1}
.mb-ctrl-left{display:grid;grid-template-rows:1fr 1fr;gap:6px}
.mb-ctrl-top2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mb-ctrl-arrows{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mb-mode-btn{background:#1c2128;border:2px solid #30363d;border-radius:10px;display:flex;flex-direction:column;justify-content:center;align-items:center;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mb-mode-btn.active{background:linear-gradient(135deg,#1a73e8,#1557b0);border-color:#fff}
.mb-mode-btn.active-alt{background:linear-gradient(135deg,#6d28d9,#4c1d95);border-color:#a78bfa}
.mb-mode-val{font-size:18px;font-weight:900;line-height:1}
.mb-mode-lbl{font-size:8px;font-weight:700;opacity:.85;margin-top:3px;letter-spacing:.5px}
.mb-nav{background:linear-gradient(135deg,#21262d,#161b22);border:2px solid #444c56;border-radius:12px;color:#fff;font-size:60px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mb-nav:active{background:#30363d;transform:scale(.97)}
.mb-hint{text-align:center;font-size:9px;color:#8b949e;padding:3px;opacity:.65}
.mb-matrix{display:flex;flex-direction:column;flex:1;padding:5px 6px 4px;gap:4px;min-height:0}
.mb-m-hdr{background:linear-gradient(135deg,#0d1a2e,#1a2a4a);border-radius:10px;padding:7px 12px;border:1px solid #1a73e8;flex-shrink:0;display:flex;justify-content:space-between;align-items:center}
.mb-sg{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;flex-shrink:0}
.mb-rb{padding:5px 2px;background:#161b22;border-radius:5px;text-align:center;font-size:10px;font-weight:700;cursor:pointer;border:1px solid #21262d;color:#8b949e;display:flex;align-items:center;justify-content:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mb-rb.sel{background:#1a2744;border-color:#1a73e8;color:#fff}
.mb-rb.near{border-color:#3fb950}
.mb-m-soutes{flex:1;display:flex;flex-direction:column;gap:4px;min-height:0;overflow-y:auto}
.mb-m-row-wrap{display:flex;flex-direction:column;flex:1}
.mb-m-lbl{font-size:8px;font-weight:700;letter-spacing:.5px;padding-left:4px;line-height:1;margin:1px 0}
.mb-m-row{display:flex;gap:8px;flex:1}
.mb-m-side{flex:1;display:flex;gap:2px;border-radius:6px;padding:3px;background:rgba(255,255,255,.02)}
.mb-m-side-l{flex-direction:row-reverse}
.mb-m-info{background:#161b22;border-radius:8px;padding:6px 10px;flex-shrink:0;border:1px solid #21262d;display:flex;align-items:center;gap:8px}
.mb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:flex-end;justify-content:center}
.mb-overlay-box{width:100%;max-width:420px;background:#0d1117;border-radius:16px 16px 0 0;border:1px solid #30363d;padding:16px;max-height:85vh;overflow-y:auto}
`

export default function DashboardPilote({ onChangePlaneur }) {
  // -”€ Stores -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
  const {
    params, offset, activeSite,
    setOffset, setBallastSnap,
    incrementParam, decrementParam, setParam,
    nezDelta, incrementNez, decrementNez,
  } = useAppStore(useShallow(s => ({
    params:         s.params,
    offset:         s.offset,
    activeSite:     s.activeSite,
    setOffset:      s.setOffset,
    setBallastSnap: s.setBallastSnap,
    incrementParam: s.incrementParam,
    setParam:       s.setParam,
    decrementParam: s.decrementParam,
    nezDelta:       s.nezDelta,
    incrementNez:   s.incrementNez,
    decrementNez:   s.decrementNez,
  })))

  const altitude    = useAppStore(s => parseFloat(s.altitude) || 0)
  const espIrpx     = useESPStore(s => s.irpx)
  const espConnected = useESPStore(s => s.connected || s.demo)
  const setAltitude = useAppStore(s => s.setAltitude)
  const model       = useModelStore(s => s.models?.[s.activeModelId] ?? null)

  // -”€ State local -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€
  const [selectedParam, setSelectedParam] = useState('vent')
  const [kgManuel,      setKgManuel]      = useState(null)
  const [tab,           setTab]           = useState('calc')
  const [showBrowser,  setShowBrowser]   = useState(false)
  const importModel    = useModelStore(s => s.importModel)
  const setActiveModel = useModelStore(s => s.setActiveModel)
  const updateMatrix  = useModelStore(s => s.updateMatrix)
  const [matrixIdx,     setMatrixIdx]     = useState(null)
  const [cfgAppliquee,  setCfgAppliquee]  = useState(null)
  const [gpsStatus,     setGpsStatus]     = useState('')
  const [gpsOpen,       setGpsOpen]       = useState(false)
  const [gpsData,       setGpsData]       = useState({ lat:null, lon:null, alt:null, accuracy:null })
  const repeatRef = useRef(null)

  // -”€ Guard -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€
  if (!model) return (
    <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#05070a',color:'#8b949e'}}>
      Chargement...
    </div>
  )

  // -”€ Données modèle -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
  const matrix  = model.matrix || []
  const soutes  = model.soutes
    ? Object.values(model.soutes).sort((a, b) => a.distanceBA - b.distanceBA)
    : []

  // MAT_KEYS dynamiques : 2 soutes - av/ar, 3 soutes - av/c/ar
  const MAT_KEYS = getMatKeys(soutes.length)

  // -”€ Calculs -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€
  const vent          = params.vent
  const m0kg          = getMasse0m(vent, model.poly4)  // - lit model.poly4 si dispo
  const mAltkg        = getMasseAlt(m0kg, altitude)
  const modelOffset   = model.offset ?? Math.round(((model.masse_ref_8ms || P4_REF_8MS) - P4_REF_8MS) * 1000)
  const offsetVal     = parseFloat(offset) || 0
  const kPente        = activeSite?.k_v4 ?? activeSite?.k ?? 1.00
  const altCorrection = Math.round((m0kg - mAltkg) * 1000)
  const targetGAuto   = Math.max(model.masseVide, Math.round(mAltkg * kPente * 1000 + modelOffset + offsetVal))
  const targetG       = cfgAppliquee !== null
    ? cfgAppliquee
    : kgManuel !== null
    ? Math.max(model.masseVide, Math.round(kgManuel * 1000))
    : targetGAuto
  const kgVal         = targetG / 1000
  const faiMax         = Math.round((model.surface || 57) * 75)
  const isFaiOver      = targetG > faiMax
  const ci            = matrix.length > 0 && targetG > model.masseVide ? findNearest(matrix, targetG) : -1
 
 const cfg           = ci >= 0 ? matrix[ci] : null
  const dm            = cfg ? cfg.m - targetG : 0
  const cgD           = cfg ? cfg.cg - model.cgVide : 0
  const cgClass       = Math.abs(cgD) < 0.5 ? 'neutre' : cgD < 0 ? 'avant' : 'arriere'
  // ── Nez Slots ──
  const nezDist       = model.nezDist || 0
  const hasNez        = nezDist > 0
  const nezMM         = (hasNez && nezDelta !== 0)
    ? -(nezDelta / (kgVal * 1000 + nezDelta)) * nezDist
    : 0
  const c100          = Math.round((m0kg - getMasseAlt(m0kg, 100)) * 1000)
  const ventLabel     = altitude > 0
    ? `VENT m/s — ${model.nom} — ρ -${altCorrection}g`
    : `VENT m/s — ${model.nom}`
  const displayCfg    = matrixIdx !== null ? matrix[matrixIdx] : cfg

  // -”€ Sync ballastSnap -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
  useEffect(() => {
    if (tab === 'matrix' && ci >= 0) setMatrixIdx(ci)
  }, [tab, ci])

  useEffect(() => { setCfgAppliquee(null) }, [params.vent])

  useEffect(() => {
    if (cfg && model && setBallastSnap) {
      setBallastSnap({
        masse:       kgVal,
        config:      cfg.n,
        cg:          cfg.cg,
        planeur_id:  model.id  || '',
        planeur_nom: model.nom || '',
        mv:          model.masseVide,
        offset:      modelOffset,
        surface:     model.surface || 57,
      })
    }
  }, [kgVal, cfg, model, modelOffset])
useEffect(() => {
    if (!model || !soutes) return
    const already = useMatrixStore.getState().model
    if (already?.id === model.id) return
    const soutesArr = Array.isArray(soutes)
      ? [...soutes].sort((a,b) => a.distanceBA - b.distanceBA)
      : Object.values(soutes||{}).sort((a,b) => a.distanceBA - b.distanceBA)
    const matKeysArr = ['av','c','ar'].slice(0, soutesArr.length)
    useMatrixStore.getState().init(model, soutesArr, matKeysArr, matrix)
  }, [model])
  // -”€ Helpers rendu slots - supporte les 2 formats -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
  function renderBaroSide(sideKey, souteIdx, cap) {
    const matKey = MAT_KEYS[souteIdx] || 'av'
    const b = cfg ? (cfg[matKey] || {}) : {}
    const side = sideKey === 'G' ? b.G : b.D

    if (isNewFormat(side)) {
      // Nouveau format Pike : tableau d'objets {nom, masse}
      return Array.from({ length: cap }).map((_, i) => (
        <div key={i} className={i < side.length ? slotClsFromNom(side[i]?.nom) : 'mb-slot mb-s'} />
      ))
    } else {
      // Ancien format Mamba : entier + nom matériau
      const n   = (side || 0)
      const nom = sideKey === 'G' ? (b.matG || '') : (b.matD || '')
      return Array.from({ length: cap }).map((_, i) => (
        <div key={i} className={i < n ? slotClsFromNom(nom) : 'mb-slot mb-s'} />
      ))
    }
  }

  function renderMatSide(sideKey, souteIdx, cap, row) {
    const matKey = MAT_KEYS[souteIdx] || 'av'
    const b = row ? (row[matKey] || {}) : {}
    const side = sideKey === 'G' ? b.G : b.D

    if (isNewFormat(side)) {
      // Nouveau format Pike
      return Array.from({ length: cap }).map((_, i) => (
        <div key={i} className={i < side.length ? slotClsFromNom(side[i]?.nom) : 'mb-slot mb-s'} />
      ))
    } else {
      // Ancien format Mamba
      const n   = (side || 0)
      const nom = sideKey === 'G' ? (b.matG || '') : (b.matD || '')
      return Array.from({ length: cap }).map((_, i) => (
        <div key={i} className={i < n ? slotClsFromNom(nom) : 'mb-slot mb-s'} />
      ))
    }
  }

  // -”€ GPS -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€
  function captureGPS() {
    if (!navigator.geolocation) { setGpsStatus('err'); return }
    setGpsStatus('capturing')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsData({
          lat: pos.coords.latitude, lon: pos.coords.longitude,
          alt: pos.coords.altitude, accuracy: Math.round(pos.coords.accuracy)
        })
        setGpsStatus('ok')
        setTimeout(() => setGpsStatus(''), 3000)
      },
      () => { setGpsStatus('err'); setTimeout(() => setGpsStatus(''), 3000) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // -”€ Contrôles -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€
  function selectParam(p) {
    if (p === 'kg' && cfgAppliquee !== null) return
    setSelectedParam(p)
    if (p !== 'kg') setKgManuel(null)
  }
    function handlePress(dir) {
    doChange(dir)
    if (selectedParam === 'nez') return
    repeatRef.current = setTimeout(() => {
      repeatRef.current = setInterval(() => doChange(dir), 200)
    }, 400)
  }
  function handleRelease() {
    clearTimeout(repeatRef.current)
    clearInterval(repeatRef.current)
  }
  function doChange(dir) {
    switch (selectedParam) {
      case 'vent':
        if (dir > 0 && vent >= 15.5) { setSelectedParam('kg'); setKgManuel(kgVal); break }
        dir > 0 ? incrementParam('vent') : decrementParam('vent'); break
      case 'kg': {
        const base = kgManuel !== null ? kgManuel : kgVal
        const nextKg = parseFloat(Math.max(model.masseVide / 1000, base + dir * 0.010).toFixed(3))
        setKgManuel(nextKg)
        const syncVent = ventFromMasse(nextKg, model.poly4, kPente, modelOffset, offsetVal, altitude)
        if (syncVent >= 4.0 && syncVent <= 15.5) setParam('vent', syncVent)
        break
      }
      case 'offset':
        setOffset(Math.max(-500, Math.min(500, offsetVal + dir * 42))); break
      case 'alt':
        setAltitude(Math.max(0, Math.min(3000, altitude + dir * 25))); break
      case 'nez':
        dir > 0 ? incrementNez() : decrementNez(); break
    }
  }

  // -”€ Render -”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-”€-
  return (
    <>
      <style>{CSS}</style>
      <div className="mb-app" translate="no">

        {/* Onglets */}


        {/* -”€ TAB CALCULATEUR -”€ */}
        {tab === 'calc' && (
          <div className="mb-calc">

            {/* Vent */}
            <div className={`mb-vent${selectedParam === 'vent' ? ' active' : ''}`} onClick={() => selectParam('vent')}>
              <div className="mb-vent-val">{vent.toFixed(1)}</div>
              <div className="mb-vent-lbl">{ventLabel}</div>
              <button
                className={`mb-gps-btn${gpsStatus === 'capturing' ? ' capturing' : ''}`}
                onClick={e => { e.stopPropagation(); setGpsOpen(true); captureGPS() }}>
                {gpsStatus === 'ok' ? '✅' : gpsStatus === 'err' ? '❌' : '📍'}
              </button>
            </div>

            {/* Jauge IRPX Live */}
            {espConnected && espIrpx !== null && (
              <div style={{ margin:'4px 0', padding:'6px 10px', background:'#0d1117', border:'1px solid #1e2535', borderRadius:8, flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:9, color:'#4a5568', fontWeight:700, letterSpacing:1.5 }}>IRPX LIVE</span>
                  <span style={{ fontSize:16, fontWeight:900, color: espIrpx < 4 ? '#f85149' : espIrpx < 7 ? '#f0a500' : espIrpx < 10 ? '#3fb950' : espIrpx < 12 ? '#00d1b2' : '#e6edf3' }}>{espIrpx.toFixed(2)}</span>
                </div>
                <div style={{ position:'relative', height:12, borderRadius:6, overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, #f85149 0%, #f0a500 25%, #3fb950 45%, #00d1b2 65%, #e6edf3 100%)', borderRadius:6 }} />
                  <div style={{ position:'absolute', top:0, bottom:0, left:'50%', width:1, background:'rgba(0,0,0,0.5)' }} />
                  <div style={{
                    position:'absolute', top:'50%', transform:'translate(-50%,-50%)',
                    left:`${Math.min(100, Math.max(0, espIrpx / 14 * 100))}%`,
                    width:10, height:10, borderRadius:'50%',
                    background: espIrpx < 4 ? '#f85149' : espIrpx < 7 ? '#f0a500' : espIrpx < 10 ? '#3fb950' : espIrpx < 12 ? '#00d1b2' : '#e6edf3',
                    border:'2px solid #0b0e12'
                  }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                  <span style={{ fontSize:7, color:'#4a5568' }}>0</span>
                  <span style={{ fontSize:7, color:'#3fb950', fontWeight:700 }}>7 REF</span>
                  <span style={{ fontSize:7, color:'#4a5568' }}>14</span>
                </div>
              </div>
            )}
            {/* Barographe - soutes dynamiques */}
            <div className="mb-baro" style={{ position:'relative' }}>
              {hasNez && (
                <div
                  onClick={() => selectParam('nez')}
                  style={{
                    position:'absolute', top:0, bottom:0,
                    left:'50%', transform:'translateX(-50%)',
                    width:28, zIndex:5, cursor:'pointer',
                    touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
                  }}>
                  <NezCGLine
                    mm={nezMM}
                    grams={nezDelta}
                    active={selectedParam === 'nez'}
                    showDot={true}
                    cgColor={Math.abs(cgD + nezMM) > 3 ? '#f87171' : cgClass === 'neutre' ? '#4ade80' : cgClass === 'avant' ? '#fbbf24' : cgClass === 'arriere' ? '#f87171' : '#8b949e'}
                  />
                </div>
              )}
              {soutes.map((soute, idx) => {
                const cap         = soute.capacite || 3
                // Couleur depuis soute.couleur (Soute editor) ou fallback par index
                const fallbackColors = ['#ffd700', '#1a73e8', '#3fb950']
                const sColor = soute.couleur || fallbackColors[idx] || fallbackColors[0]
                const col = { border: sColor + '66', label: sColor }
                const matLabel    = soute.materiaux?.map(m => `${m.nom} ${m.masse}g`).join(' - ') || ''
                return (
                  <div key={idx} className="mb-row-wrap">
                    <div className="mb-row-lbl" style={{ color: col.label }}>
                      {soute.nom} - {matLabel}
                    </div>
                    <div className="mb-row">
                      <div className="mb-side mb-side-l" style={{ border: `1.5px solid ${col.border}` }}>
                        {renderBaroSide('G', idx, cap)}
                      </div>
                      <div className="mb-side" style={{ border: `1.5px solid ${col.border}` }}>
                        {renderBaroSide('D', idx, cap)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bande altitude */}
            {altitude > 0 && selectedParam === 'alt' && (
              <div className="mb-alt">
                <div style={{ textAlign:'center', flex:1 }}>
                  <span className="mb-ab-lbl">ALTITUDE</span>
                  <span className="mb-ab-val">{altitude} m</span>
                </div>
                <div style={{ textAlign:'center', flex:1 }}>
                  <span className="mb-ab-lbl">DÉDUIT</span>
                  <span className="mb-ab-val">{altCorrection}g</span>
                </div>
                <div style={{ textAlign:'center', flex:1 }}>
                  <span className="mb-ab-lbl">FINALE</span>
                  <span className="mb-ab-val">{kgVal.toFixed(3)} kg</span>
                </div>
              </div>
            )}

            {/* Data bar — Pente + Charge alaire + CG */}
            <div className="mb-data">
              <div style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:0.5, marginBottom:2 }}>PENTE</div>
                <div style={{ fontSize:14, fontWeight:800, color: activeSite?.name ? '#58a6ff' : '#4a5568', lineHeight:1.2 }}>
                  {activeSite?.name || 'Aucune'}
                </div>
                <div style={{ fontSize:9, color:'#4a5568', marginTop:2 }}>
                  K {kPente.toFixed(3)}
                </div>
              </div>
              <div style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:0.5, marginBottom:2 }}>CHARGE</div>
                <div style={{ fontSize:22, fontWeight:900, color: isFaiOver ? '#f85149' : '#ffb74d', lineHeight:1 }}>
                  {(kgVal * 1000 / (model.surface || 57)).toFixed(1)}
                </div>
                <div style={{ fontSize:9, color:'#4a5568', marginTop:2 }}>
                  {isFaiOver ? '⛔ FAI' : 'g/dm²'}
                </div>
              </div>
              <div style={{ textAlign:'center', flex:1, color: Math.abs(cgD + nezMM) > 3 ? '#f87171' : cgClass === 'neutre' ? '#4ade80' : cgClass === 'avant' ? '#fbbf24' : cgClass === 'arriere' ? '#f87171' : '#8b949e' }}>
                <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:0.5, marginBottom:2 }}>CG</div>
                <div style={{ fontSize:22, fontWeight:900, lineHeight:1 }}>
                  {cfg ? (cfg.cg + nezMM).toFixed(1) : model.cgVide}
                  {(cgD + nezMM) !== 0 && <span style={{ fontSize:12, fontWeight:700, marginLeft:3 }}>{(cgD + nezMM) > 0 ? '+' : ''}{(cgD + nezMM).toFixed(1)}mm</span>}
                </div>
                <div style={{ fontSize:9, color:'#4a5568', marginTop:2 }}>
                  Cible {model.cgVide}mm{nezDelta !== 0 && <span style={{ color:'#d29922' }}> · nez {nezDelta > 0 ? '+' : ''}{nezDelta}g</span>}
                </div>
              </div>
            </div>

            {/* Contrôles */}
            <div className="mb-ctrl" style={cfgAppliquee !== null ? { boxShadow: '0 0 12px rgba(88,166,255,0.5)', borderColor: '#58a6ff', transition: 'box-shadow 0.4s, border-color 0.4s' } : { transition: 'box-shadow 0.4s, border-color 0.4s' }}>
              <div className="mb-ctrl-grid">
                <div className="mb-ctrl-left">
                  <div className="mb-ctrl-top2">
                    <button className={`mb-mode-btn${selectedParam === 'kg' ? ' active' : ''}`} onClick={() => selectParam('kg')} style={cfgAppliquee !== null ? { opacity: 0.35, pointerEvents: 'none' } : {}}>
                      <div className="mb-mode-val">{kgVal.toFixed(3)}</div>
                      <div className="mb-mode-lbl">{cfgAppliquee !== null ? '🔒 KG' : 'KG'}</div>
                    </button>
                    <button className={`mb-mode-btn${selectedParam === 'alt' ? ' active-alt' : ''}`} onClick={() => selectParam('alt')}>
                      <div className="mb-mode-val">{altitude}</div>
                      <div className="mb-mode-lbl">ALT m</div>
                    </button>
                  </div>
                  {hasNez ? (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      <button className={`mb-mode-btn${selectedParam === 'offset' ? ' active' : ''}`} onClick={() => selectParam('offset')}>
                        <div className="mb-mode-val">{offsetVal >= 0 ? '+' : ''}{offsetVal}g</div>
                        <div className="mb-mode-lbl">OFFSET</div>
                      </button>
                      <button className={`mb-mode-btn${selectedParam === 'nez' ? ' active' : ''}`} onClick={() => selectParam('nez')} style={selectedParam === 'nez' ? { background:'linear-gradient(135deg,#065f46,#064e3b)', borderColor:'#34d399' } : {}}>
                        <div className="mb-mode-val" style={selectedParam === 'nez' ? { color:'#4ade80' } : {}}>{nezDelta === 0 ? '0' : (nezDelta > 0 ? '+' : '') + nezDelta + 'g'}</div>
                        <div className="mb-mode-lbl">NEZ{nezMM !== 0 ? ` ${nezMM.toFixed(1)}mm` : ''}</div>
                      </button>
                    </div>
                  ) : (
                  <button className={`mb-mode-btn${selectedParam === 'offset' ? ' active' : ''}`} onClick={() => selectParam('offset')}>
                    <div className="mb-mode-val">{offsetVal >= 0 ? '+' : ''}{offsetVal}g</div>
                    <div className="mb-mode-lbl">OFFSET</div>
                  </button>
                  )}
                </div>
                <div className="mb-ctrl-arrows">
                  <button className="mb-nav"
                    onMouseDown={() => handlePress(-1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                    onTouchStart={e => { e.preventDefault(); handlePress(-1) }} onTouchEnd={handleRelease}
                    onTouchCancel={handleRelease}>▼</button>
                  <button className="mb-nav"
                    onMouseDown={() => handlePress(1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                    onTouchStart={e => { e.preventDefault(); handlePress(1) }} onTouchEnd={handleRelease}
                    onTouchCancel={handleRelease}>▲</button>
                </div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button
                  onClick={() => onChangePlaneur ? onChangePlaneur() : setShowBrowser(true)}
                  style={{ flex:1, padding:'6px 0', borderRadius:6, border: '1px solid #30363d', background: 'transparent', color: '#58a6ff', fontSize:11, fontWeight:700, cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
                  PLANEUR
                </button>
                {(
                  <button
                    onClick={() => setTab('matrix')}
                    style={{ flex:1, padding:'6px 0', borderRadius:6, border: tab === 'matrix' ? '1px solid #3fb950' : '1px solid #30363d', background: tab === 'matrix' ? '#161b22' : 'transparent', color: tab === 'matrix' ? '#fff' : '#4a5568', fontSize:11, fontWeight:700, cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
                    MATRICE
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL PLANEUR */}
        {showBrowser && (
          <GliderBrowser
            onClose={() => setShowBrowser(false)}
            onImport={(data) => {
              if (importModel) importModel(data)
              if (setActiveModel) setActiveModel(data.id)
              setShowBrowser(false)
            }}
          />
        )}

        {/* TAB MATRICE */}
        {tab === 'matrix' && !matrix?.length && (
          <div style={{ padding:24, textAlign:'center', color:'#8b949e', marginTop:40 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🎯</div>
            <div style={{ fontSize:14, marginBottom:8 }}>Aucune matrice pour ce modele</div>
            <div style={{ fontSize:11, color:'#4a5568' }}>Importez un modele avec une matrice depuis le catalogue</div>
          </div>
        )}
        {tab === 'matrix' && matrix?.length > 0 && (
          <MatriceInteractive
            targetGAuto={targetGAuto}
            onBack={() => setTab('calc')}
            onAppliquer={(masse) => { updateMatrix(useMatrixStore.getState().matrix); setCfgAppliquee(masse); setSelectedParam('vent'); setTab('calc') }}
          />
        )}
        {/* -”€ GPS OVERLAY -”€ */}
        {gpsOpen && (
          <div className="mb-overlay" onClick={() => setGpsOpen(false)}>
            <div className="mb-overlay-box" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:12 }}>📍 Position GPS</div>
              {gpsStatus === 'capturing' && (
                <div style={{ color:'#8b949e', fontSize:13, marginBottom:8 }}>Localisation en cours...</div>
              )}
              {gpsData.lat && (
                <div style={{ fontSize:12, color:'#8b949e', marginBottom:10 }}>
                  <div>{gpsData.lat?.toFixed(5)}° - {gpsData.lon?.toFixed(5)}°</div>
                  <div>Alt GPS: {gpsData.alt !== null ? Math.round(gpsData.alt) + " m" : "-"} - Precision: {gpsData.accuracy} m</div>
                </div>
              )}
              {gpsData.alt !== null && (
                <button
                  onClick={() => { setAltitude(Math.round(gpsData.alt / 50) * 50); setGpsOpen(false) }}
                  style={{ background:'#1a73e8', border:'none', color:'#fff', borderRadius:8,
                    padding:'10px 16px', cursor:'pointer', fontWeight:700, fontSize:13,
                    width:'100%', marginBottom:8, touchAction:'manipulation' }}>
                  📍 Utiliser {Math.round(gpsData.alt)} m
                </button>
              )}
              <button
                onClick={() => setGpsOpen(false)}
                style={{ background:'#1c2128', border:'1px solid #30363d', color:'#8b949e',
                  borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:12,
                  width:'100%', touchAction:'manipulation' }}>
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
