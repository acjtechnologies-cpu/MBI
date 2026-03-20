/**
 * SOLVER MBI - Matrice planeur dynamique
 * Utilise config.matrix si disponible
 * Fallback sur MATRIX_REFS Mamba si absent
 */

// Matrice Mamba par defaut (fallback)
var MATRIX_MAMBA = [
  {n: 1, m:2726, cg:102.2, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:1,D:1,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 2, m:2814, cg:102.2, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:2,D:1,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 3, m:2902, cg:102.2, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:2,D:2,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 4, m:2990, cg:102.4, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:2,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 5, m:3078, cg:102.4, av:{G:0,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 6, m:3149, cg:102.0, av:{G:1,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:0,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 7, m:3220, cg:102.7, av:{G:1,D:0,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 8, m:3291, cg:102.8, av:{G:1,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:0,matG:'Laiton',matD:'Laiton'}},
  {n: 9, m:3362, cg:102.8, av:{G:1,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:1,matG:'Laiton',matD:'Laiton'}},
  {n:10, m:3433, cg:102.8, av:{G:2,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:1,D:1,matG:'Laiton',matD:'Laiton'}},
  {n:11, m:3504, cg:102.8, av:{G:2,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:1,matG:'Laiton',matD:'Laiton'}},
  {n:12, m:3575, cg:102.8, av:{G:2,D:1,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:13, m:3646, cg:103.1, av:{G:2,D:2,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:14, m:3717, cg:103.1, av:{G:3,D:2,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:15, m:3788, cg:102.3, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:2,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:16, m:3859, cg:102.3, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:3,D:2,matG:'Laiton',matD:'Laiton'}},
  {n:17, m:3930, cg:103.2, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:3,D:3,matG:'Laiton',matD:'Laiton'}},
  {n:18, m:4001, cg:104.0, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:4,D:3,matG:'Laiton',matD:'Laiton'}},
  {n:19, m:4072, cg:102.8, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:4,D:4,matG:'Laiton',matD:'Laiton'}},
  {n:20, m:4072, cg:102.8, av:{G:3,D:3,matG:'Laiton',matD:'Laiton'}, c:{G:3,D:3,matG:'Plomb',matD:'Plomb'}, ar:{G:4,D:4,matG:'Laiton',matD:'Laiton'}}
]

// Construire array de noms
function makeArr(n, nom) {
  var a = []
  for (var i = 0; i < n; i++) a.push(nom)
  return a
}

// Calcul masse d'une config matrice
function calcMasseRef(ref, config) {
  var mv = config.masseVide || 0
  var total = mv
  var souteKeys = Object.keys(ref)
  for (var ki = 0; ki < souteKeys.length; ki++) {
    var key = souteKeys[ki]
    if (key === 'n' || key === 'm' || key === 'cg') continue
    var b = ref[key]
    if (!b || typeof b !== 'object') continue
    var soute = config.soutes[key]
    if (!soute) continue
    var matG = soute.materiaux.find(function(m) { return m.nom === b.matG }) || soute.materiaux[0]
    var matD = soute.materiaux.find(function(m) { return m.nom === b.matD }) || soute.materiaux[0]
    if (matG) total += b.G * matG.masse
    if (matD) total += b.D * matD.masse
  }
  return total
}

// Stats soute
export function calculerStatsSouteV2(result, config) {
  if (!result) {
    return { masseTotale: config ? config.masseVide : 0, cg: config ? config.cgVide : 0, cgDelta: 0, precision: 0 }
  }
  var masseVide = config.masseVide || 0
  var cgVide    = config.cgVide   || 0
  var masseBallast  = 0
  var momentBallast = 0
  var keys = Object.keys(config.soutes)
  for (var ki = 0; ki < keys.length; ki++) {
    var key   = keys[ki]
    var soute = config.soutes[key]
    if (!soute) continue
    var dist  = soute.distanceBA
    var blocs = (result.gauche[key] || []).concat(result.droite[key] || [])
    for (var bi = 0; bi < blocs.length; bi++) {
      for (var mi = 0; mi < soute.materiaux.length; mi++) {
        if (soute.materiaux[mi].nom.toLowerCase() === blocs[bi].toLowerCase()) {
          masseBallast  += soute.materiaux[mi].masse
          momentBallast += soute.materiaux[mi].masse * dist
          break
        }
      }
    }
  }
  var masseTotale = masseVide + masseBallast
  var cgAbsolu = masseTotale > 0 ? (masseVide * cgVide + momentBallast) / masseTotale : cgVide
  return {
    masseTotale: masseTotale,
    cg:          cgAbsolu,
    cgDelta:     cgAbsolu - cgVide,
    precision:   masseBallast > 0 ? (masseBallast / (masseBallast + 50)) * 100 : 0
  }
}

// Solver principal
export function resoudreSouteV2(masseCible, masseVide, config, cgCible) {
  if (!config || !config.soutes) { return null }

  var cgVide = config.cgVide || 102

  // Matrice : utilise config.matrix si disponible, sinon MATRIX_MAMBA
  var matrix = (config.matrix && config.matrix.length > 0) ? config.matrix : MATRIX_MAMBA

  console.log("=== SOLVER MBI ===")
  console.log("Planeur: " + (config.nom || config.id || 'Mamba S'))
  console.log("Masse cible: " + masseCible.toFixed(1) + "g")
  console.log("Matrice: " + matrix.length + " configs " + (config.matrix ? "(planeur)" : "(Mamba fallback)"))

  if (masseCible <= masseVide) {
    return { gauche: {}, droite: {}, totalMasse: 0, cg: cgVide, cgDelta: 0, iterations: 0 }
  }

  // Trouver config la plus proche
  var best = null
  var bestD = Infinity
  for (var i = 0; i < matrix.length; i++) {
    var ref = matrix[i]
    // Masse ref : utiliser ref.m si disponible, sinon calculer
    var mRef = ref.m || calcMasseRef(ref, config)
    var d = Math.abs(mRef - masseCible)
    if (d < bestD) { bestD = d; best = ref }
  }

  if (!best) { console.error("Aucune config trouvée"); return null }

  console.log("Config #" + best.n + " ref:" + (best.m || '?') + "g ecart:" + bestD.toFixed(0) + "g")

  // Construire gauche/droite depuis la config
  var gauche = {}
  var droite = {}
  var mb = 0
  var mom = masseVide * cgVide
  var souteKeys = Object.keys(config.soutes)

  for (var ki = 0; ki < souteKeys.length; ki++) {
    var key = souteKeys[ki]
    var soute = config.soutes[key]
    var b = best[key] || { G:0, D:0, matG: soute.materiaux[0]?.nom, matD: soute.materiaux[0]?.nom }

    var matG = soute.materiaux.find(function(m) { return m.nom === b.matG }) || soute.materiaux[0]
    var matD = soute.materiaux.find(function(m) { return m.nom === b.matD }) || soute.materiaux[0]

    gauche[key] = makeArr(b.G, matG ? matG.nom : '')
    droite[key] = makeArr(b.D, matD ? matD.nom : '')

    if (matG) { mb += b.G * matG.masse; mom += b.G * matG.masse * soute.distanceBA }
    if (matD) { mb += b.D * matD.masse; mom += b.D * matD.masse * soute.distanceBA }

    console.log(key.toUpperCase() + " G=" + b.G + "(" + (matG?matG.nom:'?') + ") D=" + b.D + "(" + (matD?matD.nom:'?') + ")")
  }

  var mt = masseVide + mb
  var cg = mt > 0 ? mom / mt : cgVide

  console.log("Masse: " + mt.toFixed(1) + "g | CG: " + cg.toFixed(2) + "mm | delta: " + (cg-cgVide).toFixed(2) + "mm")

  return {
    gauche:     gauche,
    droite:     droite,
    totalMasse: mb,
    cg:         cg,
    cgDelta:    cg - cgVide,
    iterations: 1,
    configN:    best.n
  }
}
