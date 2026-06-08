/**
 * IRP Store v2 — K_dyn = IRP_raw / IRP_site_ref
 *
 * Calibration par pente :
 *   Trend     = T_median × (1 - σ_T)
 *   IRP_raw   = Trend × V_moy^0.7
 *   K_dyn     = clamp(IRP_raw / IRP_site_ref, 0.85, 1.15)
 *   IQA_hyb   = 0.6 × IQA_station + 0.4 × IQA_pilot
 *
 * Confiance = f(nbRuns, σ_T)
 *   LOW    : < 5 runs ou σ_T > 0.15
 *   MEDIUM : 5-15 runs et σ_T < 0.15
 *   HIGH   : > 15 runs et σ_T < 0.10
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

const INDICE_875 = 0.875  // T_best/T_median ratio F3F
const K_MIN = 0.92        // +-8% manche delta
const K_MAX = 1.08        // +-8% manche delta
const GAIN_G = 30         // g par % d'ecart IRPX
const IRPX_CLAMP = 150    // g saturation securite
const DEFAULT_SITE_REF = 230  // Saint Ferriol V5 median (CDF+CDM)

export const useIrpStore = create((set, get) => ({

  // Runs validés de la session courante
  runs: [],

  // Référence site active
  siteRef: DEFAULT_SITE_REF,
  siteName: '',

  // Résultats calculés
  trend: null,
  irp: null,          // IRP_raw (absolu)
  kDyn: null,         // K_dyn = IRP_raw / siteRef
  kActuel: null,      // Alias pour compatibilité (= kDyn)
  sigmaT: null,
  vMoy: null,
  tMedian: null,
  iqaHybrid: null,
  iqaPilot: null,
  nbRuns: 0,
  confidence: null,   // 'LOW' | 'MEDIUM' | 'HIGH'
  deltaPerf: null,    // (ref/IRP_raw - 1) × 100

  // IRPX Run system (q_snap + irpx_snap -> Kdyn -> DeltaMasse)
  mancheResults: [],
  mancheIrp: null,      // dernier irpxRun
  mancheK: null,        // Kdyn
  mancheDelta: null,    // % ecart
  mancheDeltaMasse: null,
  mancheRef: null,      // mediane irpx M1-M3

  // Changer la référence site (appelé quand on navigue les pentes)
  setSiteRef: (irp, name) => {
    set({ siteRef: irp || DEFAULT_SITE_REF, siteName: name || '' })
    get()._recalc()
  },

  // Ajouter un run (appelé depuis ChronoPage au STOP)
  addRun: (run) => {
    const runs = [...get().runs, run]
    set({ runs })
    get()._recalc()
  },

  // Réinitialiser (nouvelle session)
  reset: () => set({
    runs: [], trend: null, irp: null, kDyn: null, kActuel: null, deltaPerf: null,
    sigmaT: null, vMoy: null, tMedian: null,
    iqaHybrid: null, iqaPilot: null, nbRuns: 0, confidence: null,
  }),

  // Charger des runs existants (depuis Dexie au montage)
  loadRuns: (runs) => {
    set({ runs })
    get()._recalc()
  },

  // IRPX Run: ajouter un resultat de manche (q_snap + irpx_snap depuis ESP)
  addManche: (tBest, vMoy, masseVol, kPente, qSnap, irpxSnap) => {
    const m = [...get().mancheResults, {
      tBest, vMoy,
      qSnap:    qSnap    ?? null,
      irpxSnap: irpxSnap ?? null,
      ts: Date.now()
    }]
    set({ mancheResults: m })
    get()._recalcManche(masseVol, kPente)
  },

  clearManches: () => set({
    mancheResults: [],
    mancheIrp: null, mancheK: null,
    mancheDelta: null, mancheDeltaMasse: null, mancheRef: null,
  }),

  _recalcManche: (masseVol, kPente) => {
    const { mancheResults } = get()
    if (!mancheResults.length) return

    // Extraire irpxSnap valides
    const irpxVals = mancheResults
      .map(m => m.irpxSnap)
      .filter(v => v !== null && v > 0)

    if (!irpxVals.length) {
      // Pas de donnees IRPX station -> pas de calcul
      set({ mancheIrp: null, mancheK: null, mancheDelta: null,
            mancheDeltaMasse: null, mancheRef: null })
      return
    }

    const lastIrpx = irpxVals[irpxVals.length - 1]

    // Ref : mediane des 3 premieres manches avec irpx valide, puis fixe
    const refVals = irpxVals.slice(0, 3)
    const sorted  = [...refVals].sort((a, b) => a - b)
    const mid     = Math.floor(sorted.length / 2)
    const ref     = sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2

    const kDyn   = Math.max(K_MIN, Math.min(K_MAX, lastIrpx / ref))
    const delta  = +((kDyn - 1) * 100).toFixed(1)
    // Gain 30g/% sature a +-150g
    const dMasse = Math.max(-IRPX_CLAMP, Math.min(IRPX_CLAMP,
      Math.round(GAIN_G * (kDyn - 1) * 100)
    ))

    set({
      mancheIrp:        +lastIrpx.toFixed(3),
      mancheK:          +kDyn.toFixed(3),
      mancheDelta:      delta,
      mancheDeltaMasse: dMasse,
      mancheRef:        +ref.toFixed(3),
    })
  },

  // Recalcul interne
  _recalc: () => {
    const { runs, siteRef } = get()

    // Filtrer les runs valides (> 20s, < 2min, avec vent)
    const valid = runs.filter(r =>
      r.duree_ms > 20000 && r.duree_ms < 120000 &&
      r.vent_snap > 0
    )

    if (valid.length < 2) {
      set({ trend: null, irp: null, kDyn: null, kActuel: null,
            sigmaT: null, vMoy: null, tMedian: null,
            iqaHybrid: null, iqaPilot: null,
            nbRuns: valid.length, confidence: null })
      return
    }

    // Temps en secondes
    const times = valid.map(r => r.duree_ms / 1000)
    const vents = valid.map(r => r.vent_snap)
    const iqas  = valid.map(r => r.iqa_snap).filter(x => x != null && x > 0)

    const tMed   = median(times)
    const sigma  = stdDev(times)
    const tMean  = times.reduce((a, b) => a + b, 0) / times.length
    const sigmaT = tMean > 0 ? sigma / tMean : 0

    // Trend = T_median × (1 - σ_T)
    const trend = tMed * (1 - sigmaT)

    // V_moy des runs
    const vMoy = vents.reduce((a, b) => a + b, 0) / vents.length

    // IRP_raw = Trend × V_moy^0.7
    const irpRaw = trend * Math.pow(vMoy, 0.7)

    // K_dyn = clamp(IRP_raw / IRP_site_ref, 0.85, 1.15)
    const ref = DEFAULT_SITE_REF
    const kDyn = Math.max(K_MIN, Math.min(K_MAX, ref / irpRaw))

    // DeltaPerf = ecart en % par rapport a la reference
    const deltaPerf = +((kDyn - 1) * 100).toFixed(1)

    // Confiance
    let confidence = 'LOW'
    if (valid.length >= 15 && sigmaT < 0.10) confidence = 'HIGH'
    else if (valid.length >= 5 && sigmaT < 0.15) confidence = 'MEDIUM'

    // IQA pilot
    const iqaPilot = Math.max(0, Math.min(10, (60 - trend) / 3))

    // IQA hybrid
    const iqaStationMoy = iqas.length > 0
      ? iqas.reduce((a, b) => a + b, 0) / iqas.length
      : null
    const iqaHybrid = (iqaPilot !== null && iqaStationMoy !== null)
      ? 0.6 * iqaStationMoy + 0.4 * iqaPilot
      : iqaStationMoy

    set({
      trend:      +trend.toFixed(2),
      irp:        +irpRaw.toFixed(1),
      kDyn:       +kDyn.toFixed(3),
      kActuel:    +kDyn.toFixed(3),    // Compatibilité
      sigmaT:     +sigmaT.toFixed(3),
      vMoy:       +vMoy.toFixed(1),
      tMedian:    +tMed.toFixed(2),
      iqaHybrid:  iqaHybrid !== null ? +iqaHybrid.toFixed(2) : null,
      iqaPilot:   iqaPilot !== null ? +iqaPilot.toFixed(2) : null,
      nbRuns:     valid.length,
      confidence,
      deltaPerf,
    })
  },
}))
