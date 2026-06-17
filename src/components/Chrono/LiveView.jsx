// ═══════════════════════════════════════════════════════════════════════════════
// VUE LIVE — Résultats F3XVault en direct
// ═══════════════════════════════════════════════════════════════════════════════
// Polling getEventRound toutes POLL_INTERVAL ms
// Affiche : classement round courant, écart vs pilote cible, IRPX round

import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL   = 'https://www.f3xvault.com/api.php';
const POLL_MS   = 120_000; // 2 minutes
const REF_IRP   = 8.969;   // Escueillens IRP_v6

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
    const vals = l.split(',').map(v => v.replace(/"/g, '').trim());
    return Object.fromEntries(header.map((h, i) => [h, vals[i] ?? '']));
  }).filter(r => Object.values(r).some(v => v));
}

async function searchEvents(login, password, string) {
  const body = await apiPost({ login, password, function: 'searchEvents',
    event_type_code: 'f3f', string, per_page: 20, output_type: 'json' });
  return parseCsv(body).map(r => ({
    event_id: parseInt(r[''] || r['event_id'] || Object.values(r)[0]),
    date:     Object.values(r)[1],
    name:     Object.values(r)[2],
    location: Object.values(r)[3],
  })).filter(e => e.event_id > 0);
}

async function getRound(login, password, event_id, round_number) {
  const body = await apiPost({ login, password, function: 'getEventRound',
    event_id, round_number, output_type: 'json' });
  const rows = parseCsv(body);
  return rows.map(r => ({
    pilot:   `${r.First_Name ?? ''} ${r.Last_Name ?? ''}`.trim(),
    seconds: parseFloat(r.seconds || '0'),
    wind:    parseFloat(r.wind_speed_avg || '0'),
  })).filter(r => r.seconds > 0).sort((a, b) => a.seconds - b.seconds);
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function RoundCard({ round, rows, targetPilot }) {
  if (!rows.length) return null;
  const t_best = rows[0].seconds;
  const n      = rows.length;
  const t_p25  = rows[Math.floor(0.25 * n)]?.seconds ?? t_best;
  const t_p5   = rows[Math.max(0, Math.floor(0.05 * n))]?.seconds ?? t_best;
  const irp    = ((t_p5 / t_p25) * 10 / REF_IRP).toFixed(3);
  const wind   = rows[0].wind;
  const joIdx  = rows.findIndex(r => r.pilot.toLowerCase().includes(targetPilot.toLowerCase()));
  const joRank = joIdx >= 0 ? joIdx + 1 : null;

  return (
    <div style={{ background:'#0f0f0f', border:'0.5px solid #1e2535',
      borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:11, color:'#8b949e', fontWeight:700, letterSpacing:1 }}>
          ROUND {round}
        </span>
        <span style={{ fontSize:11, color:'#4a9eff' }}>
          {wind > 0 ? `${wind.toFixed(1)} m/s` : '—'} · K {irp}
        </span>
      </div>

      {/* Top 5 */}
      {rows.slice(0, 5).map((r, i) => {
        const isJo = joIdx === i;
        return (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'4px 6px', borderRadius:6, marginBottom:2,
            background: isJo ? '#0d1f2d' : 'transparent',
            border: isJo ? '0.5px solid #4a9eff44' : 'none',
          }}>
            <span style={{ fontSize:10, color:'#444', minWidth:18 }}>{i+1}.</span>
            <span style={{ fontSize:12, color: isJo ? '#4a9eff' : '#ccc', flex:1 }}>{r.pilot}</span>
            <span style={{ fontSize:14, fontWeight:500, color: isJo ? '#4a9eff' : '#e8eaf0',
              fontVariantNumeric:'tabular-nums' }}>{r.seconds.toFixed(2)}s</span>
          </div>
        );
      })}

      {/* Jo hors top 5 */}
      {joIdx >= 5 && (
        <div style={{ borderTop:'0.5px solid #1a2535', marginTop:4, paddingTop:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 6px',
            background:'#0d1f2d', borderRadius:6, border:'0.5px solid #4a9eff44' }}>
            <span style={{ fontSize:10, color:'#4a9eff', minWidth:18 }}>{joRank}.</span>
            <span style={{ fontSize:12, color:'#4a9eff', flex:1 }}>{rows[joIdx].pilot}</span>
            <span style={{ fontSize:14, fontWeight:500, color:'#4a9eff',
              fontVariantNumeric:'tabular-nums' }}>{rows[joIdx].seconds.toFixed(2)}s</span>
          </div>
          {joRank > 1 && (
            <div style={{ fontSize:10, color:'#555', textAlign:'right', marginTop:2 }}>
              +{(rows[joIdx].seconds - rows[joRank-2].seconds).toFixed(2)}s vs #{joRank-1}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize:9, color:'#444', textAlign:'right', marginTop:4 }}>
        {n} pilotes · T_best {t_best.toFixed(2)}s · T_P25 {t_p25.toFixed(2)}s
      </div>
    </div>
  );
}

// ── Composant principal LiveView ──────────────────────────────────────────────
export default function LiveView({ onBack }) {
  const [login, setLogin]       = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch]     = useState('');
  const [events, setEvents]     = useState([]);
  const [eventId, setEventId]   = useState(null);
  const [eventName, setEventName] = useState('');
  const [target, setTarget]     = useState('Carrion');
  const [rounds, setRounds]     = useState({});   // { round_number: rows[] }
  const [lastRound, setLastRound] = useState(0);
  const [polling, setPolling]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError]       = useState('');
  const timerRef = useRef(null);
  const creds    = { login, password };

  // Recherche events
  async function doSearch() {
    if (!login || !password || !search) return;
    setError('');
    try {
      const res = await searchEvents(login, password, search);
      setEvents(res);
    } catch(e) { setError('Erreur réseau'); }
  }

  // Charge un round
  const loadRound = useCallback(async (rn) => {
    try {
      const rows = await getRound(login, password, eventId, rn);
      if (rows.length > 0) {
        setRounds(prev => ({ ...prev, [rn]: rows }));
        setLastRound(rn);
        setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
        return true;
      }
      return false;
    } catch { return false; }
  }, [login, password, eventId]);

  // Polling : charge tous les rounds depuis le dernier connu
  const doPoll = useCallback(async () => {
    if (!eventId) return;
    let rn = Math.max(1, lastRound);
    while (true) {
      const ok = await loadRound(rn);
      if (!ok) break;
      rn++;
    }
  }, [eventId, lastRound, loadRound]);

  // Démarre/arrête le polling
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

  const sortedRounds = Object.entries(rounds)
    .sort(([a],[b]) => parseInt(b) - parseInt(a));

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      background:'#0b0e12', color:'#c9d1d9', padding:'10px 12px',
      overflowY:'auto', boxSizing:'border-box', gap:8 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <button onClick={onBack} style={{ background:'none', border:'none',
          color:'#4a9eff', fontSize:18, cursor:'pointer', padding:'0 4px' }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'#8b949e', textTransform:'uppercase', letterSpacing:1 }}>
            Live F3XVault
          </div>
          {eventName && (
            <div style={{ fontSize:13, fontWeight:600, color:'#58a6ff' }}>{eventName}</div>
          )}
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
            <input style={{...inputStyle, flex:1}} placeholder="Nom du concours (ex: Sederon)"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()} />
            <button onClick={doSearch} style={{
              background:'#1f6feb', border:'none', color:'#fff',
              borderRadius:8, padding:'0 14px', cursor:'pointer', fontWeight:600 }}>
              ⌕
            </button>
          </div>
          {error && <div style={{ fontSize:11, color:'#f85149' }}>{error}</div>}
          {events.map((ev, i) => (
            <div key={i} onClick={() => { setEventId(ev.event_id); setEventName(ev.name); }}
              style={{ background:'#161b22', border:'0.5px solid #21262d',
                borderRadius:8, padding:'8px 12px', cursor:'pointer' }}>
              <div style={{ fontSize:12, fontWeight:500 }}>{ev.name}</div>
              <div style={{ fontSize:10, color:'#8b949e' }}>{ev.date} · {ev.location}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pilote cible + contrôles */}
      {eventId && (
        <>
          <div style={{ display:'flex', gap:6 }}>
            <input style={{...inputStyle, flex:1}} placeholder="Pilote à suivre"
              value={target} onChange={e => setTarget(e.target.value)} />
            <button onClick={() => setPolling(p => !p)} style={{
              background: polling ? '#2ea043' : '#1f6feb',
              border:'none', color:'#fff', borderRadius:8,
              padding:'0 14px', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}>
              {polling ? '⏹ Stop' : '▶ Start'}
            </button>
          </div>

          {/* Rounds */}
          {sortedRounds.length === 0 && polling && (
            <div style={{ color:'#555', fontSize:12, textAlign:'center', padding:20 }}>
              Chargement des rounds…
            </div>
          )}
          {sortedRounds.map(([rn, rows]) => (
            <RoundCard key={rn} round={parseInt(rn)} rows={rows} targetPilot={target} />
          ))}
        </>
      )}
    </div>
  );
}
