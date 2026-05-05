const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Cote gauche - renverse l'affichage
c = c.replace(
  '{renderSide(bG, capHalf)}',
  '{renderSide([...bG].reverse(), capHalf)}'
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
