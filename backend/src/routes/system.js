import { Router } from 'express'
import {
  listNotifications, markNotificationRead, listAudit, listDepartments, apiStatus, listWorkflows,
} from '../controllers/systemController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

// Notifications
router.get('/notifications', protect, listNotifications)
router.post('/notifications/:id/read', protect, markNotificationRead)

// Audit logs — admin only
router.get('/audit', protect, authorize(['administrator']), listAudit)

// Departments (interop status)
router.get('/departments', protect, listDepartments)

// API / interoperability status
router.get('/apis', protect, apiStatus)

// Workflows
router.get('/workflows', protect, listWorkflows)

export default router
