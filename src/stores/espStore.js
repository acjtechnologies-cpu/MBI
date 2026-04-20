import { create } from 'zustand'

// ═══════════════════════════════════════════════════════════════════
// _ws hors React — architecture validée anti-freeze Android
// Ne jamais stocker le WebSocket dans le state Zustand
// (setState sur ws → re-renders → gel touch sur Android)
// ═══════════════════════════════════════════════════════════════════
let _ws              = null
let _reconnectTimer  = null
let _heartbeatTimer  = null

const ESP_CONFIG = {
  wsUrl:             'ws://192.168.4.1:81',
  httpUrl:           'http://192.168.4.1',
  reconnectDelay:    2000,
  heartbeatInterval: 5000,
  timeout:           10000,
}

// ── Helper envoi robuste ─────────────────────────────────────────
function wsSend(obj) {
  if (_ws && _ws.readyState === WebSocket.OPEN) {
    try {
      _ws.send(JSON.stringify(obj))
      return true
    } catch (e) {
      console.error('[ESP] send error', e)
    }
  }
  return false
}

export const useESPStore = create((set, get) => ({
  // ── ÉTAT (minimal — pas de ws ici) ──────────────────────────────
  connected:   false,
  connecting:  false,
  mode:        null,   // 'websocket' | 'http' | null
  lastUpdate:  null,
  error:       null,
  sdActive:    false,  // état carte SD reçu de l'ESP32

  // ── DONNÉES CAPTEURS ────────────────────────────────────────────
  data: {
    iqa:         null,
    spd:         null,
    temperature: null,
    pression:    null,
    humidity:    null,
    rho:         null,
    bulle:       false,
    sGrad:       null,
    sHeli:       null,
    sTurb:       null,
    vbat:        null,
  },

  // ── BUFFER HISTORIQUE ────────────────────────────────────────────
  buffer:     [],
  bufferSize: 100,

  // ── CONNEXION WEBSOCKET ─────────────────────────────────────────
  connectWebSocket: () => {
    if (_ws || get().connected) return

    set({ connecting: true, error: null })

    try {
      const socket = new WebSocket(ESP_CONFIG.wsUrl)
      _ws = socket

      socket.onopen = () => {
        set({ connected: true, connecting: false, mode: 'websocket', error: null })

        // Sync horloge — ESP32 reçoit {"cmd":"SET_TIME","epoch":...}
        wsSend({ cmd: 'SET_TIME', epoch: Math.floor(Date.now() / 1000) })

        // Heartbeat
        _heartbeatTimer = setInterval(() => {
          wsSend({ type: 'ping' })
        }, ESP_CONFIG.heartbeatInterval)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          get().updateData(data)
        } catch (e) {
          console.error('[ESP] parse error', e)
        }
      }

      socket.onerror = () => {
        set({ error: 'WebSocket error' })
      }

      socket.onclose = () => {
        _ws = null
        if (_heartbeatTimer) { clearInterval(_heartbeatTimer); _heartbeatTimer = null }
        set({ connected: false, connecting: false, mode: null })
        // Reconnexion auto
        _reconnectTimer = setTimeout(() => get().connectWebSocket(), ESP_CONFIG.reconnectDelay)
      }

    } catch (e) {
      _ws = null
      set({ connecting: false, error: e.message })
      get().connectHTTP()
    }
  },

  // ── DÉCONNEXION ─────────────────────────────────────────────────
  disconnectWebSocket: () => {
    if (_reconnectTimer) { clearTimeout(_reconnectTimer);  _reconnectTimer = null }
    if (_heartbeatTimer) { clearInterval(_heartbeatTimer); _heartbeatTimer = null }
    if (_ws) { _ws.close(); _ws = null }
    set({ connected: false, connecting: false, mode: null })
  },

  // ── CONNEXION HTTP (fallback polling) ───────────────────────────
  connectHTTP: async () => {
    set({ connecting: true, mode: 'http', error: null })

    const poll = async () => {
      if (get().mode !== 'http') return
      try {
        const r = await fetch(`${ESP_CONFIG.httpUrl}/data`, {
          signal: AbortSignal.timeout(ESP_CONFIG.timeout),
        })
        if (!r.ok) throw new Error('HTTP error')
        const data = await r.json()
        get().updateData(data)
        set({ connected: true, connecting: false, error: null })
      } catch (e) {
        set({ error: e.message })
      }
      setTimeout(poll, 1000)
    }

    poll()
  },

  // ── UPDATE DONNÉES CAPTEURS ─────────────────────────────────────
  // Mappe les champs JSON ESP32 (IQA, SPD, TEMP…) vers le store
  updateData: (raw) => {
    const now = Date.now()

    set(state => {
      const d = {
        iqa:         raw.IQA         ?? state.data.iqa,
        spd:         raw.SPD         ?? state.data.spd,
        temperature: raw.TEMP        ?? state.data.temperature,
        pression:    raw.PRES        ?? state.data.pression,
        humidity:    raw.HUM         ?? state.data.humidity,
        rho:         raw.RHO         ?? state.data.rho,
        bulle:       raw.BULLE !== undefined ? !!raw.BULLE : state.data.bulle,
        sGrad:       raw.S_GRAD      ?? state.data.sGrad,
        sHeli:       raw.S_HELI      ?? state.data.sHeli,
        sTurb:       raw.S_TURB      ?? state.data.sTurb,
        vbat:        raw.VBAT        ?? state.data.vbat,
      }

      const newBuffer = [
        ...state.buffer,
        { timestamp: now, ...d },
      ].slice(-state.bufferSize)

      return {
        data:       d,
        buffer:     newBuffer,
        lastUpdate: now,
        sdActive:   raw.SD !== undefined ? !!raw.SD : state.sdActive,
      }
    })
  },

  // ── COMMANDES ESP32 ─────────────────────────────────────────────

  // Marker de run — {"cmd":"MARKER","run":N,"state":"START|PAUSE"}
  // Appelé depuis ChronoPage sur START et STOP
  sendMarker: (run, state) => {
    const ok = wsSend({ cmd: 'MARKER', run, state })
    if (!ok) console.warn(`[ESP] sendMarker ${state} RUN ${run} — non connecté`)
  },

  // Fermeture propre SD — {"cmd":"CLOSE_SD"}
  closeSD: () => wsSend({ cmd: 'CLOSE_SD' }),

  // Commande générique (PID, etc.)
  sendCommand: (command) => {
    if (get().mode === 'websocket') return wsSend(command)
    if (get().mode === 'http') {
      fetch(`${ESP_CONFIG.httpUrl}/command`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(command),
      }).catch(e => console.error('[ESP] HTTP command failed', e))
    }
    return false
  },

  // Nettoyer le buffer
  clearBuffer: () => set({ buffer: [] }),

  // Statistiques buffer
  getBufferStats: () => {
    const { buffer } = get()
    if (!buffer.length) return null
    const stat = (key) => {
      const vals = buffer.map(d => d[key]).filter(v => v != null)
      if (!vals.length) return null
      return {
        min: Math.min(...vals),
        max: Math.max(...vals),
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        count: vals.length,
      }
    }
    return {
      iqa:      stat('iqa'),
      spd:      stat('spd'),
      temp:     stat('temperature'),
      duration: buffer.length > 1
        ? buffer[buffer.length - 1].timestamp - buffer[0].timestamp
        : 0,
    }
  },
}))
