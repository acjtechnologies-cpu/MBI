const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

const fixes = [
  ['\u00f0\u009f\u009b\u00a9\u00ef\u00b8\u008f', '\uD83D\uDEE9\uFE0F'], // ✈️ petit avion
  ['\u00f0\u009f\u009b\u00a9', '\uD83D\uDEE9'],
  ['\u00f0\u009f\u0093\u008b', '\uD83D\uDCCB'], // 📋
  ['\u00f0\u009f\u008e\u00af', '\uD83C\uDFAF'], // 🎯
  ['\u00f0\u009f\u0094\u00a6', '\uD83D\uDCE6'], // 📦
  ['\u00e2\u009c\u0085', '\u2705'],              // ✅
  ['\u00e2\u008c', '\u274c'],                    // ❌
  ['\u00e2\u009c\u0088\u00ef\u00b8\u008f', '\u2708\uFE0F'], // ✈️
  ['\u00e2\u009c\u008f\u00ef\u00b8\u008f', '\u270f\uFE0F'], // ✏️
  ['\u00e2\u02c6\u009e', '\u221e'],              // ∞
  ['\u00e2\u02c6\u009e', '\u221e'],
  ['MOD\u00c3\u2039LE', 'MOD\u00c8LE'],
  ['MOD\u00c3\u0160LE', 'MOD\u00c8LE'],
  ['MOD\u00c3\u2039LE ACTIF', 'MOD\u00c8LE ACTIF'],
  ['EDITION MOD\u00c3\u2039LE', '\u00c9DITION MOD\u00c8LE'],
];

fixes.forEach(([bad, good]) => { while(c.includes(bad)) c = c.replace(bad, good); });

fs.writeFileSync(file, c, 'utf8');

// Scan restant
c.split('\n').forEach((l,i) => {
  if (/[\u00c3\u00c2\u00ce\u00f0\u00e2]/.test(l))
    console.log(i+':', JSON.stringify(l.trim().slice(0,100)));
});
console.log('OK');
