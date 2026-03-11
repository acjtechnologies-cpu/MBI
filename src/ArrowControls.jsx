/**
 * MBI vNext - ArrowControls Component
 */

import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useLongPress } from '../../hooks/useLongPress';
import { useVibration } from '../../hooks/useVibration';
import { PARAMS } from '../../utils/constants';

export function ArrowControls() {
  const selectedParam = useAppStore(state => state.selectedParam);
  const updateValue = useAppStore(state => state.updateValue);
  const setCooldown = useAppStore(state => state.setCooldown);
  const cooldownActive = useAppStore(state => state.cooldownActive);
  
  const { vibrateShort } = useVibration();
  
  const [leftHolding, setLeftHolding] = useState(false);
  const [rightHolding, setRightHolding] = useState(false);
  
  const handleUpdate = (delta) => {
    if (!selectedParam || !PARAMS[selectedParam]) return;
    updateValue(selectedParam, delta);
    setCooldown(true);
    vibrateShort();
  };
  
  const leftProps = useLongPress(
    () => handleUpdate(-1),
    {
      onStart: () => setLeftHolding(true),
      onEnd: () => setLeftHolding(false)
    }
  );
  
  const rightProps = useLongPress(
    () => handleUpdate(1),
    {
      onStart: () => setRightHolding(true),
      onEnd: () => setRightHolding(false)
    }
  );
  
  return (
    <>
      <div className="flex gap-3 mt-3">
        <button
          {...leftProps}
          className={`flex-1 h-16 rounded-2xl border-2 border-white/20 flex items-center justify-center text-3xl font-black transition-all ${
            leftHolding ? 'bg-active' : 'bg-bg-panel2'
          } ${cooldownActive ? 'cooldown' : ''}`}
        >
          ◀
        </button>
        
        <button
          {...rightProps}
          className={`flex-1 h-16 rounded-2xl border-2 border-white/20 flex items-center justify-center text-3xl font-black transition-all ${
            rightHolding ? 'bg-active' : 'bg-bg-panel2'
          } ${cooldownActive ? 'cooldown' : ''}`}
        >
          ▶
        </button>
      </div>
      
      <div className="text-center text-xs text-txt-muted mt-2">
        {selectedParam 
          ? `${PARAMS[selectedParam]?.label} • ◀ ▶ : ±${Math.abs(PARAMS[selectedParam]?.step)} ${PARAMS[selectedParam]?.unit} • appui long = répétition`
          : 'Sélectionne un paramètre puis ◀ ▶ (appui long = répétition)'
        }
      </div>
    </>
  );
}