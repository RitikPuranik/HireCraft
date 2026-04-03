import Subscription from '../../modules/subscription/subscription.model.js'
import Resume from '../../modules/resume/resume.model.js'
import { PLANS, USAGE_KEYS } from '../constants/plans.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Usage guard middleware factory
 * Usage: router.post('/create', protect, usageGuard(USAGE_KEYS.CREATE_RESUME), controller)
 *
 * BUG FIX: The `resumes` limit is a "max total resumes at once" limit, NOT a daily rate limit.
 * All other features (atsChecks, interviews, etc.) are daily limits that reset every 24h.
 * Previously, the daily reset was zeroing out the resume counter causing the resume limit
 * to never actually be enforced properly.
 */
export const usageGuard = (featureKey) => asyncHandler(async (req, res, next) => {
  let sub = await Subscription.findOne({ user: req.user._id })

  // Auto-create free subscription if not exists
  if (!sub) {
    sub = await Subscription.create({ user: req.user._id, plan: 'free', status: 'active' })
  }

  const plan  = PLANS[sub.plan] || PLANS.free
  const limit = plan.limits[featureKey]

  // -1 means unlimited (pro plan) — skip all checks
  if (limit === -1) {
    req.subscription = sub
    return next()
  }

  // ── Resume limit: check total count in DB (not a daily counter) ───────────
  if (featureKey === USAGE_KEYS.CREATE_RESUME) {
    const resumeCount = await Resume.countDocuments({ user: req.user._id })
    if (resumeCount >= limit) {
      throw new ApiError(403,
        `You've reached the resume limit for your ${sub.plan} plan (${limit} resume). Upgrade to Pro for unlimited resumes.`,
        [{ feature: featureKey, limit, used: resumeCount, plan: sub.plan }]
      )
    }
    req.subscription = sub
    return next()
  }

  // ── Daily limits: reset counters if a new day has started ─────────────────
  const now    = new Date()
  const resetAt = new Date(sub.usageResetAt)
  const dayPassed =
    now.getFullYear() > resetAt.getFullYear() ||
    now.getMonth()    > resetAt.getMonth()    ||
    now.getDate()     > resetAt.getDate()

  if (dayPassed) {
    // Only reset daily-rate-limited counters — NOT the resume count
    sub.usage.atsChecks    = 0
    sub.usage.interviews   = 0
    sub.usage.jobMatches   = 0
    sub.usage.coverLetters = 0
    sub.usage.pdfDownloads = 0
    sub.usageResetAt = now
    await sub.save()
  }

  const current = sub.usage[featureKey] ?? 0

  if (current >= limit) {
    throw new ApiError(403,
      `You've reached your ${sub.plan} plan limit for this feature. Upgrade to Pro to continue.`,
      [{ feature: featureKey, limit, used: current, plan: sub.plan }]
    )
  }

  // Increment usage
  sub.usage[featureKey] = current + 1
  await sub.save()

  req.subscription = sub
  next()
})
