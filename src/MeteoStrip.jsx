/**
 * MBI vNext - MeteoStrip Component
 */

import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useFormat } from '../../hooks/useFormat';

export function MeteoStrip({ onSettingsClick }) {
  const values = useAppStore(state => state.values);
  const selectedParam = useAppStore(state => state.selectedParam);
  const selectParam = useAppStore(state => state.selectParam);
  const { formatParam } = useFormat();
  
  const cards = [
    { param: 'pression', label: 'Pression', unit: 'hPa' },
    { param: 'altitude', label: 'Altitude', unit: 'm' },
    { param: 'temperature', label: 'T°', unit: '°C' },
    { param: 'rosee', label: 'Td', unit: '°C' }
  ];
  
  return (
    <div className="grid grid-cols-[48px_repeat(4,1fr)] gap-2 mb-3">
      <button
        onClick={onSettingsClick}
        className="h-12 rounded-xl flex items-center justify-center border border-stroke-light text-2xl hover:bg-active transition-colors"
      >
        ⚙️
      </button>
      
      {cards.map(({ param, label, unit }) => (
        <button
          key={param}
          onClick={() => selectParam(param)}
          className={`h-12 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
            selectedParam === param 
              ? 'ring-2 ring-accent-blue bg-bg-panel' 
              : 'border-stroke bg-bg-panel2 hover:bg-bg-panel'
          }`}
        >
          <div className="text-[10px] text-txt-muted uppercase tracking-wide">
            {label}
          </div>
          <div className="text-lg font-bold leading-tight">
            <span>{formatParam(param, values[param])}</span>
            <span className="text-[10px] opacity-75 ml-0.5">{unit}</span>
          </div>
        </button>
      ))}
    </div>
  );
}