import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'

const CSS = `
.st-app{display:flex;flex-direction:column;height:100%;background:#05070a;color:#fff;font-family:system-ui,sans-serif;overflow-y:auto;padding:8px;gap:8px}
.st-bar{display:flex;gap:6px;align-items:center;flex-shrink:0}
.st-url{flex:1;background:#161b22;border:1px solid #30363d;border-radius:6px;color:#fff;padding:6px 10px;font-size:12px;font-family:monospace}
.ws-dot{width:10px;height:10px;border-radius:50%;background:#444;flex-shrink:0}
.ws-dot.live{background:#3fb950;box-shadow:0 0 6px #3fb950}
.ws-dot.err{background:#f85149}
.ws-btn{background:#1a73e8;border:none;border-radius:6px;color:#fff;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
.ws-btn.live{background:#f85149}
.demo-btn{background:#6d28d9;border:none;border-radius:6px;color:#fff;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
.demo-btn.running{background:#b91c1c}
.st-nosignal{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;color:#8b949e;gap:8px;font-size:14px}
.iqa-hero{border-radius:14px;padding:14px 16px;background:linear-gradient(135deg,#0a1f0a,#0e2e0e);border:1.5px solid #238636;position:relative;overflow:hidden;flex-shrink:0}
.iqa-hero.warn{background:linear-gradient(135deg,#2a1a00,#3a2600);border-color:#f0a500}
.iqa-hero.bad{background:linear-gradient(135deg,#1f0808,#2e1010);border-color:#f85149}
.iqa-bar-bg{position:absolute;bottom:0;left:0;height:4px;width:100%;background:rgba(255,255,255,.07);border-radius:0 0 14px 14px}
.iqa-bar-fill{height:100%;border-radius:0 0 14px 14px;transition:width .6s ease,background .4s}
.iqa-num{font-size:72px;font-weight:900;line-height:1;letter-spacing:-2px}
.iqa-lbl{font-size:11px;font-weight:700;letter-spacing:2px;opacity:.7;margin-top:2px}
.iqa-qual{font-size:13px;font-weight:800;margin-top:4px}
.st-grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mc{background:#0d1117;border:1px solid #21262d;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:4px}
.mc.hi{border-color:#238636}
.mc.warn{border-color:#f0a500}
.mc-lbl{font-size:9px;color:#8b949e;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
.mc-val{font-size:28px;font-weight:900;line-height:1}
.mc-sub{font-size:10px;color:#8b949e}
.st-atmo{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.atmo-item{background:#0d1117;border:1px solid #21262d;border-radius:8px;padding:8px;text-align:center}
.atmo-val{font-size:16px;font-weight:900;color:#a78bfa}
.atmo-lbl{font-size:8px;color:#8b949e;margin-top:2px}
.compass-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}
.spark-wrap{background:#0d1117;border:1px solid #21262d;border-radius:10px;padding:10px;flex-shrink:0}
.spark-title{font-size:9px;color:#8b949e;font-weight:700;letter-spacing:.5px;margin-bottom:6px;display:flex;justify-content:space-between}
.pid-wrap{background:#0d1117;border:1px solid #21262d;border-radius:10px;padding:10px;flex-shrink:0}
.pid-title{font-size:10px;color:#8b949e;font-weight:700;letter-spacing:.5px;margin-bottom:8px}
.pid-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
.pid-item{background:#161b22;border-radius:8px;padding:8px;text-align:center}
.pid-lbl{font-size:9px;color:#8b949e;font-weight:700}
.pid-val{font-size:18px;font-weight:900;color:#58a6ff}
.pid-btns{display:flex;gap:4px;margin-top:4px;justify-content:center}
.pid-btn{background:#21262d;border:1px solid #30363d;border-radius:4px;color:#fff;padding:2px 8px;cursor:pointer;font-size:11px;font-weight:700}
.pid-send{width:100%;background:#1a3a8f;border:1px solid #1a73e8;color:#fff;border-radius:8px;padding:8px;cursor:pointer;font-size:12px;font-weight:700}
`

export default function StationPage() {
  const { setParam } = useAppStore()
  const [wsUrl, setWsUrl] = useState('ws://192.168.1.1:81')
  const [wsLive, setWsLive] = useState(false)
  const [wsErr, setWsErr] = useState(false)
  const [demoOn, setDemoOn] = useState(false)
  const [data, setData] = useState(null)
  const [sparkData, setSparkData] = useState([])
  const [pidVals, setPidVals] = useState({kp:1.20, ki:0.05, kd:0.35})
  const wsRef = useRef(null)
  const demoRef = useRef(null)
  const demoT = useRef(0)

  function connect() {
    if (wsLive) { disconnect(); return }
    try {
      const ws = new WebSocket(wsUrl)
      ws.onopen = () => { setWsLive(true); setWsErr(false) }
      ws.onmessage = (e) => {
        try { const d = JSON.parse(e.data); applyData(d) } catch(err) {}
      }
      ws.onerror = ws.onclose = () => { wsRef.current = null; setWsLive(false); setWsErr(true); setTimeout(() => setWsErr(false), 2000) }
      wsRef.current = ws
    } catch(err) { setWsErr(true) }
  }

  function disconnect() {
    if (wsRef.current) { try { wsRef.current.close() } catch(e) {} wsRef.current = null }
    setWsLive(false)
  }

  function applyData(d) {
    setData(d)
    setSparkData(prev => {
      const next = [...prev, (d.TURB||0)*1000]
      return next.length > 60 ? next.slice(-60) : next
    })
    // Sync vent avec appStore si valide
    if (d.SPD && d.SPD > 0 && d.SPD <= 20) {
      setParam('vent', parseFloat(d.SPD.toFixed(1)))
    }
    if (d.PRES) setParam('pression', Math.round(d.PRES))
  }

  function demoToggle() {
    if (demoOn) {
      clearInterval(demoRef.current)
      setDemoOn(false)
      setData(null)
      setSparkData([])
      setWsLive(false)
    } else {
      setDemoOn(true)
      setWsLive(true)
      demoT.current = 0
      demoRef.current = setInterval(demoTick, 1000)
      demoTick()
    }
  }

  function demoTick() {
    demoT.current++
    const t = demoT.current
    const windBase = 8 + 2*Math.sin(t*0.07) + 3*Math.sin(t*0.23)
    const gust = Math.random() < 0.08 ? Math.random()*4 : 0
    const spd = Math.max(1, windBase + gust + (Math.random()-0.5)*0.8)
    const spdAvg = 7.5 + 1.5*Math.sin(t*0.04)
    const turbBase = 0.008 + 0.006*Math.abs(Math.sin(t*0.13))
    const turb = Math.max(0.001, turbBase + (gust>0?0.025*gust:0) + (Math.random()-0.5)*0.003)
    const grad = (Math.random()-0.45)*0.08
    const scoreV = Math.exp(-Math.pow((spd-spdAvg)/1.8, 2))
    const scoreT = Math.exp(-4*Math.min(turb/0.02, 3))
    const iqa = (0.4*scoreV + 0.4*scoreT + 0.2*(1-Math.exp(-6*Math.max(grad,0))))*10
    const windAng = 20*Math.sin(t*0.05) + 8*Math.sin(t*0.19) + (Math.random()-0.5)*3
    const servoPos = windAng*0.85 + (Math.random()-0.5)*1.2
    const pres = 1013 + 2*Math.sin(t*0.02)
    const hum = 55 + 10*Math.sin(t*0.03)
    const alt = Math.round(150 + 20*Math.sin(t*0.015))
    const rho = 1.225 - alt*0.0001
    applyData({ IQA:iqa, SPD:spd, SPD_AVG:spdAvg, TURB:turb, GRAD:grad, ANG:windAng, SERVO:servoPos, PRES:pres, HUM:hum, ALT:alt, RHO:rho })
  }

  useEffect(() => () => {
    disconnect()
    clearInterval(demoRef.current)
  }, [])

  const iqa = data?.IQA || 0
  const iqaCls = iqa >= 7.5 ? '' : iqa >= 5 ? '' : iqa >= 3 ? 'warn' : 'bad'
  const iqaTxt = iqa >= 7.5 ? 'CONDITIONS EXCELLENTES' : iqa >= 5 ? 'CONDITIONS CORRECTES' : iqa >= 3 ? 'CONDITIONS MEDIOCRES' : 'CONDITIONS MAUVAISES'
  const spd = data?.SPD || 0
  const turb = (data?.TURB || 0) * 1000
  const ang = data?.ANG || 0
  const srv = data?.SERVO || 0

  // Sparkline SVG
  function sparkPath() {
    if (sparkData.length < 2) return ''
    const W=280, H=44, n=sparkData.length
    const mn=Math.min(...sparkData), mx=Math.max(...sparkData)
    const rng=Math.max(mx-mn, 0.1)
    return sparkData.map((v,i) => {
      const x = i*(W/(n-1))
      const y = H - ((v-mn)/rng)*(H-6) - 3
      return (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1)
    }).join(' ')
  }

  function pidStep(k, step) {
    setPidVals(prev => ({...prev, [k]: Math.max(0, parseFloat((prev[k]+step).toFixed(3)))}))
  }

  function pidSend() {
    if (wsRef.current && wsLive) {
      wsRef.current.send(JSON.stringify(pidVals))
    }
  }

  const dotCls = wsLive ? 'live' : wsErr ? 'err' : ''
  const showContent = wsLive

  return (
    <>
      <style>{CSS}</style>
      <div className="st-app">
        <div className="st-bar">
          <div className={`ws-dot ${dotCls}`} />
          <input className="st-url" value={wsUrl} onChange={e => setWsUrl(e.target.value)} placeholder="ws://192.168.1.1:81" />
          <button className={`ws-btn${wsLive?' live':''}`} onClick={connect}>{wsLive?'DECO':'CONNECT'}</button>
          <button className={`demo-btn${demoOn?' running':''}`} onClick={demoToggle}>{demoOn?'STOP':'DEMO'}</button>
        </div>

        {!showContent && (
          <div className="st-nosignal">
            <div style={{fontSize:40}}>📡</div>
            <div>En attente de signal ESP32...</div>
            <div style={{fontSize:11}}>Connectez le WebSocket ou lancez le mode DEMO</div>
          </div>
        )}

        {showContent && (
          <>
            <div className={`iqa-hero ${iqaCls}`}>
              <div className="iqa-bar-bg">
                <div className="iqa-bar-fill" style={{width:iqa*10+'%', background: iqa>=7.5?'#3fb950':iqa>=5?'#1a73e8':iqa>=3?'#f0a500':'#f85149'}} />
              </div>
              <div className="iqa-num">{iqa.toFixed(1)}</div>
              <div className="iqa-lbl">IQA - INDICE QUALITE AIR</div>
              <div className="iqa-qual">{iqaTxt}</div>
            </div>

            <div className="st-grid2">
              <div className={`mc${spd>10?' hi':spd<3?' warn':''}`} id="cardSpd">
                <div className="mc-lbl">VITESSE</div>
                <div className="mc-val">{spd.toFixed(1)} <span style={{fontSize:14}}>m/s</span></div>
                <div className="mc-sub">moy {(data?.SPD_AVG||0).toFixed(1)} m/s</div>
              </div>
              <div className={`mc${turb<10?' hi':turb>50?' warn':''}`}>
                <div className="mc-lbl">TURBULENCE</div>
                <div className="mc-val">{turb.toFixed(1)} <span style={{fontSize:14}}>‰</span></div>
                <div className="mc-sub">gradient {(data?.GRAD||0)>=0?'+':''}{(data?.GRAD||0).toFixed(2)}V</div>
              </div>

              <div className="mc">
                <div className="mc-lbl">GIROUETTE</div>
                <div className="compass-wrap">
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="40" fill="none" stroke="#21262d" strokeWidth="2"/>
                    {['N','E','S','O'].map((l,i) => (
                      <text key={l} x={45+38*Math.sin(i*Math.PI/2)} y={45-38*Math.cos(i*Math.PI/2)+4} textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="700">{l}</text>
                    ))}
                    <line x1="45" y1="45" x2={45+36*Math.sin(ang*Math.PI/180)} y2={45-36*Math.cos(ang*Math.PI/180)} stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="45" cy="45" r="3" fill="#fff"/>
                  </svg>
                  <div style={{fontSize:13,fontWeight:900}}>{ang>=0?'+':''}{ang.toFixed(1)}°</div>
                </div>
              </div>

              <div className="mc">
                <div className="mc-lbl">SERVO PITOT</div>
                <div className="compass-wrap">
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="40" fill="none" stroke="#21262d" strokeWidth="2"/>
                    <line x1="45" y1="45" x2={45+36*Math.sin(srv*Math.PI/180)} y2={45-36*Math.cos(srv*Math.PI/180)} stroke="#58a6ff" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="45" cy="45" r="3" fill="#fff"/>
                  </svg>
                  <div style={{fontSize:13,fontWeight:900}}>{srv>=0?'+':''}{srv.toFixed(1)}°</div>
                  <div style={{fontSize:9,color:'#8b949e'}}>POSITION PITOT</div>
                </div>
              </div>
            </div>

            <div className="st-atmo">
              {[
                [(data?.PRES||0).toFixed(1), 'hPa'],
                [(data?.HUM||0).toFixed(0), 'HR %'],
                [(data?.ALT||0).toFixed(0), 'ALT m'],
                [(data?.RHO||0).toFixed(3), 'rho kg/m3'],
              ].map(([v,l]) => (
                <div key={l} className="atmo-item">
                  <div className="atmo-val">{v}</div>
                  <div className="atmo-lbl">{l}</div>
                </div>
              ))}
            </div>

            <div className="spark-wrap">
              <div className="spark-title">
                <span>HISTORIQUE TURBULENCE (60s)</span>
                <span style={{color:'#3fb950'}}>{turb.toFixed(1)}‰</span>
              </div>
              <svg width="100%" height="50" viewBox="0 0 280 50" preserveAspectRatio="none">
                <polyline points={sparkData.map((v,i)=>{
                  const W=280,H=50,n=sparkData.length
                  const mn=Math.min(...sparkData),mx=Math.max(...sparkData),rng=Math.max(mx-mn,0.1)
                  const x=i*(W/(n-1||1)),y=H-((v-mn)/rng)*(H-6)-3
                  return x.toFixed(1)+','+y.toFixed(1)
                }).join(' ')} fill="none" stroke="#1a73e8" strokeWidth="1.5"/>
              </svg>
            </div>

            <div className="pid-wrap">
              <div className="pid-title">REGLAGE PID SERVO</div>
              <div className="pid-row">
                {[['kp','Kp',0.01],['ki','Ki',0.01],['kd','Kd',0.01]].map(([k,l,s]) => (
                  <div key={k} className="pid-item">
                    <div className="pid-lbl">{l}</div>
                    <div className="pid-val">{pidVals[k].toFixed(2)}</div>
                    <div className="pid-btns">
                      <button className="pid-btn" onClick={() => pidStep(k,-s)}>-</button>
                      <button className="pid-btn" onClick={() => pidStep(k,s)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="pid-send" onClick={pidSend}>Envoyer PID</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
