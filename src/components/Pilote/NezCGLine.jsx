/**
 * NezCGLine — Ligne CG verticale entre soutes G/D
 * 
 * Affiche le déplacement CG en mm sur l'axe longitudinal fuselage.
 * Le point se déplace sur la ligne proportionnellement au ΔCG.
 * Échelle ±5mm. Lecture : mm à gauche du point.
 * 
 * Props:
 *   mm        — déplacement CG en mm (négatif = avant, positif = arrière)
 *   grams     — masse nez delta en grammes
 *   active    — true si selectedParam === 'nez'
 *   showDot   — true pour afficher le point et la valeur (rangée centrale)
 */
export default function NezCGLine({ mm = 0, grams = 0, active = false, showDot = false, cgColor = null }) {
  const MAX_MM = 5
  const absMM = Math.abs(mm)

  // Couleur: suit le code CG du dashboard si fourni
  const color = cgColor || (absMM < 0.5 ? '#3fb950'
    : absMM < 2 ? '#56d364'
    : absMM < 4 ? '#d29922'
    : absMM < 6 ? '#db8600'
    : '#f85149')

  // Position du point : 50% = zéro, haut = CG avance (mm négatif)
  const dotPct = 50 + (mm / MAX_MM) * 42
  const clampedPct = Math.max(6, Math.min(94, dotPct))

  const hasValue = grams !== 0 && showDot

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Rail */}
      <div
        style={{
          width: 3,
          height: '100%',
          borderRadius: 1.5,
          background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        {/* Tick zéro */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 9,
            height: 2,
            borderRadius: 1,
            background: active ? 'rgba(63,185,80,0.35)' : 'rgba(63,185,80,0.15)',
            transition: 'background 0.2s',
          }}
        />

        {/* Point CG */}
        {hasValue && (
          <div
            style={{
              position: 'absolute',
              top: `${clampedPct}%`,
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 7,
              height: 12,
              borderRadius: 2,
              background: color,
              transition: 'top 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s',
              zIndex: 2,
            }}
          />
        )}

        {/* Valeur mm — à gauche du point */}
        {hasValue && (
          <div
            style={{
              position: 'absolute',
              top: `${clampedPct}%`,
              right: 10,
              transform: 'translateY(-50%)',
              fontSize: 11,
              fontFamily: 'monospace',
              fontWeight: 500,
              color: color,
              whiteSpace: 'nowrap',
              transition: 'top 0.35s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s',
              textShadow: '0 0 6px #0d1117, 0 0 10px #0d1117',
              zIndex: 3,
              pointerEvents: 'none',
            }}
          >
            {mm > 0 ? '+' : ''}{mm.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  )
}
