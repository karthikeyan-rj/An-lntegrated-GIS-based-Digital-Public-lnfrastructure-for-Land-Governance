import 'dotenv/config'
import connectDB from './src/config/db.js'
import { createApp } from './src/app.js'

async function start() {
  const port = process.env.PORT || 4000

  // MongoDB is a hard requirement for the backend to be useful. Connect and
  // verify a live connection BEFORE booting the HTTP server. On failure we
  // exit non-zero with the exact reason — we never pretend to be connected and
  // never fall back to silently running on demo data.
  await connectDB()

  const app = createApp()

  app.listen(port, () => {
    console.log(`✔ LandStack API listening on http://localhost:${port}`)
    console.log('  MongoDB: connected')
  })
}

start().catch((err) => {
  console.error('✖ Backend failed to start: MongoDB is not connected.')
  console.error(`  Reason: ${err.message}`)
  process.exit(1)
})
