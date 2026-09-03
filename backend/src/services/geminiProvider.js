/**
 * Gemini provider (backend-only).
 *
 * Thin wrapper around the Gemini REST API using Node's global `fetch` — no
 * npm dependency required. Activation is controlled purely by env config in
 * backend/.env:
 *
 *   GEMINI_API_KEY=...        # (needed) never commit the real key
 *   GEMINI_MODEL=...          # optional, default gemini-3.6-flash
 *
 * The frontend NEVER talks to Gemini directly — it only calls LandStack's
 * own /api/ai/* endpoints. This module is used by aiService.js to enrich
 * results with real LLM reasoning while the deterministic "demo reasoning"
 * fallback remains the safety net when the key is missing or the call fails.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim())
}

export function geminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.6-flash'
}

function requestTimeoutMs() {
  const raw = Number(process.env.GEMINI_TIMEOUT_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : 15000
}

/**
 * Ask Gemini to produce JSON from a system prompt + user content.
 * @returns the parsed JSON object
 * @throws if not configured, the network fails, or the model output is not JSON
 */
export async function generateJSON({ systemPrompt, userContent, temperature = 0.2 }) {
  if (!isGeminiConfigured()) {
    const err = new Error('Gemini API key not configured')
    err.code = 'GEMINI_NOT_CONFIGURED'
    throw err
  }

  const apiKey = process.env.GEMINI_API_KEY
  const model = geminiModel()
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs())

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userContent }] },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    let detail = ''
    try {
      const e = await response.json()
      detail = e?.error?.message || JSON.stringify(e).slice(0, 300)
    } catch {
      detail = await response.text()
    }
    const err = new Error(`Gemini API error ${response.status}: ${detail}`)
    err.code = 'GEMINI_API_ERROR'
    throw err
  }

  const data = await response.json()
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('\n') || ''

  // Strip any markdown code fences that the model might wrap the JSON in.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const jsonText = (fenced ? fenced[1] : text).trim()

  try {
    return JSON.parse(jsonText)
  } catch {
    const err = new Error('Gemini returned non-JSON output')
    err.code = 'GEMINI_PARSE_ERROR'
    throw err
  }
}

export const geminiProvider = { isGeminiConfigured, geminiModel, generateJSON }
export default geminiProvider
