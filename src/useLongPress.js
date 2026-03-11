/**
 * MBI vNext - useLongPress Hook
 */

import { useCallback, useRef } from 'react';
import { UI_CONFIG } from '../utils/constants';

export function useLongPress(callback, options = {}) {
  const {
    delay = UI_CONFIG.LONG_PRESS_DELAY_MS,
    repeat = UI_CONFIG.LONG_PRESS_REPEAT_MS,
    onStart = null,
    onEnd = null
  } = options;
  
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  
  const start = useCallback((event) => {
    if (event) event.preventDefault();
    
    if (callback) callback();
    if (onStart) onStart();
    
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (callback) callback();
      }, repeat);
    }, delay);
  }, [callback, delay, repeat, onStart]);
  
  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (onEnd) onEnd();
  }, [onEnd]);
  
  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop
  };
}