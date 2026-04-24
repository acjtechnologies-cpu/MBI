import { useState, useRef, useEffect } from 'react'
import { useAppStore }   from '../../stores/appStore'
import { useModelStore } from '../../stores/modelStore'
import { useShallow }    from 'zustand/react/shallow'

// ── Helpers poly4 table (lit depuis model.poly4) ──────────────────────────────
function getMasse0m(v, p4) {
  if (p4.type !== 'table') return 0
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

// ── Helpers slots — nouveau schéma {nom, masse} ────────────────────────────────
// Couleur selon nom du matériau et masse
function slotCls(slot) {
  if (!slot) return 'p2-s'
  const n = (slot.nom || '').toLowerCase()
  if (n.includes('tungst')) return 'p2-t'
  if (slot.masse >= 100)    return 'p2-lb'   // 126g, 63g → big
  return 'p2-l'                               // 42g, 21g → small
}

function slotLbl(slot) {
  if (!slot) return ''
  return `${slot.masse}g`
}

function slotTyp(slot) {
  if (!slot) return ''
  const n = (slot.nom || '').toLowerCase()
  if (n.includes('tungst')) return 'T'
  if (slot.masse % 84 === 0 || slot.masse === 126 || slot.masse === 42) return 'L'
  return '½L'
}

function hasTungsten(sideG, sideD) {
  return [...(sideG || []), ...(sideD || [])].some(s => (s.nom || '').toLowerCase().includes('tungst'))
}

function sumSlots(arr) {
  return (arr || []).reduce((s, c) => s + (c.masse || 0), 0)
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
.p2-app { display:flex; flex-direction:column; height:100%; max-width:420px;
  margin:0 auto; background:#05070a; color:#fff;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  user-select:none; }
.p2-tabs { display:flex; gap:4px; padding:6px 6px 0; height:42px; flex-shrink:0; }
.p2-tab { flex:1; padding:8px 0; border-radius:8px 8px 0 0; border:none; cursor:pointer;
  font-size:13px; font-weight:700; background:#1a1f2a; color:#8b949e; transition:all .2s;
  touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.p2-tab.on { background:#161b22; color:#fff; border-bottom:2px solid #3fb950; }
.p2-calc { display:flex; flex-direction:column; flex:1; padding:6px; min-height:0; }
.p2-vent { height:9vh; background:linear-gradient(135deg,#0e4429,#1a5a3a);
  border-radius:12px; text-align:center; border:2px solid #238636;
  display:flex; flex-direction:column; justify-content:center;
  cursor:pointer; transition:all .3s; box-shadow:0 4px 12px rgba(0,0,0,.4);
  margin-bottom:6px; flex-shrink:0; position:relative;
  touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.p2-vent.active { background:linear-gradient(135deg,#1a73e8,#1557b0);
  border-color:#fff; box-shadow:0 0 20px rgba(26,115,232,.7); }
.p2-vent-val { font-size:36px; font-weight:900; line-height:1; }
.p2-vent-lbl { font-size:11px; font-weight:700; opacity:.95; margin-top:2px; letter-spacing:1px; }
.p2-gps-btn { position:absolute; right:10px; top:50%; transform:translateY(-50%);
  width:38px; height:38px; border-radius:50%; background:#065f46; border:2px solid #34d399;
  color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center;
  justify-content:center; box-shadow:0 2px 8px rgba(52,211,153,.4);
  touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.p2-gps-btn.capturing { background:#1a3a8f; border-color:#60a5fa; animation:p2pulse 1s infinite; }
@keyframes p2pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.p2-baro { flex-grow:1; display:flex; flex-direction:column;
  justify-content:space-evenly; padding:4px 0; min-height:0; }
.p2-row-wrap { display:flex; flex-direction:column; gap:2px; }
.p2-row-lbl { font-size:10px; color:#8b949e; font-weight:700;
  text-transform:uppercase; letter-spacing:.3px; padding-left:6px; }
.p2-row-wrap.small .p2-row-lbl { color:rgba(255,200,80,.9); }
.p2-row-wrap.big   .p2-row-lbl { color:rgba(160,200,220,.9); }
.p2-row { display:flex; justify-content:center; gap:5px; height:13vh; max-height:90px; }
.p2-side { display:flex; gap:2px; width:48%; border-radius:6px; padding:2px; background:rgba(255,255,255,.02); }
.p2-side-l { flex-direction:row-reverse; }
.p2-slot { flex:1; height:100%; border-radius:3px; }
.p2-s  { background:#1a2535; opacity:.15; border:1px dashed rgba(255,255,255,.07); }
.p2-l  { background:linear-gradient(135deg,#c8a030,#e8b840); box-shadow:inset 0 0 10px rgba(255,215,0,.5); border:1px solid rgba(255,255,255,.3); }
.p2-lb { background:linear-gradient(135deg,#a07820,#c89030); box-shadow:inset 0 0 10px rgba(200,160,48,.3); border:1px solid rgba(255,215,0,.25); }
.p2-t  { background:linear-gradient(135deg,#2255aa,#3377cc); border:1px solid rgba(100,180,255,.3); }
.p2-data { height:9vh; min-height:60px; flex-shrink:0; display:flex; justify-content:space-around;
  align-items:center; padding:0 12px;
  background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));
  border-radius:10px; margin:4px 0; }
.p2-data-val { font-size:18px; font-weight:900; }
.p2-data-lbl { font-size:8px; font-weight:700; opacity:.7; letter-spacing:.5px; }
.p2-cg { padding:7px 12px; border-radius:8px; background:rgba(59,130,246,.2); border:1px solid rgba(59,130,246,.4); }
.p2-cg.neutre  { background:rgba(74,222,128,.2); border-color:rgba(74,222,128,.5); }
.p2-cg.avant   { background:rgba(251,191,36,.2); border-color:rgba(251,191,36,.5); }
.p2-cg.arriere { background:rgba(248,113,113,.2); border-color:rgba(248,113,113,.5); }
.p2-alt { display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
  background:rgba(167,139,250,.08); border:1px solid rgba(167,139,250,.25);
  border-radius:8px; padding:4px 12px; margin:2px 0; min-height:28px; }
.p2-ab-lbl { font-size:9px; color:#8b949e; font-weight:700; letter-spacing:.5px; display:block; }
.p2-ab-val { font-size:14px; font-weight:900; color:#a78bfa; }
.p2-ctrl { height:32vh; min-height:220px; flex-shrink:0; background:#0d1117;
  border-radius:12px; padding:10px; border:1px solid #30363d; display:flex; flex-direction:column; gap:8px; }
.p2-ctrl-grid { display:grid; grid-template-columns:1fr 1.4fr; gap:10px; flex-grow:1; }
.p2-ctrl-left { display:grid; grid-template-rows:1fr 1fr; gap:6px; }
.p2-ctrl-top2 { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.p2-ctrl-arrows { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.p2-mode-btn { background:#1c2128; border:2px solid #30363d; border-radius:10px;
  display:flex; flex-direction:column; justify-content:center; align-items:center;
  cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.p2-mode-btn.active     { background:linear-gradient(135deg,#1a73e8,#1557b0); border-color:#fff; }
.p2-mode-btn.active-alt { background:linear-gradient(135deg,#6d28d9,#4c1d95); border-color:#a78bfa; }
.p2-mode-val { font-size:18px; font-weight:900; line-height:1; }
.p2-mode-lbl { font-size:8px; font-weight:700; opacity:.85; margin-top:3px; letter-spacing:.5px; }
.p2-nav { background:linear-gradient(135deg,#21262d,#161b22); border:2px solid #444c56;
  border-radius:12px; color:#fff; font-size:60px; font-weight:900; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.p2-nav:active { background:#30363d; transform:scale(.97); }
.p2-hint { text-align:center; font-size:9px; color:#8b949e; padding:3px; opacity:.65; }
.p2-matrix { display:flex; flex-direction:column; flex:1; padding:5px 6px 4px; gap:4px; min-height:0; }
.p2-m-hdr { background:linear-gradient(135deg,#0d1a2e,#1a2a4a); border-radius:10px;
  padding:7px 12px; border:1px solid #1a73e8; flex-shrink:0;
  display:flex; justify-content:space-between; align-items:center; }
.p2-sg { display:grid; grid-template-columns:repeat(10,1fr); gap:2px; flex-shrink:0; }
.p2-rb { padding:5px 2px; background:#161b22; border-radius:5px; text-align:center;
  font-size:10px; font-weight:700; cursor:pointer; border:1px solid #21262d; color:#8b949e;
  display:flex; align-items:center; justify-content:center;
  touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.p2-rb.sel { background:#1a2744; border-color:#1a73e8; color:#fff; }
.p2-rb.t   { border-color:#3377cc; }
.p2-rb.act { border-color:#3fb950; color:#3fb950; }
.p2-m-soutes { flex:1; display:flex; flex-direction:column; gap:4px; min-height:0; overflow-y:auto; }
.p2-m-sw   { display:flex; flex-direction:column; gap:4px; }
.p2-m-lbl  { font-size:9px; font-weight:700; letter-spacing:.5px; padding-left:4px; }
.p2-m-row  { display:flex; gap:5px; height:11vh; max-height:80px; }
.p2-m-side { flex:1; display:flex; gap:2px; border-radius:6px; padding:3px; background:rgba(255,255,255,.02); }
.p2-m-side.av-l { flex-direction:row-reverse; }
.p2-m-side.ar-l { flex-direction:row-reverse; }
.p2-mc     { flex:1; border-radius:4px; background:rgba(255,255,255,.04); border:1px solid #1e2530;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
.p2-mc-w   { font-size:8px; font-weight:700; color:#fff; line-height:1; }
.p2-mc-t   { font-size:7px; color:rgba(255,255,255,.5); line-height:1; }
.l42   { background:linear-gradient(135deg,#c8a030,#e8b840); border-color:transparent; }
.l21   { background:linear-gradient(135deg,#8a6a10,#a07820); border-color:transparent; }
.t70   { background:linear-gradient(135deg,#2255aa,#3377cc); border-color:transparent; }
.l126  { background:linear-gradient(135deg,#a07820,#c89030); border-color:transparent; }
.l63   { background:linear-gradient(135deg,#7a5810,#9a7020); border-color:transparent; }
.p2-sep    { width:4px; background:rgba(255,255,255,.03); border-radius:2px; flex-shrink:0; }
.p2-m-info { background:#161b22; border-radius:8px; padding:6px 10px; flex-shrink:0;
  border:1px solid #21262d; display:flex; align-items:center; gap:8px; }
.p2-m-leg  { display:flex; gap:5px; justify-content:center; flex-wrap:wrap; flex-shrink:0; }
.p2-m-li   { display:flex; align-items:center; gap:2px; font-size:8px; color:#8b949e; }
.p2-m-ls   { width:8px; height:8px; border-radius:2px; }
.p2-m-ph   { display:flex; align-items:center; justify-content:center; flex:1;
  color:#8b949e; font-size:13px; }
`

export default function DashboardPike2() {
  const {
    params, incrementParam, decrementParam,
    offset, setOffset, altitude, setAltitude,
    setBallastSnap, activeSite,
  } = useAppStore(useShallow(s => ({
    params:         s.params,
    incrementParam: s.incrementParam,
    decrementParam: s.decrementParam,
    offset:         s.offset,
    setOffset:      s.setOffset,
    altitude:       s.altitude,
    setAltitude:    s.setAltitude,
    setBallastSnap: s.setBallastSnap,
    activeSite:     s.activeSite,
  })))

  // ── Model depuis store ────────────────────────────────────────────────────
  const model = useModelStore(s => s.models?.[s.activeModelId] ?? null)

  const [selectedParam, setSelectedParam] = useState('vent')
  const [kgManuel,      setKgManuel]      = useState(null)
  const [tab,           setTab]           = useState('calc')
  const [matrixIdx,     setMatrixIdx]     = useState(null)
  const [gpsStatus,     setGpsStatus]     = useState('')
  const repeatRef = useRef(null)

  // Sync config active dans matrice
  useEffect(() => {
    if (tab === 'matrix') setMatrixIdx(ci)
  }, [tab, ci])

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!model) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#05070a', color:'#8b949e' }}>Chargement...</div>
  )

  // ── Données depuis le modèle ───────────────────────────────────────────────
  const matrix = model.matrix || []
  const p4     = model.poly4  || {}
  const alt    = parseFloat(altitude) || 0

  function setAlt(v) { setAltitude(typeof v === 'function' ? v(alt) : v) }

  // ── Calculs ───────────────────────────────────────────────────────────────
  const vent        = params.vent
  const m0kg        = getMasse0m(vent, p4)
  const mAltkg      = getMasseAlt(m0kg, alt)
  const kPente      = activeSite?.k ?? 1.00
  const modelOffset = parseFloat(model.offset) || 0
  const targetGAuto = Math.max(model.masseVide, Math.round((mAltkg * kPente * 1000) + modelOffset + (parseFloat(offset) || 0)))
  const targetG     = kgManuel !== null ? Math.max(model.masseVide, Math.round(kgManuel * 1000)) : targetGAuto
  const kgVal       = parseFloat((targetG / 1000).toFixed(3))
  const ci          = findNearest(matrix, targetG)
  const cfg         = matrix[ci] || null
  const cgD         = cfg ? (cfg.cg - model.cgVide) : 0
  const altCorrection = Math.round((m0kg - mAltkg) * 1000)
  const ventLabel   = alt > 0 ? `VENT m/s — ${model.nom} · ρ −${altCorrection}g` : `VENT m/s — ${model.nom}`
  const dm          = cfg ? cfg.m - targetG : 0
  const c100        = Math.round((m0kg - getMasseAlt(m0kg, 100)) * 1000)
  const nbSmall     = Math.round((parseFloat(offset) || 0) / 42)

  // Max capacité soutes pour rendu uniforme
  const capAV = Math.max(...matrix.map(c => Math.max((c.av?.G||[]).length, (c.av?.D||[]).length)), 1)
  const capAR = Math.max(...matrix.map(c => Math.max((c.ar?.G||[]).length, (c.ar?.D||[]).length)), 1)

  // ── Sync ballastSnap — useEffect (jamais pendant le render) ──────────────
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
        surface:     model.surface || 55,
      })
    }
  }, [kgVal, cfg, model, modelOffset])

  const hints = {
    vent:   alt > 0 ? `Table 0m → Baro ${alt}m → +1g → ${kgVal.toFixed(3)} kg`
                    : `Config #${cfg?.n} — ${cfg?.m}g (Δ${dm > 0 ? '+' : ''}${dm}g)`,
    kg:     `Pas ±10g — config #${cfg?.n} la plus proche`,
    alt:    `Pas 50m — correction ~−${c100}g/100m à ${vent.toFixed(1)} m/s`,
    offset: `Pas 42g · total: ${(parseFloat(offset)||0) >= 0 ? '+' : ''}${offset}g`,
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function selectParam(p) { setSelectedParam(p); if (p !== 'kg') setKgManuel(null) }

  // Rendu soute CALCULATEUR — slots colorés sans étiquette
  function renderSlots(side, cap) {
    return Array.from({ length: cap }).map((_, i) => {
      const slot = side[i]
      return <div key={i} className={`p2-slot ${slotCls(slot)}`} />
    })
  }

  // Rendu soute MATRICE — slots avec étiquette masse/type
  function renderMatrixSide(side, maxN) {
    const full = [...side]
    while (full.length < maxN) full.push(null)
    return full.map((slot, i) => {
      const cls = slot ? slotCssClass(slot) : ''
      return (
        <div key={i} className={`p2-mc${cls ? ' ' + cls : ''}`}>
          {slot && <><div className="p2-mc-w">{slotLbl(slot)}</div><div className="p2-mc-t">{slotTyp(slot)}</div></>}
        </div>
      )
    })
  }

  function slotCssClass(slot) {
    const n = (slot.nom || '').toLowerCase()
    if (n.includes('tungst')) return 't70'
    if (slot.masse === 126)   return 'l126'
    if (slot.masse === 63)    return 'l63'
    if (slot.masse === 42)    return 'l42'
    if (slot.masse === 21)    return 'l21'
    return 'l42'
  }

  // GPS
  function captureGPS() {
    if (!navigator.geolocation) { setGpsStatus('err'); return }
    setGpsStatus('capturing')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const a = pos.coords.altitude
        if (a !== null) { setAlt(Math.round(a / 50) * 50); setGpsStatus('ok') }
        else setGpsStatus('err')
        setTimeout(() => setGpsStatus(''), 3000)
      },
      () => { setGpsStatus('err'); setTimeout(() => setGpsStatus(''), 3000) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  function handlePress(dir) {
    doChange(dir)
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
        dir > 0 ? incrementParam('vent') : decrementParam('vent')
        break
      case 'offset': {
        const cur = parseFloat(offset) || 0
        const newOff = cur + dir * 42
        if ((cur < 0 && newOff > 0) || (cur > 0 && newOff < 0)) setOffset(0)
        else setOffset(Math.max(-500, Math.min(500, newOff)))
        break
      }
      case 'alt':
        setAlt(a => Math.max(0, Math.min(3000, a + dir * 50)))
        break
      case 'kg': {
        const base = kgManuel !== null ? kgManuel : kgVal
        setKgManuel(parseFloat(Math.max(model.masseVide / 1000, Math.min(6.0, base + dir * 0.010)).toFixed(3)))
        break
      }
    }
  }

  // ── Matrice sélectionnée ──────────────────────────────────────────────────
  const selCfg = matrixIdx !== null ? matrix[matrixIdx] : null
  const calcM  = selCfg
    ? model.masseVide
      + sumSlots(selCfg.av?.G) + sumSlots(selCfg.av?.D)
      + sumSlots(selCfg.ar?.G) + sumSlots(selCfg.ar?.D)
    : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="p2-app" translate="no">

        <div className="p2-tabs">
          <button className={`p2-tab${tab === 'calc'   ? ' on' : ''}`} onClick={() => setTab('calc')}>⚖ CALCULATEUR</button>
          <button className={\p2-tab\\} onClick={() => { setTab('matrix'); setMatrixIdx(ci) }}>📋 MATRICE</button>
        </div>

        {/* ── TAB CALCULATEUR ─────────────────────────────────────────────── */}
        {tab === 'calc' && cfg && (
          <div className="p2-calc">
            <div className={`p2-vent${selectedParam === 'vent' ? ' active' : ''}`} onClick={() => selectParam('vent')}>
              <div className="p2-vent-val">{vent.toFixed(1)}</div>
              <div className="p2-vent-lbl">{ventLabel}</div>
              <button
                className={`p2-gps-btn${gpsStatus === 'capturing' ? ' capturing' : ''}`}
                onClick={(e) => { e.stopPropagation(); captureGPS() }}
              >{gpsStatus === 'ok' ? '✓' : gpsStatus === 'err' ? '✗' : '📍'}</button>
            </div>

            <div className="p2-baro">
              <div className="p2-row-wrap small">
                <div className="p2-row-lbl">⬆ AV — Small 42g laiton · 70g tungstène</div>
                <div className="p2-row">
                  <div className="p2-side p2-side-l">{renderSlots(cfg.av?.G || [], capAV)}</div>
                  <div className="p2-side">{renderSlots(cfg.av?.D || [], capAV)}</div>
                </div>
              </div>
              <div className="p2-row-wrap big">
                <div className="p2-row-lbl">⬇ AR — Big 126g laiton</div>
                <div className="p2-row">
                  <div className="p2-side p2-side-l">{renderSlots(cfg.ar?.G || [], capAR)}</div>
                  <div className="p2-side">{renderSlots(cfg.ar?.D || [], capAR)}</div>
                </div>
              </div>
            </div>

            <div className="p2-data">
              <div style={{ textAlign:'center' }}>
                <div className="p2-data-val">{(cfg.m / 1000).toFixed(3)} kg</div>
                <div className="p2-data-lbl">MASSE</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div className={`p2-cg${Math.abs(cgD) < 0.6 ? ' neutre' : cgD < 0 ? ' avant' : ' arriere'}`}>
                  <div className="p2-data-val">{cfg.cg.toFixed(1)} mm</div>
                  <div className="p2-data-lbl">{Math.abs(cgD) < 0.6 ? '✓ CG' : cgD < 0 ? cgD.toFixed(1)+'mm' : '+'+cgD.toFixed(1)+'mm'}</div>
                </div>
              </div>
            </div>

            {alt > 0 && selectedParam === 'alt' && (
              <div className="p2-alt">
                <div style={{ textAlign:'center', flex:1 }}><span className="p2-ab-lbl">ALTITUDE</span><span className="p2-ab-val">{alt} m</span></div>
                <div style={{ textAlign:'center', flex:1 }}><span className="p2-ab-lbl">DÉDUIT</span><span className="p2-ab-val">−{altCorrection} g</span></div>
                <div style={{ textAlign:'center', flex:1 }}><span className="p2-ab-lbl">FINALE</span><span className="p2-ab-val">{kgVal.toFixed(3)} kg</span></div>
              </div>
            )}

            <div className="p2-ctrl">
              <div className="p2-ctrl-grid">
                <div className="p2-ctrl-left">
                  <div className="p2-ctrl-top2">
                    <div className={`p2-mode-btn${selectedParam === 'kg' ? ' active' : ''}`} onClick={() => selectParam('kg')}>
                      <span className="p2-mode-val">{kgVal.toFixed(3)}</span>
                      <span className="p2-mode-lbl">KG</span>
                    </div>
                    <div className={`p2-mode-btn${selectedParam === 'alt' ? ' active-alt' : ''}`} onClick={() => selectParam('alt')}>
                      <span className="p2-mode-val">{alt}</span>
                      <span className="p2-mode-lbl">ALT m</span>
                    </div>
                  </div>
                  <div className={`p2-mode-btn${selectedParam === 'offset' ? ' active' : ''}`} onClick={() => selectParam('offset')}>
                    <span className="p2-mode-val">{(parseFloat(offset)||0) >= 0 ? '+' : ''}{offset}g</span>
                    <span className="p2-mode-lbl">{nbSmall === 0 ? 'OFFSET' : `${nbSmall > 0 ? '+' : ''}${nbSmall} small`}</span>
                  </div>
                </div>
                <div className="p2-ctrl-arrows">
                  <button className="p2-nav"
                    onMouseDown={() => handlePress(-1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                    onTouchStart={(e) => { e.preventDefault(); handlePress(-1) }} onTouchEnd={handleRelease}
                  >◀</button>
                  <button className="p2-nav"
                    onMouseDown={() => handlePress(1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                    onTouchStart={(e) => { e.preventDefault(); handlePress(1) }} onTouchEnd={handleRelease}
                  >▶</button>
                </div>
              </div>
              <div className="p2-hint">{hints[selectedParam] || 'Appui long = défilement rapide'}</div>
            </div>
          </div>
        )}

        {/* ── TAB MATRICE ─────────────────────────────────────────────────── */}
        {tab === 'matrix' && (
          <div className="p2-matrix">
            <div className="p2-m-hdr">
              <div>
                <div style={{ fontSize:13, fontWeight:800 }}>🎯 {model.nom} — Matrice</div>
                <div style={{ fontSize:9, color:'#8b949e', marginTop:1 }}>
                  {selCfg
                    ? `Config #${selCfg.n} · AV ${(selCfg.av?.G||[]).length+(selCfg.av?.D||[]).length} · AR ${(selCfg.ar?.G||[]).length+(selCfg.ar?.D||[]).length}`
                    : 'Sélectionner une configuration'}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:14, fontWeight:900, color:'#3fb950' }}>{selCfg ? selCfg.m+' g ref' : '—'}</div>
                <div style={{ fontSize:9, color:'#8b949e' }}>{selCfg ? `calc ${calcM}g (${calcM-selCfg.m>0?'+':''}${calcM-selCfg.m}g)` : '—'}</div>
              </div>
            </div>

            <div className="p2-sg">
              {matrix.map((c, i) => (
                <div key={i}
                  className={`p2-rb${matrixIdx===i?' sel':''}${i===ci?' act':''}${hasTungsten(c.av?.G, c.av?.D)?' t':''}`}
                  onClick={() => setMatrixIdx(i)}
                >{c.n}</div>
              ))}
            </div>

            {!selCfg && <div className="p2-m-ph">← Choisir une configuration</div>}

            {selCfg && (
              <>
                <div className="p2-m-soutes">
                  <div className="p2-m-sw av">
                    <div className="p2-m-lbl" style={{ color:'rgba(200,160,48,.9)' }}>⬆ AV — Small (42g L · 21g ½L · 70g T)</div>
                    <div className="p2-m-row">
                      <div className="p2-m-side av-l">{renderMatrixSide(selCfg.av?.G || [], capAV)}</div>
                      <div className="p2-sep" />
                      <div className="p2-m-side av-r">{renderMatrixSide(selCfg.av?.D || [], capAV)}</div>
                    </div>
                  </div>
                  <div className="p2-m-sw ar">
                    <div className="p2-m-lbl" style={{ color:'rgba(112,128,144,.9)' }}>⬇ AR — Big (126g L · 63g ½L)</div>
                    <div className="p2-m-row">
                      <div className="p2-m-side ar-l">{renderMatrixSide(selCfg.ar?.G || [], capAR)}</div>
                      <div className="p2-sep" />
                      <div className="p2-m-side ar-r">{renderMatrixSide(selCfg.ar?.D || [], capAR)}</div>
                    </div>
                  </div>
                </div>
                <div className="p2-m-info">
                  <div>
                    <div style={{ fontSize:15, fontWeight:900, color:Math.abs(calcM-selCfg.m)<=30?'#3fb950':'#f0a500' }}>{calcM} g</div>
                    <div style={{ fontSize:8, color:'#8b949e' }}>MASSE CALCULÉE</div>
                    <div style={{ fontSize:9, color:Math.abs(calcM-selCfg.m)<=30?'#3fb950':'#f0a500' }}>
                      {calcM===selCfg.m?'= ref':(calcM-selCfg.m>0?'+':'')+(calcM-selCfg.m)+'g vs ref'}
                    </div>
                  </div>
                  <div style={{ fontSize:9, color:'#8b949e', flex:2, lineHeight:1.4 }}>
                    AV <span style={{ color:'#fff', fontWeight:700 }}>{sumSlots(selCfg.av?.G)+sumSlots(selCfg.av?.D)}g</span> ({(selCfg.av?.G||[]).length+(selCfg.av?.D||[]).length} blocs)<br />
                    AR <span style={{ color:'#fff', fontWeight:700 }}>{sumSlots(selCfg.ar?.G)+sumSlots(selCfg.ar?.D)}g</span> ({(selCfg.ar?.G||[]).length+(selCfg.ar?.D||[]).length} blocs)
                  </div>
                </div>
              </>
            )}

            <div className="p2-m-leg">
              {[{bg:'#c8a030',lbl:'42g L'},{bg:'#8a6a10',lbl:'21g ½L'},{bg:'#2255aa',lbl:'70g T'},{bg:'#a07820',lbl:'126g L'},{bg:'#7a5810',lbl:'63g ½L'}].map(({bg,lbl}) => (
                <div key={lbl} className="p2-m-li"><div className="p2-m-ls" style={{ background:bg }} />{lbl}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
