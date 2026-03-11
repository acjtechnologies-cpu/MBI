/**
 * MBI vNext - IQA Store
 */

import { create } from 'zustand';

export const useIQAStore = create((set, get) => ({
  buffers: {
    pitot: [],
    vent: [],
    temp: []
  },
  
  lastIQA: {
    value: null,
    state: null,
    action: null,
    labels: { pitot: '—', vent: '—', temp: '—' },
    timestamp: null
  },
  
  espIQA: {
    value: null,
    bubble_event: false,
    timestamp: null
  },
  
  runCapture: {
    active: false,
    startTime: null,
    samples: [],
    lastResult: null
  },
  
  pushSample: (type, value) => {
    const buffers = get().buffers;
    const now = Date.now();
    const buffer = [...buffers[type], { v: value, t: now }];
    const maxAge = 120000;
    const filtered = buffer.filter(s => (now - s.t) <= maxAge);
    set({ buffers: { ...buffers, [type]: filtered } });
  },
  
  computeIQA: () => {
    const { computeIQA: compute } = require('../utils/iqa');
    const buffers = get().buffers;
    const result = compute(buffers);
    set({ lastIQA: result });
    return result;
  },
  
  setESPIQA: (value, bubble_event) => {
    set({
      espIQA: {
        value,
        bubble_event,
        timestamp: Date.now()
      }
    });
  },
  
  clearBuffers: () => {
    set({ buffers: { pitot: [], vent: [], temp: [] } });
  },
  
  reset: () => {
    set({
      buffers: { pitot: [], vent: [], temp: [] },
      lastIQA: {
        value: null,
        state: null,
        action: null,
        labels: { pitot: '—', vent: '—', temp: '—' },
        timestamp: null
      }
    });
  }
}));
```

**Sauvegarde** (Ctrl+S)

---

## ✅ **GROUPE 2 TERMINÉ !**

Tu as maintenant **4 stores** :
```
src/stores/
├── appStore.js ✅
├── espStore.js ✅
├── souteStore.js ✅
└── iqaStore.js ✅