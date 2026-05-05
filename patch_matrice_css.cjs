const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

const css = `
const CSS_MAT = \`
.mi-side{display:flex;gap:2px;padding:2px;border-radius:6px;flex:1;height:9vh;max-height:70px;min-height:48px}
.mi-slot{flex:1;border-radius:3px;background:rgba(255,255,255,.04);border:1px solid #1e2530}
.mi-slot.l{background:linear-gradient(135deg,#c8a030,#e8b840);border-color:transparent}
.mi-slot.p{background:linear-gradient(135deg,#708090,#8a9aaa);border-color:transparent}
.mi-slot.t{background:linear-gradient(135deg,#2255aa,#3377cc);border-color:transparent}
\`;
`;

// Insere apres les imports
c = c.replace(
  "// ── Helpers ──────────────────────────────────────────────────────────────────",
  css + "\n// ── Helpers ──────────────────────────────────────────────────────────────────"
);

// Ajoute style tag dans le return
c = c.replace(
  "    <div className=\"mb-matrix\">",
  "    <><style>{CSS_MAT}</style>\n      <div className=\"mb-matrix\">"
);

// Ferme le fragment
c = c.replace(
  "    </div>\n  )\n}",
  "    </div>\n    </>\n  )\n}"
);

// Remplace mb-m-side par mi-side et mb-m-slot par mi-slot
c = c.replace(/mb-m-side mb-m-side-l/g, 'mi-side');
c = c.replace(/mb-m-side(?! mb)/g, 'mi-side');
c = c.replace(/mb-m-slot/g, 'mi-slot');

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
