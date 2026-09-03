import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', protect, authController.me)

export default router
