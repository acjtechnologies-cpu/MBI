import { useState } from 'react'
import { Save, X, Plus, Trash2 } from 'lucide-react'

export default function SouteEditor({ soute, cgVide, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nom: soute?.nom || 'Nouvelle Soute',
    couleur: soute?.couleur || '#6b7280',
    distanceBA: soute?.distanceBA || cgVide,
    capacite: soute?.capacite || 6,
    materiaux: soute?.materiaux || [
      { nom: 'Laiton', masse: 71, stock: 6 }
    ]
  })

  const couleursPredefinies = [
    { nom: 'Gris', hex: '#6b7280' },
    { nom: 'Bleu', hex: '#3b82f6' },
    { nom: 'Vert', hex: '#10b981' },
    { nom: 'Orange', hex: '#f59e0b' },
    { nom: 'Rouge', hex: '#ef4444' },
    { nom: 'Violet', hex: '#8b5cf6' },
    { nom: 'Rose', hex: '#ec4899' },
    { nom: 'Cyan', hex: '#06b6d4' }
  ]

  const ajouterMateriau = () => {
    if (formData.materiaux.length >= 3) {
      alert('Maximum 3 matériaux par soute')
      return
    }

    setFormData({
      ...formData,
      materiaux: [
        ...formData.materiaux,
        { nom: 'Nouveau', masse: 75, stock: 6 }
      ]
    })
  }

  const supprimerMateriau = (index) => {
    if (formData.materiaux.length <= 1) {
      alert('Il faut au moins 1 matériau !')
      return
    }

    const nouveauxMateriaux = formData.materiaux.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      materiaux: nouveauxMateriaux
    })
  }

  const modifierMateriau = (index, champ, valeur) => {
    const nouveauxMateriaux = [...formData.materiaux]
    
    if (champ === 'stock') {
      // Gérer le stock illimité (null)
      nouveauxMateriaux[index][champ] = valeur === '' || valeur === 'unlimited' ? null : parseInt(valeur)
    } else if (champ === 'masse') {
      nouveauxMateriaux[index][champ] = parseInt(valeur) || 0
    } else {
      nouveauxMateriaux[index][champ] = valeur
    }
    
    setFormData({
      ...formData,
      materiaux: nouveauxMateriaux
    })
  }

  const positionRelative = formData.distanceBA - cgVide

  return (
    <div 
      className="border-2 rounded-lg p-4 bg-gray-800"
      style={{ borderColor: formData.couleur }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold" style={{ color: formData.couleur }}>
          ⚙️ ÉDITION SOUTE
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            className="bg-green-600 hover:bg-green-500 p-2 rounded"
          >
            <Save size={16} />
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nom */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1">Nom de la soute</label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold"
          placeholder="Ex: Arrière Aile"
        />
      </div>

      {/* Couleur */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-2">Couleur</label>
        <div className="grid grid-cols-4 gap-2">
          {couleursPredefinies.map((couleur) => (
            <button
              key={couleur.hex}
              onClick={() => setFormData({ ...formData, couleur: couleur.hex })}
              className={`h-10 rounded border-2 transition-all ${
                formData.couleur === couleur.hex 
                  ? 'border-white scale-110' 
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: couleur.hex }}
              title={couleur.nom}
            />
          ))}
        </div>
      </div>

      {/* Distance BA et Position */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Distance BA (mm)</label>
          <input
            type="number"
            value={formData.distanceBA}
            onChange={(e) => setFormData({ ...formData, distanceBA: parseInt(e.target.value) || 0 })}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold"
          />
          <div className="text-xs text-gray-500 mt-1">
            Depuis bord d'attaque
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Position CG (mm)</label>
          <div className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold">
            {positionRelative > 0 ? '+' : ''}{positionRelative}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Relatif au CG
          </div>
        </div>
      </div>

      {/* Capacité */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1">Capacité (blocs par côté)</label>
        <input
          type="number"
          value={formData.capacite}
          onChange={(e) => setFormData({ ...formData, capacite: parseInt(e.target.value) || 0 })}
          min="1"
          max="12"
          className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold"
        />
        <div className="text-xs text-gray-500 mt-1">
          Total : {formData.capacite * 2} blocs (G + D)
        </div>
      </div>

      {/* Matériaux */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">Matériaux (max 3)</label>
          <button
            onClick={ajouterMateriau}
            disabled={formData.materiaux.length >= 3}
            className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
              formData.materiaux.length >= 3
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Plus size={12} />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {formData.materiaux.map((materiau, index) => (
            <div key={index} className="bg-gray-900 border border-gray-600 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={materiau.nom}
                  onChange={(e) => modifierMateriau(index, 'nom', e.target.value)}
                  placeholder="Nom du matériau"
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm font-semibold flex-1 mr-2"
                />
                {formData.materiaux.length > 1 && (
                  <button
                    onClick={() => supprimerMateriau(index)}
                    className="bg-red-900 hover:bg-red-800 p-1 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Masse (g)</label>
                  <input
                    type="number"
                    value={materiau.masse}
                    onChange={(e) => modifierMateriau(index, 'masse', e.target.value)}
                    min="0"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Stock</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={materiau.stock === null ? '' : materiau.stock}
                      onChange={(e) => modifierMateriau(index, 'stock', e.target.value)}
                      placeholder="∞"
                      min="0"
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                    <button
                      onClick={() => modifierMateriau(index, 'stock', 'unlimited')}
                      className={`px-2 py-1 rounded text-xs ${
                        materiau.stock === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                      title="Stock illimité"
                    >
                      ∞
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aide */}
      <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded p-2 text-xs text-blue-200">
        <div className="font-semibold mb-1">💡 Aide :</div>
        <ul className="space-y-0.5 text-[10px]">
          <li>• Distance BA : Mesure depuis le bord d'attaque du planeur</li>
          <li>• Position CG : Calculée automatiquement (BA - CG vide)</li>
          <li>• Stock ∞ : Cliquer sur le bouton ou laisser vide</li>
          <li>• Couleur : Pour identifier la soute dans le barographe</li>
        </ul>
      </div>
    </div>
  )
}
