/**
 * MBI vNext - PilotePage Component
 */

import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useComputed } from '../../hooks/useComputed';
import { useFormat } from '../../hooks/useFormat';
import { MeteoStrip } from './MeteoStrip';
import { VentBar } from './VentBar';
import { SouteVisual } from './SouteVisual';
import { MassCard } from './MassCard';
import { ArrowControls } from './ArrowControls';

function GapCard() {
  const { chrono } = useComputed();
  const { formatNumber } = useFormat();
  
  const gap = chrono?.gap || 0;
  const sign = gap >= 0 ? '+' : '';
  
  return (
    <div className="card text-center py-2 mt-3">
      <div className="text-4xl font-black">
        Écart : {sign}{formatNumber(gap, 1)}
      </div>
      <div className="text-sm text-txt-muted">
        s
      </div>
    </div>
  );
}

function OffsetCard() {
  const offset = useAppStore(state => state.values.offset);
  const selectedParam = useAppStore(state => state.selectedParam);
  const selectParam = useAppStore(state => state.selectParam);
  
  const isSelected = selectedParam === 'offset';
  
  return (
    <button
      onClick={() => selectParam('offset')}
      className={`card flex items-center justify-between cursor-pointer mt-3 transition-all ${
        isSelected ? 'ring-2 ring-accent-blue' : ''
      }`}
    >
      <div className="text-base font-black text-txt-muted">
        Offset appliqué
      </div>
      <div className="text-3xl font-black">
        {offset} g
      </div>
    </button>
  );
}

export function PilotePage() {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="max-w-md mx-auto p-3 pb-20">
      <MeteoStrip onSettingsClick={() => setShowSettings(true)} />
      <VentBar />
      <SouteVisual />
      <MassCard />
      <GapCard />
      <OffsetCard />
      <ArrowControls />
      
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-bg-panel border border-stroke rounded-2xl p-4 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Qualité de vol</h3>
            <p className="text-txt-muted">IQA popup à venir...</p>
            <button 
              onClick={() => setShowSettings(false)}
              className="btn btn-primary w-full mt-4"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Sauvegarde** (Ctrl+S)

---

## ✅ **GROUPE 4 TERMINÉ !**

Tu as maintenant **6 components** :
```
src/components/Pilote/
├── MeteoStrip.jsx ✅
├── VentBar.jsx ✅
├── SouteVisual.jsx ✅
├── MassCard.jsx ✅
├── ArrowControls.jsx ✅
└── PilotePage.jsx ✅