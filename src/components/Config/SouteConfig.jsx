import { Package, Settings, Ruler, Plus, Minus } from 'lucide-react'
import { useSouteStore } from '../../stores/souteStore'

export default function SouteConfig() {
  const { config, setConfig, clearSoute } = useSouteStore()

  const handleChange = (key, value) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setConfig({ [key]: numValue })
    }
  }

  const handleIncrement = (key, step, max) => {
    const newValue = config[key] + step
    if (newValue <= max) {
      setConfig({ [key]: newValue })
    }
  }

  const handleDecrement = (key, step, min) => {
    const newValue = config[key] - step
    if (newValue >= min) {
      setConfig({ [key]: newValue })
    }
  }

  const sections = [
    {
      title: 'Référence CG (Bord d\'Attaque)',
      icon: Ruler,
      color: 'text-yellow-400',
      params: [
        { key: 'distance_ba', label: 'Distance Bord Attaque → CG 0', min: 0, max: 500, step: 1, unit: 'mm', help: 'Donné par le concepteur du planeur' },
      ]
    },
    {
      title: 'Axes (position relative au CG)',
      icon: Settings,
      color: 'text-green-400',
      params: [
        { key: 'x_av', label: 'Axe AV', min: -200, max: 200, step: 1, unit: 'mm', help: 'Négatif = avant le CG' },
        { key: 'x_c', label: 'Axe C', min: -200, max: 200, step: 1, unit: 'mm' },
        { key: 'x_ar', label: 'Axe AR', min: -200, max: 200, step: 1, unit: 'mm', help: 'Positif = après le CG' },
      ]
    },
    {
      title: 'Capacités (nombre de blocs par côté)',
      icon: Package,
      color: 'text-blue-400',
      params: [
        { key: 'cap_av', label: 'Avant (AV)', min: 0, max: 12, step: 1, unit: 'blocs' },
        { key: 'cap_c', label: 'Central (C)', min: 0, max: 12, step: 1, unit: 'blocs' },
        { key: 'cap_ar', label: 'Arrière (AR)', min: 0, max: 12, step: 1, unit: 'blocs' },
      ]
    },
    {
      title: 'Masses des matériaux',
      icon: Package,
      color: 'text-purple-400',
      params: [
        { key: 'm_W', label: 'Tungstène (W)', min: 0, max: 500, step: 1, unit: 'g', color: 'bg-[#cd7f32]', help: '0 = pas de ballast Tungstène' },
        { key: 'm_L', label: 'Plomb (L)', min: 0, max: 500, step: 1, unit: 'g', color: 'bg-[#c0c0c0]', help: '0 = pas de ballast Plomb' },
        { key: 'm_B', label: 'Laiton (B)', min: 0, max: 500, step: 1, unit: 'g', color: 'bg-[#ffd700]', help: '0 = pas de ballast Laiton' },
      ]
    }
  ]

  // Présets de planeurs connus
  const presets = {
    mamba: {
      name: 'Mamba',
      config: {
        distance_ba: 102,
        x_av: -55,
        x_c: 0,
        x_ar: 22,
        cap_av: 6, cap_c: 6, cap_ar: 6,
        m_W: 164, m_L: 96, m_B: 71
      }
    },
    standard: {
      name: 'Standard F3F',
      config: {
        distance_ba: 100,
        x_av: -50,
        x_c: 0,
        x_ar: 20,
        cap_av: 6, cap_c: 6, cap_ar: 6,
        m_W: 75, m_L: 75, m_B: 75
      }
    }
  }

  const loadPreset = (presetKey) => {
    const preset = presets[presetKey]
    if (preset) {
      setConfig(preset.config)
      clearSoute()
    }
  }

  // Calculs info
  const capaciteTotal = (config.cap_av + config.cap_c + config.cap_ar) * 2
  const masseMax = capaciteTotal * Math.max(config.m_W, config.m_L, config.m_B)
  
  // Distance BA (Bord Attaque)
  const distanceBA = config.distance_ba || 102
  
  // Positions ABSOLUES depuis BA
  const posAV_abs = distanceBA + config.x_av
  const posC_abs = distanceBA + config.x_c
  const posAR_abs = distanceBA + config.x_ar

  return (
    <div className="space-y-6">
      {/* Présets */}
      <div>
        <h3 className="text-lg font-semibold text-blue-400 mb-3">⚡ Présets rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className="bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg p-3 text-sm font-semibold transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sections de configuration */}
      {sections.map((section, idx) => {
        const Icon = section.icon
        return (
          <div key={idx}>
            <h3 className={`text-lg font-semibold ${section.color} mb-3 flex items-center gap-2`}>
              <Icon size={20} />
              {section.title}
            </h3>
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
              {section.params.map((param) => (
                <div key={param.key} className="px-4 py-3">
                  {/* Label avec couleur si matériau */}
                  <div className="flex items-center gap-2 mb-2">
                    {param.color && (
                      <div className={`w-6 h-6 rounded ${param.color} border border-white/20`} />
                    )}
                    <div className="flex-1">
                      <label className="text-sm text-gray-300">{param.label}</label>
                      {param.help && (
                        <div className="text-xs text-gray-500">{param.help}</div>
                      )}
                    </div>
                  </div>

                  {/* Contrôles avec boutons +/- */}
                  <div className="flex items-center gap-1">
                    {/* Bouton - */}
                    <button
                      onClick={() => handleDecrement(param.key, param.step, param.min)}
                      className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-2 active:bg-blue-600"
                      disabled={config[param.key] <= param.min}
                    >
                      <Minus size={16} />
                    </button>
                    
                    {/* Valeur affichée */}
                    <div className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-center font-semibold text-sm">
                      {config[param.key]}
                    </div>
                    
                    {/* Unité */}
                    <div className="w-12 text-xs text-gray-500 text-center">
                      {param.unit}
                    </div>
                    
                    {/* Bouton + */}
                    <button
                      onClick={() => handleIncrement(param.key, param.step, param.max)}
                      className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-2 active:bg-blue-600"
                      disabled={config[param.key] >= param.max}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Informations calculées */}
      <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
        <div className="text-sm text-blue-200">
          <div className="font-semibold mb-2">📊 Positions absolues depuis Bord d'Attaque :</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2 bg-blue-800 bg-opacity-30 rounded p-2">
              <span className="text-gray-300">CG 0 :</span>
              <div className="font-bold text-white text-lg">
                {distanceBA} mm
              </div>
              <div className="text-gray-400 text-[10px]">
                depuis le bord d'attaque
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Soute AV :</span>
              <div className="font-bold text-white">
                {posAV_abs} mm
              </div>
              <div className="text-gray-500 text-[10px]">
                ({distanceBA} + ({config.x_av}))
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Soute C :</span>
              <div className="font-bold text-white">
                {posC_abs} mm
              </div>
              <div className="text-gray-500 text-[10px]">
                ({distanceBA} + {config.x_c})
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Soute AR :</span>
              <div className="font-bold text-white">
                {posAR_abs} mm
              </div>
              <div className="text-gray-500 text-[10px]">
                ({distanceBA} + {config.x_ar})
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Capacité totale :</span>
              <div className="font-bold text-white">{capaciteTotal} blocs</div>
            </div>
            
            <div>
              <span className="text-gray-400">Masse max :</span>
              <div className="font-bold text-white">{(masseMax / 1000).toFixed(2)} kg</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={clearSoute}
          className="flex-1 bg-red-900 hover:bg-red-800 border border-red-700 text-red-200 py-3 rounded-lg font-semibold transition-colors"
        >
          🗑️ Vider la soute
        </button>
        <button
          onClick={() => {
            console.log('Export config', config)
          }}
          className="flex-1 bg-green-900 hover:bg-green-800 border border-green-700 text-green-200 py-3 rounded-lg font-semibold transition-colors"
        >
          💾 Sauvegarder config
        </button>
      </div>

      {/* Aide */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
        <div className="font-semibold text-white mb-1">💡 Utilise les boutons +/- :</div>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>CG 0 :</strong> Mesure {distanceBA} mm depuis BA → CG référence</li>
          <li><strong>Soute AV :</strong> Mesure {posAV_abs} mm depuis BA → Centre AV</li>
          <li><strong>Soute AR :</strong> Mesure {posAR_abs} mm depuis BA → Centre AR</li>
          <li><strong>Convention :</strong> Axe négatif = AVANT CG, positif = APRÈS CG</li>
        </ul>
      </div>
    </div>
  )
}
