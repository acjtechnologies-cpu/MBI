import { useState, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useModelStore } from '../../stores/modelStore'
import { calculerMeteo } from '../../utils/poly4'

// ── Poly4 Mamba ──────────────────────────────────────────────────────────────
const P4 = { A4:-1.728e-4, A3:8.178e-3, A2:-0.14980, A1:1.34713, A0:-1.19522, vMin:4.05, vMax:15.30 }

function poly4(v) {
  v = Math.max(P4.vMin, Math.min(P4.vMax, v))
  return P4.A4*v**4 + P4.A3*v**3 + P4.A2*v**2 + P4.A1*v + P4.A0
}

function getMasseAlt(m0, alt) {
  if (!alt || alt <= 0) return m0
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

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
.mb-app { display:flex; flex-direction:column; height:100dvh; max-width:420px;
  margin:0 auto; background:#05070a; color:#fff;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  user-select:none; overflow:hidden; }
.mb-tabs { display:flex; gap:4px; padding:6px 6px 0; height:42px; flex-shrink:0; }
.mb-tab { flex:1; padding:8px 0; border-radius:8px 8px 0 0; border:none; cursor:pointer;
  font-size:13px; font-weight:700; background:#1a1f2a; color:#8b949e; transition:all .2s; }
.mb-tab.on { background:#161b22; color:#fff; border-bottom:2px solid #3fb950; }
.mb-calc { display:flex; flex-direction:column; flex:1; padding:6px; min-height:0; }
.mb-vent { height:9vh; background:linear-gradient(135deg,#0e4429,#1a5a3a);
  border-radius:12px; text-align:center; border:2px solid #238636;
  display:flex; flex-direction:column; justify-content:center;
  cursor:pointer; transition:all .3s; box-shadow:0 4px 12px rgba(0,0,0,.4);
  margin-bottom:6px; flex-shrink:0; position:relative; }
.mb-vent.active { background:linear-gradient(135deg,#1a73e8,#1557b0);
  border-color:#fff; box-shadow:0 0 20px rgba(26,115,232,.7); }
.mb-vent-val { font-size:36px; font-weight:900; line-height:1; }
.mb-vent-lbl { font-size:11px; font-weight:700; opacity:.95; margin-top:2px; letter-spacing:1px; }
.mb-gps-btn { position:absolute; right:10px; top:50%; transform:translateY(-50%);
  width:38px; height:38px; border-radius:50%; background:#065f46; border:2px solid #34d399;
  color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center;
  justify-content:center; box-shadow:0 2px 8px rgba(52,211,153,.4); }
.mb-baro { flex-grow:1; display:flex; flex-direction:column;
  justify-content:space-evenly; padding:4px 0; min-height:0; }
.mb-row-wrap { display:flex; flex-direction:column; gap:2px; }
.mb-row-lbl { font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:.3px; padding-left:6px; }
.mb-row-wrap.av .mb-row-lbl { color:rgba(255,200,80,.9); }
.mb-row-wrap.c  .mb-row-lbl { color:rgba(100,170,255,.9); }
.mb-row-wrap.ar .mb-row-lbl { color:rgba(63,185,80,.9); }
.mb-row { display:flex; justify-content:center; gap:5px; height:13vh; max-height:90px; }
.mb-side { display:flex; gap:2px; width:48%;
  border:1.5px solid rgba(255,255,255,.1); border-radius:6px;
  padding:2px; background:rgba(255,255,255,.02); }
.mb-row-wrap.av .mb-side { border-color:rgba(255,215,0,.4); }
.mb-row-wrap.c  .mb-side { border-color:rgba(26,115,232,.45); }
.mb-row-wrap.ar .mb-side { border-color:rgba(63,185,80,.4); }
.mb-side-l { flex-direction:row-reverse; }
.mb-slot { flex:1; height:100%; border-radius:3px; transition:all .15s; }
.mb-s { background:#1a2535; opacity:.15; border:1px dashed rgba(255,255,255,.07); }
.mb-l { background:linear-gradient(135deg,#c8a030,#e8b840);
  box-shadow:inset 0 0 10px rgba(255,215,0,.5); border:1px solid rgba(255,255,255,.3); }
.mb-p { background:linear-gradient(135deg,#708090,#8a9aaa);
  box-shadow:inset 0 0 10px rgba(0,0,0,.7); border:1px solid rgba(255,255,255,.25); }
.mb-t { background:linear-gradient(135deg,#2255aa,#3377cc);
  box-shadow:inset 0 0 8px rgba(80,160,255,.3); border:1px solid rgba(100,180,255,.3); }
.mb-data { height:9vh; min-height:60px; flex-shrink:0;
  display:flex; justify-content:space-around; align-items:center; padding:0 12px;
  background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));
  border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.3); margin:4px 0; }
.mb-data-val { font-size:26px; font-weight:900; line-height:1; }
.mb-data-lbl { font-size:9px; color:#8b949e; margin-top:3px; font-weight:600; }
.mb-cg { padding:7px 12px; border-radius:8px;
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
.mb-ctrl-left { display:grid; grid-template-rows:1fr 1fr 1fr; gap:4px; }
.mb-ctrl-arrows { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.mb-mode-btn { background:#1c2128; border:2px solid #30363d; border-radius:10px;
  display:flex; flex-direction:column; justify-content:center; align-items:center;
  cursor:pointer; transition:all .2s; }
.mb-mode-btn.active { background:linear-gradient(135deg,#1a73e8,#1557b0); border-color:#fff; }
.mb-mode-btn.active-alt { background:linear-gradient(135deg,#6d28d9,#4c1d95); border-color:#a78bfa; }
.mb-mode-val { font-size:18px; font-weight:900; line-height:1; }
.mb-mode-lbl { font-size:8px; font-weight:700; opacity:.85; margin-top:3px; letter-spacing:.5px; }
.mb-nav { background:linear-gradient(135deg,#21262d,#161b22); border:2px solid #444c56;
  border-radius:12px; color:#fff; font-size:60px; font-weight:900;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 10px rgba(0,0,0,.4); touch-action:none; }
.mb-nav:active { background:#30363d; transform:scale(.97); }
.mb-hint { text-align:center; font-size:9px; color:#8b949e; padding:3px; opacity:.65; }
.mb-matrix { display:flex; flex-direction:column; flex:1; padding:5px 6px 4px; gap:4px; min-height:0; }
.mb-m-hdr { background:linear-gradient(135deg,#0d1a2e,#1a2a4a); border-radius:10px;
  padding:7px 12px; border:1px solid #1a73e8; flex-shrink:0;
  display:flex; justify-content:space-between; align-items:center; }
.mb-sg { display:grid; grid-template-columns:repeat(10,1fr); gap:2px; flex-shrink:0; }
.mb-rb { padding:5px 2px; background:#161b22; border-radius:5px; text-align:center;
  font-size:10px; font-weight:700; cursor:pointer; border:1px solid #21262d; color:#8b949e;
  display:flex; align-items:center; justify-content:center; }
.mb-rb.sel { background:#1a2744; border-color:#1a73e8; color:#fff; }
.mb-m-soutes { flex:1; display:flex; flex-direction:column; gap:4px; min-height:0; overflow-y:auto; }
.mb-m-row-wrap { display:flex; flex-direction:column; gap:2px; }
.mb-m-lbl { font-size:9px; font-weight:700; letter-spacing:.5px; padding-left:4px; }
.mb-m-row { display:flex; gap:5px; height:11vh; max-height:80px; }
.mb-m-side { flex:1; display:flex; gap:2px; border-radius:6px; padding:3px;
  background:rgba(255,255,255,.02); }
.mb-m-side-l { flex-direction:row-reverse; }
.mb-m-slot { flex:1; border-radius:4px; background:rgba(255,255,255,.04);
  border:1px solid #1e2530; }
.mb-m-slot.l { background:linear-gradient(135deg,#c8a030,#e8b840); border-color:transparent; }
.mb-m-slot.p { background:linear-gradient(135deg,#708090,#8a9aaa); border-color:transparent; }
.mb-m-slot.t { background:linear-gradient(135deg,#2255aa,#3377cc); border-color:transparent; }
.mb-m-info { background:#161b22; border-radius:8px; padding:6px 10px; flex-shrink:0;
  border:1px solid #21262d; }
.mb-overlay { position:fixed; inset:0; background:rgba(0,0,0,.85); z-index:200;
  display:flex; align-items:flex-end; justify-content:center; }
.mb-overlay-box { width:100%; max-width:420px; background:#0d1117;
  border-radius:16px 16px 0 0; border:1px solid #30363d; padding:16px;
  max-height:85vh; overflow-y:auto; }
`

export default function DashboardPilote() {
  const { params, incrementParam, decrementParam, offset, setOffset,
          altitude, setAltitude } = useAppStore()
  const { getActiveModel } = useModelStore()
  const model = getActiveModel()

  const [selectedParam, setSelectedParam] = useState('vent')
  const [tab, setTab]         = useState('calc')
  const [matrixIdx, setMatrixIdx] = useState(null)
  const [gpsOpen, setGpsOpen] = useState(false)
  const [gpsCapturing, setGpsCapturing] = useState(false)
  const [gpsData, setGpsData] = useState({ lat:null, lon:null, alt:null, accuracy:null })
  const repeatRef = useRef(null)

  if (!model) return (
    <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'#05070a',color:'#8b949e'}}>
      Chargement...
    </div>
  )

  const matrix = model.matrix || []
  const soutes = model.soutes ? Object.values(model.soutes).sort((a,b) => a.distanceBA - b.distanceBA) : []
  const souteKeys = Object.keys(model.soutes || {}).sort((a,b) =>
    (model.soutes[a].distanceBA || 0) - (model.soutes[b].distanceBA || 0))

  const vent = params.vent
  const alt  = altitude || 0

  // Masse cible
  const m0kg    = poly4(vent)
  const mAltkg  = getMasseAlt(m0kg, alt)
  const targetG = Math.max(model.masseVide, Math.round(mAltkg * 1000 + (model.offset||0) + offset))
  const kgVal   = targetG / 1000

  // Config matrice la plus proche
  const ci  = matrix.length > 0 ? findNearest(matrix, targetG) : 0
  const cfg = matrix[ci] || null
  const dm  = cfg ? cfg.m - targetG : 0
  const cgD = cfg ? cfg.cg - model.cgVide : 0

  // Correction altitude
  const c100 = Math.round((m0kg - getMasseAlt(m0kg, 100)) * 1000)

  // Label vent
  const ventLabel = alt > 0
    ? `VENT m/s — correction −${((1-getMasseAlt(1,alt))*100).toFixed(1)}%`
    : cfg ? `VENT m/s — cfg #${cfg.n} · ${kgVal.toFixed(3)} kg` : `VENT m/s — ${kgVal.toFixed(3)} kg`

  // CG class
  const cgClass = Math.abs(cgD) < 0.5 ? 'neutre' : cgD < 0 ? 'avant' : 'arriere'

  // GPS
  function captureGPS() {
    if (!navigator.geolocation) return
    setGpsCapturing(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, altitude: a, accuracy } = pos.coords
        setGpsData({ lat:latitude, lon:longitude, alt:a, accuracy:Math.round(accuracy) })
        setGpsCapturing(false)
      },
      () => setGpsCapturing(false),
      { enableHighAccuracy:true, timeout:15000, maximumAge:0 }
    )
  }

  function useAltitude() {
    if (gpsData.alt !== null) {
      setAltitude(Math.round(gpsData.alt / 50) * 50)
      setGpsOpen(false)
    }
  }

  // Repeat
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
      case 'vent': dir > 0 ? incrementParam('vent') : decrementParam('vent'); break
      case 'offset': {
        const newOff = offset + dir * 42
        if ((offset < 0 && newOff > 0) || (offset > 0 && newOff < 0)) setOffset(0)
        else setOffset(Math.max(-500, Math.min(500, newOff)))
        break
      }
      case 'alt': setAltitude(a => Math.max(0, Math.min(3000, (a||0) + dir * 50))); break
    }
  }

  // Rendu slots barographe calculateur
  function renderSlots(blocs, cap) {
    return Array.from({ length: cap }).map((_, i) => {
      const nom = blocs[i] ? blocs[i].toLowerCase() : ''
      let cls = 'mb-slot mb-s'
      if (blocs[i]) {
        if (nom.includes('plomb'))       cls = 'mb-slot mb-p'
        else if (nom.includes('laiton')) cls = 'mb-slot mb-l'
        else if (nom.includes('tungst')) cls = 'mb-slot mb-t'
        else                             cls = 'mb-slot mb-l'
      }
      return <div key={i} className={cls} />
    })
  }

  // Construire gauche/droite depuis cfg matrice
  function getSlotsFromCfg(cfgRow, souteKey, side) {
    if (!cfgRow || !cfgRow[souteKey]) return []
    const b = cfgRow[souteKey]
    const n = side === 'G' ? b.G : b.D
    const matNom = side === 'G' ? (b.matG || '') : (b.matD || '')
    return Array(n).fill(matNom)
  }

  // Rendu page matrice
  const selCfg = matrixIdx !== null ? matrix[matrixIdx] : null

  return (
    <>
      <style>{CSS}</style>
      <div className="mb-app" translate="no">

        {/* Tabs */}
        <div className="mb-tabs">
          <button className={`mb-tab${tab==='calc'?' on':''}`} onClick={() => setTab('calc')}>⚖ CALCULATEUR</button>
          {matrix.length > 0 && (
            <button className={`mb-tab${tab==='matrix'?' on':''}`} onClick={() => setTab('matrix')}>📋 MATRICE</button>
          )}
        </div>

        {/* ══ CALCULATEUR ══ */}
        {tab === 'calc' && (
          <div className="mb-calc">

            {/* Header vent */}
            <div className={`mb-vent${selectedParam==='vent'?' active':''}`} onClick={() => setSelectedParam('vent')}>
              <div className="mb-vent-val">{vent.toFixed(1)}</div>
              <div className="mb-vent-lbl">{ventLabel}</div>
              <button className="mb-gps-btn" onClick={(e) => { e.stopPropagation(); setGpsOpen(true); captureGPS() }}>📍</button>
            </div>

            {/* Barographe */}
            <div className="mb-baro">
              {soutes.map((soute, idx) => {
                const key = souteKeys[idx]
                const cap = soute.capacite || 3
                const gaucheBlocs = getSlotsFromCfg(cfg, key, 'G')
                const droiteBlocs = getSlotsFromCfg(cfg, key, 'D')
                const rowClass = idx === 0 ? 'av' : idx === 1 ? 'c' : 'ar'
                const matLabel = soute.materiaux?.map(m => `${m.nom} ${m.masse}g`).join(' · ') || ''

                return (
                  <div key={key} className={`mb-row-wrap ${rowClass}`}>
                    <div className="mb-row-lbl">{soute.nom} · {matLabel}</div>
                    <div className="mb-row">
                      <div className="mb-side mb-side-l">{renderSlots(gaucheBlocs, cap)}</div>
                      <div className="mb-side">{renderSlots(droiteBlocs, cap)}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bande altitude si > 0 */}
            {alt > 0 && (
              <div className="mb-alt">
                <div className="mb-ab-item">
                  <span className="mb-ab-lbl">ALTITUDE</span>
                  <span className="mb-ab-val">{alt} m</span>
                </div>
                <div className="mb-ab-item" style={{textAlign:'center'}}>
                  <span className="mb-ab-lbl">CORRECTION</span>
                  <span className="mb-ab-val">−{Math.round((m0kg - mAltkg)*1000)}g</span>
                </div>
                <div className="mb-ab-item" style={{textAlign:'right'}}>
                  <span className="mb-ab-lbl">~100m</span>
                  <span className="mb-ab-val">−{c100}g</span>
                </div>
              </div>
            )}

            {/* Data bar */}
            <div className="mb-data">
              <div style={{textAlign:'center'}}>
                <div className="mb-data-val" style={{color:'#8b949e'}}>{kgVal.toFixed(3)}</div>
                <div className="mb-data-lbl">Poly4 {m0kg.toFixed(3)}</div>
              </div>
              <div style={{textAlign:'center'}}>
                <div className="mb-data-val" style={{color:'#3fb950'}}>{cfg ? (cfg.m/1000).toFixed(3) : '—'}</div>
                <div className="mb-data-lbl">
                  {cfg ? `cfg #${cfg.n}` : '—'}
                  {dm !== 0 && <span style={{color: dm > 0 ? '#3fb950' : '#f85149'}}> ({dm>0?'+':''}{dm}g)</span>}
                </div>
              </div>
              <div className={`mb-cg ${cgClass}`} style={{textAlign:'center'}}>
                <div className="mb-data-val">{cfg ? cfg.cg.toFixed(1) : model.cgVide}</div>
                <div className="mb-data-lbl">CG mm {cgD !== 0 && `${cgD>0?'+':''}${cgD.toFixed(1)}`}</div>
              </div>
            </div>

            {/* Contrôles */}
            <div className="mb-ctrl">
              <div className="mb-ctrl-grid">
                <div className="mb-ctrl-left">
                  <button className={`mb-mode-btn${selectedParam==='vent'?' active':''}`}
                    onClick={() => setSelectedParam('vent')}>
                    <div className="mb-mode-val">{vent.toFixed(1)}</div>
                    <div className="mb-mode-lbl">VENT m/s</div>
                  </button>
                  <button className={`mb-mode-btn${selectedParam==='alt'?' active-alt':''}`}
                    onClick={() => setSelectedParam('alt')}>
                    <div className="mb-mode-val">{alt}</div>
                    <div className="mb-mode-lbl">ALT m</div>
                  </button>
                  <button className={`mb-mode-btn${selectedParam==='offset'?' active':''}`}
                    onClick={() => setSelectedParam('offset')}>
                    <div className="mb-mode-val">{offset >= 0 ? '+' : ''}{offset}g</div>
                    <div className="mb-mode-lbl">OFFSET</div>
                  </button>
                </div>
                <div className="mb-ctrl-arrows">
                  <button className="mb-nav"
                    onPointerDown={() => handlePress(-1)}
                    onPointerUp={handleRelease}
                    onPointerLeave={handleRelease}>◀</button>
                  <button className="mb-nav"
                    onPointerDown={() => handlePress(1)}
                    onPointerUp={handleRelease}
                    onPointerLeave={handleRelease}>▶</button>
                </div>
              </div>
              <div className="mb-hint">
                {selectedParam==='vent' && `Config #${cfg?.n||'—'} — ${cfg?.m||'—'}g (Δ${dm>0?'+':''}${dm}g)`}
                {selectedParam==='alt'  && `Pas 50m — correction ~−${c100}g/100m à ${vent.toFixed(1)} m/s`}
                {selectedParam==='offset' && `Pas 42g · total: ${offset>=0?'+':''}${offset}g`}
              </div>
            </div>

          </div>
        )}

        {/* ══ MATRICE ══ */}
        {tab === 'matrix' && matrix.length > 0 && (
          <div className="mb-matrix">
            <div className="mb-m-hdr">
              <div>
                <div style={{fontSize:13,fontWeight:800}}>{model.nom} — Matrice</div>
                <div style={{fontSize:9,color:'#8b949e',marginTop:1}}>
                  {matrix.length} configs · cible {targetG}g
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:14,fontWeight:900,color:'#3fb950'}}>
                  {selCfg ? selCfg.m+'g' : (cfg ? cfg.m+'g' : '—')}
                </div>
                <div style={{fontSize:9,color:'#8b949e'}}>
                  Δ{selCfg ? selCfg.m - targetG : dm}g
                </div>
              </div>
            </div>

            {/* Sélecteur configs */}
            <div className="mb-sg">
              {matrix.map((row, i) => (
                <div key={i}
                  className={`mb-rb${matrixIdx===i?' sel':''}${i===ci?' sel':''}`}
                  onClick={() => setMatrixIdx(matrixIdx===i ? null : i)}>
                  {row.n}
                </div>
              ))}
            </div>

            {/* Soutes matrice */}
            <div className="mb-m-soutes">
              {(selCfg || cfg) && soutes.map((soute, idx) => {
                const key = souteKeys[idx]
                const rowCfg = selCfg || cfg
                const b = rowCfg[key] || {}
                const cap = soute.capacite || 3
                const rowClass = idx === 0 ? 'av' : idx === 1 ? 'c' : 'ar'
                const matNomG = b.matG || ''
                const matNomD = b.matD || ''

                function matCls(nom) {
                  const n = nom.toLowerCase()
                  if (n.includes('plomb'))  return 'p'
                  if (n.includes('laiton')) return 'l'
                  if (n.includes('tungst')) return 't'
                  return ''
                }

                return (
                  <div key={key} className="mb-m-row-wrap">
                    <div className={`mb-m-lbl`} style={{
                      color: idx===0 ? 'rgba(255,200,80,.9)' : idx===1 ? 'rgba(100,170,255,.9)' : 'rgba(63,185,80,.9)'
                    }}>
                      {soute.nom} · G={b.G||0} D={b.D||0} · {matNomG}
                    </div>
                    <div className="mb-m-row">
                      <div className="mb-m-side mb-m-side-l" style={{
                        borderColor: idx===0 ? 'rgba(255,215,0,.4)' : idx===1 ? 'rgba(26,115,232,.45)' : 'rgba(63,185,80,.4)'
                      }}>
                        {Array.from({length:cap}).map((_,i) => (
                          <div key={i} className={`mb-m-slot${i < (b.G||0) ? ' '+matCls(matNomG) : ''}`} />
                        ))}
                      </div>
                      <div className="mb-m-side" style={{
                        borderColor: idx===0 ? 'rgba(255,215,0,.4)' : idx===1 ? 'rgba(26,115,232,.45)' : 'rgba(63,185,80,.4)'
                      }}>
                        {Array.from({length:cap}).map((_,i) => (
                          <div key={i} className={`mb-m-slot${i < (b.D||0) ? ' '+matCls(matNomD) : ''}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Info config sélectionnée */}
              <div className="mb-m-info">
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>
                    Config #{(selCfg||cfg)?.n} — {(selCfg||cfg)?.m}g
                  </div>
                  <div style={{fontSize:10,color:'#8b949e',marginTop:2}}>
                    CG: {(selCfg||cfg)?.cg} mm · Δ{((selCfg||cfg)?.cg - model.cgVide).toFixed(1)}mm
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:11,color: Math.abs((selCfg||cfg)?.m - targetG) <= 30 ? '#3fb950' : '#f0a500',fontWeight:700}}>
                    {Math.abs((selCfg||cfg)?.m - targetG) <= 30 ? '✓' : '~'} {(selCfg||cfg)?.m - targetG > 0 ? '+' : ''}{(selCfg||cfg)?.m - targetG}g vs cible
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ GPS OVERLAY ══ */}
        {gpsOpen && (
          <div className="mb-overlay" onClick={() => setGpsOpen(false)}>
            <div className="mb-overlay-box" onClick={e => e.stopPropagation()}>
              <div style={{fontSize:15,fontWeight:800,marginBottom:12}}>📍 Position GPS</div>
              {gpsCapturing && <div style={{color:'#8b949e',fontSize:13}}>Localisation en cours...</div>}
              {gpsData.lat && (
                <div style={{fontSize:12,color:'#8b949e',marginBottom:10}}>
                  <div>Lat: {gpsData.lat?.toFixed(5)}° · Lon: {gpsData.lon?.toFixed(5)}°</div>
                  <div>Alt GPS: {gpsData.alt !== null ? Math.round(gpsData.alt)+' m' : '—'} · Précision: {gpsData.accuracy} m</div>
                </div>
              )}
              {gpsData.alt !== null && (
                <button onClick={useAltitude} style={{
                  background:'#1a73e8',border:'none',color:'#fff',borderRadius:8,
                  padding:'10px 16px',cursor:'pointer',fontWeight:700,fontSize:13,width:'100%',marginBottom:8
                }}>
                  ⬆ Utiliser {Math.round(gpsData.alt)} m
                </button>
              )}
              <button onClick={() => setGpsOpen(false)} style={{
                background:'#1c2128',border:'1px solid #30363d',color:'#8b949e',
                borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,width:'100%'
              }}>Fermer</button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
