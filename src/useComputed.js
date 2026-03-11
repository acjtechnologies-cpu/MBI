/**
 * MBI vNext - useComputed Hook
 */

import { useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { useSouteStore } from '../stores/souteStore';
import { computeMeteo } from '../utils/meteo';
import { poly4 } from '../utils/poly4';
import { computeBallast } from '../utils/ballast';

export function useComputed() {
  const values = useAppStore(state => state.values);
  const invertSoute = useAppStore(state => state.invertSoute);
  const lastMixSide = useAppStore(state => state.lastMixSide);
  
  const souteState = useSouteStore(state => state.state);
  const souteConfig = useSouteStore(state => state.config);
  const computeCG = useSouteStore(state => state.computeCG);
  
  const meteo = useMemo(() => {
    return computeMeteo(values);
  }, [values.pression, values.altitude, values.temperature, values.rosee]);
  
  const poly4Data = useMemo(() => {
    const m_poly = poly4(values.vent);
    return { m_poly };
  }, [values.vent]);
  
  const ballast = useMemo(() => {
    return computeBallast({
      ...values,
      m_poly: poly4Data.m_poly,
      rho_rel: meteo.rho_rel,
      qual: meteo.qual,
      invertSoute,
      lastMixSide
    });
  }, [
    values.vent,
    values.mv,
    values.angle,
    values.offset,
    meteo.rho_rel,
    meteo.qual,
    invertSoute,
    lastMixSide,
    poly4Data.m_poly
  ]);
  
  const cgSoute = useMemo(() => {
    return computeCG(values.mv);
  }, [souteState, souteConfig, values.mv]);
  
  const chrono = useMemo(() => {
    return {
      delta: values.chronoR - values.chronoC,
      gap: values.chronoR - values.lievre
    };
  }, [values.chronoC, values.chronoR, values.lievre]);
  
  return { meteo, poly4: poly4Data, ballast, cgSoute, chrono };
}