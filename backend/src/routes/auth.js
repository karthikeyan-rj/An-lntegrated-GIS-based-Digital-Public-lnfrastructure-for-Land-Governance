import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = Router()

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

// POST /api/auth/register — create a REAL MongoDB user. Passwords are always hashed.
router.post('/register', async (req, res) => {
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

    // Validate role against allowed set; default to citizen.
    const allowedRoles = ['citizen', 'revenue_officer', 'registration_officer', 'planning_officer', 'tax_officer', 'administrator']
    const safeRole = allowedRoles.includes(role) ? role : 'citizen'

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password, // hashed by pre-save hook
      role: safeRole,
      department: department || (safeRole === 'citizen' ? 'Citizen Portal' : 'General'),
      isDemo: false,
    })

    const token = signToken(user)
    res.status(201).json({ token, user: publicUser(user) })
  } catch (error) {
    console.error('Register error:', error.message)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// POST /api/auth/login — authenticate a REAL MongoDB user only.
// A failed real login is rejected outright; it NEVER falls back to demo accounts.
router.post('/login', async (req, res) => {
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
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user)
    res.json({ token, user: publicUser(user) })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// GET /api/auth/me — return the current real user from the token.
router.get('/me', protect, async (req, res) => {
  res.json({ user: publicUser(req.user) })
})

export default router
