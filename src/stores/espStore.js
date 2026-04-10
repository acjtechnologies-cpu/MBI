import { create } from 'zustand'

// Configuration ESP32
const ESP_CONFIG = {
  wsUrl: 'ws://192.168.4.1:81',      // WebSocket par défaut
  httpUrl: 'http://192.168.4.1',     // Fallback HTTP
  reconnectDelay: 2000,               // Délai reconnexion (ms)
  heartbeatInterval: 5000,            // Heartbeat (ms)
  timeout: 10000,                     // Timeout requête HTTP (ms)
}

export const useESPStore = create((set, get) => ({
  // === ÉTAT CONNEXION ===
  connected: false,
  connecting: false,
  mode: null,  // 'websocket' | 'http' | null
  lastUpdate: null,
  error: null,
  
  // === DONNÉES CAPTEURS ===
  data: {
    pitot: null,      // Vitesse air (m/s)
    vent: null,       // Vitesse vent (m/s)
    temperature: null, // Température (°C)
    pression: null,   // Pression (hPa)
    humidity: null,   // Humidité (%)
  },
  
  // === BUFFER HISTORIQUE (pour IQA) ===
  buffer: [],
  bufferSize: 100,  // Nb max échantillons
  
  // === WEBSOCKET ===
  ws: null,
  reconnectTimer: null,
  heartbeatTimer: null,
  
  // === ACTIONS ===
  
  // Connecter en WebSocket
  connectWebSocket: () => {
    const { ws, connected } = get()
    
    if (ws || connected) {
      console.log('Already connected or connecting')
      return
    }
    
    set({ connecting: true, error: null })
    
    try {
      const socket = new WebSocket(ESP_CONFIG.wsUrl)
      
      socket.onopen = () => {
        console.log('WebSocket connected')
        set({
          connected: true,
          connecting: false,
          mode: 'websocket',
          ws: socket,
          error: null,
        })
        
        // Démarrer heartbeat
        get().startHeartbeat()
      }
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          get().updateData(data)
        } catch (e) {
          console.error('Failed to parse WebSocket data:', e)
        }
      }
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        set({ error: 'WebSocket error' })
      }
      
      socket.onclose = () => {
        console.log('WebSocket closed')
        set({
          connected: false,
          connecting: false,
          mode: null,
          ws: null,
        })
        
        get().stopHeartbeat()
        get().scheduleReconnect()
      }
      
      set({ ws: socket })
      
    } catch (e) {
      console.error('Failed to create WebSocket:', e)
      set({
        connecting: false,
        error: e.message,
      })
      
      // Fallback HTTP
      get().connectHTTP()
    }
  },
  
  // Déconnecter WebSocket
  disconnectWebSocket: () => {
    const { ws, reconnectTimer } = get()
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }
    
    get().stopHeartbeat()
    
    if (ws) {
      ws.close()
    }
    
    set({
      connected: false,
      connecting: false,
      mode: null,
      ws: null,
      reconnectTimer: null,
    })
  },
  
  // Connexion HTTP (polling)
  connectHTTP: async () => {
    set({ connecting: true, mode: 'http', error: null })
    
    const poll = async () => {
      if (get().mode !== 'http') return
      
      try {
        const response = await fetch(`${ESP_CONFIG.httpUrl}/data`, {
          signal: AbortSignal.timeout(ESP_CONFIG.timeout),
        })
        
        if (!response.ok) throw new Error('HTTP error')
        
        const data = await response.json()
        get().updateData(data)
        
        set({ connected: true, connecting: false, error: null })
        
      } catch (e) {
        console.error('HTTP poll failed:', e)
        set({ error: e.message })
      }
      
      // Re-poll après 1 seconde
      setTimeout(poll, 1000)
    }
    
    poll()
  },
  
  // Mettre à jour les données capteurs
  updateData: (newData) => {
    const now = Date.now()
    
    set((state) => {
      const updated = {
        pitot: newData.pitot ?? state.data.pitot,
        vent: newData.vent ?? state.data.vent,
        iqa:   newData.IQA   ?? state.data.iqa,
        sGrad: newData.S_GRAD ?? state.data.sGrad,
        bulle: newData.BULLE === 1,
        temperature: newData.temperature ?? state.data.temperature,
        pression: newData.pression ?? state.data.pression,
        humidity: newData.humidity ?? state.data.humidity,
      }
      
      // Ajouter au buffer
      const newBuffer = [
        ...state.buffer,
        { timestamp: now, ...updated },
      ].slice(-state.bufferSize)
      
      return {
        data: updated,
        buffer: newBuffer,
        lastUpdate: now,
      }
    })
  },
  
  // Programmer reconnexion
  scheduleReconnect: () => {
    const timer = setTimeout(() => {
      console.log('Attempting reconnect...')
      get().connectWebSocket()
    }, ESP_CONFIG.reconnectDelay)
    
    set({ reconnectTimer: timer })
  },
  
  // Démarrer heartbeat
  startHeartbeat: () => {
    const timer = setInterval(() => {
      const { ws, connected } = get()
      if (ws && connected) {
        try {
          ws.send(JSON.stringify({ type: 'ping' }))
        } catch (e) {
          console.error('Heartbeat failed:', e)
        }
      }
    }, ESP_CONFIG.heartbeatInterval)
    
    set({ heartbeatTimer: timer })
  },
  
  // Arrêter heartbeat
  stopHeartbeat: () => {
    const { heartbeatTimer } = get()
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      set({ heartbeatTimer: null })
    }
  },
  
  // Envoyer une commande à l'ESP
  sendCommand: (command) => {
    const { ws, connected, mode } = get()
    
    if (mode === 'websocket' && ws && connected) {
      try {
        ws.send(JSON.stringify(command))
        return true
      } catch (e) {
        console.error('Failed to send command:', e)
        return false
      }
    }
    
    if (mode === 'http') {
      // Envoyer en HTTP POST
      fetch(`${ESP_CONFIG.httpUrl}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      }).catch(e => console.error('HTTP command failed:', e))
    }
    
    return false
  },
  
  // Nettoyer le buffer
  clearBuffer: () => set({ buffer: [] }),
  
  // Obtenir statistiques du buffer
  getBufferStats: () => {
    const { buffer } = get()
    if (buffer.length === 0) return null
    
    const calcStat = (key) => {
      const values = buffer.map(d => d[key]).filter(v => v != null)
      if (values.length === 0) return null
      
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
      }
    }
    
    return {
      pitot: calcStat('pitot'),
      vent: calcStat('vent'),
      temperature: calcStat('temperature'),
      pression: calcStat('pression'),
      duration: buffer.length > 0 
        ? buffer[buffer.length - 1].timestamp - buffer[0].timestamp
        : 0,
    }
  },
}))
