/**
 * MBI vNext - ESP32 Store
 */

import { create } from 'zustand';
import { ESP32_CONFIG } from '../utils/constants';

export const useESPStore = create((set, get) => ({
  connected: false,
  lastUpdate: null,
  error: null,
  
  data: {
    t_ms: null,
    temperature: null,
    pression: null,
    humidite: null,
    rho: null,
    vent_dir: null,
    vent_ms_ane: null,
    vent_ms_pitot: null,
    ntc_pitot: null,
    batt_v: null,
    iqa: null,
    bubble_event: false
  },
  
  windDirStats: {
    mean: null,
    sigma: null,
    delta: null
  },
  
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ error }),
  
  updateData: (newData) => {
    const now = Date.now();
    set({
      data: { ...get().data, ...newData },
      lastUpdate: now,
      connected: true,
      error: null
    });
  },
  
  updateWindStats: (stats) => {
    set({ windDirStats: stats });
  },
  
  isOnline: () => {
    const state = get();
    if (!state.connected) return false;
    if (!state.lastUpdate) return false;
    const age = Date.now() - state.lastUpdate;
    return age < ESP32_CONFIG.OFFLINE_TIMEOUT_MS;
  },
  
  getAge: () => {
    const state = get();
    if (!state.lastUpdate) return null;
    return Math.floor((Date.now() - state.lastUpdate) / 1000);
  },
  
  reset: () => set({
    connected: false,
    lastUpdate: null,
    error: null,
    data: {
      t_ms: null,
      temperature: null,
      pression: null,
      humidite: null,
      rho: null,
      vent_dir: null,
      vent_ms_ane: null,
      vent_ms_pitot: null,
      ntc_pitot: null,
      batt_v: null,
      iqa: null,
      bubble_event: false
    }
  })
}));