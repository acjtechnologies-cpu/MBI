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
  { id:'pike-precision-2', name:'Pike Precision 2', spec:'2350g · CG 96mm · 3 soutes',
    badge:'Poly4 · IRP · Matrix', borderColor:'rgba(220,110,10,0.9)', bg:'rgba(20,10,0,0.75)',
    badgeBg:'rgba(220,110,10,0.35)', badgeColor:'#ffaa50' },
  { id:'mamba-s', name:'Mamba S', spec:'2550g · CG 102mm · 2 soutes',
    badge:'Poly4 · IRP · Matrix', borderColor:'rgba(80,120,220,0.9)', bg:'rgba(10,18,50,0.75)',
    badgeBg:'rgba(80,120,220,0.35)', badgeColor:'#aac0ff' },
]

function GliderBrowser({ onClose, onImport }) {
  const [loading, setLoading] = useState(true)
  const [list, setList]       = useState([])
  const [importing, setImporting] = useState(null)
  const [error, setError]     = useState(null)

  useState(() => {
    fetch(INDEX_URL)
      .then(r => r.json())
      .then(data => { setList(data.planeurs || []); setLoading(false) })
      .catch(() => { setError('Impossible de charger la liste'); setLoading(false) })
  }, [])

  const handleImport = async (planeur) => {
    setImporting(planeur.id)
    try {
      const res  = await fetch(`${GITHUB_RAW}/${planeur.url}`)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      onImport(await res.json())
    } catch(e) { setError('Erreur: ' + e.message) }
    setImporting(null)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.85)',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{color:'#fff',fontSize:16,fontWeight:600}}>Planeurs disponibles</div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2}}>ACJ Technologies · GitHub</div>
        </div>
        <button onClick={onClose} style={{color:'rgba(255,255,255,0.5)',fontSize:24,background:'none',border:'none',cursor:'pointer',padding:'4px 8px',lineHeight:1}}>×</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
        {loading && <div style={{color:'rgba(255,255,255,0.5)',textAlign:'center',marginTop:40}}>Chargement...</div>}
        {error   && <div style={{color:'#ff6b6b',textAlign:'center',marginTop:40}}>{error}</div>}
        {!loading && !error && list.map(p => (
          <div key={p.id} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:14,padding:'14px 16px',marginBottom:10,display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:28,flexShrink:0}}>{p.drapeau}</div>
            <div style={{flex:1}}>
              <div style={{color:'#fff',fontSize:15,fontWeight:500}}>{p.nom}</div>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2}}>{p.constructeur} · {p.masseVide}g</div>
            </div>
            <button onClick={() => handleImport(p)} disabled={importing===p.id}
              style={{background:'rgba(80,160,255,0.25)',border:'1px solid rgba(80,160,255,0.5)',borderRadius:10,padding:'8px 14px',color:'#7ac0ff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              {importing===p.id ? '...' : 'Ajouter'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WelcomePage({ onSelect }) {
  const { setActiveModel, importModel } = useModelStore()
  const [showBrowser, setShowBrowser]   = useState(false)

  const handleSelect = (gliderId) => {
    setActiveModel(gliderId)
    onSelect()
  }

  const handleImport = (modelData) => {
    importModel(modelData)
    setShowBrowser(false)
    setActiveModel(modelData.id)
    onSelect()
  }

  return (
    <>
      {showBrowser && <GliderBrowser onClose={() => setShowBrowser(false)} onImport={handleImport} />}
      <div style={{position:'fixed',inset:0,background:'linear-gradient(170deg,#4a9fd4 0%,#87CEEB 25%,#9dd4e8 50%,#6aaa60 78%,#4a8a40 100%)',display:'flex',flexDirection:'column',fontFamily:'sans-serif',userSelect:'none'}}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'58%',background:'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 100%)',pointerEvents:'none'}} />

        {/* Hero */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'monospace',fontSize:54,fontWeight:500,color:'#fff',letterSpacing:10,lineHeight:1,textShadow:'0 2px 24px rgba(0,0,0,0.25)'}}>F3F</div>
          <div style={{fontFamily:'monospace',fontSize:32,fontWeight:500,color:'#fff',letterSpacing:6,marginTop:-4,textShadow:'0 2px 24px rgba(0,0,0,0.25)'}}>PIT</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.82)',letterSpacing:3,marginTop:5}}>BALLAST · MÉTÉO · CHRONO · IQA</div>
          <div style={{marginTop:14,background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.32)',borderRadius:20,padding:'5px 14px',display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#6eff88'}} />
            <span style={{color:'rgba(255,255,255,0.88)',fontSize:11,letterSpacing:1}}>F3F-STATION · ESP32 v12</span>
          </div>
        </div>

        {/* Cards planeurs */}
        <div style={{position:'relative',zIndex:1,padding:'0 14px 28px'}}>
          <div style={{color:'rgba(255,255,255,0.55)',fontSize:10,letterSpacing:2.5,marginBottom:10,paddingLeft:2}}>MON PLANEUR</div>
          {GLIDERS_LOCAL.map(g => (
            <button key={g.id} onClick={() => handleSelect(g.id)} style={{
              display:'block', width:'100%', borderRadius:18, marginBottom:10,
              background:g.bg, border:`2px solid ${g.borderColor}`,
              position:'relative', overflow:'hidden', cursor:'pointer',
              minHeight:96, textAlign:'left', padding:0,
              WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
            }}>
              <img src={IMG_MAP[g.id]} alt="" style={{position:'absolute',right:-20,top:'50%',transform:'translateY(-50%) rotate(-5deg)',width:'65%',opacity:0.9,pointerEvents:'none'}} />
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(0,0,0,0.72) 35%,transparent 70%)',pointerEvents:'none'}} />
              <div style={{position:'relative',zIndex:2,padding:'16px'}}>
                <div style={{fontSize:16,fontWeight:600,color:'#fff'}}>{g.name}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:3}}>{g.spec}</div>
                <div style={{fontSize:10,padding:'3px 8px',borderRadius:10,marginTop:6,display:'inline-block',background:g.badgeBg,color:g.badgeColor}}>{g.badge}</div>
              </div>
              <div style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',zIndex:2,color:'rgba(255,255,255,0.5)',fontSize:22}}>›</div>
            </button>
          ))}

          <button onClick={() => setShowBrowser(true)} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'10px 0', cursor:'pointer', background:'none', border:'none', width:'100%',
            WebkitTapHighlightColor:'transparent', touchAction:'manipulation',
          }}>
            <div style={{width:24,height:24,borderRadius:'50%',border:'1.5px dashed rgba(255,255,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.5)',fontSize:16}}>+</div>
            <span style={{color:'rgba(255,255,255,0.5)',fontSize:12,letterSpacing:1}}>Ajouter un modèle</span>
          </button>
          <div style={{color:'rgba(255,255,255,0.2)',fontSize:10,textAlign:'center',marginTop:12}}>ACJ Technologies · ESP32 v12</div>
        </div>
      </div>
    </>
  )
}
