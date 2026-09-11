import { useRef, useEffect } from 'react';

// Sélecteurs considérés "interactifs" : un appui long dessus ne doit
// JAMAIS déclencher l'overlay (ne pas gêner le geste normal).
// Ajoute data-no-help sur tout élément custom à exclure (ex. les
// blocs draggables de MatriceInteractive.jsx qui n'ont pas de rôle
// sémantique natif).
const DEFAULT_IGNORE_SELECTOR =
  'button, a, input, select, textarea, [role="slider"], [data-no-help]';

/**
 * Détecte un appui long (défaut 500ms) sur une zone neutre de l'écran.
 * N'installe AUCUN calque visuel par-dessus l'app — écoute globale sur
 * window, en PHASE DE CAPTURE (avant tout stopPropagation d'un composant
 * enfant), en lecture seule (jamais de preventDefault sauf contextmenu
 * après déclenchement).
 *
 * IMPORTANT : on n'annule PAS le minuteur sur 'pointercancel'. Sur les
 * zones scrollables (ex. liste de configs / soutes de Matrice), le
 * navigateur peut émettre pointercancel par heuristique de scroll même
 * sans mouvement réel du doigt — ce qui empêchait l'appui long de se
 * déclencher là où pointercancel arrivait avant les 500ms. On annule
 * uniquement sur un VRAI déplacement (pointermove au-delà de
 * moveTolerance) ou un relâchement (pointerup).
 *
 * Usage : appelle le hook, aucun handler à spreader nulle part.
 *   useLongPress(() => setVisible(true), { enabled: !visible })
 */
export function useLongPress(
  onLongPress,
  {
    threshold = 500,
    moveTolerance = 10,
    ignoreSelector = DEFAULT_IGNORE_SELECTOR,
    enabled = true,
  } = {}
) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return undefined;

    const clear = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const start = (e) => {
      if (e.target.closest?.(ignoreSelector)) return; // zone interactive → on ignore
      firedRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        // Coupe la sélection de texte / menu contextuel natif du navigateur
        window.getSelection?.()?.removeAllRanges?.();
        onLongPress(e);
      }, threshold);
    };

    const move = (e) => {
      if (!timerRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (Math.hypot(dx, dy) > moveTolerance) clear(); // vrai déplacement → on annule
    };

    const onPointerUp = () => clear();

    const onContextMenu = (e) => {
      if (firedRef.current) e.preventDefault();
    };

    // passive: true → on ne bloque JAMAIS le comportement natif (scroll,
    // drag, etc.), on observe seulement.
    // capture: true → on intercepte AVANT qu'un composant enfant (ex. le
    // drag tactile de MatriceInteractive) ne fasse un stopPropagation.
    window.addEventListener('pointerdown', start, { passive: true, capture: true });
    window.addEventListener('pointermove', move, { passive: true, capture: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true, capture: true });
    window.addEventListener('contextmenu', onContextMenu);

    return () => {
      clear();
      window.removeEventListener('pointerdown', start, { capture: true });
      window.removeEventListener('pointermove', move, { capture: true });
      window.removeEventListener('pointerup', onPointerUp, { capture: true });
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [onLongPress, threshold, moveTolerance, ignoreSelector, enabled]);
}
