/**
 * MBI vNext - ESP32 Store v11
 * WebSocket persistante globale -- survit aux changements d'onglet
 * IQA v3 : S_GRAD NTC + detection bulle ascendante F3F
 * Vibration : 3 impulsions courtes quand bulle detectee
 */
import { create } from 'zustand'
import { ESP32_CONFIG } from './constants'

const WS_URL = 'ws://192.168.4.1:81'

let _ws = null
let _demoTimer = null
let _prevBulle = false
let _bullePending = false
let _wakeLock = null

async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return
  try {
    _wakeLock = await navigator.wakeLock.request('screen')
    _wakeLock.addEventListener('release', () => { _wakeLock = null })
  } catch(e) {}
}

function releaseWakeLock() {
  if (_wakeLock) { try { _wakeLock.release() } catch(e) {} _wakeLock = null }
}

// Reacquiert le wake lock si la page redevient visible (retour depuis autre onglet)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && (_ws || _demoTimer)) {
    acquireWakeLock()
  }
})   // etat bulle precedent pour detection front montant


function vibreBulle() {
  if (!navigator.vibrate) return
  try {
    const ok = navigator.vibrate([120, 60, 120, 60, 120])
    if (!ok) _bullePending = true   // bloque par browser -- on retente au prochain tap
  } catch(e) { _bullePending = true }
}

// Appeler sur chaque interaction utilisateur (touchstart/click sur la page)
export function flushBulleVibration() {
  if (_bullePending && navigator.vibrate) {
    navigator.vibrate([120, 60, 120, 60, 120])
    _bullePending = false
  }
}

export const useESPStore = create((set, get) => ({

  connected: false,
  wsStatus: 'off',
  lastUpdate: null,
  error: null,
  demo: false,

  data: {
    IQA: 0, SPD: 0, SPD_AVG: 0, SPD_PITOT: 0, SPD_ANEMO: 0,
    ALIGN: 0, TURB: 0, HELI: 0, COH: 0,
    GRAD_C: 0,
    ANG: 0, SERVO: 0,
    TEMP: 15, PRES: 1013.25, HUM: 50, ALT: 0, RHO: 1.225, VBAT: 11.1,
    S_TURB: 0, S_VIT: 0, S_HELI: 0, S_GRAD: 0, S_COH: 0, S_COH_STAR: 0,
    BULLE: 0,
  },

  turbBuf: Array(60).fill(0),
  turbSigma: 0,
  pid: { kp: 1.2, ki: 0.05, kd: 0.30 },

  _setStatus: (wsStatus) => set({ wsStatus, connected: wsStatus === 'live' }),

  _handleData: (incoming, setAltitude) => {
    const next = { ...get().data, ...incoming }
    set({ data: next, lastUpdate: Date.now(), error: null })

    // Altitude -> appStore partage
    if (incoming.ALT !== undefined && incoming.ALT > 0 && setAltitude) {
      setAltitude(Math.round(incoming.ALT))
    }

    // Vibration bulle -- front montant uniquement (pas de bulle -> bulle)
    // Une seule rafale de 3 impulsions au moment de l'apparition
    const bulleNow = incoming.BULLE === 1
    if (bulleNow && !_prevBulle) {
      vibreBulle()
    }
    _prevBulle = bulleNow

    // Buffer oscillogramme TURB
    if (incoming.TURB !== undefined) {
      const buf = [...get().turbBuf, incoming.TURB]
      if (buf.length > 60) buf.shift()
      const mean  = buf.reduce((a, b) => a + b, 0) / buf.length
      const sigma = Math.sqrt(buf.reduce((a, b) => a + (b - mean) ** 2, 0) / buf.length)
      set({ turbBuf: buf, turbSigma: sigma })
    }
  },

  wsConnect: (setAltitude) => {
    if (_ws) { try { _ws.close() } catch (e) {} }
    get()._setStatus('connecting')
    try {
      _ws = new WebSocket(WS_URL)
      _ws.onopen    = () => { get()._setStatus('live'); acquireWakeLock() }
      _ws.onclose   = () => get()._setStatus('off')
      _ws.onerror   = () => {
        get()._setStatus('err')
        setTimeout(() => get()._setStatus('off'), 2000)
      }
      _ws.onmessage = (e) => {
        try { get()._handleData(JSON.parse(e.data), setAltitude) } catch (_) {}
      }
    } catch (_) { get()._setStatus('err') }
  },

  wsStop: () => {
    if (_ws) { try { _ws.close() } catch (e) {} }
    _ws = null
    _prevBulle = false
    releaseWakeLock()
    get()._setStatus('off')
  },

  sendPid: () => {
    const { pid, wsStatus } = get()
    if (_ws && wsStatus === 'live') _ws.send(JSON.stringify(pid))
  },

  setPid: (k, step) => {
    const prev = get().pid
    set({ pid: { ...prev, [k]: Math.max(0, parseFloat((prev[k] + step).toFixed(3))) } })
  },

  startDemo: (setAltitude) => {
    if (_demoTimer) clearInterval(_demoTimer)
    set({ demo: true })
    acquireWakeLock()
    let t = 0
    _demoTimer = setInterval(() => {
      t++
      const spd    = 8 + 3 * Math.sin(t * 0.08) + (Math.random() - 0.5) * 1.5
      const turb   = 0.01 + 0.05 * Math.abs(Math.sin(t * 0.11)) + Math.random() * 0.015
      const ang    = 12 * Math.sin(t * 0.12) + (Math.random() - 0.5) * 4

      // Cycle bulle : toutes les 15s une bulle de 4s
      const phase  = t % 15
      const bulle_phase = phase >= 6 && phase <= 9

      // grad_c fort positif pendant la bulle, negatif sinon
      const grad_c = bulle_phase
        ? 0.08 + Math.random() * 0.04
        : -0.03 + (Math.random() - 0.5) * 0.04

      // s_heli : stable pendant bulle (vent structure), agite sinon
      const s_heli_raw = bulle_phase
        ? 0.55 + Math.random() * 0.25
        : 0.20 + Math.random() * 0.40

      const s_grad = 1 / (1 + Math.exp(-8 * grad_c))
      const s_heli = parseFloat(s_heli_raw.toFixed(3))
      const s_turb = parseFloat((bulle_phase ? 0.75 + Math.random()*0.2 : 0.3 + Math.random()*0.4).toFixed(3))
      const s_vit  = parseFloat((bulle_phase ? 0.70 + Math.random()*0.2 : 0.35 + Math.random()*0.35).toFixed(3))
      const bulle  = (s_grad > 0.65 && s_heli > 0.50) ? 1 : 0

      // IQA calcule depuis les scores (reflete la realite)
      const iqa_raw = (0.35*s_turb + 0.30*s_vit + 0.20*s_heli + 0.15*s_grad) * 10
      const iqa = parseFloat(Math.min(9.8, Math.max(2.0, iqa_raw)).toFixed(2))

      get()._handleData({
        IQA:       iqa,
        SPD:       parseFloat(Math.max(2, spd).toFixed(1)),
        SPD_AVG:   parseFloat((spd * 0.95).toFixed(1)),
        SPD_PITOT: parseFloat((spd + 0.3).toFixed(1)),
        SPD_ANEMO: parseFloat((spd - 0.2).toFixed(1)),
        ALIGN:     parseFloat((0.65 + 0.25 * Math.random()).toFixed(2)),
        TURB:      parseFloat(turb.toFixed(4)),
        HELI:      parseFloat((bulle_phase ? 3 + Math.random()*5 : 8 + Math.random()*14).toFixed(1)),
        COH:       parseFloat((0.06 + Math.random() * 0.05).toFixed(3)),
        GRAD_C:    parseFloat(grad_c.toFixed(4)),
        ANG:       parseFloat(ang.toFixed(1)),
        SERVO:     parseFloat((ang * 0.85).toFixed(1)),
        TEMP:      parseFloat((14.2 + 0.15 * Math.sin(t * 0.02)).toFixed(1)),
        PRES:      parseFloat((918.3 + Math.random() * 0.4).toFixed(1)),
        HUM:       Math.round(62 + Math.random() * 2),
        ALT: 724, RHO: 1.081,
        VBAT:      parseFloat((11.4 - t * 0.001).toFixed(2)),
        S_TURB:    s_turb,
        S_VIT:     s_vit,
        S_HELI:    s_heli,
        S_GRAD:    parseFloat(s_grad.toFixed(3)),
        S_COH:     parseFloat((0.80 + 0.15 * Math.random()).toFixed(3)),
        S_COH_STAR: parseFloat((0.82 + 0.13 * Math.random()).toFixed(3)),
        BULLE:     bulle,
      }, setAltitude)
    }, 1000)
  },

  stopDemo: () => {
    if (_demoTimer) clearInterval(_demoTimer)
    _demoTimer = null
    _prevBulle = false
    releaseWakeLock()
    set({ demo: false })
  },

  isOnline: () => {
    const { connected, lastUpdate } = get()
    if (!connected || !lastUpdate) return false
    return (Date.now() - lastUpdate) < (ESP32_CONFIG.OFFLINE_TIMEOUT_MS || 5000)
  },

  getAge: () => {
    const { lastUpdate } = get()
    if (!lastUpdate) return null
    return Math.floor((Date.now() - lastUpdate) / 1000)
  },

  reset: () => {
    get().wsStop()
    get().stopDemo()
    set({ connected: false, wsStatus: 'off', lastUpdate: null, error: null, demo: false,
          turbBuf: Array(60).fill(0), turbSigma: 0 })
  },
}))
