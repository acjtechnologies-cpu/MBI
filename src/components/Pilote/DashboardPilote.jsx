import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSouteStore } from '../../stores/souteStore'
import { calculerMasseOptimale, calculerChargeAlaire, calculerMeteo } from '../../utils/poly4'
import { useModelStore } from '../../stores/modelStore'
import { calculerCGCible } from '../../utils/ballast'
import { resoudreSouteV2, calculerStatsSouteV2 } from '../../utils/NewSolver'

export default function DashboardPilote() {
  const {
    params, incrementParam, decrementParam,
    mv, surface, offset, incrementOffset, decrementOffset,
    selectedParam, selectParam, k_up, alpha, altitude } = useAppStore()

  const { setState } = useSouteStore()
  const { getActiveModel } = useModelStore()
  const activeModel = getActiveModel()
  const vent = params.vent

  // Météo
  const meteo = calculerMeteo(params.pression, params.temperature, params.rosee, params.altitude)

  // Masse cible
  const masseBase = calculerMasseOptimale(vent)
  const rr = isNaN(meteo.rr) ? 1.0 : meteo.rr
  const masseCible = masseBase * rr * (k_up || 1.0) * (alpha || 1.0) + (offset / 1000)
  const masseCibleGrammes = masseCible * 1000
  const masseVideGrammes = activeModel ? activeModel.masseVide : mv * 1000

  // Config solver — dynamique selon soutes du modèle
  const config = activeModel?.soutes ? {
    id:        activeModel.id,
    nom:       activeModel.nom,
    cgVide:    activeModel.cgVide,
    masseVide: masseVideGrammes,
    matrix:    activeModel.matrix || null,
    soutes: {
      av: activeModel.soutes['avant-cle'] ? {
        distanceBA: activeModel.soutes['avant-cle'].distanceBA,
        capacite:   activeModel.soutes['avant-cle'].capacite,
        materiaux:  activeModel.soutes['avant-cle'].materiaux
      } : null,
      c: activeModel.soutes['centrale-cle'] ? {
        distanceBA: activeModel.soutes['centrale-cle'].distanceBA,
        capacite:   activeModel.soutes['centrale-cle'].capacite,
        materiaux:  activeModel.soutes['centrale-cle'].materiaux
      } : null,
      ar: activeModel.soutes['arriere-aile'] ? {
        distanceBA: activeModel.soutes['arriere-aile'].distanceBA,
        capacite:   activeModel.soutes['arriere-aile'].capacite,
        materiaux:  activeModel.soutes['arriere-aile'].materiaux
      } : null
    }
  } : null

  // Résolution
  const solution = config
    ? resoudreSouteV2(masseCibleGrammes, masseVideGrammes, config, calculerCGCible(masseCible, activeModel?.surface || surface))
    : { gauche: {av:[], c:[], ar:[]}, droite: {av:[], c:[], ar:[]} }

  const stats = config
    ? calculerStatsSouteV2(solution, config)
    : { masseTotale: masseVideGrammes, cg: activeModel?.cgVide || 0, cgDelta: 0, precision: 0 }

  const masseActuelle = stats.masseTotale > 0 ? parseFloat((stats.masseTotale / 1000).toFixed(3)) : mv
  const chargeAlaire  = calculerChargeAlaire(masseActuelle, activeModel?.surface || surface)
  const deltaGrammes  = (masseActuelle - masseCible) * 1000
  const cgSoute = isNaN(stats.cgDelta) ? 0 : (stats.cgDelta || 0)
  const cgCible = calculerCGCible(masseCible, activeModel?.surface || surface)
  const deltaCG = isNaN(cgSoute - cgCible) ? 0 : cgSoute - cgCible
  const nomPlaneur = activeModel?.nom || 'F3F'

  // Soutes triées AV → AR pour barographe
  const soutesSorted = activeModel?.soutes
    ? Object.values(activeModel.soutes).sort((a, b) => a.distanceBA - b.distanceBA)
    : []

  const souteKeys = ['av', 'c', 'ar']

  useEffect(() => {
    setState(solution)
  }, [vent, offset])

  if (!activeModel) {
    return (
      <div className="h-screen flex items-center justify-center" style={{background:'#05070a',color:'#8b949e'}}>
        Chargement...
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{background:'#05070a'}} translate="no">

      {/* ── HEADER ── */}
      <div style={{background:'#0d1117', borderBottom:'1px solid #21262d', padding:'4px 8px', flexShrink:0}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center', gap:4}}>
            <ChevronDown size={13} color="#58a6ff" />
            <span style={{fontSize:12, fontWeight:800, color:'#58a6ff'}}>{nomPlaneur}</span>
          </div>
          <span style={{fontSize:9, color:'#8b949e'}}>
            rho: {isNaN(meteo.rr) ? 'N/A' : meteo.rr.toFixed(3)} ({meteo.qual || 'N/A'})
          </span>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{background:'#0d1117', borderBottom:'1px solid #21262d', padding:'6px 8px', flexShrink:0}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, textAlign:'center'}}>

          <div>
            <div style={{fontSize:9, color:'#8b949e', fontWeight:700}}>CIBLE</div>
            <div style={{fontSize:22, fontWeight:900, color:'#8b949e', lineHeight:1}}>{masseCible.toFixed(3)}</div>
            <div style={{fontSize:8, color:'#8b949e'}}>Poly4 {masseBase.toFixed(3)}</div>
          </div>

          <div>
            <div style={{fontSize:9, color:'#8b949e', fontWeight:700}}>ACTUEL</div>
            <div style={{fontSize:22, fontWeight:900, color:'#3fb950', lineHeight:1}}>{masseActuelle.toFixed(3)}</div>
            <div style={{fontSize:8, color:'#8b949e'}}>
              {chargeAlaire.toFixed(1)} g/dm²{' '}
              <span style={{color: deltaGrammes >= 0 ? '#3fb950' : '#f85149'}}>
                ({deltaGrammes >= 0 ? '+' : ''}{Math.round(deltaGrammes)}g)
              </span>
            </div>
          </div>

          <div>
            <div style={{fontSize:9, color:'#8b949e', fontWeight:700}}>CG (MM)</div>
            <div style={{fontSize:22, fontWeight:900, color:'#3fb950', lineHeight:1}}>
              {cgSoute.toFixed(1)}
            </div>
            <div style={{fontSize:8, color:'#8b949e'}}>{deltaCG.toFixed(1)}mm</div>
            <div style={{fontSize:7, color:'#555'}}>Cible {(cgCible||0).toFixed(1)}mm</div>
          </div>

        </div>
      </div>

      {/* ── BAROGRAPHE ── */}
      <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'space-evenly', padding:'4px 0', minHeight:0}}>
        {soutesSorted.map((soute, idx) => {
          const key = souteKeys[idx] || 'ar'
          const gaucheData = solution?.gauche?.[key] || []
          const droiteData = solution?.droite?.[key] || []
          const cap = config?.soutes?.[key]?.capacite || soute.capacite || 3

          // Couleur de bordure selon soute
          const borderColor = idx === 0
            ? 'rgba(255,180,0,.45)'
            : idx === 1
              ? 'rgba(26,115,232,.5)'
              : 'rgba(63,185,80,.45)'
          const labelColor = idx === 0
            ? 'rgba(255,200,80,.9)'
            : idx === 1
              ? 'rgba(100,170,255,.9)'
              : 'rgba(63,185,80,.9)'

          // Label matériau
          const mats = soute.materiaux?.filter(m => m.stock === null || m.stock === undefined || m.stock > 0)
          const matLabel = mats?.map(m => `${m.nom} ${m.masse}g`).join(' · ') || ''

          return (
            <div key={key} style={{display:'flex', flexDirection:'column', gap:2}}>
              <div style={{fontSize:9, color:labelColor, fontWeight:700, paddingLeft:6}}>
                {soute.nom} · {matLabel}
              </div>
              <div style={{display:'flex', justifyContent:'center', gap:5, height:'13vh', maxHeight:90}}>
                {/* Gauche — innermost à droite */}
                <div style={{
                  display:'flex', flexDirection:'row-reverse', gap:2,
                  width:'48%', border:`1.5px solid ${borderColor}`,
                  borderRadius:6, padding:2, background:'rgba(255,255,255,.02)'
                }}>
                  {renderSlots(gaucheData, cap)}
                </div>
                {/* Droite — innermost à gauche */}
                <div style={{
                  display:'flex', gap:2,
                  width:'48%', border:`1.5px solid ${borderColor}`,
                  borderRadius:6, padding:2, background:'rgba(255,255,255,.02)'
                }}>
                  {renderSlots(droiteData, cap)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── CONTRÔLES ── */}
      <div style={{background:'#0d1117', border:'1px solid #30363d', borderRadius:12, margin:'0 6px 6px', padding:8, flexShrink:0}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:8, height:100, marginBottom:6}}>

          <div style={{display:'grid', gridTemplateRows:'1fr 1fr', gap:4}}>
            <button
              onClick={() => selectParam('vent')}
              style={{
                background: selectedParam === 'vent' ? 'linear-gradient(135deg,#1a73e8,#1557b0)' : '#1c2128',
                border: selectedParam === 'vent' ? '2px solid #fff' : '2px solid #30363d',
                borderRadius:10, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', cursor:'pointer'
              }}
            >
              <div style={{fontSize:18, fontWeight:900}}>{vent.toFixed(1)}</div>
              <div style={{fontSize:8, opacity:.85, fontWeight:700, letterSpacing:.5}}>VENT m/s</div>
            </button>

            <button
              onClick={() => selectParam('offset')}
              style={{
                background: selectedParam === 'offset' ? 'linear-gradient(135deg,#1a73e8,#1557b0)' : '#1c2128',
                border: selectedParam === 'offset' ? '2px solid #fff' : '2px solid #30363d',
                borderRadius:10, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', cursor:'pointer'
              }}
            >
              <div style={{fontSize:18, fontWeight:900}}>{offset}</div>
              <div style={{fontSize:8, opacity:.85, fontWeight:700, letterSpacing:.5}}>DÉCALAGE</div>
            </button>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <button
              onClick={handleDecrement}
              style={{
                background:'linear-gradient(135deg,#21262d,#161b22)',
                border:'2px solid #444c56', borderRadius:12,
                color:'#fff', fontSize:50, fontWeight:900,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer'
              }}
            >◀</button>
            <button
              onClick={handleIncrement}
              style={{
                background:'linear-gradient(135deg,#21262d,#161b22)',
                border:'2px solid #444c56', borderRadius:12,
                color:'#fff', fontSize:50, fontWeight:900,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer'
              }}
            >▶</button>
          </div>
        </div>
      </div>
    </div>
  )

  function handleIncrement() {
    if (selectedParam === 'vent') incrementParam('vent')
    else incrementOffset()
  }
  function handleDecrement() {
    if (selectedParam === 'vent') decrementParam('vent')
    else decrementOffset()
  }
}

// ── Rendu slots barographe ──
function renderSlots(materials, capacite) {
  return Array.from({ length: capacite }).map((_, i) => {
    const mat = materials[i]
    const nom = mat ? mat.toLowerCase() : ''
    let bg = 'rgba(255,255,255,.04)'
    let border = '1px dashed rgba(255,255,255,.08)'
    let shadow = 'none'
    let opacity = 0.3

    if (mat) {
      opacity = 1
      border = '1px solid rgba(255,255,255,.25)'
      shadow = 'inset 0 0 10px rgba(0,0,0,.5)'
      if      (nom.includes('tungst'))  { bg = 'linear-gradient(135deg,#2255aa,#3377cc)' }
      else if (nom.includes('plomb'))   { bg = 'linear-gradient(135deg,#708090,#8a9aaa)' }
      else if (nom.includes('laiton'))  { bg = 'linear-gradient(135deg,#c8a030,#e8b840)' }
      else if (nom.includes('lourd'))   { bg = 'linear-gradient(135deg,#cd7f32,#e8963c)' }
      else                              { bg = 'linear-gradient(135deg,#8b949e,#a0aab4)' }
    }

    return (
      <div key={i} style={{
        flex:1, height:'100%', borderRadius:3,
        background: bg, border, boxShadow: shadow, opacity,
        transition:'all .15s'
      }} />
    )
  })
}





