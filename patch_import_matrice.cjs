const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Ajoute import
c = c.replace(
  "import { useModelStore } from '../../stores/modelStore'",
  "import { useModelStore } from '../../stores/modelStore'\nimport MatriceInteractive from './MatriceInteractive'"
);

// 2. Remplace TAB MATRICE
const oldTab = "        {/* -\" TAB MATRICE -\" */}\r\n        {tab === 'matrix' && matrix.length > 0 && (";
const newTab = `        {/* TAB MATRICE */}
        {tab === 'matrix' && matrix.length > 0 && (
          <MatriceInteractive
            model={model}
            soutes={soutes}
            matrix={matrix}
            MAT_KEYS={MAT_KEYS}
            ci={ci}
            targetG={targetG}
            setOffset={setOffset}
            offsetVal={offsetVal}
          />
        )}
        {false && (`;

if (c.includes(oldTab)) {
  // Trouve la fin du tab matrice
  const startIdx = c.indexOf(oldTab);
  const endMarker = "\r\n        {/* -\" GPS OVER";
  const endIdx = c.indexOf(endMarker, startIdx);
  c = c.slice(0, startIdx) + newTab + c.slice(endIdx);
  console.log('OK - TAB MATRICE remplace');
} else {
  console.log('ERREUR - TAB non trouve');
}

fs.writeFileSync(file, c, 'utf8');
