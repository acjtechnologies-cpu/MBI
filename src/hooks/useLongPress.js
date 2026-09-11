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
 * IMPORTANT : n'installe AUCUN calque visuel par-dessus l'app — écoute
 * directement sur window, en lecture seule (jamais de preventDefault
 * sauf sur contextmenu APRÈS déclenchement). Les clics/touches normaux
 * traversent donc sans aucune interférence vers les boutons, sliders,
 * flèches existants.
 *
 * Usage : appelle le hook, aucun handler à spreader nulle part.
 *   useLongPress(() => setVisible(true), { enabled: !visible })
 */
export function useLongPress(
  onLongPress,
  { threshold = 500, ignoreSelector = DEFAULT_IGNORE_SELECTOR, enabled = true } = {}
) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

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
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        // Coupe la sélection de texte / menu contextuel natif du navigateur
        // (source probable de la vibration système sur Android/Chrome)
        window.getSelection?.()?.removeAllRanges?.();
        onLongPress(e);
      }, threshold);
    };

    const cancel = () => clear();

    const onContextMenu = (e) => {
      if (firedRef.current) e.preventDefault();
    };

    // passive: true → on ne bloque JAMAIS le comportement natif (scroll,
    // drag, etc.), on observe seulement.
    // capture: true → on intercepte AVANT que d'autres composants (ex. le
    // drag tactile de MatriceInteractive) ne fassent un stopPropagation
    // qui empêcherait sinon l'événement de nous atteindre en phase bulle.
    window.addEventListener('pointerdown', start, { passive: true, capture: true });
    window.addEventListener('pointerup', cancel, { passive: true, capture: true });
    window.addEventListener('pointercancel', cancel, { passive: true, capture: true });
    window.addEventListener('contextmenu', onContextMenu);

    return () => {
      clear();
      window.removeEventListener('pointerdown', start, { capture: true });
      window.removeEventListener('pointerup', cancel, { capture: true });
      window.removeEventListener('pointercancel', cancel, { capture: true });
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [onLongPress, threshold, ignoreSelector, enabled]);
}
