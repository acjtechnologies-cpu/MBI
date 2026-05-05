const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Config\\ModelManager.jsx';
let c = fs.readFileSync(file, 'utf8');

const idx = c.lastIndexOf('<div className="grid grid-cols-3 gap-3 text-sm">');
const endTag = '</div>\r\n      </div>\r\n    </div>\r\n  )\r\n}\r\n\r\nfunction SouteCard';
const endIdx = c.indexOf(endTag, idx) + '</div>'.length;
const oldBlock = c.slice(idx, endIdx);
console.log('Longueur bloc:', oldBlock.length);

const newBlock = '<div className="grid grid-cols-2 gap-3 text-sm">\r\n        <div className="text-center"><div className="text-gray-400">Masse vide</div><div className="text-white font-semibold">{model.masseVide}g</div></div>\r\n        <div className="text-center"><div className="text-gray-400">CG vide</div><div className="text-white font-semibold">{model.cgVide}mm</div></div>\r\n        <div className="text-center"><div className="text-gray-400">Surface</div><div className="text-white font-semibold">{model.surface}dm\u00b2</div></div>\r\n        <div className="text-center" style={{borderTop:"1px solid #374151",paddingTop:6}}><div className="text-gray-400" style={{fontSize:10}}>ADN 8m/s</div><div style={{color:"#4ade80",fontWeight:700}}>{(model.masse_ref_8ms||3.474).toFixed(3)} kg</div><div style={{fontSize:9,color:"#6b7280"}}>{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)>0?"+":""}{Math.round(((model.masse_ref_8ms||3.474)-3.474)*1000)}g vs Pike</div></div>\r\n      </div>';

c = c.slice(0, idx) + newBlock + c.slice(endIdx);
fs.writeFileSync(file, c, 'utf8');
console.log('OK');
