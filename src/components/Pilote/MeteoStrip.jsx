import { Cloud, Wind, Droplets, Thermometer, Settings } from 'lucide-react'
import { useAppStore, PARAMS_CONFIG } from '../../stores/appStore'

export default function MeteoStrip() {
  const { params, selectedParam, selectParam, clearSelection } = useAppStore()

  const paramsList = [
    { key: 'pression', icon: Cloud, color: 'text-gray-300' },
    { key: 'altitude', icon: Thermometer, color: 'text-blue-400' },
    { key: 'temperature', icon: Thermometer, color: 'text-orange-400' },
    { key: 'rosee', icon: Droplets, color: 'text-cyan-400' },
  ]

  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg p-4 shadow-lg">
      <div className="grid grid-cols-5 gap-3 items-center">
        {/* Icône Settings */}
        <button
          onClick={() => console.log('Settings')}
          className="h-12 w-12 bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center hover:bg-opacity-70 transition-colors"
        >
          <Settings size={20} className="text-blue-200" />
        </button>

        {/* Paramètres météo */}
        {paramsList.map(({ key, icon: Icon, color }) => {
          const config = PARAMS_CONFIG[key]
          const value = params[key]
          const isSelected = selectedParam === key

          return (
            <button
              key={key}
              onClick={() => isSelected ? clearSelection() : selectParam(key)}
              className={`
                h-12 rounded-lg flex flex-col items-center justify-center
                transition-all cursor-pointer
                ${isSelected 
                  ? 'bg-blue-500 ring-2 ring-white' 
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                }
              `}
            >
              <div className="flex items-center gap-1">
                <Icon size={14} className={color} />
                <span className="text-xs text-blue-200">{config.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">
                  {value.toFixed(config.decimals)}
                </span>
                <span className="text-xs text-blue-200">{config.unit}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Message si paramètre sélectionné */}
      {selectedParam && (
        <div className="mt-3 text-center text-sm text-blue-200 animate-pulse">
          Utilisez les flèches pour modifier {PARAMS_CONFIG[selectedParam].label}
        </div>
      )}
    </div>
  )
}
