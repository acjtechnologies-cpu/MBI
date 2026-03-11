import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Constantes IQA
const RHO0 = 1.225  // Densité air niveau mer (kg/m³)
const BUFFER_SIZE = 50  // Taille buffer pour moyennes glissantes

// Calcul densité air
function calculateDensity(pressure, temperature) {
  const R = 287.05  // Constante gaz parfait air
  const T = temperature + 273.15  // Kelvin
  return pressure * 100 / (R * T)  // pressure en hPa -> Pa
}

// Calcul coefficient de viscosité
function calculateCV(density, vitesse) {
  if (vitesse === 0) return 0
  return (density * vitesse * vitesse) / 2
}

// Classification état air
function classifyAirState(sigma, gradient) {
  // Sigma = écart-type conditions
  // Gradient = variation temporelle
  
  if (sigma < 0.05 && Math.abs(gradient) < 0.01) {
    return { state: 'STABLE', color: 'green', confidence: 95 }
  }
  
  if (sigma < 0.15 && Math.abs(gradient) < 0.05) {
    return { state: 'NORMAL', color: 'blue', confidence: 80 }
  }
  
  if (sigma < 0.30 && Math.abs(gradient) < 0.10) {
    return { state: 'VARIABLE', color: 'yellow', confidence: 60 }
  }
  
  return { state: 'INSTABLE', color: 'red', confidence: 40 }
}

export const useIQAStore = create(
  persist(
    (set, get) => ({
      // === ÉTAT IQA ===
      iqa: {
        density: null,      // Densité air (kg/m³)
        sigma: null,        // Écart-type normalisé
        cv: null,           // Coefficient viscosité
        gradient: null,     // Gradient temporel
        state: null,        // Classification
        confidence: null,   // Confiance %
      },
      
      // === BUFFER DONNÉES ===
      buffer: {
        pitot: [],
        vent: [],
        temperature: [],
        pression: [],
      },
      
      // === RUN EN COURS ===
      runActive: false,
      runStartTime: null,
      runData: [],
      
      // === HISTORIQUE RUNS ===
      runs: [],
      
      // === SUGGESTIONS ===
      suggestion: null,  // Suggestion ballast actuelle
      
      // === ACTIONS ===
      
      // Mettre à jour IQA avec nouvelles données capteurs
      updateIQA: (espData) => {
        const { buffer } = get()
        
        // Ajouter aux buffers
        const newBuffer = {
          pitot: [...buffer.pitot, espData.pitot].slice(-BUFFER_SIZE),
          vent: [...buffer.vent, espData.vent].slice(-BUFFER_SIZE),
          temperature: [...buffer.temperature, espData.temperature].slice(-BUFFER_SIZE),
          pression: [...buffer.pression, espData.pression].slice(-BUFFER_SIZE),
        }
        
        // Calculer densité
        const density = calculateDensity(
          espData.pression || 1013,
          espData.temperature || 15
        )
        
        // Calculer CV
        const cv = calculateCV(density, espData.pitot || 0)
        
        // Calculer sigma (écart-type normalisé sur buffer)
        const sigma = newBuffer.pitot.length > 5
          ? calculateSigma(newBuffer.pitot)
          : null
        
        // Calculer gradient (variation temporelle)
        const gradient = newBuffer.pitot.length > 10
          ? calculateGradient(newBuffer.pitot)
          : null
        
        // Classifier état
        const classification = sigma !== null && gradient !== null
          ? classifyAirState(sigma, gradient)
          : { state: 'UNKNOWN', color: 'gray', confidence: 0 }
        
        set({
          buffer: newBuffer,
          iqa: {
            density,
            sigma,
            cv,
            gradient,
            state: classification.state,
            confidence: classification.confidence,
            color: classification.color,
          },
        })
      },
      
      // === GESTION RUN ===
      
      // Démarrer un RUN
      startRun: () => {
        set({
          runActive: true,
          runStartTime: Date.now(),
          runData: [],
        })
      },
      
      // Enregistrer point de données pendant RUN
      recordRunData: (espData, iqaData) => {
        const { runData, runStartTime } = get()
        
        if (!get().runActive) return
        
        const newData = [
          ...runData,
          {
            timestamp: Date.now() - runStartTime,  // Temps relatif (ms)
            ...espData,
            ...iqaData,
          },
        ]
        
        set({ runData: newData })
      },
      
      // Arrêter RUN et sauvegarder
      stopRun: (name) => {
        const { runData, runStartTime, runs } = get()
        
        if (!get().runActive) return null
        
        const run = {
          id: Date.now(),
          name: name || `Run ${runs.length + 1}`,
          startTime: runStartTime,
          duration: Date.now() - runStartTime,
          data: runData,
          stats: calculateRunStats(runData),
          createdAt: new Date().toISOString(),
        }
        
        set({
          runActive: false,
          runStartTime: null,
          runData: [],
          runs: [...runs, run],
        })
        
        return run
      },
      
      // Annuler RUN en cours
      cancelRun: () => {
        set({
          runActive: false,
          runStartTime: null,
          runData: [],
        })
      },
      
      // === HISTORIQUE ===
      
      deleteRun: (id) => set((state) => ({
        runs: state.runs.filter(r => r.id !== id),
      })),
      
      clearRuns: () => set({ runs: [] }),
      
      // Export RUN en JSONL
      exportRun: (id) => {
        const { runs } = get()
        const run = runs.find(r => r.id === id)
        if (!run) return null
        
        // Format JSONL (une ligne par point de données)
        return run.data.map(d => JSON.stringify(d)).join('\n')
      },
      
      // Export tous les RUNs
      exportAllRuns: () => {
        const { runs } = get()
        return JSON.stringify(runs, null, 2)
      },
      
      // === SUGGESTIONS BALLAST ===
      
      // Générer suggestion basée sur IQA
      generateSuggestion: (currentMass, targetMass) => {
        const { iqa } = get()
        
        if (!iqa.state || iqa.confidence < 50) {
          set({ suggestion: null })
          return null
        }
        
        const delta = targetMass - currentMass
        
        const suggestion = {
          delta,  // g
          direction: delta > 0 ? 'ADD' : delta < 0 ? 'REMOVE' : 'OK',
          confidence: iqa.confidence,
          reason: generateReason(iqa, delta),
        }
        
        set({ suggestion })
        return suggestion
      },
      
      clearSuggestion: () => set({ suggestion: null }),
      
      // === RESET ===
      
      clearBuffer: () => set({
        buffer: { pitot: [], vent: [], temperature: [], pression: [] },
      }),
    }),
    {
      name: 'mbi-iqa-storage',
      version: 1,
      partialize: (state) => ({
        // Ne persister que les runs
        runs: state.runs,
      }),
    }
  )
)

// === FONCTIONS HELPER ===

function calculateSigma(values) {
  if (values.length < 2) return 0
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  
  return mean > 0 ? Math.sqrt(variance) / mean : 0
}

function calculateGradient(values) {
  if (values.length < 2) return 0
  
  // Régression linéaire simple
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = values
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  return slope
}

function calculateRunStats(data) {
  if (data.length === 0) return null
  
  const pitotValues = data.map(d => d.pitot).filter(v => v != null)
  const ventValues = data.map(d => d.vent).filter(v => v != null)
  
  return {
    pitot: {
      min: Math.min(...pitotValues),
      max: Math.max(...pitotValues),
      avg: pitotValues.reduce((a, b) => a + b, 0) / pitotValues.length,
    },
    vent: {
      min: Math.min(...ventValues),
      max: Math.max(...ventValues),
      avg: ventValues.reduce((a, b) => a + b, 0) / ventValues.length,
    },
    samples: data.length,
  }
}

function generateReason(iqa, delta) {
  if (delta === 0) {
    return 'Masse optimale atteinte'
  }
  
  if (iqa.state === 'STABLE') {
    return delta > 0 
      ? 'Conditions stables, ajouter ballast'
      : 'Conditions stables, retirer ballast'
  }
  
  if (iqa.state === 'VARIABLE' || iqa.state === 'INSTABLE') {
    return 'Conditions variables, attendre stabilisation'
  }
  
  return 'Ajuster selon conditions'
}
