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
  // espStore ne fait plus que transporter les trames brutes et appeler updateLive()/updateTurb()
  live: { q: null, irpx: null, energiePct: null, turbBuf: Array(60).fill(0), turbSigma: 0 },

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

    set(s => ({ live: { ...s.live, q: q !== null ? +q.toFixed(1) : null, irpx, energiePct } }))
  },

  // Buffer oscillogramme turbulence (ecart-type glissant sur 60 echantillons).
  // Deplace depuis espStore.js (Phase 5) : ce calcul est independant de la source des
  // donnees (WebSocket ESP32 actuel, futur canal Android natif, mode demo, replay de
  // session) -- espStore ne fait plus qu'appeler cette fonction avec la valeur brute.
  updateTurb: (turbValue) => {
    if (turbValue === undefined) return
    const buf = [...get().live.turbBuf, turbValue]
    if (buf.length > 60) buf.shift()
    const mean  = buf.reduce((a, b) => a + b, 0) / buf.length
    const sigma = Math.sqrt(buf.reduce((a, b) => a + (b - mean) ** 2, 0) / buf.length)
    set(s => ({ live: { ...s.live, turbBuf: buf, turbSigma: sigma } }))
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
  // IMPORTANT : ne filtre QUE sur les samples schema=2 + agg="collective" (P5/P25 calcules
  // sur l'ensemble des pilotes d'un round). Les vieux samples "individual" (temps d'un seul
  // pilote suivi, format legacy pre-migration) sont ignores ici pour ne jamais melanger deux
  // statistiques de nature differente dans le meme percentile fige.
  startSession: (name) => {
    const site = get().getSite(name)
    const hist = (site?.energy?.samples ?? []).filter(s => s.schema === 2 && s.agg === "collective")
    const secs = hist.map(s => s.t_p5).filter(v => v != null)
    const tp5Frozen = secs.length ? percentile(secs, 5) : null
    const tp25Frozen = secs.length ? percentile(secs, 25) : null
    const newSession = { ...get().session, [name]: { samples: [], kDyn: null, tp5Frozen, tp25Frozen } }
    set({ session: newSession })
    saveSessionToStorage(newSession)
  },

  // Appele a chaque calcul valide (station ou F3XVault) — alimente uniquement la session
  // q_ref = Q_REF_ESC, passe depuis irpStore
  //
  // SCHEMA 2 (migration collective, depuis le backfill Puy de Manse) :
  //   t_p5/t_p25  = percentiles calcules sur TOUS les pilotes du round (pas un pilote suivi)
  //   ratio       = t_p5/t_p25, champ DIAGNOSTIQUE uniquement, n'entre dans aucun calcul de k
  //   seconds     = alias legacy = t_p5, conserve en lecture seule pour compat affichage,
  //                 sera supprime une fois la migration terminee sur tous les sites
  //   k continue d'etre derive EXCLUSIVEMENT de tp5Frozen/tp25Frozen (figes a startSession),
  //   jamais de ratio — ratio ne sert qu'a l'inspection/debug d'un round isole
  addSample: (name, { date, round, t_p5, t_p25, wind, rho, q_ref, source, agg, schema = 2 }) => {
    const { session } = get()
    const sess = session[name]
    if (!sess) return // startSession() doit etre appele avant

    const rhoVal = rho ?? 1.225
    const q = 0.5 * rhoVal * wind * wind
    const ratio = (t_p5 != null && t_p25 != null) ? t_p5 / t_p25 : null

    // bootstrap = vrai si aucune reference figee n'existait au moment de CE sample
    // (1ere session d'un site, ou historique encore vide a cet instant). Le flag est
    // fige definitivement sur le sample -> permet d'exclure ces samples des agregats
    // (kMedian/qMedian/...) meme apres fusion avec de futures sessions non-bootstrap.
    const isBootstrap = sess.tp5Frozen == null || sess.tp25Frozen == null

    let k = 1  // bootstrap: pas d'historique -> K neutre par defaut
    if (!isBootstrap && q_ref) {
      k = (sess.tp5Frozen / sess.tp25Frozen) / (q / q_ref)
    }

    const sample = {
      schema, agg,
      date, round,
      seconds: t_p5, // legacy alias, lecture seule
      t_p5, t_p25, ratio,
      wind, rho: rhoVal, q, k, source,
      bootstrap: isBootstrap,
    }

    const samples = [...sess.samples, sample]
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
      // kMedian exclut les samples bootstrap : leur k=1 est un artefact de demarrage
      // (aucune reference tp5Frozen/tp25Frozen n'existait encore), pas une vraie mesure.
      // Les melanger a des k reels dans une meme mediane fausse silencieusement le
      // resultat au fur et a mesure que l'historique grandit. qMedian/qP25/qP75 restent
      // calcules sur TOUS les samples : q=0.5*rho*wind^2 est une grandeur physique
      // reelle, valable qu'un sample soit bootstrap ou non.
      const ks = samples.filter(x => !x.bootstrap).map(x => x.k).filter(v => v != null)
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
    // Nom auto-descriptif (date+heure locale) au lieu de "sites.json" toujours identique --
    // evite l'accumulation de sites (1).json, sites (2).json... sans aucune reference
    // pour distinguer quel export correspond a quelle session de collecte.
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
    a.download = `sites_${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}))
