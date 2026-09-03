import { Router } from 'express'
import { aiController } from '../controllers/aiController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

// AI-assistive services — officers/admin only (human verification always required)
router.post('/change-detection', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), aiController.changeDetection)
router.post('/anomaly-detection', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), aiController.anomalyDetection)
router.post('/document-extraction', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), aiController.documentExtraction)
router.post('/parcel-insights', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), aiController.parcelInsights)
router.get('/config', protect, aiController.config)
router.post('/chat', protect, aiController.chat)

export default router
