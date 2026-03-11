import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSouteStore = create(
  persist(
    (set, get) => ({
      // Configuration (axes et capacités)
      config: {
        // AXES CORRECTS (relatifs au CG)
        x_av: -55,     // Position AV en mm (AVANT le CG = négatif)
        x_c: 0,        // Position Central en mm
        x_ar: 22,      // Position AR en mm (APRÈS le CG = positif)
        
        // Masses matériaux
        m_W: 164,      // Masse Tungstène (g) - Mamba
        m_L: 96,       // Masse Plomb (g) - Mamba
        m_B: 71,       // Masse Laiton (g) - Mamba
        
        // Capacités
        cap_av: 6,     // Capacité AV (par côté)
        cap_c: 6,      // Capacité Central (par côté)
        cap_ar: 6,     // Capacité AR (par côté)
        
        // Référence CG
        distance_ba: 102, // Distance Bord Attaque → CG 0 (mm)
      },

      // État de la soute
      state: {
        gauche: {
          av: [],
          c: [],
          ar: [],
        },
        droite: {
          av: [],
          c: [],
          ar: [],
        },
      },

      // Profils sauvegardés
      profiles: {},

      // Actions
      setConfig: (newConfig) => set({ config: { ...get().config, ...newConfig } }),

      setState: (newState) => set({ state: newState }),

      addMaterial: (side, pack, material) =>
        set((state) => {
          const newState = { ...state.state }
          const capacity = state.config[`cap_${pack}`]
          
          if (newState[side][pack].length < capacity) {
            newState[side] = {
              ...newState[side],
              [pack]: [...newState[side][pack], material],
            }
          }
          
          return { state: newState }
        }),

      removeMaterial: (side, pack, index) =>
        set((state) => {
          const newState = { ...state.state }
          newState[side] = {
            ...newState[side],
            [pack]: newState[side][pack].filter((_, i) => i !== index),
          }
          return { state: newState }
        }),

      clearSoute: () =>
        set({
          state: {
            gauche: { av: [], c: [], ar: [] },
            droite: { av: [], c: [], ar: [] },
          },
        }),

      getTotalMass: () => {
        const state = get().state
        const config = get().config
        let total = 0

        const count = (arr) => arr.reduce((sum, mat) => {
          return sum + (config[`m_${mat}`] || 0)
        }, 0)

        total += count(state.gauche.av)
        total += count(state.gauche.c)
        total += count(state.gauche.ar)
        total += count(state.droite.av)
        total += count(state.droite.c)
        total += count(state.droite.ar)

        return total
      },

      getCG: () => {
        const state = get().state
        const config = get().config
        let moment = 0
        let totalMass = 0

        const addMoment = (arr, x) => {
          arr.forEach((mat) => {
            const m = config[`m_${mat}`] || 0
            totalMass += m
            moment += m * x
          })
        }

        addMoment(state.gauche.av, config.x_av)
        addMoment(state.gauche.c, config.x_c)
        addMoment(state.gauche.ar, config.x_ar)
        addMoment(state.droite.av, config.x_av)
        addMoment(state.droite.c, config.x_c)
        addMoment(state.droite.ar, config.x_ar)

        return totalMass > 0 ? moment / totalMass : 0
      },

      getCompartmentCounts: () => {
        const state = get().state
        return {
          gauche_av: state.gauche.av.length,
          gauche_c: state.gauche.c.length,
          gauche_ar: state.gauche.ar.length,
          droite_av: state.droite.av.length,
          droite_c: state.droite.c.length,
          droite_ar: state.droite.ar.length,
        }
      },

      saveProfile: (name) => {
        const state = get().state
        set((store) => ({
          profiles: {
            ...store.profiles,
            [name]: { ...state },
          },
        }))
      },

      loadProfile: (name) => {
        const profiles = get().profiles
        if (profiles[name]) {
          set({ state: profiles[name] })
        }
      },

      deleteProfile: (name) =>
        set((store) => {
          const newProfiles = { ...store.profiles }
          delete newProfiles[name]
          return { profiles: newProfiles }
        }),
    }),
    {
      name: 'mbi-soute-storage',
      partialize: (state) => ({
        config: state.config,
        state: state.state,
        profiles: state.profiles,
      }),
    }
  )
)

export default useSouteStore
export { useSouteStore }
