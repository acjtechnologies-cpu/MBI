/**
 * MBI vNext - useFormat Hook
 */

import { useCallback } from 'react';
import { PARAMS } from '../utils/constants';

export function useFormat() {
  const formatParam = useCallback((param, value) => {
    const config = PARAMS[param];
    if (!config) return String(value);
    if (config.decimals === 0) {
      return String(Math.round(value));
    }
    return Number(value).toFixed(config.decimals);
  }, []);
  
  const formatNumber = useCallback((value, decimals = 0) => {
    if (value == null || !isFinite(value)) return '—';
    return Number(value).toFixed(decimals);
  }, []);
  
  const formatMasse = useCallback((kg) => {
    if (kg == null || !isFinite(kg)) return '—';
    return Number(kg).toFixed(3);
  }, []);
  
  const formatVent = useCallback((ms) => {
    if (ms == null || !isFinite(ms)) return '—';
    return Number(ms).toFixed(1);
  }, []);
  
  const formatCG = useCallback((mm) => {
    if (mm == null || !isFinite(mm)) return '—';
    return Number(mm).toFixed(1);
  }, []);
  
  return { formatParam, formatNumber, formatMasse, formatVent, formatCG };
}
```

**Sauvegarde** (Ctrl+S)

---

## ✅ **GROUPE 3 TERMINÉ !**

Tu as maintenant **4 hooks** :
```
src/hooks/
├── useVibration.js ✅
├── useLongPress.js ✅
├── useComputed.js ✅
└── useFormat.js ✅