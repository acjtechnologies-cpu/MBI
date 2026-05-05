const fs = require('fs');

// 1. DashboardPilote
let f1 = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(
  'const modelOffset   = model.masse_ref_8ms ? Math.round((model.masse_ref_8ms - P4_REF_8MS) * 1000) : (parseFloat(model.offset) || 0)',
  'const modelOffset   = Math.round(((model.masse_ref_8ms || P4_REF_8MS) - P4_REF_8MS) * 1000)'
);
fs.writeFileSync(f1, c1, 'utf8');
console.log('DashboardPilote OK');

// 2. Poly4Page
let f2 = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(
  'const offsetADN   = model?.masse_ref_8ms ? (model.masse_ref_8ms - P4_REF_8MS) : 0',
  'const offsetADN   = (model?.masse_ref_8ms || P4_REF_8MS) - P4_REF_8MS'
);
fs.writeFileSync(f2, c2, 'utf8');
console.log('Poly4Page OK');
