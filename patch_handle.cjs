const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

const oldHandle = `    if (mode === 'vent') {
        const next = Math.max(4.0, Math.min(15.5, vent + dir * 0.5))
        setParam('vent', Math.round(next * 10) / 10)
    } else {
  const nextIdx = (siteIdx + dir + sites.length) % sites.length
  setSiteIdx(nextIdx)
  setApplied(false)
  if (typeof setActiveSite === 'function') {
    const nextSite = sites[nextIdx]
    setActiveSite({ name: nextSite.name, irp: nextSite.irp, k: nextSite.k })
  }
}`;

const newHandle = `    if (mode === 'vent') {
      const next = Math.max(4.0, Math.min(15.5, vent + dir * 0.5))
      setParam('vent', Math.round(next * 10) / 10)
    } else if (mode === 'offset') {
      setOffset(Math.max(-500, Math.min(500, offsetStore + dir * 42)))
    } else {
      const nextIdx = (siteIdx + dir + sites.length) % sites.length
      setSiteIdx(nextIdx)
      setApplied(false)
      if (typeof setActiveSite === 'function') {
        const nextSite = sites[nextIdx]
        setActiveSite({ name: nextSite.name, irp: nextSite.irp, k: nextSite.k })
      }
    }`;

if (c.includes(oldHandle)) {
  c = c.replace(oldHandle, newHandle);
  console.log('OK - handleChange corrige');
} else {
  // Cherche la structure existante
  const idx = c.indexOf("if (mode === 'vent')");
  console.log('handleChange idx:', idx);
  console.log('Contexte:', JSON.stringify(c.slice(idx, idx + 300)));
}
fs.writeFileSync(file, c, 'utf8');
