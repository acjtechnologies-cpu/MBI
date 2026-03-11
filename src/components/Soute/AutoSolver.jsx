import { Wand2, Target, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'

export default function AutoSolver() {
  const [targetCG, setTargetCG] = useState(50)
  const [isSolving, setIsSolving] = useState(false)
  const [solution, setSolution] = useState(null)

  const solve = () => {
    setIsSolving(true)
    
    // Simulation de résolution
    setTimeout(() => {
      const newSolution = {
        success: Math.random() > 0.2,
        iterations: Math.floor(Math.random() * 50) + 10,
        finalCG: targetCG + (Math.random() - 0.5) * 5,
        distribution: [
          { compartment: 'Avant', weight: Math.floor(Math.random() * 300) + 150 },
          { compartment: 'Centre 1', weight: Math.floor(Math.random() * 250) + 100 },
          { compartment: 'Centre 2', weight: Math.floor(Math.random() * 250) + 150 },
          { compartment: 'Arrière', weight: Math.floor(Math.random() * 300) + 100 },
        ],
      }
      setSolution(newSolution)
      setIsSolving(false)
    }, 1500)
  }

  return (
    <div className="space-y-4">
      {/* Configuration */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-4">
        <div>
          <label className="text-sm text-gray-400 flex justify-between mb-2">
            <span>Centre de Gravité Cible (%)</span>
            <span className="text-blue-400 font-semibold">{targetCG}%</span>
          </label>
          <input
            type="range"
            min="30"
            max="70"
            value={targetCG}
            onChange={(e) => setTargetCG(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Avant (30%)</span>
            <span>Neutre (50%)</span>
            <span>Arrière (70%)</span>
          </div>
        </div>

        <button
          onClick={solve}
          disabled={isSolving}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {isSolving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Résolution en cours...
            </>
          ) : (
            <>
              <Wand2 size={20} />
              Résoudre Automatiquement
            </>
          )}
        </button>
      </div>

      {/* Résultats */}
      {solution && (
        <div className={`rounded-lg p-4 border-2 ${
          solution.success
            ? 'bg-green-900 bg-opacity-30 border-green-500'
            : 'bg-red-900 bg-opacity-30 border-red-500'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            {solution.success ? (
              <CheckCircle className="text-green-400" size={24} />
            ) : (
              <XCircle className="text-red-400" size={24} />
            )}
            <h3 className="font-semibold text-lg">
              {solution.success ? 'Solution Trouvée !' : 'Aucune Solution'}
            </h3>
          </div>

          {solution.success && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-gray-400">Itérations</div>
                  <div className="text-2xl font-bold text-blue-400">{solution.iterations}</div>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-gray-400">CG Final</div>
                  <div className="text-2xl font-bold text-green-400">{solution.finalCG.toFixed(1)}%</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Target size={16} />
                  Distribution Optimale
                </div>
                {solution.distribution.map((item, index) => (
                  <div key={index} className="bg-gray-900 rounded p-3 flex justify-between items-center">
                    <span className="text-sm">{item.compartment}</span>
                    <span className="font-bold text-blue-400">{item.weight} kg</span>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
                Appliquer cette Solution
              </button>
            </>
          )}

          {!solution.success && (
            <p className="text-red-300 text-sm">
              Impossible de trouver une configuration satisfaisant tous les critères avec les contraintes actuelles.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
