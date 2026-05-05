const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// targetG utilise toujours targetGAuto sauf si selectedParam === kg
c = c.replace(
  "  const targetG       = kgManuel !== null\r\n    ? Math.max(model.masseVide, Math.round(kgManuel * 1000))\r\n    : targetGAuto",
  "  const targetG       = (kgManuel !== null && selectedParam === 'kg')\r\n    ? Math.max(model.masseVide, Math.round(kgManuel * 1000))\r\n    : targetGAuto"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
