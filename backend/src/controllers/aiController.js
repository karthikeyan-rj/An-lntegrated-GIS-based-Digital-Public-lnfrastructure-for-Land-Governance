import { aiService } from '../services/aiService.js'
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

export const aiController = { changeDetection, anomalyDetection, documentExtraction, chat }
export default aiController
