const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

// Emojis corrompus restants
c = c.replace(/\u00e2\u009c\u0085/g, '\u2705');   // ✅
c = c.replace(/\u00e2\u008c/g, '\u274c');          // ❌
c = c.replace(/\u00e2\u009c\u0088\u00ef\u00b8\u008f/g, '\u2708\uFE0F'); // ✈️
c = c.replace(/\u00e2\u009c\u008f\u00ef\u00b8\u008f/g, '\u270f\uFE0F'); // ✏️
c = c.replace(/\u00e2\u02c6\u009e/g, '\u221e');    // ∞

// MODèLE corrompu
c = c.replace(/MOD\u00c3\u2039LE/g, 'MOD\u00c8LE');
c = c.replace(/MOD\u00c3\u0160LE/g, 'MOD\u00c8LE');

// Cherche patterns restants
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (/[\u00c3\u00c2\u00ce\u00f0\u00e2]/.test(l)) {
    console.log(i + ': ' + JSON.stringify(l.trim().slice(0, 100)));
  }
});

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
