import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore'
import { useESPStore } from '../../stores/espStore';
import Dexie from 'dexie';
import { useModelStore } from '../../stores/modelStore';

const db = new Dexie('ChronoDB');
db.version(1).stores({
  runs: '++id, pilote_id, manche, t_start, site_name, planeur_id',
});

function formatDuree(ms) {
  if (ms == null || ms === 0) return '\u2014';
  return (ms / 1000).toFixed(2);
}
function fmtDisplay(ms) {
  if (ms == null) return '00.00';
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2).padStart(5, '0');
  return m > 0 ? `${m}:${sec}` : sec;
}

const COULEURS = ['#EF9F27', '#1D9E75', '#378ADD', '#D85A30', '#7F77DD'];
const PILOTES_DEFAULT = [
  { nom: 'Pilote 1' }, { nom: 'Pilote 2' }, { nom: 'Pilote 3' },
  { nom: 'Pilote 4' }, { nom: 'Pilote 5' },
];

export default function ChronoPage() {
  const [pilotes, setPilotes]         = useState(PILOTES_DEFAULT);
  const [piloteActif, setPiloteActif] = useState(0);
  const [manche, setManche]           = useState(1);
  const [runs, setRuns]               = useState([]);
  const [running, setRunning]         = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [editNom, setEditNom]         = useState(null);
  const [editVal, setEditVal]         = useState('');
  const [showReset, setShowReset]     = useState(false);

  const activeSite = useAppStore(s => s.activeSite)
  const altitude   = useAppStore(s => s.altitude) || 0
  const activeModel = useModelStore(s => s.getActiveModel())
  const espData = useESPStore(s => s.data);
  const iqa     = espData?.iqa   ?? 0;
  const vent    = espData?.vent  ?? espData?.pitot ?? 0;
  const sGrad   = espData?.sGrad ?? 0;
  const bulle   = espData?.bulle ?? false;

  const t0Ref      = useRef(null);
  const rafRef     = useRef(null);
  const bulleRef   = useRef(bulle);
  const iqaRef     = useRef(iqa);
  const ventRef    = useRef(vent);
  const sGradRef   = useRef(sGrad);

  useEffect(() => { bulleRef.current = bulle; }, [bulle]);
  useEffect(() => { iqaRef.current   = iqa;   }, [iqa]);
  useEffect(() => { ventRef.current  = vent;  }, [vent]);
  useEffect(() => { sGradRef.current = sGrad; }, [sGrad]);

  const tick = useCallback(() => {
    setElapsed(Date.now() - t0Ref.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStartStop = useCallback(() => {
    if (!running) {
      t0Ref.current = Date.now();
      setElapsed(0);
      setRunning(true);
      rafRef.current = requestAnimationFrame(tick);
      if (navigator.vibrate) navigator.vibrate(40);
    } else {
      cancelAnimationFrame(rafRef.current);
      const duree_ms = Date.now() - t0Ref.current;
      setRunning(false);
      setElapsed(0);
      const newRun = {
        id:         Date.now(),
        pilote_id:  piloteActif,
        manche,
        duree_ms,
        iqa_snap:   iqaRef.current,
        vent_snap:  ventRef.current,
        sgrad_snap: sGradRef.current,
        bulle_snap:  bulleRef.current,
        t_start:     t0Ref.current,
        site_name:   activeSite?.name || '',
        site_k:      activeSite?.k || 1.0,
        site_irp:    activeSite?.irp || 171,
        altitude:    altitude,
        planeur_id:   activeModel?.id || '',
        planeur_nom:  activeModel?.nom || '',
        planeur_mv:   activeModel?.masseVide || 0,
        planeur_surf: activeModel?.surface || 0,
        planeur_off:  activeModel?.offset || 0,
        ballast_masse:  ballastSnap?.masse || 0,
        ballast_config: ballastSnap?.config || 0,
        ballast_cg:     ballastSnap?.cg || 0,
      };
      setRuns(prev => [newRun, ...prev]);
      db.runs.add(newRun).catch(() => {});
      if (navigator.vibrate) navigator.vibrate([30, 50, 80]);
    }
  }, [running, piloteActif, manche, tick]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    db.runs.orderBy('t_start').reverse().limit(100).toArray()
      .then(r => { if (r.length) setRuns(r); }).catch(() => {});
  }, []);

  const runsActif = runs.filter(r => r.pilote_id === piloteActif);
  const bestActif = runsActif.length ? Math.min(...runsActif.map(r => r.duree_ms)) : null;
  const couleurActif = COULEURS[piloteActif] ?? '#EF9F27';

  function bestPour(idx) {
    const r = runs.filter(x => x.pilote_id === idx);
    return r.length ? Math.min(...r.map(x => x.duree_ms)) : null;
  }
  function startEdit(idx) { setEditNom(idx); setEditVal(pilotes[idx].nom); }
  function commitEdit() {
    if (editNom === null) return;
    const v = editVal.trim().slice(0, 12) || pilotes[editNom].nom;
    setPilotes(prev => prev.map((p, i) => i === editNom ? { ...p, nom: v } : p));
    setEditNom(null);
  }
  function resetConcours() {
    setRuns([]); setManche(1); setRunning(false); setElapsed(0); setShowReset(false);
    db.runs.clear().catch(() => {});
  }
  function exportJSON() {
    const data = { export_date: new Date().toISOString(),
      site: activeSite, pilotes: pilotes.map((p,i)=>({id:i,nom:p.nom})), runs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `f3f_chrono_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }
  function iqaColor(v) {
    if (v >= 7.5) return '#1D9E75';
    if (v >= 5.0) return '#EF9F27';
    return '#E24B4A';
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      height:'100%', background:'#0a0a0a',
      color:'#fff', fontFamily:'var(--font-sans,sans-serif)',
      overflowY:'auto', userSelect:'none',
    }}>

      {/* BARRE IQA */}
      <div style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'6px 12px', background:'#111',
        borderBottom:'0.5px solid #222', flexShrink:0,
      }}>
        <span style={{
          background: iqaColor(iqa), color:'#fff',
          fontSize:11, fontWeight:500, padding:'2px 9px', borderRadius:99,
        }}>IQA</span>
        <span style={{ fontSize:15, fontWeight:500, color:iqaColor(iqa), fontVariantNumeric:'tabular-nums' }}>
          {iqa.toFixed(1)}
        </span>
        <span style={{ fontSize:11, color:'#666' }}>{vent.toFixed(1)} m/s</span>

        {bulle ? <BulleIndicator /> : (
          <span style={{
            fontSize:11, marginLeft:4, fontVariantNumeric:'tabular-nums',
            color: sGrad > 0.5 ? '#1D9E75' : sGrad > 0 ? '#5a9a7a' : '#555',
          }}>
            S_GRAD {sGrad >= 0 ? '+' : ''}{sGrad.toFixed(2)}
          </span>
        )}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:'#555' }}>M</span>
          <button onClick={() => !running && setManche(m => Math.max(1, m-1))} style={btnMini}>-</button>
          <span style={{ fontSize:14, fontWeight:500, minWidth:20, textAlign:'center' }}>{manche}</span>
          <button onClick={() => !running && setManche(m => Math.min(16, m+1))} style={btnMini}>+</button>
        </div>
      </div>

      {/* CHIPS PILOTES */}
      <div style={{
        display:'flex', gap:6, padding:'8px 12px',
        overflowX:'auto', flexShrink:0, scrollbarWidth:'none',
      }}>
        {pilotes.map((p, i) => {
          const best = bestPour(i);
          const active = i === piloteActif;
          const col = COULEURS[i];
          return (
            <div key={i}
              onClick={() => !running && setPiloteActif(i)}
              onDoubleClick={() => startEdit(i)}
              style={{
                flexShrink:0, minWidth:64,
                background: active ? '#0f0f0f' : '#141414',
                border:`1.5px solid ${active ? col : '#2a2a2a'}`,
                borderRadius:10, padding:'7px 10px', textAlign:'center', cursor:'pointer',
              }}
            >
              {editNom === i ? (
                <input autoFocus value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => e.key === 'Enter' && commitEdit()}
                  style={{ width:56, background:'transparent', border:'none', color:col,
                    fontSize:12, fontWeight:500, textAlign:'center', outline:'none' }}
                  maxLength={12}
                />
              ) : (
                <div style={{ fontSize:12, fontWeight:500, color: active ? col : '#888' }}>{p.nom}</div>
              )}
              <div style={{ fontSize:10, color: active ? col : '#444', marginTop:2, fontVariantNumeric:'tabular-nums' }}>
                {best ? formatDuree(best) : '\u2014'}
              </div>
            </div>
          );
        })}
      </div>

      {/* DISPLAY CHRONO */}
      <div style={{
        margin:'0 12px 8px',
        background:'#050505',
        border:`1.5px solid ${running ? couleurActif : '#1a1a1a'}`,
        borderRadius:14, padding:'14px 16px 12px', textAlign:'center',
        flexShrink:0, transition:'border-color 0.2s',
      }}>
        <div style={{ fontSize:12, color:'#555', marginBottom:4, letterSpacing:'0.08em' }}>
          {pilotes[piloteActif].nom}
          <span style={{ color:'#333', margin:'0 6px' }}>\u00b7</span>
          manche {manche}
        </div>
        <div style={{
          fontSize:58, fontWeight:500, letterSpacing:-1,
          color: running ? couleurActif : '#fff',
          fontVariantNumeric:'tabular-nums', lineHeight:1, marginBottom:6,
        }}>
          {fmtDisplay(running ? elapsed : null)}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:20, fontSize:11, color:'#444' }}>
          <span>best <span style={{ color:'#888', fontVariantNumeric:'tabular-nums' }}>
            {bestActif ? formatDuree(bestActif) : '\u2014'}
          </span></span>
          <span>IQA snap <span style={{ color:'#888' }}>
            {runs.find(r => r.pilote_id === piloteActif)?.iqa_snap?.toFixed(1) ?? '\u2014'}
          </span></span>
        </div>
      </div>

      {/* BOUTON START/STOP */}
      <button onClick={handleStartStop}
        style={{
          margin:'0 12px 10px', height:76, borderRadius:16, border:'none',
          background: running ? '#8b1a1a' : '#0d4a36',
          color:'#fff', fontSize:24, fontWeight:500, letterSpacing:'0.05em',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          gap:14, flexShrink:0, WebkitTapHighlightColor:'transparent', outline:'none',
        }}
        onTouchStart={() => {}}
      >
        {running ? (
          <>
            <div style={{ width:20, height:20, background:'#E24B4A', borderRadius:3 }} />
            <span style={{ color:'#E24B4A' }}>STOP</span>
          </>
        ) : (
          <>
            <div style={{ width:0, height:0,
              borderTop:'12px solid transparent', borderBottom:'12px solid transparent',
              borderLeft:'20px solid #1D9E75' }} />
            <span style={{ color:'#1D9E75' }}>START</span>
          </>
        )}
      </button>

      {/* LISTE RUNS */}
      <div style={{ padding:'0 12px', flex:1, overflowY:'auto' }}>
        <div style={{ fontSize:10, color:'#444', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>
          Runs \u2014 {runs.length}
        </div>
        {runs.length === 0 && (
          <div style={{ textAlign:'center', color:'#333', fontSize:13, padding:'24px 0' }}>
            Aucun run enregistr\u00e9
          </div>
        )}
        {runs.map((r, i) => {
          const p = pilotes[r.pilote_id];
          const col = COULEURS[r.pilote_id] ?? '#888';
          const runsP = runs.filter(x => x.pilote_id === r.pilote_id);
          const bestP = Math.min(...runsP.map(x => x.duree_ms));
          const isBest = r.duree_ms === bestP;
          return (
            <div key={r.id ?? i} style={{
              display:'flex', alignItems:'center',
              background:'#0f0f0f', borderRadius:8,
              padding:'7px 10px', marginBottom:4, gap:8,
              border: isBest ? `0.5px solid ${col}44` : '0.5px solid #1a1a1a',
            }}>
              <div style={{ fontSize:10, color:'#444', minWidth:22, textAlign:'center' }}>M{r.manche}</div>
              <div style={{ width:6, height:6, borderRadius:'50%', background:col, flexShrink:0 }} />
              <div style={{ fontSize:12, color: isBest ? col : '#999', flex:1, fontWeight: isBest ? 500 : 400 }}>
                {p?.nom ?? '?'}
              </div>
              <div style={{
                fontSize:16, fontWeight:500, color: isBest ? col : '#ccc',
                fontVariantNumeric:'tabular-nums', minWidth:58, textAlign:'right',
              }}>
                {formatDuree(r.duree_ms)}
              </div>
              <div style={{ fontSize:10, color:iqaColor(r.iqa_snap ?? 0), minWidth:30, textAlign:'right' }}>
                {r.iqa_snap != null ? r.iqa_snap.toFixed(1) : '\u2014'}
              </div>
              {r.bulle_snap && (
                <div style={{ fontSize:9, color:'#00e5cc', fontWeight:500,
                  padding:'1px 5px', borderRadius:4, border:'0.5px solid #00e5cc44' }}>B</div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div style={{
        display:'flex', gap:6, padding:'8px 12px 16px',
        flexShrink:0, borderTop:'0.5px solid #1a1a1a',
      }}>
        <button onClick={exportJSON} style={btnFooter}>Export JSON</button>
        <button onClick={() => setShowReset(true)} style={{ ...btnFooter, color:'#8b2020' }}>R\u00e9init.</button>
      </div>

      {/* MODAL RESET */}
      {showReset && (
        <div style={{
          position:'absolute', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:50,
        }}>
          <div style={{
            background:'#111', border:'0.5px solid #333',
            borderRadius:16, padding:24, maxWidth:280, width:'90%', textAlign:'center',
          }}>
            <div style={{ fontSize:15, fontWeight:500, marginBottom:8 }}>R\u00e9initialiser le concours ?</div>
            <div style={{ fontSize:12, color:'#666', marginBottom:20 }}>
              Tous les runs seront effac\u00e9s.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowReset(false)} style={{ ...btnFooter, flex:1, height:44, fontSize:13 }}>Annuler</button>
              <button onClick={resetConcours} style={{ ...btnFooter, flex:1, height:44, fontSize:13, color:'#E24B4A', borderColor:'#8b2020' }}>R\u00e9initialiser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BulleIndicator() {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVis(v => !v), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{
      fontSize:11, fontWeight:500, marginLeft:4, letterSpacing:'0.06em',
      color: vis ? '#00e5cc' : 'transparent',
      padding:'2px 8px', borderRadius:4,
      border:`0.5px solid ${vis ? '#00e5cc66' : 'transparent'}`,
      transition:'color 0.1s, border-color 0.1s',
    }}>
      BULLE ASCENDANTE
    </span>
  );
}

const btnMini = {
  width:24, height:24, background:'#1a1a1a', border:'0.5px solid #333',
  borderRadius:6, color:'#888', fontSize:14, cursor:'pointer', padding:0,
  display:'flex', alignItems:'center', justifyContent:'center',
};
const btnFooter = {
  flex:1, height:38, background:'#141414', border:'0.5px solid #2a2a2a',
  borderRadius:8, color:'#666', fontSize:12, cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
};
