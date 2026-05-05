// Retrouve les vrais distanceBA depuis 2 configs constructeur
// CG = (mv*cgv + mAV*dAV + mAR*dAR) / mTotal
// On prend config #1 et #17 (extremes)

// Config #1 : av:G=0,D=0 + 1 bloc AR 126g → cg=96.2
// Mais config exacte : av:{G:[Laiton42],D:[]}, ar:{G:[Laiton126],D:[]}
// mAV=42, mAR=126, m=2500, cg=96.2

// Config #10 : av:{G:3x42,D:3x42}, ar:{G:3x126,D:3x126}
// mAV=252, mAR=756, m=3350, cg=97.0

const mv = 2332, cgv = 97.0

// Config #1: mAV=42, mAR=126, CG=96.2, mTotal=2500
// CG * mTotal = mv*cgv + mAV*dAV + mAR*dAR
// 96.2 * 2500 = 2332*97 + 42*dAV + 126*dAR
// 240500 = 226204 + 42*dAV + 126*dAR
// 14296 = 42*dAV + 126*dAR  ... (1)

// Config #10: mAV=252, mAR=756, CG=97.0, mTotal=3350
// 97.0 * 3350 = 2332*97 + 252*dAV + 756*dAR
// 324950 = 226204 + 252*dAV + 756*dAR
// 98746 = 252*dAV + 756*dAR  ... (2)

// (2) = 6 * (1) ? 6*14296 = 85776 != 98746
// Donc (2) - 6*(1) : 98746 - 85776 = 12970 = 0*dAV + 0*dAR → impossible
// Les configs ont des materiaux differents, recalculons

// Config #1 exacte depuis modelStore:
// {n:1, m:2500, cg:96.2, av:{G:[{Laiton,42}],D:[]}, ar:{G:[{Laiton,126}],D:[]}}
// mAV = 42, mAR = 126

// Config #7 exacte:
// av:{G:[{L,42},{L,42}],D:[{L,42},{L,42}]}, ar:{G:[{L,126},{L,126}],D:[{L,126},{L,126}]}
// mAV = 168, mAR = 504, m=2969, cg=97.1

// (1): 96.2*2500 = 2332*97 + 42*dAV + 126*dAR
//      240500 = 226204 + 42*dAV + 126*dAR
//      14296 = 42*dAV + 126*dAR

// (2): 97.1*2969 = 2332*97 + 168*dAV + 504*dAR
//      288289.9 = 226204 + 168*dAV + 504*dAR
//      62085.9 = 168*dAV + 504*dAR

// (2) = 4*(1) : 4*14296 = 57184
// 62085.9 - 57184 = 4901.9 = 0 + 0 → echec ratio identique

// Le ratio AV/AR est toujours 1:3 en masse (42:126)
// donc on ne peut pas separer dAV et dAR avec ces configs
// Il faut une config avec ratio different

// Config #13: av:{G:[T70,L42,L42,L21],D:[T70,L42,L42,L21]}, ar:{G:[L126,L126,L126,L63],D:[L126,L126,L126,L126]}
// mAV = 2*(70+42+42+21) = 350
// mAR = 3*126+63 + 4*126 = 441+504 = 945
// m=3654, cg=97.3

// (3): 97.3*3654 = 2332*97 + 350*dAV + 945*dAR
//      355533 = 226204 + 350*dAV + 945*dAR
//      129329.2 = 350*dAV + 945*dAR

// (1): 14296 = 42*dAV + 126*dAR → dAV = (14296 - 126*dAR) / 42

// Substitue dans (3):
// 129329.2 = 350*(14296 - 126*dAR)/42 + 945*dAR
// 129329.2 = 350*340.38 - 350*3*dAR + 945*dAR
// 129329.2 = 119133.3 - 1050*dAR + 945*dAR
// 129329.2 - 119133.3 = -105*dAR
// 10195.9 = -105*dAR
// dAR = -97.1 ← negatif, impossible!

// Le probleme : les masses dans la matrice ne sont pas
// simplement mAV*dAV + mAR*dAR
// Le constructeur a peut-etre un 3eme point (bloc central dans fuselage?)
// Ou cgVide != 97.0 exactement

// Essayons avec cgVide comme variable aussi
// Testons toutes les combinaisons dAV, dAR, cgVide
let bestErr = 99999, bestDAV, bestDAR, bestCGV

const cfgs = [
  { mAV:42,  mAR:126, m:2500, cg:96.2 },
  { mAV:84,  mAR:252, m:2670, cg:96.6 },
  { mAV:168, mAR:504, m:2969, cg:97.1 },
  { mAV:252, mAR:756, m:3350, cg:97.0 },
  { mAV:350, mAR:945, m:3654, cg:97.3 },
  { mAV:420, mAR:1260, m:4242, cg:97.0 },
]

for (let dav = 60; dav <= 100; dav += 0.1) {
  for (let dar = 100; dar <= 140; dar += 0.1) {
    for (let cv = 94; cv <= 100; cv += 0.1) {
      let err = 0
      cfgs.forEach(c => {
        const cgCalc = (mv*cv + c.mAV*dav + c.mAR*dar) / c.m
        err += Math.abs(cgCalc - c.cg)
      })
      if (err < bestErr) {
        bestErr = err; bestDAV = dav; bestDAR = dar; bestCGV = cv
      }
    }
  }
}

console.log('Meilleurs parametres:')
console.log('  dAV =', bestDAV.toFixed(1), 'mm')
console.log('  dAR =', bestDAR.toFixed(1), 'mm')
console.log('  cgVide =', bestCGV.toFixed(1), 'mm')
console.log('  erreur totale =', bestErr.toFixed(2), 'mm')

cfgs.forEach(c => {
  const cgCalc = (mv*bestCGV + c.mAV*bestDAV + c.mAR*bestDAR) / c.m
  console.log('  m='+c.m+'g cg_constr='+c.cg+' cg_calc='+cgCalc.toFixed(1)+' ecart='+(cgCalc-c.cg).toFixed(1))
})
