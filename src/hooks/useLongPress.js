import { useRef, useCallback } from 'react';

// Sélecteurs considérés "interactifs" : un appui long dessus ne doit
// JAMAIS déclencher l'overlay (ne pas gêner le geste normal).
// Ajoute data-no-help sur tout élément custom à exclure (ex. les
// blocs draggables de MatriceInteractive.jsx qui n'ont pas de rôle
// sémantique natif).
const DEFAULT_IGNORE_SELECTOR =
  'button, a, input, select, textarea, [role="slider"], [data-no-help]';

/**
 * Détecte un appui long (défaut 500ms) sur une zone neutre de l'écran.
 * Retourne des handlers à spread sur l'élément conteneur :
 *   const handlers = useLongPress(() => setVisible(true));
 *   <div {...handlers}>...</div>
 */
export function useLongPress(
  onLongPress,
  { threshold = 500, ignoreSelector = DEFAULT_IGNORE_SELECTOR } = {}
) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (e) => {
      if (e.target.closest(ignoreSelector)) return; // zone interactive → on ignore
      firedRef.current = false;
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        // Coupe la sélection de texte / menu contextuel natif du navigateur
        // (c'est CE comportement natif qui déclenche la vibration système
        // sur Android/Chrome — pas notre code). window.getSelection permet
        // d'annuler une sélection que le navigateur aurait déjà amorcée.
        window.getSelection?.()?.removeAllRanges?.();
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold, ignoreSelector]
  );

  const cancel = useCallback(() => {
    clear();
  }, [clear]);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e) => {
      // évite le menu contextuel mobile ("copier/partager") si l'overlay s'est déclenché
      if (firedRef.current) e.preventDefault();
    },
  };
}
