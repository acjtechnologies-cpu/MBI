import { Edit3, Eye, Plus, Minus } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSouteStore } from '../../stores/souteStore'
import { useESPStore } from '../../stores/espStore'

export default function ParamEditor() {
  const { 
    params, 
    setParam,
    mv, 
    setMv, 
    surface, 
    setSurface,
    chronoC,
    setChronoC,
    chronoR,
    setChronoR,
    lievre,
    setLievre,
    offset
  } = useAppStore()
  
  const { getTotalMass } = useSouteStore()
  const { data: espData } = useESPStore()

  // Calculer les valeurs en lecture
  const souteMass = getTotalMass() / 1000 // kg
  const offsetKg = offset / 1000 // kg
  const masseTotale = mv + souteMass + offsetKg
  const massePoly4 = 3.5 // TODO: Calculer avec Poly4
  const masseOffset = offsetKg
  const masseBallast = souteMass

  // Fonction d'incrémentation/décrémentation
  const handleIncrement = (value, onChange, step, max) => {
    const newValue = value + step
    if (newValue <= max) {
      onChange(newValue)
    }
  }

  const handleDecrement = (value, onChange, step, min) => {
    const newValue = value - step
    if (newValue >= min) {
      onChange(newValue)
    }
  }

  // Fonction de changement qui respecte step/min/max
  const handleChange = (onChange, value, step, min, max) => {
    let numValue = parseFloat(value)
    
    if (isNaN(numValue)) return
    
    // Arrondir selon step
    if (step) {
      numValue = Math.round(numValue / step) * step
    }
    
    // Appliquer min/max
    if (min !== undefined) numValue = Math.max(min, numValue)
    if (max !== undefined) numValue = Math.min(max, numValue)
    
    if (onChange) {
      onChange(numValue)
    }
  }

  // Fonction pour formater l'affichage selon le step
  const formatValue = (value, step) => {
    if (step >= 1) return value.toFixed(0)
    if (step >= 0.1) return value.toFixed(1)
    if (step >= 0.01) return value.toFixed(2)
    return value.toFixed(3)
  }

  // Paramètres variables (éditables)
  const paramsVariables = [
    { label: 'Masse à vide (kg)', value: mv, onChange: setMv, step: 0.01, min: 1.0, max: 6.0 },
    { label: 'Surface alaire (dm²)', value: surface, onChange: setSurface, step: 0.1, min: 10.0, max: 200.0 },
    { label: 'Chrono cible (s)', value: chronoC, onChange: setChronoC, step: 0.01, min: 10, max: 120 },
    { label: 'Chrono réalisé (s)', value: chronoR, onChange: setChronoR, step: 0.01, min: 10, max: 120 },
    { label: 'Chrono Moy. Δt (s)', value: (chronoC + chronoR) / 2, onChange: null, step: 0.01, min: 10, max: 120, readonly: true },
    { label: 'Chrono Lièvre (s)', value: lievre, onChange: setLievre, step: 0.01, min: 10, max: 120 },
    { label: 'Angle vent traversier (°)', value: 0, onChange: null, step: 1, min: -90, max: 90, readonly: true },
    { label: 'QNH (hPa)', value: params.pression, onChange: (v) => setParam('pression', v), step: 1, min: 950, max: 1050 },
    { label: 'Température (°C)', value: params.temperature, onChange: (v) => setParam('temperature', v), step: 0.1, min: -30, max: 50 },
    { label: 'Point de rosée (°C)', value: params.rosee, onChange: (v) => setParam('rosee', v), step: 0.1, min: -30, max: 50 },
   
  ]

  // Paramètres en lecture (calculés ou ESP32)
  const paramsLecture = [
    { label: 'Masse Totale', value: masseTotale.toFixed(3), unit: 'kg' },
    { label: 'Masse Poly4', value: massePoly4.toFixed(3), unit: 'kg' },
    { label: 'Masse offset', value: masseOffset.toFixed(3), unit: 'kg' },
    { label: 'Masse Ballast', value: masseBallast.toFixed(3), unit: 'kg' },
    { label: 'Meteo valeur rr', value: '0,xxx', unit: '' },
    { label: 'Valeur ESP future', value: espData.pitot ? espData.pitot.toFixed(1) : '--', unit: 'm/s' },
    { label: 'Vent Moyen : Anémomètre', value: espData.vent ? espData.vent.toFixed(1) : '--', unit: 'm/s' },
    { label: 'Angle traversier : Girouette', value: '--', unit: '°' },
    { label: 'Température (°C)', value: espData.temperature ? espData.temperature.toFixed(1) : '--', unit: '°C' },
    { label: 'Indice : cisaillement air', value: '--', unit: '' },
    { label: 'Indice : Température Thermoresistance', value: '--', unit: '°C' },
  ]

  return (
    <div className="space-y-6">
      {/* Section PARAMÈTRES Variable */}
      <div>
        <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <Edit3 size={20} />
          LES PARAMÈTRES Variable
        </h3>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
          {paramsVariables.map((param, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3">
              <label className="text-sm text-gray-300 flex-1">{param.label}</label>
              
              {/* Contrôles avec boutons +/- */}
              <div className="flex items-center gap-1">
                {/* Bouton - */}
                {!param.readonly && (
                  <button
                    onClick={() => handleDecrement(param.value, param.onChange, param.step, param.min)}
                    className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-2 active:bg-blue-600"
                    disabled={param.value <= param.min}
                  >
                    <Minus size={16} />
                  </button>
                )}
                
                {/* Valeur affichée */}
                <div className={`
                  ${param.readonly ? 'w-20' : 'w-24'} 
                  bg-gray-900 border border-gray-600 rounded px-3 py-2
                  text-white text-center font-semibold text-sm
                `}>
                  {formatValue(param.value, param.step)}
                </div>
                
                {/* Bouton + */}
                {!param.readonly && (
                  <button
                    onClick={() => handleIncrement(param.value, param.onChange, param.step, param.max)}
                    className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-2 active:bg-blue-600"
                    disabled={param.value >= param.max}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section PARAMÈTRES Lecture */}
      <div>
        <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
          <Eye size={20} />
          LES PARAMÈTRES Lecture
        </h3>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
          {paramsLecture.map((param, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3">
              <label className="text-sm text-gray-400 flex-1">{param.label}</label>
              <div className="text-right">
                <span className="text-white font-semibold text-sm">{param.value}</span>
                {param.unit && <span className="text-gray-500 text-xs ml-1">{param.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3">
        <div className="text-sm text-blue-200">
          <div className="font-semibold mb-1">💡 Aide :</div>
          <ul className="space-y-1 text-xs">
            <li>• Utilise les boutons <Plus size={12} className="inline" /> et <Minus size={12} className="inline" /> pour ajuster</li>
            <li>• <strong>Masse à vide :</strong> incréments de 10g (0.01 kg)</li>
            <li>• <strong>Surface :</strong> en dm² (59 dm² = 0.59 m²), incréments 0.1</li>
            <li>• <strong>Chrono :</strong> précision 1/100 secondes (0.01 s)</li>
            <li>• <strong>Température :</strong> précision 1/10 degré (0.1°C)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
