import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * STORE MODELES - Gestion des planeurs F3F
 * Matrice constructeur intégrée par planeur
 * Compatible avec NewSolver.js dynamique
 */

// Matrice Mamba S — 20 configs constructeur validées
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


// Modèle par défaut — Pike Precision 2
const DEFAULT_PIKE2 = {
  id: 'pike-precision-2',
  nom: 'Pike Precision 2',
  drapeau: '🇩🇪',
  constructeur: 'Pikurus',
  masseVide: 2332,
  cgVide: 97.0,
  surface: 55,
  offset: 1,
  version: '1.0',
  poly4: {
    type: 'table',
    vent:  [4.05,4.23,4.41,4.61,4.82,5.04,5.28,5.53,5.80,6.10,6.42,6.78,7.17,7.61,8.10,8.65,9.28,9.99,10.78,11.65,12.60,13.70,15.30],
    masse: [2.300,2.385,2.470,2.555,2.640,2.725,2.810,2.895,2.980,3.065,3.150,3.235,3.320,3.405,3.490,3.575,3.660,3.745,3.830,3.915,4.000,4.085,4.170]
  },
  matrix: [
    {n:1,  m:2500, cg:96.2, av:{G:[{nom:'Laiton',masse:42}],D:[]}, ar:{G:[{nom:'Laiton',masse:126}],D:[]}},
    {n:2,  m:2584, cg:97.1, av:{G:[{nom:'Laiton',masse:21}],D:[{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:63}]}},
    {n:3,  m:2670, cg:96.6, av:{G:[{nom:'Laiton',masse:42}],D:[{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126}]}},
    {n:4,  m:2714, cg:97.3, av:{G:[{nom:'Laiton',masse:21},{nom:'Laiton',masse:42}],D:[{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:63},{nom:'Laiton',masse:126}]}},
    {n:5,  m:2799, cg:96.9, av:{G:[{nom:'Laiton',masse:21},{nom:'Laiton',masse:42}],D:[{nom:'Laiton',masse:21},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:63},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:63},{nom:'Laiton',masse:126}]}},
    {n:6,  m:2884, cg:97.6, av:{G:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}],D:[{nom:'Laiton',masse:21},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:63},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}]}},
    {n:7,  m:2969, cg:97.1, av:{G:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}],D:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}]}},
    {n:8,  m:3054, cg:97.7, av:{G:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}],D:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}]}},
    {n:9,  m:3118, cg:97.2, av:{G:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}],D:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}]}},
    {n:10, m:3350, cg:97.0, av:{G:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}],D:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}]}},
    {n:11, m:3484, cg:97.5, av:{G:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}],D:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}]}},
    {n:12, m:3569, cg:97.1, av:{G:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}],D:[{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}]}},
    {n:13, m:3654, cg:97.3, av:{G:[{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}],D:[{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}]}},
    {n:14, m:3794, cg:97.0, av:{G:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}],D:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}]}},
    {n:15, m:3879, cg:97.4, av:{G:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}],D:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}]}},
    {n:16, m:3824, cg:97.1, av:{G:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}],D:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:21}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:63}]}},
    {n:17, m:4242, cg:97.0, av:{G:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}],D:[{nom:'Tungsten',masse:70},{nom:'Tungsten',masse:70},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42},{nom:'Laiton',masse:42}]}, ar:{G:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}],D:[{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126},{nom:'Laiton',masse:126}]}}
  ],
  soutes: {
    'avant': {
      id: 'avant',
      nom: 'Avant Aile',
      couleur: '#ffd700',
      distanceBA: 78,
      capacite: 5,
      materiaux: [
        { nom: 'Tungsten', masse: 70, stock: 2 },
        { nom: 'Laiton',   masse: 42, stock: 3 },
        { nom: 'Laiton',   masse: 21, stock: 1 }
      ]
    },
    'arriere': {
      id: 'arriere',
      nom: 'Arrière Aile',
      couleur: '#3fb950',
      distanceBA: 118,
      capacite: 5,
      materiaux: [
        { nom: 'Laiton', masse: 126, stock: 5 },
        { nom: 'Laiton', masse: 63,  stock: 1 }
      ]
    }
  }
}
// Modele par defaut — Mamba S avec matrice intégrée
const DEFAULT_MODEL = {
  id: 'mamba-s',
  nom: 'Mamba S',
  drapeau: '🇫🇷',
  masseVide: 2550,
  cgVide: 102,
  surface: 59,
  offset: -144,
  version: '1.0',
  matrix: MATRIX_MAMBA,
  soutes: {
    'avant-cle': {
      id: 'avant-cle',
      nom: 'Avant Clé',
      couleur: '#6b7280',
      distanceBA: 80,
      capacite: 3,
      materiaux: [
        { nom: 'Laiton', masse: 71, stock: 3 }
      ]
    },
    'centrale-cle': {
      id: 'centrale-cle',
      nom: 'Centrale Clé',
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
      nom: 'Arrière Aile',
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
        'pike-precision-2': DEFAULT_PIKE2
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
          drapeau: m.drapeau || '🛩️',
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


      addSoute: (modelId, soute) => {
        set((state) => {
          if (!state.models?.[modelId]) return state
          return {
            models: {
              ...state.models,
              [modelId]: {
                ...state.models[modelId],
                soutes: { ...state.models[modelId].soutes, [soute.id]: soute }
              }
            }
          }
        })
      },

      updateSoute: (modelId, souteId, updates) => {
        set((state) => {
          if (!state.models?.[modelId]?.soutes?.[souteId]) return state
          return {
            models: {
              ...state.models,
              [modelId]: {
                ...state.models[modelId],
                soutes: {
                  ...state.models[modelId].soutes,
                  [souteId]: { ...state.models[modelId].soutes[souteId], ...updates }
                }
              }
            }
          }
        })
      },

      deleteSoute: (modelId, souteId) => {
        set((state) => {
          if (!state.models?.[modelId]) return state
          const newSoutes = { ...state.models[modelId].soutes }
          delete newSoutes[souteId]
          return {
            models: {
              ...state.models,
              [modelId]: { ...state.models[modelId], soutes: newSoutes }
            }
          }
        })
      },

      duplicateModel: (modelId) => {
        set((state) => {
          if (!state.models?.[modelId]) return state
          const src = state.models[modelId]
          const newId = 'model-' + Date.now()
          const copy = { ...src, id: newId, nom: src.nom + ' (copie)' }
          return { models: { ...state.models, [newId]: copy } }
        })
      },      exportModel: (modelId) => {
        const state = get()
        if (!state.models?.[modelId]) return null
        return JSON.stringify(state.models[modelId], null, 2)
      },

      // Reset modèle aux valeurs par défaut
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
      version: 2,
      partialize: (state) => ({
        models: Object.fromEntries(Object.entries(state.models).filter(([k]) => k !== 'pike-precision-2')),
        activeModelId: state.activeModelId
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true)
          if (!state.models) {
            state.models = { 'mamba-s': DEFAULT_MODEL, 'pike-precision-2': DEFAULT_PIKE2 }
            state.activeModelId = 'mamba-s'
          } else {
            if (state.models['mamba-s'] && !state.models['mamba-s'].matrix) {
              state.models['mamba-s'] = { ...state.models['mamba-s'], matrix: MATRIX_MAMBA, offset: state.models['mamba-s'].offset || -144 }
            }
            if (!state.models['pike-precision-2'] || !state.models['pike-precision-2'].matrix) {
              state.models['pike-precision-2'] = DEFAULT_PIKE2
            }
          }
        }
      }
    }
  )
)
export default useModelStore
export { useModelStore }
