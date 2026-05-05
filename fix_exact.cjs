const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

const fixes = [
  ['\u00f0\u0178\u203a\u00a9\u00ef\u00b8\u008f', '\uD83D\uDEE9\uFE0F'], // ✈️
  ['\u00f0\u0178\u201c\u2039', '\uD83D\uDCCB'],  // 📋
  ['\u00f0\u0178\u017d\u00af', '\uD83C\uDFAF'],  // 🎯
  ['\u00f0\u0178\u201c\u00a6', '\uD83D\uDCE6'],  // 📦
  ['\u00e2\u0153\u2026', '\u2705'],               // ✅
  ['\u00e2\u009d\u0152', '\u274c'],               // ❌
  ['\u00e2\u0153\u02c6\u00ef\u00b8\u008f', '\u2708\uFE0F'], // ✈️
  ['\u00e2\u0153\u008f\u00ef\u00b8\u008f', '\u270f\uFE0F'], // ✏️
  ['\u00e2\u02c6\u017e', '\u221e'],               // ∞
  ['\u00c3\u02c6', '\u00c8'],                     // È (MODèLE)
];

fixes.forEach(([bad, good]) => { while(c.includes(bad)) c = c.replace(bad, good); });

fs.writeFileSync(file, c, 'utf8');

// Scan restant
let remaining = 0;
c.split('\n').forEach((l,i) => {
  if (/[\u00c3\u00c2\u00ce\u00f0\u00e2]/.test(l)) {
    console.log(i+':', JSON.stringify(l.trim().slice(0,100)));
    remaining++;
  }
});
console.log(remaining === 0 ? 'CLEAN' : remaining + ' lignes restantes');
