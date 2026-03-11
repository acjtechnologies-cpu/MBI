/** SOLVER V6 */
export function calculerStatsSouteV2(result, config) {
  if (!result) { return { masseTotale: config ? config.masseVide : 0, cg: config ? config.cgVide : 0, cgDelta: 0, precision: 0 } }
  var masseVide = config.masseVide || 0
  var cgVide = config.cgVide || 0
  var masseBallast = 0
  var momentBallast = 0
  var keys = ["av", "c", "ar"]
  for (var ki = 0; ki < keys.length; ki++) {
    var key = keys[ki]
    var soute = config.soutes[key]
    if (!soute) continue
    var dist = soute.distanceBA
    var blocs = (result.gauche[key] || []).concat(result.droite[key] || [])
    for (var bi = 0; bi < blocs.length; bi++) {
      for (var mi = 0; mi < soute.materiaux.length; mi++) {
        if (soute.materiaux[mi].nom.toLowerCase() === blocs[bi].toLowerCase()) {
          masseBallast += soute.materiaux[mi].masse
          momentBallast += soute.materiaux[mi].masse * dist
          break
        }
      }
    }
  }
  var masseTotale = masseVide + masseBallast
  var cgAbsolu = masseTotale > 0 ? (masseVide * cgVide + momentBallast) / masseTotale : cgVide
  return { masseTotale: masseTotale, cg: cgAbsolu, cgDelta: cgAbsolu - cgVide, precision: masseBallast > 0 ? (masseBallast / (masseBallast + 50)) * 100 : 0 }
}
export function resoudreSouteV2(masseCible, masseVide, config, cgCible) {
  var cgCibleAbs = config.cgVide + (cgCible || 0)
  console.log("=== SOLVER V6 ===")
  console.log("CG absolu cible: " + cgCibleAbs.toFixed(2) + " mm")
  console.log("Masse cible: " + masseCible.toFixed(1) + " g")
  if (!config || !config.soutes) { return null }
  var ballast = masseCible - masseVide
  if (ballast <= 0) { return { gauche: {av:[],c:[],ar:[]}, droite: {av:[],c:[],ar:[]}, totalMasse: 0, cg: config.cgVide, cgDelta: 0, iterations: 0 } }
  function matsDispos(soute) {
    if (!soute || !soute.materiaux) return []
    var res = []
    for (var i = 0; i < soute.materiaux.length; i++) {
      var m = soute.materiaux[i]
      if (m.stock === null || m.stock === undefined || m.stock > 0) res.push(m)
    }
    return res.sort(function(a, b) { return a.masse - b.masse })
  }
  var matsAV = matsDispos(config.soutes.av)
  var matsC = matsDispos(config.soutes.c)
  var matsAR = matsDispos(config.soutes.ar)
  var capAV = config.soutes.av ? config.soutes.av.capacite : 0
  var capC = config.soutes.c ? config.soutes.c.capacite : 0
  var capAR = config.soutes.ar ? config.soutes.ar.capacite : 0
  var dAV = config.soutes.av ? config.soutes.av.distanceBA : 80
  var dC = config.soutes.c ? config.soutes.c.distanceBA : 102
  var dAR = config.soutes.ar ? config.soutes.ar.distanceBA : 129
  if (!matsAV.length || !matsC.length || !matsAR.length) { console.error("Materiaux manquants"); return null }
  var best = null
  var bestScore = Infinity
  var compteur = 0
  for (var iAV = 0; iAV < matsAV.length; iAV++) {
    var mAV = matsAV[iAV]
    for (var iC = 0; iC < matsC.length; iC++) {
      var mC = matsC[iC]
      for (var iAR = 0; iAR < matsAR.length; iAR++) {
        var mAR = matsAR[iAR]
        for (var nAV = 0; nAV <= capAV; nAV++) {
          for (var nC = 0; nC <= capC; nC++) {
            for (var nAR = 0; nAR <= capAR; nAR++) {
              for (var xAV = 0; xAV <= 1; xAV++) {
                for (var xC = 0; xC <= 1; xC++) {
                  for (var xAR = 0; xAR <= 1; xAR++) {
                    if (nAV+xAV > capAV) continue
                    if (nC+xC > capC) continue
                    if (nAR+xAR > capAR) continue
                    compteur++
                    var tAV = (nAV+xAV)+nAV
                    var tC = (nC+xC)+nC
                    var tAR = (nAR+xAR)+nAR
                    var mb = tAV*mAV.masse + tC*mC.masse + tAR*mAR.masse
                    var mt = masseVide + mb
                    var mom = masseVide*config.cgVide + tAV*mAV.masse*dAV + tC*mC.masse*dC + tAR*mAR.masse*dAR
                    var cg = mt > 0 ? mom/mt : config.cgVide
                    var score = Math.abs(mt-masseCible) + 50*Math.abs(cg-cgCibleAbs) + (xAV+xC+xAR)*0.5
                    if (score < bestScore) {
                      bestScore = score
                      best = { nAV:nAV, nC:nC, nAR:nAR, xAV:xAV, xC:xC, xAR:xAR, mAV:mAV, mC:mC, mAR:mAR, mb:mb, mt:mt, cg:cg }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  if (!best) { return null }
  var s = best
  function mk(n, nom) { var a = []; for (var i = 0; i < n; i++) a.push(nom); return a }
  return {
    gauche: { av: mk(s.nAV+s.xAV, s.mAV.nom), c: mk(s.nC+s.xC, s.mC.nom), ar: mk(s.nAR+s.xAR, s.mAR.nom) },
    droite: { av: mk(s.nAV, s.mAV.nom), c: mk(s.nC, s.mC.nom), ar: mk(s.nAR, s.mAR.nom) },
    totalMasse: s.mb, cg: s.cg, cgDelta: s.cg - config.cgVide, iterations: compteur
  }
}