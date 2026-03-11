/**
 * MBI vNext - Soute Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SOUTE_CONFIG, STORAGE_KEYS, MATERIALS } from '../utils/constants';

export const useSouteStore = create(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_SOUTE_CONFIG },
      
      setConfig: (updates) => {
        set({ config: { ...get().config, ...updates } });
      },
      
      resetConfig: () => {
        set({ config: { ...DEFAULT_SOUTE_CONFIG } });
      },
      
      state: {
        G: { av: { n: 0, code: 'B' }, ar: { n: 0, code: 'B' } },
        D: { av: { n: 0, code: 'B' }, ar: { n: 0, code: 'B' } },
        C: { n: 0, code: 'B' }
      },
      
      updateChamber: (side, pack, updates) => {
        const state = get().state;
        if (side === 'C') {
          set({ state: { ...state, C: { ...state.C, ...updates } } });
        } else {
          set({
            state: {
              ...state,
              [side]: {
                ...state[side],
                [pack]: { ...state[side][pack], ...updates }
              }
            }
          });
        }
      },
      
      resetState: () => {
        set({
          state: {
            G: { av: { n: 0, code: 'B' }, ar: { n: 0, code: 'B' } },
            D: { av: { n: 0, code: 'B' }, ar: { n: 0, code: 'B' } },
            C: { n: 0, code: 'B' }
          }
        });
      },
      
      getMassOfCode: (code) => {
        const config = get().config;
        if (code === 'B') return config.m_B;
        if (code === 'L') return config.m_L;
        if (code === 'W') return config.m_W;
        return 0;
      },
      
      getPackMass: (side, pack) => {
        const state = get().state;
        if (side === 'C') {
          return state.C.n * get().getMassOfCode(state.C.code);
        }
        const chamber = state[side][pack];
        return chamber.n * get().getMassOfCode(chamber.code);
      },
      
      getTotalMass: () => {
        const g_av = get().getPackMass('G', 'av');
        const g_ar = get().getPackMass('G', 'ar');
        const d_av = get().getPackMass('D', 'av');
        const d_ar = get().getPackMass('D', 'ar');
        const c = get().getPackMass('C', null);
        return g_av + g_ar + d_av + d_ar + c;
      },
      
      computeCG: (mv_kg) => {
        const config = get().config;
        const mv_g = mv_kg * 1000;
        
        const m_av = get().getPackMass('G', 'av') + get().getPackMass('D', 'av');
        const m_ar = get().getPackMass('G', 'ar') + get().getPackMass('D', 'ar');
        const m_c = get().getPackMass('C', null);
        const m_total = m_av + m_ar + m_c;
        
        const moment = (m_av * config.x_av) + (m_ar * config.x_ar) + (m_c * config.x_c);
        const denom = mv_g + m_total;
        const delta_cg = denom > 0 ? (moment / denom) : 0;
        
        return {
          delta_cg_mm: delta_cg,
          m_ballast_g: m_total,
          m_total_kg: (mv_g + m_total) / 1000
        };
      }
    }),
    {
      name: STORAGE_KEYS.SOUTE_STATE,
      partialize: (state) => ({
        config: state.config,
        state: state.state
      })
    }
  )
);