import { useState, useEffect, useRef, useCallback } from 'react';
import { useESPStore } from '../../stores/espStore';

// ── Dexie (IndexedDB) setup ──────────────────────────────────────────────────
import Dexie from 'dexie';
const db = new Dexie('ChronoDB');
db.version(1).stores({
  pilotes: '++id, nom',
  runs:    '++id, pilote_id, manche, concours_id, t_start',
  concours:'++id, site, date',
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDuree(ms) {
  if (ms == null || ms === 0) return '—';
  const s = ms / 1000;
  return s.toFixed(2);
}
function fmtDisplay(ms) {
  if (ms == null) return '00.00';
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(2).padStart(5, '0');
  return m > 0 ? `${m}:${sec}` : sec;
}

// ── Pilotes par défaut ────────────────────────────────────────────────────────
const PILOTES_DEFAULT = [
  { id: 1, nom: 'Pilote 1', couleur: '#EF9F27' },
  { id: 2, nom: 'Pilote 2', couleur: '#1D9E75' },
  { id: 3, nom: 'Pilote 3', couleur: '#378ADD' },
  { id: 4, nom: 'Pilote 4', couleur: '#D85A30' },
  { id: 5, nom: 'Pilote 5', couleur: '#7F77DD' },
];

// ── Couleurs par pilote index ─────────────────────────────────────────────────
const COULEURS = ['#EF9F27', '#1D9E75', '#378ADD', '#D85A30', '#7F77DD'];

export default function ChronoPage() {
  // ── State principal ──────────────────────────────────────────────────────
  const [pilotes, setPilotes]         = useState(PILOTES_DEFAULT);
  const [piloteActif, setPiloteActif] = useState(0);           // index
  const [manche, setManche]           = useState(1);
  const [runs, setRuns]               = useState([]);          // [{id, pilote_id, manche, duree_ms, iqa_snap, vent_snap, bulle_snap, t_start}]
  const [running, setRunning]         = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [editNom, setEditNom]         = useState(null);        // index pilote en édition
  const [editVal, setEditVal]         = useState('');
  const [showReset, setShowReset]     = useState(false);

  // ── IQA depuis store (live) ───────────────────────────────────────────────
  const iqa   = useESPStore(s => s.data.iqa)   ?? 0;
  const vent  = useESPStore(s => s.data.spd)   ?? 0;
  const sGrad = useESPStore(s => s.data.sGrad) ?? 0;
  const bulle = useESPStore(s => s.data.bulle) ?? false;

  const sendMarker   = useESPStore(s => s.sendMarker);
  const espConnected = useESPStore(s => s.connected);
  const sdActive     = useESPStore(s => s.sdActive);

  // ── Chrono interne ────────────────────────────────────────────────────────
  const t0Ref       = useRef(null);
  const rafRef      = useRef(null);
  const isBulleRef  = useRef(bulle);
  useEffect(() => { isBulleRef.current = bulle; }, [bulle]);

  const tick = useCallback(() => {
    setElapsed(Date.now() - t0Ref.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStartStop = useCallback(() => {
    if (!running) {
      // START
      t0Ref.current = Date.now();
      setElapsed(0);
      setRunning(true);
      rafRef.current = requestAnimationFrame(tick);
      if (navigator.vibrate) navigator.vibrate(40);
      sendMarker(manche, 'START');
    } else {
      // STOP → snapshot IQA
      cancelAnimationFrame(rafRef.current);
      const duree_ms   = Date.now() - t0Ref.current;
      const iqaSnap    = iqa;
      const ventSnap   = vent;
      const sGradSnap  = sGrad;
      const bulleSnap  = isBulleRef.current;
      setRunning(false);
      setElapsed(0);
      sendMarker(manche, 'PAUSE');

      const newRun = {
        id:         Date.now(),
        pilote_id:  piloteActif,
        manche,
        duree_ms,
        iqa_snap:   iqaSnap,
        vent_snap:  ventSnap,
        sgrad_snap: sGradSnap,
        bulle_snap: bulleSnap,
        t_start:    t0Ref.current,
      };

      setRuns(prev => [newRun, ...prev]);
      // Persist Dexie (best-effort)
      db.runs.add(newRun).catch(() => {});

      if (navigator.vibrate) navigator.vibrate([30, 50, 80]);
    }
  }, [running, iqa, vent, sGrad, piloteActif, manche, tick, sendMarker]);

  // Cleanup RAF on unmount
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // ── Chargement depuis Dexie au mount ─────────────────────────────────────
  useEffect(() => {
    db.runs.orderBy('t_start').reverse().limit(50).toArray()
      .then(r => { if (r.length) setRuns(r); })
      .catch(() => {});
  }, []);

  // ── Pilote actif data ─────────────────────────────────────────────────────
  const runsActif = runs.filter(r => r.pilote_id === piloteActif);
  const bestActif = runsActif.length
    ? Math.min(...runsActif.map(r => r.duree_ms))
    : null;
  const couleurActif = COULEURS[piloteActif] ?? '#EF9F27';

  // ── Best par pilote (chips) ───────────────────────────────────────────────
  function bestPour(idx) {
    const r = runs.filter(x => x.pilote_id === idx);
    return r.length ? Math.min(...r.map(x => x.duree_ms)) : null;
  }

  // ── Edition nom pilote ────────────────────────────────────────────────────
  function startEdit(idx) {
    setEditNom(idx);
    setEditVal(pilotes[idx].nom);
  }
  function commitEdit() {
    if (editNom === null) return;
    const v = editVal.trim().slice(0, 12) || pilotes[editNom].nom;
    setPilotes(prev => prev.map((p, i) => i === editNom ? { ...p, nom: v } : p));
    setEditNom(null);
  }

  // ── Reset concours ────────────────────────────────────────────────────────
  function resetConcours() {
    setRuns([]);
    setManche(1);
    setRunning(false);
    setElapsed(0);
    setShowReset(false);
    db.runs.clear().catch(() => {});
  }

  // ── Export JSON ───────────────────────────────────────────────────────────
  function exportJSON() {
    const data = {
      export_date: new Date().toISOString(),
      pilotes: pilotes.map((p, i) => ({ id: i, nom: p.nom })),
      runs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `f3f_chrono_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }

  // ── IQA couleur ──────────────────────────────────────────────────────────
  function iqaColor(v) {
    if (v >= 0.75) return '#1D9E75';
    if (v >= 0.50) return '#EF9F27';
    return '#E24B4A';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100dvh - 42px)',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'var(--font-sans, sans-serif)',
      overflowY: 'auto',
      userSelect: 'none',
    }}>

      {/* ── BARRE IQA LIVE ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: '#111',
        borderBottom: '0.5px solid #222',
        flexShrink: 0,
      }}>
        <span style={{
          background: iqaColor(iqa),
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          padding: '2px 9px',
          borderRadius: 99,
        }}>IQA</span>

        <span style={{ fontSize: 15, fontWeight: 500, color: iqaColor(iqa) }}>
          {iqa.toFixed(2)}
        </span>

        <span style={{ fontSize: 11, color: '#666' }}>
          {vent.toFixed(1)} m/s
        </span>

        {/* Indicateur BULLE ou S_GRAD */}
        {bulle ? (
          <BulleIndicator />
        ) : (
          <span style={{
            fontSize: 11,
            color: sGrad > 0 ? '#1D9E75' : '#555',
            marginLeft: 4,
            fontVariantNumeric: 'tabular-nums',
          }}>
            S_GRAD {sGrad >= 0 ? '+' : ''}{sGrad.toFixed(2)}
          </span>
        )}

        {/* Manche selector à droite */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background: espConnected ? "#1D9E75" : "#444", flexShrink:0 }} /><span style={{ fontSize:11, color:"#555", marginLeft:4 }}>M</span>
          <button
            onClick={() => !running && setManche(m => Math.max(1, m - 1))}
            style={btnMini}
          >−</button>
          <span style={{ fontSize: 14, fontWeight: 500, minWidth: 20, textAlign: 'center' }}>
            {manche}
          </span>
          <button
            onClick={() => !running && setManche(m => Math.min(16, m + 1))}
            style={btnMini}
          >+</button>
        </div>
      </div>

      {/* ── SÉLECTEUR PILOTE ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        overflowX: 'auto',
        flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {pilotes.map((p, i) => {
          const best = bestPour(i);
          const active = i === piloteActif;
          const col = COULEURS[i];
          return (
            <div
              key={i}
              onClick={() => !running && setPiloteActif(i)}
              onDoubleClick={() => startEdit(i)}
              style={{
                flexShrink: 0,
                minWidth: 64,
                background: active ? '#0f0f0f' : '#141414',
                border: `1.5px solid ${active ? col : '#2a2a2a'}`,
                borderRadius: 10,
                padding: '7px 10px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              {editNom === i ? (
                <input
                  autoFocus
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => e.key === 'Enter' && commitEdit()}
                  style={{
                    width: 56,
                    background: 'transparent',
                    border: 'none',
                    color: col,
                    fontSize: 12,
                    fontWeight: 500,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                  maxLength={12}
                />
              ) : (
                <div style={{ fontSize: 12, fontWeight: 500, color: active ? col : '#888' }}>
                  {p.nom}
                </div>
              )}
              <div style={{ fontSize: 10, color: active ? col : '#444', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {best ? formatDuree(best) : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DISPLAY CHRONO ─────────────────────────────────────────────── */}
      <div style={{
        margin: '0 12px 8px',
        background: '#050505',
        border: `1.5px solid ${running ? couleurActif : '#1a1a1a'}`,
        borderRadius: 14,
        padding: '14px 16px 12px',
        textAlign: 'center',
        flexShrink: 0,
        transition: 'border-color 0.2s',
      }}>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 4, letterSpacing: '0.08em' }}>
          {pilotes[piloteActif].nom}
          <span style={{ color: '#333', margin: '0 6px' }}>·</span>
          manche {manche}
        </div>

        <div style={{
          fontSize: 58,
          fontWeight: 500,
          letterSpacing: -1,
          color: running ? couleurActif : '#fff',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          marginBottom: 6,
          transition: 'color 0.15s',
        }}>
          {fmtDisplay(running ? elapsed : null)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: '#444' }}>
          <span>best <span style={{ color: '#888', fontVariantNumeric: 'tabular-nums' }}>
            {bestActif ? formatDuree(bestActif) : '—'}
          </span></span>
          <span>IQA snap <span style={{ color: '#888' }}>
            {runs.find(r => r.pilote_id === piloteActif)?.iqa_snap?.toFixed(2) ?? '—'}
          </span></span>
        </div>
      </div>

      {/* ── BOUTON START / STOP ────────────────────────────────────────── */}
      <button
        onClick={handleStartStop}
        style={{
          margin: '0 12px 10px',
          height: 76,
          borderRadius: 16,
          border: 'none',
          background: running ? '#8b1a1a' : '#0d4a36',
          color: '#fff',
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
          transition: 'background 0.15s',
          outline: 'none',
        }}
        onTouchStart={() => {}} // active :active sur iOS
      >
        {running ? (
          <>
            <div style={{ width: 20, height: 20, background: '#E24B4A', borderRadius: 3 }} />
            <span style={{ color: '#E24B4A' }}>STOP</span>
          </>
        ) : (
          <>
            <div style={{
              width: 0, height: 0,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderLeft: '20px solid #1D9E75',
            }} />
            <span style={{ color: '#1D9E75' }}>START</span>
          </>
        )}
      </button>

      {/* ── LISTE DES RUNS ─────────────────────────────────────────────── */}
      <div style={{ padding: '0 12px', flex: 1, overflowY: 'auto' }}>

        <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Runs enregistrés — {runs.length}
        </div>

        {runs.length === 0 && (
          <div style={{ textAlign: 'center', color: '#333', fontSize: 13, padding: '24px 0' }}>
            Aucun run pour ce concours
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
              display: 'flex',
              alignItems: 'center',
              background: '#0f0f0f',
              borderRadius: 8,
              padding: '7px 10px',
              marginBottom: 4,
              gap: 8,
              border: isBest ? `0.5px solid ${col}33` : '0.5px solid #1a1a1a',
            }}>
              <div style={{ fontSize: 10, color: '#444', minWidth: 22, textAlign: 'center' }}>
                M{r.manche}
              </div>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: col, flexShrink: 0,
              }} />
              <div style={{ fontSize: 12, color: isBest ? col : '#999', flex: 1, fontWeight: isBest ? 500 : 400 }}>
                {p?.nom ?? '?'}
              </div>
              <div style={{
                fontSize: 16, fontWeight: 500,
                color: isBest ? col : '#ccc',
                fontVariantNumeric: 'tabular-nums',
                minWidth: 58, textAlign: 'right',
              }}>
                {formatDuree(r.duree_ms)}
              </div>
              {/* IQA snap */}
              <div style={{ fontSize: 10, color: iqaColor(r.iqa_snap ?? 0), minWidth: 30, textAlign: 'right' }}>
                {r.iqa_snap?.toFixed(2) ?? '—'}
              </div>
              {/* Bulle indicator */}
              {r.bulle_snap && (
                <div style={{
                  fontSize: 9, color: '#00e5cc', fontWeight: 500,
                  padding: '1px 5px', borderRadius: 4,
                  border: '0.5px solid #00e5cc44',
                }}>
                  B
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 12px 16px',
        flexShrink: 0,
        borderTop: '0.5px solid #1a1a1a',
      }}>
        <button onClick={exportJSON} style={btnFooter}>
          Export JSON
        </button>
        <button
          onClick={() => setShowReset(true)}
          style={{ ...btnFooter, color: '#8b2020' }}
        >
          Réinit.
        </button>
      </div>

      {/* ── MODAL RESET ────────────────────────────────────────────────── */}
      {showReset && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: '#111', border: '0.5px solid #333',
            borderRadius: 16, padding: 24, maxWidth: 280, width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
              Réinitialiser le concours ?
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>
              Tous les runs seront effacés. Cette action est irréversible.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowReset(false)}
                style={{ ...btnFooter, flex: 1, height: 44, fontSize: 13 }}
              >
                Annuler
              </button>
              <button
                onClick={resetConcours}
                style={{ ...btnFooter, flex: 1, height: 44, fontSize: 13, color: '#E24B4A', borderColor: '#8b2020' }}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant BULLE clignotant ───────────────────────────────────────────────
function BulleIndicator() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVisible(v => !v), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <span style={{
      fontSize: 11,
      fontWeight: 500,
      color: visible ? '#00e5cc' : 'transparent',
      padding: '2px 8px',
      borderRadius: 4,
      border: `0.5px solid ${visible ? '#00e5cc66' : 'transparent'}`,
      letterSpacing: '0.06em',
      transition: 'color 0.1s, border-color 0.1s',
      marginLeft: 4,
    }}>
      BULLE ASCENDANTE
    </span>
  );
}

// ── Styles partagés ──────────────────────────────────────────────────────────
const btnMini = {
  width: 24, height: 24,
  background: '#1a1a1a',
  border: '0.5px solid #333',
  borderRadius: 6,
  color: '#888',
  fontSize: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
};

const btnFooter = {
  flex: 1, height: 38,
  background: '#141414',
  border: '0.5px solid #2a2a2a',
  borderRadius: 8,
  color: '#666',
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
