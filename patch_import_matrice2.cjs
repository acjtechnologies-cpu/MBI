const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Import
if (!c.includes('MatriceInteractive')) {
  c = c.replace(
    "import { useModelStore } from '../../stores/modelStore'",
    "import { useModelStore } from '../../stores/modelStore'\nimport MatriceInteractive from './MatriceInteractive'"
  );
  console.log('Import ajoute');
}

// 2. Trouve TAB MATRICE
const startIdx = c.indexOf('TAB MATRICE');
const tabStart = c.lastIndexOf('\n', startIdx) + 1;

// Trouve GPS OVERLAY apres
const gpsIdx = c.indexOf('GPS OVER', startIdx);
const tabEnd = c.lastIndexOf('\n', gpsIdx) + 1;

console.log('tabStart:', tabStart, 'tabEnd:', tabEnd);
const oldBlock = c.slice(tabStart, tabEnd);
console.log('Debut:', JSON.stringify(oldBlock.slice(0, 60)));

const newBlock = `        {/* TAB MATRICE */}
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
        )}\n`;

c = c.slice(0, tabStart) + newBlock + c.slice(tabEnd);
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
