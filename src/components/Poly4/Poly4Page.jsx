import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { useAppStore } from '../../stores/appStore'
import { useModelStore } from '../../stores/modelStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'

Chart.register(...registerables)

export default function Poly4Page() {
  const activeTab = 1
  const setActiveSite = useAppStore(s => s.setActiveSite)
  const [irp, setIrp] = useState(165)
  const [siteName, setSiteName] = useState('')
  const DEFAULT_SITES = [
    { name: 'Rognac',            irp: 260, k: 1.150 },
    { name: 'Hanstholm Danemark',irp: 225, k: 1.150 },
    { name: "Font d'Urles",      irp: 223, k: 1.150 },
    { name: 'Col du Glandon',    irp: 186, k: 1.088 },
    { name: 'Col des Faisses',   irp: 186, k: 1.088 },
    { name: 'Sceautres',         irp: 182, k: 1.064 },
    { name: 'Saint Ferriol',     irp: 171, k: 1.000 },
    { name: 'Cederon',           irp: 155, k: 0.906 },
    { name: 'Serra de Busa',     irp: 124, k: 0.850 },
  ]
  const [sites, setSites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mbi_sites') || 'null')
      return saved || DEFAULT_SITES
    } catch { return DEFAULT_SITES }
  })

  function saveSite() {
    if (!siteName.trim()) return
    const v = parseFloat(irp)
    if (isNaN(v) || v <= 0) return
    const k = parseFloat(Math.max(0.85, Math.min(1.15, v / 171)).toFixed(2))
    const entry = { name: siteName.trim(), irp: v, k }
    const updated = [entry, ...sites.filter(s => s.name !== siteName.trim())]
    setSites(updated)
    localStorage.setItem('mbi_sites', JSON.stringify(updated))
  }

  function loadSite(s) {
    setActiveSite({ name: s.name, irp: s.irp, k: s.k })
    setSiteName(s.name)
    setIrp(s.irp)
    setKUp(s.k)
  }

  function deleteSite(name) {
    const updated = sites.filter(s => s.name !== name)
    setSites(updated)
    localStorage.setItem('mbi_sites', JSON.stringify(updated))
  }
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  
  const { 
    params,
    incrementParam,
    decrementParam,
    offset,
    incrementOffset,
    decrementOffset,
    k_up,
    setKUp,
    alpha,
    setAlpha,
    altitude
  } = useAppStore()
  const activeModel = useModelStore(s => s.getActiveModel())
  
  const vent = params.vent
  const k_pilot = 1.0 + (offset / 5000)
  
  // Coefficients Poly4
  const A4 = -0.0001727931675766561
  const A3 =  0.008177813136456791
  const A2 = -0.1498002640832864
  const A1 =  1.3471302057227625
  const A0 = -1.1952205536365412
  
  // Enveloppe FAI : 3 points (6‚Üí2.6kg, 8‚Üí3.474kg, 14‚Üí4.2kg) ‚Äî polyn√¥me degr√© 2
  const faiEnv = (v) => 4.200

  const vRange = Array.from({length: 226}, (_, i) => 4.0 + i * 0.05)
  
  const poly4 = (v) => A4 * Math.pow(v, 4) + A3 * Math.pow(v, 3) + A2 * Math.pow(v, 2) + A1 * v + A0
  const aeromod = (v) => Math.max(0, 0.1 * v + 1.95)
  
  const densiteRel = (alt) => {
    if (alt <= 0) return 1.0
    return Math.pow(Math.max(0, 1 - 0.0065 * alt / 288.15), 5.25588)
  }
  
  const rr = densiteRel(altitude)
  
  // Calculs
  const p4b = poly4(vent)
  const m_adapt = p4b * alpha * k_up * k_pilot
  const modelOff = (activeModel?.offset || 0) / 1000
  const m_fin = Math.min(faiEnv(vent), Math.max(0, m_adapt * rr + modelOff))
  const am = aeromod(vent)
  
  // InterprÈtation k_up
  const getKupInterp = (kup) => {
    if (kup < 0.82) return { t: '? SOUS-LESTAGE FORT ó PROCHE AEROMOD', bg: '#1a0820', c: '#ff4b91' }
    if (kup < 0.92) return { t: '? PENTE MOLLE ó SOUS P4', bg: '#1a1228', c: '#c084fc' }
    if (kup < 0.98) return { t: '? L…G»REMENT SOUS P4', bg: '#1a2040', c: '#90caf9' }
    if (kup <= 1.02) return { t: '? P4 NEUTRE ó R…F…RENCE', bg: '#0a1e14', c: '#69f0ae' }
    if (kup <= 1.08) return { t: '? L…G»REMENT AU-DESSUS P4', bg: '#1e1e08', c: '#ffe082' }
    if (kup <= 1.12) return { t: '? PENTE PORTE FORT', bg: '#2a1a00', c: '#ffb74d' }
    return { t: '?? TR»S DYNAMIQUE ó SUR-LESTAGE', bg: '#2a0a00', c: '#ff7043' }
  }
  
  const kupInterp = getKupInterp(k_up)

  function applyIrp(val) {
    const v = parseFloat(val)
    if (!isNaN(v) && v > 0) {
      const k = Math.max(0.85, Math.min(1.15, v / 171))
      setKUp(parseFloat(k.toFixed(2)))
        setActiveSite({ name: siteName || 'Manuel', irp: v, k: parseFloat(k.toFixed(2)) })
    }
  }
  
  // Initialiser Chart.js
  useEffect(() => {
    if (!chartRef.current || activeTab !== 1) return
    
    const ctx = chartRef.current.getContext('2d')
    
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: vRange,
        datasets: [
          {
            label: 'Aeromod',
            data: vRange.map(aeromod),
            borderColor: '#ff4b91',
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.1
          },
          {
            label: 'P4 neutre',
            data: vRange.map(poly4),
            borderColor: 'rgba(232,234,240,0.55)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3
          },
          {
            label: 'P4 adapt',
            data: vRange.map(v => poly4(v) * alpha * k_up * k_pilot),
            borderColor: '#4a9eff',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.3,
            fill: {
              target: 1,
              above: 'rgba(74,158,255,0.07)',
              below: 'rgba(255,75,145,0.07)'
            }
          },
          {
            label: 'DensitÈ',
            data: vRange.map(v => poly4(v) * alpha * k_up * k_pilot * rr),
            borderColor: '#ffb74d',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            tension: 0.3
          },
          {
            label: 'Finale',
            data: [{ x: vent, y: m_fin }],
            type: 'scatter',
            borderColor: '#ff3d3d',
            backgroundColor: '#ff3d3d',
            pointRadius: 8,
            showLine: false
          },
          {
            label: 'Curseur',
            data: vRange.map(v => Math.abs(v - vent) < 0.06 ? 5.0 : null),
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 100 },
        scales: {
          x: {
            type: 'linear',
            min: 4.0,
            max: 15.5,
            grid: { color: '#1a2030' },
            ticks: { 
              color: '#4a5568',
              font: { family: "'Share Tech Mono', monospace", size: 10 },
              stepSize: 2
            }
          },
          y: {
            min: 2.0,
            max: 5.0,
            grid: { color: '#1a2030' },
            ticks: {
              color: '#4a5568',
              font: { family: "'Share Tech Mono', monospace", size: 10 },
              stepSize: 0.2
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d1420',
            borderColor: '#1e2535',
            borderWidth: 1,
            callbacks: {
              title: (ctx) => `Vent : ${parseFloat(ctx[0].label || ctx[0].raw?.x || 0).toFixed(1)} m/s`,
              label: (ctx) => {
                const y = ctx.raw?.y ?? ctx.raw
                return `${ctx.dataset.label} : ${parseFloat(y).toFixed(3)} kg`
              }
            }
          }
        }
      }
    })
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [activeTab])
  
  // Mettre ‡ jour le chart
  useEffect(() => {
    if (!chartInstance.current || activeTab !== 1) return
    
    chartInstance.current.data.datasets[2].data = vRange.map(v => poly4(v) * alpha * k_up * k_pilot)
    chartInstance.current.data.datasets[3].data = vRange.map(v => poly4(v) * alpha * k_up * k_pilot * rr)
    chartInstance.current.data.datasets[4].data = [{ x: vent, y: m_fin }]
    chartInstance.current.data.datasets[5].data = vRange.map(v => Math.abs(v - vent) < 0.06 ? 5.0 : null)
    chartInstance.current.update('none')
  }, [vent, k_up, alpha, offset, altitude, activeTab])
  
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0d0f14' }}>
      <div className="flex-1 overflow-hidden relative">
        
        {/* Page Poly4 */}
        {(
          <div className="h-full overflow-y-auto p-3 space-y-3">
            {/* LÈgende + Graphique */}
            <div className="rounded-lg p-3" style={{ background: '#131720', border: '1px solid #1e2535' }}>
              <div className="text-xs tracking-wider mb-2" style={{ color: '#4a5568' }}>
                COURBES MASSE / VENT
              </div>
              
              {/* LÈgende */}
              <div className="flex flex-wrap gap-3 mb-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 rounded" style={{ background: '#ff4b91' }}></div>
                  <span style={{ color: '#4a5568' }}>AEROMOD</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 rounded" style={{ background: 'rgba(232,234,240,0.55)' }}></div>
                  <span style={{ color: '#4a5568' }}>P4 NEUTRE</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 rounded" style={{ background: '#4a9eff' }}></div>
                  <span style={{ color: '#4a5568' }}>P4 ADAPT</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 rounded border" style={{ borderColor: '#ffb74d', borderStyle: 'dashed' }}></div>
                  <span style={{ color: '#4a5568' }}>DENSIT…</span>
                </div>
              </div>
              
              <div className="h-64">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
            
            {/* 4 RÈsultats */}
            <div className="grid grid-cols-4 gap-1.5">
              <div className="rounded p-2 text-center border-t-2" style={{ background: '#131720', border: '1px solid #1e2535', borderTopColor: '#ff4b91' }}>
                <div className="text-xs mb-1" style={{ color: '#4a5568' }}>AEROMOD</div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ff4b91' }}>
                  {am.toFixed(3)}
                </div>
              </div>
              
              <div className="rounded p-2 text-center border-t-2" style={{ background: '#131720', border: '1px solid #1e2535', borderTopColor: 'rgba(232,234,240,0.55)' }}>
                <div className="text-xs mb-1" style={{ color: '#4a5568' }}>P4 BRUT</div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#e8eaf0' }}>
                  {p4b.toFixed(3)}
                </div>
              </div>
              
              <div className="rounded p-2 text-center border-t-2" style={{ background: '#131720', border: '1px solid #1e2535', borderTopColor: '#4a9eff' }}>
                <div className="text-xs mb-1" style={{ color: '#4a5568' }}>ADAPTATIF</div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#4a9eff' }}>
                  {m_adapt.toFixed(3)}
                </div>
              </div>
              
              <div className="rounded p-2 text-center border-t-2" style={{ background: '#131720', border: '1px solid #1e2535', borderTopColor: '#00d1b2' }}>
                <div className="text-xs mb-1" style={{ color: '#4a5568' }}>FINALE</div>
                <div className="text-lg font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00d1b2' }}>
                  {m_fin.toFixed(3)}
                </div>
              </div>
            </div>
            
            {/* IRP ‚Äî Indice Rendement Pente */}
            <div className="rounded-lg p-3" style={{ background: '#131720', border: '1px solid #1e2535' }}>
              <div className="text-xs tracking-wider mb-2" style={{ color: '#4a5568' }}>
                üìê IRP ‚Äî INDICE RENDEMENT PENTE
              </div>

              {/* Saisie nom + IRP */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nom de la pente"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="flex-1 rounded px-2 py-1.5 text-sm"
                  style={{ background: '#0d1117', border: '1px solid #30363d', color: '#fff' }}
                />
                <input
                  type="number"
                  min="100" max="300" step="1"
                  value={irp}
                  onChange={(e) => setIrp(e.target.value)}
                  onBlur={(e) => applyIrp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyIrp(e.target.value)}
                  className="w-20 rounded px-2 py-1.5 text-center text-sm font-bold"
                  style={{ background: '#0d1117', border: '1px solid #30363d', color: '#fff',
                    fontFamily: "'Share Tech Mono', monospace" }}
                />
              </div>

              {/* K_PENTE + boutons */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 text-center rounded py-1.5" style={{ background: '#0d1117', border: '1px solid #1e2535' }}>
                  <div className="text-xl font-bold" style={{ color: '#00d1b2', fontFamily: "'Share Tech Mono', monospace" }}>
                    {Math.max(0.85, Math.min(1.15, (parseFloat(irp) || 171) / 171)).toFixed(2)}
                  </div>
                  <div className="text-xs" style={{ color: '#4a5568' }}>K_PENTE</div>
                </div>
                <button onClick={() => applyIrp(irp)}
                  className="px-3 py-2 rounded text-xs font-bold"
                  style={{ background: '#1a73e8', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  APPLIQUER
                </button>
                <button onClick={saveSite}
                  className="px-3 py-2 rounded text-xs font-bold"
                  style={{ background: '#238636', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  + SAUVER
                </button>
              </div>

              {/* Liste sites */}
              {sites.length > 0 && (
                <div className="space-y-1">
                  {sites.map(s => (
                    <div key={s.name} className="flex items-center gap-2 rounded px-2 py-1"
                      style={{ background: '#0d1117', border: '1px solid #1e2535', cursor: 'pointer' }}
                      onClick={() => loadSite(s)}>
                      <span className="flex-1 text-xs font-bold" style={{ color: '#e8eaf0' }}>{s.name}</span>
                      <span className="text-xs font-bold" style={{ color: '#00d1b2', fontFamily: "'Share Tech Mono', monospace" }}>
                        K {s.k.toFixed(2)}
                      </span>
                      <span className="text-xs" style={{ color: '#4a5568' }}>IRP {s.irp}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteSite(s.name) }}
                        style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: 14 }}>
                        üóë
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* k_up */}
            <div className="rounded-lg p-3" style={{ background: '#131720', border: '1px solid #1e2535' }}>
              <div className="text-xs tracking-wider mb-2" style={{ color: '#4a5568' }}>
                ?? K_UP ó UPDRAFT TERRAIN
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs" style={{ color: '#4a5568' }}>RESSENTI PORTANCE</span>
                <div className="flex-1"></div>
                <span className="text-xl font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#00d1b2' }}>
                  {k_up.toFixed(2)}
                </span>
              </div>
              
              <div className="mb-2">
                <input
                  type="range"
                  min="0.75"
                  max="1.15"
                  step="0.01"
                  value={k_up}
                  onChange={(e) => setKUp(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #ff4b91 0%, #00d1b2 50%, #4a9eff 100%)',
                    accentColor: '#00d1b2'
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs mb-2" style={{ color: '#4a5568' }}>
                <span>0.75 Aeromod</span>
                <span>1.00 P4</span>
                <span>1.15 Porteur</span>
              </div>
              
              <div 
                className="text-xs font-semibold text-center py-1.5 px-2 rounded tracking-wide"
                style={{ 
                  background: kupInterp.bg,
                  color: kupInterp.c
                }}
              >
                {kupInterp.t}
              </div>
            </div>
            
            {/* Alpha */}
            <div className="rounded-lg p-3" style={{ background: '#131720', border: '1px solid #1e2535' }}>
              <div className="text-xs tracking-wider mb-2" style={{ color: '#4a5568' }}>
                ?? a ó RENDEMENT HISTORIQUE
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#4a5568' }}>0.85</span>
                <input
                  type="range"
                  min="0.85"
                  max="1.15"
                  step="0.01"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #2a3a2a 0%, #69f0ae 100%)',
                    accentColor: '#69f0ae'
                  }}
                />
                <span className="text-xs" style={{ color: '#4a5568' }}>1.15</span>
                <span className="text-lg font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#69f0ae' }}>
                  {alpha.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom bar - Commandes partagÈes */}
      <div className="p-3" style={{ background: '#131720', borderTop: '1px solid #1e2535' }}>
        <div className="text-center text-xs tracking-widest mb-2" style={{ color: '#4a5568' }}>
          ? COMMANDES PILOTE
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Vent */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-wider" style={{ color: '#4a9eff' }}>?? VENT</span>
              <span className="text-sm font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#4a9eff' }}>
                {vent.toFixed(1)} m/s
              </span>
            </div>
            <input
              type="range"
              min="4.05"
              max="15.30"
              step="0.1"
              value={vent}
              onChange={(e) => {
                const newVent = parseFloat(e.target.value)
                const diff = newVent - vent
                if (diff > 0) incrementParam('vent')
                else if (diff < 0) decrementParam('vent')
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #2a3a4a 0%, #4a9eff 100%)',
                accentColor: '#4a9eff'
              }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#4a5568' }}>
              <span>4</span>
              <span>7</span>
              <span>10</span>
              <span>13</span>
              <span>15</span>
            </div>
          </div>
          
          {/* Offset */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-wider" style={{ color: '#ffb74d' }}>?? OFFSET</span>
              <span className="text-sm font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ffb74d' }}>
                {offset >= 0 ? '+' : ''}{((offset / 5000) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={(k_pilot - 1.0) * 100}
              onChange={(e) => {
                const pct = parseFloat(e.target.value)
                const newOffset = (pct / 100) * 5000
                const diff = newOffset - offset
                if (diff > 0) incrementOffset()
                else if (diff < 0) decrementOffset()
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(90deg, #ff4b91 0%, #4a5568 50%, #00d1b2 100%)',
                accentColor: '#ffb74d'
              }}
            />
            <div className="flex justify-between text-xs mt-1">
              <span style={{ color: '#ff4b91' }}>-10%</span>
              <span style={{ color: '#4a5568' }}>0</span>
              <span style={{ color: '#00d1b2' }}>+10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
