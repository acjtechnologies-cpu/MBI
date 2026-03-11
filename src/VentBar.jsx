/**
 * MBI vNext - VentBar Component
 */

import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFormat } from '../../hooks/useFormat';

export function VentBar() {
  const vent = useAppStore(state => state.values.vent);
  const selectedParam = useAppStore(state => state.selectedParam);
  const selectParam = useAppStore(state => state.selectParam);
  const { formatVent } = useFormat();
  
  const isSelected = selectedParam === 'vent';
  
  return (
    <button
      onClick={() => selectParam('vent')}
      className={`h-16 rounded-2xl flex items-center justify-center gap-4 mb-3 cursor-pointer transition-all ${
        isSelected 
          ? 'bg-[#134e25] ring-2 ring-accent-blue' 
          : 'bg-[#134e25] border border-[rgba(255,255,255,0.06)] hover:border-accent-blue'
      }`}
    >
      <div className="text-2xl font-black text-white/75">
        Vent
      </div>
      <div className="text-5xl font-black text-white">
        {formatVent(vent)}
      </div>
      <div className="text-xl text-white/85">
        m/s
      </div>
    </button>
  );
}