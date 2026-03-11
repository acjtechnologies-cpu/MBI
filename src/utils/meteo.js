/**
 * Constantes atmosphériques
 */
export const CONSTANTS = {
  R: 287.05,        // Constante des gaz parfaits pour l'air (J/(kg·K))
  gamma: 1.4,       // Rapport des chaleurs spécifiques
  P0: 101325,       // Pression au niveau de la mer (Pa)
  T0: 288.15,       // Température au niveau de la mer (K)
  g: 9.81,          // Gravité (m/s²)
  L: 0.0065,        // Gradient thermique (K/m)
  rho0: 1.225,      // Densité de l'air au niveau de la mer (kg/m³)
}

/**
 * Convertit Celsius en Kelvin
 */
export function celsiusToKelvin(celsius) {
  return celsius + 273.15
}

/**
 * Convertit Kelvin en Celsius
 */
export function kelvinToCelsius(kelvin) {
  return kelvin - 273.15
}

/**
 * Calcule la pression atmosphérique à une altitude donnée
 * @param {number} altitude - Altitude en mètres
 * @param {number} temperature - Température en Celsius (optionnel)
 * @returns {number} Pression en Pa
 */
export function calculatePressure(altitude, temperature = 15) {
  const { P0, T0, g, R, L } = CONSTANTS
  const T = celsiusToKelvin(temperature)
  
  // Formule barométrique
  return P0 * Math.pow(1 - (L * altitude) / T0, (g / (R * L)))
}

/**
 * Calcule la densité de l'air
 * @param {number} pressure - Pression en Pa
 * @param {number} temperature - Température en Celsius
 * @returns {number} Densité en kg/m³
 */
export function calculateDensity(pressure, temperature) {
  const { R } = CONSTANTS
  const T = celsiusToKelvin(temperature)
  return pressure / (R * T)
}

/**
 * Calcule la densité de l'air à une altitude donnée
 * @param {number} altitude - Altitude en mètres
 * @param {number} temperature - Température en Celsius
 * @returns {number} Densité en kg/m³
 */
export function calculateDensityAtAltitude(altitude, temperature = 15) {
  const pressure = calculatePressure(altitude, temperature)
  return calculateDensity(pressure, temperature)
}

/**
 * Calcule la vitesse du son
 * @param {number} temperature - Température en Celsius
 * @returns {number} Vitesse du son en m/s
 */
export function calculateSpeedOfSound(temperature) {
  const { gamma, R } = CONSTANTS
  const T = celsiusToKelvin(temperature)
  return Math.sqrt(gamma * R * T)
}

/**
 * Calcule le nombre de Mach
 * @param {number} airspeed - Vitesse en m/s
 * @param {number} temperature - Température en Celsius
 * @returns {number} Nombre de Mach
 */
export function calculateMachNumber(airspeed, temperature) {
  const speedOfSound = calculateSpeedOfSound(temperature)
  return airspeed / speedOfSound
}

/**
 * Calcule la pression dynamique
 * @param {number} density - Densité en kg/m³
 * @param {number} velocity - Vitesse en m/s
 * @returns {number} Pression dynamique en Pa
 */
export function calculateDynamicPressure(density, velocity) {
  return 0.5 * density * Math.pow(velocity, 2)
}

/**
 * Calcule le point de rosée
 * @param {number} temperature - Température en Celsius
 * @param {number} humidity - Humidité relative en %
 * @returns {number} Point de rosée en Celsius
 */
export function calculateDewPoint(temperature, humidity) {
  const a = 17.27
  const b = 237.7
  
  const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100)
  const dewPoint = (b * alpha) / (a - alpha)
  
  return dewPoint
}

/**
 * Calcule l'altitude de densité
 * @param {number} pressure - Pression en Pa
 * @param {number} temperature - Température en Celsius
 * @returns {number} Altitude de densité en mètres
 */
export function calculateDensityAltitude(pressure, temperature) {
  const { P0, T0, g, R, L } = CONSTANTS
  const T = celsiusToKelvin(temperature)
  
  // Correction ISA
  const pressureRatio = pressure / P0
  const temperatureRatio = T / T0
  
  const standardAltitude = (T0 / L) * (1 - Math.pow(pressureRatio, (R * L) / g))
  const densityAltitude = standardAltitude + 120 * (temperatureRatio - 1)
  
  return densityAltitude
}

/**
 * Calcule le vent relatif
 * @param {number} windSpeed - Vitesse du vent en m/s
 * @param {number} windDirection - Direction du vent en degrés
 * @param {number} heading - Cap de l'appareil en degrés
 * @returns {Object} Composantes du vent {headwind, crosswind}
 */
export function calculateWindComponents(windSpeed, windDirection, heading) {
  const angle = (windDirection - heading) * (Math.PI / 180)
  
  const headwind = windSpeed * Math.cos(angle)
  const crosswind = windSpeed * Math.sin(angle)
  
  return {
    headwind: Math.round(headwind * 10) / 10,
    crosswind: Math.round(crosswind * 10) / 10,
  }
}

/**
 * Convertit des nœuds en m/s
 */
export function knotsToMS(knots) {
  return knots * 0.514444
}

/**
 * Convertit m/s en nœuds
 */
export function msToKnots(ms) {
  return ms / 0.514444
}

/**
 * Convertit des pieds en mètres
 */
export function feetToMeters(feet) {
  return feet * 0.3048
}

/**
 * Convertit des mètres en pieds
 */
export function metersToFeet(meters) {
  return meters / 0.3048
}

/**
 * Calcule l'indice de chaleur (Heat Index)
 * @param {number} temperature - Température en Celsius
 * @param {number} humidity - Humidité relative en %
 * @returns {number} Indice de chaleur en Celsius
 */
export function calculateHeatIndex(temperature, humidity) {
  const T = temperature
  const RH = humidity
  
  const HI = -8.784695 + 
             1.61139411 * T + 
             2.338549 * RH - 
             0.14611605 * T * RH - 
             0.012308094 * T * T - 
             0.016424828 * RH * RH + 
             0.002211732 * T * T * RH + 
             0.00072546 * T * RH * RH - 
             0.000003582 * T * T * RH * RH
  
  return Math.round(HI * 10) / 10
}
