import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useSlopeStore } from '../../stores/SlopeStore'
import { useESPStore } from '../../stores/espStore'

// ── Météo F3F — grille horaire 10h-17h, sélecteur J0/J+1 (4 sept) ─────────
// Pipeline validé : RC-Slopes (orientation) → AROME HD (V+direction) →
// Δ/Veff → statut. Ordre d'évaluation par cellule :
//   1) V < 3 ou V > 25 m/s  -> NON AUTORISÉ (hors limites FAI)
//   2) Δ > 45°              -> INUTILISABLE (pente hors secteur exploitable)
//   3) sinon barème Veff (m/s) : <6 Faible, 6-8 Moyenne, 8-12 Bonne,
//      12-18 Excellente, >18 Forte (alerte vent fort, pas un "mieux")
// Badge Pioupiou : coexiste à côté d'AROME uniquement sur la cellule de
// l'heure courante, et uniquement quand le jour affiché est J0 (Pioupiou
// est une mesure live, indisponible pour un jour futur).

const HOURS = [10, 11, 12, 13, 14, 15, 16, 17]

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Statut d'une cellule horaire. windSpeed en m/s, delta en degrés (écart
// angulaire vent/orientation pente) ou null si orientation du site inconnue.
function computeStatus(windSpeed, delta) {
  if (windSpeed == null) return { label: '—', color: '#444', veff: null }
  if (windSpeed < 3 || windSpeed > 25) return { label: 'Non autorisé', color: '#f85149', veff: null }
  if (delta != null && delta > 45) return { label: 'Inutilisable', color: '#f85149', veff: null }
  const veff = delta != null ? windSpeed * Math.cos(delta * Math.PI / 180) : windSpeed
  if (veff < 6)  return { label: 'Faible',     color: '#f0a500', veff }
  if (veff < 8)  return { label: 'Moyenne',    color: '#eab308', veff }
  if (veff < 12) return { label: 'Bonne',      color: '#3fb950', veff }
  if (veff < 18) return { label: 'Excellente', color: '#22c55e', veff }
  return              { label: 'Forte',        color: '#f0a500', veff } // alerte vent fort, pas "mieux qu'excellente"
}

// ── Rose des vents multi-sources (4 sept) ─────────────────────────────────
// Superpose ESP live (vert) / AROME prévision heure sélectionnée (bleu) /
// Pioupiou live (orange) sur un même cadran Nord absolu, avec le secteur
// efficace de la pente en surbrillance (±45°, cohérent avec la garde Δ>45°
// du barème). L'ESP mesure un écart calé perpendiculaire à la pente au
// démarrage de la station (PAS un cap compas absolu) -- conversion :
// capAbsolu = (orientationPente + d.ANG + 360) % 360. Cette même conversion
// donne directement Δ_ESP = d.ANG, sans recalcul.
const ROSE_R = 108
const ROSE_CX = 140
const ROSE_CY = 140
const ROSE_MAX_SPEED = 25 // m/s, echelle de reference commune aux 3 sources (borne FAI max)
const COMPASS_16 = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']

function polar(angleDeg, radius, cx = ROSE_CX, cy = ROSE_CY) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + radius * Math.sin(rad), y: cy - radius * Math.cos(rad) }
}

function RoseArrow({ angleDeg, speed, color }) {
  if (angleDeg == null || speed == null) return null
  const tailR = 52 // juste au bord du cercle central (r=54)
  const tipMinR = 88 // longueur minimale visible meme a vent tres faible
  const tipMaxR = ROSE_R - 3
  const r = tipMinR + Math.min(speed / ROSE_MAX_SPEED, 1) * (tipMaxR - tipMinR)
  const tip = polar(angleDeg, r)
  const tail = polar(angleDeg, tailR)
  const barbLen = 11
  const leftBarb = polar(angleDeg + 154, barbLen, tip.x, tip.y)
  const rightBarb = polar(angleDeg - 154, barbLen, tip.x, tip.y)
  return (
    <g>
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <polygon points={`${tip.x},${tip.y} ${leftBarb.x},${leftBarb.y} ${rightBarb.x},${rightBarb.y}`} fill={color} />
    </g>
  )
}

// Source prioritaire affichee au centre du cadran : ESP live si connecte,
// sinon AROME de l'heure selectionnee (Pioupiou reste secondaire, live only)
function primaryReading(esp, arome) {
  if (esp?.hasData && esp.speed != null) return { speed: esp.speed, dir: esp.angleAbs, label: 'ESP' }
  if (arome?.windSpeed != null) return { speed: arome.windSpeed, dir: arome.windDir, label: 'AROME' }
  return null
}

function WindRose({ siteName, siteOrientDeg, arome, pioupiou, esp, deltaEsp }) {
  const sectorPath = (() => {
    if (siteOrientDeg == null) return null
    const a1 = polar(siteOrientDeg - 45, ROSE_R)
    const a2 = polar(siteOrientDeg + 45, ROSE_R)
    return `M ${ROSE_CX} ${ROSE_CY} L ${a1.x} ${a1.y} A ${ROSE_R} ${ROSE_R} 0 0 1 ${a2.x} ${a2.y} Z`
  })()
  const penteMark = siteOrientDeg != null ? polar(siteOrientDeg, ROSE_R + 14) : null
  const primary = primaryReading(esp, arome)

  return (
    <div style={{ padding: '12px 8px', borderRadius: 10, background: 'rgba(13,17,23,0.55)', border: '1px solid #30363d' }}>
      {siteName && (
        <div style={{ fontSize: 18, fontWeight: 900, color: '#58a6ff', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 }}>
          {siteName}
        </div>
      )}
      <svg viewBox="0 0 280 280" width="100%" style={{ maxWidth: 300, display: 'block', margin: '0 auto' }}>
        {sectorPath && <path d={sectorPath} fill="rgba(88,166,255,0.16)" stroke="none" />}
        <circle cx={ROSE_CX} cy={ROSE_CY} r={ROSE_R} fill="none" stroke="#1e2530" strokeWidth={1.5} />
        <circle cx={ROSE_CX} cy={ROSE_CY} r={ROSE_R * 0.66} fill="none" stroke="#1e2530" strokeWidth={1} />
        <circle cx={ROSE_CX} cy={ROSE_CY} r={ROSE_R * 0.33} fill="none" stroke="#1e2530" strokeWidth={1} />
        {COMPASS_16.map((lbl, i) => {
          const ang = i * 22.5
          const major = i % 4 === 0
          const p = polar(ang, ROSE_R + (major ? 20 : 14))
          return (
            <text key={lbl} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fill={major ? '#fff' : '#8b949e'} fontSize={major ? 13 : 9} fontWeight={major ? 800 : 400}>
              {lbl}
            </text>
          )
        })}
        {penteMark && (
          <polygon points={`${penteMark.x},${penteMark.y - 5} ${penteMark.x - 5},${penteMark.y + 5} ${penteMark.x + 5},${penteMark.y + 5}`}
            fill="#8b949e" transform={`rotate(${siteOrientDeg}, ${penteMark.x}, ${penteMark.y})`} />
        )}
        <RoseArrow angleDeg={arome?.windDir} speed={arome?.windSpeed} color="#58a6ff" />
        <RoseArrow angleDeg={pioupiou?.windHeading} speed={pioupiou?.windSpeed} color="#f0a500" />
        {esp?.hasData && <RoseArrow angleDeg={esp.angleAbs} speed={esp.speed} color="#3fb950" />}

        <circle cx={ROSE_CX} cy={ROSE_CY} r={54} fill="#0d1117" stroke="#30363d" strokeWidth={1.5} />
        {primary ? (
          <>
            <text x={ROSE_CX} y={ROSE_CY - 8} textAnchor="middle" fontSize={32} fontWeight={900} fill="#fff">
              {primary.speed.toFixed(1)}
            </text>
            <text x={ROSE_CX} y={ROSE_CY + 12} textAnchor="middle" fontSize={11} fill="#8b949e" fontWeight={700}>
              m/s {primary.label}
            </text>
            {primary.dir != null && (
              <text x={ROSE_CX} y={ROSE_CY + 27} textAnchor="middle" fontSize={11} fill="#8b949e">
                {primary.dir.toFixed(0)}°
              </text>
            )}
          </>
        ) : (
          <text x={ROSE_CX} y={ROSE_CY + 5} textAnchor="middle" fontSize={12} fill="#444">—</text>
        )}
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
        {esp?.hasData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#0d1117', borderRadius: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3fb950', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontWeight: 700, flex: 1 }}>ESP live</span>
            <span style={{ color: '#8b949e' }}>{esp.speed?.toFixed(1)} m/s · Δ {deltaEsp != null ? `${deltaEsp >= 0 ? '+' : ''}${deltaEsp.toFixed(0)}°` : '—'}</span>
          </div>
        )}
        {arome?.windSpeed != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#0d1117', borderRadius: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#58a6ff', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontWeight: 700, flex: 1 }}>AROME {arome.hour}h</span>
            <span style={{ color: '#8b949e' }}>{arome.windSpeed.toFixed(1)} m/s · {arome.windDir?.toFixed(0)}°</span>
          </div>
        )}
        {pioupiou?.windSpeed != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#0d1117', borderRadius: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f0a500', flexShrink: 0 }} />
            <span style={{ color: '#fff', fontWeight: 700, flex: 1 }}>Pioupiou</span>
            <span style={{ color: '#8b949e' }}>{pioupiou.windSpeed.toFixed(1)} m/s · {pioupiou.windHeading?.toFixed(0)}°</span>
          </div>
        )}
        {siteOrientDeg != null && (
          <div style={{ fontSize: 9, color: '#444', textAlign: 'center', marginTop: 2 }}>Secteur efficace pente ±45°</div>
        )}
      </div>
    </div>
  )
}

export default function MeteoF3F() {
  const activeSiteName = useAppStore(s => s.activeSite?.name)
  const site = useSlopeStore(s => s.sitesRaw?.sites?.find(x => x.name === activeSiteName))
  const siteLat = site?.latitude ?? null
  const siteLon = site?.longitude ?? null

  // Orientation idéale du site — même extraction que AromeForecast existant
  const siteOrientDeg = (() => {
    if (site?.vent_ideal) {
      const m = /(\d+)\s*°/.exec(site.vent_ideal)
      if (m) return parseFloat(m[1])
    }
    if (Array.isArray(site?.orientation_deg) && site.orientation_deg.length) {
      return site.orientation_deg.reduce((a, b) => a + b, 0) / site.orientation_deg.length
    }
    return null
  })()

  // Sélecteur de jour : J0 par défaut, bascule auto vers J+1 après 18h locales
  const [dayOffset, setDayOffset] = useState(() => (new Date().getHours() >= 18 ? 1 : 0)) // 0=J0, 1=J+1

  const [status, setStatus] = useState('idle') // idle | loading | ok | nosite | error
  const [hourly, setHourly] = useState([]) // [{hour, time, windSpeed, windDir}]
  const [pioupiou, setPioupiou] = useState(null)

  // Heure sélectionnée pour la rose des vents (clic sur une cellule de la grille).
  // Reset a une valeur par defaut a chaque changement de jour.
  const defaultHour = () => {
    if (dayOffset !== 0) return 14
    const h = new Date().getHours()
    return h < 10 ? 10 : h > 17 ? 17 : h
  }
  const [selectedHour, setSelectedHour] = useState(defaultHour)
  useEffect(() => { setSelectedHour(defaultHour()) }, [dayOffset])

  // ESP live -- source verte de la rose des vents. d.ANG est un ecart calé
  // perpendiculaire a la pente au demarrage station (PAS un cap absolu) :
  // conversion capAbsolu = orientationPente + d.ANG, et Δ_ESP = d.ANG direct.
  const { connected: espConnected, demo: espDemo, data: espData } = useESPStore()
  const espHasData = espConnected || espDemo
  const espAngleAbs = (espHasData && siteOrientDeg != null && espData?.ANG != null)
    ? (siteOrientDeg + espData.ANG + 360) % 360
    : null
  const espDelta = espHasData && espData?.ANG != null ? espData.ANG : null

  // AROME HD — toute la plage 10h-17h du jour sélectionné
  useEffect(() => {
    if (siteLat == null || siteLon == null) { setStatus('nosite'); return }
    let cancelled = false
    setStatus('loading')
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${siteLat}&longitude=${siteLon}` +
      `&hourly=wind_speed_10m,wind_direction_10m` +
      `&models=meteofrance_arome_france_hd&windspeed_unit=ms&forecast_days=2&timezone=auto`
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('http ' + r.status)))
      .then(json => {
        if (cancelled) return
        const times = json?.hourly?.time ?? []
        if (!times.length) { setStatus('error'); return }
        // timezone=auto -> chaines locales sans offset, comparaison par date locale
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + dayOffset)
        const targetDayStr = targetDate.toLocaleDateString('en-CA') // YYYY-MM-DD local
        const rows = HOURS.map(h => {
          const idx = times.findIndex(t => {
            const d = new Date(t)
            return d.toLocaleDateString('en-CA') === targetDayStr && d.getHours() === h
          })
          if (idx === -1) return { hour: h, time: null, windSpeed: null, windDir: null }
          return {
            hour: h,
            time: times[idx],
            windSpeed: json.hourly.wind_speed_10m?.[idx] ?? null,
            windDir: json.hourly.wind_direction_10m?.[idx] ?? null,
          }
        })
        setHourly(rows)
        setStatus('ok')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [siteLat, siteLon, dayOffset])

  // Pioupiou live — uniquement pertinent si le jour affiché est aujourd'hui
  useEffect(() => {
    if (dayOffset !== 0 || siteLat == null || siteLon == null) { setPioupiou(null); return }
    let cancelled = false
    fetch('https://api.pioupiou.fr/v1/live/all')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('http ' + r.status)))
      .then(json => {
        if (cancelled) return
        const stations = json?.data ?? []
        let best = null, bestDist = Infinity
        for (const s of stations) {
          if (s?.status?.state !== 'on') continue
          const lat = s?.location?.latitude, lon = s?.location?.longitude
          if (lat == null || lon == null || (lat === 0 && lon === 0)) continue
          const dist = haversineKm(siteLat, siteLon, lat, lon)
          if (dist < bestDist) { bestDist = dist; best = s }
        }
        if (!best || bestDist > 30) { setPioupiou(null); return }
        setPioupiou({
          // wind_speed_avg Pioupiou en km/h (bug unité déjà corrigé ailleurs dans l'app) -> /3.6
          windSpeed: best.measurements?.wind_speed_avg != null ? best.measurements.wind_speed_avg / 3.6 : null,
          windHeading: best.measurements?.wind_heading ?? null,
          distanceKm: bestDist,
        })
      })
      .catch(() => { if (!cancelled) setPioupiou(null) })
    return () => { cancelled = true }
  }, [dayOffset, siteLat, siteLon])

  const boxStyle = { padding: '10px 12px', borderRadius: 10, background: '#0d1117', border: '1px solid #30363d', fontSize: 11, color: '#8b949e' }

  if (status === 'nosite') return <div style={boxStyle}>Sélectionne un site pour voir la météo F3F.</div>
  if (status === 'error') return <div style={boxStyle}>Prévision AROME HD indisponible.</div>

  const currentHour = new Date().getHours()

  return (
    <div style={{
      position: 'relative',
      borderRadius: 12,
      backgroundImage: `linear-gradient(180deg, rgba(5,7,10,0.05), rgba(5,7,10,0.32)), url(${import.meta.env.BASE_URL}images/meteo-bg-saint-ferriol.webp)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: 8,
    }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1].map(off => (
          <button key={off} onClick={() => setDayOffset(off)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 8,
              border: `1px solid ${dayOffset === off ? '#1a73e8' : '#30363d'}`,
              background: dayOffset === off ? '#1a3a5c' : '#0d1117',
              color: dayOffset === off ? '#fff' : '#8b949e',
              fontSize: 11, fontWeight: 800, cursor: 'pointer'
            }}>
            {off === 0 ? "Aujourd'hui" : 'Demain'}
          </button>
        ))}
      </div>

      {status === 'loading' && <div style={boxStyle}>Chargement prévision AROME HD...</div>}

      {status === 'ok' && (
        <WindRose
          siteName={activeSiteName}
          siteOrientDeg={siteOrientDeg}
          arome={hourly.find(r => r.hour === selectedHour) ?? null}
          pioupiou={dayOffset === 0 ? pioupiou : null}
          esp={{ hasData: espHasData, angleAbs: espAngleAbs, speed: espData?.SPD ?? null }}
          deltaEsp={espDelta}
        />
      )}

      {status === 'ok' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, gap: 4 }}>
          {hourly.map(row => {
            const delta = (siteOrientDeg != null && row.windDir != null)
              ? (() => { const d = Math.abs(row.windDir - siteOrientDeg); return d > 180 ? 360 - d : d })()
              : null
            const st = computeStatus(row.windSpeed, delta)
            const isCurrent = dayOffset === 0 && row.hour === currentHour
            const isSelected = row.hour === selectedHour
            return (
              <div key={row.hour} onClick={() => setSelectedHour(row.hour)} style={{
                ...boxStyle, padding: '6px 4px', textAlign: 'center', cursor: 'pointer',
                border: isSelected ? '2px solid #3fb950' : isCurrent ? '2px solid #58a6ff' : boxStyle.border
              }}>
                <div style={{ fontSize: 10, color: '#8b949e', fontWeight: 700 }}>{row.hour}h</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginTop: 2 }}>
                  {row.windSpeed != null ? row.windSpeed.toFixed(0) : '—'}
                </div>
                <div style={{ fontSize: 9, color: '#8b949e' }}>m/s</div>
                {row.windDir != null && (
                  <div style={{ fontSize: 9, color: '#8b949e', marginTop: 1 }}>{row.windDir.toFixed(0)}°</div>
                )}
                <div style={{ fontSize: 9, fontWeight: 800, color: st.color, marginTop: 3 }}>{st.label}</div>
                {isCurrent && pioupiou?.windSpeed != null && (
                  <div style={{ fontSize: 8, color: '#f0a500', marginTop: 3, fontWeight: 700 }}>
                    PIOUPIOU {pioupiou.windSpeed.toFixed(1)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ fontSize: 9, color: '#444', textAlign: 'center', lineHeight: 1.5 }}>
        Statut : &lt;3 ou &gt;25 m/s Non autorisé (FAI) &gt; Δ&gt;45° Inutilisable &gt; barème Veff (m/s)
        Faible/Moyenne/Bonne/Excellente/Forte — Météo-France AROME HD via Open-Meteo.com
        {pioupiou ? ' · Pioupiou/OpenWindMap' : ''}
      </div>
    </div>
    </div>
  )
}
