import { useRef, useEffect } from 'react'
import { useESPStore, flushBulleVibration } from '../../espStore'
import { useAppStore } from '../../appStore'

// NoSleep -- empeche la mise en veille via interaction tactile
// Fonctionne en HTTP sur Android Chrome
let _noSleep = null

function stationWakeLockOn() {
  // Tente Wake Lock API d abord (HTTPS)
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').catch(() => {})
  }
  // Charge NoSleep.js depuis CDN si pas deja charge
  if (!window.NoSleep) {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/nosleep/0.12.0/NoSleep.min.js'
    s.onload = () => {
      _noSleep = new window.NoSleep()
      // NoSleep necessite un geste utilisateur -- on active au prochain touch
      const activate = () => {
        _noSleep.enable()
        document.removeEventListener('touchstart', activate)
        document.removeEventListener('click', activate)
      }
      document.addEventListener('touchstart', activate, { once: true })
      document.addEventListener('click', activate, { once: true })
    }
    document.head.appendChild(s)
  } else if (_noSleep) {
    _noSleep.enable()
  }
}

function stationWakeLockOff() {
  if (_noSleep) { try { _noSleep.disable() } catch(e) {} }
}

const SPARK_H = 56

function iqaStyle(iqa, bulle) {
  if (bulle) return { color:'#22d3ee', border:'#22d3ee', qual:'BULLE ASCENDANTE - LANCEZ !', bg:'linear-gradient(135deg,#0a2030,#0d3545)' }
  if (iqa >= 7.5) return { color:'#3fb950', border:'#238636', qual:'CONDITIONS EXCELLENTES', bg:'linear-gradient(135deg,#0d1f0d,#152e1e)' }
  if (iqa >= 5.0) return { color:'#1a73e8', border:'#1a73e8', qual:'CONDITIONS CORRECTES',   bg:'linear-gradient(135deg,#0d1520,#0d2035)' }
  if (iqa >= 3.0) return { color:'#f0a500', border:'#f0a500', qual:'CONDITIONS MEDIOCRES',   bg:'linear-gradient(135deg,#2a1a00,#3a2600)' }
  return            { color:'#f85149', border:'#f85149', qual:'CONDITIONS MAUVAISES',  bg:'linear-gradient(135deg,#1f0808,#2e1010)' }
}
function scoreColor(v) {
  if (v >= 0.75) return '#3fb950'
  if (v >= 0.50) return '#f0a500'
  return '#f85149'
}
function heliColor(o) {
  if (o > 20) return '#f85149'
  if (o > 10) return '#f0a500'
  return '#3fb950'
}
function gradColor(sg) {
  if (sg >= 0.65) return '#22d3ee'
  if (sg >= 0.50) return '#8b949e'
  return '#f85149'
}

function Oscillogramme({ buf, sigma }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    const W = c.width, H = c.height, mid = H / 2
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#060c12'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.5; ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()
    const sigPx = sigma > 0 ? Math.min(sigma * 600, mid * 0.75) : mid * 0.35
    ctx.strokeStyle = 'rgba(248,81,73,0.3)'; ctx.lineWidth = 0.5; ctx.setLineDash([3,3])
    ctx.beginPath(); ctx.moveTo(0, mid-sigPx); ctx.lineTo(W, mid-sigPx); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, mid+sigPx); ctx.lineTo(W, mid+sigPx); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(248,81,73,0.5)'; ctx.font = '7px monospace'
    ctx.fillText('+s', 3, mid-sigPx-2); ctx.fillText('-s', 3, mid+sigPx+8)
    if (buf.length < 2) return
    const n = buf.length
    const maxAbs = Math.max(...buf.map(Math.abs), 0.001)
    const scale = (mid * 0.82) / maxAbs
    const bufMid = buf[Math.floor(n/2)] || 0
    ctx.strokeStyle = 'rgba(239,159,39,0.45)'; ctx.lineWidth = 1; ctx.beginPath()
    buf.forEach((v,i) => { const x=(i/(n-1))*W, y=mid-(v-bufMid)*scale*3; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y) })
    ctx.stroke()
    ctx.strokeStyle = '#1a73e8'; ctx.lineWidth = 1.3; ctx.beginPath()
    buf.forEach((v,i) => { const x=(i/(n-1))*W, noise=Math.sin(i*2.1+v*50)*sigPx*0.55, y=mid-(v-bufMid)*scale*5+noise; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y) })
    ctx.stroke()
    ctx.font = '7px monospace'
    ctx.fillStyle = 'rgba(239,159,39,0.6)'; ctx.fillText('TURB s', W-44, H-10)
    ctx.fillStyle = 'rgba(26,115,232,0.75)'; ctx.fillText('dp_dyn', W-44, H-2)
  }, [buf, sigma])
  return <canvas ref={ref} width={340} height={SPARK_H} style={{ width:'100%', height:SPARK_H, display:'block', borderRadius:6 }}/>
}

function CompassSvg({ angle }) {
  return (
    <svg viewBox="0 0 90 90" width="84" height="84">
      <circle cx="45" cy="45" r="40" fill="none" stroke="#1e2530" strokeWidth="1.5"/>
      <text x="45" y="11" textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="700">N</text>
      <text x="45" y="84" textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="700">S</text>
      <text x="82" y="48" textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="700">E</text>
      <text x="8"  y="48" textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="700">O</text>
      <g transform={`rotate(${angle},45,45)`}>
        <polygon points="45,12 42,45 45,50 48,45" fill="#3fb950"/>
        <polygon points="45,78 42,45 45,50 48,45" fill="#444"/>
      </g>
      <circle cx="45" cy="45" r="3.5" fill="#fff"/>
    </svg>
  )
}

function ServoSvg({ angle }) {
  const rad = (angle * Math.PI) / 180
  const x2 = 45 + 35 * Math.sin(rad), y2 = 45 - 35 * Math.cos(rad)
  return (
    <svg viewBox="0 0 90 90" width="84" height="84">
      <circle cx="45" cy="45" r="40" fill="none" stroke="#1e2530" strokeWidth="1.5"/>
      <path d="M 5 45 A 40 40 0 0 1 85 45" fill="none" stroke="#1e2530" strokeWidth="6" strokeLinecap="round"/>
      <line x1="45" y1="45" x2={x2} y2={y2} stroke="#1a73e8" strokeWidth="3" strokeLinecap="round"/>
      <circle cx={x2} cy={y2} r="3" fill="#1a73e8"/>
      <circle cx="45" cy="45" r="5" fill="#30363d" stroke="#444" strokeWidth="1"/>
    </svg>
  )
}

export default function StationPage() {
  const setAltitude = useAppStore(s => s.setAltitude)
  const { wsStatus, connected, data: d, turbBuf, turbSigma, demo, pid,
          wsConnect, wsStop, startDemo, stopDemo, sendPid, setPid } = useESPStore()

  // Wake Lock -- actif des l ouverture de l onglet Station
  useEffect(() => {
    stationWakeLockOn()
    const onVisible = () => { if (document.visibilityState === 'visible') stationWakeLockOn() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stationWakeLockOff()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Flush vibration en attente a chaque interaction
  useEffect(() => {
    const handler = () => flushBulleVibration()
    window.addEventListener('touchstart', handler, { passive: true })
    window.addEventListener('click', handler)
    return () => {
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('click', handler)
    }
  }, [])

  const dotColor = { off:'#444', connecting:'#f0a500', live:'#3fb950', err:'#f85149' }[wsStatus] || '#444'
  const hasData  = connected || demo
  const bulle    = d.BULLE === 1
  const iq       = iqaStyle(d.IQA, bulle)

  const panel = (extra = {}) => ({
    background:'#0d1117', border:'1px solid #1e2530', borderRadius:10, ...extra
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 52px)', overflowY:'auto', overflowX:'hidden', padding:6, gap:6, maxWidth:480, margin:'0 auto', background:'#05070a' }}>

      <div style={{ display:'flex', gap:6, alignItems:'center', background:'#0d1117', border:'1px solid #30363d', borderRadius:10, padding:'7px 10px', flexShrink:0 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:dotColor, flexShrink:0, boxShadow:wsStatus==='live'?'0 0 8px #3fb950':'none', transition:'all .3s' }}/>
        <span style={{ flex:1, fontSize:11, fontFamily:'monospace', color:'#8b949e' }}>ws://192.168.4.1:81</span>
        <button onClick={() => demo ? stopDemo() : startDemo(setAltitude)} style={{ background:demo?'#1a3a2a':'#21262d', border:`1px solid ${demo?'#238636':'#30363d'}`, borderRadius:6, color:demo?'#3fb950':'#8b949e', padding:'4px 8px', fontSize:10, fontWeight:800, cursor:'pointer' }}>DEMO</button>
        {wsStatus !== 'live'
          ? <button onClick={() => wsConnect(setAltitude)} style={{ background:'#1a73e8', border:'none', borderRadius:6, color:'#fff', padding:'4px 10px', fontSize:10, fontWeight:800, cursor:'pointer' }}>CONNECT</button>
          : <button onClick={wsStop} style={{ background:'#238636', border:'none', borderRadius:6, color:'#fff', padding:'4px 10px', fontSize:10, fontWeight:800, cursor:'pointer' }}>DECO</button>
        }
        <button onClick={wsStop} style={{ background:'#b91c1c', border:'none', borderRadius:6, color:'#fff', padding:'4px 8px', fontSize:10, fontWeight:800, cursor:'pointer' }}>STOP</button>
      </div>

      {!hasData && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:'40px 20px', color:'#8b949e', textAlign:'center', flex:1 }}>
          <div style={{ fontSize:44, opacity:.2 }}>[ F3F ]</div>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Station meteo F3F</div>
          <div style={{ fontSize:11, lineHeight:1.8 }}>
            Connectez-vous au reseau <span style={{ color:'#fff', fontWeight:700 }}>F3F-Station</span><br/>
            puis appuyez sur CONNECT<br/>
            ou activez le mode DEMO
          </div>
        </div>
      )}

      {hasData && (<>

        <div style={{ borderRadius:14, padding:'14px 16px', background:iq.bg, border:`2px solid ${iq.border}`, textAlign:'center', position:'relative', overflow:'hidden', transition:'all .4s', flexShrink:0,
          boxShadow: bulle ? `0 0 20px rgba(34,211,238,0.3)` : 'none' }}>
          <div style={{ position:'absolute', bottom:0, left:0, height:4, width:'100%', background:'rgba(255,255,255,.07)', borderRadius:'0 0 14px 14px' }}>
            <div style={{ height:'100%', width:(d.IQA*10)+'%', background:iq.color, borderRadius:'0 0 14px 14px', transition:'width .6s ease' }}/>
          </div>
          <div style={{ fontSize:72, fontWeight:900, lineHeight:1, letterSpacing:-2, color:'#fff' }}>{d.IQA.toFixed(1)}</div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, opacity:.7, marginTop:2, color:'#fff' }}>IQA - INDICE QUALITE AIR</div>
          <div style={{ fontSize:13, fontWeight:800, marginTop:4, color:iq.color }}>{iq.qual}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4, marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.08)' }}>
            {[
              {lbl:'S_TURB', v:d.S_TURB},
              {lbl:'S_VIT',  v:d.S_VIT},
              {lbl:'S_HELI', v:d.S_HELI},
              {lbl:'S_GRAD',     v:d.S_GRAD,     cyan: d.S_GRAD > 0.65},
              {lbl:'S_COH*',    v:d.S_COH_STAR || 0, star:true},
            ].map(({lbl,v,cyan,diag,star}) => (
              <div key={lbl} style={{ textAlign:'center', opacity: diag ? 0.5 : 1 }}>
                <div style={{ fontSize:8, color: star?'#22d3ee':'#8b949e', fontWeight:700, letterSpacing:.5, marginBottom:2 }}>{lbl}</div>
                <div style={{ fontSize:12, fontWeight:900, color: cyan?'#22d3ee': star?'#1a73e8':scoreColor(v) }}>{v.toFixed(2)}</div>
                <div style={{ height:2, background:'#1e2530', borderRadius:1, marginTop:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:(v*100)+'%', background: cyan?'#22d3ee': star?'#1a73e8':scoreColor(v), borderRadius:1, transition:'width .5s' }}/>
                </div>
              </div>
            ))}
          </div>
          {bulle && (
            <div style={{ marginTop:8, fontSize:9, color:'#22d3ee', fontWeight:700, letterSpacing:1, opacity:.8 }}>
              S_GRAD {d.S_GRAD.toFixed(2)} - GRAD {d.GRAD_C >= 0 ? '+' : ''}{d.GRAD_C.toFixed(3)} degC/s
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, flexShrink:0 }}>
          <div style={{ ...panel({padding:'10px 12px'}), textAlign:'center', borderColor:d.SPD>10?'#238636':d.SPD<3?'#f0a500':'#1e2530' }}>
            <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:.8, textTransform:'uppercase', marginBottom:4 }}>VITESSE</div>
            <div><span style={{ fontSize:28, fontWeight:900, color:'#fff' }}>{d.SPD.toFixed(1)}</span><span style={{ fontSize:11, color:'#8b949e', marginLeft:3 }}>m/s</span></div>
            <div style={{ fontSize:10, color:'#444', marginTop:3 }}>moy {d.SPD_AVG.toFixed(1)} - pit {d.SPD_PITOT.toFixed(1)} - anemo {d.SPD_ANEMO.toFixed(1)}</div>
          </div>
          <div style={{ ...panel({padding:'10px 12px'}), textAlign:'center', borderColor:d.TURB<0.01?'#238636':d.TURB>0.05?'#f0a500':'#1e2530' }}>
            <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:.8, textTransform:'uppercase', marginBottom:4 }}>TURBULENCE</div>
            <div><span style={{ fontSize:28, fontWeight:900, color:'#fff' }}>{(d.TURB*1000).toFixed(1)}</span><span style={{ fontSize:11, color:'#8b949e', marginLeft:3 }}>o/oo</span></div>
            <div style={{ fontSize:10, color:'#444', marginTop:3 }}>gradient {d.GRAD_C >= 0 ? '+' : ''}{(d.GRAD_C || 0).toFixed(3)} degC/s</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, flexShrink:0 }}>
          <div style={{ ...panel({padding:10}), display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:.8, alignSelf:'flex-start' }}>GIROUETTE</div>
            <CompassSvg angle={d.ANG}/>
            <div style={{ fontSize:16, fontWeight:900, color:'#fff' }}>{d.ANG>=0?'+':''}{d.ANG.toFixed(1)} deg</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:.5, color:heliColor(d.HELI) }}>HELI {d.HELI.toFixed(1)} deg/s</div>
          </div>
          <div style={{ ...panel({padding:10}), display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:.8, alignSelf:'flex-start' }}>SERVO PITOT</div>
            <ServoSvg angle={d.SERVO}/>
            <div style={{ fontSize:16, fontWeight:900, color:'#1a73e8' }}>{d.SERVO>=0?'+':''}{d.SERVO.toFixed(1)} deg</div>
            <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:.5 }}>POSITION PITOT</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4, flexShrink:0 }}>
          {[
            {v:d.PRES.toFixed(1), lbl:'hPa',    color:'#a78bfa', border:'#1e2530'},
            {v:d.HUM.toFixed(0),  lbl:'HR %',    color:'#a78bfa', border:'#1e2530'},
            {v:Math.round(d.ALT), lbl:'ALT m',   color:'#a78bfa', border:'rgba(167,139,250,.5)'},
            {v:d.RHO.toFixed(3),  lbl:'rho',     color:'#a78bfa', border:'#1e2530'},
            {v:d.TEMP.toFixed(1), lbl:'T deg C', color:'#fb923c', border:'#1e2530'},
          ].map(({v,lbl,color,border}) => (
            <div key={lbl} style={{ ...panel({padding:'7px 4px', borderColor:border}), textAlign:'center' }}>
              <div style={{ fontSize:14, fontWeight:900, color, lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:8, color:'#8b949e', fontWeight:700, letterSpacing:.5, marginTop:2 }}>{lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ ...panel({padding:10}), flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
            <span style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:.8 }}>SISMOGRAPHE - TURBULENCE (60s)</span>
            <span style={{ fontSize:11, fontWeight:900, color:'#3fb950' }}>{(d.TURB*1000).toFixed(1)} o/oo</span>
          </div>
          <Oscillogramme buf={turbBuf} sigma={turbSigma}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#444', marginTop:3 }}>
            <span>-60s</span><span>-45s</span><span>-30s</span><span>-15s</span><span>now</span>
          </div>
        </div>

        <div style={{ ...panel({padding:'8px 10px'}), flexShrink:0 }}>
          <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, letterSpacing:.8, marginBottom:6 }}>SERVO PID PITOT</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5, marginBottom:5 }}>
            {[{k:'kp',lbl:'Kp',step:0.05},{k:'ki',lbl:'Ki',step:0.01},{k:'kd',lbl:'Kd',step:0.05}].map(({k,lbl,step}) => (
              <div key={k} style={{ textAlign:'center' }}>
                <div style={{ fontSize:9, color:'#8b949e', fontWeight:700, marginBottom:3 }}>{lbl}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
                  <button onClick={() => setPid(k,-step)} style={{ background:'#21262d', border:'1px solid #30363d', borderRadius:4, color:'#fff', fontSize:13, fontWeight:900, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>-</button>
                  <span style={{ fontSize:12, fontWeight:900, color:'#1a73e8', minWidth:34, textAlign:'center' }}>{pid[k].toFixed(2)}</span>
                  <button onClick={() => setPid(k,+step)} style={{ background:'#21262d', border:'1px solid #30363d', borderRadius:4, color:'#fff', fontSize:13, fontWeight:900, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={sendPid} style={{ width:'100%', padding:6, background:'#1a73e8', border:'none', borderRadius:6, color:'#fff', fontSize:11, fontWeight:800, cursor:'pointer' }}>
            ENVOYER PID
          </button>
        </div>

        <div style={{ textAlign:'center', fontSize:9, color:d.VBAT<10.5?'#f85149':'#444', paddingBottom:6, flexShrink:0 }}>
          Batterie {d.VBAT.toFixed(2)}V - rho {d.RHO.toFixed(3)} - servo {d.SERVO>=0?'+':''}{d.SERVO.toFixed(1)} deg
        </div>


      </>)}
    </div>
  )
}
