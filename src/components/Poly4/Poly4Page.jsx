import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useModelStore } from '../../stores/modelStore'
import Chart from 'chart.js/auto'

// ─── Poly4 coefficients ────────────────────────────────────────────────────
// Référence : poly4(8.0) = 3.474 kg @ alt=0m K=1.00 offset=0
const P4_REF_8MS = 3.474
const A4 = -1.728e-4
const A3 =  8.178e-3
const A2 = -0.14980
const A1 =  1.34713
const A0 = -1.19522

function poly4(v) {
  return A4*v**4 + A3*v**3 + A2*v**2 + A1*v + A0
}

// Courbe Aeromod référence (rose)
function aeromod(v) {
  return 0.00012*v**3 - 0.0045*v**2 + 0.18*v + 1.85
}

// ρ/ρ0 — ISA par altitude seule
// rhoAlt(400) = 0.9543 → poly4(8) × 0.9543 = 3.312 kg ✅
function rhoAlt(altM) {
  return Math.pow(1 - 2.2557e-5 * altM, 5.2559)
}

// Fallback si fetch echoue
// K_site = irp / REF_IRP (derive, jamais stocke)
const REF_IRP = 230
const deriveK = (irp, k_v4) => k_v4 != null ? k_v4 : Math.max(0.85, Math.min(1.15, irp / REF_IRP))
const FALLBACK_SITES = [
  { name: 'Neutre', irp: 230, k_v4: 1.000 },
  { name: 'Saint Ferriol', irp: 230, k_v4: 0.913 },
  { name: 'Rognac',        irp: 290, k_v4: 0.987 },
  { name: 'Serra de Busa', irp: 140, k_v4: 1.081 },
].map(s => ({ ...s, k: deriveK(s.irp, s.k_v4) }))

const SITES_URL = import.meta.env.BASE_URL + 'planeurs/sites.json'

import { useIrpStore } from '../../stores/irpStore'
import { db } from '../Chrono/ChronoPage'
import { useESPStore } from '../../stores/espStore'

const V_RANGE = Array.from({ length: 226 }, (_, i) => 4.0 + i * 0.05)

export default function Poly4Page({ onNavigate } = {}) {
  // ── Stores ────────────────────────────────────────────────────────────────
  const vent          = useAppStore(s => s.params?.vent ?? 8.0)
  const setParam      = useAppStore(s => s.setParam)
  const setOffset     = useAppStore(s => s.setOffset)
  const altitude      = useAppStore(s => s.altitude ?? 0)
  const offsetStore   = useAppStore(s => s.offset ?? -144)
  const irpK          = useIrpStore(s => s.kActuel)
  const irpConfidence = useIrpStore(s => s.confidence)
  const setSiteRef    = useIrpStore(s => s.setSiteRef)
  const irpVal        = useIrpStore(s => s.irp)
  const irpTrend      = useIrpStore(s => s.trend)
  const deltaPerf     = useIrpStore(s => s.deltaPerf)
  const irpNbRuns     = useIrpStore(s => s.nbRuns)
  const espQ          = useESPStore(s => s.q)
  const espIrpx       = useESPStore(s => s.irpx)
  const espConnected  = useESPStore(s => s.connected)
  const activeSite    = useAppStore(s => s.activeSite)
  const setActiveSite = useAppStore(s => s.setActiveSite)
  const model         = useModelStore(s => s.models?.[s.activeModelId] ?? null)

  // ── State local ───────────────────────────────────────────────────────────
  const mode            = useAppStore(s => s.poly4Mode ?? 'vent')
  const setMode         = useAppStore(s => s.setPoly4Mode)
  const [sites, setSites]   = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mbi_sites_v5') || 'null') || FALLBACK_SITES
    } catch { return DEFAULT_SITES }
  })
  const siteIdxRaw      = useAppStore(s => s.poly4SiteIdx)
  const setSiteIdx      = useAppStore(s => s.setPoly4SiteIdx)
  const siteIdx = siteIdxRaw ?? (() => {
    if (!activeSite?.name) return 6
    const idx = (JSON.parse(localStorage.getItem('mbi_sites') || 'null') || DEFAULT_SITES)
      .findIndex(s => s.name === activeSite.name)
    return idx >= 0 ? idx : 6
  })()
  // IRP LIVE values read from irpStore (fed by ChronoPage)
  const [applied, setApplied] = useState(false)

  const chartRef   = useRef(null)
  const chartInst  = useRef(null)
  const pressTimer = useRef(null)

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const allSites = sites
  const currentSite = allSites[siteIdx] ?? allSites[Math.min(6, allSites.length - 1)]
  const kPente      = currentSite?.k_v4 ?? currentSite?.k ?? 1.00
  const rho         = useMemo(() => rhoAlt(altitude), [altitude])
  const offsetADN   = (model?.masse_ref_8ms || P4_REF_8MS) - P4_REF_8MS
  const offsetTerrain = offsetStore / 1000
  const offsetKg    = offsetADN + offsetTerrain

  // ── Charge ajustements K depuis Dexie ──────────────────────────────────────
  useEffect(() => {
    db.sites_k.toArray().then(rows => {
      if (!rows.length) return
      setSites(prev => prev.map(s => {
        const row = rows.find(r => r.name === s.name)
        return row ? { ...s, k: row.k_v4, k_v4: row.k_v4 } : s
      }))
    }).catch(() => {})
  }, [])
  // ── Fetch sites.json on mount ──
  useEffect(() => {
    fetch(SITES_URL)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.sites?.length) {
          const fetched = data.sites.map(s => ({ name: s.name, irp: s.irp, k_v4: s.k_v4 ?? null, k: deriveK(s.irp, s.k_v4) }))
          setSites(fetched)
          localStorage.setItem('mbi_sites_v5', JSON.stringify(fetched))
        }
      })
      .catch(() => {})  // offline: use cache
  }, [])

  // ── masseFinale = poly4(vent) × rho(alt) × K_pente + offset/1000 ─────────
  const masseFinale = useMemo(() =>
    poly4(vent) * rho * kPente + offsetKg,
    [vent, rho, kPente, offsetKg]
  )

  // ── Courbes ───────────────────────────────────────────────────────────────
  const chartData = useMemo(() => ({
    aeroRef:  V_RANGE.map(v => aeromod(v)),
    adaptive: V_RANGE.map(v => poly4(v) * rho * kPente + offsetADN),
    dense:    V_RANGE.map(v => poly4(v) * rho * 1.05 * kPente + offsetADN),
    leger:    V_RANGE.map(v => poly4(v) * rho * 0.95 * kPente + offsetADN),
    massePt:  poly4(vent) * rho * kPente + offsetKg,
  }), [vent, rho, kPente, offsetKg])

  // ── Init Chart ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return
    const ctx = chartRef.current.getContext('2d')
    chartInst.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: V_RANGE,
        datasets: [
          { label: 'Aéromod',   data: [], borderColor: '#ff4b91',                  borderWidth: 1.8, pointRadius: 0, tension: 0.1, fill: false, order: 6 },
          
          { label: 'P4 adapt',  data: [], borderColor: '#4a9eff',                  borderWidth: 3,   pointRadius: 0, tension: 0.3,
            fill: { target: 1, above: 'rgba(74,158,255,0.07)', below: 'rgba(255,75,145,0.07)' }, order: 3 },
          { label: 'Dense',     data: [], borderColor: '#ffb74d',                  borderWidth: 1.5, pointRadius: 0, tension: 0.3, borderDash: [5,4], fill: false, order: 5 },
          { label: 'Léger',     data: [], borderColor: '#ce93d8',                  borderWidth: 1.5, pointRadius: 0, tension: 0.3, borderDash: [5,4], fill: false, order: 5 },
          { label: 'Finale',    data: [], type: 'scatter',
            borderColor: '#ff3d3d', backgroundColor: '#ff3d3d',
            pointRadius: 8, pointHoverRadius: 10, showLine: false, order: 1 },
          { label: 'Curseur',   data: [],
            borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderDash: [3,3], pointRadius: 0, order: 7 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 80 },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: { type: 'linear', min: 4.0, max: 15.5,
               grid: { color: '#1a2030' },
               ticks: { color: '#4a5568', font: { family: 'monospace', size: 10 }, stepSize: 2 } },
          y: { min: 2.2, max: 4.5,
               grid: { color: '#1a2030' },
               ticks: { color: '#4a5568', font: { family: 'monospace', size: 10 }, stepSize: 0.2 } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d1420', borderColor: '#1e2535', borderWidth: 1,
            callbacks: {
              title: c => `Vent : ${parseFloat(c[0].label || c[0].raw?.x || 0).toFixed(1)} m/s`,
              label: c => `${c.dataset.label} : ${(c.raw?.y ?? c.parsed?.y ?? 0).toFixed(3)} kg`,
            },
          },
        },
      },
    })
    return () => chartInst.current?.destroy()
  }, [])

  // ── Update Chart ──────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = chartInst.current
    if (!ch) return
    ch.data.datasets[0].data = chartData.aeroRef
    ch.data.datasets[1].data = chartData.adaptive
    ch.data.datasets[2].data = chartData.dense
    ch.data.datasets[3].data = chartData.leger
    ch.data.datasets[4].data = [{ x: vent, y: chartData.massePt }]
    ch.data.datasets[5].data = [{ x: vent, y: 2.0 }, { x: vent, y: 5.0 }]
    ch.update('none')
  }, [chartData, vent])

  // ── Flèches (long press) ──────────────────────────────────────────────────
  const handleChange = useCallback((dir) => {
    if (mode === 'vent') {
      const next = Math.max(4.0, Math.min(15.5, vent + dir * 0.5))
      setParam('vent', Math.round(next * 10) / 10)
    } else if (mode === 'offset') {
      const next42 = offsetStore + dir * 42; const nextOff = (offsetStore !== 0 && Math.sign(next42) !== Math.sign(offsetStore)) ? 0 : Math.max(-500, Math.min(500, next42)); setOffset(nextOff)
    } else {
      const nextIdx = (siteIdx + dir + allSites.length) % allSites.length
      setSiteIdx(nextIdx)
      setApplied(false)

    }
  }, [mode, vent, sites, allSites, siteIdx, setParam, offsetStore, setOffset, setActiveSite, setSiteRef, currentSite, setSites])

  const adjustK = (dir) => {
    const cur = currentSite?.k_v4 ?? currentSite?.k ?? 1.0
    const next = Math.round(Math.max(0.7, Math.min(1.3, cur + dir * 0.005)) * 1000) / 1000
    const updated = sites.map(s => s.name === currentSite?.name ? { ...s, k: next, k_v4: next } : s)
    setSites(updated)
    localStorage.setItem('mbi_sites_v5', JSON.stringify(updated))
    db.sites_k.put({ name: currentSite.name, k_v4: next, updated: Date.now() }).catch(() => {})
    setActiveSite({ ...currentSite, k: next, k_v4: next })
  }
  const startPress = (dir) => {
    handleChange(dir)
    pressTimer.current = setInterval(() => handleChange(dir), 120)
  }
  const stopPress = () => clearInterval(pressTimer.current)

  // ── APPLIQUER — double fonction ───────────────────────────────────────────
  // Si formulaire rempli (nom + K > 0) → crée + sauve site + active
  // Sinon → active le site navigué vers appStore (Pilotage en bénéficie)
  function handleApply() {
    const site = currentSite
    if (typeof setActiveSite === 'function' && site) {
      setActiveSite({ name: site.name, irp: site.irp, k: site.k, k_v4: site.k_v4 ?? null })
      if (!site.live) setSiteRef(site.irp, site.name)
    }
    setApplied(true)
    setTimeout(() => {
      setApplied(false)
      if (typeof onNavigate === 'function') onNavigate('pilote')
    }, 800)
  }

  const masseColor = masseFinale > 4.5 ? '#ffb74d' : masseFinale < 2.5 ? '#ff4b91' : '#39d353'
  const btnLabel   = applied ? '✓ PENTE ACTIVÉE' : 'APPLIQUER'

  return (
    <div style={{
     height: '100%', display: 'flex', flexDirection: 'column', touchAction: 'manipulation',
background: '#0b0e12', color: '#c9d1d9',
fontFamily: '-apple-system, system-ui, sans-serif',
padding: '10px', overflowY: 'auto', boxSizing: 'border-box',
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: 60, padding: '0 5px', marginBottom: 8, flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Pente Active
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: applied ? '#39d353' : '#58a6ff', textTransform: 'uppercase', transition: 'color 0.3s' }}>
            {currentSite?.name ?? '—'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#4a5568' }}>
            K {kPente.toFixed(3)} · IRP {currentSite?.irp ?? '—'}
            {applied && <span style={{ color: '#39d353', marginLeft: 8 }}>✓ ACTIVÉ</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Masse de Vol
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: masseColor, fontFamily: 'monospace' }}>
            {masseFinale.toFixed(3)} kg
          </div>
          <div style={{ fontSize: '0.65rem', color: '#4a5568' }}>
            ρ {rho.toFixed(3)} · {altitude}m · off {(offsetKg*1000).toFixed(0)}g
          </div>
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{
        flex: 1, background: '#161b22', borderRadius: 12,
        border: '1px solid #21262d', padding: '8px 10px 6px',
        marginBottom: 10, minHeight: 0,
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          {[
            { color: '#ff4b91',                label: 'Aéromod' },
            
            { color: '#4a9eff',                label: 'P4 adapt' },
            { color: '#ffb74d',                label: 'Dense' },
            { color: '#ce93d8',                label: 'Léger' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 14, height: 2, background: color, borderRadius: 1 }} />
              <span style={{ fontSize: '0.58rem', color: '#4a5568' }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3d3d' }} />
            <span style={{ fontSize: '0.58rem', color: '#4a5568' }}>Finale</span>
          </div>
        </div>
        <canvas ref={chartRef} style={{ display: 'block', width: '100%', height: 'calc(100% - 22px)' }} />
      </div>

      {/* BOTTOM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', touchAction: 'manipulation', gap: 8 }}>

          {/* Onglets mode */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'vent',   label: 'Vent',   val: `${vent.toFixed(1)} m/s` },
              { id: 'offset', label: 'Offset', val: (offsetStore >= 0 ? '+' : '') + offsetStore + 'g' },
            ].map(tab => (
              <div key={tab.id} onClick={() => setMode(tab.id)} style={{
                flex: 1, cursor: 'pointer', borderRadius: 10, padding: '10px 12px',
                background: mode === tab.id ? '#1c2128' : '#161b22',
                border: `1px solid ${mode === tab.id ? '#58a6ff' : '#21262d'}`,
                transition: 'border-color 0.15s',
              }}>
                <div style={{ fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                  {tab.label}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'monospace',
                  color: mode === tab.id ? '#58a6ff' : '#c9d1d9' }}>
                  {tab.val}
                </div>
              </div>
            ))}
            {/* Tuile K PENTE avec boutons - + */}
            <div onClick={() => setMode('site')} style={{
              flex: 1, borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
              background: mode === 'site' ? '#1c2128' : '#161b22',
              border: `1px solid ${mode === 'site' ? '#58a6ff' : '#21262d'}`,
            }}>
              <div style={{ fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                K Pente
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onPointerDown={() => adjustK(-1)} style={{
                  background: '#21262d', border: 'none', color: '#c9d1d9', borderRadius: 4,
                  width: 22, height: 22, fontSize: 14, cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>−</button>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace',
                  color: '#58a6ff', flex: 1, textAlign: 'center' }}>
                  {kPente.toFixed(3)}
                </div>
                <button onPointerDown={() => adjustK(1)} style={{
                  background: '#21262d', border: 'none', color: '#c9d1d9', borderRadius: 4,
                  width: 22, height: 22, fontSize: 14, cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>+</button>
              </div>
            </div>
          </div>

          {/* Formulaire + bouton */}
          <div style={{
            background: '#161b22', border: '1px solid #21262d',
            borderRadius: 10, padding: '10px 12px',
            display: 'flex', flexDirection: 'column', touchAction: 'manipulation', gap: 6,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0' }}>
              <div style={{ fontSize:11, color:'#8b949e', fontWeight:600 }}>{currentSite?.name || 'Aucune pente'}</div>

            </div>

            {espConnected && espIrpx !== null && (
              <div style={{ display:'flex', gap:12, padding:'6px 0', borderTop:'1px solid #1e2535', marginTop:2 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:'#4a5568', fontWeight:600 }}>IRPX</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#00d1b2' }}>{espIrpx.toFixed(2)}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:'#4a5568', fontWeight:600 }}>q</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#00d1b2' }}>{espQ} Pa</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:'#4a5568', fontWeight:600 }}>IQA</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#00d1b2' }}>{(useESPStore.getState().data?.IQA || 0).toFixed(1)}</div>
                </div>
              </div>
            )}
            <button onClick={handleApply} style={{
              border: 'none', padding: '11px 0', borderRadius: 6, width: '100%',
              color: 'white', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer',
              letterSpacing: '0.5px', transition: 'background 0.3s',
              background: applied ? '#2ea043' : '#1f6feb',
            }}>
              {btnLabel}
            </button>
          </div>
        </div>

        {/* Flèches */}
        <div style={{ display: 'flex', flexDirection: 'column', touchAction: 'manipulation', gap: 10 }}>
          {[1, -1].map(dir => (
            <button key={dir}
              onPointerDown={() => startPress(dir)} onPointerUp={stopPress} onPointerLeave={stopPress}
              style={{ flex: 1, background: '#161b22', border: '1px solid #21262d', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0, WebkitTapHighlightColor: 'transparent' }}>
              <svg viewBox="0 0 24 24" width="42" height="42" fill="white">
                <path d={dir === 1
                  ? 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z'
                  : 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z'} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

