import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { useAppStore } from '../../stores/appStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'

Chart.register(...registerables)

export default function Poly4Canvas() {
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
    setAlpha
  } = useAppStore()
  
  const vent = params.vent
  
  // Conversion Offset (g) ↔ k_pilot
  const k_pilot = 1.0 + (offset / 5000)
  
  // Coefficients Poly4 réels (issus des données terrain)
  const A4 = -0.0001727931675766561
  const A3 =  0.008177813136456791
  const A2 = -0.1498002640832864
  const A1 =  1.3471302057227625
  const A0 = -1.1952205536365412
  
  // Génération de la plage de vent
  const vents = Array.from({length: 226}, (_, i) => 4.0 + i * 0.05)
  
  // Fonctions de calcul
  const poly4 = (v) => {
    return A4 * Math.pow(v, 4) + A3 * Math.pow(v, 3) + A2 * Math.pow(v, 2) + A1 * v + A0
  }
  
  const aeromod = (v) => {
    return Math.max(0, 0.1 * v + 1.95)
  }
  
  const adaptatif = (v) => {
    const result = poly4(v) * alpha * k_up * k_pilot
    return Math.max(0, Math.min(8, result))
  }
  
  // Interprétation k_up
  const getKupInterpretation = (kup) => {
    if (kup <= 0.95) return { text: '💤 Pente très molle — sous-lestage marqué', bg: '#1a237e', col: '#90caf9' }
    if (kup <= 0.97) return { text: '↘️ Pente molle — légèrement sous P4', bg: '#1a2a4a', col: '#90caf9' }
    if (kup >= 0.99 && kup <= 1.01) return { text: '⚖️ Neutre — P4 pur sans correction', bg: '#1b5e20', col: '#a5d6a7' }
    if (kup <= 1.03) return { text: '↗️ Pente porte fort — légèrement au-dessus P4', bg: '#4a2800', col: '#ffcc80' }
    return { text: '🚀 Très dynamique — sur-lestage assumé', bg: '#5d1a00', col: '#ff8a65' }
  }
  
  const kupInterp = getKupInterpretation(k_up)
  
  // Calculs des résultats pour le vent actuel
  const resAeromod = aeromod(vent)
  const resPoly4 = poly4(vent)
  const resAdapt = adaptatif(vent)
  const resDelta = resPoly4 - resAeromod
  
  // Initialiser Chart.js
  useEffect(() => {
    if (!chartRef.current) return
    
    const ctx = chartRef.current.getContext('2d')
    
    // Détruire l'ancien chart si existant
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: vents,
        datasets: [
          {
            label: 'Ref. Aeromod',
            data: vents.map(aeromod),
            borderColor: '#ffb74d',
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
          },
          {
            label: 'Poly4 brut',
            data: vents.map(poly4),
            borderColor: '#a5d6a7',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.3
          },
          {
            label: 'Poly4 Adaptatif',
            data: vents.map(adaptatif),
            borderColor: '#ce93d8',
            borderWidth: 3,
            borderDash: [4, 2],
            pointRadius: 0,
            tension: 0.3
          },
          // ❌ POINTS TERRAIN SUPPRIMÉS
          {
            label: 'Vent sélectionné',
            data: vents.map(v => Math.abs(v - vent) < 0.07 ? 4.5 : null), // ← Ajusté à 4.5
            borderColor: 'rgba(255,255,255,0.25)',
            borderWidth: 1.5,
            borderDash: [3, 3],
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 120 },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Vent (m/s)', color: '#888' },
            grid: { color: '#1e2a44' },
            ticks: { color: '#666', stepSize: 2 },
            min: 4.0,
            max: 15.5
          },
          y: {
            title: { display: true, text: 'Masse (kg)', color: '#888' },
            grid: { color: '#1e2a44' },
            ticks: { color: '#666' },
            min: 1.5,
            max: 4.5  // ✅ Optimisé à 4.5 kg
          }
        },
        plugins: {
          legend: { 
            labels: { 
              color: '#bbb', 
              font: { size: 11 }, 
              boxWidth: 22 
            } 
          },
          tooltip: {
            backgroundColor: '#0f1b35',
            borderColor: '#333',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw?.y ?? ctx.raw
                return `${ctx.dataset.label}: ${parseFloat(v).toFixed(3)} kg`
              },
              title: (ctx) => `Vent : ${parseFloat(ctx[0].label ?? ctx[0].raw?.x ?? 0).toFixed(1)} m/s`
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
  }, [])
  
  // Mettre à jour le chart quand les paramètres changent
  useEffect(() => {
    if (!chartInstance.current) return
    
    chartInstance.current.data.datasets[0].data = vents.map(aeromod)
    chartInstance.current.data.datasets[1].data = vents.map(poly4)
    chartInstance.current.data.datasets[2].data = vents.map(adaptatif)
    chartInstance.current.data.datasets[3].data = vents.map(v => Math.abs(v - vent) < 0.07 ? 4.5 : null) // ← Index 3 maintenant (sans points terrain)
    chartInstance.current.update('none')
  }, [vent, k_up, alpha, offset])
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-2">
        <h1 className="text-base font-bold text-blue-400 text-center mb-1">🏄 Poly4 Adaptatif F3F</h1>
        <p className="text-xs text-gray-500 text-center">
          Plage valide : 4.05 → 15.30 m/s
        </p>
      </div>
      
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Graphique */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="h-64">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
        
        {/* Résultats - HAUTEUR RÉDUITE PAR 3 */}
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-gray-800 rounded p-2 border-t-2" style={{ borderColor: '#ffb74d' }}>
            <div className="text-xs text-gray-400">Aeromod</div>
            <div className="text-lg font-bold" style={{ color: '#ffb74d' }}>
              {resAeromod.toFixed(3)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded p-2 border-t-2" style={{ borderColor: '#a5d6a7' }}>
            <div className="text-xs text-gray-400">Poly4 brut</div>
            <div className="text-lg font-bold" style={{ color: '#a5d6a7' }}>
              {Math.max(0, resPoly4).toFixed(3)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded p-2 border-t-2" style={{ borderColor: '#ce93d8' }}>
            <div className="text-xs text-gray-400">Adaptatif</div>
            <div className="text-lg font-bold" style={{ color: '#ce93d8' }}>
              {resAdapt.toFixed(3)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded p-2 border-t-2 border-blue-500">
            <div className="text-xs text-gray-400">Δ P4 vs Aero</div>
            <div 
              className="text-lg font-bold"
              style={{ 
                color: resDelta > 0.05 ? '#ce93d8' : resDelta < -0.05 ? '#f48fb1' : '#4fc3f7' 
              }}
            >
              {(resDelta >= 0 ? '+' : '')}{resDelta.toFixed(3)}
            </div>
          </div>
        </div>
        
        {/* k_up - Portance terrain */}
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#ce93d8' }}>
            🌬️ k_up — Portance terrain
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs text-gray-500 text-center w-12">
              molle
            </div>
            <input
              type="range"
              min="0.95"
              max="1.05"
              step="0.01"
              value={k_up}
              onChange={(e) => setKUp(parseFloat(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#ce93d8' }}
            />
            <div className="text-xs text-gray-500 text-center w-12">
              fort
            </div>
            <div className="text-lg font-bold min-w-14 text-center" style={{ color: '#ce93d8' }}>
              {k_up.toFixed(2)}
            </div>
          </div>
          
          <div 
            className="text-center text-xs py-1 px-2 rounded font-semibold"
            style={{ 
              backgroundColor: kupInterp.bg,
              color: kupInterp.col
            }}
          >
            {kupInterp.text}
          </div>
        </div>
        
        {/* alpha - Rendement historique */}
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <h4 className="text-sm font-semibold mb-2" style={{ color: '#a5d6a7' }}>
            📈 α — Rendement historique
          </h4>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">0.85</span>
            <input
              type="range"
              min="0.85"
              max="1.15"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#a5d6a7' }}
            />
            <span className="text-xs text-gray-500">1.15</span>
            <div className="text-lg font-bold min-w-14 text-center" style={{ color: '#a5d6a7' }}>
              {alpha.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* ❌ COEFFICIENTS POLY4 MASQUÉS */}
        {/* ❌ FORMULES MASQUÉES */}
      </div>
      
      {/* Footer - Commandes partagées */}
      <div className="bg-gray-900 border-t border-gray-700 p-3 space-y-2">
        <div className="text-sm font-semibold text-blue-400 mb-1">
          🎯 COMMANDES PARTAGÉES
        </div>
        
        {/* Vent */}
        <div>
          <div className="text-xs text-gray-400 mb-1">Vent mesure</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => decrementParam('vent')}
              className="bg-gray-800 hover:bg-gray-700 p-2 rounded"
            >
              <ChevronLeft size={18} />
            </button>
            
            <input
              type="range"
              min="4.05"
              max="15.30"
              step="0.25"
              value={vent}
              onChange={(e) => {
                const newVent = parseFloat(e.target.value)
                const diff = newVent - vent
                if (diff > 0) incrementParam('vent')
                else if (diff < 0) decrementParam('vent')
              }}
              className="flex-1"
              style={{ accentColor: '#4fc3f7' }}
            />
            
            <button
              onClick={() => incrementParam('vent')}
              className="bg-gray-800 hover:bg-gray-700 p-2 rounded"
            >
              <ChevronRight size={18} />
            </button>
            
            <div className="text-lg font-bold text-blue-400 min-w-16 text-center">
              {vent.toFixed(1)}
              <span className="text-xs text-gray-500 ml-1">m/s</span>
            </div>
          </div>
        </div>
        
        {/* k_pilot (Offset) */}
        <div>
          <div className="text-xs text-gray-400 mb-1">
            k_pilot (Offset : {offset}g)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">0.90</span>
            <input
              type="range"
              min="0.90"
              max="1.10"
              step="0.01"
              value={k_pilot}
              onChange={(e) => {
                const newKPilot = parseFloat(e.target.value)
                const newOffset = Math.round((newKPilot - 1.0) * 5000)
                const diff = newOffset - offset
                if (diff > 0) incrementOffset()
                else if (diff < 0) decrementOffset()
              }}
              className="flex-1"
              style={{ accentColor: '#f48fb1' }}
            />
            <span className="text-xs text-gray-500">1.10</span>
            <div className="text-lg font-bold min-w-16 text-center" style={{ color: '#f48fb1' }}>
              {k_pilot.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
