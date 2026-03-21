import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * STORE MODELES - Gestion des planeurs F3F
 * Matrice constructeur intÃ©grÃ©e par planeur
 * Compatible avec NewSolver.js dynamique
 */

// Matrice Mamba S â€” 20 configs constructeur validÃ©es
const MATRIX_MAMBA = [
  {n: 1, m:2726, cg:102.2, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:1,D:1,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 2, m:2814, cg:102.2, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:2,D:1,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 3, m:2902, cg:102.2, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:2,D:2,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 4, m:2990, cg:102.4, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:2,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 5, m:3078, cg:102.4, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 6, m:3149, cg:102.0, av:{G:1,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 7, m:3220, cg:102.7, av:{G:1,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 8, m:3291, cg:102.8, av:{G:1,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 9, m:3362, cg:102.8, av:{G:1,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:1,matG:'Laiton',matD:'Laiton'}},
  {n:10, m:3433, cg:102.8, av:{G:2,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:1,matG:'Laiton',matD:'Laiton'}},
  {n:11, m:3504, cg:102.8, av:{G:2,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:1,matG:'Laiton',matD:'Laiton'}},
  {n:12, m:3575, cg:102.8, av:{G:2,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:13, m:3646, cg:103.1, av:{G:2,D:2,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:14, m:3717, cg:103.1, av:{G:3,D:2,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:15, m:3788, cg:102.3, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:16, m:3859, cg:102.3, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:3,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:17, m:3930, cg:103.2, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:3,D:3,matG:'Laiton',matD:'Laiton'}},
  {n:18, m:4001, cg:104.0, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:4,D:3,matG:'Laiton',matD:'Laiton'}},
  {n:19, m:4072, cg:102.8, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:4,D:4,matG:'Laiton',matD:'Laiton'}},
  {n:20, m:4072, cg:102.8, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:4,D:4,matG:'Laiton',matD:'Laiton'}}
]


// ══ PIKE PRECISION 2 — 17 configs constructeur ══
const MATRIX_PIKE2 = [
  {n:1,  m:2500, cg:96.2, av:{G:1,D:0,matG:'Laiton42',matD:'Laiton42'},    ar:{G:1,D:0,matG:'Laiton126',matD:'Laiton126'}},
  {n:2,  m:2584, cg:97.1, av:{G:1,D:1,matG:'Laiton21',matD:'Laiton42'},    ar:{G:1,D:1,matG:'Laiton126',matD:'Laiton63'}},
  {n:3,  m:2670, cg:96.6, av:{G:1,D:1,matG:'Laiton42',matD:'Laiton42'},    ar:{G:1,D:1,matG:'Laiton126',matD:'Laiton126'}},
  {n:4,  m:2714, cg:97.3, av:{G:2,D:1,matG:'Laiton42',matD:'Laiton42'},    ar:{G:1,D:2,matG:'Laiton126',matD:'Laiton126'}},
  {n:5,  m:2799, cg:96.9, av:{G:2,D:2,matG:'Laiton42',matD:'Laiton42'},    ar:{G:2,D:2,matG:'Laiton126',matD:'Laiton126'}},
  {n:6,  m:2884, cg:97.6, av:{G:2,D:2,matG:'Laiton42',matD:'Laiton42'},    ar:{G:2,D:2,matG:'Laiton126',matD:'Laiton126'}},
  {n:7,  m:2969, cg:97.1, av:{G:2,D:2,matG:'Laiton42',matD:'Laiton42'},    ar:{G:2,D:2,matG:'Laiton126',matD:'Laiton126'}},
  {n:8,  m:3054, cg:97.7, av:{G:3,D:2,matG:'Laiton42',matD:'Laiton42'},    ar:{G:2,D:3,matG:'Laiton126',matD:'Laiton126'}},
  {n:9,  m:3118, cg:97.2, av:{G:3,D:3,matG:'Laiton42',matD:'Laiton42'},    ar:{G:3,D:3,matG:'Laiton126',matD:'Laiton126'}},
  {n:10, m:3350, cg:97.0, av:{G:3,D:3,matG:'Laiton42',matD:'Laiton42'},    ar:{G:3,D:3,matG:'Laiton126',matD:'Laiton126'}},
  {n:11, m:3484, cg:97.5, av:{G:4,D:3,matG:'Laiton42',matD:'Laiton42'},    ar:{G:3,D:4,matG:'Laiton126',matD:'Laiton126'}},
  {n:12, m:3569, cg:97.1, av:{G:4,D:4,matG:'Laiton42',matD:'Laiton42'},    ar:{G:4,D:4,matG:'Laiton126',matD:'Laiton126'}},
  {n:13, m:3654, cg:97.3, av:{G:4,D:4,matG:'Tungsten70',matD:'Tungsten70'},ar:{G:4,D:4,matG:'Laiton126',matD:'Laiton126'}},
  {n:14, m:3794, cg:97.0, av:{G:4,D:4,matG:'Tungsten70',matD:'Tungsten70'},ar:{G:4,D:4,matG:'Laiton126',matD:'Laiton126'}},
  {n:15, m:3879, cg:97.4, av:{G:4,D:5,matG:'Tungsten70',matD:'Tungsten70'},ar:{G:5,D:4,matG:'Laiton126',matD:'Laiton126'}},
  {n:16, m:3824, cg:97.1, av:{G:5,D:5,matG:'Tungsten70',matD:'Tungsten70'},ar:{G:5,D:5,matG:'Laiton126',matD:'Laiton126'}},
  {n:17, m:4242, cg:97.0, av:{G:5,D:5,matG:'Tungsten70',matD:'Tungsten70'},ar:{G:5,D:5,matG:'Laiton126',matD:'Laiton126'}},
]
const DEFAULT_MODEL_PIKE2 = {
  id: 'pike-precision-2',
  nom: 'Pike Precision 2',
  drapeau: 'DE',
  masseVide: 2332,
  cgVide: 97.0,
  surface: 66,
  offset: 1,
  version: '1.0',
  matrix: MATRIX_PIKE2,
  soutes: {
    'avant-cle': {
      id: 'avant-cle', nom: 'Small Ballast', couleur: '#c8a030',
      distanceBA: 54, capacite: 5,
      materiaux: [
        { nom: 'Laiton21',   masse: 21,  stock: null },
        { nom: 'Laiton42',   masse: 42,  stock: null },
        { nom: 'Tungsten70', masse: 70,  stock: null },
      ]
    },
    'centrale-cle': null,
    'arriere-aile': {
      id: 'arriere-aile', nom: 'Big Ballast', couleur: '#708090',
      distanceBA: 118, capacite: 5,
      materiaux: [
        { nom: 'Laiton63',  masse: 63,  stock: null },
        { nom: 'Laiton126', masse: 126, stock: null },
      ]
    }
  }
}

// Modele par defaut â€” Mamba S avec matrice intÃ©grÃ©e
const DEFAULT_MODEL = {
  id: 'mamba-s',
  nom: 'Mamba S',
  drapeau: 'ðŸ‡«ðŸ‡·',
  masseVide: 2550,
  cgVide: 102,
  surface: 59,
  offset: -144,
  version: '1.0',
  matrix: MATRIX_MAMBA,
  soutes: {
    'avant-cle': {
      id: 'avant-cle',
      nom: 'Avant ClÃ©',
      couleur: '#6b7280',
      distanceBA: 80,
      capacite: 3,
      materiaux: [
        { nom: 'Laiton', masse: 71, stock: 3 }
      ]
    },
    'centrale-cle': {
      id: 'centrale-cle',
      nom: 'Centrale ClÃ©',
      couleur: '#3b82f6',
      distanceBA: 102,
      capacite: 3,
      materiaux: [
        { nom: 'Laiton', masse: 71, stock: 0 },
        { nom: 'Plomb', masse: 88, stock: 3 }
      ]
    },
    'arriere-aile': {
      id: 'arriere-aile',
      nom: 'ArriÃ¨re Aile',
      couleur: '#6b7280',
      distanceBA: 129,
      capacite: 4,
      materiaux: [
        { nom: 'Laiton', masse: 71, stock: 4 },
        { nom: 'Lourd', masse: 200, stock: 0 },
        { nom: 'Tres lourd', masse: 300, stock: 0 }
      ]
    }
  }
}

const useModelStore = create(
  persist(
    (set, get) => ({
      models: {
        'mamba-s': DEFAULT_MODEL,
        'pike-precision-2': DEFAULT_MODEL_PIKE2,
        'pike-precision-2': DEFAULT_MODEL_PIKE2
      },
      activeModelId: 'mamba-s',
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      getActiveModel: () => {
        const state = get()
        if (!state.models || !state.activeModelId) return null
        return state.models[state.activeModelId] || null
      },

      setActiveModel: (modelId) => {
        const state = get()
        if (state.models && state.models[modelId]) {
          set({ activeModelId: modelId })
        }
      },

      // Import depuis JSON (GitHub ou fichier local)
      importModel: (jsonData) => {
        try {
          const model = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
          if (!model.id || !model.nom) throw new Error('Format invalide')
          set((state) => ({
            models: { ...state.models, [model.id]: model }
          }))
          return { ok: true, nom: model.nom }
        } catch (e) {
          console.error('Import error:', e)
          return { ok: false, error: e.message }
        }
      },

      // Charger depuis GitHub
      loadFromGitHub: async (url) => {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error('HTTP ' + res.status)
          const model = await res.json()
          if (!model.id || !model.nom) throw new Error('Format invalide')
          set((state) => ({
            models: { ...state.models, [model.id]: model }
          }))
          return { ok: true, nom: model.nom }
        } catch (e) {
          return { ok: false, error: e.message }
        }
      },

      // Liste des planeurs disponibles
      getModelsList: () => {
        const state = get()
        return Object.values(state.models || {}).map(m => ({
          id: m.id,
          nom: m.nom,
          drapeau: m.drapeau || 'ðŸ›©ï¸',
          masseVide: m.masseVide,
          hasMatrix: !!(m.matrix && m.matrix.length > 0)
        }))
      },

      createModel: (model) => {
        set((state) => ({
          models: { ...state.models, [model.id]: model }
        }))
      },

      updateModel: (modelId, updates) => {
        set((state) => {
          if (!state.models?.[modelId]) return state
          return {
            models: {
              ...state.models,
              [modelId]: { ...state.models[modelId], ...updates }
            }
          }
        })
      },

      deleteModel: (modelId) => {
        set((state) => {
          if (!state.models) return state
          const newModels = { ...state.models }
          delete newModels[modelId]
          let newActiveId = state.activeModelId
          if (modelId === state.activeModelId) {
            const ids = Object.keys(newModels)
            newActiveId = ids.length > 0 ? ids[0] : null
          }
          return { models: newModels, activeModelId: newActiveId }
        })
      },

      exportModel: (modelId) => {
        const state = get()
        if (!state.models?.[modelId]) return null
        return JSON.stringify(state.models[modelId], null, 2)
      },

      // Reset modÃ¨le aux valeurs par dÃ©faut
      resetModel: (modelId) => {
        if (modelId === 'mamba-s') {
          set((state) => ({
            models: { ...state.models, 'mamba-s': DEFAULT_MODEL }
          }))
        }
      }
    }),
    {
      name: 'mbi-model-storage',
      partialize: (state) => ({
        models: state.models,
        activeModelId: state.activeModelId
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
          // VÃ©rifier que la matrice Mamba est bien prÃ©sente
          if (!state.models) {
            state.models = { 'mamba-s': DEFAULT_MODEL, 'pike-precision-2': DEFAULT_MODEL_PIKE2 }
            state.activeModelId = 'mamba-s'
          } else if (state.models['mamba-s'] && !state.models['mamba-s'].matrix) {
            // Migrer: ajouter la matrice si absente
            state.models['mamba-s'] = {
              ...state.models['mamba-s'],
              matrix: MATRIX_MAMBA,
              offset: state.models['mamba-s'].offset || -144
            }
          }
        }
      }
    }
  )
)

export default useModelStore
export { useModelStore }

