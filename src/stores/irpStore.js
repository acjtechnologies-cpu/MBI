/**
 * IRP Store v3 — kActuel = miroir reactif du kDyn de SlopeStore
 *
 * L'ancien systeme V5 (Trend/IRP_raw/K_dyn base sur T_best/V_moy) est
 * entierement retire. kActuel suit maintenant le K_site dynamique
 * calcule par SlopeStore pour le site actif (voir SlopeStore.js).
 *
 * confidence = f(nbRuns session courante, sigma des k de la session)
 *   LOW    : < 5 runs ou sigma_K > 0.15
 *   MEDIUM : 5-15 runs et sigma_K < 0.15
 *   HIGH   : > 15 runs et sigma_K < 0.10
 *
 * Systeme manche (IRPX Run temps reel, addManche/_recalcManche) INCHANGE
 * — chantier separe, voir backlog "ΔMasse temps reel"
 */
import { create } from 'zustand'
import { useAppStore } from './appStore'
import { useSlopeStore } from './SlopeStore'

function stdDev(arr) {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length)
}

export const useIrpStore = create((set, get) => ({

  // Miroir reactif du kDyn de SlopeStore pour le site actif
  kActuel: null,
  confidence: null,
  nbRuns: 0,
  siteName: '',

  // Compat externe (Poly4Page appelle setSiteRef(irp, name))
  setSiteRef: (irp, name) => {
    set({ siteName: name || '' })
    get()._syncFromSiteEnergy()
  },

  _syncFromSiteEnergy: () => {
    const activeSiteName = useAppStore.getState().activeSite?.name
    if (!activeSiteName) {
      set({ kActuel: null, confidence: null, nbRuns: 0 })
      return
    }
    const seState = useSlopeStore.getState()
    const kDyn = seState.getKDyn(activeSiteName)
    const session = seState.session[activeSiteName]
    const kVals = (session?.samples ?? []).map(s => s.k).filter(v => v != null)
    const nbRuns = kVals.length

    let confidence = null
    if (nbRuns > 0) {
      const mean = kVals.reduce((a, b) => a + b, 0) / nbRuns
      const sigmaK = mean !== 0 ? stdDev(kVals) / mean : 0
      confidence = 'LOW'
      if (nbRuns >= 15 && sigmaK < 0.10) confidence = 'HIGH'
      else if (nbRuns >= 5 && sigmaK < 0.15) confidence = 'MEDIUM'
    }

    set({ kActuel: kDyn, confidence, nbRuns })
  },

  // ── Systeme manche (IRPX Run temps reel) — INCHANGE ──
  mancheResults: [],
  mancheIrp: null,
  mancheK: null,
  mancheRef: null,

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
    mancheRef: null,
  }),

  _recalcManche: (masseVol, kPente) => {
    const { mancheResults } = get()
    if (!mancheResults.length) return

    const irpxVals = mancheResults
      .map(m => m.irpxSnap)
      .filter(v => v !== null && v > 0)

    if (!irpxVals.length) {
      set({ mancheIrp: null, mancheK: null, mancheRef: null })
      return
    }

    const lastIrpx = irpxVals[irpxVals.length - 1]

    const refVals = irpxVals.slice(0, 3)
    const sorted  = [...refVals].sort((a, b) => a - b)
    const mid     = Math.floor(sorted.length / 2)
    const ref     = sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2

    set({
      mancheIrp:  +lastIrpx.toFixed(3),
      mancheRef:  +ref.toFixed(3),
    })
  },
}))

// Sync automatique quand SlopeStore ou le site actif changent
useSlopeStore.subscribe(() => {
  useIrpStore.getState()._syncFromSiteEnergy()
})
useAppStore.subscribe((state, prevState) => {
  if (state.activeSite?.name !== prevState.activeSite?.name) {
    useIrpStore.getState()._syncFromSiteEnergy()
  }
})
