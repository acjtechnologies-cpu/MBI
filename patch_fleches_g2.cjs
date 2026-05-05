const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Remet G : ▲ add en haut, ▼ remove en bas
c = c.replace(
  "onClick={()=>addBloc(soute.id,'G')}>{\'\\u25bc\'}",
  "onClick={()=>addBloc(soute.id,'G')}>{\'\\u25b2\'}"
);
c = c.replace(
  "onClick={()=>removeBloc(soute.id,'G')}>{\'\\u25b2\'}",
  "onClick={()=>removeBloc(soute.id,'G')}>{\'\\u25bc\'}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
