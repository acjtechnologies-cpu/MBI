const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// CSS - mi-side-l = row-reverse comme mb-m-side-l
c = c.replace(
  '.mi-side-l{flex-direction:row-reverse}',
  '.mi-side-l{flex-direction:row-reverse}'
);

// renderSide - les slots vides en premier pour cote gauche
// Pour cote G : blocs remplis a droite (index from end)
// Remplace renderSide dans le cote gauche par renderSideG

const oldRenderFn = `  function renderSide(blocs, cap) {
    return Array.from({ length: cap }).map((_, i) => (
      <div key={i} className={\`mi-slot\${i < blocs.length ? ' ' + matCls(blocs[i]?.nom) : ''}\`} />
    ))
  }`;

const newRenderFn = `  function renderSide(blocs, cap, reverse = false) {
    const arr = Array.from({ length: cap }).map((_, i) => {
      const bi = reverse ? (cap - 1 - i) : i
      return <div key={i} className={\`mi-slot\${bi < blocs.length ? ' ' + matCls(blocs[bi]?.nom) : ''}\`} />
    })
    return arr
  }`;

c = c.replace(oldRenderFn, newRenderFn);

// Cote gauche passe reverse=true
c = c.replace(
  '{renderSide(bG, capHalf)}',
  '{renderSide(bG, capHalf, true)}'
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
