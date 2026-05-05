const mv = 2332, cgv = 97.0, dAV = 78, dAR = 118

const matrix = [
  {n:1,  m:2500, cg:96.2, av:1, ar:1},
  {n:2,  m:2584, cg:97.1, av:2, ar:2},
  {n:3,  m:2670, cg:96.6, av:2, ar:2},
  {n:7,  m:2969, cg:97.1, av:4, ar:4},
  {n:10, m:3350, cg:97.0, av:6, ar:6},
  {n:11, m:3484, cg:97.5, av:7, ar:7},
  {n:14, m:3794, cg:97.0, av:8, ar:8},
  {n:17, m:4242, cg:97.0, av:10,ar:10},
]

console.log('N   | M_constr | CG_constr | CG_calc | Ecart')
matrix.forEach(c => {
  const mAV = c.av * 42  // masse AV estimee
  const mAR = c.ar * 126 // masse AR estimee
  const mTot = mv + mAV + mAR
  const cgCalc = (mv*cgv + mAV*dAV + mAR*dAR) / mTot
  const ecart = (cgCalc - c.cg).toFixed(1)
  console.log(`${c.n.toString().padStart(2)} | ${c.m}g    | ${c.cg}mm   | ${cgCalc.toFixed(1)}mm   | ${ecart}mm`)
})
