import { useState, useCallback } from 'react';
import { useLongPress } from '../../hooks/useLongPress'; // adapte le chemin si besoin
import { HELP_CONTENT } from '../../content/helpContent'; // adapte le chemin si besoin

/**
 * Overlay pédagogique semi-transparent, déclenché par un appui long
 * sur une zone NEUTRE de l'écran (fond, bandeau récap). Les zones
 * interactives (boutons, sliders, inputs, [data-no-help]) sont
 * automatiquement exclues par useLongPress.
 *
 * IMPORTANT (fix régression) : ce composant ne rend RIEN tant que
 * visible=false — pas de calque invisible plein écran en permanence.
 * La détection se fait via des écouteurs globaux dans useLongPress,
 * donc les boutons/sliders/flèches de l'app reçoivent leurs clics et
 * touches normalement, sans aucune interception.
 *
 * Intégration : UN SEUL <HelpOverlay activePage={...} /> monté une
 * fois, au niveau racine (App.jsx), par-dessus les 6 pages.
 *
 *   const activeTab = useAppStore((s) => s.activeTab); // ou useState local
 *   <HelpOverlay activePage={activeTab} />
 *
 * activePage doit correspondre à une clé de HELP_CONTENT :
 * 'pilote' | 'matrice' | 'soute' | 'poly4' | 'station' | 'chrono'
 */
export default function HelpOverlay({ activePage }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  // Écoute désactivée pendant que l'overlay est déjà affiché (évite un
  // ré-armement pendant qu'on est en train de le fermer).
  useLongPress(open, { enabled: !visible });

  const content = HELP_CONTENT[activePage];
  if (!visible || !content) return null; // rien de monté = rien ne peut bloquer les clics

  return (
    <div
      role="dialog"
      aria-label={`Aide — ${content.title}`}
      onPointerUp={close}
      onClick={close}
      className="fixed inset-0 z-50 flex flex-col justify-center overflow-y-auto p-6"
      style={{
        background: 'rgba(11, 27, 58, 0.55)', // navy transparent — l'app reste visible en dessous
        backdropFilter: 'blur(1.5px)',
        WebkitBackdropFilter: 'blur(1.5px)',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <h2 className="text-xl font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}>
        {content.title}
      </h2>
      <p className="mb-4 text-sm text-white/80" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
        {content.subtitle}
      </p>
      <ul className="flex flex-col gap-3 text-sm leading-relaxed text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
        {content.lines.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-blue-300">●</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-center text-xs text-white/70" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
        Relâche pour fermer
      </p>
    </div>
  );
}
