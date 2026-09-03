import { Application } from '../models/LandModels.js'
import { recordAudit } from './auditService.js'
import { notify } from './notificationService.js'

/**
 * Application workflow state machine.
 * Not every service needs every state — the `path` is configurable per category,
 * but status transitions are validated so invalid jumps are rejected.
 */

export const STATUS_ORDER = {
  DRAFT: 0,
  SUBMITTED: 1,
  UNDER_REVIEW: 2,
  DOCUMENT_VERIFICATION: 3,
  ACTION_REQUIRED: 4,
  FIELD_VERIFICATION: 5,
  APPROVED: 10,
  REJECTED: 10,
  CANCELLED: 10,
}

const FORWARD = [
  ['DRAFT', 'SUBMITTED'],
  ['SUBMITTED', 'UNDER_REVIEW'],
  ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION'],
  ['DOCUMENT_VERIFICATION', 'FIELD_VERIFICATION'],
  ['DOCUMENT_VERIFICATION', 'ACTION_REQUIRED'],
  ['ACTION_REQUIRED', 'DOCUMENT_VERIFICATION'],
  ['ACTION_REQUIRED', 'UNDER_REVIEW'],
  ['FIELD_VERIFICATION', 'APPROVED'],
  ['FIELD_VERIFICATION', 'REJECTED'],
  ['DOCUMENT_VERIFICATION', 'APPROVED'],
  ['UNDER_REVIEW', 'ACTION_REQUIRED'],
  ['SUBMITTED', 'ACTION_REQUIRED'],
]

// Terminal states allow no further change except reopen by admin.
const TERMINAL = ['APPROVED', 'REJECTED', 'CANCELLED']

/**
 * Returns true if moving `from -> to` is permitted.
 */
export function isTransitionValid(from, to) {
  if (!from || from === to) return to ? true : false
  if (TERMINAL.includes(from)) return false // terminal states are locked
  if (TERMINAL.includes(to) && !['APPROVED', 'REJECTED'].includes(to)) {
    // CANCELLED should originate from non-terminal steward or citizen
  }
  const allowedTo = FORWARD.filter(([f]) => f === from).map(([, t]) => t)
  if (allowedTo.includes(to)) return true
  // allow re-review / admin override to move non-terminal forward/back by one review node
  return false
}

/**
 * Persist a status change with audit + optional notification and timeline entry.
 */
export async function transitionApplication(app, toStatus, { user, remarks, actorRole, notifyMessage, extraMeta = {} }) {
  const from = app.status
  if (!isTransitionValid(from, toStatus)) {
    const err = new Error(`Invalid transition: ${from || 'none'} -> ${toStatus}`)
    err.status = 422
    throw err
  }

  app.status = toStatus
  app.timeline = app.timeline || []
  app.timeline.push({
    status: toStatus,
    from,
    to: toStatus,
    date: new Date(),
    remarks: remarks || '',
    officer: (user && (user.name || user.userName)) || 'system',
    actorRole: actorRole || (user && user.role) || 'system',
  })
  await app.save()

  await recordAudit({
    user,
    action: `application.status`,
    resource: 'application',
    resourceId: app.applicationId,
    result: 'success',
    ip: user && user.ip,
    metadata: { from, to: toStatus, remarks, ...extraMeta },
  })

  if (notifyMessage) {
    const link = app.user ? `/applications` : undefined
    await notify({
      user,
      userId: app.user ? String(app.user) : undefined,
      title: `Application ${app.applicationId} ${toStatus.replace(/_/g, ' ').toLowerCase()}`,
      message: notifyMessage,
      type: toStatus === 'REJECTED' ? 'error' : toStatus === 'APPROVED' ? 'success' : 'info',
      link,
      resource: 'application',
      resourceId: app.applicationId,
    })
  }

  return app
}

export const workflowService = { isTransitionValid, transitionApplication }
export default workflowService
