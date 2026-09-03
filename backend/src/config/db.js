import dns from 'node:dns'
import mongoose from 'mongoose'

/**
 * Resumes a configured set of DNS servers for the process before connecting.
 * Some machines are configured with a local stub resolver at 127.0.0.1 that
 * refuses SRV queries (querySrv ECONNREFUSED) even though the system DNS works.
 * When this happens the user can set DNS_SERVERS (comma separated) in `.env`
 * to a reachable upstream resolver (e.g. 8.8.8.8) so the driver can resolve
 * mongodb+srv:// records. The servers themselves are not secrets.
 */
function applyConfiguredDns() {
  const configured = process.env.DNS_SERVERS
  if (!configured) return
  const servers = configured
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (servers.length === 0) return
  try {
    dns.setServers(servers)
    console.log(`  → dns servers: ${servers.join(', ')}`)
  } catch (error) {
    console.warn(`  ! Could not set DNS_SERVERS (${error.message}). Using the system resolver.`)
  }
}

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Logs a clear success/failure message on startup and verifies the connection
 * is live with a real ping. Throws on failure so the caller decides whether to
 * keep running. Never logs the full URI (it contains credentials).
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME || 'landstack'

  if (!uri) {
    console.error('✖ MONGODB_URI is not set. Please configure backend/.env (see .env.example).')
    console.error('  MongoDB URI configured: false')
    process.exit(1)
  }
  console.log('  MongoDB URI configured: true')

  applyConfiguredDns()

  // Log only the host portion (safe), never the URI.
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
      serverSelectionTimeoutMS: 20000,
      bufferCommands: false,
    })

    // Confirm the connection is actually live (not just accepted) with a real
    // round-trip ping against the connected database.
    const client =
      typeof mongoose.connection.getClient === 'function'
        ? mongoose.connection.getClient()
        : mongoose.connection.client
    if (client) {
      const pingDb = client.db(mongoose.connection.name || dbName)
      await pingDb.command({ ping: 1 })
    }

    console.log('✔ MongoDB connected successfully')
    console.log(`  → database: ${dbName}`)
    console.log(`  → host: ${safeHost}`)
  } catch (error) {
    console.error('✖ MongoDB connection failed:', error.message)
    // The exact error is surfaced, but the URI (with credentials) is never printed.
    throw error
  }
}

export default connectDB
