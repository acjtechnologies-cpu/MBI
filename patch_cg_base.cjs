const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Ajoute baseCfg pour comparer
c = c.replace(
  "  const [customSlots, setCustomSlots] = useState(null)",
  "  const [customSlots, setCustomSlots] = useState(null)\n  const [baseCfg,      setBaseCfg]      = useState(null)"
);

// startEdit sauvegarde la config de base
c = c.replace(
  "  function startEdit() {\n    if (displayCfg) setCustomSlots(slotsFromCfg(soutes, MAT_KEYS, displayCfg))\n  }",
  "  function startEdit() {\n    if (!displayCfg) return\n    const s = slotsFromCfg(soutes, MAT_KEYS, displayCfg)\n    setCustomSlots(s)\n    setBaseCfg(displayCfg)\n  }"
);

// cgAff utilise le CG matrice si pas de modification
c = c.replace(
  "  const cgAff    = isEditing ? cgCustom    : displayCfg?.cg ?? null",
  "  const cgAff    = isEditing ? (baseCfg && masseCustom === baseCfg.m ? baseCfg.cg : cgCustom) : displayCfg?.cg ?? null"
);

// Reset baseCfg quand on quitte edition
c = c.replace(
  "onClick={()=>setCustomSlots(null)}",
  "onClick={()=>{ setCustomSlots(null); setBaseCfg(null) }}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
