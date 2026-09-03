import { Router } from 'express'
import { parcelController } from '../controllers/parcelController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// GeoJSON feature collection
router.get('/', parcelController.listParcels)
// Single parcel + governance (protected for audit)
router.get('/:id', protect, parcelController.getParcel)
router.get('/:id/governance', protect, parcelController.getParcelGovernance)

export default router
