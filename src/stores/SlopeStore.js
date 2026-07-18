import { create } from "zustand"
import { useAppStore } from "./appStore"

const SITES_URL = `${import.meta.env.BASE_URL}planeurs/sites.json`
export const Q_REF_ESC = 44.751  // Pa, recalcule 10 juillet 2026 avec altitude IGN Escueillens=421m (etait 44.441 sur 480m)

function median(arr) {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function percentile(arr, p) {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (s.length - 1)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  if (lo === hi) return s[lo]
  return s[lo] + (s[hi] - s[lo]) * (idx - lo)
}

const SESSION_STORAGE_KEY = "f3xv_site_session"

function loadSessionFromStorage() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSessionToStorage(session) {
  try {
    if (session && Object.keys(session).length > 0) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  } catch {}
}

export const useSlopeStore = create((set, get) => ({
  sitesRaw: null,
  loaded: false,
  // Restaure automatiquement le tampon de session au demarrage (survit a un reload accidentel)
  session: loadSessionFromStorage(), // { [siteName]: { samples: [{date,round,seconds,wind,rho,q,k,source}], kDyn, tp5Frozen, tp25Frozen } }

  // Section "live" : calculs metier temps reel (Phase 4 -- deplaces depuis espStore.js)
  // espStore ne fait plus que transporter les trames brutes et appeler updateLive()
  live: { q: null, irpx: null, energiePct: null },

  // Calcule Energie/IQA/IRPX a partir des donnees brutes ESP32 (spd, iqa, rhoStation, alt)
  // + du K_site du site actif -- SEULE fonction qui fait ce calcul desormais
  updateLive: ({ spd, iqa, rhoStation, alt }) => {
    const rho = rhoStation != null && rhoStation > 0
      ? rhoStation
      : alt != null
        ? 1.225 * Math.exp(-alt / 8500)
        : 1.225

    const activeSiteName = useAppStore.getState().activeSite?.name
    const kSite = activeSiteName
      ? (get().getKDyn(activeSiteName) ?? 1)
      : 1

    const q = spd > 0 ? 0.5 * rho * spd * spd : null
    const energy = q !== null ? (q / Q_REF_ESC) * kSite : null
    const energiePct = energy !== null ? +(energy * 100).toFixed(1) : null
    const irpx = (energy !== null && iqa > 0) ? +(energy * iqa).toFixed(3) : null

    set({ live: { q: q !== null ? +q.toFixed(1) : null, irpx, energiePct } })
  },

  init: async () => {
    // cache-buster : evite le cache HTTP navigateur ET le CDN GitHub Pages
    // qui peuvent servir une vieille copie de sites.json malgre le bump du service worker
    const res = await fetch(`${SITES_URL}?t=${Date.now()}`, { cache: "no-store" })
    const data = await res.json()
    set({ sitesRaw: data, loaded: true })
  },

  getSite: (name) => {
    const { sitesRaw } = get()
    return sitesRaw?.sites?.find(s => s.name === name) ?? null
  },

  getKDyn: (name) => get().session[name]?.kDyn ?? null,

  // Demarre une session : fige T_P5/T_P25 depuis l'historique existant du site
  startSession: (name) => {
    const site = get().getSite(name)
    const hist = site?.energy?.samples ?? []
    const secs = hist.map(s => s.seconds).filter(v => v != null)
    const tp5Frozen = percentile(secs, 5)
    const tp25Frozen = percentile(secs, 25)
    const newSession = { ...get().session, [name]: { samples: [], kDyn: null, tp5Frozen, tp25Frozen } }
    set({ session: newSession })
    saveSessionToStorage(newSession)
  },

  // Appele a chaque calcul valide (station ou F3XVault) — alimente uniquement la session
  // q_ref = Q_REF_ESC, passe depuis irpStore
  addSample: (name, { date, round, seconds, wind, rho, q_ref, source }) => {
    const { session } = get()
    const sess = session[name]
    if (!sess) return // startSession() doit etre appele avant

    const rhoVal = rho ?? 1.225
    const q = 0.5 * rhoVal * wind * wind

    let k = 1  // bootstrap: pas d'historique -> K neutre par defaut
    if (sess.tp5Frozen != null && sess.tp25Frozen != null && q_ref) {
      k = (sess.tp5Frozen / sess.tp25Frozen) / (q / q_ref)
    }

    const samples = [...sess.samples, { date, round, seconds, wind, rho: rhoVal, q, k, source }]
    const kDyn = median(samples.map(s => s.k).filter(v => v != null))

    const newSession = { ...session, [name]: { ...sess, samples, kDyn } }
    set({ session: newSession })
    saveSessionToStorage(newSession)
  },

  // Consolide la session dans l'historique persistant (fin de session)
  closeSession: (name) => {
    const { sitesRaw, session } = get()
    const sess = session[name]
    if (!sitesRaw || !sess?.samples?.length) return

    const sites = sitesRaw.sites.map(s => {
      if (s.name !== name) return s
      const energy = s.energy ?? { samples: [] }
      const samples = [...(energy.samples ?? []), ...sess.samples]
      const ks = samples.map(x => x.k).filter(v => v != null)
      const qs = samples.map(x => x.q).filter(v => v != null)
      return {
        ...s,
        energy: {
          kMedian: median(ks),
          qMedian: median(qs),
          qP25: percentile(qs, 25),
          qP75: percentile(qs, 75),
          samples,
          updated: new Date().toISOString()
        }
      }
    })

    const { [name]: _discarded, ...restSessions } = session
    set({ sitesRaw: { ...sitesRaw, sites }, session: restSessions })
    saveSessionToStorage(restSessions)
  },

  discardSession: (name) => {
    const { [name]: _discarded, ...rest } = get().session
    set({ session: rest })
    saveSessionToStorage(rest)
  },

  exportSitesJson: () => {
    const { sitesRaw } = get()
    if (!sitesRaw) return
    const blob = new Blob([JSON.stringify(sitesRaw, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sites.json"
    a.click()
    URL.revokeObjectURL(url)
  }
}))
