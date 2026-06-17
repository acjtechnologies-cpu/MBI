// ═══════════════════════════════════════════════════════════════════════════════
// VUE LIVE — Résultats F3XVault en direct
// Polling getEventRound + getEventStandings
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL  = 'https://www.f3xvault.com/api.php';
const POLL_MS  = 120_000;
const REF_IRP  = 8.969;

// ── Helpers API ───────────────────────────────────────────────────────────────
async function apiPost(params) {
  const fd = new FormData();
  Object.entries(params).forEach(([k, v]) => fd.append(k, v));
  const r = await fetch(API_URL, { method: 'POST', body: fd });
  return r.text();
}

function parseCsv(body) {
  const lines = body.trim().split('\n');
  if (!lines.length || lines[0].trim() !== '1') return [];
  const header = lines[1]?.split(',').map(h => h.replace(/"/g, '').trim());
  if (!header) return [];
  return lines.slice(2).map(l => {
    const vals = [];
    let cur = '', inQ = false;
    for (const ch of l) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(header.map((h, i) => [h, vals[i] ?? '']));
  }).filter(r => Object.values(r).some(v => v));
}

async function searchEvents(login, password, string) {
  const body = await apiPost({ login, password, function: 'searchEvents',
    event_type_code: 'f3f', string, per_page: 20, output_type: 'json' });
  const lines = body.trim().split('\n');
  if (!lines[0] || lines[0].trim() !== '1') return [];
  return lines.slice(1).map(l => {
    const v = [];
    let cur = '', inQ = false;
    for (const ch of l) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { v.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    v.push(cur.trim());
    return { event_id: parseInt(v[0]), date: v[1], name: v[2], location: v[3] };
  }).filter(e => e.event_id > 0);
}

async function getRound(login, password, event_id, round_number) {
  const body = await apiPost({ login, password, function: 'getEventRound',
    event_id, round_number, output_type: 'json' });
  return parseCsv(body).map(r => ({
    pilot: `${r.First_Name ?? ''} ${r.Last_Name ?? ''}`.trim(),
    seconds: parseFloat(r.seconds || '0'),
    wind: parseFloat(r.wind_speed_avg || '0'),
  })).filter(r => r.seconds > 0).sort((a, b) => a.seconds - b.seconds);
}

async function getStandings(login, password, event_id) {
  const body = await apiPost({ login, password, function: 'getEventStandings',
    event_id, output_type: 'json' });
  const lines = body.trim().split('\n');
  if (!lines[0] || lines[0].trim() !== '1') return [];
  // Ligne 0=statut, ligne 1=info event, ligne 2=header CSV, ligne 3+=données
  const csvBody = '1\n' + lines.slice(2).join('\n');
  return parseCsv(csvBody).map(r => ({
    rank:       parseInt(r.Rank || '0'),
    pilot:      r['Pilot Name'] || '',
    total:      parseFloat(r.Total_Score || '0'),
    diff:       parseFloat(r.Difference || '0'),
    subtotal:   parseFloat(r.Subtotal || '0'),
    drops:      parseFloat(r.Drops || '0'),
    percentage: parseFloat(r.Percentage || '0'),
  })).filter(r => r.rank > 0).sort((a, b) => a.rank - b.rank);
}

// ── Composants ────────────────────────────────────────────────────────────────
function RoundCard({ round, rows, target }) {
  if (!rows.length) return null;
  const n = rows.length;
  const t_best = rows[0].seconds;
  const t_p25  = rows[Math.floor(0.25 * n)]?.seconds ?? t_best;
  const t_p5   = rows[Math.max(0, Math.floor(0.05 * n))]?.seconds ?? t_best;
  const irp    = ((t_p5 / t_p25) * 10 / REF_IRP).toFixed(3);
  const wind   = rows[0].wind;
  const joIdx  = rows.findIndex(r => r.pilot.toLowerCase().includes(target.toLowerCase()));

  return (
    <div style={{ background:'#0f0f0f', border:'0.5px solid #1e2535',
      borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:11, color:'#8b949e', fontWeight:700, letterSpacing:1 }}>
          ROUND {round}
        </span>
        <span style={{ fontSize:11, color:'#4a9eff' }}>
          {wind > 0 ? `${wind.toFixed(1)} m/s` : '—'} · K {irp}
        </span>
      </div>
      {rows.slice(0, 5).map((r, i) => {
        const isJo = joIdx === i;
        return (
          <div key={i} style={{ display:'flex', gap:8, padding:'3px 6px', borderRadius:5,
            background: isJo ? '#0d1f2d' : 'transparent',
            border: isJo ? '0.5px solid #4a9eff44' : 'none' }}>
            <span style={{ fontSize:10, color:'#444', minWidth:18 }}>{i+1}.</span>
            <span style={{ fontSize:12, color: isJo ? '#4a9eff' : '#ccc', flex:1 }}>{r.pilot}</span>
            <span style={{ fontSize:13, fontWeight:500, color: isJo ? '#4a9eff' : '#e8eaf0',
              fontVariantNumeric:'tabular-nums' }}>{r.seconds.toFixed(2)}s</span>
          </div>
        );
      })}
      {joIdx >= 5 && (
        <div style={{ borderTop:'0.5px solid #1a2535', marginTop:4, paddingTop:4 }}>
          <div style={{ display:'flex', gap:8, padding:'3px 6px', background:'#0d1f2d',
            borderRadius:5, border:'0.5px solid #4a9eff44' }}>
            <span style={{ fontSize:10, color:'#4a9eff', minWidth:18 }}>{joIdx+1}.</span>
            <span style={{ fontSize:12, color:'#4a9eff', flex:1 }}>{rows[joIdx].pilot}</span>
            <span style={{ fontSize:13, fontWeight:500, color:'#4a9eff',
              fontVariantNumeric:'tabular-nums' }}>{rows[joIdx].seconds.toFixed(2)}s</span>
          </div>
        </div>
      )}
      <div style={{ fontSize:9, color:'#333', textAlign:'right', marginTop:3 }}>
        {n} pilotes · T_best {t_best.toFixed(2)}s · T_P25 {t_p25.toFixed(2)}s
      </div>
    </div>
  );
}

function StandingsCard({ standings, target }) {
  const [rival, setRival] = useState(() => localStorage.getItem('f3xv_rival') || '');
  if (!standings.length) return null;
  const joIdx = standings.findIndex(r => r.pilot.toLowerCase().includes(target.toLowerCase()));
  const jo    = standings[joIdx];
  const rivalIdx = rival ? standings.findIndex(r => r.pilot.toLowerCase().includes(rival.toLowerCase())) : -1;
  const rivalData = rivalIdx >= 0 ? standings[rivalIdx] : null;

  // Concurrent direct au-dessus et en-dessous
  const above = joIdx > 0 ? standings[joIdx - 1] : null;
  const below = joIdx >= 0 && joIdx < standings.length - 1 ? standings[joIdx + 1] : null;

  return (
    <div style={{ background:'#0f0f0f', border:'0.5px solid #ffd70033',
      borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
      <div style={{ fontSize:11, color:'#ffd700', fontWeight:700, letterSpacing:1, marginBottom:8 }}>
        CLASSEMENT GÉNÉRAL — {standings.length} pilotes
      </div>

      {/* Jo + concurrents directs */}
      {jo && (
        <div style={{ marginBottom:8 }}>
          {above && (
            <div style={{ display:'flex', gap:8, padding:'4px 6px', borderRadius:5,
              background:'#111', marginBottom:2 }}>
              <span style={{ fontSize:10, color:'#555', minWidth:22, textAlign:'right' }}>{above.rank}.</span>
              <span style={{ fontSize:12, color:'#888', flex:1 }}>{above.pilot}</span>
              <span style={{ fontSize:12, fontVariantNumeric:'tabular-nums', color:'#888' }}>
                {above.total.toFixed(0)} pts
              </span>
              <span style={{ fontSize:10, color:'#E24B4A', minWidth:60, textAlign:'right' }}>
                +{(above.total - jo.total).toFixed(0)} pts
              </span>
            </div>
          )}
          <div style={{ display:'flex', gap:8, padding:'6px 8px', borderRadius:7,
            background:'#0d1f2d', border:'1px solid #ffd70066', marginBottom:2 }}>
            <span style={{ fontSize:11, color:'#ffd700', minWidth:22, textAlign:'right',
              fontWeight:700 }}>{jo.rank}.</span>
            <span style={{ fontSize:13, color:'#ffd700', flex:1, fontWeight:600 }}>{jo.pilot}</span>
            <span style={{ fontSize:14, fontWeight:700, fontVariantNumeric:'tabular-nums',
              color:'#ffd700' }}>{jo.total.toFixed(0)} pts</span>
            <span style={{ fontSize:10, color:'#1D9E75', minWidth:48, textAlign:'right' }}>
              {jo.percentage.toFixed(1)}%
            </span>
          </div>
          {below && (
            <div style={{ display:'flex', gap:8, padding:'4px 6px', borderRadius:5,
              background:'#111' }}>
              <span style={{ fontSize:10, color:'#555', minWidth:22, textAlign:'right' }}>{below.rank}.</span>
              <span style={{ fontSize:12, color:'#888', flex:1 }}>{below.pilot}</span>
              <span style={{ fontSize:12, fontVariantNumeric:'tabular-nums', color:'#888' }}>
                {below.total.toFixed(0)} pts
              </span>
              <span style={{ fontSize:10, color:'#1D9E75', minWidth:60, textAlign:'right' }}>
                −{(jo.total - below.total).toFixed(0)} pts
              </span>
            </div>
          )}
        </div>
      )}

      {/* Rival manuel */}
      <div style={{ borderTop:'0.5px solid #1a1a1a', paddingTop:6, marginBottom:6 }}>
        <div style={{ fontSize:9, color:'#444', marginBottom:4, letterSpacing:1 }}>CONCURRENT CIBLÉ</div>
        <input
          placeholder="Nom du concurrent..." value={rival}
          onChange={e => { setRival(e.target.value); localStorage.setItem('f3xv_rival', e.target.value); }}
          style={{ background:'#131720', border:'0.5px solid #30363d', color:'#e8eaf0',
            borderRadius:6, padding:'5px 10px', fontSize:12, width:'100%', boxSizing:'border-box',
            fontFamily:'inherit', outline:'none', marginBottom:4 }}
        />
        {rivalData && jo && (
          <div style={{ display:'flex', gap:8, padding:'5px 8px', borderRadius:6,
            background: rivalData.rank < jo.rank ? '#1a0d0d' : '#0d1a0d',
            border: rivalData.rank < jo.rank ? '0.5px solid #E24B4A44' : '0.5px solid #1D9E7544' }}>
            <span style={{ fontSize:10, color:'#666', minWidth:22, textAlign:'right' }}>{rivalData.rank}.</span>
            <span style={{ fontSize:12, color:'#ccc', flex:1 }}>{rivalData.pilot}</span>
            <span style={{ fontSize:12, fontVariantNumeric:'tabular-nums', color:'#ccc' }}>{rivalData.total.toFixed(0)}</span>
            <span style={{ fontSize:11, fontWeight:700, minWidth:60, textAlign:'right',
              color: rivalData.rank < jo.rank ? '#E24B4A' : '#1D9E75' }}>
              {rivalData.rank < jo.rank
                ? '+' + (rivalData.total - jo.total).toFixed(0) + ' pts'
                : '-' + (jo.total - rivalData.total).toFixed(0) + ' pts'}
            </span>
          </div>
        )}
        {rival && !rivalData && <div style={{ fontSize:10, color:'#555' }}>Pilote non trouvé</div>}
      </div>
      {/* Classement complet scrollable */}
      <div style={{ borderTop:'0.5px solid #1a1a1a', paddingTop:6 }}>
        <div style={{ fontSize:9, color:'#444', marginBottom:4, letterSpacing:1 }}>CLASSEMENT COMPLET</div>
        <div style={{ maxHeight:320, overflowY:'auto' }}>
        {standings.map((r, i) => {
          const isJo = joIdx === i;
          const isRival = rivalIdx === i;
          return (
            <div key={i} style={{ display:'flex', gap:8, padding:'4px 6px', borderRadius:5,
              marginBottom:1,
              background: isJo ? '#0d1f2d' : isRival ? (r.rank < jo?.rank ? '#1a0d0d' : '#0d1a0d') : 'transparent',
              border: isJo ? '0.5px solid #ffd70044' : isRival ? '0.5px solid #88888844' : 'none' }}>
              <span style={{ fontSize:10, minWidth:22, textAlign:'right',
                color: isJo ? '#ffd700' : isRival ? '#aaa' : '#444' }}>{r.rank}.</span>
              <span style={{ fontSize:11, flex:1,
                color: isJo ? '#ffd700' : isRival ? '#ccc' : '#888',
                fontWeight: isJo || isRival ? 600 : 400 }}>{r.pilot}</span>
              <span style={{ fontSize:11, fontVariantNumeric:'tabular-nums',
                color: isJo ? '#ffd700' : isRival ? '#ccc' : '#666' }}>{r.total.toFixed(0)}</span>
              {jo && !isJo && (
                <span style={{ fontSize:9, minWidth:50, textAlign:'right',
                  color: r.total > jo.total ? '#E24B4A' : '#1D9E75' }}>
                  {r.total > jo.total ? '+' : '-'}{Math.abs(r.total - jo.total).toFixed(0)}
                </span>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function LiveView({ onBack }) {
  const [login, setLogin]       = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch]     = useState('');
  const [events, setEvents]     = useState([]);
  const [eventId, setEventId]   = useState(() => { const v = localStorage.getItem('f3xv_event_id'); return v ? parseInt(v) : null; });
  const [eventName, setEventName] = useState(() => localStorage.getItem('f3xv_event_name') || '');
  const [target, setTarget]     = useState(() => localStorage.getItem('f3xv_target') || 'Carrion');
  const [rounds, setRounds]     = useState(() => { try { return JSON.parse(localStorage.getItem('f3xv_rounds') || '{}'); } catch { return {}; } });
  const [standings, setStandings] = useState(() => { try { return JSON.parse(localStorage.getItem('f3xv_standings') || '[]'); } catch { return []; } });
  const [lastRound, setLastRound] = useState(0);
  const [polling, setPolling]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tab, setTab]           = useState('rounds'); // 'rounds' | 'classement'
  const [error, setError]       = useState('');
  const timerRef = useRef(null);

  async function doSearch() {
    if (!login || !password || !search) return;
    setError('');
    try {
      const res = await searchEvents(login, password, search);
      setEvents(res);
    } catch { setError('Erreur réseau'); }
  }

  const loadRound = useCallback(async (rn) => {
    const rows = await getRound(login, password, eventId, rn);
    if (rows.length > 0) {
      setRounds(prev => { const next = { ...prev, [rn]: rows }; localStorage.setItem('f3xv_rounds', JSON.stringify(next)); return next; });
      setLastRound(rn);
      return true;
    }
    return false;
  }, [login, password, eventId]);

  const doPoll = useCallback(async () => {
    if (!eventId) return;
    let rn = Math.max(1, lastRound);
    while (true) {
      const ok = await loadRound(rn);
      if (!ok) break;
      rn++;
    }
    // Classement général
    const st = await getStandings(login, password, eventId);
    if (st.length) { setStandings(st); localStorage.setItem('f3xv_standings', JSON.stringify(st)); }
    setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
  }, [eventId, lastRound, loadRound, login, password]);

  useEffect(() => {
    if (!polling || !eventId) return;
    doPoll();
    timerRef.current = setInterval(doPoll, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [polling, eventId, doPoll]);

  const inputStyle = {
    background:'#131720', border:'0.5px solid #30363d', color:'#e8eaf0',
    borderRadius:8, padding:'8px 12px', fontSize:13, width:'100%',
    fontFamily:'inherit', outline:'none', boxSizing:'border-box',
  };

  const sortedRounds = Object.entries(rounds).sort(([a],[b]) => parseInt(b) - parseInt(a));

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      background:'#0b0e12', color:'#c9d1d9', padding:'10px 12px',
      overflowY:'auto', boxSizing:'border-box', gap:8 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={onBack} style={{ background:'#1a1a2e', border:'0.5px solid #1a3a5a',
          color:'#4a9eff', fontSize:13, cursor:'pointer', padding:'6px 12px',
          borderRadius:8, fontWeight:700, touchAction:'manipulation',
          WebkitTapHighlightColor:'transparent' }}>← Retour</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, color:'#8b949e', textTransform:'uppercase', letterSpacing:1 }}>
            Live F3XVault
          </div>
          {eventName && <div style={{ fontSize:12, fontWeight:600, color:'#58a6ff' }}>{eventName}</div>}
        </div>
        {polling && (
          <div style={{ fontSize:9, color:'#1D9E75', border:'0.5px solid #1D9E7544',
            padding:'2px 8px', borderRadius:4 }}>
            ● LIVE {lastUpdate && `· ${lastUpdate}`}
          </div>
        )}
      </div>

      {/* Credentials + recherche */}
      {!eventId && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <input style={inputStyle} placeholder="Login F3XVault"
            value={login} onChange={e => setLogin(e.target.value)} />
          <input style={inputStyle} type="password" placeholder="Mot de passe"
            value={password} onChange={e => setPassword(e.target.value)} />
          <div style={{ display:'flex', gap:6 }}>
            <input style={{...inputStyle, flex:1}} placeholder="Nom du concours"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()} />
            <button onClick={doSearch} style={{ background:'#1f6feb', border:'none', color:'#fff',
              borderRadius:8, padding:'0 14px', cursor:'pointer', fontWeight:600 }}>⌕</button>
          </div>
          {error && <div style={{ fontSize:11, color:'#f85149' }}>{error}</div>}
          {events.map((ev, i) => (
            <div key={i} onClick={() => { setEventId(ev.event_id); setEventName(ev.name); localStorage.setItem('f3xv_event_id', ev.event_id); localStorage.setItem('f3xv_event_name', ev.name); }}
              style={{ background:'#161b22', border:'0.5px solid #21262d',
                borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>
              <div style={{ fontSize:12, fontWeight:500 }}>{ev.name}</div>
              <div style={{ fontSize:10, color:'#8b949e' }}>{ev.date} · {ev.location}</div>
            </div>
          ))}
        </div>
      )}

      {/* Contrôles + tabs */}
      {eventId && (
        <>
          <div style={{ display:'flex', gap:6 }}>
            <input style={{...inputStyle, flex:1}} placeholder="Pilote à suivre"
              value={target} onChange={e => { setTarget(e.target.value); localStorage.setItem('f3xv_target', e.target.value); }} />
            <button onClick={() => setPolling(p => !p)} style={{
              background: polling ? '#2ea043' : '#1f6feb', border:'none', color:'#fff',
              borderRadius:8, padding:'0 14px', cursor:'pointer', fontWeight:600 }}>
              {polling ? '⏹' : '▶'}
            </button>
          </div>

          {/* Tabs rounds / classement */}
          <div style={{ display:'flex', gap:6 }}>
            {[['rounds','Rounds'], ['classement','Classement']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
                background: tab === id ? '#1c2128' : '#161b22',
                color: tab === id ? '#58a6ff' : '#666',
                fontSize:12, fontWeight: tab === id ? 600 : 400,
                outline: tab === id ? '1px solid #58a6ff44' : 'none',
              }}>{label}</button>
            ))}
          </div>

          {/* Contenu */}
          {tab === 'rounds' && (
            <>
              {sortedRounds.length === 0 && polling && (
                <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:20 }}>
                  Chargement…
                </div>
              )}
              {sortedRounds.map(([rn, rows]) => (
                <RoundCard key={rn} round={parseInt(rn)} rows={rows} target={target} />
              ))}
            </>
          )}

          {tab === 'classement' && (
            standings.length === 0
              ? <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:20 }}>
                  {polling ? 'Chargement classement…' : 'Lance le polling pour charger le classement'}
                </div>
              : <StandingsCard standings={standings} target={target} />
          )}
        </>
      )}
    </div>
  );
}
