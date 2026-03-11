import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * STORE MODÃˆLES - Gestion des planeurs F3F
 * InspirÃ© de l'APK Ballast F3F
 */

// ModÃ¨le par dÃ©faut
const DEFAULT_MODEL = {
  id: 'mamba-s',
  nom: 'Mamba S',
  drapeau: 'ðŸ‡«ðŸ‡·',
  masseVide: 2550,
  cgVide: 102,
  surface: 59,
  soutes: {
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
    'avant-cle': {
      id: 'avant-cle',
      nom: 'Avant ClÃ©',
      couleur: '#6b7280',
      distanceBA: 80,
      capacite: 3,
      materiaux: [
        { nom: 'Laiton', masse: 71, stock: 3 }
      ]
    }
  }
}

const useModelStore = create(
  persist(
    (set, get) => ({
      // Ã‰tat initial
      models: {
        'mamba-s': DEFAULT_MODEL
      },
      activeModelId: 'mamba-s',
      _hasHydrated: false,
      
      // Marquer comme hydratÃ©
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
      
      // Actions
      getActiveModel: () => {
        const state = get()
        if (!state.models || !state.activeModelId) {
          return null
        }
        return state.models[state.activeModelId] || null
      },
      
      setActiveModel: (modelId) => {
        const state = get()
        if (state.models && state.models[modelId]) {
          set({ activeModelId: modelId })
        }
      },
      
      createModel: (model) => {
        set((state) => ({
          models: {
            ...state.models,
            [model.id]: model
          }
        }))
      },
      
      updateModel: (modelId, updates) => {
        set((state) => {
          if (!state.models || !state.models[modelId]) {
            return state
          }
          
          return {
            models: {
              ...state.models,
              [modelId]: {
                ...state.models[modelId],
                ...updates
              }
            }
          }
        })
      },
      
      deleteModel: (modelId) => {
        set((state) => {
          if (!state.models) return state
          
          const newModels = { ...state.models }
          delete newModels[modelId]
          
          // Si on supprime le modÃ¨le actif, prendre le premier disponible
          let newActiveId = state.activeModelId
          if (modelId === state.activeModelId) {
            const modelIds = Object.keys(newModels)
            newActiveId = modelIds.length > 0 ? modelIds[0] : null
          }
          
          return {
            models: newModels,
            activeModelId: newActiveId
          }
        })
      },
      
      duplicateModel: (modelId) => {
        set((state) => {
          if (!state.models || !state.models[modelId]) {
            return state
          }
          
          const original = state.models[modelId]
          const newId = `${modelId}-copy-${Date.now()}`
          const newModel = {
            ...JSON.parse(JSON.stringify(original)),
            id: newId,
            nom: `${original.nom} (Copie)`
          }
          
          return {
            models: {
              ...state.models,
              [newId]: newModel
            }
          }
        })
      },
      
      // Gestion des soutes
      addSoute: (modelId, soute) => {
        set((state) => {
          if (!state.models || !state.models[modelId]) {
            return state
          }
          
          const model = state.models[modelId]
          
          return {
            models: {
              ...state.models,
              [modelId]: {
                ...model,
                soutes: {
                  ...(model.soutes || {}),
                  [soute.id]: soute
                }
              }
            }
          }
        })
      },
      
      updateSoute: (modelId, souteId, updates) => {
        set((state) => {
          if (!state.models || !state.models[modelId]) {
            return state
          }
          
          const model = state.models[modelId]
          if (!model.soutes || !model.soutes[souteId]) {
            return state
          }
          
          return {
            models: {
              ...state.models,
              [modelId]: {
                ...model,
                soutes: {
                  ...model.soutes,
                  [souteId]: {
                    ...model.soutes[souteId],
                    ...updates
                  }
                }
              }
            }
          }
        })
      },
      
      deleteSoute: (modelId, souteId) => {
        set((state) => {
          if (!state.models || !state.models[modelId]) {
            return state
          }
          
          const model = state.models[modelId]
          if (!model.soutes) {
            return state
          }
          
          const newSoutes = { ...model.soutes }
          delete newSoutes[souteId]
          
          return {
            models: {
              ...state.models,
              [modelId]: {
                ...model,
                soutes: newSoutes
              }
            }
          }
        })
      },
      
      // Export/Import
      exportModel: (modelId) => {
        const state = get()
        if (!state.models || !state.models[modelId]) {
          return null
        }
        
        const model = state.models[modelId]
        const json = JSON.stringify(model, null, 2)
        return json
      },
      
      importModel: (jsonString) => {
        try {
          const model = JSON.parse(jsonString)
          
          // Valider le format
          if (!model.id || !model.nom) {
            throw new Error('Format invalide')
          }
          
          set((state) => ({
            models: {
              ...state.models,
              [model.id]: model
            }
          }))
          
          return true
        } catch (error) {
          console.error('Erreur import:', error)
          return false
        }
      },
      
      // Conversion pour le solver (format compatible)
      getConfigForSolver: (modelId) => {
        const state = get()
        if (!state.models || !state.models[modelId]) {
          return null
        }
        
        const model = state.models[modelId]
        const soutes = model.soutes ? Object.values(model.soutes) : []
        
        // IMPORTANT : Trier les soutes par position (AV < C < AR)
        const soutesSorted = [...soutes].sort((a, b) => {
          const posA = a.distanceBA - model.cgVide
          const posB = b.distanceBA - model.cgVide
          return posA - posB
        })
        
        // Collecter TOUS les matÃ©riaux uniques de toutes les soutes
        // NOUVEAU : Ignorer les matÃ©riaux avec masse = 0
        const allMateriaux = []
        soutesSorted.forEach(soute => {
          if (soute.materiaux) {
            soute.materiaux.forEach(mat => {
              // Ignorer si masse = 0 ou invalide
              if (mat.masse > 0 && !allMateriaux.find(m => m.masse === mat.masse)) {
                allMateriaux.push(mat)
              }
            })
          }
        })
        
        // Trier par masse croissante
        allMateriaux.sort((a, b) => a.masse - b.masse)
        
        // Pour chaque soute, calculer position relative au CG
        const config = {
          distance_ba: model.cgVide
        }
        
        soutesSorted.forEach((soute, index) => {
          const key = ['av', 'c', 'ar'][index] || `s${index}`
          
          // Position relative au CG
          config[`x_${key}`] = soute.distanceBA - model.cgVide
          config[`cap_${key}`] = soute.capacite
        })
        
        // Assigner les matÃ©riaux uniques trouvÃ©s (max 3)
        const mats = ['W', 'L', 'B']
        allMateriaux.slice(0, 3).forEach((mat, i) => {
          config[`m_${mats[i]}`] = mat.masse
        })
        
        // IMPORTANT : Ne PAS ajouter de matÃ©riaux par dÃ©faut
        // Si l'utilisateur n'a configurÃ© qu'un seul matÃ©riau, utiliser seulement celui-lÃ 
        // Le solver doit gÃ©rer le cas oÃ¹ il y a moins de 3 matÃ©riaux
        
        return config
      }
    }),
    {
      name: 'mbi-model-storage',
      partialize: (state) => ({
        models: state.models,
        activeModelId: state.activeModelId
      }),
      onRehydrateStorage: () => (state) => {
        // AppelÃ© aprÃ¨s la rÃ©hydratation du store
        if (state) {
          state.setHasHydrated(true)
          
          // VÃ©rifier que les donnÃ©es sont valides
          if (!state.models || Object.keys(state.models).length === 0) {
            state.models = { 'mamba-s': DEFAULT_MODEL }
            state.activeModelId = 'mamba-s'
          }
        }
      }
    }
  )
)

export default useModelStore
export { useModelStore }


