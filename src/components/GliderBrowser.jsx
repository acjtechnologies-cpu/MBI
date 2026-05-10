import { useState, useEffect } from 'react'

const GITHUB_RAW = 'https://raw.githubusercontent.com/acjtechnologies-cpu/MBI/principal'
const INDEX_URL  = `${GITHUB_RAW}/planeurs/index.json`

export default function GliderBrowser({ onClose, onImport }) {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [importing, setImporting] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(INDEX_URL)
      .then(r => r.json())
      .then(data => { setList(data.planeurs || []); setLoading(false) })
      .catch(() => { setError('Impossible de charger la liste'); setLoading(false) })
  }, [])

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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{color:'#fff',fontSize:16,fontWeight:600}}>Planeurs disponibles</div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2}}>ACJ Technologies · GitHub</div>
        </div>
        <button onClick={onClose} style={{color:'rgba(255,255,255,0.5)',fontSize:24,background:'none',border:'none',cursor:'pointer',padding:'4px 8px'}}>&times;</button>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
        {loading && (
          <div style={{color:'rgba(255,255,255,0.5)',textAlign:'center',marginTop:40,fontSize:13}}>
            Chargement...
          </div>
        )}
        {error && (
          <div style={{color:'#ff6b6b',textAlign:'center',marginTop:40,fontSize:13}}>{error}</div>
        )}
        {!loading && !error && list.map(p => (
          <div key={p.id} style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{fontSize:28,flexShrink:0}}>{p.drapeau}</div>
            <div style={{flex:1}}>
              <div style={{color:'#fff',fontSize:15,fontWeight:500}}>{p.nom}</div>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2}}>{p.constructeur} · {p.masseVide}g</div>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:10,marginTop:2}}>{p.description}</div>
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
                flexShrink: 0,
              }}
            >
              {importing === p.id ? '...' : 'Ajouter'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
