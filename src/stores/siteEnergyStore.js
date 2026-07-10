import { create } from "zustand"

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

export const useSiteEnergyStore = create((set, get) => ({
  sitesRaw: null,
  loaded: false,
  session: {}, // { [siteName]: { samples: [{date,round,seconds,wind,rho,q,k,source}], kDyn, tp5Frozen, tp25Frozen } }

  init: async () => {
    const res = await fetch(SITES_URL)
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
    set(state => ({
      session: { ...state.session, [name]: { samples: [], kDyn: null, tp5Frozen, tp25Frozen } }
    }))
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

    set({ session: { ...session, [name]: { ...sess, samples, kDyn } } })
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
  },

  discardSession: (name) => {
    const { [name]: _discarded, ...rest } = get().session
    set({ session: rest })
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
