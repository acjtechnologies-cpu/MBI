const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

const old = `<div className="grid grid-cols-3 gap-3 text-sm">
>         <div className="text-center"><div className="text-gray-400">Masse vide</div><div className="text-white
font-semibold">{model.masseVide}g</div></div>
>         <div className="text-center"><div className="text-gray-400">CG vide</div><div className="text-white
font-semibold">{model.cgVide}mm</div></div>
>         <div className="text-center"><div className="text-gray-400">Surface</div><div className="text-white
font-semibold">{model.surface}dm\u00b2</div></div>
        </div>`;

// Cherche le bloc grid-cols-3 dans la vue lecture
const idx = c.indexOf('<div className="grid grid-cols-3 gap-3 text-sm">');
const endIdx = c.indexOf('</div>\n      </div>\n  }', idx) + '</div>\n      </div>'.length;
const oldBlock = c.slice(idx, endIdx);
console.log('Bloc trouve:', oldBlock.slice(0, 60));

const newBlock = `<div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center"><div className="text-gray-400">Masse vide</div><div className="text-white font-semibold">{model.masseVide}g</div></div>
          <div className="text-center"><div className="text-gray-400">CG vide</div><div className="text-white font-semibold">{model.cgVide}mm</div></div>
          <div className="text-center"><div className="text-gray-400">Surface</div><div className="text-white font-semibold">{model.surface}dm\u00b2</div></div>
          <div className="text-center col-span-1" style={{borderTop:'1px solid #374151',paddingTop:6,marginTop:2}}>
            <div className="text-gray-400" style={{fontSize:10}}>ADN \u2014 Masse 8m/s</div>
            <div style={{color:'#4ade80',fontWeight:700}}>{model.masse_ref_8ms ? model.masse_ref_8ms.toFixed(3) : '3.474'} kg</div>
            <div style={{fontSize:9,color:'#6b7280'}}>{model.masse_ref_8ms ? (Math.round((model.masse_ref_8ms-3.474)*1000)>0?'+':'')+Math.round((model.masse_ref_8ms-3.474)*1000)+'g vs Pike' : 'r\u00e9f Pike'}</div>
          </div>
        </div>`;

c = c.slice(0, idx) + newBlock + c.slice(endIdx);
fs.writeFileSync(file, c, 'utf8');
console.log('OK - masse_ref_8ms visible en lecture');
