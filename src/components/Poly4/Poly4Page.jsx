import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { useAppStore } from '../../stores/appStore'
import { useModelStore } from '../../stores/modelStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
Chart.register(...registerables)

// ── Constantes Poly4 Mamba S ─────────────────────────────────────────────────
const A4 = -1.728e-4, A3 = 8.178e-3, A2 = -0.14980, A1 = 1.34713, A0 = -1.19522
const V_MIN = 4.05, V_MAX = 15.30

// Enveloppe maximale de sécurité
const FAI_ENV_TABLE = [
  [4,2.5],[5,2.8],[6,3.1],[7,3.4],[8,3.7],[9,4.0],[10,4.3],[11,4.6],[12,4.9],[13,5.2],[15.3,5.5]
]
function faiEnv(v) {
  for (let i = 0; i < FAI_ENV_TABLE.length - 1; i++) {
    const [v0,m0] = FAI_ENV_TABLE[i], [v1,m1] = FAI_ENV_TABLE[i+1]
    if (v >= v0 && v <= v1) return m0 + (m1-m0)*(v-v0)/(v1-v0)
  }
  return FAI_ENV_TABLE[FAI_ENV_TABLE.length-1][1]
}

// Courbe Aeromod recommandée
function aeromod(v) {
  return Math.max(0, 0.0412*v*v - 0.1248*v + 0.1956)
}

export default function Poly4Page() {

  // ── Stores ──────────────────────────────────────────────────────────────────
  const setActiveSite    = useAppStore(s => s.setActiveSite)
  const _as              = useAppStore(s => s.activeSite)
  const activeModel      = useModelStore(s => s.getActiveModel())

  const {
    params, incrementParam, decrementParam,
    offset, incrementOffset, decrementOffset,
    k_up, setKUp,
    alpha, setAlpha,
    altitude
  } = useAppStore()

  // ── State local ─────────────────────────────────────────────────────────────
  const [irp,      setIrp]      = useState(() => _as?.irp  || 165)
  const [siteName, setSiteName] = useState(() => _as?.name || '')
  const DEFAULT_SITES = [
    { name: 'Rognac',             irp: 260, k: 1.150 },
    { name: 'Hanstholm Danemark', irp: 225, k: 1.150 },
    { name: "Font d'Urles",       irp: 223, k: 1.150 },
    { name: 'Col du Glandon',     irp: 186, k: 1.088 },
    { name: 'Col des Faisses',    irp: 186, k: 1.088 },
    { name: 'Sceautres',          irp: 182, k: 1.064 },
    { name: 'Saint Ferriol',      irp: 171, k: 1.000 },
    { name: 'Serra de Busa',      irp: 147, k: 0.860 },
  ]
  const [sites, setSites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mbi_sites') || 'null')
      return saved || DEFAULT_SITES
    } catch { return DEFAULT_SITES }
  })

  const chartRef      = useRef(null)
  const chartInstance = useRef(null)

  // ── Calculs ─────────────────────────────────────────────────────────────────
  const vent     = params.vent
  const alt      = parseFloat(altitude) || 0
  const k_pilot  = 1.0 + (offset / 5000)

  function poly4(v) {
    v = Math.max(V_MIN, Math.min(V_MAX, v))
    return A4*v**4 + A3*v**3 + A2*v**2 + A1*v + A0
  }

  function densiteRel(h) {
    return Math.pow(1 - (0.0065 * h) / 288.15, 5.25588)
  }

  const rr        = densiteRel(alt)
  const p4b       = poly4(vent)
  const m_adapt   = p4b * alpha * k_up * k_pilot
  const modelOff  = (activeModel?.offset || 0) / 1000
  const m_fin     = Math.min(faiEnv(vent), Math.max(0, m_adapt * rr + modelOff))
  const am        = aeromod(vent)

  const vRange = Array.from({length: 226}, (_, i) => 4.0 + i * 0.05)

  // Interprétation k_up
  function getKupInterp(kup) {
    if (kup < 0.82) return { t: 'SOUS-LESTAGE FORT — PROCHE AEROMOD', bg: '#1a0820', c: '#ff4b91' }
    if (kup < 0.90) return { t: 'SOUS-LESTAGE MODÉRÉ', bg: '#1a1008', c: '#ffb74d' }
    if (kup < 0.97) return { t: 'LÉGÈREMENT SOUS-LESTÉ', bg: '#111a10', c: '#81c784' }
    if (kup < 1.03) return { t: '✦ P4 NEUTRE ✦ RÉFÉRENCE', bg: '#0a1a12', c: '#00d1b2' }
    if (kup < 1.08) return { t: 'LÉGÈREMENT SUR-LESTÉ', bg: '#111a10', c: '#81c784' }
    if (kup < 1.12) return { t: 'SUR-LESTAGE MODÉRÉ', bg: '#0a1020', c: '#4a9eff' }
    return { t: 'SUR-LESTAGE FORT — PORTEUR MAX', bg: '#0a1020', c: '#4a9eff' }
  }
  const kupInterp = getKupInterp(k_up)

  // ── Gestion sites ───────────────────────────────────────────────────────────
  function applyIrp(val) {
    const v = parseFloat(val)
    if (!isNaN(v) && v > 0) {
      const k = Math.max(0.85, Math.min(1.15, v / 171))
      setKUp(parseFloat(k.toFixed(2)))
      setActiveSite({ name: siteName || 'Manuel', irp: v, k: parseFloat(k.toFixed(2)) })
    }
  }

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

  // ── Chart.js init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return
    const ctx = chartRef.current.getContext('2d')
    if (chartInstance.current) chartInstance.current.destroy()

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
            tension: 0.4,
          },
          {
            label: 'P4 Neutre',
            data: vRange.map(poly4),
            borderColor: 'rgba(232,234,240,0.55)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'P4 Adapt',
            data: vRange.map(v => poly4(v) * alpha * k_up * k_pilot),
            borderColor: '#4a9eff',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'Densité',
            data: vRange.map(v => poly4(v) * alpha * k_up * k_pilot * rr),
            borderColor: '#ffb74d',
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'Finale',
            data: [{ x: vent, y: m_fin }],
            type: 'scatter',
            borderColor: '#ff3d3d',
            backgroundColor: '#ff3d3d',
            pointRadius: 9,
            pointHoverRadius: 12,
          },
          {
            label: 'VentLine',
            data: vRange.map(v => Math.abs(v - vent) < 0.06 ? 5.0 : null),
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            spanGaps: false,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            type: 'linear',
            min: 4,
            max: 15.5,
            ticks: { color: '#8b949e', font: { size: 10 }, stepSize: 1 },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            min: 1.8,
            max: 5.2,
            ticks: { color: '#8b949e', font: { size: 10 }, stepSize: 0.4 },
            grid: { color: 'rgba(255,255,255,0.06)' },
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
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
    return () => { if (chartInstance.current) chartInstance.current.destroy() }
  }, [])

  // ── Chart update ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartInstance.current) return
    chartInstance.current.data.datasets[2].data = vRange.map(v => poly4(v) * alpha * k_up * k_pilot)
    chartInstance.current.data.datasets[3].data = vRange.map(v => poly4(v) * alpha * k_up * k_pilot * rr)
    chartInstance.current.data.datasets[4].data = [{ x: vent, y: m_fin }]
    chartInstance.current.data.datasets[5].data = vRange.map(v => Math.abs(v - vent) < 0.06 ? 5.0 : null)
    chartInstance.current.update('none')
  }, [vent, k_up, alpha, offset, altitude, m_fin])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0d0f14' }}>

      {/* Graphique */}
      <div className="flex-1 p-2 min-h-0">
        <div style={{ background: '#131720', borderRadius: 10, padding: '8px', height: '100%', border: '1px solid #1e2535' }}>
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-xs font-bold tracking-widest" style={{ color: '#4a5568' }}>COURBES MASSE / VENT</span>
            <div className="flex gap-3 text-xs">
              {[['#ff4b91','AEROMOD'],['rgba(232,234,240,0.55)','P4 NEUTRE'],['#4a9eff','P4 ADAPT'],['#ffb74d','DENSITÉ']].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1">
                  <span style={{ width:16, height:2, background:c, display:'inline-block', borderRadius:1 }} />
                  <span style={{ color:'#8b949e' }}>{l}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: 'calc(100% - 24px)' }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>

      {/* Bande résultats */}
      <div className="grid grid-cols-4 gap-2 px-3 py-2 flex-shrink-0">
        {[
          { label: 'AEROMOD',   val: am.toFixed(3),     color: '#ff4b91',  border: '#ff4b91' },
          { label: 'P4 BRUT',   val: p4b.toFixed(3),    color: '#e8eaf0',  border: '#30363d' },
          { label: 'ADAPTATIF', val: m_adapt.toFixed(3), color: '#4a9eff', border: '#4a9eff' },
          { label: 'FINALE',    val: m_fin.toFixed(3),   color: '#00d1b2', border: '#00d1b2' },
        ].map(({ label, val, color, border }) => (
          <div key={label} className="rounded p-2 text-center"
            style={{ background: '#131720', border: `1px solid ${border}33`, borderTopColor: border }}>
            <div className="text-xs mb-1" style={{ color: '#4a5568' }}>{label}</div>
            <div className="text-lg font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color }}>
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* IRP + K_PENTE */}
      <div className="px-3 pb-2 flex-shrink-0" style={{ background: '#0d0f14' }}>
        <div className="rounded-lg p-3" style={{ background: '#131720', border: '1px solid #1e2535' }}>

          {/* Titre */}
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: '#ffb74d', fontSize: 12 }}>▲</span>
            <span className="text-xs font-bold tracking-widest" style={{ color: '#4a5568' }}>IRP — INDICE RENDEMENT PENTE</span>
          </div>

          {/* Saisie site + IRP */}
          <div className="flex gap-2 mb-2">
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Nom de la pente"
              className="flex-1 rounded px-3 py-1.5 text-sm"
              style={{ background: '#0d1117', border: '1px solid #30363d', color: '#fff' }}
            />
            <input
              type="number"
              value={irp}
              onChange={(e) => setIrp(e.target.value)}
              onBlur={(e) => applyIrp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyIrp(e.target.value)}
              className="w-20 rounded px-2 py-1.5 text-center text-sm font-bold"
              style={{ background: '#0d1117', border: '1px solid #30363d', color: '#fff',
                fontFamily: "'Share Tech Mono', monospace" }}
            />
          </div>

          {/* K_PENTE slider + boutons */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold" style={{ color: kupInterp.c, fontFamily: "'Share Tech Mono', monospace" }}>
                {k_up.toFixed(2)}
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

          {/* Slider K */}
          <input type="range" min="0.75" max="1.15" step="0.01"
            value={k_up}
            onChange={(e) => setKUp(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: 'linear-gradient(90deg, #ff4b91 0%, #00d1b2 50%, #4a9eff 100%)' }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#4a5568' }}>
            <span>0.75 Aeromod</span>
            <span style={{ color: kupInterp.c, fontWeight: 700 }}>{kupInterp.t}</span>
            <span>1.15 Porteur</span>
          </div>

          {/* Liste sites */}
          {sites.length > 0 && (
            <div className="mt-2 flex flex-col gap-1 max-h-28 overflow-y-auto">
              {sites.map(s => (
                <div key={s.name}
                  className="flex items-center justify-between px-3 py-1.5 rounded cursor-pointer"
                  style={{ background: _as?.name === s.name ? '#1a2744' : '#0d1117',
                    border: `1px solid ${_as?.name === s.name ? '#1a73e8' : '#1e2535'}` }}
                  onClick={() => loadSite(s)}>
                  <span className="text-sm font-medium" style={{ color: '#e8eaf0' }}>{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold" style={{ color: '#4a9eff' }}>K {s.k.toFixed(2)}</span>
                    <span className="text-xs" style={{ color: '#8b949e' }}>IRP {s.irp}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteSite(s.name) }}
                      style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: 14 }}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commandes pilote */}
      <div className="p-3 flex-shrink-0" style={{ background: '#131720', borderTop: '1px solid #1e2535' }}>
        <div className="text-center text-xs tracking-widest mb-2" style={{ color: '#4a5568' }}>
          COMMANDES PILOTE
        </div>
        <div className="grid grid-cols-2 gap-3">

          {/* Vent */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-wider" style={{ color: '#4a9eff' }}>VENT</span>
              <span className="text-sm font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#4a9eff' }}>
                {vent.toFixed(1)} m/s
              </span>
            </div>
            <input type="range" min="4" max="15.3" step="0.1"
              value={vent}
              onChange={(e) => {
                const newVent = parseFloat(e.target.value)
                const diff = newVent - vent
                if (diff > 0) incrementParam('vent')
                else if (diff < 0) decrementParam('vent')
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #1a3a6f, #4a9eff)' }}
            />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: '#4a5568' }}>
              <span>7</span><span>10</span><span>13</span><span>15</span>
            </div>
          </div>

          {/* Offset */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold tracking-wider" style={{ color: '#ffb74d' }}>OFFSET</span>
              <span className="text-sm font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ffb74d' }}>
                {offset >= 0 ? '+' : ''}{((offset / 5000) * 100).toFixed(0)}%
              </span>
            </div>
            <input type="range" min="-500" max="500" step="42"
              value={offset}
              onChange={(e) => {
                const pct = parseFloat(e.target.value)
                const diff = pct - offset
                if (diff > 0) incrementOffset()
                else if (diff < 0) decrementOffset()
              }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: 'linear-gradient(90deg, #ff4b91, #ffb74d, #4a9eff)' }}
            />
            <div className="flex justify-between text-xs mt-0.5" style={{ color: '#4a5568' }}>
              <span>-10%</span><span style={{ color: offset === 0 ? '#00d1b2' : '#4a5568' }}>0</span><span>+10%</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
