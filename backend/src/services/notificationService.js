import mongoose from 'mongoose'
import { Notification } from '../models/LandModels.js'

/**
 * Creates a notification for a user (or role-wide).
 * @param {Object} opts
 * @param {string} [opts.userId]    MongoDB user id
 * @param {string} [opts.user]      req.user doc fallback
 * @param {string} [opts.recipientRole] role-wide broadcast
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.type]      info|success|warning|error
 * @param {string} [opts.link]
 * @param {string} [opts.resource]
 * @param {string} [opts.resourceId]
 */
export async function notify({
  userId,
  user,
  recipientRole,
  title,
  message,
  type = 'info',
  link,
  resource,
  resourceId,
}) {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) return null
  const targetId = userId || (user && user._id ? user._id.toString() : null) || null
  try {
    return await Notification.create({
      user: targetId ? new mongoose.Types.ObjectId(targetId) : undefined,
      userId: targetId || undefined,
      recipientRole: recipientRole || undefined,
      title,
      message,
      type,
      link,
      resource,
      resourceId,
      read: false,
    })
  } catch (err) {
    console.error('Notification creation failed:', err.message)
    return null
  }
}

export const notificationService = { notify }
export default notificationService
