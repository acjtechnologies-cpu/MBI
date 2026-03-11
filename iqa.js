/**
 * MBI vNext - IQA
 */

import { IQA_CONFIG } from './constants';

function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}

function cv(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = Math.abs(mean(arr));
  if (m < 1e-6) return 0;
  return std(arr) / m;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function scoreFromCV(cvValue, good, bad) {
  if (cvValue <= good) return 100;
  if (cvValue >= bad) return 0;
  return 100 * (bad - cvValue) / (bad - good);
}

export function computeIQA(buffers, espData = null) {
  const now = Date.now();
  
  const pitotSamples = buffers.pitot
    .filter(s => (now - s.t) <= IQA_CONFIG.PITOT_WIN_S * 1000)
    .map(s => s.v);
  
  const ventSamples = buffers.vent
    .filter(s => (now - s.t) <= IQA_CONFIG.VENT_WIN_S * 1000)
    .map(s => s.v);
  
  const pitotScore = pitotSamples.length >= 3 
    ? scoreFromCV(cv(pitotSamples), IQA_CONFIG.PITOT_CV_GOOD, IQA_CONFIG.PITOT_CV_BAD)
    : 50;
    
  const ventScore = ventSamples.length >= 3
    ? scoreFromCV(cv(ventSamples), IQA_CONFIG.VENT_CV_GOOD, IQA_CONFIG.VENT_CV_BAD)
    : 50;
  
  const iqa = 
    IQA_CONFIG.W_PITOT * pitotScore +
    IQA_CONFIG.W_VENT * ventScore +
    IQA_CONFIG.W_TEMP * 50 +
    IQA_CONFIG.W_COHERENCE * 50;
  
  const iqaRounded = Math.round(iqa);
  
  let state, action, color;
  if (iqaRounded >= 80) {
    state = '🟢 EXCELLENTE';
    action = 'MODE ATTAQUE';
    color = 'green';
  } else if (iqaRounded >= 50) {
    state = '🟡 BONNE';
    action = 'Conserver réglages';
    color = 'yellow';
  } else {
    state = '🔴 DÉGRADÉE';
    action = 'MODE SÉCURITÉ';
    color = 'red';
  }
  
  return {
    value: iqaRounded,
    state,
    action,
    color,
    labels: {
      pitot: pitotScore >= 80 ? 'stable' : 'instable',
      vent: ventScore >= 80 ? 'laminaire' : 'haché',
      temp: '—',
      coherence: '—'
    },
    timestamp: Date.now()
  };
}
```

**Sauvegarde** (Ctrl+S)

---

## ✅ **GROUPE 1 TERMINÉ !**

Tu as maintenant **5 fichiers utils** :
```
src/utils/
├── constants.js ✅
├── poly4.js ✅
├── meteo.js ✅
├── ballast.js ✅
└── iqa.js ✅