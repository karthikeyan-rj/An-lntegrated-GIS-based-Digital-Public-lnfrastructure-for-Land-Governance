import { Router } from 'express'
import { parcelController } from '../controllers/parcelController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// Public map layer — returns only public (non-ownership) fields for citizens.
router.get('/', parcelController.listParcels)
// Public parcel search — public fields only, never ownership identifiers.
router.get('/search', parcelController.searchParcels)
// Single parcel + governance (protected, role/ownership scoped for full record)
router.get('/:id', protect, parcelController.getParcel)
router.get('/:id/governance', protect, parcelController.getParcelGovernance)

export default router
