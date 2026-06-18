import { useState, useEffect } from 'react';
import Dexie from 'dexie';
import LiveView from './LiveView';

// -- Dexie - ChronoDB v4 -------------------------------------------------------
const db = new Dexie('ChronoDB');
db.version(3).stores({
  runs: '++id, pilote_id, manche, session_id, t_start',
}).upgrade(tx => {
  return tx.table('runs').toCollection().modify(run => {
    if (!run.session_id) run.session_id = run.t_start || 0;
  });
});
db.version(4).stores({
  runs: '++id, pilote_id, manche, session_id, t_start',
  sites_k: 'name',
});
export { db };

// -- Helpers -------------------------------------------------------------------
function fmtDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function formatDuree(ms) {
  if (!ms) return '-';
  return (ms / 1000).toFixed(2);
}

const COULEURS = ['#ff4b91', '#4a9eff', '#ffb74d', '#ce93d8', '#39d353'];

const btnFooter = {
  flex: 1, height: 38, background: '#141414',
  border: '0.5px solid #2a2a2a', borderRadius: 8,
  color: '#666', fontSize: 12, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};

const btnMini = {
  width: 32, height: 32, background: '#1a1a1a',
  border: '0.5px solid #333', borderRadius: 6,
  color: '#888', fontSize: 18,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};

// -------------------------------------------------------------------------------
// VUE JOURNAL
// -------------------------------------------------------------------------------
function JournalView({ onBack }) {
  const [sessions, setSessions]     = useState([]);
  const [expanded, setExpanded]     = useState(null);
  const [sessionRuns, setSessionRuns] = useState({});

  useEffect(() => {
    db.runs.orderBy('t_start').toArray().then(allRuns => {
      if (!allRuns.length) { setSessions([]); return; }
      const map = {};
      allRuns.forEach(r => {
        const sid = r.session_id || 0;
        if (!map[sid]) map[sid] = [];
        map[sid].push(r);
      });
      const list = Object.entries(map).map(([sid, runs]) => ({
        session_id: Number(sid),
        count: runs.length,
        t_start: Math.min(...runs.map(r => r.t_start)),
        pilots: [...new Set(runs.map(r => r.pilote_id))],
        best: Math.min(...runs.map(r => r.duree_ms).filter(Boolean)),
      })).sort((a, b) => b.session_id - a.session_id);
      setSessions(list);
    }).catch(() => {});
  }, []);

  function toggleSession(sid) {
    if (expanded === sid) { setExpanded(null); return; }
    setExpanded(sid);
    if (sessionRuns[sid]) return;
    db.runs.where('session_id').equals(sid).toArray().then(runs => {
      setSessionRuns(prev => ({ ...prev, [sid]: runs }));
    }).catch(() => {});
  }

  function exportSession(sid) {
    const runs = sessionRuns[sid] || [];
    const blob = new Blob([JSON.stringify({ export_date: new Date().toISOString(), session_id: sid, runs }, null, 2)],
      { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `f3f_session_${fmtDate(sid).replace(/\//g, '-')}.json`;
    a.click();
  }

  function exportAll() {
    db.runs.orderBy('t_start').toArray().then(allRuns => {
      const blob = new Blob([JSON.stringify({
        export_date: new Date().toISOString(),
        sessions: sessions.map(s => ({
          session_id: s.session_id,
          session_date: fmtDate(s.session_id),
          runs: allRuns.filter(r => r.session_id === s.session_id),
        })),
      }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `f3f_journal_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    }).catch(() => {});
  }

  function shareText() {
    db.runs.orderBy('t_start').toArray().then(allRuns => {
      const lines = sessions.slice(0, 5).map(s => {
        const runs = allRuns.filter(r => r.session_id === s.session_id);
        const best = Math.min(...runs.map(r => r.duree_ms).filter(Boolean));
        return `${fmtDate(s.session_id)} - ${runs.length} runs - best ${formatDuree(best)}s`;
      });
      const txt = `F3F PIT Journal\n${lines.join('\n')}`;
      if (navigator.share) navigator.share({ text: txt });
      else navigator.clipboard-.writeText(txt);
    }).catch(() => {});
  }

  function iqaColor(v) {
    if (!v) return '#555';
    if (v >= 7.5) return '#1D9E75';
    if (v >= 5.0) return '#EF9F27';
    return '#E24B4A';
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
      background:'#0a0a0a', color:'#fff' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
        background:'#111', borderBottom:'0.5px solid #222', flexShrink:0 }}>
        <button onClick={onBack} style={btnMini}>-</button>
        <span style={{ fontSize:13, fontWeight:600, color:'#ddd' }}>Journal des sessions</span>
        <span style={{ fontSize:11, color:'#444', marginLeft:'auto' }}>{sessions.length} sessions</span>
      </div>

      {/* Liste */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 12px' }}>
        {sessions.length === 0 && (
          <div style={{ textAlign:'center', color:'#333', fontSize:13, padding:'40px 0' }}>
            Aucune session enregistr-e
          </div>
        )}
        {sessions.map(s => {
          const isExpanded = expanded === s.session_id;
          const runs = sessionRuns[s.session_id] || [];
          return (
            <div key={s.session_id} style={{ marginBottom:6 }}>
              <div onClick={() => toggleSession(s.session_id)} style={{
                display:'flex', alignItems:'center', gap:8,
                background:'#0f0f0f', border:'0.5px solid #1a1a1a',
                borderRadius: isExpanded - '8px 8px 0 0' : 8,
                padding:'10px 12px', cursor:'pointer',
                touchAction:'manipulation', WebkitTapHighlightColor:'transparent',
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#ccc' }}>
                    {fmtDate(s.session_id)}
                    <span style={{ fontSize:10, color:'#555', marginLeft:8 }}>{fmtTime(s.t_start)}</span>
                  </div>
                  <div style={{ fontSize:10, color:'#555', marginTop:2 }}>
                    {s.count} run{s.count > 1 - 's' : ''}
                    {s.best - ` - best ${formatDuree(s.best)}s` : ''}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); if (runs.length) exportSession(s.session_id); else toggleSession(s.session_id); }}
                  style={{ background:'#141414', border:'0.5px solid #1a3a5a', borderRadius:6,
                    color:'#60a5fa', fontSize:10, padding:'0 8px', height:24, cursor:'pointer' }}>
                  - JSON
                </button>
                <span style={{ color:'#444', fontSize:14,
                  transform: isExpanded - 'rotate(90deg)' : 'none', transition:'transform 0.15s' }}>-</span>
              </div>
              {isExpanded && (
                <div style={{ background:'#080808', border:'0.5px solid #1a1a1a',
                  borderTop:'none', borderRadius:'0 0 8px 8px', padding:'6px 8px' }}>
                  {runs.length === 0
                    - <div style={{ color:'#333', fontSize:11, textAlign:'center', padding:8 }}>Chargement-</div>
                    : runs.sort((a,b) => a.t_start - b.t_start).map((r, i) => {
                        const col = COULEURS[r.pilote_id] -- '#888';
                        return (
                          <div key={r.id -- i} style={{ display:'flex', alignItems:'center',
                            gap:6, padding:'4px 6px', borderBottom:'0.5px solid #111' }}>
                            <span style={{ fontSize:9, color:'#444', minWidth:22 }}>M{r.manche}</span>
                            <span style={{ width:5, height:5, borderRadius:'50%', background:col, flexShrink:0 }} />
                            <span style={{ fontSize:11, color:'#888', flex:1 }}>P{r.pilote_id + 1}</span>
                            <span style={{ fontSize:13, fontWeight:500, color:'#ccc',
                              fontVariantNumeric:'tabular-nums' }}>{formatDuree(r.duree_ms)}</span>
                            {r.vent_snap > 0 && (
                              <span style={{ fontSize:9, color:'#58a6ff', minWidth:28, textAlign:'right' }}>
                                {r.vent_snap.toFixed(1)}
                              </span>
                            )}
                            {r.iqa_snap != null && (
                              <span style={{ fontSize:9, color:iqaColor(r.iqa_snap), minWidth:28, textAlign:'right' }}>
                                {r.iqa_snap.toFixed(1)}
                              </span>
                            )}
                          </div>
                        );
                      })
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div style={{ display:'flex', gap:6, padding:'8px 12px 16px',
          flexShrink:0, borderTop:'0.5px solid #1a1a1a' }}>
          <button onClick={shareText} style={{...btnFooter, color:'#3fb950', borderColor:'#1a3a2a'}}>
            - Partager
          </button>
          <button onClick={exportAll} style={{...btnFooter, color:'#60a5fa', borderColor:'#1a3a5a'}}>
            - JSON tout
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------------
// COMPOSANT PRINCIPAL - ChronoPage -pur-
// -------------------------------------------------------------------------------
export default function ChronoPage({ onNavigate } = {}) {
  const [vue, setVue] = useState('live'); // 'live' | 'journal'

  if (vue === 'journal') {
    return <JournalView onBack={() => setVue('live')} />;
  }

  return <LiveView onBack={() => setVue('journal')} journalMode />;
}
