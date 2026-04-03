import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Manually parse .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '../../../.env')

try {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && !key.startsWith('#') && valueParts.length) {
      const value = valueParts.join('=')
      if (!process.env[key]) {
        process.env[key] = value.trim()
      }
    }
  })
  console.log('✅ Manually loaded .env file from:', envPath)
  console.log('RAZORPAY_KEY_ID loaded:', !!process.env.RAZORPAY_KEY_ID)
} catch (err) {
  console.error('Failed to load .env file:', err.message)
}

// Now the rest of your imports
import Razorpay from 'razorpay'
import crypto from 'crypto'
import Subscription from './subscription.model.js'
import { PLANS } from '../../shared/constants/plans.js'
import { ApiError } from '../../shared/utils/apiError.js'

console.log('=== Subscription Service Loading ===')
console.log('RAZORPAY_KEY_ID from process.env:', process.env.RAZORPAY_KEY_ID ? '✅ Found' : '❌ Missing')
console.log('RAZORPAY_KEY_SECRET from process.env:', process.env.RAZORPAY_KEY_SECRET ? '✅ Found' : '❌ Missing')
if (process.env.RAZORPAY_KEY_ID) {
  console.log('RAZORPAY_KEY_ID value starts with:', process.env.RAZORPAY_KEY_ID.substring(0, 10))
}
console.log('====================================')

// Initialize Razorpay
let razorpayInstance = null

const initRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
  
  if (!keyId || !keySecret) {
    console.error('Razorpay credentials missing in initRazorpay()')
    return null
  }
  
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
    console.log('✅ Razorpay initialized successfully')
    return razorpayInstance
  } catch (error) {
    console.error('❌ Razorpay initialization failed:', error.message)
    return null
  }
}

// Initialize on module load
initRazorpay()

export const getMySubscriptionService = async (userId) => {
  let sub = await Subscription.findOne({ user: userId })
  if (!sub) sub = await Subscription.create({ user: userId, plan: 'free', status: 'active' })

  const planDetails = PLANS[sub.plan]
  return {
    plan:              sub.plan,
    status:            sub.status,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    currentPeriodEnd:  sub.currentPeriodEnd,
    usage:             sub.usage,
    limits:            planDetails.limits,
    features:          planDetails.features,
    usageResetAt:      sub.usageResetAt,
  }
}

export const getUsageService = async (userId) => {
  let sub = await Subscription.findOne({ user: userId })
  if (!sub) sub = await Subscription.create({ user: userId, plan: 'free', status: 'active' })

  const limits = PLANS[sub.plan].limits
  const usage  = sub.usage

  const summary = {}
  for (const key of Object.keys(usage.toObject ? usage.toObject() : usage)) {
    const limit = limits[key]
    summary[key] = {
      used:       usage[key],
      limit:      limit,
      unlimited:  limit === -1,
      percentage: limit === -1 ? 0 : Math.round((usage[key] / limit) * 100),
    }
  }

  return { plan: sub.plan, usage: summary, resetAt: sub.usageResetAt }
}

export const createOrderService = async (userId) => {
  console.log('Creating order for user:', userId)
  
  let sub = await Subscription.findOne({ user: userId })
  if (!sub) sub = await Subscription.create({ user: userId, plan: 'free', status: 'inactive' })

  if (sub.plan === 'pro' && sub.status === 'active') {
    throw new ApiError(400, 'You already have an active Pro subscription')
  }

  // Check if Razorpay is initialized
  if (!razorpayInstance) {
    console.log('Razorpay not initialized, trying to re-initialize...')
    initRazorpay()
    if (!razorpayInstance) {
      console.error('Razorpay instance is null. Key ID exists?', !!process.env.RAZORPAY_KEY_ID)
      throw new ApiError(500, 'Payment system not configured. Please contact support.')
    }
  }

  try {
    // Create a receipt within 40 character limit
    const userIdStr = userId.toString()
    const shortUserId = userIdStr.slice(-8)
    const shortTimestamp = Date.now().toString().slice(-8)
    const receipt = `rcpt_${shortUserId}_${shortTimestamp}`
    
    console.log('Creating order with receipt:', receipt)
    
    const order = await razorpayInstance.orders.create({
      amount: 99900,
      currency: 'INR',
      receipt: receipt,
      notes: { 
        userId: userIdStr,
        timestamp: Date.now()
      },
    })
    
    console.log('Order created successfully:', order.id)
    
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    }
  } catch (error) {
    console.error('Razorpay order creation error:', error.error?.description || error.message)
    throw new ApiError(500, `Payment error: ${error.error?.description || error.message}`)
  }
}

export const verifyPaymentService = async (userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  if (expected !== razorpaySignature) {
    throw new ApiError(400, 'Payment verification failed — invalid signature')
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setDate(periodEnd.getDate() + 30)

  let sub = await Subscription.findOne({ user: userId })
  if (!sub) sub = await Subscription.create({ user: userId })

  sub.plan = 'pro'
  sub.status = 'active'
  sub.currentPeriodStart = now
  sub.currentPeriodEnd = periodEnd
  sub.cancelAtPeriodEnd = false
  await sub.save()

  return {
    plan: sub.plan,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
  }
}

export const cancelSubscriptionService = async (userId) => {
  const sub = await Subscription.findOne({ user: userId })
  if (!sub || sub.plan !== 'pro') throw new ApiError(400, 'No active Pro subscription found')

  sub.cancelAtPeriodEnd = true
  await sub.save()

  return {
    message: 'Subscription will cancel at period end',
    currentPeriodEnd: sub.currentPeriodEnd,
  }
}