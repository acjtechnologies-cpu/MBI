import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Save, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useSouteStore } from '../../stores/souteStore'
import { calculerMasseOptimale, calculerChargeAlaire, calculerMeteo } from '../../utils/poly4'
import { useModelStore } from '../../stores/modelStore'
import { calculerCGCible } from '../../utils/ballast'
import { resoudreSouteV2, calculerStatsSouteV2 } from '../../utils/NewSolver'

export default function DashboardPilote() {
  const { 
    params, 
    incrementParam,
    decrementParam,
    mv,          // Masse Ã  vide DEPUIS CONFIG
    surface,     // Surface en dmÂ² DEPUIS CONFIG
    offset, 
    incrementOffset, 
    decrementOffset, 
    selectedParam, 
    selectParam 
  } = useAppStore()
  
  const { setState } = useSouteStore()
  const { getActiveModel } = useModelStore()
  const activeModel = getActiveModel()
  
  const vent = params.vent
  
  // Calcul MÃ‰TÃ‰O (rho, rr)
  const meteo = calculerMeteo(
    params.pression,
    params.temperature,
    params.rosee,
    params.altitude
  )
  
  // Calcul POLY4 (masse de base)
  const masseBase = calculerMasseOptimale(vent) // kg
  
  // Masse CIBLE = Poly4 + Offset (pour l'instant, lissage mÃ©tÃ©o Ã  venir)
  const masseCible = masseBase + (offset / 1000)
  const masseCibleGrammes = masseCible * 1000
  const masseVideGrammes = activeModel ? activeModel.masseVide : mv * 1000
  
  // RÃ©solution automatique soute
  const config = activeModel?.soutes ? { nom: activeModel.nom, id: activeModel.id, cgVide: activeModel.cgVide, masseVide: masseVideGrammes, matrix: activeModel.matrix || [], soutes: { av: activeModel.soutes['avant-cle'] ? { capacite: activeModel.soutes['avant-cle'].capacite, distanceBA: activeModel.soutes['avant-cle'].distanceBA, materiaux: activeModel.soutes['avant-cle'].materiaux } : null, c: activeModel.soutes['centrale-cle'] ? { capacite: activeModel.soutes['centrale-cle'].capacite, distanceBA: activeModel.soutes['centrale-cle'].distanceBA, materiaux: activeModel.soutes['centrale-cle'].materiaux } : null, ar: activeModel.soutes['arriere-aile'] ? { capacite: activeModel.soutes['arriere-aile'].capacite, distanceBA: activeModel.soutes['arriere-aile'].distanceBA, materiaux: activeModel.soutes['arriere-aile'].materiaux } : null } } : null
  const solution = config ? resoudreSouteV2(masseCibleGrammes, masseVideGrammes, config, calculerCGCible(masseCible, surface)) : { gauche: { av: [], c: [], ar: [] }, droite: { av: [], c: [], ar: [] } }
  const stats = config ? calculerStatsSouteV2(solution, config) : { masseTotale: masseVideGrammes, cg: 0, cgDelta: 0 }
  
  // Masse ACTUELLE
  const masseActuelle = (stats.masseTotale > 0) ? parseFloat((stats.masseTotale / 1000).toFixed(3)) : mv
  
  // Charge alaire
  const chargeAlaire = calculerChargeAlaire(masseActuelle, surface) || 0
  const deltaGrammes = (masseActuelle - masseCible) * 1000
  
  // CG - INVERSÃ‰ POUR AFFICHAGE
  const cgSoute = typeof stats.cgDelta === 'number' ? stats.cgDelta : 0  // â† MODIFIÃ‰ : on inverse le signe
  const cgCible = calculerCGCible(masseCible, surface)
  const deltaCG = (isNaN(cgSoute) || isNaN(cgCible)) ? 0 : cgSoute - cgCible
  
  const nomPlaneur = activeModel?.nom || 'F3F Pro'

  if (!activeModel) return <div className="h-screen bg-gray-950 text-white flex items-center justify-center">Chargement...</div>

  if (!activeModel) return <div className="h-screen bg-gray-950 text-white flex items-center justify-center">Chargement...</div>
  
  // Mettre Ã  jour le store soute quand vent/offset changent
  useEffect(() => {
    setState(solution)
  }, [vent, offset])
  
  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Header avec mÃ©tÃ©o */}
      <div className="bg-gray-900 px-2 py-1 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ChevronDown size={14} className="text-blue-400" />
            <div className="text-xs font-bold text-blue-400">{nomPlaneur}</div>
          </div>
          <div className="text-[8px] text-gray-400">
            rho: {isNaN(meteo.rr) ? 'N/A' : meteo.rr.toFixed(3)} ({meteo.qual || 'N/A'})
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-900 px-2 py-1.5 border-b border-gray-800">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="text-center">
            <div className="text-[8px] text-gray-500 leading-tight">CIBLE</div>
            <div className="text-lg font-black text-gray-400 leading-tight">
              {masseCible.toFixed(3)}
            </div>
            <div className="text-[7px] text-gray-500 leading-tight">
              Poly4 {masseBase.toFixed(3)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-[8px] text-gray-500 leading-tight">ACTUEL</div>
            <div className="text-2xl font-black text-green-400 leading-tight">
              {masseActuelle.toFixed(3)}
            </div>
            <div className="text-[8px] text-gray-400 leading-tight">
              {chargeAlaire.toFixed(1)} g/dmÂ²{' '}
              <span className={deltaGrammes >= 0 ? 'text-green-400' : 'text-red-400'}>
                ({deltaGrammes >= 0 ? '+' : ''}{Math.round(deltaGrammes)}g)
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-[8px] text-gray-500 leading-tight">CG (MM)</div>
            <div className="text-lg font-black text-green-400 leading-tight">
              {isNaN(cgSoute) ? '0.0' : cgSoute.toFixed(1)}
            </div>
            <div className="text-[8px] text-gray-400 leading-tight">
              {isNaN(deltaCG) ? '0.0' : deltaCG.toFixed(1)}mm
            </div>
            <div className="text-[7px] text-gray-600 leading-tight">
              Cible {(cgCible || 0).toFixed(1)}mm
            </div>
          </div>
        </div>
      </div>

      {/* Barographe */}
      <div className="flex-1 flex flex-col justify-evenly py-0.5 min-h-0 gap-0.5">
        {['av', 'c', 'ar'].map((pack) => {
          const gaucheData = solution.gauche[pack] || []
          const droiteData = solution.droite[pack] || []
          
          return (
            <div key={pack} className="flex justify-center gap-0.5 items-center">
              <div className="flex gap-0.5 w-[48%] h-20 flex-row-reverse">
                {renderSlots(gaucheData, config?.soutes?.[pack]?.capacite || 6)}
              </div>
              <div className="flex gap-0.5 w-[48%] h-20">
                {renderSlots(droiteData, config?.soutes?.[pack]?.capacite || 6)}
              </div>
            </div>
          )
        })}
      </div>

      {/* ContrÃ´les */}
      <div className="bg-gray-900 p-1.5 border-t border-gray-800">
        <div className="grid grid-cols-[1fr_1.2fr] gap-2 h-20 mb-1.5">
          <div className="grid grid-rows-2 gap-1">
            <button
              onClick={() => selectParam('vent')}
              className={`
                rounded border flex flex-col items-center justify-center
                ${selectedParam === 'vent' 
                  ? 'bg-blue-900 border-blue-500' 
                  : 'bg-gray-800 border-gray-700'
                }
              `}
            >
              <div className="text-lg font-black">{vent.toFixed(1)}</div>
              <div className="text-[7px] text-gray-400 uppercase">Vent</div>
            </button>
            
            <button
              onClick={() => selectParam('offset')}
              className={`
                rounded border flex flex-col items-center justify-center
                ${selectedParam === 'offset' 
                  ? 'bg-blue-900 border-blue-500' 
                  : 'bg-gray-800 border-gray-700'
                }
              `}
            >
              <div className="text-lg font-black">{offset}</div>
              <div className="text-[7px] text-gray-400 uppercase">Offset</div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleDecrement}
              className="bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center active:bg-blue-600"
            >
              <ChevronLeft size={40} strokeWidth={3} />
            </button>
            
            <button
              onClick={handleIncrement}
              className="bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center active:bg-blue-600"
            >
              <ChevronRight size={40} strokeWidth={3} />
            </button>
          </div>
        </div>

        <Chrono />
      </div>
    </div>
  )
  
  function handleIncrement() {
    if (selectedParam === 'vent') {
      incrementParam('vent')
    } else if (selectedParam === 'offset') {
      incrementOffset()
    }
  }
  
  function handleDecrement() {
    if (selectedParam === 'vent') {
      decrementParam('vent')
    } else if (selectedParam === 'offset') {
      decrementOffset()
    }
  }
}

function renderSlots(materials, capacite) {
  const capacity = capacite
  const slots = []
  
  for (let i = 0; i < capacity; i++) {
    const material = materials[i]
    
    const nom = material ? material.toLowerCase() : ''
    let bgClass = 'bg-green-900 opacity-20'
    if (nom.includes('tungst'))      bgClass = 'bg-[#cd7f32]'
    else if (nom.includes('plomb'))  bgClass = 'bg-[#c0c0c0]'
    else if (nom.includes('laiton')) bgClass = 'bg-[#ffd700]'
    else if (nom.includes('lourd'))  bgClass = 'bg-[#cd7f32]'
    else if (material)               bgClass = 'bg-[#8b949e]'
    
    slots.push(
      <div
        key={i}
        className={`
          flex-1 rounded border border-white/10
          ${bgClass}
          ${material && 'shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'}
        `}
      />
    )
  }
  
  return slots
}

function Chrono() {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let interval
    if (running) {
      const start = Date.now() - time
      interval = setInterval(() => setTime(Date.now() - start), 10)
    }
    return () => clearInterval(interval)
  }, [running])

  const format = (ms) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    const c = Math.floor((ms % 1000) / 10)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${c.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-blue-900 rounded p-1.5 flex items-center justify-between">
      <div className="text-xl font-black font-mono">{format(time)}</div>
      <div className="flex gap-1">
        <button
          onClick={() => setRunning(!running)}
          className="bg-green-600 px-2.5 py-1.5 rounded text-[10px] font-bold"
        >
          {running ? 'Stop' : 'Start'}
        </button>
        <button
          onClick={() => console.log('Cap')}
          className="bg-gray-700 px-2.5 py-1.5 rounded text-[10px] font-bold"
        >
          Cap
        </button>
        <button
          onClick={() => { setRunning(false); setTime(0) }}
          className="bg-red-600 px-2.5 py-1.5 rounded text-[10px] font-bold"
        >
          Rst
        </button>
        <button
          onClick={() => console.log('Save')}
          className="bg-blue-600 px-2.5 py-1.5 rounded flex items-center"
        >
          <Save size={12} />
        </button>
      </div>
    </div>
  )
}
















