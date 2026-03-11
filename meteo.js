/**
 * MBI vNext - Météo
 */

import { RHO_REF, Rd, Rv } from './constants';

export function computeAirDensity(T_c, P_hPa, RH_percent, altitude_m = 0) {
  const T_k = T_c + 273.15;
  const factor = 1 - (0.0065 * altitude_m / 288.15);
  const QFE = P_hPa * Math.pow(factor, 5.25588);
  const es = 6.112 * Math.exp((17.62 * T_c) / (243.12 + T_c));
  const e = (RH_percent / 100) * es;
  const pd = QFE - e;
  const rho_dry = (pd * 100) / (Rd * T_k);
  const rho_vapor = (e * 100) / (Rv * T_k);
  return rho_dry + rho_vapor;
}

export function dewPoint(T_c, RH_percent) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * T_c) / (b + T_c)) + Math.log(RH_percent / 100);
  return (b * alpha) / (a - alpha);
}

export function classifyAir(rho) {
  const rho_rel = rho / RHO_REF;
  let qual, color;
  
  if (rho_rel > 1.02) {
    qual = 'Porteur';
    color = 'blue';
  } else if (rho_rel < 0.97) {
    qual = 'Faible';
    color = 'red';
  } else {
    qual = 'Neutre';
    color = 'gray';
  }
  
  return { qual, rho_rel, color };
}

export function meteoCorrection(masse_base, mv, rho_rel, qual) {
  if (qual === 'Neutre') return 0;
  
  const delta_rho = Math.abs(rho_rel - 1.0);
  const S_met = Math.min(delta_rho / 0.08, 1);
  const B = (S_met / (S_met + 0.05)) * 0.75;
  let dm = B * ((mv * rho_rel) - masse_base);
  dm = Math.max(-0.12, Math.min(0.12, dm));
  
  return dm;
}

export function computeMeteo(values) {
  const { pression, altitude, temperature, rosee } = values;
  const rho = computeAirDensity(temperature, pression, 65, altitude);
  const { qual, rho_rel, color } = classifyAir(rho);
  const td = rosee !== undefined ? rosee : dewPoint(temperature, 65);
  
  return {
    rho: Number(rho.toFixed(5)),
    rho_rel: Number(rho_rel.toFixed(5)),
    qual,
    color,
    td: Number(td.toFixed(1))
  };
}