import { Clock, Play, Pause, RotateCcw, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ChronoEditor() {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [laps, setLaps] = useState([])

  useEffect(() => {
    let interval
    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => t + 10)
      }, 10)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }

  const handleStartPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
    setLaps([])
  }

  const handleLap = () => {
    setLaps(prev => [...prev, { id: Date.now(), time }])
  }

  const handleDeleteLap = (id) => {
    setLaps(prev => prev.filter(lap => lap.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
        <Clock className="text-blue-400" size={20} />
        <h3 className="font-semibold">Chronomètre</h3>
      </div>

      {/* Affichage temps principal */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold mb-2">
            {formatTime(time)}
          </div>
          <div className="text-sm text-blue-200">
            {isRunning ? 'En cours...' : 'Arrêté'}
          </div>
        </div>
      </div>

      {/* Contrôles */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleStartPause}
          className={`py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
            isRunning
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={handleLap}
          disabled={!isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Tour
        </button>

        <button
          onClick={handleReset}
          className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={20} />
          Reset
        </button>
      </div>

      {/* Liste des tours */}
      {laps.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400 font-semibold">Tours ({laps.length})</div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {laps.map((lap, index) => (
              <div
                key={lap.id}
                className="bg-gray-900 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="font-mono text-lg">{formatTime(lap.time)}</div>
                </div>
                <button
                  onClick={() => handleDeleteLap(lap.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
