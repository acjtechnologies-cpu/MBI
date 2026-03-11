/**
 * MBI vNext - useVibration Hook
 */

import { useCallback } from 'react';
import { UI_CONFIG } from '../utils/constants';

export function useVibration() {
  const vibrate = useCallback((pattern) => {
    if (!navigator.vibrate) return;
    try {
      if (typeof pattern === 'number') {
        navigator.vibrate(pattern);
      } else if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }, []);
  
  const vibrateShort = useCallback(() => {
    vibrate(UI_CONFIG.VIBRATION_SHORT_MS);
  }, [vibrate]);
  
  const vibrateDouble = useCallback(() => {
    vibrate(UI_CONFIG.VIBRATION_DOUBLE);
  }, [vibrate]);
  
  return { vibrate, vibrateShort, vibrateDouble };
}