const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Ajoute setOffset dans les stores
c = c.replace(
  'const setParam      = useAppStore(s => s.setParam)',
  'const setParam      = useAppStore(s => s.setParam)\n  const setOffset     = useAppStore(s => s.setOffset)'
);

// 2. Separe offsetADN et offsetTerrain
c = c.replace(
  'const offsetKg    = useMemo(() => model?.masse_ref_8ms ? (model.masse_ref_8ms - P4_REF_8MS) : (model?.offset ?? offsetStore) / 1000, [model, offsetStore])',
  'const offsetADN   = model?.masse_ref_8ms ? (model.masse_ref_8ms - P4_REF_8MS) : 0\n  const offsetTerrain = offsetStore / 1000\n  const offsetKg    = offsetADN + offsetTerrain'
);

// 3. Courbe bleue utilise offsetADN seulement (pas offsetTerrain)
c = c.replace(
  'adaptive: V_RANGE.map(v => poly4(v) * rho * kPente + offsetKg)',
  'adaptive: V_RANGE.map(v => poly4(v) * rho * kPente + offsetADN)'
);

// 4. Point rouge utilise offsetKg complet (ADN + terrain)
// massePt deja correct avec offsetKg

// 5. Ajoute mode offset dans handleChange
c = c.replace(
  "} else {\n    const nextIdx = (siteIdx + dir + sites.length) % sites.length",
  "} else if (mode === 'offset') {\n      setOffset(Math.max(-500, Math.min(500, offsetStore + dir * 42)))\n    } else {\n    const nextIdx = (siteIdx + dir + sites.length) % sites.length"
);

// 6. Ajoute tab offset dans le UI
c = c.replace(
  "{ id: 'kpente', label: 'K Pente', val: kPente.toFixed(3) },",
  "{ id: 'kpente', label: 'K Pente', val: kPente.toFixed(3) },\n              { id: 'offset', label: 'Offset', val: (offsetStore >= 0 ? '+' : '') + offsetStore + 'g' },"
);

// 7. Ajoute offsetTerrain et offsetADN dans deps handleChange
c = c.replace(
  "}, [mode, vent, sites.length, setParam])",
  "}, [mode, vent, sites.length, setParam, offsetStore, setOffset])"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK - offset terrain separe ADN - mode offset ajoute');
