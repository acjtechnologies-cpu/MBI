const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Import
c = c.replace(
  "import { useModelStore } from '../../stores/modelStore'",
  "import { useModelStore } from '../../stores/modelStore'\nimport MatriceInteractive from './MatriceInteractive'"
);

// 2. State cfgAppliquee apres matrixIdx
c = c.replace(
  "const [matrixIdx,     setMatrixIdx]     = useState(null)",
  "const [matrixIdx,     setMatrixIdx]     = useState(null)\n  const [cfgAppliquee,  setCfgAppliquee]  = useState(null)"
);

// 3. targetG utilise cfgAppliquee
c = c.replace(
  "  const targetG       = kgManuel !== null\r\n    ? Math.max(model.masseVide, Math.round(kgManuel * 1000))\r\n    : targetGAuto",
  "  const targetG       = cfgAppliquee !== null\r\n    ? cfgAppliquee\r\n    : kgManuel !== null\r\n    ? Math.max(model.masseVide, Math.round(kgManuel * 1000))\r\n    : targetGAuto"
);

// 4. Reset cfgAppliquee quand vent change
c = c.replace(
  "  useEffect(() => {\r\n    if (tab === 'matrix' && ci >= 0) setMatrixIdx(ci)\r\n  }, [tab, ci])",
  "  useEffect(() => {\r\n    if (tab === 'matrix' && ci >= 0) setMatrixIdx(ci)\r\n  }, [tab, ci])\r\n\r\n  useEffect(() => { setCfgAppliquee(null) }, [params.vent])"
);

// 5. Remplace TAB MATRICE
const startIdx = c.indexOf('TAB MATRICE');
const tabStart = c.lastIndexOf('\n', startIdx) + 1;
const gpsIdx   = c.indexOf('GPS OVER', startIdx);
const tabEnd   = c.lastIndexOf('\n', gpsIdx) + 1;

const newTab = `        {/* TAB MATRICE */}
        {tab === 'matrix' && matrix.length > 0 && (
          <MatriceInteractive
            model={model}
            soutes={soutes}
            matrix={matrix}
            MAT_KEYS={MAT_KEYS}
            ci={ci}
            targetGAuto={targetGAuto}
            onAppliquer={(masse) => { setCfgAppliquee(masse); setTab('calc') }}
          />
        )}\n`;

c = c.slice(0, tabStart) + newTab + c.slice(tabEnd);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
