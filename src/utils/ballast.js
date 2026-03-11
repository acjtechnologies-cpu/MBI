/**
 * BALLAST SOLVER V2 - Précision CG ± 1mm avec asymétrie
 * 
 * ALGORITHME :
 * 1. Calculer ballast total nécessaire
 * 2. Remplir itérativement en choisissant le meilleur bloc :
 *    - Minimise |CG - 0mm|
 *    - Respecte capacités
 *    - Gère asymétrie gauche/droite
 * 3. Arrêt si CG ∈ [-1mm, +1mm] ET masse ≥ cible
 */

// Masses des matériaux (grammes)
export const MATERIAUX = {
  W: { masse: 164, label: 'Tungstène', couleur: 'cuivre' },
  L: { masse: 96, label: 'Plomb', couleur: 'argent' },
  B: { masse: 71, label: 'Laiton', couleur: 'or' }
}

// Paliers d'offset (grammes)
export const OFFSETS = [-170, -85, -42, 0, 42, 85, 170]

// Tolérance CG (mm)
const CG_TARGET = 0
const CG_TOLERANCE = 1.0 // ±1mm

/**
 * Résout la configuration optimale de soute avec précision CG
 * 
 * @param {number} masseCible - Masse totale cible en grammes
 * @param {number} masseVide - Masse à vide en grammes
 * @param {number} offset - Offset actuel en grammes
 * @param {object} config - Configuration soute
 * @returns {object} Solution {gauche, droite, totalMasse, cg, iterations}
 */
export function resoudreSoute(masseCible, masseVide, offset, config) {
  // Masse de ballast nécessaire
  const ballastNecessaire = masseCible - masseVide - offset
  
  // Initialiser solution vide
  const solution = {
    gauche: { av: [], c: [], ar: [] },
    droite: { av: [], c: [], ar: [] }
  }
  
  // Si ballast négatif ou nul, retourner vide
  if (ballastNecessaire <= 0) {
    return { ...solution, totalMasse: 0, cg: 0, iterations: 0 }
  }
  
  // Masses disponibles par ordre décroissant
  const materiaux = Object.keys(MATERIAUX).filter(m => config[`m_${m}`] > 0)
  if (materiaux.length === 0) {
    console.warn('Aucun matériau disponible')
    return { ...solution, totalMasse: 0, cg: 0, iterations: 0 }
  }
  materiaux.sort((a, b) => config[`m_${b}`] - config[`m_${a}`])
  
  // Algorithme itératif
  let iterations = 0
  const MAX_ITERATIONS = 100
  
  while (iterations < MAX_ITERATIONS) {
    iterations++
    
    // Calculer état actuel
    const stats = calculerStatsSoute(solution, config, masseVide)
    const cgActuel = stats.cg
    const masseActuelle = stats.masse
    
    // Condition d'arrêt : CG précis ET masse suffisante
    const cgOK = Math.abs(cgActuel - CG_TARGET) <= CG_TOLERANCE
    const masseOK = masseActuelle >= ballastNecessaire - 10 // tolérance 10g
    
    if (cgOK && masseOK) {
      break
    }
    
    // Chercher le meilleur bloc à ajouter
    const meilleurBloc = choisirMeilleurBloc(solution, config, cgActuel, masseActuelle, ballastNecessaire, materiaux)
    
    if (!meilleurBloc) {
      // Plus de solution possible
      break
    }
    
    // Ajouter le bloc
    solution[meilleurBloc.side][meilleurBloc.pack].push(meilleurBloc.material)
  }
  
  // Calculer stats finaux
  const finalStats = calculerStatsSoute(solution, config, masseVide)
  
  return {
    ...solution,
    totalMasse: finalStats.masse,
    cg: finalStats.cg,
    iterations: iterations
  }
}

/**
 * Choisit le meilleur bloc à ajouter pour optimiser CG + symétrie
 * 
 * @param {object} solution - Solution actuelle
 * @param {object} config - Configuration
 * @param {number} cgActuel - CG actuel en mm
 * @param {number} masseActuelle - Masse actuelle en g
 * @param {number} masseCible - Masse cible en g
 * @param {array} materiaux - Matériaux disponibles
 * @returns {object|null} {side, pack, material} ou null
 */
function choisirMeilleurBloc(solution, config, cgActuel, masseActuelle, masseCible, materiaux) {
  let meilleurChoix = null
  let meilleurScore = Infinity
  
  // Tester tous les emplacements possibles
  const sides = ['gauche', 'droite']
  const packs = ['av', 'c', 'ar']
  
  for (const side of sides) {
    for (const pack of packs) {
      // Vérifier capacité
      const capacity = config[`cap_${pack}`]
      if (solution[side][pack].length >= capacity) continue
      
      // Tester chaque matériau
      for (const material of materiaux) {
        const masseMat = config[`m_${material}`]
        
        // Simuler l'ajout
        const solutionTest = JSON.parse(JSON.stringify(solution))
        solutionTest[side][pack].push(material)
        
        // CONTRAINTE SYMÉTRIE : max 1 bloc d'écart par soute
        const nbGauche = solutionTest.gauche[pack].length
        const nbDroite = solutionTest.droite[pack].length
        const ecartSymetrie = Math.abs(nbGauche - nbDroite)
        
        // INTERDIRE si écart > 1
        if (ecartSymetrie > 1) {
          continue // Skip ce choix
        }
        
        const statsTest = calculerStatsSoute(solutionTest, config, 0)
        const cgTest = statsTest.cg
        const masseTest = masseActuelle + masseMat
        
        // Score = distance au CG cible + pénalité si dépasse la masse
        let score = Math.abs(cgTest - CG_TARGET)
        
        // Pénalité si on dépasse trop la masse cible
        if (masseTest > masseCible + 50) {
          score += 100
        }
        
        // Bonus si on est proche de la masse cible
        if (Math.abs(masseTest - masseCible) < 20) {
          score -= 0.5
        }
        
        // BONUS si symétrie parfaite
        if (ecartSymetrie === 0) {
          score -= 0.3
        }
        
        // Garder le meilleur
        if (score < meilleurScore) {
          meilleurScore = score
          meilleurChoix = { side, pack, material }
        }
      }
    }
  }
  
  return meilleurChoix
}

/**
 * Calcule les statistiques de la soute
 * 
 * @param {object} soute - Configuration soute {gauche: {av, c, ar}, droite: {av, c, ar}}
 * @param {object} config - Config axes
 * @param {number} masseVide - Masse à vide en grammes (optionnel)
 * @returns {object} {masse, cg, moment, asymetrie}
 */
export function calculerStatsSoute(soute, config, masseVide = 0) {
  let masseTotale = 0
  let moment = 0
  
  const { x_av, x_ar, x_c } = config
  
  // Fonction helper pour ajouter masse
  const ajouterMasse = (materiau, x) => {
    const m = config[`m_${materiau}`] || 0
    masseTotale += m
    moment += m * x
  }
  
  // Gauche
  soute.gauche.av.forEach(mat => ajouterMasse(mat, x_av))
  soute.gauche.c.forEach(mat => ajouterMasse(mat, x_c))
  soute.gauche.ar.forEach(mat => ajouterMasse(mat, x_ar))
  
  // Droite
  soute.droite.av.forEach(mat => ajouterMasse(mat, x_av))
  soute.droite.c.forEach(mat => ajouterMasse(mat, x_c))
  soute.droite.ar.forEach(mat => ajouterMasse(mat, x_ar))
  
  // Ajouter masse à vide au CG 0
  if (masseVide > 0) {
    masseTotale += masseVide
    moment += masseVide * 0 // masse à vide au CG 0
  }
  
  // CG = Σ(m*x) / Σm
  const cg = masseTotale > 0 ? moment / masseTotale : 0
  
  // Calculer asymétrie gauche/droite
  const masseGauche = calculerMasseCote(soute.gauche, config)
  const masseDroite = calculerMasseCote(soute.droite, config)
  const asymetrie = masseGauche - masseDroite
  
  return {
    masse: masseTotale - masseVide, // masse ballast seulement
    cg: cg,
    moment: moment,
    asymetrie: asymetrie,
    masseGauche: masseGauche,
    masseDroite: masseDroite
  }
}

/**
 * Calcule la masse d'un côté (gauche ou droite)
 */
function calculerMasseCote(cote, config) {
  let masse = 0
  
  for (const pack of ['av', 'c', 'ar']) {
    cote[pack].forEach(mat => {
      masse += config[`m_${mat}`] || 0
    })
  }
  
  return masse
}

/**
 * Optimise l'offset pour atteindre masse cible
 * 
 * @param {number} masseCible - Masse cible en grammes
 * @param {number} masseActuelle - Masse actuelle en grammes
 * @returns {number} Offset recommandé (palier discret)
 */
export function optimiserOffset(masseCible, masseActuelle) {
  const delta = masseCible - masseActuelle
  
  // Trouver le palier le plus proche
  let offsetOptimal = 0
  let minDiff = Infinity
  
  for (const offset of OFFSETS) {
    const diff = Math.abs(delta - offset)
    if (diff < minDiff) {
      minDiff = diff
      offsetOptimal = offset
    }
  }
  
  return offsetOptimal
}

/**
 * Calcule le CG cible selon règles F3F
 * 
 * @param {number} masse - Masse en kg
 * @param {number} surface - Surface en dm²
 * @returns {number} CG cible en mm
 */
export function calculerCGCible(masse, surface) {
  // Pour l'instant, toujours 0mm (référence)
  // Peut être enrichi avec une formule empirique
  return 0
}

/**
 * Vérifie si la solution respecte les contraintes
 * 
 * @param {object} soute - Solution soute
 * @param {object} config - Configuration
 * @returns {boolean} Valid
 */
export function verifierContraintes(soute, config) {
  // Vérifier capacités
  for (const side of ['gauche', 'droite']) {
    if (soute[side].av.length > config.cap_av) return false
    if (soute[side].c.length > config.cap_c) return false
    if (soute[side].ar.length > config.cap_ar) return false
  }
  
  return true
}

/**
 * Obtient la répartition des blocs par compartiment
 * 
 * @param {object} soute - Solution soute
 * @returns {object} Compteurs
 */
export function getCompartmentCounts(soute) {
  return {
    gauche_av: soute.gauche.av.length,
    gauche_c: soute.gauche.c.length,
    gauche_ar: soute.gauche.ar.length,
    droite_av: soute.droite.av.length,
    droite_c: soute.droite.c.length,
    droite_ar: soute.droite.ar.length,
  }
}

/**
 * Analyse la qualité de la solution
 * 
 * @param {object} stats - Statistiques soute
 * @param {number} masseCible - Masse cible en grammes
 * @returns {object} Analyse
 */
export function analyserSolution(stats, masseCible) {
  const cgQuality = Math.abs(stats.cg) <= CG_TOLERANCE ? 'PARFAIT' : 
                    Math.abs(stats.cg) <= 2 ? 'BON' :
                    Math.abs(stats.cg) <= 5 ? 'ACCEPTABLE' : 'MAUVAIS'
  
  const asymetrieQuality = Math.abs(stats.asymetrie) <= 10 ? 'PARFAIT' :
                           Math.abs(stats.asymetrie) <= 50 ? 'BON' :
                           Math.abs(stats.asymetrie) <= 100 ? 'ACCEPTABLE' : 'MAUVAIS'
  
  const masseError = Math.abs(stats.masse - (masseCible - 2455)) // approximation
  const masseQuality = masseError <= 20 ? 'PARFAIT' :
                       masseError <= 50 ? 'BON' :
                       masseError <= 100 ? 'ACCEPTABLE' : 'MAUVAIS'
  
  return {
    cgQuality,
    asymetrieQuality,
    masseQuality,
    cg_mm: stats.cg.toFixed(1),
    asymetrie_g: stats.asymetrie.toFixed(0),
    masseError_g: masseError.toFixed(0)
  }
}
