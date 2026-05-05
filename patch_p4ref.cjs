const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Ajoute constante P4_REF apres poly4Fallback
const anchor = 'function getMasse0m(v, p4) {';
const p4ref = 'const P4_REF_8MS = 3.474 // Poly4(8.0) reference Pike 0m K=1.00\n';
if (!c.includes('P4_REF_8MS')) c = c.replace(anchor, p4ref + anchor);

// Remplace modelOffset par offset_p4 calcule depuis masse_ref_8ms
c = c.replace(
  'const modelOffset   = parseFloat(model.offset) || 0',
  'const modelOffset   = model.masse_ref_8ms ? Math.round((model.masse_ref_8ms - P4_REF_8MS) * 1000) : (parseFloat(model.offset) || 0)'
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK - offset_p4 calcule depuis masse_ref_8ms');
