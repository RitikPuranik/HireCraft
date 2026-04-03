import dotenv from 'dotenv'
dotenv.config()

// ── Validate required environment variables at startup ───────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET', 'GEMINI_API_KEY']
const missing = REQUIRED_ENV.filter(key => !process.env[key])
if (missing.length) {
  console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`)
  console.error('[startup] Copy .env.example to .env and fill in the values.')
  process.exit(1)
}

import app from './src/app.js'
import connectDB from './src/config/db.js'

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })
})
