const fs = require('fs');

function fix(file) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;

  // Sequences UTF-8 mal interpretees en latin1
  const map = [
    ['\u00c3\u00a8', '\u00e8'], // è
    ['\u00c3\u00a9', '\u00e9'], // é
    ['\u00c3\u00aa', '\u00ea'], // ê
    ['\u00c3\u00a0', '\u00e0'], // à
    ['\u00c3\u00b4', '\u00f4'], // ô
    ['\u00c3\u00ba', '\u00fa'], // ú
    ['\u00c3\u00b9', '\u00f9'], // ù
    ['\u00c3\u00a2', '\u00e2'], // â
    ['\u00c3\u00ae', '\u00ee'], // î
    ['\u00c3\u00b6', '\u00f6'], // ö
    ['\u00c3\u00b3', '\u00f3'], // ó
    ['\u00c3\u00bc', '\u00fc'], // ü
    ['\u00c3\u2039', '\u00c9'], // É
    ['\u00c3\u0152', '\u00c0'], // À
    ['\u00c3\u2030', '\u00c9'], // É
    ['\u00c3\u0160', '\u00c8'], // È
    ['\u00c3\u201a', '\u00c2'], // Â
    ['\u00c3\u2018', '\u00c7'], // Ç
    ['\u00c2\u00b2', '\u00b2'], // ²
    ['\u00c2\u00b0', '\u00b0'], // °
    ['\u00c2\u00b5', '\u00b5'], // µ
    ['\u00e2\u20ac\u201d', '\u2014'], // —
    ['\u00e2\u20ac\u2122', '\u2019'], // '
    ['\u00e2\u20ac\u0153', '\u201c'], // "
    ['\u00e2\u201e\u00a2', '\u2122'], // ™
    ['\u00e2\u02c6\u2019', '\u2713'], // ✓
    ['\u00e2\u02dc\u0192', '\u221e'], // ∞
    ['\u00ce\u201d', '\u0394'], // Δ
    ['\u00cf\u2020', '\u03c1'], // ρ
    // Emojis corrompus
    ['\u00f0\u009f\u009b\u00a9\u00ef\u00b8\u008f', '\u{1f6e9}\uFE0F'], // ✈️
    ['\u00f0\u009f\u0093\u008b', '\uD83D\uDCCB'], // 📋
    ['\u00f0\u009f\u008e\u00af', '\uD83C\uDFAF'], // 🎯
    ['\u00f0\u009f\u0094\u008d', '\uD83D\uDD0D'], // 🔍
    ['\u00e2\u009c\u0085', '\u2705'], // ✅
    ['\u00e2\u009c\u008c', '\u274c'], // ❌
    ['\u00e2\u009c\u008f\u00ef\u00b8\u008f', '\u270f\uFE0F'], // ✏️
    ['\u00e2\u02c6\u009e', '\u221e'], // ∞
    // Tirets decoratifs
    ['-"\u20ac', '\u2500'],
    ['Ã\u2030DITION', '\u00c9DITION'],
    ['MOD\u00c3\u2039LE', 'MOD\u00c8LE'],
    ['Mod\u00c3\u00a8le', 'Mod\u00e8le'],
    ['mod\u00c3\u00a8le', 'mod\u00e8le'],
    ['Cr\u00c3\u00a9er', 'Cr\u00e9er'],
    ['import\u00c3\u00a9', 'import\u00e9'],
    ['Import\u00c3\u00a9', 'Import\u00e9'],
    ['import\u00c3\u00a9', 'import\u00e9'],
    ['Aucun mat\u00c3\u00a9riau', 'Aucun mat\u00e9riau'],
    ['Mat\u00c3\u00a9riaux', 'Mat\u00e9riaux'],
    ['Capacit\u00c3\u00a9', 'Capacit\u00e9'],
    ['Tungst\u00c3\u00a8ne', 'Tungst\u00e8ne'],
    ['mat\u00c3\u00a9riau', 'mat\u00e9riau'],
    ['configur\u00c3\u00a9e', 'configur\u00e9e'],
    ['Contr\u00c3\u00b4les', 'Contr\u00f4les'],
    ['D\u00c3\u00a9tection', 'D\u00e9tection'],
    ['Donn\u00c3\u00a9es', 'Donn\u00e9es'],
    ['r\u00c3\u00a9f\u00c3\u00a9rence', 'r\u00e9f\u00e9rence'],
    ['r\u00c3\u00a9f\u00c3\u00a8re', 'r\u00e9f\u00e8re'],
    ['M\u00c3\u00a9t\u00c3\u00a9o', 'M\u00e9t\u00e9o'],
    ['M\u00c3\u00a9t\u00c3\u00a9', 'M\u00e9t\u00e9'],
    ['Surface alaire (dm\u00c2\u00b2)', 'Surface alaire (dm\u00b2)'],
    ['T\u00c2\u00b0', 'T\u00b0'],
    ['\u00c2\u00b0C', '\u00b0C'],
    ['Masse \u00c3\u00a0 vide', 'Masse \u00e0 vide'],
    ['Nom du mod\u00c3\u00a8le', 'Nom du mod\u00e8le'],
    ['Masse ref 8 m/s (kg) \u00e2\u20ac\u201d', 'Masse ref 8 m/s (kg) \u2014'],
  ];

  map.forEach(([bad, good]) => {
    while (c.includes(bad)) c = c.replace(bad, good);
  });

  if (c !== orig) {
    fs.writeFileSync(file, c, 'utf8');
    console.log('FIXED: ' + file.split('\\').slice(-2).join('/'));
  } else {
    console.log('CLEAN: ' + file.split('\\').slice(-2).join('/'));
  }
}

const files = [
  'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx',
  'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx',
  'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\constants.js',
];

files.forEach(fix);
console.log('DONE');
