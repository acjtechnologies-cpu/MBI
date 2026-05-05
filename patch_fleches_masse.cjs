const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Swap fleches — ▼ remove en bas, ▲ add en haut → inverser ordre
c = c.replace(
  "                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'G')}>{\'\\u25bc\'}</button>\n                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bG.length}{\'\\u00d7\'}{mat.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'G')}>{\'\\u25b2\'}</button>",
  "                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'G')}>{\'\\u25b2\'}</button>\n                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bG.length}{\'\\u00d7\'}{bG[0]?.masse||mat.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'G')}>{\'\\u25bc\'}</button>"
);

c = c.replace(
  "                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'D')}>{\'\\u25bc\'}</button>\n                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bD.length}{\'\\u00d7\'}{mat.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'D')}>{\'\\u25b2\'}</button>",
  "                    <button style={NAV_BTN} onClick={()=>addBloc(soute.id,'D')}>{\'\\u25b2\'}</button>\n                    <div style={{flex:1, textAlign:'center', fontSize:9, color:'#8b949e'}}>{bD.length}{\'\\u00d7\'}{bD[0]?.masse||mat.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'D')}>{\'\\u25bc\'}</button>"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
