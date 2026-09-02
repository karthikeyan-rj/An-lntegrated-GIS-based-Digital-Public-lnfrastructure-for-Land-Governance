import mongoose from 'mongoose'

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Logs a clear success/failure message on startup.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME || 'landstack'

  if (!uri) {
    console.error('✖ MONGODB_URI is not set. Please configure server/.env (see .env.example).')
    process.exit(1)
  }

  // Never log the full URI (contains credentials). Log only the host portion.
  const safeHost = (() => {
    try {
      return new URL(uri).host
    } catch {
      return 'unknown'
    }
  })()

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false,
    })
    console.log('✔ MongoDB connected successfully')
    console.log(`  → database: ${dbName}`)
    console.log(`  → host: ${safeHost}`)
  } catch (error) {
    console.error('✖ MongoDB connection failed:', error.message)
    // Do not exit hard in dev so the API can still serve demo endpoints and
    // surface the error clearly. The error message is logged but the URI is not.
    throw error
  }
}

export default connectDB
