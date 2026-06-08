# IRPX LIVE: q + IQA real-time predictive index
# 1. espStore: compute q and irpx in _handleData
# 2. ChronoPage: add irpx/q to snapshot
# 3. Poly4Page: display IRPX databar
# Run from: C:\Users\Public\Documents\mbi-vnext
import os

changes = 0

# ── 1. espStore: add q + irpx ──
f1 = os.path.join('src', 'stores', 'espStore.js')
with open(f1, 'r', encoding='utf-8') as fh:
    t1 = fh.read()

# 1a. Add Q_REF constant after imports
old1a = "const WS_URL = 'ws://192.168.4.1:81'"
new1a = """const WS_URL = 'ws://192.168.4.1:81'
const Q_REF = 39.2  // \u00bd \u00d7 1.225 \u00d7 8\u00b2 Pa (ISA 8m/s reference Poly4)"""
if old1a in t1:
    t1 = t1.replace(old1a, new1a, 1)
    changes += 1
    print('1a. Q_REF constant')

# 1b. Add q + irpx to initial state
old1b = "    BULLE: 0,\n  },"
new1b = "    BULLE: 0,\n  },\n\n  q: null,\n  irpx: null,"
if old1b in t1:
    t1 = t1.replace(old1b, new1b, 1)
    changes += 1
    print('1b. State q + irpx')

# 1c. Compute q + irpx after set({ data: next })
old1c = "    // Altitude -> appStore partage"
new1c = """    // IRPX: pression dynamique + IQA temps reel
    const spd = next.SPD || 0
    const rho = next.RHO || 1.225
    const iqa = next.IQA || 0
    const q = spd > 0 ? +(0.5 * rho * spd * spd).toFixed(1) : null
    const irpx = (q !== null && iqa > 0) ? +((q / Q_REF) * iqa).toFixed(3) : null
    set({ q, irpx })

    // Altitude -> appStore partage"""
if old1c in t1:
    t1 = t1.replace(old1c, new1c, 1)
    changes += 1
    print('1c. Calcul q + irpx')

# 1d. Add q + irpx to reset
old1d = "          sdActive: false, turbBuf: Array(60).fill(0), turbSigma: 0 })"
new1d = "          sdActive: false, turbBuf: Array(60).fill(0), turbSigma: 0, q: null, irpx: null })"
if old1d in t1:
    t1 = t1.replace(old1d, new1d, 1)
    changes += 1
    print('1d. Reset q + irpx')

with open(f1, 'w', encoding='utf-8') as fh:
    fh.write(t1)

# ── 2. ChronoPage: add irpx/q to snapshot ──
f2 = os.path.join('src', 'components', 'Chrono', 'ChronoPage.jsx')
with open(f2, 'r', encoding='utf-8') as fh:
    t2 = fh.read()

# 2a. Read q and irpx from espStore
old2a = "  const sdActive     = useESPStore(s => s.sdActive);"
new2a = "  const sdActive     = useESPStore(s => s.sdActive);\n  const qSnap        = useESPStore(s => s.q);\n  const irpxSnap     = useESPStore(s => s.irpx);"
if old2a in t2:
    t2 = t2.replace(old2a, new2a, 1)
    changes += 1
    print('2a. ChronoPage read q + irpx')

# 2b. Add to snapshot
old2b = "  sgrad_snap:  sGradSnap,"
new2b = "  sgrad_snap:  sGradSnap,\n  q_snap:      qSnap,\n  irpx_snap:   irpxSnap,"
if old2b in t2:
    t2 = t2.replace(old2b, new2b, 1)
    changes += 1
    print('2b. Snapshot q + irpx')

with open(f2, 'w', encoding='utf-8') as fh:
    fh.write(t2)

# ── 3. Poly4Page: display IRPX ──
f3 = os.path.join('src', 'components', 'Poly4', 'Poly4Page.jsx')
with open(f3, 'r', encoding='utf-8') as fh:
    t3 = fh.read()

# 3a. Import espStore
old3a = "import { useIrpStore } from '../../stores/irpStore'"
new3a = "import { useIrpStore } from '../../stores/irpStore'\nimport { useESPStore } from '../../stores/espStore'"
if old3a in t3 and 'useESPStore' not in t3:
    t3 = t3.replace(old3a, new3a, 1)
    changes += 1
    print('3a. Import espStore')

# 3b. Read q + irpx
old3b = "  const iqaHybrid     = useIrpStore(s => s.iqaHybrid)"
new3b = "  const iqaHybrid     = useIrpStore(s => s.iqaHybrid)\n  const espQ          = useESPStore(s => s.q)\n  const espIrpx       = useESPStore(s => s.irpx)\n  const espConnected  = useESPStore(s => s.connected)"
if old3b in t3:
    t3 = t3.replace(old3b, new3b, 1)
    changes += 1
    print('3b. Read q + irpx')

# 3c. Add IRPX display in bottom panel (after IQA hybrid, before APPLIQUER button)
old3c = """            <button onClick={handleApply} style={{"""
new3c = """            {espConnected && espIrpx !== null && (
              <div style={{ display:'flex', gap:12, padding:'6px 0', borderTop:'1px solid #1e2535', marginTop:2 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:'#4a5568', fontWeight:600 }}>IRPX</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#00d1b2' }}>{espIrpx.toFixed(2)}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:'#4a5568', fontWeight:600 }}>q</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#00d1b2' }}>{espQ} Pa</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:'#4a5568', fontWeight:600 }}>IQA</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#00d1b2' }}>{(useESPStore.getState().data?.IQA || 0).toFixed(1)}</div>
                </div>
              </div>
            )}
            <button onClick={handleApply} style={{"""
if old3c in t3:
    t3 = t3.replace(old3c, new3c, 1)
    changes += 1
    print('3c. IRPX display Poly4Page')

with open(f3, 'w', encoding='utf-8') as fh:
    fh.write(t3)

print(f'\n{changes} modifications')
