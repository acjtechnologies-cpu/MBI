/**
 * IRP Store — Calcul IRP/K temps réel depuis les runs ChronoPage
 *
 * Formules :
 *   Trend   = T_median × (1 - σ_T)
 *   IRP     = Trend × V_moy^0.7
 *   K       = clamp(IRP / 171, 0.85, 1.15)
 *   IQA_hyb = 0.6 × IQA_station + 0.4 × IQA_pilot
 *
 * Alimenté par addRun() appelé depuis ChronoPage au STOP
 */
import { create } from 'zustand'

function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function stdDev(arr) {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length)
}

const IRP_REF = 171       // Saint Ferriol reference
const K_MIN = 0.85
const K_MAX = 1.15

export const useIrpStore = create((set, get) => ({

  // Runs validés de la session courante
  runs: [],

  // Résultats calculés
  trend: null,
  irp: null,
  kActuel: null,
  sigmaT: null,
  vMoy: null,
  tMedian: null,
  iqaHybrid: null,
  iqaPilot: null,
  nbRuns: 0,

  // Ajouter un run (appelé depuis ChronoPage au STOP)
  addRun: (run) => {
    const runs = [...get().runs, run]
    set({ runs })
    get()._recalc()
  },

  // Réinitialiser (nouvelle session / manche)
  reset: () => set({
    runs: [], trend: null, irp: null, kActuel: null,
    sigmaT: null, vMoy: null, tMedian: null,
    iqaHybrid: null, iqaPilot: null, nbRuns: 0,
  }),

  // Charger des runs existants (depuis Dexie au montage)
  loadRuns: (runs) => {
    set({ runs })
    get()._recalc()
  },

  // Recalcul interne
  _recalc: () => {
    const { runs } = get()

    // Filtrer les runs valides (avec durée et vent)
    const valid = runs.filter(r =>
      r.duree_ms > 20000 && r.duree_ms < 120000 && // < 2 min = run valide
      r.vent_snap > 0
    )

    if (valid.length < 2) {
      set({ trend: null, irp: null, kActuel: null, sigmaT: null,
            vMoy: null, tMedian: null, iqaHybrid: null, iqaPilot: null,
            nbRuns: valid.length })
      return
    }

    // Temps en secondes
    const times = valid.map(r => r.duree_ms / 1000)
    const vents = valid.map(r => r.vent_snap)
    const iqas  = valid.map(r => r.iqa_snap).filter(x => x != null && x > 0)

    const tMed   = median(times)
    const sigma  = stdDev(times)
    const tMean  = times.reduce((a, b) => a + b, 0) / times.length
    const sigmaT = tMean > 0 ? sigma / tMean : 0  // Coefficient de variation

    // Trend = T_median × (1 - σ_T)
    const trend = tMed * (1 - sigmaT)

    // V_moy des runs
    const vMoy = vents.reduce((a, b) => a + b, 0) / vents.length

    // IRP = Trend × V_moy^0.7
    const irp = trend * Math.pow(vMoy, 0.7)

    // K = clamp(IRP / 171, 0.85, 1.15)
    const kActuel = Math.max(K_MIN, Math.min(K_MAX, irp / IRP_REF))

    // IQA pilot = performance inverse normalisée
    // Plus le trend est bas (rapides), meilleures sont les conditions
    // Normalisation : 30s = IQA 10, 60s = IQA 0
    const iqaPilot = iqas.length > 0
      ? Math.max(0, Math.min(10, (60 - trend) / 3))
      : null

    // IQA hybrid = 0.6 × station + 0.4 × pilot
    const iqaStationMoy = iqas.length > 0
      ? iqas.reduce((a, b) => a + b, 0) / iqas.length
      : null
    const iqaHybrid = (iqaPilot !== null && iqaStationMoy !== null)
      ? 0.6 * iqaStationMoy + 0.4 * iqaPilot
      : iqaStationMoy

    set({
      trend:     +trend.toFixed(2),
      irp:       +irp.toFixed(1),
      kActuel:   +kActuel.toFixed(3),
      sigmaT:    +sigmaT.toFixed(3),
      vMoy:      +vMoy.toFixed(1),
      tMedian:   +tMed.toFixed(2),
      iqaHybrid: iqaHybrid !== null ? +iqaHybrid.toFixed(2) : null,
      iqaPilot:  iqaPilot !== null ? +iqaPilot.toFixed(2) : null,
      nbRuns:    valid.length,
    })
  },
}))
