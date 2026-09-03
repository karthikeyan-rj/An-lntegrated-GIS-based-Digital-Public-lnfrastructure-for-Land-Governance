import { Router } from 'express'
import { applicationController } from '../controllers/applicationController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

// Creating an application is allowed for citizen + all officers (staff can file on behalf).
router.post('/', protect, authorize(['citizen', 'revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), applicationController.createApplication)
router.get('/', protect, applicationController.listApplications)
router.get('/:id', protect, applicationController.getApplication)

// Workflow actions (officers/admin only)
router.patch('/:id/status', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), applicationController.updateStatus)
router.post('/:id/approve', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), applicationController.approve)
router.post('/:id/reject', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), applicationController.reject)
router.post('/:id/assign', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), applicationController.assign)
router.post('/:id/documents', protect, applicationController.addDocument)
router.post('/:id/ai-review', protect, authorize(['revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']), applicationController.runAiReview)

export default router
