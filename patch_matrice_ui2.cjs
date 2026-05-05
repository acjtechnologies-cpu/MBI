const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

const startMarker = 'displayCfg && (\r\n                <div className="mb-m-info">';
const idx = c.indexOf(startMarker);
if (idx === -1) { console.log('ERREUR start'); process.exit(1); }

// Trouve la fin du bloc (apres le dernier </div> du mb-m-info)
const blockStart = idx - 14; // inclut {
const endMarker = '              )}\r\n            </div>\r\n          </div>\r\n        )}\r\n      </>'; 
const endIdx = c.indexOf(endMarker, idx);
if (endIdx === -1) { console.log('ERREUR end'); process.exit(1); }
const blockEnd = endIdx;

console.log('Bloc longueur:', blockEnd - blockStart);

const newFooter = `{/* Boutons +/- par soute */}
              {customSlots && soutes.map((soute, idx2) => {
                const mat = soute.materiaux?.[0] || { nom:'Laiton', masse:71 }
                const blocs = customSlots[soute.id] || []
                const cols = ['rgba(255,200,80,.9)','rgba(100,170,255,.9)','rgba(63,185,80,.9)']
                return (
                  <div key={soute.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 4px', background:'rgba(255,255,255,.03)', borderRadius:8, flexShrink:0 }}>
                    <div style={{ fontSize:10, color:cols[idx2]||cols[0], fontWeight:700, minWidth:70 }}>{soute.nom}</div>
                    <button onClick={() => removeBloc(soute.id)} style={{ width:32, height:32, borderRadius:6, border:'1px solid #444', background:'#1c2128', color:'#fff', fontSize:18, cursor:'pointer', touchAction:'manipulation' }}>-</button>
                    <div style={{ flex:1, textAlign:'center', fontSize:11, color:'#8b949e' }}>
                      {blocs.length} \xd7 {mat.masse}g = {blocs.reduce((s,b)=>s+b.masse,0)}g
                    </div>
                    <button onClick={() => blocs.length < soute.capacite && addBloc(soute.id, mat)} style={{ width:32, height:32, borderRadius:6, border:'1px solid #444', background:'#1c2128', color:'#fff', fontSize:18, cursor:'pointer', touchAction:'manipulation' }}>+</button>
                  </div>
                )
              })}
              <div className="mb-m-info" style={{ flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:900, color:'#3fb950' }}>
                      {isHorsMatrice ? (masseCustom/1000).toFixed(3) : displayCfg ? (displayCfg.m/1000).toFixed(3) : '-'} kg
                    </div>
                    <div style={{ fontSize:9, color:'#8b949e' }}>
                      {isHorsMatrice ? <span style={{color:'#f0a500'}}>\u26a0 Hors matrice</span> : displayCfg ? \`cfg #\${displayCfg.n}\` : '-'}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:18, fontWeight:900, color:'#58a6ff' }}>
                      {isHorsMatrice ? cgCustom?.toFixed(1) : displayCfg ? displayCfg.cg.toFixed(1) : '-'} mm
                    </div>
                    <div style={{ fontSize:9, color:'#8b949e' }}>CG</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, width:'100%' }}>
                  {displayCfg && !customSlots && (
                    <button onClick={() => initFromCfg(displayCfg)} style={{ flex:1, height:36, background:'#1a3a5a', border:'1px solid #1a73e8', borderRadius:8, color:'#60a5fa', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation' }}>
                      \u270f\ufe0f \u00c9diter
                    </button>
                  )}
                  {customSlots && (
                    <button onClick={() => setCustomSlots(null)} style={{ width:36, height:36, background:'#1c2128', border:'1px solid #444', borderRadius:8, color:'#8b949e', fontSize:12, cursor:'pointer', touchAction:'manipulation' }}>
                      \u2715
                    </button>
                  )}
                  {(displayCfg || customSlots) && (
                    <button onClick={() => { const m = isHorsMatrice ? masseCustom : displayCfg.m; setKgManuel(m/1000); setTab('calc'); }} style={{ flex:1, height:36, background:'#0d4a36', border:'1px solid #238636', borderRadius:8, color:'#3fb950', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation' }}>
                      \u2713 APPLIQUER
                    </button>
                  )}
                </div>
              </div>`;

c = c.slice(0, blockStart) + newFooter + c.slice(blockEnd);
fs.writeFileSync(file, c, 'utf8');
console.log('OK - matrice interactive UI');
