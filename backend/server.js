import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from the correct path BEFORE anything else
dotenv.config({ path: path.join(__dirname, '.env') })

// Log immediately to verify
console.log('=== SERVER STARTUP ===')
console.log('RAZORPAY_KEY_ID loaded:', !!process.env.RAZORPAY_KEY_ID)
console.log('RAZORPAY_KEY_SECRET loaded:', !!process.env.RAZORPAY_KEY_SECRET)
console.log('=====================')

// Now import the rest
import app from './src/app.js'
import connectDB from './src/config/db.js'

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })
})