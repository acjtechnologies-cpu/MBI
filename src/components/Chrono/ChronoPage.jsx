import Dexie from 'dexie';
import LiveView from './LiveView';

// Dexie - ChronoDB v4 (sites_k utilise par Poly4Page)
const db = new Dexie('ChronoDB');
db.version(3).stores({ runs: '++id, pilote_id, manche, session_id, t_start' }).upgrade(tx => {
  return tx.table('runs').toCollection().modify(run => { if (!run.session_id) run.session_id = run.t_start || 0; });
});
db.version(4).stores({ runs: '++id, pilote_id, manche, session_id, t_start', sites_k: 'name' });
export { db };

export default function ChronoPage({ onNavigate } = {}) {
  return <LiveView />;
}