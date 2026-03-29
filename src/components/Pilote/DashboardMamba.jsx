import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'

// ── Config Mamba S (identique V10) ──────────────────
const CFG = {
  m_vide:  2550,
  cg_vide: 102,
  OFFSET:  -144,
  AV: { cap:3, pos:80,  w:71 },
  C:  { cap:3, pos:102, w:88 },
  AR: { cap:4, pos:129, w:71 },
}

const TABLES = {
  vent:  [4.05,4.23,4.41,4.61,4.82,5.04,5.28,5.53,5.80,6.10,6.42,6.78,7.17,7.61,8.10,8.65,9.28,9.99,10.78,11.65,12.60,13.70,15.30],
  masse: [2.300,2.385,2.470,2.555,2.640,2.725,2.810,2.895,2.980,3.065,3.150,3.235,3.320,3.405,3.490,3.575,3.660,3.745,3.830,3.915,4.000,4.085,4.170]
}

function getMasse0m(vent) {
  const T = TABLES
  if (vent <= T.vent[0]) return T.masse[0]
  if (vent >= T.vent[T.vent.length-1]) return T.masse[T.masse.length-1]
  for (let i = 0; i < T.vent.length-1; i++) {
    if (vent >= T.vent[i] && vent <= T.vent[i+1]) {
      const t = (vent - T.vent[i]) / (T.vent[i+1] - T.vent[i])
      return T.masse[i] + t * (T.masse[i+1] - T.masse[i])
    }
  }
}

function getMasseAlt(m0, alt) {
  if (alt <= 0) return m0
  return m0 * Math.pow(1 - (0.0065 * alt) / 288.15, 5.25588)
}

function solve(targetG) {
  let r = targetG - CFG.m_vide
  const s = { AVL:[], AVR:[], CL:[], CR:[], ARL:[], ARR:[] }
  for (let i = 0; i < CFG.C.cap; i++) {
    if (r >= CFG.C.w) { s.CL.push('p'); r -= CFG.C.w }
    if (r >= CFG.C.w) { s.CR.push('p'); r -= CFG.C.w }
  }
  for (let i = 0; i < Math.min(CFG.AV.cap, CFG.AR.cap); i++) {
    const pp = CFG.AV.w + CFG.AR.w
    if (r >= pp) { s.AVL.push('l'); s.ARL.push('l'); r -= pp }
    if (r >= pp) { s.AVR.push('l'); s.ARR.push('l'); r -= pp }
  }
  return s
}

// ── Styles CSS (identique V10) ──────────────────────
const CSS = `
.mb-app { display:flex; flex-direction:column; height:100vh; max-width:420px;
  margin:0 auto; padding:6px; background:#05070a; color:#fff;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  user-select:none; overflow:hidden; }

.mb-vent { height:9vh; background:linear-gradient(135deg,#0e4429,#1a5a3a);
  border-radius:12px; text-align:center; border:2px solid #238636;
  display:flex; flex-direction:column; justify-content:center;
  cursor:pointer; transition:all .3s; box-shadow:0 4px 12px rgba(0,0,0,.4);
  margin-bottom:6px; flex-shrink:0; }
.mb-vent.active { background:linear-gradient(135deg,#1a73e8,#1557b0);
  border-color:#fff; box-shadow:0 0 20px rgba(26,115,232,.7); transform:scale(1.01); }
.mb-vent-val { font-size:36px; font-weight:900; line-height:1; }
.mb-vent-lbl { font-size:11px; font-weight:700; opacity:.95; margin-top:2px; letter-spacing:1px; }

.mb-baro { flex-grow:1; display:flex; flex-direction:column;
  justify-content:space-evenly; padding:4px 0; min-height:0; }
.mb-row-wrap { display:flex; flex-direction:column; gap:2px; }
.mb-row-lbl { font-size:10px; color:#8b949e; font-weight:700;
  text-transform:uppercase; letter-spacing:.3px; padding-left:6px; }
.mb-row { display:flex; justify-content:center; gap:5px; height:13vh; max-height:95px; }
.mb-side { display:flex; gap:2px; width:48%;
  border:1px solid rgba(255,255,255,.08); border-radius:6px;
  padding:2px; background:rgba(255,255,255,.02);
  box-shadow:inset 0 1px 3px rgba(0,0,0,.3); }
.mb-side-l { flex-direction:row-reverse; }
.mb-slot { flex:1; height:100%; border-radius:3px; transition:all .15s; }
.mb-s { background:#1a4225; opacity:.12; border:1px dashed rgba(255,255,255,.08); }
.mb-p { background:linear-gradient(135deg,#708090,#556677);
  box-shadow:inset 0 0 10px rgba(0,0,0,.7); border:1px solid rgba(255,255,255,.25); }
.mb-l { background:linear-gradient(135deg,#ffd700,#ffeb3b);
  box-shadow:inset 0 0 10px rgba(255,215,0,.5); border:1px solid rgba(255,255,255,.3); }

.mb-row-wrap.av .mb-side { border:1.5px solid rgba(255,180,0,.45); }
.mb-row-wrap.av .mb-row-lbl { color:rgba(255,180,0,.9); }
.mb-row-wrap.c  .mb-side { border:1.5px solid rgba(26,115,232,.5); }
.mb-row-wrap.c  .mb-row-lbl { color:rgba(100,170,255,.9); }
.mb-row-wrap.ar .mb-side { border:1.5px solid rgba(63,185,80,.45); }
.mb-row-wrap.ar .mb-row-lbl { color:rgba(63,185,80,.9); }

.mb-data { height:9vh; min-height:65px; flex-shrink:0;
  display:flex; justify-content:space-around; align-items:center; padding:0 12px;
  background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));
  border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.3); margin:4px 0; }
.mb-data-val { font-size:28px; font-weight:900; line-height:1; }
.mb-data-lbl { font-size:10px; color:#8b949e; margin-top:3px; font-weight:600; }
.mb-cg { padding:8px 14px; border-radius:8px;
  background:rgba(59,130,246,.2); border:1px solid rgba(59,130,246,.4); transition:all .3s; }
.mb-cg.neutre  { background:rgba(74,222,128,.2);  border-color:rgba(74,222,128,.5); }
.mb-cg.avant   { background:rgba(251,191,36,.2);  border-color:rgba(251,191,36,.5); }
.mb-cg.arriere { background:rgba(248,113,113,.2); border-color:rgba(248,113,113,.5); }

.mb-alt { display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
  background:rgba(167,139,250,.08); border:1px solid rgba(167,139,250,.25);
  border-radius:8px; padding:4px 12px; margin:2px 0; min-height:28px; }
.mb-ab-lbl { font-size:9px; color:#8b949e; font-weight:700; letter-spacing:.5px; display:block; }
.mb-ab-val { font-size:14px; font-weight:900; color:#a78bfa; }

.mb-ctrl { height:32vh; min-height:220px; flex-shrink:0;
  background:#0d1117; border-radius:12px; padding:10px; border:1px solid #30363d;
  display:flex; flex-direction:column; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,.4); }
.mb-ctrl-grid { display:grid; grid-template-columns:1fr 1.4fr; gap:10px; flex-grow:1; }
.mb-ctrl-left { display:grid; grid-template-rows:1fr 1fr; gap:6px; }
.mb-ctrl-top2 { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.mb-ctrl-arrows { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.mb-mode-btn { background:#1c2128; border:2px solid #30363d; border-radius:10px;
  display:flex; flex-direction:column; justify-content:center; align-items:center;
  cursor:pointer; transition:all .2s; }
.mb-mode-btn.active { background:linear-gradient(135deg,#1a73e8,#1557b0);
  border-color:#fff; box-shadow:0 0 12px rgba(26,115,232,.6); }
.mb-mode-btn.active-alt { background:linear-gradient(135deg,#6d28d9,#4c1d95);
  border-color:#a78bfa; }
.mb-mode-val { font-size:20px; font-weight:900; line-height:1; }
.mb-mode-lbl { font-size:9px; font-weight:700; opacity:.85; margin-top:4px; letter-spacing:.5px; }
.mb-nav { background:linear-gradient(135deg,#21262d,#161b22); border:2px solid #444c56;
  border-radius:12px; color:#fff; font-size:60px; font-weight:900;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 10px rgba(0,0,0,.4); touch-action:none; }
.mb-nav:active { background:#30363d; transform:scale(.97); }
.mb-hint { text-align:center; font-size:9px; color:#8b949e; padding:3px; opacity:.65; }
`

export default function DashboardMamba() {
  const { params, incrementParam, decrementParam,
          offset, incrementOffset, decrementOffset,
          selectedParam, selectParam, altitude } = useAppStore()

  const repeatRef = useRef(null)
  const vent = params.vent
  const alt  = altitude || 0

  // Calcul masse cible
  const m0kg   = getMasse0m(vent)
  const mAltkg = getMasseAlt(m0kg, alt)
  const targetG = Math.max(CFG.m_vide, Math.round((mAltkg * 1000) + CFG.OFFSET + offset))
  const kgVal   = parseFloat((targetG / 1000).toFixed(3))

  // Solver
  const sol = solve(targetG)

  // CG
  let ballast = 0, mom = CFG.m_vide * CFG.cg_vide
  ;['AV','C','AR'].forEach(sec => {
    ;['L','R'].forEach(side => {
      const key = sec + (side === 'L' ? 'L' : 'R')
      const slots = sol[key] || []
      const m = slots.length * CFG[sec].w
      ballast += m
      mom += m * CFG[sec].pos
    })
  })
  const mFinal  = CFG.m_vide + ballast
  const cgFinal = mom / mFinal
  const cgDelta = cgFinal - CFG.cg_vide

  // CG classe
  const cgClass = Math.abs(cgDelta) < 0.5 ? 'neutre' : cgDelta < 0 ? 'avant' : 'arriere'
  const cgLbl   = Math.abs(cgDelta) < 0.5 ? 'OK CG' : (cgDelta > 0 ? '+' : '') + cgDelta.toFixed(1) + 'mm'

  // Vent label
  const ventLabel = alt > 0
    ? `VENT m/s - air -${((1 - getMasseAlt(1, alt)) * 100).toFixed(1)}%`
    : 'VENT m/s — Mamba S'

  // Offset label
  const nbPlombs = Math.round(offset / 71)
  const offsetLbl = nbPlombs === 0 ? 'OFFSET' : `${nbPlombs > 0 ? '+' : ''}${nbPlombs} plomb`

  // Hint
  const c100 = Math.round((m0kg - getMasseAlt(m0kg, 100)) * 1000)
  const hints = {
    vent:   alt > 0 ? `Table 0m -> Baro ${alt}m -> Offset -144g -> ${kgVal.toFixed(3)} kg` : 'Appui long = defilement rapide',
    kg:     'Masse manuelle - vent/alt gardes en reference',
    alt:    `Pas 50m - correction ~-${c100}g / 100m a ${vent.toFixed(1)} m/s`,
    offset: `Decalage +/-71g par plomb - total: ${offset >= 0 ? '+' : ''}${offset}g`,
  }

  function handlePress(dir) {
    doChange(dir)
    repeatRef.current = setInterval(() => doChange(dir), 90)
  }
  function handleRelease() { clearInterval(repeatRef.current) }

  function doChange(dir) {
    if (selectedParam === 'vent') {
      if (dir > 0) incrementParam('vent'); else decrementParam('vent')
    } else if (selectedParam === 'offset') {
      if (dir > 0) incrementOffset(); else decrementOffset()
    }
  }

  function renderSlots(slots, cap, filled, empty) {
    return Array.from({ length: cap }).map((_, i) => (
      <div key={i} className={`mb-slot ${slots[i] ? filled : empty}`} />
    ))
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="mb-app" translate="no">

        {/* Vent header */}
        <div
          className={`mb-vent${selectedParam === 'vent' ? ' active' : ''}`}
          onClick={() => selectParam('vent')}
        >
          <div className="mb-vent-val">{vent.toFixed(1)}</div>
          <div className="mb-vent-lbl">{ventLabel}</div>
        </div>

        {/* Barographe */}
        <div className="mb-baro">
          <div className="mb-row-wrap av">
            <div className="mb-row-lbl">AV 71g laiton</div>
            <div className="mb-row">
              <div className="mb-side mb-side-l">{renderSlots(sol.AVL, CFG.AV.cap, 'mb-l', 'mb-s')}</div>
              <div className="mb-side">{renderSlots(sol.AVR, CFG.AV.cap, 'mb-l', 'mb-s')}</div>
            </div>
          </div>
          <div className="mb-row-wrap c">
            <div className="mb-row-lbl">C 88g plomb</div>
            <div className="mb-row">
              <div className="mb-side mb-side-l">{renderSlots(sol.CL, CFG.C.cap, 'mb-p', 'mb-s')}</div>
              <div className="mb-side">{renderSlots(sol.CR, CFG.C.cap, 'mb-p', 'mb-s')}</div>
            </div>
          </div>
          <div className="mb-row-wrap ar">
            <div className="mb-row-lbl">AR 71g laiton</div>
            <div className="mb-row">
              <div className="mb-side mb-side-l">{renderSlots(sol.ARL, CFG.AR.cap, 'mb-l', 'mb-s')}</div>
              <div className="mb-side">{renderSlots(sol.ARR, CFG.AR.cap, 'mb-l', 'mb-s')}</div>
            </div>
          </div>
        </div>

        {/* Data bar */}
        <div className="mb-data">
          <div style={{ textAlign:'center' }}>
            <div className="mb-data-val">{(mFinal/1000).toFixed(3)} kg</div>
            <div className="mb-data-lbl">MASSE</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div className={`mb-cg ${cgClass}`}>
              <div className="mb-data-val">{cgFinal.toFixed(1)} mm</div>
              <div className="mb-data-lbl">{cgLbl}</div>
            </div>
          </div>
        </div>

        {/* Altitude band */}
        {alt > 0 && (
          <div className="mb-alt">
            <div style={{ textAlign:'center', flex:1 }}>
              <span className="mb-ab-lbl">ALTITUDE</span>
              <span className="mb-ab-val">{alt} m</span>
            </div>
            <div style={{ textAlign:'center', flex:1 }}>
              <span className="mb-ab-lbl">DEDUIT</span>
              <span className="mb-ab-val">-{Math.round((m0kg - mAltkg) * 1000) + Math.abs(CFG.OFFSET)} g</span>
            </div>
            <div style={{ textAlign:'center', flex:1 }}>
              <span className="mb-ab-lbl">FINALE</span>
              <span className="mb-ab-val">{kgVal.toFixed(3)} kg</span>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="mb-ctrl">
          <div className="mb-ctrl-grid">
            <div className="mb-ctrl-left">
              <div className="mb-ctrl-top2">
                <div className={`mb-mode-btn${selectedParam === 'kg' ? ' active' : ''}`} onClick={() => selectParam('kg')}>
                  <span className="mb-mode-val">{kgVal.toFixed(3)}</span>
                  <span className="mb-mode-lbl">KG</span>
                </div>
                <div className={`mb-mode-btn${selectedParam === 'alt' ? ' active-alt' : ''}`} onClick={() => selectParam('alt')}>
                  <span className="mb-mode-val">{alt}</span>
                  <span className="mb-mode-lbl">ALT m</span>
                </div>
              </div>
              <div className={`mb-mode-btn${selectedParam === 'offset' ? ' active' : ''}`} onClick={() => selectParam('offset')}>
                <span className="mb-mode-val">{offset >= 0 ? '+' : ''}{offset}g</span>
                <span className="mb-mode-lbl">{offsetLbl}</span>
              </div>
            </div>
            <div className="mb-ctrl-arrows">
              <button className="mb-nav"
                onMouseDown={() => handlePress(-1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                onTouchStart={(e) => { e.preventDefault(); handlePress(-1) }} onTouchEnd={handleRelease}
              >{'<'}</button>
              <button className="mb-nav"
                onMouseDown={() => handlePress(1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                onTouchStart={(e) => { e.preventDefault(); handlePress(1) }} onTouchEnd={handleRelease}
              >{'>'}</button>
            </div>
          </div>
          <div className="mb-hint">{hints[selectedParam] || 'Appui long = defilement rapide'}</div>
        </div>
      </div>
    </>
  )
}
