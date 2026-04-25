import { useState } from 'react'
import { useModelStore } from '../stores/modelStore'
import pikeImg from '../assets/pike_precision2.png'
import mambaImg from '../assets/mamba_s.png'

const GITHUB_RAW = 'https://raw.githubusercontent.com/acjtechnologies-cpu/MBI/principal'
const INDEX_URL  = `${GITHUB_RAW}/planeurs/index.json`

const IMG_MAP = {
  'pike-precision-2': pikeImg,
  'mamba-s': mambaImg,
}

const GLIDERS_LOCAL = [
  {
    id: 'pike-precision-2',
    name: 'Pike Precision 2',
    spec: '2350g · CG 96mm · 3 soutes',
    badge: 'Poly4 · IRP · Matrix',
    card: { bg: 'rgba(20,10,0,0.75)', border: 'rgba(220,110,10,0.9)' },
    badgeStyle: { background: 'rgba(220,110,10,0.35)', color: '#ffaa50' },
  },
  {
    id: 'mamba-s',
    name: 'Mamba S',
    spec: '2550g · CG 102mm · 2 soutes',
    badge: 'Poly4 · IRP · Matrix',
    card: { bg: 'rgba(10,18,50,0.75)', border: 'rgba(80,120,220,0.9)' },
    badgeStyle: { background: 'rgba(80,120,220,0.35)', color: '#aac0ff' },
  },
]

// Modal browser GitHub
function GliderBrowser({ onClose, onImport }) {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [importing, setImporting] = useState(null)
  const [error, setError] = useState(null)

  useState(() => {
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
      {/* Header */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{color:'#fff',fontSize:16,fontWeight:600}}>Planeurs disponibles</div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2}}>ACJ Technologies · GitHub</div>
        </div>
        <button onClick={onClose} style={{color:'rgba(255,255,255,0.5)',fontSize:24,background:'none',border:'none',cursor:'pointer',padding:'4px 8px'}}>×</button>
      </div>

      {/* Contenu */}
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

export default function WelcomePage({ onSelect }) {
  const { setActiveModel, loadFromGitHub, models } = useModelStore()
  const [showBrowser, setShowBrowser] = useState(false)

  const handleSelect = (gliderId) => {
    setActiveModel(gliderId)
    if (onSelect) onSelect()
  }

  const handleImport = (modelData) => {
    // Importer dans le store
    const { importModel } = useModelStore.getState()
    importModel(modelData)
    setShowBrowser(false)
    // Auto-sélectionner le planeur importé
    setActiveModel(modelData.id)
    if (onSelect) onSelect()
  }

  return (
    <>
      {showBrowser && (
        <GliderBrowser
          onClose={() => setShowBrowser(false)}
          onImport={handleImport}
        />
      )}

      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(170deg, #4a9fd4 0%, #87CEEB 25%, #9dd4e8 50%, #6aaa60 78%, #4a8a40 100%)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'sans-serif', userSelect: 'none',
      }}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'58%',background:'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 100%)',pointerEvents:'none'}} />
        <div style={{position:'absolute',top:55,left:18,width:90,height:30,background:'rgba(255,255,255,0.78)',borderRadius:20}} />
        <div style={{position:'absolute',top:41,left:36,width:50,height:34,background:'rgba(255,255,255,0.78)',borderRadius:'50%'}} />
        <div style={{position:'absolute',top:85,right:24,width:66,height:22,background:'rgba(255,255,255,0.62)',borderRadius:20}} />
        <div style={{position:'absolute',top:73,right:38,width:36,height:26,background:'rgba(255,255,255,0.62)',borderRadius:'50%'}} />

        {/* Hero */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'monospace',fontSize:54,fontWeight:500,color:'#fff',letterSpacing:10,lineHeight:1,textShadow:'0 2px 24px rgba(0,0,0,0.25)'}}>F3F</div>
          <div style={{fontFamily:'monospace',fontSize:32,fontWeight:500,color:'#fff',letterSpacing:6,marginTop:-6,textShadow:'0 2px 24px rgba(0,0,0,0.25)'}}>PIT</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.82)',letterSpacing:3,marginTop:5}}>BALLAST · MÉTÉO · CHRONO · IQA</div>
          <div style={{marginTop:14,background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.32)',borderRadius:20,padding:'5px 14px',display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#6eff88'}} />
            <span style={{color:'rgba(255,255,255,0.88)',fontSize:11,letterSpacing:1}}>F3F-STATION · ESP32 v12</span>
          </div>
        </div>

        {/* Cards */}
        <div style={{position:'relative',zIndex:1,padding:'0 14px 28px'}}>
          <div style={{color:'rgba(255,255,255,0.55)',fontSize:10,letterSpacing:2.5,marginBottom:10,paddingLeft:2}}>MON PLANEUR</div>

          {GLIDERS_LOCAL.map((g) => (
            <div
              key={g.id}
              onClick={() => handleSelect(g.id)}
              style={{
                borderRadius:18, marginBottom:10,
                background: g.card.bg,
                border: `2px solid ${g.card.border}`,
                position:'relative', overflow:'hidden',
                cursor:'pointer', minHeight:96, touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
              }}
            >
              <img
                src={IMG_MAP[g.id]}
                alt=""
                style={{
                  position:'absolute', right:-20, top:'50%',
                  transform:'translateY(-50%) rotate(-5deg)',
                  width:'65%', mixBlendMode:'multiply', opacity:1,
                  pointerEvents:'none',
                }}
              />
              <div style={{
                position:'absolute', inset:0,
                background:'linear-gradient(to right, rgba(0,0,0,0.72) 35%, transparent 70%)',
                pointerEvents:'none',
              }} />
              <div style={{position:'relative',zIndex:2,padding:'16px'}}>
                <div style={{fontSize:16,fontWeight:600,color:'#fff'}}>{g.name}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:3}}>{g.spec}</div>
                <div style={{fontSize:10,padding:'3px 8px',borderRadius:10,marginTop:6,display:'inline-block',...g.badgeStyle}}>{g.badge}</div>
              </div>
              <div style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',zIndex:2,color:'rgba(255,255,255,0.5)',fontSize:22}}>›</div>
            </div>
          ))}

          {/* Bouton Ajouter */}
          <div
            onClick={() => setShowBrowser(true)}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 0 0',cursor:'pointer'}}
          >
            <div style={{
              width:24,height:24,borderRadius:'50%',
              border:'1.5px dashed rgba(255,255,255,0.4)',
              display:'flex',alignItems:'center',justifyContent:'center',
              color:'rgba(255,255,255,0.5)',fontSize:16,lineHeight:1,
            }}>+</div>
            <span style={{color:'rgba(255,255,255,0.5)',fontSize:12,letterSpacing:1}}>Ajouter un modèle</span>
          </div>
         <div style={{color:'rgba(255,255,255,0.2)',fontSize:10,textAlign:'center',marginTop:12,letterSpacing:1}}>
            © 2026 ACJ Technologies · Tous droits réservés
          </div>
          <div style={{color:'rgba(255,255,255,0.1)',fontSize:9,textAlign:'center',marginTop:3,letterSpacing:0.5}}>
            F3F Pit — Œuvre protégée · Soleau INPI 25/04/2026
          </div>
        </div>
      </div>
    </>
  )
}
