import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Calcul masse + CG complet (moment absolu depuis le modèle vide).
// Les clés de stockage sont les IDs des soutes — pas de convention av/c/ar.
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

// row (format stocké) -> slots éditables
// Supporte deux formats de valeurs :
//   - tableau  : { G: [{nom,masse},...], D:[...] }  → copie directe
//   - compact  : { G: 3, matG:'Laiton', D:2, matD:'Laiton' } → expansion
// Les clés dans row sont les IDs des soutes OU les anciennes clés av/c/ar
function rowToSlots(soutes, row, legacyKeys) {
  const slots = {}
  // Detecter les cles numeriques/legacy presentes dans la row
  const CAND = ['av', 'c', 'ar', 'ar2', 's0', 's1', 's2', 's3', 's4']
  const rowKeys = CAND.filter(k => k in row)
  soutes.forEach((s, i) => {
    // 1. ID direct, 2. legacyKeys passes, 3. cles detectees dans la row
    const key = s.id in row ? s.id
      : (legacyKeys && legacyKeys[i] in row ? legacyKeys[i]
      : (rowKeys[i] || null))
    const b = key ? (row[key] || {}) : {}
    const mat = s.materiaux?.[0] || { nom: 'Laiton', masse: 71 }
    if (Array.isArray(b.G)) {
      slots[s.id] = {
        G: b.G.map(x => ({ ...x })),
        D: (b.D || []).map(x => ({ ...x })),
      }
    } else {
      const findMat = (nom) => (s.materiaux || []).find(m => m.nom === nom) || mat
      const matG = findMat(b.matG)
      const matD = findMat(b.matD)
      slots[s.id] = {
        G: Array.from({ length: b.G || 0 }, () => ({ nom: matG.nom, masse: matG.masse })),
        D: Array.from({ length: b.D || 0 }, () => ({ nom: matD.nom, masse: matD.masse })),
      }
    }
  })
  return slots
}

// slots éditables -> row stocké, clés = IDs des soutes
function slotsToRow(soutes, model, n, slots) {
  const row = { n }
  soutes.forEach(s => {
    row[s.id] = { G: slots[s.id].G, D: slots[s.id].D }
  })
  return Object.assign(row, computeStats(model, soutes, slots))
}

function countAt(matrix, soutes, idx, souteId, side) {
  return matrix[idx]?.[souteId]?.[side]?.length ?? 0
}

// Génération automatique d'une matrice de 20 configs vides
export function generateEmptyMatrix(model, soutes) {
  return Array.from({ length: 20 }, (_, i) => {
    const row = { n: i + 1, m: model.masseVide, cg: model.cgVide }
    soutes.forEach(s => { row[s.id] = { G: [], D: [] } })
    return row
  })
}

export const useMatrixStore = create((set) => ({
  model: null,
  soutes: [],
  matrix: [],
  ci: 0,

  init: (model, soutes, rawMatrix) => set(() => ({
    model,
    soutes,
    matrix: (rawMatrix || []).map(row =>
      slotsToRow(soutes, model, row.n, rowToSlots(soutes, row, ['av', 'c', 'ar']))
    ),
  })),

  setCi: (idx) => set({ ci: idx }),

  addBloc: (idx, souteId, side, forcedMaterial) => set((state) => {
    const { model, soutes, matrix } = state
    const s = soutes.find(x => x.id === souteId)
    const slots = rowToSlots(soutes, matrix[idx])
    const cur = slots[souteId][side]
    if (cur.length >= (s?.capacite || 5)) return state
    const rowKey = souteId
    const rowData = matrix[idx]?.[rowKey] || {}
    const nomNom = side === 'G' ? rowData.matG : rowData.matD
    const nomMat = nomNom ? (s.materiaux||[]).find(m => m.nom === nomNom) : null
    const mat = forcedMaterial || (cur.length > 0 ? cur[cur.length-1] : (nomMat || s.materiaux?.[0] || { nom: 'Laiton', masse: 71 }))
    slots[souteId] = { ...slots[souteId], [side]: [...cur, { ...mat }] }
    const newMatrix = [...matrix]
    newMatrix[idx] = slotsToRow(soutes, model, matrix[idx].n, slots)
    return { matrix: newMatrix }
  }),

  removeBloc: (idx, souteId, side) => set((state) => {
    const { model, soutes, matrix } = state
    const slots = rowToSlots(soutes, matrix[idx])
    const cur = slots[souteId][side]
    if (!cur.length) return state
    slots[souteId] = { ...slots[souteId], [side]: cur.slice(0, -1) }
    const newMatrix = [...matrix]
    newMatrix[idx] = slotsToRow(soutes, model, matrix[idx].n, slots)
    return { matrix: newMatrix }
  }),

  duplicateConfig: (sourceIdx, targetIdx) => set((state) => {
    const { matrix } = state
    if (!matrix[sourceIdx]) return state
    const newMatrix = [...matrix]
    newMatrix[targetIdx] = { ...JSON.parse(JSON.stringify(matrix[sourceIdx])), n: targetIdx + 1 }
    return { matrix: newMatrix, ci: targetIdx }
  }),
}))
