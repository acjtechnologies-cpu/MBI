import { useState, useEffect } from 'react'

export function useStorage(key, initialValue) {
  // Récupérer la valeur initiale depuis localStorage
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Fonction pour mettre à jour la valeur
  const setValue = (value) => {
    try {
      // Permettre à value d'être une fonction comme avec useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      setStoredValue(valueToStore)
      
      // Sauvegarder dans localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Fonction pour supprimer la valeur
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, removeValue]
}

// Hook pour gérer plusieurs clés de localStorage
export function useMultiStorage(keys) {
  const [values, setValues] = useState(() => {
    const initialValues = {}
    keys.forEach(key => {
      try {
        const item = window.localStorage.getItem(key)
        initialValues[key] = item ? JSON.parse(item) : null
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error)
        initialValues[key] = null
      }
    })
    return initialValues
  })

  const setValue = (key, value) => {
    try {
      const valueToStore = value instanceof Function ? value(values[key]) : value
      
      setValues(prev => ({ ...prev, [key]: valueToStore }))
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  const removeValue = (key) => {
    try {
      window.localStorage.removeItem(key)
      setValues(prev => ({ ...prev, [key]: null }))
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  const clearAll = () => {
    keys.forEach(key => {
      try {
        window.localStorage.removeItem(key)
      } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error)
      }
    })
    setValues({})
  }

  return { values, setValue, removeValue, clearAll }
}
