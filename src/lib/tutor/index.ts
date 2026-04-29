import type { ChatMessage } from '@/types/tutor'

export interface TutorProvider {
  chat(system: string, history: ChatMessage[]): Promise<string>
  available(): Promise<boolean>
}

// Ollama OpenAI-compatible endpoint (exposé via Cloudflare Tunnel)
class OllamaProvider implements TutorProvider {
  constructor(
    private baseUrl: string,
    private model: string,
  ) {}

  async available(): Promise<boolean> {
    try {
      const r = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) })
      return r.ok
    } catch {
      return false
    }
  }

  async chat(system: string, history: ChatMessage[]): Promise<string> {
    const messages: ChatMessage[] = [{ role: 'system', content: system }, ...history]

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: { temperature: 0.7, num_predict: 512 },
      }),
      signal: AbortSignal.timeout(55_000),
    })

    if (!res.ok) throw new Error(`Ollama error ${res.status}`)
    const data = await res.json() as { message?: { content?: string } }
    return data.message?.content?.trim() ?? ''
  }
}

// Fallback : message d'indisponibilité
class UnavailableProvider implements TutorProvider {
  async available() { return false }
  async chat() {
    return 'Sid Ahmed dort pour l\'instant 😴 Papa doit allumer le serveur à Lisbonne. Reviens un peu plus tard !'
  }
}

let _provider: TutorProvider | null = null

export function getTutorProvider(): TutorProvider {
  if (_provider) return _provider

  const url   = process.env.TUTOR_API_URL
  const model = process.env.TUTOR_MODEL ?? 'gemma3:12b'

  if (url) {
    _provider = new OllamaProvider(url, model)
  } else {
    _provider = new UnavailableProvider()
  }
  return _provider
}
