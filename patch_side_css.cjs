const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Les sides ont besoin de display:flex gap:2px
c = c.replace(
  "className=\"mb-m-side mb-m-side-l\" style={{ border:`1.5px solid ${col.border}`, height:'9vh', maxHeight:70 }}",
  "className=\"mb-m-side mb-m-side-l\" style={{ border:`1.5px solid ${col.border}`, height:'9vh', maxHeight:70, display:'flex', gap:2, padding:2 }}"
);
c = c.replace(
  "className=\"mb-m-side\" style={{ border:`1.5px solid ${col.border}`, height:'9vh', maxHeight:70 }}",
  "className=\"mb-m-side\" style={{ border:`1.5px solid ${col.border}`, height:'9vh', maxHeight:70, display:'flex', gap:2, padding:2 }}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
