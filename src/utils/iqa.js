import { calculateDensity, calculateSpeedOfSound, CONSTANTS } from './meteo.js'

/**
 * Calcule la pression dynamique (q)
 * @param {number} density - Densité en kg/m³
 * @param {number} velocity - Vitesse en m/s
 * @returns {number} Pression dynamique en Pa
 */
export function calculateDynamicPressure(density, velocity) {
  return 0.5 * density * Math.pow(velocity, 2)
}

/**
 * Calcule le coefficient de portance (Cl)
 * @param {number} lift - Portance en N
 * @param {number} dynamicPressure - Pression dynamique en Pa
 * @param {number} wingArea - Surface alaire en m²
 * @returns {number} Coefficient de portance
 */
export function calculateLiftCoefficient(lift, dynamicPressure, wingArea) {
  return lift / (dynamicPressure * wingArea)
}

/**
 * Calcule le coefficient de traînée (Cd)
 * @param {number} drag - Traînée en N
 * @param {number} dynamicPressure - Pression dynamique en Pa
 * @param {number} wingArea - Surface alaire en m²
 * @returns {number} Coefficient de traînée
 */
export function calculateDragCoefficient(drag, dynamicPressure, wingArea) {
  return drag / (dynamicPressure * wingArea)
}

/**
 * Calcule la finesse (L/D ratio)
 * @param {number} cl - Coefficient de portance
 * @param {number} cd - Coefficient de traînée
 * @returns {number} Finesse
 */
export function calculateLiftToDrag(cl, cd) {
  return cd !== 0 ? cl / cd : 0
}

/**
 * Calcule le nombre de Reynolds
 * @param {number} density - Densité en kg/m³
 * @param {number} velocity - Vitesse en m/s
 * @param {number} length - Longueur caractéristique en m
 * @param {number} viscosity - Viscosité dynamique (optionnel)
 * @returns {number} Nombre de Reynolds
 */
export function calculateReynoldsNumber(density, velocity, length, viscosity = 1.789e-5) {
  return (density * velocity * length) / viscosity
}

/**
 * Calcule la vitesse de décrochage
 * @param {number} weight - Poids en N
 * @param {number} density - Densité en kg/m³
 * @param {number} wingArea - Surface alaire en m²
 * @param {number} clMax - Cl maximum
 * @returns {number} Vitesse de décrochage en m/s
 */
export function calculateStallSpeed(weight, density, wingArea, clMax) {
  return Math.sqrt((2 * weight) / (density * wingArea * clMax))
}

/**
 * Calcule la charge alaire
 * @param {number} weight - Poids en N
 * @param {number} wingArea - Surface alaire en m²
 * @returns {number} Charge alaire en N/m²
 */
export function calculateWingLoading(weight, wingArea) {
  return weight / wingArea
}

/**
 * Calcule la puissance nécessaire pour un vol en palier
 * @param {number} weight - Poids en N
 * @param {number} velocity - Vitesse en m/s
 * @param {number} cl - Coefficient de portance
 * @param {number} cd - Coefficient de traînée
 * @returns {number} Puissance en W
 */
export function calculatePowerRequired(weight, velocity, cl, cd) {
  const drag = weight * (cd / cl)
  return drag * velocity
}

/**
 * Calcule l'angle d'attaque optimal pour la finesse max
 * @param {Object} polarCurve - Courbe polaire {cl: [], cd: []}
 * @returns {Object} {cl, cd, alpha, ld}
 */
export function findOptimalAngleOfAttack(polarCurve) {
  let maxLD = 0
  let optimalPoint = null
  
  for (let i = 0; i < polarCurve.cl.length; i++) {
    const cl = polarCurve.cl[i]
    const cd = polarCurve.cd[i]
    const ld = cl / cd
    
    if (ld > maxLD) {
      maxLD = ld
      optimalPoint = {
        cl,
        cd,
        alpha: polarCurve.alpha ? polarCurve.alpha[i] : i,
        ld,
      }
    }
  }
  
  return optimalPoint
}

/**
 * Calcule la polaire induite (traînée induite)
 * @param {number} cl - Coefficient de portance
 * @param {number} aspectRatio - Allongement de l'aile
 * @param {number} efficiency - Efficacité d'Oswald (e)
 * @returns {number} Coefficient de traînée induite
 */
export function calculateInducedDrag(cl, aspectRatio, efficiency = 0.85) {
  return Math.pow(cl, 2) / (Math.PI * aspectRatio * efficiency)
}

/**
 * Calcule la traînée totale
 * @param {number} cd0 - Traînée parasite
 * @param {number} cdi - Traînée induite
 * @returns {number} Coefficient de traînée total
 */
export function calculateTotalDrag(cd0, cdi) {
  return cd0 + cdi
}

/**
 * Calcule la vitesse pour finesse maximale
 * @param {number} weight - Poids en N
 * @param {number} density - Densité en kg/m³
 * @param {number} wingArea - Surface alaire en m²
 * @param {number} cd0 - Traînée parasite
 * @param {number} aspectRatio - Allongement
 * @returns {number} Vitesse pour L/D max en m/s
 */
export function calculateBestGlideSpeed(weight, density, wingArea, cd0, aspectRatio, efficiency = 0.85) {
  const k = 1 / (Math.PI * aspectRatio * efficiency)
  const cl = Math.sqrt(cd0 / k)
  
  return Math.sqrt((2 * weight) / (density * wingArea * cl))
}

/**
 * Calcule la portance nécessaire pour un virage
 * @param {number} weight - Poids en N
 * @param {number} bankAngle - Angle d'inclinaison en degrés
 * @returns {number} Portance nécessaire en N
 */
export function calculateTurnLift(weight, bankAngle) {
  const bankAngleRad = (bankAngle * Math.PI) / 180
  return weight / Math.cos(bankAngleRad)
}

/**
 * Calcule le facteur de charge en virage
 * @param {number} bankAngle - Angle d'inclinaison en degrés
 * @returns {number} Facteur de charge (n)
 */
export function calculateLoadFactor(bankAngle) {
  const bankAngleRad = (bankAngle * Math.PI) / 180
  return 1 / Math.cos(bankAngleRad)
}

/**
 * Calcule le rayon de virage
 * @param {number} velocity - Vitesse en m/s
 * @param {number} bankAngle - Angle d'inclinaison en degrés
 * @returns {number} Rayon de virage en m
 */
export function calculateTurnRadius(velocity, bankAngle) {
  const { g } = CONSTANTS
  const bankAngleRad = (bankAngle * Math.PI) / 180
  return Math.pow(velocity, 2) / (g * Math.tan(bankAngleRad))
}

/**
 * Calcule le taux de virage
 * @param {number} velocity - Vitesse en m/s
 * @param {number} bankAngle - Angle d'inclinaison en degrés
 * @returns {number} Taux de virage en deg/s
 */
export function calculateTurnRate(velocity, bankAngle) {
  const { g } = CONSTANTS
  const bankAngleRad = (bankAngle * Math.PI) / 180
  const rateRad = (g * Math.tan(bankAngleRad)) / velocity
  return (rateRad * 180) / Math.PI
}

/**
 * Calcule la distance de décollage
 * @param {number} weight - Poids en N
 * @param {number} density - Densité en kg/m³
 * @param {number} wingArea - Surface alaire en m²
 * @param {number} clMax - Cl max
 * @param {number} thrust - Poussée en N
 * @param {number} mu - Coefficient de friction au sol
 * @returns {number} Distance de décollage en m
 */
export function calculateTakeoffDistance(weight, density, wingArea, clMax, thrust, mu = 0.02) {
  const { g } = CONSTANTS
  const vLiftoff = calculateStallSpeed(weight, density, wingArea, clMax) * 1.2
  
  // Accélération moyenne
  const avgDrag = 0.5 * mu * weight
  const netForce = thrust - avgDrag
  const acceleration = (netForce / weight) * g
  
  // Distance = v² / (2a)
  return Math.pow(vLiftoff, 2) / (2 * acceleration)
}

/**
 * Calcule l'indice de qualité aérodynamique global
 * @param {Object} params - Paramètres de vol
 * @returns {Object} IQA avec notes détaillées
 */
export function calculateIQA(params) {
  const {
    velocity,
    altitude,
    temperature,
    weight,
    wingArea,
    cl,
    cd,
  } = params
  
  const density = calculateDensity(101325, temperature) // Simplifié
  const dynamicPressure = calculateDynamicPressure(density, velocity)
  const ld = calculateLiftToDrag(cl, cd)
  const wingLoading = calculateWingLoading(weight, wingArea)
  
  // Scores (0-100)
  const efficiencyScore = Math.min(100, (ld / 20) * 100) // LD max ~20
  const speedScore = Math.min(100, (velocity / 100) * 100) // Vitesse max ~100 m/s
  const loadingScore = Math.max(0, 100 - (wingLoading / 5000) * 100) // Wing loading optimal
  
  const overallScore = (efficiencyScore + speedScore + loadingScore) / 3
  
  return {
    overallScore: Math.round(overallScore),
    efficiency: Math.round(efficiencyScore),
    speed: Math.round(speedScore),
    loading: Math.round(loadingScore),
    ld,
    dynamicPressure,
    wingLoading,
  }
}
