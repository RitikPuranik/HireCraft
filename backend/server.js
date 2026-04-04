import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from the correct path BEFORE anything else
dotenv.config({ path: path.join(__dirname, '.env') })

// Now import the rest
import app from './src/app.js'
import connectDB from './src/config/db.js'
import { seedCouponsFromEnv } from './src/modules/coupon/coupon.service.js'

const PORT = process.env.PORT || 5000

connectDB().then(async () => {
  // Seed coupons from COUPON_* env vars
  await seedCouponsFromEnv()

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })
})