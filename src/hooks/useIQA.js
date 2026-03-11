import { useState, useEffect } from 'react'

export function useIQA(airspeed, altitude, temperature) {
  const [iqa, setIqa] = useState({
    dynamicPressure: 0,
    density: 0,
    machNumber: 0,
    reynoldsNumber: 0,
  })

  useEffect(() => {
    // Constantes
    const R = 287.05 // Constante des gaz parfaits pour l'air (J/(kg·K))
    const gamma = 1.4 // Rapport des chaleurs spécifiques
    const P0 = 101325 // Pression au niveau de la mer (Pa)
    const T0 = 288.15 // Température au niveau de la mer (K)
    const g = 9.81 // Gravité (m/s²)
    const L = 0.0065 // Gradient thermique (K/m)

    // Température en Kelvin
    const T = temperature + 273.15

    // Pression atmosphérique (formule barométrique)
    const pressure = P0 * Math.pow(1 - (L * altitude) / T0, (g / (R * L)))

    // Densité de l'air
    const density = pressure / (R * T)

    // Pression dynamique
    const dynamicPressure = 0.5 * density * Math.pow(airspeed, 2)

    // Vitesse du son
    const speedOfSound = Math.sqrt(gamma * R * T)

    // Nombre de Mach
    const machNumber = airspeed / speedOfSound

    // Nombre de Reynolds (simplifié, avec longueur caractéristique de 1m)
    const mu = 1.789e-5 // Viscosité dynamique de l'air (Pa·s)
    const reynoldsNumber = (density * airspeed * 1) / mu

    setIqa({
      dynamicPressure,
      density,
      machNumber,
      reynoldsNumber,
    })
  }, [airspeed, altitude, temperature])

  return iqa
}
