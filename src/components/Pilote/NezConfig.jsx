import { useState } from 'react'
import { useModelStore } from '../../stores/modelStore'
import { useAppStore } from '../../stores/appStore'

/**
 * NezConfig — Configuration Nez Slots par planeur
 * 
 * Module intégré à la page Soute.
 * Chaque planeur a sa propre distance CG → emplacement nez variation.
 * Les plombs sont propres au pilote (appStore).
 * 
 * Affiche :
 *   - Distance nez (éditable, sauvegardée dans le modèle)
 *   - Plombs du pilote (éditables, sauvegardés dans appStore)
 *   - Tableau ΔCG par plomb (calculé)
 */

const CSS_NEZ = `
.nez-cfg{background:#0d1117;border:1px solid #30363d;border-radius:12px;padding:12px;margin:6px 0}
.nez-cfg-title{font-size:11px;font-weight:700;color:#4ade80;letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.nez-cfg-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.nez-cfg-lbl{font-size:11px;color:#8b949e;min-width:90px;line-height:1.3}
.nez-cfg-input{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:6px 10px;color:#fff;font-size:14px;font-weight:700;font-family:monospace;width:80px;text-align:center;outline:none}
.nez-cfg-input:focus{border-color:#4ade80}
.nez-cfg-unit{font-size:11px;color:#4a5568}
.nez-cfg-table{width:100%;border-collapse:collapse;margin-top:8px}
.nez-cfg-table th{font-size:9px;color:#4a5568;font-weight:700;text-transform:uppercase;letter-spacing:.3px;padding:4px 6px;text-align:center;border-bottom:1px solid #21262d}
.nez-cfg-table td{font-size:12px;font-family:monospace;font-weight:600;padding:4px 6px;text-align:center;color:#c9d1d9}
.nez-cfg-table td.mm{color:#4ade80}
.nez-cfg-table td.warn{color:#fbbf24}
.nez-cfg-table td.danger{color:#f85149}
.nez-cfg-plombs{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
.nez-cfg-pill{background:#161b22;border:1px solid #30363d;border-radius:6px;padding:4px 8px;font-size:12px;font-family:monospace;font-weight:600;color:#c9d1d9;display:flex;align-items:center;gap:4px}
.nez-cfg-pill input{background:transparent;border:none;color:#fff;font-size:12px;font-family:monospace;font-weight:600;width:28px;text-align:center;outline:none}
.nez-cfg-pill-add{background:transparent;border:1px dashed #30363d;border-radius:6px;padding:4px 8px;font-size:14px;color:#4a5568;cursor:pointer}
.nez-cfg-pill-add:hover{border-color:#4ade80;color:#4ade80}
.nez-cfg-pill-del{font-size:10px;color:#4a5568;cursor:pointer;padding:0 2px}
.nez-cfg-pill-del:hover{color:#f85149}
.nez-cfg-note{font-size:10px;color:#4a5568;line-height:1.4;margin-top:8px;padding:6px 8px;background:rgba(74,222,128,.04);border-radius:6px;border-left:2px solid rgba(74,222,128,.2)}
`

export default function NezConfig() {
  const model = useModelStore(s => s.models?.[s.activeModelId] ?? null)
  const updateModel = useModelStore(s => s.updateModel)
  const activeModelId = useModelStore(s => s.activeModelId)
  const nezPlombs = useAppStore(s => s.nezPlombs)
  const setNezPlombs = useAppStore(s => s.setNezPlombs)

  const [localDist, setLocalDist] = useState(null)

  if (!model) return null

  const dist = localDist !== null ? localDist : (model.nezDist || 0)
  const masseRef = model.masseVide || 2550

  // Calcul ΔCG pour chaque plomb
  function deltaCG(grams) {
    if (dist <= 0 || grams === 0) return 0
    return -(grams / (masseRef + grams)) * dist
  }

  function colorForMM(mm) {
    const a = Math.abs(mm)
    if (a < 2) return 'mm'
    if (a < 4) return 'warn'
    return 'danger'
  }

  function saveDist(val) {
    const v = parseInt(val) || 0
    setLocalDist(null)
    if (activeModelId) {
      updateModel(activeModelId, { nezDist: v })
    }
  }

  function updatePlomb(idx, val) {
    const v = parseInt(val) || 0
    const next = [...nezPlombs]
    next[idx] = v
    setNezPlombs(next.filter(p => p > 0).sort((a, b) => b - a))
  }

  function addPlomb() {
    setNezPlombs([...nezPlombs, 10].sort((a, b) => b - a))
  }

  function removePlomb(idx) {
    if (nezPlombs.length <= 1) return
    setNezPlombs(nezPlombs.filter((_, i) => i !== idx))
  }

  const sorted = [...nezPlombs].sort((a, b) => b - a)

  return (
    <>
      <style>{CSS_NEZ}</style>
      <div className="nez-cfg">
        <div className="nez-cfg-title">
          <span style={{ fontSize: 14 }}>⚖️</span>
          Nez slots — {model.nom}
        </div>

        {/* Distance CG → Nez */}
        <div className="nez-cfg-row">
          <div className="nez-cfg-lbl">
            Distance CG →<br />emplacement nez
          </div>
          <input
            className="nez-cfg-input"
            type="number"
            min="0"
            max="500"
            value={dist}
            onChange={e => setLocalDist(parseInt(e.target.value) || 0)}
            onBlur={e => saveDist(e.target.value)}
          />
          <span className="nez-cfg-unit">mm</span>
        </div>

        {/* Plombs pilote */}
        <div className="nez-cfg-row" style={{ alignItems: 'flex-start' }}>
          <div className="nez-cfg-lbl">
            Plombs pilote
          </div>
          <div className="nez-cfg-plombs">
            {sorted.map((p, i) => (
              <div key={i} className="nez-cfg-pill">
                <input
                  value={p}
                  onChange={e => updatePlomb(nezPlombs.indexOf(p), e.target.value)}
                  onBlur={e => updatePlomb(nezPlombs.indexOf(p), e.target.value)}
                />
                <span className="nez-cfg-unit">g</span>
                <span className="nez-cfg-pill-del" onClick={() => removePlomb(nezPlombs.indexOf(p))}>✕</span>
              </div>
            ))}
            <button className="nez-cfg-pill-add" onClick={addPlomb}>+</button>
          </div>
        </div>

        {/* Tableau ΔCG */}
        {dist > 0 && sorted.length > 0 && (
          <table className="nez-cfg-table">
            <thead>
              <tr>
                <th>Plomb</th>
                <th>+nez (gros temps)</th>
                <th>−nez (petit temps)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const dPlus = deltaCG(p)
                const dMinus = deltaCG(-p)
                return (
                  <tr key={i}>
                    <td>{p}g</td>
                    <td className={colorForMM(dPlus)}>{dPlus.toFixed(1)}mm</td>
                    <td className={colorForMM(dMinus)}>+{Math.abs(dMinus).toFixed(1)}mm</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Note */}
        <div className="nez-cfg-note">
          <strong style={{ color: '#4ade80' }}>Mesure :</strong> Distance entre le point CG cible ({model.cgVide}mm du BA)
          et le centre de l'emplacement où les plombs de variation sont posés dans le nez.
          Cette cote est propre à chaque cellule.
        </div>
      </div>
    </>
  )
}
