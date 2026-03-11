/**
 * MBI vNext - Poly4
 * Régression polynomiale degré 4
 */

import { POLY4_REFERENCE_POINTS } from './constants';

export function fitPoly4(points = POLY4_REFERENCE_POINTS) {
  const m = 5;
  const A = Array(m).fill(0).map(() => Array(m).fill(0));
  const B = Array(m).fill(0);
  
  for (const { vent, masse } of points) {
    const row = [
      Math.pow(vent, 4),
      Math.pow(vent, 3),
      Math.pow(vent, 2),
      vent,
      1
    ];
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        A[i][j] += row[i] * row[j];
      }
      B[i] += row[i] * masse;
    }
  }
  
  return gaussianElimination(A, B);
}

function gaussianElimination(A, B) {
  const m = A.length;
  const Aug = A.map((row, i) => [...row, B[i]]);
  
  for (let i = 0; i < m; i++) {
    let maxRow = i;
    for (let k = i + 1; k < m; k++) {
      if (Math.abs(Aug[k][i]) > Math.abs(Aug[maxRow][i])) {
        maxRow = k;
      }
    }
    [Aug[i], Aug[maxRow]] = [Aug[maxRow], Aug[i]];
    
    const pivot = Aug[i][i] || 1e-12;
    for (let j = i; j <= m; j++) {
      Aug[i][j] /= pivot;
    }
    
    for (let k = 0; k < m; k++) {
      if (k === i) continue;
      const factor = Aug[k][i];
      for (let j = i; j <= m; j++) {
        Aug[k][j] -= factor * Aug[i][j];
      }
    }
  }
  
  return Aug.map(row => row[m]);
}

export function evalPoly4(vent, coeffs) {
  const v = Math.max(4.5, Math.min(15.0, vent));
  const [a4, a3, a2, a1, a0] = coeffs;
  return (((a4 * v + a3) * v + a2) * v + a1) * v + a0;
}

let cachedCoeffs = null;

export function getPoly4Coeffs() {
  if (!cachedCoeffs) {
    cachedCoeffs = fitPoly4();
  }
  return cachedCoeffs;
}

export function poly4(vent) {
  const coeffs = getPoly4Coeffs();
  return evalPoly4(vent, coeffs);
}

export function poly4WithDelta(vent, delta = 0) {
  return poly4(vent) + delta;
}

export function getPoly4Points(vmin = 4.5, vmax = 15, step = 0.05, delta = 0) {
  const points = [];
  const coeffs = getPoly4Coeffs();
  
  for (let v = vmin; v <= vmax; v += step) {
    const masse = evalPoly4(v, coeffs) + delta;
    points.push({ vent: v, masse });
  }
  
  return points;
}