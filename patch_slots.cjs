const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Remplace renderSlots pour gerer G et D separement
const oldFn = `  function renderSlots(souteIdx, cap, row) {
    const matKey = MAT_KEYS[souteIdx] || 'av'
    const b      = row ? (row[matKey] || {}) : {}
    const G      = b.G, D = b.D
    const slots  = []
    if (isNewFormat(G)) {
      const all = [...(G || []), ...(D || [])]
      for (let i = 0; i < cap; i++) {
        slots.push(<div key={i} className={\`mb-m-slot\${i < all.length ? ' ' + matClsFromNom(all[i]?.nom) : ''}\`} />)
      }
    } else {
      const nom = b.matG || ''
      const n   = (b.G || 0) + (b.D || 0)
      for (let i = 0; i < cap; i++) {
        slots.push(<div key={i} className={\`mb-m-slot\${i < n ? ' ' + matClsFromNom(nom) : ''}\`} />)
      }
    }
    return slots
  }`;

const newFn = `  function renderSide(side, nom, cap) {
    const slots = []
    if (isNewFormat(side)) {
      for (let i = 0; i < cap; i++)
        slots.push(<div key={i} className={\`mb-m-slot\${i < side.length ? ' ' + matClsFromNom(side[i]?.nom) : ''}\`} />)
    } else {
      const n = side || 0
      for (let i = 0; i < cap; i++)
        slots.push(<div key={i} className={\`mb-m-slot\${i < n ? ' ' + matClsFromNom(nom) : ''}\`} />)
    }
    return slots
  }

  function getSides(souteIdx, row) {
    const matKey = MAT_KEYS[souteIdx] || 'av'
    const b = row ? (row[matKey] || {}) : {}
    const capG = isNewFormat(b.G) ? (b.G||[]).length : (b.G||0)
    const capD = isNewFormat(b.D) ? (b.D||[]).length : (b.D||0)
    const cap  = Math.max(capG, capD, 3)
    return { G: b.G, D: b.D, nomG: b.matG||'', nomD: b.matD||'', cap }
  }`;

c = c.replace(oldFn, newFn);

// Remplace le rendu des deux sides dans le JSX
c = c.replace(
  `              <div className="mb-m-side mb-m-side-l" style={{ border: \`1.5px solid \${col.border}\` }}>
                  {isHors ? renderCustomSlots(idx, Math.ceil(cap/2), soute.id) : renderSlots(idx, Math.ceil(cap/2), displayCfg)}
                </div>
                <div className="mb-m-side" style={{ border: \`1.5px solid \${col.border}\` }}>
                  {isHors ? renderCustomSlots(idx, Math.floor(cap/2), soute.id) : renderSlots(idx, Math.floor(cap/2), displayCfg)}
                </div>`,
  `              {(() => {
                  const sides = getSides(idx, displayCfg)
                  const blocs = customSlots?.[soute.id] || []
                  const half  = Math.ceil(blocs.length / 2)
                  return (<>
                    <div className="mb-m-side mb-m-side-l" style={{ border: \`1.5px solid \${col.border}\` }}>
                      {isHors ? blocs.slice(0,half).map((b,i)=><div key={i} className={\`mb-m-slot \${matClsFromNom(b.nom)}\`}/>) : renderSide(sides.G, sides.nomG, sides.cap)}
                    </div>
                    <div className="mb-m-side" style={{ border: \`1.5px solid \${col.border}\` }}>
                      {isHors ? blocs.slice(half).map((b,i)=><div key={i} className={\`mb-m-slot \${matClsFromNom(b.nom)}\`}/>) : renderSide(sides.D, sides.nomD, sides.cap)}
                    </div>
                  </>)
                })()}`
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
