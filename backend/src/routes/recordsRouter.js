import { Router } from 'express'
import { recordsResource } from '../controllers/recordsController.js'
import { protect } from '../middleware/auth.js'

/**
 * One route file per governance module, sharing the resource handler factory.
 * Each module exposes:
 *   GET  /api/<module>          → list (with demo fallback)
 *   GET  /api/<module>/:ulpin   → single record by ULPIN
 */
export function makeRecordsRouter(resource, singular) {
  const router = Router()
  const h = recordsResource(resource, singular)
  router.get('/', protect, h.list)
  router.get('/:ulpin', protect, h.getByUlpin)
  return router
}

export default makeRecordsRouter
