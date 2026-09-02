import 'dotenv/config'
import connectDB from './src/config/db.js'
import { createApp } from './src/app.js'

async function start() {
  const port = process.env.PORT || 4000

  // Try to connect to MongoDB. If it fails (e.g. offline/credentials invalid),
  // log clearly but still boot the API so the app is usable in demo mode.
  let dbConnected = false
  try {
    await connectDB()
    dbConnected = true
  } catch (err) {
    console.error('✖ Backend continuing without a live MongoDB connection.')
    console.error(`  Reason: ${err.message}`)
  }

  const app = createApp()

  app.listen(port, () => {
    console.log(`✔ LandStack API listening on http://localhost:${port}`)
    console.log(`  MongoDB: ${dbConnected ? 'connected' : 'NOT connected'}`)
    console.log('  Demo GIS layer + auth routes available under /api/*')
  })
}

start()
