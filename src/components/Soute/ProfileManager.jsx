import { Save, Trash2, Upload, Download, FileText } from 'lucide-react'
import { useState } from 'react'

export default function ProfileManager() {
  const [profiles, setProfiles] = useState([
    { id: 1, name: 'Vol Commercial', date: '2026-02-01', weight: 1200 },
    { id: 2, name: 'Vol Cargo', date: '2026-02-05', weight: 1800 },
    { id: 3, name: 'Vol VIP', date: '2026-02-07', weight: 600 },
  ])
  const [newProfileName, setNewProfileName] = useState('')

  const saveProfile = () => {
    if (!newProfileName.trim()) return
    
    const newProfile = {
      id: Date.now(),
      name: newProfileName,
      date: new Date().toISOString().split('T')[0],
      weight: Math.floor(Math.random() * 1500) + 500,
    }
    
    setProfiles(prev => [...prev, newProfile])
    setNewProfileName('')
  }

  const deleteProfile = (id) => {
    setProfiles(prev => prev.filter(p => p.id !== id))
  }

  const loadProfile = (profile) => {
    alert(`Chargement du profil: ${profile.name}`)
  }

  return (
    <div className="space-y-4">
      {/* Nouveau profil */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
          <FileText size={16} />
          Nouveau Profil
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="Nom du profil..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && saveProfile()}
          />
          <button
            onClick={saveProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Sauver
          </button>
        </div>
      </div>

      {/* Liste des profils */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-400">
          Profils Enregistrés ({profiles.length})
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className="bg-gray-900 rounded-lg p-3 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-white">{profile.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {profile.date} • {profile.weight} kg
                  </div>
                </div>
                <button
                  onClick={() => deleteProfile(profile.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => loadProfile(profile)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Upload size={14} />
                  Charger
                </button>
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions globales */}
      <div className="border-t border-gray-700 pt-4 space-y-2">
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2">
          <Upload size={16} />
          Importer des Profils
        </button>
        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2">
          <Download size={16} />
          Exporter Tous les Profils
        </button>
      </div>
    </div>
  )
}
