import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * Protect routes: require a valid JWT from a real MongoDB user.
 * Fails 401 (and never falls back to demo/dummy users) if the token is invalid.
 */
export async function protect(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: 'Not authorized — user no longer exists' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized — invalid or expired token' })
  }
}

/** Restrict a route to one or more roles. Must run after `protect`. */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' is not permitted` })
    }
    next()
  }
}
