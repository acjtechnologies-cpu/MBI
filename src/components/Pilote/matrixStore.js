import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Calcul masse + CG complet (moment absolu depuis le modèle vide).
// Mathématiquement équivalent au calcCGDelta incrémental de MatriceInteractive.jsx
// (si baseCfg était lui-même issu de cette même formule), mais ne dépend pas
// d'une "config de référence" en cours d'édition : chaque ligne de matrix
// reste auto-suffisante et cohérente, même après reload.
// ---------------------------------------------------------------------------
function computeStats(model, soutes, slots) {
  let m = model.masseVide
  let moment = model.masseVide * model.cgVide
  soutes.forEach(s => {
    const all = [...(slots[s.id]?.G || []), ...(slots[s.id]?.D || [])]
    all.forEach(b => {
      m += b.masse
      moment += b.masse * s.distanceBA
    })
  })
  const cg = m > 0 ? moment / m : model.cgVide
  return { m: Math.round(m), cg: Number(cg.toFixed(2)) }
}

// row (format stocké, ex: { n, m, cg, av:{G,D}, ce:{G,D}, ar:{G,D} }) -> slots éditables
// Même logique que slotsFromCfg existant, mais toujours en tableaux pleins (jamais en comptage)
function rowToSlots(soutes, MAT_KEYS, row) {
  const slots = {}
  soutes.forEach((s, i) => {
    const b = row[MAT_KEYS[i] || 'av'] || {}
    const mat = s.materiaux?.[0] || { nom: 'Laiton', masse: 71 }
    if (Array.isArray(b.G)) {
      slots[s.id] = { G: b.G.map(x => ({ ...x })), D: (b.D || []).map(x => ({ ...x })) }
    } else {
      slots[s.id] = {
        G: Array.from({ length: b.G || 0 }, () => ({ nom: b.matG || mat.nom, masse: mat.masse })),
        D: Array.from({ length: b.D || 0 }, () => ({ nom: b.matD || mat.nom, masse: mat.masse })),
      }
    }
  })
  return slots
}

// slots éditables -> row stocké, avec m/cg recalculés (jamais de mutation des objets d'origine)
function slotsToRow(soutes, MAT_KEYS, model, n, slots) {
  const row = { n }
  soutes.forEach((s, i) => {
    row[MAT_KEYS[i] || 'av'] = { G: slots[s.id].G, D: slots[s.id].D }
  })
  return Object.assign(row, computeStats(model, soutes, slots))
}

export const useMatrixStore = create((set) => ({
  model: null,
  soutes: [],
  MAT_KEYS: [],
  matrix: [],
  ci: 0,

  // À appeler une fois au chargement du modèle (ou au changement de modèle actif)
  init: (model, soutes, MAT_KEYS, rawMatrix) => set(() => ({
    model,
    soutes,
    MAT_KEYS,
    matrix: rawMatrix.map(row =>
      slotsToRow(soutes, MAT_KEYS, model, row.n, rowToSlots(soutes, MAT_KEYS, row))
    ),
  })),

  setCi: (idx) => set({ ci: idx }),

  // Ajout centre -> extérieur (même règle que addBloc existant : on prend le matériau
  // du dernier bloc du côté, sinon le matériau par défaut de la soute)
  addBloc: (idx, souteId, side, forcedMaterial) => set((state) => {
    const { model, soutes, MAT_KEYS, matrix } = state
    const s = soutes.find(x => x.id === souteId)
    const slots = rowToSlots(soutes, MAT_KEYS, matrix[idx])
    const cur = slots[souteId][side]
    if (cur.length >= (s?.capacite || 5)) return state // soute pleine -> no-op (shake côté UI)

    const rowKey = MAT_KEYS[soutes.findIndex(x => x.id === souteId)] || 'av'
    const rowData = matrix[idx]?.[rowKey] || {}
    const nomNom = side === 'G' ? rowData.matG : rowData.matD
    const nomMat = nomNom ? (s.materiaux||[]).find(m => m.nom === nomNom) : null
    const mat = forcedMaterial || (cur.length > 0 ? cur[cur.length-1] : (nomMat || s.materiaux?.[0] || { nom: 'Laiton', masse: 71 }))
    slots[souteId] = { ...slots[souteId], [side]: [...cur, { ...mat }] }

    const newMatrix = [...matrix]
    newMatrix[idx] = slotsToRow(soutes, MAT_KEYS, model, matrix[idx].n, slots)
    return { matrix: newMatrix }
  }),

  // Retrait LIFO (extérieur -> centre), symétrique de addBloc
  removeBloc: (idx, souteId, side) => set((state) => {
    const { model, soutes, MAT_KEYS, matrix } = state
    const slots = rowToSlots(soutes, MAT_KEYS, matrix[idx])
    const cur = slots[souteId][side]
    if (!cur.length) return state // déjà vide -> no-op

    slots[souteId] = { ...slots[souteId], [side]: cur.slice(0, -1) }

    const newMatrix = [...matrix]
    newMatrix[idx] = slotsToRow(soutes, MAT_KEYS, model, matrix[idx].n, slots)
    return { matrix: newMatrix }
  }),

  // "+ Nouvelle config" : copie la disposition de sourceIdx vers targetIdx, puis bascule dessus
  duplicateConfig: (sourceIdx, targetIdx) => set((state) => {
    const { model, soutes, MAT_KEYS, matrix } = state
    const slots = rowToSlots(soutes, MAT_KEYS, matrix[sourceIdx])
    const newMatrix = [...matrix]
    newMatrix[targetIdx] = slotsToRow(soutes, MAT_KEYS, model, matrix[targetIdx].n, slots)
    return { matrix: newMatrix, ci: targetIdx }
  }),
}))
