const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

// Trouve le grid-cols-3 de la vue lecture (unique)
const idx = c.lastIndexOf('grid grid-cols-3 gap-3 text-sm');
if (idx === -1) { console.log('non trouve'); process.exit(1); }

const divStart = c.lastIndexOf('<div', idx);
const divEnd = c.indexOf('</div>', c.indexOf('</div>', c.indexOf('</div>', c.indexOf('</div>', divStart) + 1) + 1) + 1) + 6;

console.log('Bloc:', JSON.stringify(c.slice(divStart, divEnd).slice(0, 80)));

const newBlock = `<div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center"><div className="text-gray-400">Masse vide</div><div className="text-white font-semibold">{model.masseVide}g</div></div>
          <div className="text-center"><div className="text-gray-400">CG / Surface</div><div className="text-white font-semibold">{model.cgVide}mm · {model.surface}dm²</div></div>
          <div className="col-span-2 text-center" style={{borderTop:'1px solid #374151',paddingTop:6,marginTop:2}}>
            <div className="text-gray-400" style={{fontSize:10}}>ADN planeur — Masse 8m/s</div>
            <div style={{color:'#4ade80',fontWeight:700,fontSize:16}}>{(model.masse_ref_8ms||3.474).toFixed(3)} kg</div>
            <div style={{fontSize:9,color:'#6b7280'}}>{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)>0?'+':''}{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)}g vs Pike ref</div>
          </div>
        </div>`;

c = c.slice(0, divStart) + newBlock + c.slice(divEnd);
fs.writeFileSync(file, c, 'utf8');

const lines = c.split('\n').length;
console.log('Lignes apres patch:', lines);
console.log('OK');
