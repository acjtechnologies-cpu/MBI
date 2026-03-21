import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'

// â”€â”€ DonnÃ©es Pike 2 (identique HTML V3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MV = 2332
const CFG = { m_vide: MV, cg_vide: 97.0, OFFSET: 1, SB: { cap: 5 }, BB: { cap: 5 } }

const L42  = { w: 42,  cls: 'l42',  lbl: '42g',  typ: 'L' }
const L21  = { w: 21,  cls: 'l21',  lbl: '21g',  typ: 'Â½L' }
const T70  = { w: 70,  cls: 't70',  lbl: '70g',  typ: 'T' }
const L126 = { w: 126, cls: 'l126', lbl: '126g', typ: 'L' }
const L63  = { w: 63,  cls: 'l63',  lbl: '63g',  typ: 'Â½L' }

const MATRIX = [
  { n:1,  m:2500, cg:96.2, avL:[L42],                avR:[],                   arL:[L126],                       arR:[] },
  { n:2,  m:2584, cg:97.1, avL:[L21],                avR:[L42],                arL:[L126],                       arR:[L63] },
  { n:3,  m:2670, cg:96.6, avL:[L42],                avR:[L42],                arL:[L126],                       arR:[L126] },
  { n:4,  m:2714, cg:97.3, avL:[L21,L42],            avR:[L42],                arL:[L126],                       arR:[L63,L126] },
  { n:5,  m:2799, cg:96.9, avL:[L21,L42],            avR:[L21,L42],            arL:[L63,L126],                   arR:[L63,L126] },
  { n:6,  m:2884, cg:97.6, avL:[L42,L42],            avR:[L21,L42],            arL:[L63,L126],                   arR:[L126,L126] },
  { n:7,  m:2969, cg:97.1, avL:[L42,L42],            avR:[L42,L42],            arL:[L126,L126],                  arR:[L126,L126] },
  { n:8,  m:3054, cg:97.7, avL:[L42,L42,L21],        avR:[L42,L42],            arL:[L126,L126],                  arR:[L126,L126,L63] },
  { n:9,  m:3118, cg:97.2, avL:[L42,L42,L21],        avR:[L42,L42,L21],        arL:[L126,L126,L63],              arR:[L126,L126,L63] },
  { n:10, m:3350, cg:97.0, avL:[L42,L42,L42],        avR:[L42,L42,L42],        arL:[L126,L126,L126],             arR:[L126,L126,L126] },
  { n:11, m:3484, cg:97.5, avL:[L42,L42,L42,L21],    avR:[L42,L42,L42],        arL:[L126,L126,L126],             arR:[L126,L126,L126,L63] },
  { n:12, m:3569, cg:97.1, avL:[L42,L42,L42,L21],    avR:[L42,L42,L42,L21],    arL:[L126,L126,L126,L63],         arR:[L126,L126,L126,L63] },
  { n:13, m:3654, cg:97.3, avL:[T70,L42,L42,L21],    avR:[T70,L42,L42,L21],    arL:[L126,L126,L126,L63],         arR:[L126,L126,L126,L126] },
  { n:14, m:3794, cg:97.0, avL:[T70,T70,L42,L42],    avR:[T70,T70,L42,L42],    arL:[L126,L126,L126,L126],        arR:[L126,L126,L126,L126] },
  { n:15, m:3879, cg:97.4, avL:[T70,T70,L42,L42],    avR:[T70,T70,L42,L42,L21],arL:[L126,L126,L126,L126,L63],    arR:[L126,L126,L126,L126] },
  { n:16, m:3824, cg:97.1, avL:[T70,T70,L42,L42,L21],avR:[T70,T70,L42,L42,L21],arL:[L126,L126,L126,L126,L63],    arR:[L126,L126,L126,L126,L63] },
  { n:17, m:4242, cg:97.0, avL:[T70,T70,L42,L42,L42],avR:[T70,T70,L42,L42,L42],arL:[L126,L126,L126,L126,L126],   arR:[L126,L126,L126,L126,L126] },
]

const MAX_AV = Math.max(...MATRIX.map(c => Math.max(c.avL.length, c.avR.length)))
const MAX_AR = Math.max(...MATRIX.map(c => Math.max(c.arL.length, c.arR.length)))

const TABLES = {
  vent:  [4.05,4.23,4.41,4.61,4.82,5.04,5.28,5.53,5.80,6.10,6.42,6.78,7.17,7.61,8.10,8.65,9.28,9.99,10.78,11.65,12.60,13.70,15.30],
  masse: [2.300,2.385,2.470,2.555,2.640,2.725,2.810,2.895,2.980,3.065,3.150,3.235,3.320,3.405,3.490,3.575,3.660,3.745,3.830,3.915,4.000,4.085,4.170]
}

function getMasse0m(v) {
  const T = TABLES
  if (v <= T.vent[0]) return T.masse[0]
  if (v >= T.vent[T.vent.length-1]) return T.masse[T.masse.length-1]
  for (let i = 0; i < T.vent.length-1; i++) {
    if (v >= T.vent[i] && v <= T.vent[i+1]) {
      const t = (v - T.vent[i]) / (T.vent[i+1] - T.vent[i])
      return T.masse[i] + t * (T.masse[i+1] - T.masse[i])
    }
  }
}

function getMasseAlt(m0, alt) {
  if (alt <= 0) return m0
  return m0 * Math.pow(1 - (0.0065 * alt) / 288.15, 5.25588)
}

function findNearest(tg) {
  let best = 0, bd = Infinity
  for (let i = 0; i < MATRIX.length; i++) {
    const d = Math.abs(MATRIX[i].m - tg)
    if (d < bd) { bd = d; best = i }
  }
  return best
}

// â”€â”€ Styles CSS inline (identique HTML V3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CSS = `
.pike2-app { height:100vh; overflow:hidden; background:#05070a; color:#fff;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  user-select:none; display:flex; flex-direction:column; max-width:420px; margin:0 auto; }

.pike2-tabs { display:flex; gap:4px; padding:6px 6px 0; height:42px; flex-shrink:0; }
.pike2-tab { flex:1; padding:8px 0; border-radius:8px 8px 0 0; border:none; cursor:pointer;
  font-size:13px; font-weight:700; background:#1a1f2a; color:#8b949e; transition:all .2s; }
.pike2-tab.on { background:#161b22; color:#fff; border-bottom:2px solid #3fb950; }

.pike2-calc { display:flex; flex-direction:column; flex:1; padding:6px; min-height:0; }

.pike2-vent { height:9vh; background:linear-gradient(135deg,#0e4429,#1a5a3a);
  border-radius:12px; text-align:center; border:2px solid #238636;
  display:flex; flex-direction:column; justify-content:center;
  cursor:pointer; transition:all .3s; box-shadow:0 4px 12px rgba(0,0,0,.4);
  margin-bottom:6px; flex-shrink:0; position:relative; }
.pike2-vent.active { background:linear-gradient(135deg,#1a73e8,#1557b0);
  border-color:#fff; box-shadow:0 0 20px rgba(26,115,232,.7); }
.pike2-vent-val { font-size:36px; font-weight:900; line-height:1; }
.pike2-vent-lbl { font-size:11px; font-weight:700; opacity:.95; margin-top:2px; letter-spacing:1px; }

.pike2-baro { flex-grow:1; display:flex; flex-direction:column;
  justify-content:space-evenly; padding:4px 0; min-height:0; }
.pike2-row-wrap { display:flex; flex-direction:column; gap:2px; }
.pike2-row-lbl { font-size:10px; color:#8b949e; font-weight:700;
  text-transform:uppercase; letter-spacing:.3px; padding-left:6px; }
.pike2-row-wrap.small .pike2-row-lbl { color:rgba(255,200,80,.9); }
.pike2-row-wrap.big   .pike2-row-lbl { color:rgba(160,200,220,.9); }
.pike2-row { display:flex; justify-content:center; gap:5px; height:15vh; max-height:110px; }
.pike2-side { display:flex; gap:2px; width:48%;
  border:1px solid rgba(255,255,255,.08); border-radius:6px;
  padding:2px; background:rgba(255,255,255,.02); }
.pike2-row-wrap.small .pike2-side { border:1.5px solid rgba(200,160,48,.5); }
.pike2-row-wrap.big   .pike2-side { border:1.5px solid rgba(112,128,144,.4); }
.pike2-side-l { flex-direction:row-reverse; }
.pike2-slot { flex:1; height:100%; border-radius:3px; transition:all .15s; }
.pike2-s   { background:#1a2535; opacity:.2; border:1px dashed rgba(255,255,255,.06); }
.pike2-l   { background:linear-gradient(135deg,#c8a030,#e8b840);
             box-shadow:inset 0 0 8px rgba(255,215,0,.4); border:1px solid rgba(255,255,255,.2); }
.pike2-t   { background:linear-gradient(135deg,#2255aa,#3377cc);
             box-shadow:inset 0 0 8px rgba(80,160,255,.3); border:1px solid rgba(100,180,255,.3); }
.pike2-lb  { background:linear-gradient(135deg,#708090,#8a9aaa);
             box-shadow:inset 0 0 8px rgba(0,0,0,.4); border:1px solid rgba(255,255,255,.15); }

.pike2-data { height:9vh; min-height:65px; flex-shrink:0;
  display:flex; justify-content:space-around; align-items:center; padding:0 12px;
  background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));
  border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.3); margin:4px 0; }
.pike2-data-val { font-size:28px; font-weight:900; line-height:1; }
.pike2-data-lbl { font-size:10px; color:#8b949e; margin-top:3px; font-weight:600; }
.pike2-cg { padding:8px 14px; border-radius:8px;
  background:rgba(59,130,246,.2); border:1px solid rgba(59,130,246,.4); transition:all .3s; }
.pike2-cg.neutre  { background:rgba(74,222,128,.2);  border-color:rgba(74,222,128,.5); }
.pike2-cg.avant   { background:rgba(251,191,36,.2);  border-color:rgba(251,191,36,.5); }
.pike2-cg.arriere { background:rgba(248,113,113,.2); border-color:rgba(248,113,113,.5); }

.pike2-alt { display:none; align-items:center; justify-content:space-between; flex-shrink:0;
  background:rgba(167,139,250,.08); border:1px solid rgba(167,139,250,.25);
  border-radius:8px; padding:4px 12px; margin:2px 0; min-height:28px; }
.pike2-alt.show { display:flex; }
.pike2-ab-lbl { font-size:9px; color:#8b949e; font-weight:700; letter-spacing:.5px; display:block; }
.pike2-ab-val { font-size:14px; font-weight:900; color:#a78bfa; }

.pike2-ctrl { height:32vh; min-height:220px; flex-shrink:0;
  background:#0d1117; border-radius:12px; padding:10px; border:1px solid #30363d;
  display:flex; flex-direction:column; gap:8px; box-shadow:0 4px 12px rgba(0,0,0,.4); }
.pike2-ctrl-grid { display:grid; grid-template-columns:1fr 1.4fr; gap:10px; flex-grow:1; }
.pike2-ctrl-left { display:grid; grid-template-rows:1fr 1fr; gap:6px; }
.pike2-ctrl-top2 { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.pike2-ctrl-arrows { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.pike2-mode-btn { background:#1c2128; border:2px solid #30363d; border-radius:10px;
  display:flex; flex-direction:column; justify-content:center; align-items:center;
  cursor:pointer; transition:all .2s; }
.pike2-mode-btn.active     { background:linear-gradient(135deg,#1a73e8,#1557b0); border-color:#fff; }
.pike2-mode-btn.active-alt { background:linear-gradient(135deg,#6d28d9,#4c1d95); border-color:#a78bfa; }
.pike2-mode-val { font-size:20px; font-weight:900; line-height:1; }
.pike2-mode-lbl { font-size:9px; font-weight:700; opacity:.85; margin-top:4px; letter-spacing:.5px; }
.pike2-nav { background:linear-gradient(135deg,#21262d,#161b22); border:2px solid #444c56;
  border-radius:12px; color:#fff; font-size:60px; font-weight:900;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 10px rgba(0,0,0,.4); touch-action:none; }
.pike2-nav:active { background:#30363d; transform:scale(.97); }
.pike2-hint { text-align:center; font-size:9px; color:#8b949e; padding:3px; opacity:.65; }

/* â”€â”€ MATRICE â”€â”€ */
.pike2-matrix { display:flex; flex-direction:column; flex:1; padding:5px 6px 4px; gap:4px; min-height:0; }
.pike2-m-hdr { background:linear-gradient(135deg,#0d1a2e,#1a2a4a); border-radius:10px;
  padding:7px 12px; border:1px solid #1a73e8; flex-shrink:0;
  display:flex; justify-content:space-between; align-items:center; }
.pike2-sg { display:grid; grid-template-columns:repeat(9,1fr); gap:2px; flex-shrink:0; }
.pike2-rb { padding:5px 2px; background:#161b22; border-radius:6px; text-align:center;
  font-size:11px; font-weight:700; cursor:pointer; border:1px solid #21262d; color:#8b949e;
  display:flex; align-items:center; justify-content:center; }
.pike2-rb.sel { background:#1a2744; border-color:#1a73e8; color:#fff; }
.pike2-rb.t { border-color:rgba(68,136,204,.5); }
.pike2-m-soutes { flex:1; display:flex; flex-direction:column; gap:2px; min-height:0; }
.pike2-m-sw { display:flex; flex-direction:column; gap:2px; }
.pike2-m-sw.av { flex:0.65; }
.pike2-m-sw.ar { flex:1; }
.pike2-m-lbl { font-size:9px; font-weight:700; letter-spacing:.5px; padding-left:4px; flex-shrink:0; }
.pike2-m-row { flex:1; display:flex; gap:5px; min-height:0; }
.pike2-m-side { flex:1; display:flex; gap:2px; border-radius:6px; padding:3px;
  background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06); }
.pike2-m-side.av-l,.pike2-m-side.av-r { border-color:rgba(200,160,48,.3); }
.pike2-m-side.ar-l,.pike2-m-side.ar-r { border-color:rgba(112,128,144,.3); }
.pike2-m-side.av-l,.pike2-m-side.ar-l { flex-direction:row-reverse; }
.pike2-sep    { width:3px; background:#1a4225; border-radius:2px; flex-shrink:0; }
.pike2-sep-ar { width:3px; background:#1a2535; border-radius:2px; flex-shrink:0; }
.pike2-mc { flex:1; border-radius:4px; background:rgba(255,255,255,.03);
  border:1px solid #1e2530; display:flex; flex-direction:column;
  align-items:center; justify-content:center; min-height:0; }
.pike2-mc.l42  { background:linear-gradient(135deg,#c8a030,#e8b840); border-color:transparent; }
.pike2-mc.l21  { background:linear-gradient(135deg,#8a6a10,#a07820); border-color:transparent; }
.pike2-mc.l126 { background:linear-gradient(135deg,#708090,#8a9aaa); border-color:transparent; }
.pike2-mc.l63  { background:linear-gradient(135deg,#4a5a66,#5a6a78); border-color:transparent; }
.pike2-mc.t70  { background:linear-gradient(135deg,#2255aa,#3377cc); border-color:rgba(100,180,255,.4); }
.pike2-mc-w { font-size:7px; font-weight:800; line-height:1; color:rgba(0,0,0,.65); }
.pike2-mc-t { font-size:6px; line-height:1.2; color:rgba(0,0,0,.5); }
.pike2-mc.t70 .pike2-mc-w,.pike2-mc.t70 .pike2-mc-t { color:rgba(255,255,255,.9); }
.pike2-mc.l63 .pike2-mc-w,.pike2-mc.l63 .pike2-mc-t { color:rgba(255,255,255,.75); }
.pike2-m-info { background:#161b22; border-radius:8px; padding:5px 10px; flex-shrink:0;
  border:1px solid #21262d; display:flex; gap:8px; align-items:center; }
.pike2-m-leg { display:flex; gap:5px; justify-content:center; flex-wrap:wrap; flex-shrink:0; }
.pike2-m-li { display:flex; align-items:center; gap:2px; font-size:8px; color:#8b949e; }
.pike2-m-ls { width:8px; height:8px; border-radius:2px; }
`

// â”€â”€ Composant principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DashboardPike2() {
  const { params, incrementParam, decrementParam, offset, incrementOffset, decrementOffset, selectedParam, selectParam, altitude } = useAppStore()

  const [tab, setTab] = useState('calc')
  const [matrixIdx, setMatrixIdx] = useState(null)
  const repeatRef = useRef(null)

  const vent = params.vent
  const alt  = altitude || 0

  // Calcul masse cible
  const m0kg   = getMasse0m(vent)
  const mAltkg = getMasseAlt(m0kg, alt)
  const targetG = Math.max(CFG.m_vide, Math.round((mAltkg * 1000) + CFG.OFFSET + offset))
  const kgVal  = parseFloat((targetG / 1000).toFixed(3))

  // Config la plus proche
  const ci  = findNearest(targetG)
  const cfg = MATRIX[ci]

  // CG
  const cgD = cfg.cg - CFG.cg_vide

  // Label vent
  const ventLabel = alt > 0
    ? `VENT m/s â€” air âˆ’${((1 - getMasseAlt(1, alt)) * 100).toFixed(1)}%`
    : `VENT m/s â€” cfg #${cfg.n} Â· ${cfg.avL.length + cfg.avR.length}S+${cfg.arL.length + cfg.arR.length}B`

  // Hint
  const hints = {
    vent: alt > 0
      ? `Table 0m â†’ Baro ${alt}m â†’ +1g â†’ ${kgVal.toFixed(3)} kg`
      : `Config #${cfg.n} â€” ${cfg.m}g (Î”${cfg.m - targetG > 0 ? '+' : ''}${cfg.m - targetG}g)`,
    offset: `Pas 42g Â· total: ${offset >= 0 ? '+' : ''}${offset}g`,
  }

  function handlePress(dir) {
    doChange(dir)
    repeatRef.current = setInterval(() => doChange(dir), 90)
  }
  function handleRelease() { clearInterval(repeatRef.current) }

  function doChange(dir) {
    if (selectedParam === 'vent') {
      if (dir > 0) incrementParam('vent')
      else decrementParam('vent')
    } else if (selectedParam === 'offset') {
      if (dir > 0) incrementOffset()
      else decrementOffset()
    } else if (selectedParam === 'alt') {
      // altitude gÃ©rÃ© dans appStore si disponible
    }
  }

  // Rendu slots barographe
  function renderSlots(slots, cap, cssClass) {
    const items = []
    for (let i = 0; i < cap; i++) {
      const b = slots[i]
      let cls = 'pike2-s'
      if (b) {
        if (b.cls === 't70') cls = 'pike2-t'
        else if (b.cls === 'l126' || b.cls === 'l63') cls = 'pike2-lb'
        else cls = 'pike2-l'
      }
      items.push(<div key={i} className={`pike2-slot ${cls}`} />)
    }
    return items
  }

  // Rendu cellules matrice
  function renderMatrixSide(slots, maxN) {
    const full = [...slots]
    while (full.length < maxN) full.push(null)
    return full.map((slot, i) => (
      <div key={i} className={`pike2-mc${slot ? ' ' + slot.cls : ''}`}>
        {slot && <><div className="pike2-mc-w">{slot.lbl}</div><div className="pike2-mc-t">{slot.typ}</div></>}
      </div>
    ))
  }

  const selCfg = matrixIdx !== null ? MATRIX[matrixIdx] : null
  const calcM  = selCfg ? MV + [...selCfg.avL, ...selCfg.avR, ...selCfg.arL, ...selCfg.arR].reduce((s, c) => s + c.w, 0) : 0

  return (
    <>
      <style>{CSS}</style>
      <div className="pike2-app" translate="no">

        {/* Tabs */}
        <div className="pike2-tabs">
          <button className={`pike2-tab${tab === 'calc' ? ' on' : ''}`} onClick={() => setTab('calc')}>âš– CALCULATEUR</button>
          <button className={`pike2-tab${tab === 'matrix' ? ' on' : ''}`} onClick={() => setTab('matrix')}>ðŸ“‹ MATRICE</button>
        </div>

        {/* â”€â”€ PAGE CALC â”€â”€ */}
        {tab === 'calc' && (
          <div className="pike2-calc">

            {/* Header vent */}
            <div
              className={`pike2-vent${selectedParam === 'vent' ? ' active' : ''}`}
              onClick={() => selectParam('vent')}
            >
              <div className="pike2-vent-val">{vent.toFixed(1)}</div>
              <div className="pike2-vent-lbl">{ventLabel}</div>
            </div>

            {/* Barographe */}
            <div className="pike2-baro">
              <div className="pike2-row-wrap small">
                <div className="pike2-row-lbl">â¬† SMALL  42g laiton Â· 70g tungstÃ¨ne</div>
                <div className="pike2-row">
                  <div className="pike2-side pike2-side-l">{renderSlots(cfg.avL, Math.max(cfg.avL.length, cfg.avR.length, CFG.SB.cap), 'sb')}</div>
                  <div className="pike2-side">{renderSlots(cfg.avR, Math.max(cfg.avL.length, cfg.avR.length, CFG.SB.cap), 'sb')}</div>
                </div>
              </div>
              <div className="pike2-row-wrap big">
                <div className="pike2-row-lbl">â¬‡ BIG  126g laiton</div>
                <div className="pike2-row">
                  <div className="pike2-side pike2-side-l">{renderSlots(cfg.arL, Math.max(cfg.arL.length, cfg.arR.length, CFG.BB.cap), 'bb')}</div>
                  <div className="pike2-side">{renderSlots(cfg.arR, Math.max(cfg.arL.length, cfg.arR.length, CFG.BB.cap), 'bb')}</div>
                </div>
              </div>
            </div>

            {/* Data bar */}
            <div className="pike2-data">
              <div style={{ textAlign: 'center' }}>
                <div className="pike2-data-val">{kgVal.toFixed(3)} kg</div>
                <div className="pike2-data-lbl">MASSE</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className={`pike2-cg ${Math.abs(cgD) < 0.6 ? 'neutre' : cgD < 0 ? 'avant' : 'arriere'}`}>
                  <div className="pike2-data-val">{cfg.cg.toFixed(1)} mm</div>
                  <div className="pike2-data-lbl">
                    {Math.abs(cgD) < 0.6 ? 'âœ“ CG' : cgD < 0 ? cgD.toFixed(1) + 'mm' : '+' + cgD.toFixed(1) + 'mm'}
                  </div>
                </div>
              </div>
            </div>

            {/* Altitude band */}
            {alt > 0 && (
              <div className="pike2-alt show">
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <span className="pike2-ab-lbl">ALTITUDE</span>
                  <span className="pike2-ab-val">{alt} m</span>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <span className="pike2-ab-lbl">DÃ‰DUIT</span>
                  <span className="pike2-ab-val">âˆ’{Math.round((m0kg - mAltkg) * 1000)} g</span>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <span className="pike2-ab-lbl">FINALE</span>
                  <span className="pike2-ab-val">{kgVal.toFixed(3)} kg</span>
                </div>
              </div>
            )}

            {/* ContrÃ´les */}
            <div className="pike2-ctrl">
              <div className="pike2-ctrl-grid">
                <div className="pike2-ctrl-left">
                  <div className="pike2-ctrl-top2">
                    <div className={`pike2-mode-btn${selectedParam === 'kg' ? ' active' : ''}`} onClick={() => selectParam('kg')}>
                      <span className="pike2-mode-val">{kgVal.toFixed(3)}</span>
                      <span className="pike2-mode-lbl">KG</span>
                    </div>
                    <div className={`pike2-mode-btn${selectedParam === 'alt' ? ' active-alt' : ''}`} onClick={() => selectParam('alt')}>
                      <span className="pike2-mode-val">{alt}</span>
                      <span className="pike2-mode-lbl">ALT m</span>
                    </div>
                  </div>
                  <div className={`pike2-mode-btn${selectedParam === 'offset' ? ' active' : ''}`} onClick={() => selectParam('offset')}>
                    <span className="pike2-mode-val">{offset >= 0 ? '+' : ''}{offset}g</span>
                    <span className="pike2-mode-lbl">OFFSET</span>
                  </div>
                </div>
                <div className="pike2-ctrl-arrows">
                  <button className="pike2-nav"
                    onMouseDown={() => handlePress(-1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                    onTouchStart={(e) => { e.preventDefault(); handlePress(-1) }} onTouchEnd={handleRelease}>â—€</button>
                  <button className="pike2-nav"
                    onMouseDown={() => handlePress(1)} onMouseUp={handleRelease} onMouseLeave={handleRelease}
                    onTouchStart={(e) => { e.preventDefault(); handlePress(1) }} onTouchEnd={handleRelease}>â–¶</button>
                </div>
              </div>
              <div className="pike2-hint">{hints[selectedParam] || 'Appui long = dÃ©filement rapide'}</div>
            </div>
          </div>
        )}

        {/* â”€â”€ PAGE MATRICE â”€â”€ */}
        {tab === 'matrix' && (
          <div className="pike2-matrix">
            <div className="pike2-m-hdr">
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>ðŸŽ¯ Pike Precision 2 â€” Matrice</div>
                <div style={{ fontSize: 9, color: '#8b949e', marginTop: 1 }}>
                  {selCfg ? `Config #${selCfg.n} Â· ${selCfg.avL.length + selCfg.avR.length}S Â· ${selCfg.arL.length + selCfg.arR.length}B` : 'SÃ©lectionner une configuration'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#3fb950' }}>
                  {selCfg ? selCfg.m + ' g ref' : 'â€”'}
                </div>
                <div style={{ fontSize: 9, color: '#8b949e' }}>
                  {selCfg ? `calc ${calcM}g (${calcM - selCfg.m > 0 ? '+' : ''}${calcM - selCfg.m}g)` : 'â€”'}
                </div>
              </div>
            </div>

            {/* Grille configs */}
            <div className="pike2-sg">
              {MATRIX.map((c, i) => (
                <div
                  key={i}
                  className={`pike2-rb${matrixIdx === i ? ' sel' : ''}${[...c.avL, ...c.avR].some(s => s.cls === 't70') ? ' t' : ''}`}
                  onClick={() => setMatrixIdx(i)}
                >{c.n}</div>
              ))}
            </div>

            {!selCfg && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#8b949e', fontSize: 13 }}>
                â† Choisir une configuration
              </div>
            )}

            {selCfg && (
              <>
                <div className="pike2-m-soutes">
                  <div className="pike2-m-sw av">
                    <div className="pike2-m-lbl" style={{ color: 'rgba(200,160,48,.9)' }}>â¬† AV â€” Small (42g L Â· 21g Â½L Â· 70g T)</div>
                    <div className="pike2-m-row">
                      <div className="pike2-m-side av-l">{renderMatrixSide(selCfg.avL, MAX_AV)}</div>
                      <div className="pike2-sep" />
                      <div className="pike2-m-side av-r">{renderMatrixSide(selCfg.avR, MAX_AV)}</div>
                    </div>
                  </div>
                  <div className="pike2-m-sw ar">
                    <div className="pike2-m-lbl" style={{ color: 'rgba(112,128,144,.9)' }}>â¬‡ AR â€” Big (126g L Â· 63g Â½L)</div>
                    <div className="pike2-m-row">
                      <div className="pike2-m-side ar-l">{renderMatrixSide(selCfg.arL, MAX_AR)}</div>
                      <div className="pike2-sep pike2-sep-ar" />
                      <div className="pike2-m-side ar-r">{renderMatrixSide(selCfg.arR, MAX_AR)}</div>
                    </div>
                  </div>
                </div>

                <div className="pike2-m-info">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: Math.abs(calcM - selCfg.m) <= 30 ? '#3fb950' : '#f0a500' }}>{calcM} g</div>
                    <div style={{ fontSize: 8, color: '#8b949e' }}>MASSE CALCULÃ‰E</div>
                    <div style={{ fontSize: 9, color: Math.abs(calcM - selCfg.m) <= 30 ? '#3fb950' : '#f0a500' }}>
                      {calcM === selCfg.m ? '= ref' : (calcM - selCfg.m > 0 ? '+' : '') + (calcM - selCfg.m) + 'g vs ref'}
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: '#8b949e', flex: 2, lineHeight: 1.4 }}>
                    AV <span style={{ color: '#fff', fontWeight: 700 }}>{[...selCfg.avL, ...selCfg.avR].reduce((s, c) => s + c.w, 0)}g</span> ({selCfg.avL.length + selCfg.avR.length} blocs)<br />
                    AR <span style={{ color: '#fff', fontWeight: 700 }}>{[...selCfg.arL, ...selCfg.arR].reduce((s, c) => s + c.w, 0)}g</span> ({selCfg.arL.length + selCfg.arR.length} blocs)
                  </div>
                </div>
              </>
            )}

            <div className="pike2-m-leg">
              {[
                { bg: '#c8a030', lbl: '42g L' },
                { bg: '#8a6a10', lbl: '21g Â½L' },
                { bg: '#2255aa', lbl: '70g T' },
                { bg: '#708090', lbl: '126g L' },
                { bg: '#4a5a66', lbl: '63g Â½L' },
              ].map(({ bg, lbl }) => (
                <div key={lbl} className="pike2-m-li">
                  <div className="pike2-m-ls" style={{ background: bg }} />
                  {lbl}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}


