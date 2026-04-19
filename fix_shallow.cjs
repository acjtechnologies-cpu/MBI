
const fs = require('fs');
let c = fs.readFileSync('src/components/Pilote/DashboardPilote.jsx', 'utf8');

c = c.replace(
  "import { useAppStore } from '../../stores/appStore'",
  "import { useAppStore } from '../../stores/appStore'\nimport { useShallow } from 'zustand/react/shallow'"
);

c = c.replace(
  /const store = useAppStore[\s\S]*?(?=\n  const \{)/,
  "const store = useAppStore(useShallow(s => ({params:s.params,altitude:s.altitude,offset:s.offset,k_up:s.k_up,alpha:s.alpha,activeSite:s.activeSite,selectedParam:s.selectedParam,setParam:s.setParam,setOffset:s.setOffset,setAltitude:s.setAltitude,selectParam:s.selectParam,setBallastSnap:s.setBallastSnap,incrementParam:s.incrementParam,decrementParam:s.decrementParam})))\n"
);

fs.writeFileSync('src/components/Pilote/DashboardPilote.jsx', c, 'utf8');
console.log('OK - useShallow applique');
