import { useState, useCallback } from 'react';
import { useLongPress } from '../../hooks/useLongPress'; // adapte le chemin si besoin
import { HELP_CONTENT } from '../../content/helpContent'; // adapte le chemin si besoin

/**
 * Overlay pédagogique semi-transparent, déclenché par un appui long
 * sur une zone NEUTRE de l'écran (fond, bandeau récap). Les zones
 * interactives (boutons, sliders, inputs, [data-no-help]) sont
 * automatiquement exclues par useLongPress — ne gêne jamais le
 * geste normal (ex. slider tactile de MatriceInteractive.jsx).
 *
 * Intégration : UN SEUL <HelpOverlay activePage={...} /> monté une
 * fois, au niveau racine (App.jsx), par-dessus les 6 pages.
 *
 *   // si l'onglet actif vit dans un store Zustand :
 *   const activeTab = useAppStore((s) => s.activeTab);
 *   <HelpOverlay activePage={activeTab} />
 *
 *   // si l'onglet actif est un useState local à App.jsx :
 *   const [tab, setTab] = useState('pilotage');
 *   <HelpOverlay activePage={tab} />
 *
 * activePage doit correspondre à une clé de HELP_CONTENT :
 * 'pilotage' | 'matrice' | 'soute' | 'poly4' | 'station' | 'chrono'
 * — à adapter si tes clés d'onglet actuelles sont différentes
 * (ex. 'Pilotage' avec majuscule, ou un id numérique).
 */
export default function HelpOverlay({ activePage }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const longPressHandlers = useLongPress(open);

  const content = HELP_CONTENT[activePage];

  return (
    <>
      {/* Couche de capture invisible, plein écran, sous le contenu de la page.
          pointer-events désactivé quand l'overlay est visible pour laisser
          passer le relâchement vers le panneau d'aide (onPointerUp ferme). */}
      <div
        {...longPressHandlers}
        className="fixed inset-0 z-40"
        style={{
          pointerEvents: visible ? 'none' : 'auto',
          WebkitTouchCallout: 'none', // coupe le menu natif iOS sur appui long
          WebkitUserSelect: 'none',
          userSelect: 'none',          // coupe la sélection de texte Android (source probable de la vibration)
        }}
        aria-hidden="true"
      />

      {visible && content && (
        <div
          role="dialog"
          aria-label={`Aide — ${content.title}`}
          onPointerUp={close}
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col justify-center overflow-y-auto p-6"
          style={{ background: 'rgba(11, 27, 58, 0.94)' }} // navy semi-transparent (charte du guide)
        >
          <h2 className="text-xl font-bold text-white">{content.title}</h2>
          <p className="mb-4 text-sm text-white/60">{content.subtitle}</p>
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-white">
            {content.lines.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-blue-400">●</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-xs text-white/40">Relâche pour fermer</p>
        </div>
      )}
    </>
  );
}
