// Service pour les analyses IA - supporte Ollama (local) et Claude (API)

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export type AIProvider = 'ollama' | 'claude'

// Récupère des actualités récentes pour un secteur
export async function fetchRecentNews(sector: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(sector)}`)
    const data = await response.json()
    
    if (data.news && data.news.length > 0) {
      const newsContext = data.news.map((item: any, i: number) => 
        `${i + 1}. [${item.date}] ${item.title}\n   ${item.snippet}${item.source ? ` (Source: ${item.source})` : ''}`
      ).join('\n\n')
      
      return `Actualités en temps réel (${new Date().toLocaleString('fr-FR')}):\n\n${newsContext}`
    }
    
    return ''
  } catch (error) {
    console.error('Error fetching recent news:', error)
    return ''
  }
}

// Détecte si Ollama est disponible
export async function detectOllama(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    })
    return response.ok
  } catch {
    return false
  }
}

// Récupère la liste des modèles Ollama disponibles
export async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    const data = await response.json()
    return data.models?.map((m: any) => m.name) || []
  } catch {
    return []
  }
}

// Génère du texte avec Ollama
export async function generateWithOllama(prompt: string, model: string = 'llama3.2'): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.response || ''
  } catch (error) {
    console.error('Ollama generation error:', error)
    throw error
  }
}

// Génère du texte avec Claude
export async function generateWithClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured')
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Claude error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.content.map((b: any) => b.text || '').join('')
  } catch (error) {
    console.error('Claude generation error:', error)
    throw error
  }
}

// Fonction principale qui choisit automatiquement le provider
export async function generateText(prompt: string, preferredProvider?: AIProvider): Promise<{
  text: string
  provider: AIProvider
}> {
  // Si un provider est spécifié, l'utiliser
  if (preferredProvider === 'ollama') {
    const text = await generateWithOllama(prompt)
    return { text, provider: 'ollama' }
  }
  
  if (preferredProvider === 'claude') {
    const text = await generateWithClaude(prompt)
    return { text, provider: 'claude' }
  }
  
  // Sinon, détecter automatiquement
  const ollamaAvailable = await detectOllama()
  
  if (ollamaAvailable) {
    try {
      const text = await generateWithOllama(prompt)
      return { text, provider: 'ollama' }
    } catch (error) {
      console.warn('Ollama failed, falling back to Claude:', error)
    }
  }
  
  // Fallback sur Claude
  const text = await generateWithClaude(prompt)
  return { text, provider: 'claude' }
}

// Génère des actualités JSON
export async function generateNews(sectorLabel: string, preferredProvider?: AIProvider): Promise<any[]> {
  // Récupère d'abord les actualités récentes du web
  const recentNews = await fetchRecentNews(sectorLabel)
  
  const contextInfo = recentNews 
    ? `\n\nActualités récentes trouvées sur le web:\n${recentNews}\n\nUtilise ces informations RÉCENTES pour créer des actualités réalistes et actuelles. IMPORTANT: Inclus la date de chaque actualité dans le champ "date" au format "Il y a Xh" ou "Il y a X jours" pour montrer que c'est récent.`
    : ''
  
  const prompt = `Tu es un analyste financier senior. Nous sommes le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.

Pour le secteur "${sectorLabel}", génère 4 actualités fictives mais réalistes basées sur les vraies actualités récentes en JSON strict.${contextInfo}
Format OBLIGATOIRE (JSON uniquement, aucun texte autour) :
{"news":[{"title":"...","summary":"...","impact":"positif"|"negatif"|"neutre","category":"...","date":"..."},...]}
Les catégories possibles: Géopolitique, Réglementation, Résultats, Macro, M&A, Technologie

Important: Base-toi STRICTEMENT sur les actualités récentes fournies ci-dessus pour créer du contenu pertinent et actuel. Utilise des dates récentes comme "Il y a 2h", "Il y a 5h", "Aujourd'hui", "Hier".`

  try {
    const { text } = await generateText(prompt, preferredProvider)
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed.news || []
  } catch (error) {
    console.error('Error generating news:', error)
    return [{
      title: "Erreur de chargement",
      summary: "Impossible de récupérer les actualités.",
      impact: "neutre",
      category: "Système",
      date: new Date().toLocaleDateString('fr-FR')
    }]
  }
}

// Génère une analyse sectorielle
export async function generateAnalysis(sectorLabel: string, preferredProvider?: AIProvider): Promise<string> {
  // Récupère d'abord les actualités récentes du web
  const recentNews = await fetchRecentNews(sectorLabel)
  
  const contextInfo = recentNews 
    ? `\n\nActualités récentes du secteur:\n${recentNews}\n\nBase ton analyse sur ces informations récentes.`
    : ''
  
  const prompt = `Tu es un gérant de portefeuille. En 3 phrases maximum, donne une analyse synthétique du secteur "${sectorLabel}" pour un investisseur en 2025. Mentionne les risques et opportunités clés. Sois direct et factuel. Réponds en français, texte brut uniquement sans markdown.${contextInfo}`
  
  try {
    const { text } = await generateText(prompt, preferredProvider)
    return text
  } catch (error) {
    console.error('Error generating analysis:', error)
    return "Analyse indisponible."
  }
}
