const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Ajoute row-reverse dans CSS pour cote gauche
c = c.replace(
  '.mi-side{display:flex;gap:2px;padding:2px;border-radius:6px;flex:1;height:9vh;max-height:70px;min-height:48px}',
  '.mi-side{display:flex;gap:2px;padding:2px;border-radius:6px;flex:1;height:9vh;max-height:70px;min-height:48px}.mi-side-l{flex-direction:row-reverse}'
);

// Ajoute mi-side-l sur le cote gauche
c = c.replace(
  "className=\"mi-side\">\n                    {renderSide(bG, capHalf)}",
  "className=\"mi-side mi-side-l\">\n                    {renderSide(bG, capHalf)}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
