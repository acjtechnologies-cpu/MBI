import { useState } from 'react'
import { useModelStore } from '../../stores/modelStore'
import { Edit3, Trash2, Copy, Download, Settings, Save, X, Plus } from 'lucide-react'
import SouteEditor from './SouteEditor'
import NezConfig from '../Pilote/NezConfig'
import GliderBrowser from '../GliderBrowser'

export default function ModelManager() {
  const {
    models, activeModelId, getActiveModel, setActiveModel,
    updateModel, deleteModel, duplicateModel,
    addSoute, updateSoute, deleteSoute, exportModel, importModel
  } = useModelStore()

  const [editingModel, setEditingModel] = useState(null)
  const [editingSoute, setEditingSoute] = useState(null)
  const [showBrowser, setShowBrowser] = useState(false)

  const activeModel = getActiveModel()

  const handleBrowserImport = (modelData) => {
    importModel(modelData)
    setActiveModel(modelData.id)
    setShowBrowser(false)
  }

  const handleCreateSoute = () => {
    if (!activeModel) return
    const newId = `soute-${Date.now()}`
    addSoute(activeModel.id, {
      id: newId, nom: 'Nouvelle Soute', couleur: '#6b7280',
      distanceBA: activeModel.cgVide || 100, capacite: 6,
      materiaux: [{ nom: 'Laiton', masse: 71, stock: 6 }]
    })
    setEditingSoute(newId)
  }

  const handleExport = () => {
    if (!activeModel) return
    const json = exportModel(activeModel.id)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeModel.nom}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDuplicate = () => {
    if (!activeModel) return
    const newId = duplicateModel(activeModel.id)
    if (newId) setActiveModel(newId)
  }

  // — Aucun modèle : afficher le catalogue GitHub
  if (!activeModel) {
    return (
      <>
        {showBrowser && (
          <GliderBrowser
            onClose={() => setShowBrowser(false)}
            onImport={handleBrowserImport}
          />
        )}
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-gray-400 text-center mb-6">
            <div className="text-4xl mb-2">✈️</div>
            <div className="text-lg">Aucun modèle</div>
            <div className="text-sm mt-1 text-gray-500">Télécharge un planeur depuis le catalogue</div>
          </div>
          <button
            onClick={() => setShowBrowser(true)}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            🛩️ Catalogue planeurs
          </button>
        </div>
      </>
    )
  }

  const soutesList = activeModel.soutes ? Object.values(activeModel.soutes) : []

  return (
    <>
      {showBrowser && (
        <GliderBrowser
          onClose={() => setShowBrowser(false)}
          onImport={handleBrowserImport}
        />
      )}

      <div className="h-full flex flex-col overflow-y-auto bg-gray-950">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-blue-400">📋 MODÈLE ACTIF</h2>
              <div className="text-white font-semibold mt-0.5">{activeModel.drapeau} {activeModel.nom}</div>
            </div>
            <button
              onClick={() => setShowBrowser(true)}
              className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              🛩️ PLANEUR
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <ModelInfoCard
            model={activeModel}
            isEditing={editingModel === activeModel.id}
            onEdit={() => setEditingModel(activeModel.id)}
            onSave={(updates) => { updateModel(activeModel.id, updates); setEditingModel(null) }}
            onCancel={() => setEditingModel(null)}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-400">🎯 SOUTES ({soutesList.length})</h3>
              <button
                onClick={handleCreateSoute}
                className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <Plus size={16} />Ajouter
              </button>
            </div>

            {soutesList.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center text-gray-400">
                <div className="text-2xl mb-2">📦</div>
                <div>Aucune soute configurée</div>
              </div>
            ) : (
              soutesList.map(soute => (
                <SouteCard
                  key={soute.id} soute={soute} modelId={activeModel.id} cgVide={activeModel.cgVide}
                  isEditing={editingSoute === soute.id}
                  onEdit={() => setEditingSoute(soute.id)}
                  onSave={(updates) => { updateSoute(activeModel.id, soute.id, updates); setEditingSoute(null) }}
                  onCancel={() => setEditingSoute(null)}
                  onDelete={() => { if (confirm(`Supprimer ${soute.nom} ?`)) deleteSoute(activeModel.id, soute.id) }}
                />
              ))
            )}
          </div>

          <NezConfig />
        </div>

        {/* Footer actions */}
        <div className="bg-gray-900 border-t border-gray-800 p-4 grid grid-cols-3 gap-2">
          <button
            onClick={handleDuplicate}
            className="bg-blue-900 hover:bg-blue-800 border border-blue-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <Copy size={18} />Dupliquer
          </button>
          <button
            onClick={handleExport}
            className="bg-green-900 hover:bg-green-800 border border-green-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <Download size={18} />Exporter
          </button>
          <button
            onClick={() => { if (confirm(`Supprimer ${activeModel.nom} ?`)) deleteModel(activeModel.id) }}
            className="bg-red-900 hover:bg-red-800 border border-red-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <Trash2 size={18} />Supprimer
          </button>
        </div>
      </div>
    </>
  )
}

function ModelInfoCard({ model, isEditing, onEdit, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nom: model?.nom || '', drapeau: model?.drapeau || '🛩️',
    masseVide: model?.masseVide || 2500, cgVide: model?.cgVide || 100,
    surface: model?.surface || 59, masse_ref_8ms: model?.masse_ref_8ms || 3.474
  })
  if (!model) return null

  if (isEditing) {
    return (
      <div className="bg-gray-800 border border-blue-500 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-400">✏️ ÉDITION MODÈLE</h3>
          <div className="flex gap-2">
            <button onClick={() => onSave(formData)} className="bg-green-600 hover:bg-green-500 p-2 rounded"><Save size={16} /></button>
            <button onClick={onCancel} className="bg-gray-700 hover:bg-gray-600 p-2 rounded"><X size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-400">Nom du modèle</label>
            <div className="flex gap-2">
              <input type="text" value={formData.drapeau} onChange={(e) => setFormData({...formData, drapeau: e.target.value})} className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-2 text-center text-xl" maxLength={2} />
              <input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Masse à vide (g)</label>
            <input type="number" value={formData.masseVide} onChange={(e) => setFormData({...formData, masseVide: parseInt(e.target.value) || 0})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold" />
          </div>
          <div>
            <label className="text-xs text-gray-400">CG vide (mm)</label>
            <input type="number" value={formData.cgVide} onChange={(e) => setFormData({...formData, cgVide: parseInt(e.target.value) || 0})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Surface alaire (dm²)</label>
            <input type="number" step="0.1" value={formData.surface} onChange={(e) => setFormData({...formData, surface: parseFloat(e.target.value) || 0})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold" />
          </div>
          <div>
            <label style={{fontSize:11,color:'#9ca3af',display:'block',marginBottom:4}}>Masse ref 8 m/s (kg)</label>
            <input type="number" step="0.001" value={formData.masse_ref_8ms} onChange={(e) => setFormData({...formData, masse_ref_8ms: parseFloat(e.target.value) || 3.474})} style={{width:'100%',background:'#111827',border:'1px solid #16a34a',borderRadius:6,padding:'8px 12px',color:'#4ade80',fontWeight:700}} />
            <div style={{fontSize:10,color:'#6b7280',marginTop:3}}>Offset vs Pike : {Math.round((formData.masse_ref_8ms - 3.474) * 1000)}g</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400">📋 MODÈLE</h3>
        <button onClick={onEdit} className="bg-gray-700 hover:bg-gray-600 p-2 rounded"><Edit3 size={16} /></button>
      </div>
      <div className="text-center mb-3">
        <div className="text-3xl mb-1">{model.drapeau}</div>
        <div className="text-xl font-bold text-white">{model.nom}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-center"><div className="text-gray-400">Masse vide</div><div className="text-white font-semibold">{model.masseVide}g</div></div>
        <div className="text-center"><div className="text-gray-400">CG / Surface</div><div className="text-white font-semibold">{model.cgVide}mm · {model.surface}dm²</div></div>
        <div className="col-span-2 text-center" style={{borderTop:'1px solid #374151',paddingTop:6,marginTop:2}}>
          <div className="text-gray-400" style={{fontSize:10}}>ADN planeur — Masse 8m/s</div>
          <div style={{color:'#4ade80',fontWeight:700,fontSize:16}}>{(model.masse_ref_8ms||3.474).toFixed(3)} kg</div>
          <div style={{fontSize:9,color:'#6b7280'}}>{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)>0?'+':''}{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)}g vs Pike ref</div>
        </div>
      </div>
    </div>
  )
}

function SouteCard({ soute, modelId, cgVide, isEditing, onEdit, onSave, onCancel, onDelete }) {
  if (!soute) return null
  const positionRelative = soute.distanceBA - cgVide
  if (isEditing) return <SouteEditor soute={soute} cgVide={cgVide} onSave={onSave} onCancel={onCancel} />
  return (
    <div className="border-2 bg-gray-800 rounded-lg p-4" style={{ borderColor: soute.couleur }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2" style={{ color: soute.couleur }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: soute.couleur }}></div>
          {soute.nom}
        </h4>
        <div className="flex gap-2">
          <button onClick={onEdit} className="bg-gray-700 hover:bg-gray-600 p-2 rounded" style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><Settings size={16} /></button>
          <button onClick={onDelete} className="bg-red-900 hover:bg-red-800 p-2 rounded" style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div><div className="text-gray-400">Distance BA</div><div className="text-white font-semibold">{soute.distanceBA} mm</div></div>
        <div><div className="text-gray-400">Position CG</div><div className="text-white font-semibold">{positionRelative > 0 ? '+' : ''}{positionRelative} mm</div></div>
        <div className="col-span-2"><div className="text-gray-400">Capacité</div><div className="text-white font-semibold">{soute.capacite} blocs par côté</div></div>
      </div>
      <div>
        <div className="text-gray-400 text-xs mb-2">Matériaux</div>
        <div className="flex gap-2">
          {soute.materiaux?.map((mat, i) => (
            <div key={i} className="flex-1 bg-gray-900 rounded px-2 py-1 text-center">
              <div className="text-white font-semibold text-sm">{mat.masse}g</div>
              <div className="text-gray-500 text-xs">{mat.stock !== null ? `Stock: ${mat.stock}` : '∞'}</div>
            </div>
          )) || <div className="text-gray-500 text-sm">Aucun matériau</div>}
        </div>
      </div>
    </div>
  )
}
