import Razorpay from 'razorpay'
import crypto from 'crypto'
import Subscription from './subscription.model.js'
import { PLANS } from '../../shared/constants/plans.js'
import { ApiError } from '../../shared/utils/apiError.js'

let razorpayInstance = null

const initRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
  if (!keyId || !keySecret) {
    console.warn('[Razorpay] Credentials missing — payment features will be unavailable')
    return null
  }
  try {
    razorpayInstance = new Razorpay({ key_id: keyId, key_secret: keySecret })
    console.log('[Razorpay] ✅ Initialized')
    return razorpayInstance
  } catch (error) {
    console.error('[Razorpay] ❌ Init failed:', error.message)
    return null
  }
}

// Lazy init — runs when first needed (env vars guaranteed to be loaded by then)
const getRazorpay = () => {
  if (!razorpayInstance) initRazorpay()
  return razorpayInstance
}

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
  const usageObj = sub.usage.toObject ? sub.usage.toObject() : sub.usage
  const summary = {}
  for (const key of Object.keys(usageObj)) {
    const limit = limits[key]
    summary[key] = {
      used:       usageObj[key],
      limit:      limit,
      unlimited:  limit === -1,
      percentage: limit === -1 ? 0 : Math.round((usageObj[key] / limit) * 100),
    }
  }
  return { plan: sub.plan, usage: summary, resetAt: sub.usageResetAt }
}

export const createOrderService = async (userId, couponCode = null) => {
  let sub = await Subscription.findOne({ user: userId })
  if (!sub) sub = await Subscription.create({ user: userId, plan: 'free', status: 'inactive' })
  if (sub.plan === 'pro' && sub.status === 'active') {
    throw new ApiError(400, 'You already have an active Pro subscription')
  }

  const rzp = getRazorpay()
  if (!rzp) throw new ApiError(500, 'Payment system not configured. Add RAZORPAY credentials to .env')

  // Base price ₹999
  const BASE_PRICE_PAISE = 99900
  let finalAmount = BASE_PRICE_PAISE
  let appliedCoupon = null
  let discountPercent = 0

  // Validate and apply coupon if provided
  if (couponCode) {
    const { validateCouponService } = await import('../coupon/coupon.service.js')
    try {
      const couponResult = await validateCouponService(couponCode, userId)
      discountPercent = couponResult.discountPercent
      finalAmount = Math.round(BASE_PRICE_PAISE * (1 - discountPercent / 100))
      appliedCoupon = couponResult.code
    } catch (err) {
      throw new ApiError(400, err.message || 'Invalid coupon code')
    }
  }

  try {
    const shortUserId = userId.toString().slice(-8)
    const shortTs = Date.now().toString().slice(-8)
    const receipt = `rcpt_${shortUserId}_${shortTs}`

    const order = await rzp.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt,
      notes: {
        userId:         userId.toString(),
        couponCode:     appliedCoupon || '',
        discountPercent: discountPercent.toString(),
      },
    })

    return {
      orderId:         order.id,
      amount:          order.amount,
      currency:        order.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
      originalAmount:  BASE_PRICE_PAISE,
      discountPercent,
      appliedCoupon,
    }
  } catch (error) {
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
  if (!sub) sub = new Subscription({ user: userId })
  sub.plan = 'pro'
  sub.status = 'active'
  sub.currentPeriodStart = now
  sub.currentPeriodEnd = periodEnd
  sub.cancelAtPeriodEnd = false
  await sub.save()

  // Mark coupon as used if one was applied (stored in Razorpay order notes)
  // We retrieve coupon from the order notes via Razorpay API or pass it explicitly
  // Here we handle it via the couponCode field if passed in body
  return { plan: sub.plan, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd }
}

export const cancelSubscriptionService = async (userId) => {
  const sub = await Subscription.findOne({ user: userId })
  if (!sub || sub.plan !== 'pro') throw new ApiError(400, 'No active Pro subscription found')
  sub.cancelAtPeriodEnd = true
  await sub.save()
  return { message: 'Subscription will cancel at period end', currentPeriodEnd: sub.currentPeriodEnd }
}