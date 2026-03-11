import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import { useAppStore, PARAMS_CONFIG } from '../../stores/appStore'
import { useState, useEffect } from 'react'

export default function ArrowControls() {
  const { 
    selectedParam, 
    params,
    incrementParam, 
    decrementParam,
    incrementOffset,
    decrementOffset,
    offset,
    resetParams 
  } = useAppStore()
  
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [pressInterval, setpressInterval] = useState(null)

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      if (longPressTimer) clearTimeout(longPressTimer)
      if (pressInterval) clearInterval(pressInterval)
    }
  }, [longPressTimer, pressInterval])

  const handlePressStart = (action) => {
    // Exécution immédiate
    action()
    
    // Long press: après 500ms, répéter toutes les 150ms
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        action()
      }, 150)
      setPressInterval(interval)
    }, 500)
    
    setLongPressTimer(timer)
  }

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    if (pressInterval) {
      clearInterval(pressInterval)
      setPressInterval(null)
    }
  }

  const handleIncrement = () => {
    if (selectedParam === 'offset') {
      incrementOffset()
    } else if (selectedParam && PARAMS_CONFIG[selectedParam]) {
      incrementParam(selectedParam)
    }
  }

  const handleDecrement = () => {
    if (selectedParam === 'offset') {
      decrementOffset()
    } else if (selectedParam && PARAMS_CONFIG[selectedParam]) {
      decrementParam(selectedParam)
    }
  }

  // Déterminer les valeurs actuelles et config
  const getCurrentValue = () => {
    if (selectedParam === 'offset') return offset
    if (selectedParam && params[selectedParam] !== undefined) return params[selectedParam]
    return null
  }

  const getCurrentConfig = () => {
    if (selectedParam === 'offset') {
      return { label: 'Offset', unit: 'g', decimals: 0, min: -170, max: 170 }
    }
    if (selectedParam && PARAMS_CONFIG[selectedParam]) {
      return PARAMS_CONFIG[selectedParam]
    }
    return null
  }

  const currentValue = getCurrentValue()
  const currentConfig = getCurrentConfig()

  const canIncrement = currentValue !== null && currentConfig && currentValue < currentConfig.max
  const canDecrement = currentValue !== null && currentConfig && currentValue > currentConfig.min

  return (
    <div className="space-y-4">
      {/* Affichage paramètre sélectionné */}
      {selectedParam && currentConfig ? (
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-2">{currentConfig.label}</div>
          <div className="text-4xl font-bold text-white flex items-baseline justify-center gap-2">
            <span>{currentValue?.toFixed(currentConfig.decimals)}</span>
            <span className="text-xl text-gray-400">{currentConfig.unit}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {currentConfig.min} — {currentConfig.max} {currentConfig.unit}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-4 text-center text-gray-500 text-sm">
          Sélectionnez un paramètre pour le modifier
        </div>
      )}

      {/* Contrôles flèches */}
      <div className="grid grid-cols-2 gap-4">
        {/* Flèche HAUT */}
        <button
          onMouseDown={() => handlePressStart(handleIncrement)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => handlePressStart(handleIncrement)}
          onTouchEnd={handlePressEnd}
          disabled={!canIncrement}
          className={`
            h-32 rounded-lg flex flex-col items-center justify-center gap-2
            transition-all font-semibold text-lg
            ${canIncrement
              ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <ChevronUp size={40} />
          <span>Augmenter</span>
        </button>

        {/* Flèche BAS */}
        <button
          onMouseDown={() => handlePressStart(handleDecrement)}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => handlePressStart(handleDecrement)}
          onTouchEnd={handlePressEnd}
          disabled={!canDecrement}
          className={`
            h-32 rounded-lg flex flex-col items-center justify-center gap-2
            transition-all font-semibold text-lg
            ${canDecrement
              ? 'bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white cursor-pointer'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <ChevronDown size={40} />
          <span>Diminuer</span>
        </button>
      </div>

      {/* Bouton Reset */}
      <button
        onClick={resetParams}
        className="w-full bg-red-900 hover:bg-red-800 text-red-200 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors"
      >
        <RotateCcw size={20} />
        Réinitialiser tous les paramètres
      </button>

      {/* Instructions */}
      <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3 text-xs text-blue-200">
        <div className="font-semibold mb-1">💡 Astuce :</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Appui court : ajuste d'un cran</li>
          <li>Appui long : répétition rapide</li>
          <li>Reset : remet les valeurs par défaut</li>
        </ul>
      </div>
    </div>
  )
}
