const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

// Trouve le dernier grid-cols-3 (vue lecture)
const idx = c.lastIndexOf('<div className="grid grid-cols-3 gap-3 text-sm">');
const endIdx = c.indexOf('</div>\n      </div>\n  }', idx);
console.log('idx:', idx, 'end:', endIdx);
const oldBlock = c.slice(idx, endIdx + '</div>'.length);
console.log('Bloc:', JSON.stringify(oldBlock.slice(0,80)));

const newBlock = `<div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center"><div className="text-gray-400">Masse vide</div><div className="text-white font-semibold">{model.masseVide}g</div></div>
          <div className="text-center"><div className="text-gray-400">CG vide</div><div className="text-white font-semibold">{model.cgVide}mm</div></div>
          <div className="text-center"><div className="text-gray-400">Surface</div><div className="text-white font-semibold">{model.surface}dm\u00b2</div></div>
          <div className="text-center" style={{borderTop:'1px solid #374151',paddingTop:6}}>
            <div className="text-gray-400" style={{fontSize:10}}>ADN 8m/s</div>
            <div style={{color:'#4ade80',fontWeight:700}}>{(model.masse_ref_8ms||3.474).toFixed(3)} kg</div>
            <div style={{fontSize:9,color:'#6b7280'}}>{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)>0?'+':''}{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)}g</div>
          </div>
        </div>`;

c = c.slice(0, idx) + newBlock + c.slice(endIdx + '</div>'.length);
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
