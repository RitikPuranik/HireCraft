/**
 * Plan definitions — single source of truth
 * Free tier limits are enforced via the usageGuard middleware
 * Pro tier gets unlimited (-1 = unlimited)
 */
export const PLANS = {
  free: {
    name:     'Free',
    price:    0,
    currency: 'INR',
    limits: {
      resumes:      1,    // max resumes allowed to exist at once (not a daily counter)
      atsChecks:    3,    // per day
      interviews:   2,    // per day
      jobMatches:   1,    // per day
      coverLetters: 1,    // per day
      pdfDownloads: 0,    // not allowed on free
    },
    features: [
      '1 resume',
      '3 ATS checks/day',
      '2 mock interviews/day',
      '1 job match/day',
      '1 cover letter/day',
      'No PDF downloads',
    ],
  },

  pro: {
    name:     'Pro',
    price:    999,     // INR per month (₹999 ≈ $12)
    currency: 'INR',
    // BUG FIX: removed dead RAZORPAY_PLAN_ID reference — this backend uses
    // one-time order verification, not Razorpay subscription plans.
    limits: {
      resumes:      -1,  // unlimited
      atsChecks:    -1,
      interviews:   -1,
      jobMatches:   -1,
      coverLetters: -1,
      pdfDownloads: -1,
    },
    features: [
      'Unlimited resumes',
      'Unlimited ATS checks',
      'Unlimited mock interviews',
      'Unlimited job matches',
      'Unlimited cover letters',
      'PDF downloads',
      'Interview history & analytics',
      'Progress tracking dashboard',
      'Priority AI responses',
    ],
  },
}

// Feature keys that map to usage counters
export const USAGE_KEYS = {
  CREATE_RESUME:   'resumes',
  ATS_CHECK:       'atsChecks',
  START_INTERVIEW: 'interviews',
  JOB_MATCH:       'jobMatches',
  COVER_LETTER:    'coverLetters',
  PDF_DOWNLOAD:    'pdfDownloads',
}
