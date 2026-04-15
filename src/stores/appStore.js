import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // Param�tres m�t�o
      params: {
        vent: 8.0,
        pression: 1015,
       
        temperature: 15,
        rosee: 8,
      },

      // Param�tres planeur - CORRIG�S
      mv: 2.455,        // Masse � vide en kg
      surface: 59.0,    // Surface alaire en dm� (0.59 m� = 59 dm�) - PAR D�FAUT
      
      // Chronos
      chronoC: 40.0,    // Chrono cible
      chronoR: 40.0,    // Chrono r�alis�
      lievre: 38.0,     // Chrono li�vre

      // Offset
      offset: 0,        // Offset en grammes
 activeSite: { name: '', irp: 171, k: 1.000 },
      k_up: 1.00,
      alpha: 1.00,
altitude: 0,

      // Param�tre s�lectionn� pour contr�le
      selectedParam: 'vent',
      ballastSnap: { masse: 0, config: 0, cg: 0, planeur_id: '', planeur_nom: '', mv: 0, offset: 0, surface: 0 },

      // Actions param�tres m�t�o
      setActiveSite: (site) => set({ activeSite: site }),
      setParam: (key, value) =>
        set((state) => ({
          params: { ...state.params, [key]: value },
        })),

      incrementParam: (key) =>
        set((state) => {
          const step = key === 'vent' ? 0.1 : 1
          return {
            params: { ...state.params, [key]: state.params[key] + step },
          }
        }),

      decrementParam: (key) =>
        set((state) => {
          const step = key === 'vent' ? 0.1 : 1
          return {
            params: { ...state.params, [key]: Math.max(0, state.params[key] - step) },
          }
        }),

      // Actions planeur
      setMv: (value) => set({ mv: value }),
      setSurface: (value) => set({ surface: value }),

      // Actions chronos
      setChronoC: (value) => set({ chronoC: value }),
      setChronoR: (value) => set({ chronoR: value }),
      setLievre: (value) => set({ lievre: value }),

      // Actions offset (paliers de 42g)
      setOffset: (value) => set({ offset: value }),
      incrementOffset: () =>
        set((state) => ({
          offset: Math.min(800, state.offset + 42),
        })),
      decrementOffset: () =>
        set((state) => ({
          offset: Math.max(-400, state.offset - 42),
        })),
 setKUp: (value) => set({ k_up: value }),
      setAlpha: (value) => set({ alpha: value }),
      setAltitude: (value) => set({ altitude: value }), 
      // S�lection param�tre
      selectParam: (param) => set({ selectedParam: param }),
      setBallastSnap: (snap) => set({ ballastSnap: snap }),

      // Reset
      resetParams: () =>
        set({
          params: {
            vent: 8.0,
            pression: 1015,
        
            temperature: 15,
            rosee: 8,
          },
          mv: 2.455,
          surface: 59.0,
          chronoC: 40.0,
          chronoR: 40.0,
          lievre: 38.0,
          offset: 0,
        }),
    }),
    {
      name: 'mbi-app-storage',
      partialize: (state) => ({
        params: state.params,
        mv: state.mv,
        surface: state.surface,
        chronoC: state.chronoC,
        chronoR: state.chronoR,
        lievre: state.lievre,
        offset: state.offset,
        altitude: state.altitude,
        activeSite: state.activeSite,
        ballastSnap: state.ballastSnap,
        k_up: state.k_up,
        alpha: state.alpha,
        altitude: state.altitude   
      }),
    }
  )
)

export default useAppStore
export { useAppStore }
