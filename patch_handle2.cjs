const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Poly4\\Poly4Page.jsx';
let c = fs.readFileSync(file, 'utf8');

const old = "if (mode === 'vent') {\r\n      const next = Math.max(4.0, Math.min(15.5, vent + dir * 0.5))\r\n      setParam('vent', Math.round(next * 10) / 10)\r\n  } else {\r\n  const nextIdx = (siteIdx + dir + sites.length) % sites.length\r\n  setSiteIdx(nextIdx)\r\n  setApplied(false)\r\n  if (typeof setActiveSite === 'function') {\r\n    const nextSite = sites[nextIdx]\r\n    setActiveSite({ name: nextSite.name, irp: nextSite.irp, k: nextSite.k })\r\n  }\r\n}";

const rep = "if (mode === 'vent') {\r\n      const next = Math.max(4.0, Math.min(15.5, vent + dir * 0.5))\r\n      setParam('vent', Math.round(next * 10) / 10)\r\n    } else if (mode === 'offset') {\r\n      setOffset(Math.max(-500, Math.min(500, offsetStore + dir * 42)))\r\n    } else {\r\n      const nextIdx = (siteIdx + dir + sites.length) % sites.length\r\n      setSiteIdx(nextIdx)\r\n      setApplied(false)\r\n      if (typeof setActiveSite === 'function') {\r\n        const nextSite = sites[nextIdx]\r\n        setActiveSite({ name: nextSite.name, irp: nextSite.irp, k: nextSite.k })\r\n      }\r\n    }";

if (c.includes(old)) {
  c = c.replace(old, rep);
  console.log('OK');
} else {
  console.log('ERREUR non trouve');
}
fs.writeFileSync(file, c, 'utf8');
