import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useModelStore } from '../../stores/modelStore'
import Chart from 'chart.js/auto'

// ─── Poly4 coefficients ────────────────────────────────────────────────────
// Référence : poly4(8.0) = 3.474 kg @ alt=0m K=1.00 offset=0
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

const DEFAULT_SITES = [
  { name: 'Rognac',             irp: 260, k: 1.150 },
  { name: 'Hanstholm Danemark', irp: 225, k: 1.150 },
  { name: "Font d'Urles",       irp: 223, k: 1.150 },
  { name: 'Col du Glandon',     irp: 186, k: 1.088 },
  { name: 'Col des Faisses',    irp: 186, k: 1.088 },
  { name: 'Sceautres',          irp: 182, k: 1.064 },
  { name: 'Saint Ferriol',      irp: 171, k: 1.000 },
  { name: 'Cederon',            irp: 155, k: 0.906 },
  { name: 'Serra de Busa',      irp: 124, k: 0.850 },
]

const V_RANGE = Array.from({ length: 226 }, (_, i) => 4.0 + i * 0.05)

export default function Poly4Page() {
  // ── Stores ────────────────────────────────────────────────────────────────
  const vent          = useAppStore(s => s.params?.vent ?? 8.0)
  const setParam      = useAppStore(s => s.setParam)
  const altitude      = useAppStore(s => s.altitude ?? 0)
  const offsetStore   = useAppStore(s => s.offset ?? -144)
  const activeSite    = useAppStore(s => s.activeSite)
  const setActiveSite = useAppStore(s => s.setActiveSite)
  const model         = useModelStore(s => s.model)

  // ── State local ───────────────────────────────────────────────────────────
  const [mode, setMode]     = useState('vent')
  const [sites, setSites]   = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mbi_sites') || 'null') || DEFAULT_SITES
    } catch { return DEFAULT_SITES }
  })
  const [siteIdx, setSiteIdx] = useState(() => {
    if (!activeSite?.name) return 6
    const idx = (JSON.parse(localStorage.getItem('mbi_sites') || 'null') || DEFAULT_SITES)
      .findIndex(s => s.name === activeSite.name)
    return idx >= 0 ? idx : 6
  })
  const [newName, setNewName] = useState('')
  const [newK,    setNewK]    = useState('')
  const [newIrp,  setNewIrp]  = useState('')
  const [applied, setApplied] = useState(false)

  const chartRef   = useRef(null)
  const chartInst  = useRef(null)
  const pressTimer = useRef(null)

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const currentSite = sites[siteIdx] ?? sites[6]
  const kPente      = currentSite?.k ?? 1.00
  const rho         = useMemo(() => rhoAlt(altitude), [altitude])
  const offsetKg    = useMemo(() => (model?.offset ?? offsetStore) / 1000, [model, offsetStore])

  // ── masseFinale = poly4(vent) × rho(alt) × K_pente + offset/1000 ─────────
  const masseFinale = useMemo(() =>
    poly4(vent) * rho * kPente + offsetKg,
    [vent, rho, kPente, offsetKg]
  )

  // ── Courbes ───────────────────────────────────────────────────────────────
  const chartData = useMemo(() => ({
    aeroRef:  V_RANGE.map(v => aeromod(v)),
    neutre:   V_RANGE.map(v => poly4(v) * kPente),
    adaptive: V_RANGE.map(v => poly4(v) * rho * kPente + offsetKg),
    dense:    V_RANGE.map(v => poly4(v) * rho * 1.05 * kPente),
    leger:    V_RANGE.map(v => poly4(v) * rho * 0.95 * kPente),
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
          { label: 'P4 neutre', data: [], borderColor: 'rgba(232,234,240,0.55)',   borderWidth: 2,   pointRadius: 0, tension: 0.3, fill: false, order: 4 },
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
          y: { min: 2.0, max: 5.0,
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
    ch.data.datasets[1].data = chartData.neutre
    ch.data.datasets[2].data = chartData.adaptive
    ch.data.datasets[3].data = chartData.dense
    ch.data.datasets[4].data = chartData.leger
    ch.data.datasets[5].data = [{ x: vent, y: chartData.massePt }]
    ch.data.datasets[6].data = [{ x: vent, y: 2.0 }, { x: vent, y: 5.0 }]
    ch.update('none')
  }, [chartData, vent])

  // ── Flèches (long press) ──────────────────────────────────────────────────
  const handleChange = useCallback((dir) => {
    if (mode === 'vent') {
      const next = Math.max(4.0, Math.min(15.5, vent + dir * 0.5))
      setParam('vent', Math.round(next * 10) / 10)
    } else {
      setSiteIdx(i => (i + dir + sites.length) % sites.length)
      setApplied(false)
    }
  }, [mode, vent, sites.length, setParam])

  const startPress = (dir) => {
    handleChange(dir)
    pressTimer.current = setInterval(() => handleChange(dir), 120)
  }
  const stopPress = () => clearInterval(pressTimer.current)

  // ── APPLIQUER — double fonction ───────────────────────────────────────────
  // Si formulaire rempli (nom + K > 0) → crée + sauve site + active
  // Sinon → active le site navigué vers appStore (Pilotage en bénéficie)
  function handleApply() {
    let siteToApply = currentSite
    const kVal   = parseFloat(newK)
    const irpVal = parseInt(newIrp)

    if (newName.trim() && !isNaN(kVal) && kVal > 0) {
      const entry   = { name: newName.trim(), irp: isNaN(irpVal) ? 0 : irpVal, k: kVal }
      const updated = [...sites, entry]
      setSites(updated)
      localStorage.setItem('mbi_sites', JSON.stringify(updated))
      setSiteIdx(updated.length - 1)
      siteToApply = entry
      setNewName(''); setNewK(''); setNewIrp('')
    }

    if (typeof setActiveSite === 'function') {
      setActiveSite({ name: siteToApply.name, irp: siteToApply.irp, k: siteToApply.k })
    }
    setApplied(true)
    setTimeout(() => setApplied(false), 2500)
  }

  const masseColor = masseFinale > 4.5 ? '#ffb74d' : masseFinale < 2.5 ? '#ff4b91' : '#39d353'
  const btnLabel   = applied
    ? '✓ PENTE ACTIVÉE'
    : (newName.trim() && parseFloat(newK) > 0)
      ? '+ SAUVER & ACTIVER'
      : 'APPLIQUER'

  return (
    <div style={{
      height: 'calc(100dvh - 42px)', display: 'flex', flexDirection: 'column',
      background: '#0b0e12', color: '#c9d1d9',
      fontFamily: '-apple-system, system-ui, sans-serif',
      padding: '10px', overflow: 'hidden', boxSizing: 'border-box',
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
            { color: 'rgba(232,234,240,0.55)', label: 'P4 neutre' },
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Onglets mode */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'vent',   label: 'Vent',    val: `${vent.toFixed(1)} m/s` },
              { id: 'kpente', label: 'K Pente', val: kPente.toFixed(3) },
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
          </div>

          {/* Formulaire + bouton */}
          <div style={{
            background: '#161b22', border: '1px solid #21262d',
            borderRadius: 10, padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <input type="text" placeholder="Nom du site" value={newName}
              onChange={e => setNewName(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" placeholder="K" value={newK}
                onChange={e => setNewK(e.target.value)} style={{ ...inputStyle, width: 70 }} />
              <input type="number" placeholder="IRP" value={newIrp}
                onChange={e => setNewIrp(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

const inputStyle = {
  background: '#0d1117', border: '1px solid #21262d', color: 'white',
  padding: '7px 10px', borderRadius: 6, fontSize: '0.82rem', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}
