import mongoose from 'mongoose'
import { AuditLog } from '../models/LandModels.js'

/**
 * Records an audit event for a sensitive operation.
 * Does not throw — audit failures are logged but never block the main operation.
 *
 * @param {Object} opts
 * @param {Object|null} opts.user           authenticated user doc (req.user) or null
 * @param {string} opts.action              e.g. 'application.approve', 'auth.login'
 * @param {string} opts.resource            e.g. 'application', 'parcel', 'user'
 * @param {string} [opts.resourceId]        e.g. applicationId, ulpin
 * @param {string} [opts.result]            'success' | 'failure' | 'warning'
 * @param {Object} [opts.metadata]          extra structured data
 * @param {string} [opts.ip]
 */
export async function recordAudit({
  user = null,
  action,
  resource,
  resourceId = '',
  result = 'success',
  metadata = {},
  ip,
}) {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) return null
  try {
    const name = user && user.name ? user.name : user && user.userName ? user.userName : 'system'
    const role = user && user.role ? user.role : 'system'
    const department = user && user.department ? user.department : 'System'
    const id = user && user._id ? user._id : user && user.id ? user.id : null
    const entry = await AuditLog.create({
      user: id,
      userName: name,
      role,
      department,
      action,
      resource,
      resourceId,
      result,
      metadata,
      ip,
    })
    return entry
  } catch (err) {
    console.error('Audit logging failed:', err.message)
    return null
  }
}

export const auditService = { recordAudit }
export default auditService
