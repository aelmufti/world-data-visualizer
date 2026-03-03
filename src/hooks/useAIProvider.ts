import { useState, useEffect } from 'react'
import { detectOllama, getOllamaModels } from '../services/aiApi'

export function useAIProvider() {
  const [ollamaAvailable, setOllamaAvailable] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkOllama() {
      setChecking(true)
      const available = await detectOllama()
      setOllamaAvailable(available)
      
      if (available) {
        const models = await getOllamaModels()
        setOllamaModels(models)
      }
      
      setChecking(false)
    }
    
    checkOllama()
  }, [])

  return {
    ollamaAvailable,
    ollamaModels,
    checking,
    provider: ollamaAvailable ? 'ollama' : 'claude'
  }
}
