const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Reset kgManuel quand on change de tab
c = c.replace(
  "const [tab,           setTab]           = useState('calc')",
  "const [tab,           setTab_]          = useState('calc')\n  const setTab = (t) => { setTab_(t); if (t === 'calc') setKgManuel(null) }"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
