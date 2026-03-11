/**
 * SOLVER PROGRESSIF TERRAIN - v2 corrigé
 * 
 * Positions absolues / BA :
 * - AV:  80mm (pas -80)
 * - C:  102mm
 * - AR: 129mm
 */

export function calculerStatsSouteV2(result, config) {
  if (!result || result === null) {
    return { masseTotale: 0, cg: config?.cgVide || 0, cgDelta: 0, precision: 0 };
  }

  let masseTotale = 0;
  let momentTotal = 0;
  const masseVide = config.masseVide || 0;
  const cgVide    = config.cgVide   || 0;

  // Moment de l'avion vide
  momentTotal += masseVide * cgVide;
  masseTotale += masseVide;

  ['av', 'c', 'ar'].forEach(soute => {
    if (!config.soutes[soute]) return;

    const souteCfg   = config.soutes[soute];
    // ✅ FIX Bug 2 : utiliser Math.abs pour forcer position positive
    const distanceBA = Math.abs(souteCfg.distanceBA);

    const blocsGauche = result.gauche[soute] || [];
    const blocsDroite = result.droite[soute] || [];

    [...blocsGauche, ...blocsDroite].forEach(nomMat => {
      const mat = souteCfg.materiaux.find(m => m.nom === nomMat);
      if (mat) {
        masseTotale += mat.masse;
        momentTotal += mat.masse * distanceBA;
      }
    });
  });

  // ✅ CG absolu (mm/BA)
  const cgAbsolu = masseTotale > 0 ? momentTotal / masseTotale : cgVide;
  const cgDelta  = cgAbsolu - cgVide;

  return {
    masseTotale,
    cg: cgAbsolu,        // mm/BA absolu
    cgDelta,             // delta vs CG vide
    precision: masseTotale > masseVide
      ? ((masseTotale - masseVide) / (masseTotale - masseVide + 50)) * 100
      : 0
  };
}

export function resoudreSouteV2(masseCible, masseVide, config) {
  console.log('\n=== SOLVER TERRAIN PROGRESSIF ===');
  console.log('Masse cible:', masseCible, 'g');
  console.log('Masse vide:', masseVide, 'g');

  if (!config || !config.soutes) {
    console.error('Configuration invalide');
    return null;
  }

  const ballastNecessaire = masseCible - masseVide;
  console.log('Ballast necessaire:', ballastNecessaire, 'g');

  if (ballastNecessaire <= 0) {
    return {
      gauche: { av: [], c: [], ar: [] },
      droite: { av: [], c: [], ar: [] },
      totalMasse: 0,
      cg: config.cgVide,
      cgDelta: 0,
      iterations: 0
    };
  }

  // Choix matériau (priorité au plus lourd avec stock)
  const choisirMateriau = (materiaux) => {
    if (!materiaux || materiaux.length === 0) return null;
    const avecStock = materiaux.filter(m => m.stock === null || m.stock > 0);
    const liste = avecStock.length > 0 ? avecStock : materiaux;
    return liste.sort((a, b) => b.masse - a.masse)[0];
  };

  const matAV = choisirMateriau(config.soutes.av?.materiaux || []);
  const matC  = choisirMateriau(config.soutes.c?.materiaux  || []);
  const matAR = choisirMateriau(config.soutes.ar?.materiaux || []);

  if (!matAV || !matC || !matAR) {
    console.error('Materiaux manquants');
    return null;
  }

  // ✅ FIX Bug 1 : capacité déjà par côté, pas de division
  const capaciteAV = config.soutes.av?.capacite || 0;
  const capaciteC  = config.soutes.c?.capacite  || 0;
  const capaciteAR = config.soutes.ar?.capacite || 0;

  // ✅ FIX Bug 2 : positions absolues (toujours positives)
  const distanceAV = Math.abs(config.soutes.av?.distanceBA || 80);
  const distanceC  = Math.abs(config.soutes.c?.distanceBA  || 102);
  const distanceAR = Math.abs(config.soutes.ar?.distanceBA || 129);

  console.log('\n=== CONFIG ===');
  console.log('AV:', capaciteAV, 'blocs/cote,', matAV.nom, matAV.masse + 'g,', distanceAV, 'mm');
  console.log('C: ', capaciteC,  'blocs/cote,', matC.nom,  matC.masse  + 'g,', distanceC,  'mm');
  console.log('AR:', capaciteAR, 'blocs/cote,', matAR.nom, matAR.masse + 'g,', distanceAR, 'mm');

  console.log('\n=== REMPLISSAGE PROGRESSIF TERRAIN ===');

  let reste = ballastNecessaire;
  const blocsG = { av: [], c: [], ar: [] };
  const blocsD = { av: [], c: [], ar: [] };

  // ÉTAPE 1 : Soute C (bloc par bloc, alternant G/D)
  console.log('Etape 1: Soute C (priorite)...');
  for (let i = 0; i < capaciteC; i++) {
    if (reste >= matC.masse) {
      blocsG.c.push(matC.nom);
      reste -= matC.masse;
      console.log('  -> C Gauche +1 (reste:', reste.toFixed(1), 'g)');
    }
    if (reste >= matC.masse) {
      blocsD.c.push(matC.nom);
      reste -= matC.masse;
      console.log('  -> C Droite +1 (reste:', reste.toFixed(1), 'g)');
    }
    if (reste < matC.masse) break;
  }

  // ÉTAPE 2 : Paires AV+AR (équilibre CG)
  console.log('Etape 2: Paires AV+AR (equilibre)...');
  const nbPairesMax = Math.min(capaciteAV, capaciteAR);
  for (let i = 0; i < nbPairesMax; i++) {
    const poidsPaire = matAV.masse + matAR.masse;

    if (reste >= poidsPaire) {
      blocsG.av.push(matAV.nom);
      blocsG.ar.push(matAR.nom);
      reste -= poidsPaire;
      console.log('  -> Paire Gauche AV+AR (reste:', reste.toFixed(1), 'g)');
    }
    if (reste >= poidsPaire) {
      blocsD.av.push(matAV.nom);
      blocsD.ar.push(matAR.nom);
      reste -= poidsPaire;
      console.log('  -> Paire Droite AV+AR (reste:', reste.toFixed(1), 'g)');
    }
    if (reste < matAV.masse && reste < matAR.masse) break;
  }

  // ÉTAPE 3 : AR seul si reste insuffisant pour une paire
  console.log('Etape 3: AR supplementaire si besoin...');
  if (reste >= matAR.masse && blocsG.ar.length < capaciteAR) {
    blocsG.ar.push(matAR.nom);
    reste -= matAR.masse;
    console.log('  -> AR Gauche +1 supplementaire (reste:', reste.toFixed(1), 'g)');
    if (reste >= matAR.masse && blocsD.ar.length < capaciteAR) {
      blocsD.ar.push(matAR.nom);
      reste -= matAR.masse;
      console.log('  -> AR Droite +1 supplementaire (reste:', reste.toFixed(1), 'g)');
    }
  }

  // ✅ Calcul CG final ABSOLU
  const masseAV = (blocsG.av.length + blocsD.av.length) * matAV.masse;
  const masseC  = (blocsG.c.length  + blocsD.c.length)  * matC.masse;
  const masseAR = (blocsG.ar.length + blocsD.ar.length) * matAR.masse;
  const masseBallastTotal = masseAV + masseC + masseAR;

  const momentTotal =
    masseVide        * config.cgVide +
    masseAV          * distanceAV +
    masseC           * distanceC +
    masseAR          * distanceAR;

  const masseTotaleFinale = masseVide + masseBallastTotal;
  const cgAbsolu = masseTotaleFinale > 0 ? momentTotal / masseTotaleFinale : config.cgVide;
  const cgDelta  = cgAbsolu - config.cgVide;

  console.log('\n=== RESULTAT TERRAIN ===');
  console.log('AV:', blocsG.av.length, 'blocs/cote ->', masseAV, 'g @ ', distanceAV, 'mm');
  console.log('C: ', blocsG.c.length,  'blocs/cote ->', masseC,  'g @ ', distanceC,  'mm');
  console.log('AR:', blocsG.ar.length, 'blocs/cote ->', masseAR, 'g @ ', distanceAR, 'mm');
  console.log('Masse ballast:', masseBallastTotal, 'g (demande:', ballastNecessaire.toFixed(1), 'g)');
  console.log('Ecart:', Math.abs(masseBallastTotal - ballastNecessaire).toFixed(1), 'g');
  console.log('CG absolu:', cgAbsolu.toFixed(2), 'mm/BA');
  console.log('CG delta: ', cgDelta.toFixed(2), 'mm vs CG0');

  console.log('\n=== SYMETRIE ===');
  ['av', 'c', 'ar'].forEach(s => {
    const g = blocsG[s].length, d = blocsD[s].length;
    console.log(`${s.toUpperCase()}: ${g === d ? 'OK' : '⚠ ASYMETRIE'} - G:${g} D:${d}`);
  });

  return {
    gauche: blocsG,
    droite: blocsD,
    totalMasse: masseBallastTotal,
    cg: cgAbsolu,    // ✅ CG absolu mm/BA
    cgDelta,         // ✅ delta vs CG0
    iterations: 1
  };
}
