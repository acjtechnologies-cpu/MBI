const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\MatriceInteractive.jsx';
let c = fs.readFileSync(file, 'utf8');

// addBloc - prend le dernier bloc du baseSlots comme reference
c = c.replace(
  `  function addBloc(souteId, side) {
    const s = soutes.find(x => x.id === souteId)
    const existing = customSlots[souteId]?.[side] || []
    const mat = existing.length > 0 ? existing[existing.length-1] : (s?.materiaux?.[0] || {nom:'Laiton', masse:71})`,
  `  function addBloc(souteId, side) {
    const s = soutes.find(x => x.id === souteId)
    const base = baseSlots?.[souteId]?.[side] || []
    const mat = base.length > 0 ? base[base.length-1] : (s?.materiaux?.[0] || {nom:'Laiton', masse:71})`
);

// Affichage — masse du bloc de reference depuis baseSlots
c = c.replace(
  "const mat = soute.materiaux?.slice().sort((a,b)=>(b.stock||0)-(a.stock||0))[0] || {nom:'Laiton', masse:71}",
  "const matG = baseSlots?.[soute.id]?.G?.slice(-1)[0] || soute.materiaux?.[0] || {nom:'Laiton', masse:71}\n          const matD = baseSlots?.[soute.id]?.D?.slice(-1)[0] || soute.materiaux?.[0] || {nom:'Laiton', masse:71}\n          const mat = matG"
);

// Fix affichage G et D separement
c = c.replace(
  "{bG.length}{'\\u00d7'}{mat.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'G')}",
  "{bG.length}{'\\u00d7'}{matG.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'G')}"
);
c = c.replace(
  "{bD.length}{'\\u00d7'}{mat.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'D')}",
  "{bD.length}{'\\u00d7'}{matD.masse}g</div>\n                    <button style={NAV_BTN} onClick={()=>removeBloc(soute.id,'D')}"
);

fs.writeFileSync(file, c, 'utf8');
console.log('OK');
