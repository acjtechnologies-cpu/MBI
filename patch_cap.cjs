const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Capacite = soute.capacite par demi-soute (pas divisee par 2)
c = c.replace(
  'const capHalf = Math.ceil((soute.capacite || 6) / 2)',
  'const capHalf = soute.capacite || 5'
);

// Fix ordre gauche - cherche la classe actuelle
const idx = c.indexOf('mi-side mi-side-l');
console.log('mi-side-l trouve:', idx !== -1);
if (idx === -1) {
  // Cherche le cote gauche et ajoute mi-side-l
  c = c.replace(
    'className="mi-side">\n                    {renderSide(bG, capHalf)}',
    'className="mi-side mi-side-l">\n                    {renderSide(bG, capHalf)}'
  );
}

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
