/**
 * MBI vNext - SouteVisual Component
 */

import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useComputed } from '../../hooks/useComputed';

function Slot({ type }) {
  if (type === '1B') {
    return (
      <div className="h-11 rounded-xl bg-accent-yellow text-black flex items-center justify-center font-black text-sm">
        170
      </div>
    );
  }
  
  if (type === 'H') {
    return (
      <div className="h-11 rounded-xl overflow-hidden border-2 border-black flex flex-col">
        <div className="flex-1 bg-accent-green flex items-center justify-center text-[10px] font-black text-[#043]">
          ½ S
        </div>
        <div className="h-[2px] bg-black"></div>
        <div className="flex-1 bg-accent-yellow flex items-center justify-center text-[10px] font-black text-black">
          85
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-11 rounded-xl bg-accent-green text-[#043] flex items-center justify-center font-black text-sm">
      S
    </div>
  );
}

function Column({ slots }) {
  return (
    <div className="border border-dashed border-stroke rounded-2xl p-2 flex flex-col-reverse gap-2">
      {slots.map((type, i) => (
        <Slot key={i} type={type} />
      ))}
    </div>
  );
}

export function SouteVisual() {
  const invertSoute = useAppStore(state => state.invertSoute);
  const { ballast } = useComputed();
  
  const soute = ballast?.soute;
  
  if (!soute) {
    return (
      <div className="card h-64 flex items-center justify-center text-txt-muted">
        Chargement...
      </div>
    );
  }
  
  const colG = invertSoute ? soute.D : soute.G;
  const colD = invertSoute ? soute.G : soute.D;
  const labelG = invertSoute ? 'DROITE (inversé)' : 'GAUCHE';
  const labelD = invertSoute ? 'GAUCHE (inversé)' : 'DROITE';
  
  return (
    <div className="card">
      <div className="grid grid-cols-2 text-center mb-2 font-black text-txt-muted text-sm">
        <div>{labelG}</div>
        <div>{labelD}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Column slots={colG} />
        <Column slots={colD} />
      </div>
    </div>
  );
}