import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorMiddleware } from './shared/middlewares/error.middleware.js'

import authRoutes         from './modules/auth/auth.routes.js'
import userRoutes         from './modules/user/user.routes.js'
import resumeRoutes       from './modules/resume/resume.routes.js'
import atsRoutes          from './modules/ats/ats.routes.js'
import interviewRoutes    from './modules/interview/interview.routes.js'
import evaluationRoutes   from './modules/evaluation/evaluation.routes.js'
import speechRoutes       from './modules/speech/speech.routes.js'
import jobmatchRoutes     from './modules/jobmatch/jobmatch.routes.js'
import coverletterRoutes  from './modules/coverletter/coverletter.routes.js'
import progressRoutes     from './modules/progress/progress.routes.js'
import subscriptionRoutes from './modules/subscription/subscription.routes.js'

const app = express()

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Global rate limiter (generous — tighter limits on auth routes) ───────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})
app.use(globalLimiter)

// ── Strict rate limiter for auth endpoints ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
})

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }))
app.get('/', (req, res) => res.json({ message: 'CareerForge API running' }))

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes)
app.use('/api/users',        userRoutes)
app.use('/api/resumes',      resumeRoutes)
app.use('/api/ats',          atsRoutes)
app.use('/api/interviews',   interviewRoutes)
app.use('/api/evaluation',   evaluationRoutes)
app.use('/api/speech',       speechRoutes)
app.use('/api/jobmatch',     jobmatchRoutes)
app.use('/api/coverletter',  coverletterRoutes)
app.use('/api/progress',     progressRoutes)
app.use('/api/subscription', subscriptionRoutes)

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorMiddleware)

export default app
