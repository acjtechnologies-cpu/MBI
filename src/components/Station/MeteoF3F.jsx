import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useSlopeStore } from '../../stores/SlopeStore'

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
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, gap: 4 }}>
          {hourly.map(row => {
            const delta = (siteOrientDeg != null && row.windDir != null)
              ? (() => { const d = Math.abs(row.windDir - siteOrientDeg); return d > 180 ? 360 - d : d })()
              : null
            const st = computeStatus(row.windSpeed, delta)
            const isCurrent = dayOffset === 0 && row.hour === currentHour
            return (
              <div key={row.hour} style={{
                ...boxStyle, padding: '6px 4px', textAlign: 'center',
                border: isCurrent ? '2px solid #58a6ff' : boxStyle.border
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
  )
}
