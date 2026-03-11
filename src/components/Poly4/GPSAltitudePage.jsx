import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'

export default function GPSAltitudePage() {
  const { params, offset, altitude, setAltitude, k_up, alpha } = useAppStore()
  const [gpsStatus, setGpsStatus] = useState('EN ATTENTE GPS')
  const [gpsColor, setGpsColor] = useState('#4a5568')
  
  const vent = params.vent
  const k_pilot = 1.0 + (offset / 5000)
  
  // Coefficients Poly4
  const A4 = -0.0001727931675766561
  const A3 =  0.008177813136456791
  const A2 = -0.1498002640832864
  const A1 =  1.3471302057227625
  const A0 = -1.1952205536365412
  
  const poly4 = (v) => A4 * Math.pow(v, 4) + A3 * Math.pow(v, 3) + A2 * Math.pow(v, 2) + A1 * v + A0
  
  // Densité relative
  const densiteRel = (alt) => {
    if (alt <= 0) return 1.0
    return Math.pow(Math.max(0, 1 - 0.0065 * alt / 288.15), 5.25588)
  }
  
  const rr = densiteRel(altitude)
  
  // Calculs masse
  const m0 = poly4(vent)                          // Réf 0m mer
  const m_off = m0 * k_pilot                      // Avec offset
  const m_fin = m_off * rr                        // Avec densité
  
  const delta_alt = (m_off * rr - m_off) * 1000   // Grammes perdus à cause altitude
  const delta_off = (m0 * k_pilot - m0) * 1000    // Grammes ajoutés par offset
  
  // Pente
  const pente = altitude > 10 ? ((m0 - m0 * rr) / (altitude / 100) * 1000).toFixed(1) : '--'
  
  // Fonction GPS
  const getGPS = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('✗ GPS NON DISPONIBLE')
      setGpsColor('#ff3d3d')
      return
    }
    
    setGpsStatus('⟳ ACQUISITION...')
    setGpsColor('#ffb74d')
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos.coords.altitude !== null) {
          const alt = Math.round(pos.coords.altitude)
          setAltitude(alt)
          setGpsStatus(`✓ GPS OK — ${alt}m · ±${Math.round(pos.coords.altitudeAccuracy || 99)}m`)
          setGpsColor('#69f0ae')
        } else {
          setGpsStatus('⚠ ALTITUDE NON REÇUE (CIEL DÉGAGÉ REQUIS)')
          setGpsColor('#ffb74d')
        }
      },
      (err) => {
        setGpsStatus('✗ ERREUR : ' + err.message)
        setGpsColor('#ff3d3d')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }
  
  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-3" style={{ background: '#0d0f14' }}>
      
      {/* Masse finale hero */}
      <div 
        className="rounded-lg p-4 border-2"
        style={{ 
          background: '#131720',
          borderColor: '#00d1b2'
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs tracking-wider mb-1" style={{ color: '#4a5568' }}>
              MASSE FINALE
            </div>
            <div 
              className="text-5xl font-bold mb-1"
              style={{ 
                fontFamily: "'Share Tech Mono', monospace",
                color: '#00d1b2'
              }}
            >
              {m_fin.toFixed(3)}
            </div>
            <div className="text-xs" style={{ color: '#4a5568' }}>kg</div>
          </div>
          
          <div className="text-right text-xs space-y-1" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
            <div>
              <span style={{ color: '#4a5568' }}>Réf. 0m mer&nbsp;&nbsp;</span>
              <span style={{ color: '#e8eaf0' }}>{m0.toFixed(3)} kg</span>
            </div>
            <div>
              <span style={{ color: '#4a5568' }}>Δ altitude&nbsp;&nbsp;&nbsp;</span>
              <span style={{ color: '#ffb74d' }}>{delta_alt.toFixed(0)} g</span>
            </div>
            <div>
              <span style={{ color: '#4a5568' }}>Δ offset&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <span style={{ color: '#00d1b2' }}>{delta_off.toFixed(0)} g</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info 3 cartes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg p-3 text-center" style={{ background: '#131720', border: '1px solid #1e2535' }}>
          <div className="text-xs mb-1" style={{ color: '#4a5568' }}>VENT</div>
          <div className="text-2xl font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#4a9eff' }}>
            {vent.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: '#4a5568' }}>m/s</div>
        </div>
        
        <div className="rounded-lg p-3 text-center" style={{ background: '#131720', border: '1px solid #1e2535' }}>
          <div className="text-xs mb-1" style={{ color: '#4a5568' }}>ALTITUDE</div>
          <div className="text-2xl font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#ffb74d' }}>
            {altitude}
          </div>
          <div className="text-xs" style={{ color: '#4a5568' }}>m</div>
        </div>
        
        <div className="rounded-lg p-3 text-center" style={{ background: '#131720', border: '1px solid #1e2535' }}>
          <div className="text-xs mb-1" style={{ color: '#4a5568' }}>ρ/ρ₀</div>
          <div className="text-2xl font-bold" style={{ fontFamily: "'Share Tech Mono', monospace", color: '#69f0ae' }}>
            {rr.toFixed(4)}
          </div>
        </div>
      </div>
      
      {/* GPS Section */}
      <div className="rounded-lg p-4" style={{ background: '#131720', border: '1px solid #1e2535' }}>
        <div className="flex items-center gap-2 mb-3" style={{ color: '#4a5568' }}>
          <span>📡</span>
          <span className="text-xs tracking-wider">ALTITUDE GPS SMARTPHONE</span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs" style={{ color: '#4a5568' }}>ALT (m)</label>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(parseInt(e.target.value) || 0)}
              className="flex-1 rounded px-3 py-2 text-center font-bold"
              style={{ 
                background: '#0d1118',
                border: '1px solid #1e2535',
                color: '#e8eaf0',
                fontFamily: "'Share Tech Mono', monospace"
              }}
            />
          </div>
          
          <button
            onClick={getGPS}
            className="rounded px-4 py-2 font-bold text-xs tracking-wider"
            style={{ 
              background: 'transparent',
              border: '1px solid #00d1b2',
              color: '#00d1b2'
            }}
          >
            GPS ▶
          </button>
        </div>
        
        <div 
          className="text-xs mb-3"
          style={{ 
            color: gpsColor,
            fontFamily: "'Share Tech Mono', monospace",
            minHeight: '20px'
          }}
        >
          {gpsStatus}
        </div>
        
        <div 
          className="rounded p-2 flex items-center justify-between"
          style={{ background: '#0d1118' }}
        >
          <span className="text-xs tracking-wider" style={{ color: '#4a5568' }}>
            CORRECTION DENSITÉ
          </span>
          <span 
            className="text-sm font-bold"
            style={{ 
              fontFamily: "'Share Tech Mono', monospace",
              color: '#ffb74d'
            }}
          >
            ρ/ρ₀ = {rr.toFixed(4)} · {pente}g/100m
          </span>
        </div>
      </div>
      
    </div>
  )
}
