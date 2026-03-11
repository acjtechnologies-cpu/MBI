/**
 * MBI vNext - Ballast
 * Moteur MODE D + suggestions
 */

import { 
  HALF_PLOT, 
  CAPACITY_PER_SIDE, 
  MAX_BALLAST_HALF, 
  OFFSET_STEPS,
  MASSE_MAX,
  DELTA_MASSE
} from './constants';

import { poly4 } from './poly4';
import { meteoCorrection } from './meteo';

export function snapOffset(value, lastSnap = 0) {
  let best = OFFSET_STEPS[0];
  let minDist = Infinity;
  
  for (const step of OFFSET_STEPS) {
    const dist = Math.abs(value - step);
    if (dist < minDist) {
      minDist = dist;
      best = step;
    }
  }
  
  if (lastSnap !== 0 && Math.sign(best) !== Math.sign(lastSnap)) {
    return 0;
  }
  
  return best;
}

function buildColumnModeD(nFull, hasHalf) {
  const slots = [];
  
  for (let i = 0; i < nFull && slots.length < CAPACITY_PER_SIDE; i++) {
    slots.push('1B');
  }
  
  if (hasHalf && slots.length < CAPACITY_PER_SIDE) {
    slots.push('H');
  }
  
  while (slots.length < CAPACITY_PER_SIDE) {
    slots.push('1S');
  }
  
  return slots;
}

export function calcSouteModeD(masseFinaleKg, masseVideKg, invertSoute = false, lastMixSide = 'D') {
  const chargeG = Math.max(0, (masseFinaleKg - masseVideKg) * 1000);
  
  let nHalfTotal = Math.floor(chargeG / HALF_PLOT);
  nHalfTotal = Math.min(nHalfTotal, MAX_BALLAST_HALF);
  
  if (nHalfTotal <= 0) {
    const empty = ['1S', '1S', '1S', '1S', '1S', '1S'];
    return {
      G: empty.slice(),
      D: empty.slice(),
      meta: { nTotal: 0, extraHalf: 0, mixSide: '—' }
    };
  }
  
  const nFullTotal = Math.floor(nHalfTotal / 2);
  const extraHalf = nHalfTotal % 2;
  
  const nG = Math.floor(nFullTotal / 2);
  const nD = nFullTotal - nG;
  
  let mixG = false;
  let mixD = false;
  let newMixSide = lastMixSide;
  
  if (extraHalf === 1) {
    const side = invertSoute ? (lastMixSide === 'D' ? 'G' : 'D') : lastMixSide;
    
    if (side === 'D') {
      mixG = true;
      newMixSide = 'G';
    } else {
      mixD = true;
      newMixSide = 'D';
    }
  }
  
  return {
    G: buildColumnModeD(nG, mixG),
    D: buildColumnModeD(nD, mixD),
    meta: {
      nTotal: nHalfTotal,
      extraHalf,
      mixSide: extraHalf ? (mixG ? 'G' : 'D') : '—',
      newMixSide
    }
  };
}

export function computeBallast(params) {
  const {
    vent,
    mv,
    angle = 0,
    offset = 0,
    rho_rel = 1.0,
    qual = 'Neutre',
    m_poly = null,
    invertSoute = false,
    lastMixSide = 'D'
  } = params;
  
  const mBase = m_poly !== null ? m_poly : poly4(vent);
  const mTraversier = mBase + (0.20 * Math.pow(angle / 45, 2) * (vent / 8));
  const dmMeteo = meteoCorrection(mBase, mv, rho_rel, qual);
  const mMeteo = mTraversier + dmMeteo;
  const offsetSnap = snapOffset(offset);
  const mRaw = mMeteo + offsetSnap / 1000;
  const mMin = Math.max(mv, mBase - DELTA_MASSE);
  const mMax = MASSE_MAX;
  const mClamped = Math.max(mMin, Math.min(mMax, mRaw));
  const ballastBrut = Math.max(0, (mClamped - mv) * 1000);
  const nHalf = Math.floor(ballastBrut / HALF_PLOT);
  const ballastKg = (nHalf * HALF_PLOT) / 1000;
  const ballastG = nHalf * HALF_PLOT;
  const mFinal = mv + ballastKg;
  const soute = calcSouteModeD(mFinal, mv, invertSoute, lastMixSide);
  
  return {
    masses: {
      m_base: Number(mBase.toFixed(3)),
      m_traversier: Number(mTraversier.toFixed(3)),
      m_meteo: Number(mMeteo.toFixed(3)),
      m_final: Number(mFinal.toFixed(3)),
      ballast_g: ballastG
    },
    corrections: {
      dm_meteo: Number(dmMeteo.toFixed(3)),
      dm_traversier: Number((mTraversier - mBase).toFixed(3)),
      offset_snap: offsetSnap
    },
    soute,
    meta: {
      n_half_plots: nHalf,
      mix_side: soute.meta.mixSide,
      invert: invertSoute
    }
  };
}