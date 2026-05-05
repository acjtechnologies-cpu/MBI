const fs = require('fs');
const file = 'C:\\Users\\Public\\Documents\\mbi-vnext\\src\\components\\Pilote\\DashboardPilote.jsx';
let c = fs.readFileSync(file, 'utf8');

// Remplace le footer mb-m-info par version interactive
const old = `              {displayCfg && (
                <div className="mb-m-info">
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:800, color:'#fff' }}>
                        Config #{displayCfg.n} - {displayCfg.m}g
                      </div>
                      <div style={{ fontSize:10, color:'#8b949e', marginTop:2 }}>
                    <div style={{ fontSize:10, color:'#8b949e', marginTop:2 }}>CG: {displayCfg.cg} mm - {(displayCfg.cg - model.cgVide).toFixed(1)}mm</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{
                        fontSize:11, fontWeight:700,
                        color: Math.abs(displayCfg.m - targetG) <= 30 ? '#3fb950' : '#f0a500'
                      }}>
                        {displayCfg.m - targetG > 0 ? '+' : ''}{displayCfg.m - targetG}g vs cible
                      </div>
                    </div>
                  </div>
                )}`;

const rep = `              {/* Boutons +/- par soute */}
              {customSlots && soutes.map((soute, idx) => {
                const mat = soute.materiaux?.[0] || { nom:'Laiton', masse:71 }
                const blocs = customSlots[soute.id] || []
                const colors = [
                  { label: 'rgba(255,200,80,.9)' },
                  { label: 'rgba(100,170,255,.9)' },
                  { label: 'rgba(63,185,80,.9)' },
                ]
                const col = colors[idx] || colors[0]
                return (
                  <div key={soute.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 4px', background:'rgba(255,255,255,.03)', borderRadius:8, flexShrink:0 }}>
                    <div style={{ fontSize:10, color:col.label, fontWeight:700, minWidth:70 }}>{soute.nom}</div>
                    <button onClick={() => removeBloc(soute.id)} style={{ width:32, height:32, borderRadius:6, border:'1px solid #444', background:'#1c2128', color:'#fff', fontSize:18, cursor:'pointer', touchAction:'manipulation' }}>-</button>
                    <div style={{ flex:1, textAlign:'center', fontSize:11, color:'#8b949e' }}>
                      {blocs.length} × {mat.masse}g = {blocs.reduce((s,b)=>s+b.masse,0)}g
                    </div>
                    <button onClick={() => blocs.length < soute.capacite && addBloc(soute.id, mat)} style={{ width:32, height:32, borderRadius:6, border:'1px solid #444', background:'#1c2128', color:'#fff', fontSize:18, cursor:'pointer', touchAction:'manipulation' }}>+</button>
                  </div>
                )
              })}
              {/* Footer masse/CG + bouton appliquer */}
              <div className="mb-m-info" style={{ flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                  <div>
                    <div style={{ fontSize:18, fontWeight:900, color:'#3fb950' }}>
                      {isHorsMatrice ? (masseCustom/1000).toFixed(3) : displayCfg ? (displayCfg.m/1000).toFixed(3) : '-'} kg
                    </div>
                    <div style={{ fontSize:9, color:'#8b949e' }}>
                      {isHorsMatrice ? <span style={{color:'#f0a500'}}>⚠ Hors matrice</span> : displayCfg ? \`cfg #\${displayCfg.n}\` : '-'}
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
                      ✏️ Éditer
                    </button>
                  )}
                  {customSlots && (
                    <button onClick={() => setCustomSlots(null)} style={{ width:36, height:36, background:'#1c2128', border:'1px solid #444', borderRadius:8, color:'#8b949e', fontSize:12, cursor:'pointer', touchAction:'manipulation' }}>
                      ✕
                    </button>
                  )}
                  {(displayCfg || customSlots) && (
                    <button onClick={() => {
                      const m = isHorsMatrice ? masseCustom : displayCfg.m
                      setKgManuel(m/1000)
                      setTab('calc')
                    }} style={{ flex:1, height:36, background:'#0d4a36', border:'1px solid #238636', borderRadius:8, color:'#3fb950', fontSize:12, fontWeight:700, cursor:'pointer', touchAction:'manipulation' }}>
                      ✓ APPLIQUER
                    </button>
                  )}
                </div>
              </div>
              {displayCfg && !customSlots && (
                <div style={{ fontSize:10, color: Math.abs(displayCfg.m - targetG) <= 30 ? '#3fb950' : '#f0a500', textAlign:'center', padding:'2px 0' }}>
                  {displayCfg.m - targetG > 0 ? '+' : ''}{displayCfg.m - targetG}g vs cible
                </div>
              )}`;

if (c.includes(old)) {
  c = c.replace(old, rep);
  console.log('OK - UI matrice interactive');
} else {
  console.log('ERREUR - bloc non trouve');
}
fs.writeFileSync(file, c, 'utf8');
