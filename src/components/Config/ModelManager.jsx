import { useState, useEffect } from 'react'
import { useModelStore } from '../../stores/modelStore'
import { useMatrixStore } from '../Pilote/matrixStore'
import { Edit3, Trash2, Copy, Download, Save, X, Plus } from 'lucide-react'
import SouteEditor from './SouteEditor'
import NezConfig from '../Pilote/NezConfig'
import MatriceInteractive from '../Pilote/MatriceInteractive'

export default function ModelManager({ onOpenBrowser }) {
  const {
    models, activeModelId, getActiveModel, setActiveModel,
    updateModel, deleteModel, duplicateModel, updateMatrix,
    addSoute, updateSoute, deleteSoute, exportModel, importModel
  } = useModelStore()

  const [editingModel, setEditingModel]  = useState(null)
  const [editingSoute, setEditingSoute]  = useState(null)
  const [showMatrice, setShowMatrice]    = useState(false)

  const activeModel = useModelStore(s => s.models?.[s.activeModelId] ?? null)

  // Init matrixStore quand on ouvre l'onglet matrice
  useEffect(() => {
    if (!showMatrice || !activeModel) return
    const soutesRaw = activeModel.soutes ? Object.values(activeModel.soutes) : []
    const soutes    = [...soutesRaw].sort((a, b) => a.distanceBA - b.distanceBA)
    const MAT_KEYS  = ['av', 'c', 'ar'].slice(0, soutes.length)
    const already   = useMatrixStore.getState().model
    if (already?.id !== activeModel.id) {
      useMatrixStore.getState().init(activeModel, soutes, MAT_KEYS, activeModel.matrix || [])
    }
    useMatrixStore.getState().setCi(0)
  }, [showMatrice, activeModel?.id])

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
    // Sync matrice avant export
    const mst = useMatrixStore.getState()
    if (mst.model?.id === activeModel.id && mst.matrix?.length) {
      updateMatrix(mst.matrix)
    }
    const json = exportModel(activeModel.id)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${activeModel.nom}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDuplicate = () => {
    if (!activeModel) return
    if (activeModel.nom.endsWith('(copie)')) {
      alert('Renommez ce modèle avant de le dupliquer à nouveau.')
      setEditingModel(activeModel.id)
      return
    }
    const newId = duplicateModel(activeModel.id)
    if (newId) {
      setActiveModel(newId)
      setTimeout(() => setEditingModel(newId), 100)
    }
  }

  if (!activeModel) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-gray-400 text-center mb-6">
          <div className="text-4xl mb-2">✈️</div>
          <div className="text-lg">Aucun modèle</div>
          <div className="text-sm mt-1 text-gray-500">Télécharge un planeur depuis le catalogue</div>
        </div>
        <button
          onClick={() => onOpenBrowser?.()}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          style={{ touchAction: 'manipulation' }}
        >
          🛩️ Catalogue planeurs
        </button>
      </div>
    )
  }

  const soutesList = activeModel.soutes ? Object.values(activeModel.soutes) : []

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-400">📋 MODÈLE ACTIF</h2>
            <div className="text-white font-semibold mt-0.5">{activeModel.drapeau} {activeModel.nom}</div>
          </div>
          <button
            onClick={() => onOpenBrowser?.()}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1"
            style={{ touchAction: 'manipulation' }}
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
              style={{ touchAction: 'manipulation' }}
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

        {/* Onglet Matrice */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setShowMatrice(v => !v)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-left font-semibold flex items-center justify-between"
            style={{ touchAction: 'manipulation' }}
          >
            <span>🎯 Matrice de lestage ({activeModel?.matrix?.length || 0} configs)</span>
            <span style={{ fontSize: 12, color: '#8b949e' }}>{showMatrice ? '▲ Fermer' : '▼ Ouvrir'}</span>
          </button>
          {showMatrice && activeModel?.matrix?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <MatriceInteractive
                targetGAuto={Math.round((activeModel.masse_ref_8ms || 3.330) * 1000)}
                onAppliquer={() => {
                  const mst = useMatrixStore.getState()
                  if (mst.matrix?.length) updateMatrix(mst.matrix)
                  setShowMatrice(false)
                }}
              />
            </div>
          )}
          {showMatrice && (!activeModel?.matrix || activeModel.matrix.length === 0) && (
            <div style={{ marginTop: 8, padding: 16, background: '#161b22', borderRadius: 8, color: '#8b949e', fontSize: 12, textAlign: 'center' }}>
              Aucune configuration. Importez un modèle avec une matrice depuis le catalogue.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 grid grid-cols-3 gap-2">
        <button
          onClick={handleDuplicate}
          className="bg-blue-900 hover:bg-blue-800 border border-blue-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          style={{ touchAction: 'manipulation' }}
        >
          <Copy size={18} />Dupliquer
        </button>
        <button
          onClick={handleExport}
          className="bg-green-900 hover:bg-green-800 border border-green-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          style={{ touchAction: 'manipulation' }}
        >
          <Download size={18} />Exporter
        </button>
        <button
          onClick={() => { if (confirm(`Supprimer ${activeModel.nom} ?`)) deleteModel(activeModel.id) }}
          className="bg-red-900 hover:bg-red-800 border border-red-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          style={{ touchAction: 'manipulation' }}
        >
          <Trash2 size={18} />Supprimer
        </button>
      </div>
    </div>
  )
}

function ModelInfoCard({ model, isEditing, onEdit, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nom: model?.nom || '', drapeau: model?.drapeau || '🛩️',
    masseVide: model?.masseVide || 2500, cgVide: model?.cgVide || 100,
    surface: model?.surface || 57, masse_ref_8ms: model?.masse_ref_8ms || 3.330
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
              <input type="text" value={formData.drapeau} onChange={e => setFormData({...formData, drapeau: e.target.value})} className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-2 text-center text-xl" maxLength={2} />
              <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-semibold" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Masse vide (g)</label>
            <input type="number" value={formData.masseVide} onChange={e => setFormData({...formData, masseVide: +e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400">CG vide (mm)</label>
            <input type="number" value={formData.cgVide} onChange={e => setFormData({...formData, cgVide: +e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Surface (dm²)</label>
            <input type="number" value={formData.surface} onChange={e => setFormData({...formData, surface: +e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400">ADN 8m/s (kg)</label>
            <input type="number" step="0.001" value={formData.masse_ref_8ms} onChange={e => setFormData({...formData, masse_ref_8ms: +e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400">📋 MODÈLE</h3>
        <button onClick={onEdit} className="text-gray-400 hover:text-white p-1 rounded"><Edit3 size={16} /></button>
      </div>
      <div className="text-center mb-3">
        <div className="text-4xl mb-1">{model.drapeau}</div>
        <div className="text-xl font-bold text-white">{model.nom}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-gray-400">Masse vide</span><div className="text-white font-semibold">{model.masseVide}g</div></div>
        <div><span className="text-gray-400">CG / Surface</span><div className="text-white font-semibold">{model.cgVide}mm · {model.surface}dm²</div></div>
        <div className="col-span-2"><span className="text-gray-400">ADN planeur — Masse 8m/s</span><div className="text-green-400 font-bold text-lg">{((model.masse_ref_8ms || 3.330)).toFixed(3)} kg</div></div>
      </div>
    </div>
  )
}

function SouteCard({ soute, modelId, cgVide, isEditing, onEdit, onSave, onCancel, onDelete }) {
  if (isEditing) {
    return <SouteEditor soute={soute} cgVide={cgVide} onSave={onSave} onCancel={onCancel} />
  }
  const posBA = soute.distanceBA - cgVide
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: soute.couleur || '#6b7280' }} />
          <span className="font-semibold text-white">{soute.nom}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="text-gray-400 hover:text-white p-1 rounded"><Edit3 size={14} /></button>
          <button onClick={onDelete} className="text-red-400 hover:text-red-300 p-1 rounded"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        <div>Distance BA<div className="text-white">{soute.distanceBA} mm</div></div>
        <div>Position CG<div className="text-white">{posBA > 0 ? '+' : ''}{posBA} mm</div></div>
        <div>Capacité<div className="text-white">{soute.capacite} blocs par côté</div></div>
        <div>Matériaux<div className="text-white">{(soute.materiaux || []).map(m => `${m.nom} ${m.masse}g`).join(', ')}</div></div>
      </div>
    </div>
  )
}
