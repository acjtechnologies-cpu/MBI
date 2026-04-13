import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useModelStore } from '../../stores/modelStore'
import Chart from 'chart.js/auto'

// ─── Poly4 coefficients (Mamba S référence) ───────────────────────────────
const A4 = -1.728e-4
const A3 =  8.178e-3
const A2 = -0.14980
const A1 =  1.34713
const A0 = -1.19522

function poly4(v) {
  return A4*v**4 + A3*v**3 + A2*v**2 + A1*v + A0
}

// Aeromod référence (courbe rose)
function aeromod(v) {
  return 0.00012*v**3 - 0.0045*v**2 + 0.18*v + 1.85
}

// Densité air relative à ISA standard (ρ/ρ0)
function densiteRelative(altM, tempC, presHpa) {
  const T = tempC + 273.15
  const T0 = 288.15
  const P = presHpa
  const P0 = 1013.25
  return (P / P0) * (T0 / T)
}

// Sites par défaut (identique à l'ancienne Poly4Page)
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
  // ── Stores partagés ──────────────────────────────────────────────────────
  const vent      = useAppStore(s => s.params?.vent ?? 8.0)
  const setParam  = useAppStore(s => s.setParam)
  const k_up      = useAppStore(s => s.k_up ?? 1.00)
  const alpha     = useAppStore(s => s.alpha ?? 1.00)
  const altitude  = useAppStore(s => s.altitude ?? 0)
  const pression  = useAppStore(s => s.params?.pression ?? 1015)
  const temperature = useAppStore(s => s.params?.temperature ?? 15)
  const activeSite  = useAppStore(s => s.activeSite)
  const setActiveSite = useAppStore(s => s.setActiveSite)
  const model     = useModelStore(s => s.model)

  // ── State local ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState('vent') // 'vent' | 'kpente'
  const [sites, setSites] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mbi_sites') || 'null')
      return saved || DEFAULT_SITES
    } catch { return DEFAULT_SITES }
  })
  const [siteIdx, setSiteIdx] = useState(() => {
    if (!activeSite?.name) return 6 // Saint Ferriol par défaut
    const idx = DEFAULT_SITES.findIndex(s => s.name === activeSite.name)
    return idx >= 0 ? idx : 6
  })
  const [newName, setNewName] = useState('')
  const [newK,    setNewK]    = useState('')
  const [newIrp,  setNewIrp]  = useState('')

  const chartRef  = useRef(null)
  const chartInst = useRef(null)

  // ── Site courant ─────────────────────────────────────────────────────────
  const currentSite = sites[siteIdx] ?? sites[6]
  const kPente = currentSite?.k ?? 1.00

  // ── Masse finale live ────────────────────────────────────────────────────
  const masseFinale = useMemo(() => {
    const rho = densiteRelative(altitude, temperature, pression)
    const offset = model?.offset ?? -144
    return poly4(vent) * alpha * k_up * rho * kPente + offset / 1000
  }, [vent, alpha, k_up, altitude, temperature, pression, kPente, model])

  // ── Sync activeSite dans appStore ────────────────────────────────────────
  useEffect(() => {
    if (currentSite && typeof setActiveSite === 'function') {
      setActiveSite({ name: currentSite.name, irp: currentSite.irp, k: currentSite.k })
    }
  }, [siteIdx, sites])

  // ── Données graphique ────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const rho = densiteRelative(altitude, temperature, pression)

    const neutre   = V_RANGE.map(v => poly4(v) * kPente)
    const adaptive = V_RANGE.map(v => poly4(v) * alpha * k_up * rho * kPente + (model?.offset ?? -144) / 1000)
    const dense    = V_RANGE.map(v => poly4(v) * 1.05 * kPente)
    const leger    = V_RANGE.map(v => poly4(v) * 0.95 * kPente)
    const aeroRef  = V_RANGE.map(v => aeromod(v))

    const massePt = poly4(vent) * alpha * k_up * rho * kPente + (model?.offset ?? -144) / 1000

    return { neutre, adaptive, dense, leger, aeroRef, massePt, rho }
  }, [vent, alpha, k_up, altitude, temperature, pression, kPente, model])

  // ── Init Chart ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return
    const ctx = chartRef.current.getContext('2d')

    chartInst.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: V_RANGE,
        datasets: [
          // 0 - Aeromod (rose)
          {
            label: 'Aeromod',
            data: chartData.aeroRef,
            borderColor: '#ff4b91',
            borderWidth: 1.8,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
            order: 6,
          },
          // 1 - P4 neutre (blanc cassé)
          {
            label: 'P4 neutre',
            data: chartData.neutre,
            borderColor: 'rgba(232,234,240,0.55)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            fill: false,
            order: 4,
          },
          // 2 - P4 adaptive (bleu — courbe principale)
          {
            label: 'P4 adapt',
            data: chartData.adaptive,
            borderColor: '#4a9eff',
            borderWidth: 3,
            pointRadius: 0,
            tension: 0.3,
            fill: { target: 1, above: 'rgba(74,158,255,0.07)', below: 'rgba(255,75,145,0.07)' },
            order: 3,
          },
          // 3 - Densité (+5% orange tirets)
          {
            label: 'Dense',
            data: chartData.dense,
            borderColor: '#ffb74d',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            tension: 0.3,
            fill: false,
            order: 5,
          },
          // 4 - Léger (-5% mauve tirets)
          {
            label: 'Léger',
            data: chartData.leger,
            borderColor: '#ce93d8',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 0,
            tension: 0.3,
            fill: false,
            order: 5,
          },
          // 5 - Point rouge (masse finale)
          {
            label: 'Finale',
            data: [{ x: vent, y: chartData.massePt }],
            type: 'scatter',
            borderColor: '#ff3d3d',
            backgroundColor: '#ff3d3d',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false,
            order: 1,
          },
          // 6 - Curseur vertical vent
          {
            label: 'Curseur',
            data: [{ x: vent, y: 2.0 }, { x: vent, y: 5.0 }],
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            order: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 80 },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'linear',
            min: 4.0,
            max: 15.5,
            grid: { color: '#1a2030' },
            ticks: {
              color: '#4a5568',
              font: { family: "'Share Tech Mono', monospace", size: 10 },
              stepSize: 2,
            },
          },
          y: {
            min: 2.0,
            max: 5.0,
            grid: { color: '#1a2030' },
            ticks: {
              color: '#4a5568',
              font: { family: "'Share Tech Mono', monospace", size: 10 },
              stepSize: 0.2,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0d1420',
            borderColor: '#1e2535',
            borderWidth: 1,
            titleFont: { family: "'Share Tech Mono', monospace", size: 11 },
            bodyFont:  { family: "'Share Tech Mono', monospace", size: 10 },
            callbacks: {
              title: c => `Vent : ${parseFloat(c[0].label || c[0].raw?.x || 0).toFixed(1)} m/s`,
              label: c => {
                const y = c.raw?.y ?? c.parsed?.y ?? 0
                return `${c.dataset.label} : ${y.toFixed(3)} kg`
              },
            },
          },
        },
      },
    })

    return () => { chartInst.current?.destroy() }
  }, [])

  // ── Update Chart quand données changent ──────────────────────────────────
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

  // ── Contrôle flèches ─────────────────────────────────────────────────────
  const handleChange = useCallback((dir) => {
    if (mode === 'vent') {
      const next = Math.max(4.0, Math.min(15.5, vent + dir * 0.5))
      setParam('vent', Math.round(next * 10) / 10)
    } else {
      const next = (siteIdx + dir + sites.length) % sites.length
      setSiteIdx(next)
    }
  }, [mode, vent, siteIdx, sites, setParam])

  // Long press
  const pressTimer = useRef(null)
  const startPress = (dir) => {
    handleChange(dir)
    pressTimer.current = setInterval(() => handleChange(dir), 120)
  }
  const stopPress = () => clearInterval(pressTimer.current)

  // ── Gestion sites ────────────────────────────────────────────────────────
  function applyManual() {
    const kVal = parseFloat(newK)
    if (isNaN(kVal)) return
    const tempSite = { name: newName || 'Manuel', irp: parseInt(newIrp) || 0, k: kVal }
    const updated = [...sites]
    updated[siteIdx] = tempSite
    // On ne sauve pas, juste applique
    setSiteIdx(siteIdx)
    if (typeof setActiveSite === 'function') setActiveSite(tempSite)
  }

  function saveSite() {
    const kVal = parseFloat(newK)
    const irpVal = parseInt(newIrp)
    if (!newName.trim() || isNaN(kVal)) return
    const entry = { name: newName.trim(), irp: isNaN(irpVal) ? 0 : irpVal, k: kVal }
    const updated = [...sites, entry]
    setSites(updated)
    localStorage.setItem('mbi_sites', JSON.stringify(updated))
    setSiteIdx(updated.length - 1)
    setNewName(''); setNewK(''); setNewIrp('')
  }

  // ── Couleur masse (vert si ok, orange si hors plage) ─────────────────────
  const masseColor = masseFinale > 4.5 ? '#ffb74d' : masseFinale < 2.5 ? '#ff4b91' : '#39d353'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0b0e12',
      color: '#c9d1d9',
      fontFamily: "-apple-system, system-ui, sans-serif",
      padding: '10px',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
        padding: '0 5px',
        marginBottom: 8,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Pente Active
          </span>
          <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#58a6ff', textTransform: 'uppercase' }}>
            {currentSite?.name ?? '—'}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#4a5568' }}>
            K {kPente.toFixed(3)} · IRP {currentSite?.irp ?? '—'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Masse de Vol
          </span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: masseColor, fontFamily: "'Share Tech Mono', monospace" }}>
            {masseFinale.toFixed(3)} kg
          </span>
          <span style={{ fontSize: '0.65rem', color: '#4a5568' }}>
            ρ {densiteRelative(altitude, temperature, pression).toFixed(3)}
          </span>
        </div>
      </div>

      {/* ── GRAPHIQUE ── */}
      <div style={{
        flex: 1,
        background: '#161b22',
        borderRadius: 12,
        border: '1px solid #21262d',
        padding: '10px 10px 6px',
        marginBottom: 10,
        minHeight: 0,
        position: 'relative',
      }}>
        {/* Légende mini */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          {[
            { color: '#ff4b91',               label: 'Aéromod' },
            { color: 'rgba(232,234,240,0.55)', label: 'P4 neutre' },
            { color: '#4a9eff',                label: 'P4 adapt' },
            { color: '#ffb74d',                label: 'Dense' },
            { color: '#ce93d8',                label: 'Léger' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 2, background: color, borderRadius: 1 }} />
              <span style={{ fontSize: '0.58rem', color: '#4a5568' }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3d3d' }} />
            <span style={{ fontSize: '0.58rem', color: '#4a5568' }}>Finale</span>
          </div>
        </div>
        <canvas ref={chartRef} style={{ display: 'block', width: '100%', height: 'calc(100% - 20px)' }} />
      </div>

      {/* ── BOTTOM UI ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 88px',
        gap: 10,
        flexShrink: 0,
      }}>
        {/* Colonne gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Onglets mode */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'vent',   label: 'Vent', val: `${vent.toFixed(1)} m/s` },
              { id: 'kpente', label: 'K Pente', val: kPente.toFixed(3) },
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => setMode(tab.id)}
                style={{
                  flex: 1,
                  background: mode === tab.id ? '#1c2128' : '#161b22',
                  border: `1px solid ${mode === tab.id ? '#58a6ff' : '#21262d'}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontSize: '0.62rem', color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                  {tab.label}
                </div>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  color: mode === tab.id ? '#58a6ff' : '#c9d1d9',
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {tab.val}
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire nouveau site */}
          <div style={{
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}>
            <input
              type="text"
              placeholder="Nom du site"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                placeholder="K"
                value={newK}
                onChange={e => setNewK(e.target.value)}
                style={{ ...inputStyle, width: 70 }}
              />
              <input
                type="number"
                placeholder="IRP"
                value={newIrp}
                onChange={e => setNewIrp(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={applyManual}
                style={{ ...btnStyle, background: '#1f6feb', flex: 1 }}
              >
                APPLIQUER
              </button>
              <button
                onClick={saveSite}
                style={{ ...btnStyle, background: '#2ea043', color: '#fff', flex: 1 }}
              >
                + SAUVER
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite — flèches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onPointerDown={() => startPress(1)}
            onPointerUp={stopPress}
            onPointerLeave={stopPress}
            style={arrowStyle}
          >
            <svg viewBox="0 0 24 24" width="42" height="42" fill="white">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
            </svg>
          </button>
          <button
            onPointerDown={() => startPress(-1)}
            onPointerUp={stopPress}
            onPointerLeave={stopPress}
            style={arrowStyle}
          >
            <svg viewBox="0 0 24 24" width="42" height="42" fill="white">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  )
}

// ── Styles réutilisables ───────────────────────────────────────────────────
const inputStyle = {
  background: '#0d1117',
  border: '1px solid #21262d',
  color: 'white',
  padding: '7px 10px',
  borderRadius: 6,
  fontSize: '0.82rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "-apple-system, system-ui, sans-serif",
}

const btnStyle = {
  border: 'none',
  padding: '9px 0',
  borderRadius: 6,
  color: 'white',
  fontSize: '0.7rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  letterSpacing: '0.5px',
}

const arrowStyle = {
  flex: 1,
  background: '#161b22',
  border: '1px solid #21262d',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  WebkitTapHighlightColor: 'transparent',
}
