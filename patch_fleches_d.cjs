const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// Cote D : swap — add=▼, remove=▲ (miroir de G)
c = c.replace(
  "onClick={()=>addBloc(soute.id,'D')}>{'\\u25b2'}",
  "onClick={()=>addBloc(soute.id,'D')}>{'TEMP'}"
);
c = c.replace(
  "onClick={()=>removeBloc(soute.id,'D')}>{'\\u25bc'}",
  "onClick={()=>removeBloc(soute.id,'D')}>{'\\u25b2'}"
);
c = c.replace(
  "onClick={()=>addBloc(soute.id,'D')}>{'TEMP'}",
  "onClick={()=>addBloc(soute.id,'D')}>{'\\u25bc'}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
