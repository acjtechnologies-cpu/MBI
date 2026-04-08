import { useModelStore } from '../stores/modelStore'
import pikeImg from '../assets/pike_precision2.png'
import mambaImg from '../assets/mamba_s.png'

const GLIDERS = [
  {
    id: 'pike-precision-2',
    name: 'Pike Precision 2',
    spec: '2350g · CG 96mm · 3 soutes',
    badge: 'Poly4 · IRP · Matrix',
    img: null,
    card: { bg: 'rgba(20,10,0,0.92)', border: 'rgba(220,110,10,0.75)' },
    badgeStyle: { background: 'rgba(220,110,10,0.3)', color: '#ffaa50' },
    imgStyle: { right: -15, rotation: '-6deg', width: 175 },
  },
  {
    id: 'mamba-s',
    name: 'Mamba S',
    spec: '2550g · CG 102mm · 2 soutes',
    badge: 'Poly4 · IRP · Matrix',
    img: null,
    card: { bg: 'rgba(10,18,50,0.92)', border: 'rgba(80,120,220,0.6)' },
    badgeStyle: { background: 'rgba(80,120,220,0.28)', color: '#aac0ff' },
    imgStyle: { right: -10, rotation: '-5deg', width: 180 },
  },
]
GLIDERS[0].img = pikeImg
GLIDERS[1].img = mambaImg

export default function WelcomePage({ onSelect }) {
  const { setActiveModel } = useModelStore()

  const handleSelect = (gliderId) => {
    setActiveModel(gliderId)
    if (onSelect) onSelect()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(170deg, #4a9fd4 0%, #87CEEB 25%, #9dd4e8 50%, #6aaa60 78%, #4a8a40 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'sans-serif', userSelect: 'none',
    }}>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'55%',background:'linear-gradient(to top,rgba(0,0,0,0.68) 0%,transparent 100%)',pointerEvents:'none'}} />
      <div style={{position:'absolute',top:55,left:18,width:90,height:30,background:'rgba(255,255,255,0.78)',borderRadius:20}} />
      <div style={{position:'absolute',top:41,left:36,width:50,height:34,background:'rgba(255,255,255,0.78)',borderRadius:'50%'}} />
      <div style={{position:'absolute',top:85,right:24,width:66,height:22,background:'rgba(255,255,255,0.62)',borderRadius:20}} />
      <div style={{position:'absolute',top:73,right:38,width:36,height:26,background:'rgba(255,255,255,0.62)',borderRadius:'50%'}} />

      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}>
        <div style={{fontFamily:'monospace',fontSize:54,fontWeight:500,color:'#fff',letterSpacing:10,lineHeight:1,textShadow:'0 2px 24px rgba(0,0,0,0.25)'}}>F3F</div>
        <div style={{fontFamily:'monospace',fontSize:32,fontWeight:500,color:'#fff',letterSpacing:6,marginTop:-6,textShadow:'0 2px 24px rgba(0,0,0,0.25)'}}>PIT</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.82)',letterSpacing:3,marginTop:5}}>BALLAST · MÉTÉO · CHRONO · IQA</div>
        <div style={{marginTop:14,background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.32)',borderRadius:20,padding:'5px 14px',display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#6eff88'}} />
          <span style={{color:'rgba(255,255,255,0.88)',fontSize:11,letterSpacing:1}}>F3F-STATION · ESP32 v12</span>
        </div>
      </div>

      <div style={{position:'relative',zIndex:1,padding:'0 14px 28px'}}>
        <div style={{color:'rgba(255,255,255,0.55)',fontSize:10,letterSpacing:2.5,marginBottom:10,paddingLeft:2}}>MON PLANEUR</div>
        {GLIDERS.map((g) => (
          <div key={g.id} onClick={() => handleSelect(g.id)} style={{borderRadius:18,padding:16,marginBottom:10,display:'flex',alignItems:'center',gap:12,background:g.card.bg,border:`1.5px solid ${g.card.border}`,position:'relative',overflow:'hidden',minHeight:82,cursor:'pointer'}}>
            <img src={g.img} alt="" style={{position:'absolute',right:g.imgStyle.right,top:'50%',transform:`translateY(-50%) rotate(${g.imgStyle.rotation})`,width:g.imgStyle.width,mixBlendMode:'multiply',opacity:0.85,pointerEvents:'none'}} />
            <div style={{position:'relative',zIndex:2,flex:1}}>
              <div style={{fontSize:15,fontWeight:500,color:'#fff'}}>{g.name}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>{g.spec}</div>
              <div style={{fontSize:10,padding:'3px 8px',borderRadius:10,marginTop:5,display:'inline-block',...g.badgeStyle}}>{g.badge}</div>
            </div>
            <div style={{position:'relative',zIndex:2,color:'rgba(255,255,255,0.3)',fontSize:20,flexShrink:0}}>›</div>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'8px 0 0',cursor:'pointer'}}>
          <div style={{width:22,height:22,borderRadius:'50%',border:'1.5px dashed rgba(255,255,255,0.28)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.38)',fontSize:15,lineHeight:1}}>+</div>
          <span style={{color:'rgba(255,255,255,0.38)',fontSize:12,letterSpacing:1}}>Ajouter un modèle</span>
        </div>
        <div style={{color:'rgba(255,255,255,0.2)',fontSize:10,textAlign:'center',marginTop:12}}>ACJ Technologies · ESP32 v12</div>
      </div>
    </div>
  )
}
