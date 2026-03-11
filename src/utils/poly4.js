/**
 * POLY4 - Moteur de calcul masse optimale
 * Fit polynomial degré 4 sur points de référence réels
 */

// Points de référence (mesurés sur terrain)
const vent_raw = [4.05, 4.23, 4.41, 4.61, 4.82, 5.04, 5.28, 5.53, 5.80, 6.10, 6.42, 6.78, 7.17, 7.61, 8.10, 8.65, 9.28, 9.99, 10.78, 11.65, 12.60, 13.70, 15.30]
const masse_raw = [2.300, 2.385, 2.470, 2.555, 2.640, 2.725, 2.810, 2.895, 2.980, 3.065, 3.150, 3.235, 3.320, 3.405, 3.490, 3.575, 3.660, 3.745, 3.830, 3.915, 4.000, 4.085, 4.170]

// Constantes
const MASSE_MAX = 4.200
const HALF = 0.085      // 85 g
const RHO0 = 1.225      // Densité air référence
const DELTA = 0.170
const CAPA_HALF = 12

// Cache du polynôme
let p4 = null

/**
 * Fit polynomial degré 4 par moindres carrés (Gauss)
 * @returns {Array} Coefficients [a4, a3, a2, a1, a0]
 */
function fitPoly4() {
  if (p4) return p4
  
  const m = 5 // Degré 4 = 5 coefficients
  const A = [...Array(m)].map(() => Array(m).fill(0))
  const B = Array(m).fill(0)
  
  // Construire système linéaire
  for (let k = 0; k < vent_raw.length; k++) {
    const v = vent_raw[k]
    const y = masse_raw[k]
    const r = [v * v * v * v, v * v * v, v * v, v, 1]
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        A[i][j] += r[i] * r[j]
      }
      B[i] += r[i] * y
    }
  }
  
  // Résolution Gauss
  for (let i = 0; i < m; i++) {
    // Pivot
    let mr = i
    for (let k = i + 1; k < m; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[mr][i])) mr = k
    }
    if (mr !== i) {
      [A[i], A[mr]] = [A[mr], A[i]];
      [B[i], B[mr]] = [B[mr], B[i]]
    }
    
    // Normalisation
    const piv = A[i][i] || 1e-12
    for (let j = i; j < m; j++) A[i][j] /= piv
    B[i] /= piv
    
    // Élimination
    for (let k = 0; k < m; k++) {
      if (k === i) continue
      const f = A[k][i]
      for (let j = i; j < m; j++) A[k][j] -= f * A[i][j]
      B[k] -= f * B[i]
    }
  }
  
  p4 = B.slice()
  return p4
}

/**
 * Calcule la masse optimale pour un vent donné
 * @param {number} vent - Vitesse du vent en m/s
 * @returns {number} Masse en kg
 */
export function calculerMasseOptimale(vent) {
  const c = fitPoly4()
  
  // Clamp vent entre 4.5 et 15 m/s
  let v = vent
  if (v < 4.5) v = 4.5
  if (v > 15) v = 15
  
  // Évaluation polynôme : a4*v^4 + a3*v^3 + a2*v^2 + a1*v + a0
  const [a4, a3, a2, a1, a0] = c
  const masse = (((a4 * v + a3) * v + a2) * v + a1) * v + a0
  
  return masse // en kg
}

/**
 * Calcule la densité de l'air et le ratio rho
 * @param {number} pression - QNH en hPa
 * @param {number} temperature - Température en °C
 * @param {number} rosee - Point de rosée en °C
 * @param {number} altitude - Altitude en m
 * @returns {object} {rho, rr, qual}
 */
export function calculerMeteo(pression, temperature, rosee, altitude) {
  const Q = pression
  const Tc = temperature
  const Td = rosee
  const h = altitude
  
  // Température en Kelvin
  const T = Tc + 273.15
  
  // QFE (pression au niveau du site)
  const fact = 1 - 0.0065 * h / 288.15
  const QFE = Q * Math.pow(fact, 5.25588)
  
  // Pression vapeur saturante
  const e = 6.112 * Math.exp(17.62 * Td / (243.12 + Td))
  
  // Pression air sec
  const pd = QFE - e
  
  // Densité de l'air (kg/m³)
  const rho = (pd * 100) / (287.05 * T) + (e * 100) / (461.495 * T)
  
  // Ratio par rapport à densité standard
  const rr = rho / RHO0
  
  // Qualité de l'air
  let qual = "Neutre"
  if (rr > 1.02) qual = "Porteur"
  else if (rr < 0.97) qual = "Faible"
  
  return { rho, rr, qual }
}

/**
 * Génère une courbe vent → masse
 * @param {number} ventMin - Vent minimum
 * @param {number} ventMax - Vent maximum
 * @param {number} step - Pas
 * @returns {Array} Points {vent, masse}
 */
export function genererCourbe(ventMin = 4, ventMax = 16, step = 0.5) {
  const points = []
  
  for (let v = ventMin; v <= ventMax; v += step) {
    points.push({
      vent: v,
      masse: calculerMasseOptimale(v)
    })
  }
  
  return points
}

/**
 * Calcule la charge alaire
 * @param {number} masse - Masse en kg
 * @param {number} surface - Surface en dm²
 * @returns {number} Charge alaire en g/dm²
 */
export function calculerChargeAlaire(masse, surface) {
  return (masse * 1000) / surface
}

/**
 * Calcule le nombre de Reynolds
 * @param {number} vent - Vitesse en m/s
 * @param {number} corde - Corde moyenne en m
 * @returns {number} Reynolds
 */
export function calculerReynolds(vent, corde = 0.15) {
  const nu = 1.5e-5 // Viscosité cinématique air (m²/s)
  return (vent * corde) / nu
}

/**
 * Optimise la masse selon les contraintes
 * @param {number} masseCible - Masse cible en kg
 * @param {number} masseMin - Masse min en kg
 * @param {number} masseMax - Masse max en kg
 * @returns {number} Masse optimisée en kg
 */
export function optimiserMasse(masseCible, masseMin = 2.0, masseMax = MASSE_MAX) {
  return Math.max(masseMin, Math.min(masseMax, masseCible))
}

/**
 * Exporte les points de référence (pour graphique)
 * @returns {Array} Points {vent, masse}
 */
export function getPointsReference() {
  return vent_raw.map((v, i) => ({
    vent: v,
    masse: masse_raw[i]
  }))
}

/**
 * Exporte les coefficients du polynôme
 * @returns {Array} [a4, a3, a2, a1, a0]
 */
export function getCoefficients() {
  return fitPoly4()
}
