import { aiService, geminiState, refreshGeminiState } from '../services/aiService.js'
import { recordAudit } from '../services/auditService.js'

/**
 * All AI responses are AI-ASSISTED, meant to aid (never replace) human officers.
 * Every response ships with confidence + requiresHumanVerification: true.
 */

// POST /api/ai/change-detection
export async function changeDetection(req, res) {
  try {
    const { imageA, imageB, ulpin } = req.body || {}
    const result = await aiService.changeDetection({ imageA, imageB, ulpin })
    await recordAudit({ user: req.user, action: 'ai.change_detection', resource: 'ai', resourceId: ulpin || 'unknown', result: 'success', metadata: { confidence: result.confidence }, ip: req.ip })
    res.json(result)
  } catch (error) {
    console.error('changeDetection error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/ai/anomaly-detection
export async function anomalyDetection(req, res) {
  try {
    const { parcelId, ulpin, signals } = req.body || {}
    const result = await aiService.anomalyDetection({ parcelId, ulpin, signals })
    await recordAudit({ user: req.user, action: 'ai.anomaly_detection', resource: 'ai', resourceId: ulpin || parcelId || 'unknown', result: 'success', metadata: { confidence: result.confidence }, ip: req.ip })
    res.json(result)
  } catch (error) {
    console.error('anomalyDetection error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/ai/document-extraction
export async function documentExtraction(req, res) {
  try {
    const { text, contentType } = req.body || {}
    const result = await aiService.documentExtraction({ text, contentType })
    await recordAudit({ user: req.user, action: 'ai.document_extraction', resource: 'ai', result: 'success', metadata: { confidence: result.confidence }, ip: req.ip })
    res.json(result)
  } catch (error) {
    console.error('documentExtraction error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/ai/chat — conversational assistant routing
export async function chat(req, res) {
  try {
    const { message, context } = req.body || {}
    if (!message) return res.status(400).json({ message: 'message is required' })
    const result = await aiService.chatAssistant({ message, context })
    await recordAudit({ user: req.user, action: 'ai.chat', resource: 'ai', result: 'success', metadata: { confidence: result.confidence }, ip: req.ip })
    res.json(result)
  } catch (error) {
    console.error('chat error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/ai/parcel-insights — structured risk/insight analysis for a parcel
export async function parcelInsights(req, res) {
  try {
    const { ulpin, parcel } = req.body || {}
    // Accept either a full parcel object or a ULPIN (looked up through a helper).
    const payload = parcel && Object.keys(parcel).length ? parcel : { ulpin }
    const result = await aiService.parcelInsights({ parcel: payload })
    await recordAudit({ user: req.user, action: 'ai.parcel_insights', resource: 'ai', resourceId: ulpin || payload.ulpin || 'unknown', result: 'success', metadata: { confidence: result.confidence, provider: result.provider }, ip: req.ip })
    res.json(result)
  } catch (error) {
    console.error('parcelInsights error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/ai/config — Gemini configuration diagnostic (never exposes the key)
export function config(req, res) {
  refreshGeminiState()
  res.json({
    provider: 'gemini',
    configured: geminiState.configured,
    model: geminiState.model,
    status: geminiState.configured ? 'configured' : 'not_configured',
    message: geminiState.configured
      ? 'Gemini API key configured: yes'
      : 'Gemini API key configured: no — using labeled demo fallback.',
  })
}

export const aiController = { changeDetection, anomalyDetection, documentExtraction, chat, parcelInsights, config }
export default aiController
