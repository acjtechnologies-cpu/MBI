import { useEffect } from 'react'
import { useMatrixStore } from './matrixStore'
import MatriceInteractive from './MatriceInteractive'

export default function PagePilotage({ model, soutes, MAT_KEYS, rawMatrix, targetGAuto }) {

  // Initialisation du "Cerveau" — uniquement pour un modèle réellement différent de celui
  // déjà chargé dans le store. Sans cette garde, si soutes/rawMatrix sont recréés à chaque
  // render du parent (références non stables), ce useEffect réinitialiserait le store en
  // boucle et écraserait silencieusement les blocs que le pilote vient de placer.
  useEffect(() => {
    if (!model || !soutes || !MAT_KEYS || !rawMatrix) return
    const already = useMatrixStore.getState().model
    if (already?.nom === model.nom) return // déjà initialisé pour ce modèle, on ne touche à rien
    useMatrixStore.getState().init(model, soutes, MAT_KEYS, rawMatrix)
  }, [model, soutes, MAT_KEYS, rawMatrix])

  const handleAppliquer = (masseFinale) => {
    console.log('Configuration validée et envoyée :', masseFinale)
    // Ici, ton code existant qui envoie la commande à l'ESP32 ou met à jour l'état global
  }

  // Sécurité : ne monter le composant QUE si le store a bien été initialisé
  const isReady = useMatrixStore(s => s.model !== null)

  return (
    <div className="page-pilotage">
      {/* ... Le reste de ton interface de pilotage ... */}

      {isReady ? (
        <MatriceInteractive
          targetGAuto={targetGAuto}
          onAppliquer={handleAppliquer}
        />
      ) : (
        <div className="mb-loading">Initialisation de la matrice de lest...</div>
      )}
    </div>
  )
}
