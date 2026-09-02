import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export const USER_ROLES = [
  'citizen',
  'revenue_officer',
  'registration_officer',
  'planning_officer',
  'tax_officer',
  'administrator',
]

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'citizen',
    },
    department: {
      type: String,
      default: 'Citizen Portal',
    },
    isDemo: {
      // Flag to distinguish seeded demo users from real users, if ever needed.
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // provides createdAt, updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash
        delete ret.__v
        return ret
      },
    },
  }
)

// Hash password before saving (only when modified).
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  const salt = await bcrypt.genSalt(10)
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
  next()
})

// Verify a plaintext password against the stored hash.
userSchema.methods.verifyPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash)
}

export const User = mongoose.models.User || mongoose.model('User', userSchema)
export default User
