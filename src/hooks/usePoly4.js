import { useState, useCallback } from 'react'

export function usePoly4(initialCoefficients = { a: 0, b: 0, c: 0, d: 0, e: 0 }) {
  const [coefficients, setCoefficients] = useState(initialCoefficients)

  const evaluate = useCallback((x) => {
    const { a, b, c, d, e } = coefficients
    return a * Math.pow(x, 4) + b * Math.pow(x, 3) + c * Math.pow(x, 2) + d * x + e
  }, [coefficients])

  const evaluateDerivative = useCallback((x) => {
    const { a, b, c, d } = coefficients
    return 4 * a * Math.pow(x, 3) + 3 * b * Math.pow(x, 2) + 2 * c * x + d
  }, [coefficients])

  const evaluateSecondDerivative = useCallback((x) => {
    const { a, b, c } = coefficients
    return 12 * a * Math.pow(x, 2) + 6 * b * x + 2 * c
  }, [coefficients])

  const findRoots = useCallback(() => {
    // Méthode de Newton-Raphson simplifiée pour trouver les racines
    const roots = []
    const testPoints = [-10, -5, 0, 5, 10]
    
    for (const x0 of testPoints) {
      let x = x0
      let iterations = 0
      const maxIterations = 100
      const tolerance = 1e-6

      while (iterations < maxIterations) {
        const fx = evaluate(x)
        const fpx = evaluateDerivative(x)

        if (Math.abs(fx) < tolerance) {
          // Vérifier si cette racine n'est pas déjà trouvée
          const isUnique = roots.every(root => Math.abs(root - x) > tolerance)
          if (isUnique) {
            roots.push(x)
          }
          break
        }

        if (Math.abs(fpx) < tolerance) {
          break
        }

        x = x - fx / fpx
        iterations++
      }
    }

    return roots.sort((a, b) => a - b)
  }, [evaluate, evaluateDerivative])

  const generatePoints = useCallback((start, end, numPoints = 100) => {
    const points = []
    const step = (end - start) / numPoints

    for (let i = 0; i <= numPoints; i++) {
      const x = start + i * step
      const y = evaluate(x)
      points.push({ x, y })
    }

    return points
  }, [evaluate])

  return {
    coefficients,
    setCoefficients,
    evaluate,
    evaluateDerivative,
    evaluateSecondDerivative,
    findRoots,
    generatePoints,
  }
}
