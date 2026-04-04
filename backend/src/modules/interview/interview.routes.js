import { Router } from 'express'
import {
  setupInterview, startInterview, submitAnswer,
  completeInterview, getInterviewHistory, getInterview,
  getInterviewReport, aiInterviewerResponse,
} from './interview.controller.js'
import { protect } from '../../shared/middlewares/protect.middleware.js'
import { usageGuard } from '../../shared/middlewares/usageGuard.middleware.js'
import { USAGE_KEYS } from '../../shared/constants/plans.js'

const router = Router()
router.use(protect)
router.post('/setup',         usageGuard(USAGE_KEYS.START_INTERVIEW), setupInterview)
router.post('/ai-response',   aiInterviewerResponse)
router.patch('/:id/start',    startInterview)
router.patch('/:id/answer',   submitAnswer)
router.patch('/:id/complete', completeInterview)
router.get('/history',        getInterviewHistory)
router.get('/:id/report',     getInterviewReport)
router.get('/:id',            getInterview)
export default router