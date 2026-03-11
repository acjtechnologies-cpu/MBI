/**
 * MBI vNext - MassCard Component
 */

import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useComputed } from '../../hooks/useComputed';
import { useFormat } from '../../hooks/useFormat';

export function MassCard() {
  const invertSoute = useAppStore(state => state.invertSoute);
  const { ballast, meteo } = useComputed();
  const { formatMasse, formatNumber } = useFormat();
  
  const masseFinal = ballast?.masses?.m_final;
  const ballastG = ballast?.masses?.ballast_g;
  const qual = meteo?.qual || '—';
  const rhoRel = meteo?.rho_rel;
  
  return (
    <div className="card text-center">
      <div className="text-5xl font-black tracking-wide">
        {formatMasse(masseFinal)}
      </div>
      <div className="text-sm text-txt-muted -mt-1">
        kg
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-xs text-txt-muted">
        <span>Qualité air: <b className="text-txt">{qual}</b></span>
        <span>ρrel: <b className="text-txt">{formatNumber(rhoRel, 3)}</b></span>
        <span>Ballast: <b className="text-txt">{ballastG} g</b></span>
        <span>Soute: <b className="text-txt">MODE D{invertSoute ? ' • INV' : ''}</b></span>
      </div>
    </div>
  );
}