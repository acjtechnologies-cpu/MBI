const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Supprime le reverse() - row-reverse CSS suffit
c = c.replace('{renderSide([...bG].reverse(), capHalf)}', '{renderSide(bG, capHalf)}');

// Verifie que mi-side-l a bien row-reverse dans CSS
console.log('CSS row-reverse:', c.includes('row-reverse'));
console.log('mi-side-l classe:', c.includes('mi-side-l'));

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
