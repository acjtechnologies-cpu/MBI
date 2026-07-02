import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const GITHUB_RAW = 'https://raw.githubusercontent.com/acjtechnologies-cpu/MBI/principal'
const INDEX_URL  = `${GITHUB_RAW}/planeurs/index.json`

export default function GliderBrowser({ onClose, onImport }) {
  const [loading, setLoading]   = useState(true)
  const [list, setList]         = useState([])
  const [importing, setImporting] = useState(null)
  const [error, setError]       = useState(null)

  useEffect(() => {
    fetch(INDEX_URL)
      .then(r => r.json())
      .then(data => { setList(data.planeurs || []); setLoading(false) })
      .catch(() => { setError('Impossible de charger la liste'); setLoading(false) })
  }, [])

  const handleImportLocal = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.id || !data.nom) { setError('Fichier invalide : id ou nom manquant'); return }
        onImport(data)
      } catch {
        setError('Erreur lecture JSON')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async (planeur) => {
    setImporting(planeur.id)
    try {
      const url = `${GITHUB_RAW}/${planeur.url}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      onImport(data)
    } catch (e) {
      setError('Erreur import: ' + e.message)
    }
    setImporting(null)
  }

  const content = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      paddingTop: 'env(safe-area-inset-top, 0px)',
      background: '#05070a',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'sans-serif',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(13,17,23,0.95)',
      }}>
        <div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Planeurs disponibles</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>ACJ Technologies · GitHub</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{
            background: 'rgba(80,160,255,0.2)', border: '1px solid rgba(80,160,255,0.5)',
            borderRadius: 8, padding: '7px 13px', color: '#7ac0ff', fontSize: 12,
            fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation',
          }}>
            📂 Fichier local
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportLocal} />
          </label>
          <button
            onClick={onClose}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: 30, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '6px 12px', lineHeight: 1, borderRadius: 8, touchAction: 'manipulation' }}
          >&times;</button>
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {loading && (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
            Chargement...
          </div>
        )}
        {error && (
          <div style={{ color: '#ff6b6b', textAlign: 'center', marginTop: 40, fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && list.map(p => (
          <div key={p.id} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{p.drapeau}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>{p.nom}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{p.constructeur} · {p.masseVide}g</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>{p.description}</div>
            </div>
            <button
              onClick={() => handleImport(p)}
              disabled={importing === p.id}
              style={{
                background: importing === p.id ? 'rgba(255,255,255,0.1)' : 'rgba(80,160,255,0.25)',
                border: '1px solid rgba(80,160,255,0.5)',
                borderRadius: 10, padding: '8px 14px',
                color: '#7ac0ff', fontSize: 12, fontWeight: 600,
                cursor: importing === p.id ? 'wait' : 'pointer',
                flexShrink: 0, touchAction: 'manipulation',
              }}
            >
              {importing === p.id ? '...' : 'Ajouter'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
  return createPortal(content, document.body)
}
