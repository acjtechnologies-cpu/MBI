const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Ajoute cgCalcBase state
c = c.replace(
  '  const [baseCfg,      setBaseCfg]      = useState(null)',
  '  const [baseCfg,      setBaseCfg]      = useState(null)\n  const [cgCalcBase,   setCgCalcBase]   = useState(null)'
);

// startEdit sauvegarde cgCalcBase
c = c.replace(
  '    setCustomSlots(slotsFromCfg(soutes, MAT_KEYS, displayCfg))\n    setBaseCfg(displayCfg)',
  '    const s = slotsFromCfg(soutes, MAT_KEYS, displayCfg)\n    setCustomSlots(s)\n    setBaseCfg(displayCfg)\n    setCgCalcBase(calcCG(model, soutes, s))'
);

// cgAff utilise cgCalcBase
c = c.replace(
  "  const cgAff    = isEditing && baseCfg ? baseCfg.cg + (cgCustom - calcCG(model, soutes, slotsFromCfg(soutes, MAT_KEYS, baseCfg))) : displayCfg?.cg ?? null",
  "  const cgAff    = isEditing && baseCfg ? baseCfg.cg + (cgCustom - cgCalcBase) : displayCfg?.cg ?? null"
);

// Reset cgCalcBase quand on quitte edition
c = c.replace(
  "{setCustomSlots(null);setBaseCfg(null)}",
  "{setCustomSlots(null);setBaseCfg(null);setCgCalcBase(null)}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
