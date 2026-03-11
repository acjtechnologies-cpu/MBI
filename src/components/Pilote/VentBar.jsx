import { Wind, Plus, Minus } from 'lucide-react'
import { useAppStore, PARAMS_CONFIG } from '../../stores/appStore'

export default function VentBar() {
  const { params, setParam, incrementParam, decrementParam, selectedParam, selectParam, clearSelection } = useAppStore()
  
  const vent = params.vent
  const config = PARAMS_CONFIG.vent
  const isSelected = selectedParam === 'vent'

  const handleIncrement = () => {
    incrementParam('vent')
  }

  const handleDecrement = () => {
    decrementParam('vent')
  }

  return (
    <div 
      onClick={() => isSelected ? clearSelection() : selectParam('vent')}
      className={`
        rounded-lg p-4 cursor-pointer transition-all
        ${isSelected 
          ? 'bg-green-600 ring-4 ring-green-400' 
          : 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500'
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Wind className="text-white" size={28} />
          <span className="text-lg font-semibold text-white opacity-90">
            {config.label}
          </span>
        </div>
        
        {/* Valeur principale */}
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold text-white">
            {vent.toFixed(config.decimals)}
          </span>
          <span className="text-xl text-white opacity-85 ml-1">
            {config.unit}
          </span>
        </div>
      </div>

      {/* Contrôles si sélectionné */}
      {isSelected && (
        <div className="mt-4 space-y-3">
          {/* Boutons +/- */}
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDecrement()
              }}
              disabled={vent <= config.min}
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2"
            >
              <Minus size={20} />
              -{config.step} {config.unit}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleIncrement()
              }}
              disabled={vent >= config.max}
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              +{config.step} {config.unit}
            </button>
          </div>

          {/* Slider */}
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={vent}
              onChange={(e) => {
                e.stopPropagation()
                setParam('vent', Number(e.target.value))
              }}
              className="w-full accent-white cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-between text-xs text-white opacity-75 mt-1">
              <span>{config.min} {config.unit}</span>
              <span>{config.max} {config.unit}</span>
            </div>
          </div>

          {/* Info */}
          <div className="text-center text-sm text-white opacity-90">
            Ajustez le vent avec les boutons ou le slider
          </div>
        </div>
      )}

      {/* Message si non sélectionné */}
      {!isSelected && (
        <div className="text-center text-sm text-white opacity-75 mt-2">
          Cliquez pour modifier
        </div>
      )}
    </div>
  )
}
