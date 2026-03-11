import { useState, useEffect } from 'react'

export function useESP32(url = 'ws://192.168.1.100:8080') {
  const [isConnected, setIsConnected] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Simulation de connexion WebSocket
    // En production, remplacer par une vraie connexion WebSocket
    
    const simulateConnection = () => {
      setIsConnected(true)
      
      // Simuler des données périodiques
      const interval = setInterval(() => {
        setData({
          temperature: 15 + Math.random() * 10,
          pressure: 1013 + Math.random() * 20 - 10,
          humidity: 50 + Math.random() * 30,
          windSpeed: Math.random() * 30,
          windDirection: Math.random() * 360,
          timestamp: Date.now(),
        })
      }, 1000)

      return () => clearInterval(interval)
    }

    const cleanup = simulateConnection()
    return cleanup
  }, [url])

  const sendCommand = (command) => {
    console.log('Sending command to ESP32:', command)
    // En production: ws.send(JSON.stringify(command))
  }

  return {
    isConnected,
    data,
    error,
    sendCommand,
  }
}
