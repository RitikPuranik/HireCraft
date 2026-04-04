import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { ApiResponse } from '../../shared/utils/apiResponse.js'
import {
  setupInterviewService, startInterviewService, submitAnswerService,
  completeInterviewService, getInterviewHistoryService, getInterviewService,
  getInterviewReportService,
} from './interview.service.js'

export const setupInterview = asyncHandler(async (req, res) => {
  const interview = await setupInterviewService(req.user._id, req.body)
  res.status(201).json(new ApiResponse(201, interview, 'Interview setup complete'))
})

export const startInterview = asyncHandler(async (req, res) => {
  const interview = await startInterviewService(req.params.id, req.user._id)
  res.status(200).json(new ApiResponse(200, interview, 'Interview started'))
})

export const submitAnswer = asyncHandler(async (req, res) => {
  const interview = await submitAnswerService(req.params.id, req.user._id, req.body)
  res.status(200).json(new ApiResponse(200, interview, 'Answer submitted'))
})

export const completeInterview = asyncHandler(async (req, res) => {
  const interview = await completeInterviewService(req.params.id, req.user._id)
  res.status(200).json(new ApiResponse(200, interview, 'Interview completed'))
})

export const getInterviewHistory = asyncHandler(async (req, res) => {
  const history = await getInterviewHistoryService(req.user._id)
  res.status(200).json(new ApiResponse(200, history, 'Interview history fetched'))
})

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await getInterviewService(req.params.id, req.user._id)
  res.status(200).json(new ApiResponse(200, interview, 'Interview fetched'))
})

export const getInterviewReport = asyncHandler(async (req, res) => {
  const report = await getInterviewReportService(req.params.id, req.user._id)
  res.status(200).json(new ApiResponse(200, report, 'Report fetched'))
})
import { generateAIResponse } from './interview.ai.js'

export const aiInterviewerResponse = asyncHandler(async (req, res) => {
  const { question, answer, case: caseType, repeatCount, role, roundType } = req.body
  if (!question || !caseType) {
    return res.status(400).json(new ApiResponse(400, null, 'question and case are required'))
  }
  const text = await generateAIResponse({ question, answer, case: caseType, repeatCount, role, roundType })
  res.status(200).json(new ApiResponse(200, { text }, 'AI response generated'))
})