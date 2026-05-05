const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Ajoute constante P4_REF_8MS
if (!c.includes('P4_REF_8MS')) {
  c = c.replace('const A4 = -1.728e-4', 'const P4_REF_8MS = 3.474\nconst A4 = -1.728e-4');
}

// 2. offsetKg depuis masse_ref_8ms
c = c.replace(
  'const offsetKg    = useMemo(() => (model?.offset ?? offsetStore) / 1000, [model, offsetStore])',
  'const offsetKg    = useMemo(() => model?.masse_ref_8ms ? (model.masse_ref_8ms - P4_REF_8MS) : (model?.offset ?? offsetStore) / 1000, [model, offsetStore])'
);

// 3. Supprime P4 neutre du dataset init
c = c.replace(
  "{ label: 'P4 neutre', data: [], borderColor: 'rgba(232,234,240,0.55)',   borderWidth: 2,   pointRadius: 0,\ntension: 0.3, fill: false, order: 4 },",
  ''
);

// 4. Supprime update P4 neutre (dataset index shift)
// P4 neutre etait dataset[1], adapter si besoin apres verification

// 5. Supprime legende P4 neutre
c = c.replace(
  "{ color: 'rgba(232,234,240,0.55)', label: 'P4 neutre' },",
  ''
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
