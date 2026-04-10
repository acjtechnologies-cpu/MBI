/**
 * MBI vNext - App Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_VALUES, STORAGE_KEYS, PARAMS } from './constants';

export const useAppStore = create(
  persist(
    (set, get) => ({
      activeTab: 'pilote',
      setActiveTab: (tab) => set({ activeTab: tab }),

      selectedParam: null,
      selectParam: (param) => {
        if (!PARAMS[param]) return;
        set({ selectedParam: param });
        
        if (get()._selectTimer) clearTimeout(get()._selectTimer);
        const timer = setTimeout(() => {
          set({ selectedParam: null });
        }, 600);
        set({ _selectTimer: timer });
      },
      clearParamSelection: () => {
        if (get()._selectTimer) clearTimeout(get()._selectTimer);
        set({ selectedParam: null, _selectTimer: null });
      },
      _selectTimer: null,

      values: { ...DEFAULT_VALUES },
      
      setValue: (key, value) => {
        const values = get().values;
        set({ values: { ...values, [key]: value } });
      },
      
      setValues: (updates) => {
        const values = get().values;
        set({ values: { ...values, ...updates } });
      },
      
      updateValue: (param, delta) => {
        const config = PARAMS[param];
        if (!config) return;
        
        const current = get().values[param];
        let newValue = current + delta;
        newValue = Math.max(config.min, Math.min(config.max, newValue));
        
        if (param === 'vent') {
          newValue = Math.round(newValue * 2) / 2;
        }
        
        get().setValue(param, newValue);
      },
      
      resetValues: () => {
        set({ 
          values: { ...DEFAULT_VALUES },
          selectedParam: null,
          invertSoute: false,
          lastMixSide: 'D'
        });
      },

      invertSoute: false,
      lastMixSide: 'D',
      
      toggleInvertSoute: () => {
        set({ invertSoute: !get().invertSoute });
      },
      
      setLastMixSide: (side) => {
        set({ lastMixSide: side });
      },

      cooldownActive: false,
      setCooldown: (active) => {
        set({ cooldownActive: active });
        if (active) {
          setTimeout(() => set({ cooldownActive: false }), 600);
        }
      }
    }),
    {
      name: STORAGE_KEYS.VALUES,
      partialize: (state) => ({
        values: state.values,
        selectedParam: state.selectedParam,
        invertSoute: state.invertSoute,
        lastMixSide: state.lastMixSide
      })
    }
  )
);