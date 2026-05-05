const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// cgDelta → utilise deltaCG qui existe deja + cgDelta comme alias
c = c.replace(
  '  const deltaCG   = cgAff !== null ? cgAff - model.cgVide : 0',
  '  const deltaCG   = cgAff !== null ? cgAff - model.cgVide : 0\n  const cgDelta   = isEditing && baseCfg ? cgAff - baseCfg.cg : 0'
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
