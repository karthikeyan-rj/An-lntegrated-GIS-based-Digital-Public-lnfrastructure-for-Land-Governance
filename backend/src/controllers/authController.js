import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { recordAudit } from '../services/auditService.js'

const ALLOWED_ROLES = ['citizen', 'revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    isDemo: user.isDemo || false,
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role, department } = req.body || {}

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const safeRole = ALLOWED_ROLES.includes(role) ? role : 'citizen'
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: safeRole,
      department: department || (safeRole === 'citizen' ? 'Citizen Portal' : 'General'),
      isDemo: false,
    })

    const token = signToken(user)
    await recordAudit({ user, action: 'auth.register', resource: 'user', resourceId: user._id.toString(), result: 'success', ip: req.ip })
    res.status(201).json({ token, user: publicUser(user) })
  } catch (error) {
    console.error('Register error:', error.message)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await user.verifyPassword(password)
    if (!valid) {
      await recordAudit({ user: null, action: 'auth.login.failed', resource: 'user', resourceId: email, result: 'failure', metadata: { reason: 'invalid_credentials' }, ip: req.ip })
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user)
    await recordAudit({ user, action: 'auth.login', resource: 'user', resourceId: user._id.toString(), result: 'success', ip: req.ip })
    res.json({ token, user: publicUser(user) })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ message: 'Server error during login' })
  }
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) })
}

export const authController = { register, login, me }
export default authController
