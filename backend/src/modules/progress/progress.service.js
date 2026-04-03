import AtsResult  from '../ats/ats.model.js'
import Interview  from '../interview/interview.model.js'
import JobMatch   from '../jobmatch/jobmatch.model.js'
import CoverLetter from '../coverletter/coverletter.model.js'
import ProgressSnapshot from './progress.model.js'
import { calculateReadiness, getReadinessLevel } from './progress.aggregator.js'

/**
 * BUG FIX: Previously a snapshot was written to DB on EVERY dashboard call,
 * causing unbounded growth. Now we only save a snapshot if at least 1 hour
 * has passed since the last one (throttled snapshots for trend tracking).
 */
export const getDashboardService = async (userId) => {
  const [atsResults, interviews, jobMatches, coverLetters] = await Promise.all([
    AtsResult.find({ user: userId }).sort({ createdAt: 1 }).select('score createdAt'),
    Interview.find({ user: userId, status: 'completed' }).sort({ createdAt: 1 }).select('role roundType totalScore createdAt'),
    JobMatch.find({ user: userId }).sort({ createdAt: 1 }).select('matchScore missingKeywords createdAt'),
    CoverLetter.countDocuments({ user: userId }),
  ])

  // ATS progress
  const atsScores  = atsResults.map(r => r.score)
  const latestAts  = atsScores[atsScores.length - 1] || 0

  // Interview progress
  const interviewScores = interviews.filter(i => i.totalScore !== null).map(i => i.totalScore)
  const avgInterview = interviewScores.length
    ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
    : 0

  // Job match progress
  const matchScores = jobMatches.map(m => m.matchScore)
  const avgMatch = matchScores.length
    ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
    : 0

  // Common missing keywords across all job matches
  const allMissing = jobMatches.flatMap(m => m.missingKeywords)
  const missingFreq = allMissing.reduce((acc, kw) => { acc[kw] = (acc[kw] || 0) + 1; return acc }, {})
  const topMissing = Object.entries(missingFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw)

  const overallReadiness = calculateReadiness(latestAts, avgInterview, avgMatch)
  const readinessLevel   = getReadinessLevel(overallReadiness)

  // Throttled snapshot: only save if last snapshot was > 1 hour ago (prevents DB bloat)
  const lastSnapshot = await ProgressSnapshot.findOne({ user: userId }).sort({ createdAt: -1 }).select('createdAt')
  const oneHourAgo   = new Date(Date.now() - 60 * 60 * 1000)
  if (!lastSnapshot || lastSnapshot.createdAt < oneHourAgo) {
    await ProgressSnapshot.create({
      user: userId,
      overallReadiness,
      readinessLevel,
      atsScoreSnapshot:       latestAts,
      interviewScoreSnapshot: avgInterview,
      matchScoreSnapshot:     avgMatch,
    })
  }

  return {
    resumeProgress: {
      totalResumes:    atsResults.length,
      latestAtsScore:  latestAts,
      atsScoreHistory: atsScores,
      improvement: atsScores.length > 1
        ? `${atsScores[atsScores.length - 1] - atsScores[0] > 0 ? '+' : ''}${atsScores[atsScores.length - 1] - atsScores[0]} points`
        : 'N/A',
    },
    interviewProgress: {
      totalInterviews: interviews.length,
      averageScore:    avgInterview,
      scoreHistory:    interviewScores,
      recentInterviews: interviews.slice(-5).map(i => ({
        role: i.role, roundType: i.roundType, score: i.totalScore, date: i.createdAt,
      })),
      improvement: interviewScores.length > 1
        ? `${interviewScores[interviewScores.length - 1] - interviewScores[0] > 0 ? '+' : ''}${interviewScores[interviewScores.length - 1] - interviewScores[0]} points`
        : 'N/A',
    },
    jobMatchProgress: {
      totalMatches:        jobMatches.length,
      averageMatchScore:   avgMatch,
      matchScoreHistory:   matchScores,
      mostMissingKeywords: topMissing,
    },
    coverLettersGenerated:  coverLetters,
    overallReadinessScore:  overallReadiness,
    readinessLevel,
  }
}

export const getProgressHistoryService = async (userId) => {
  return await ProgressSnapshot.find({ user: userId }).sort({ createdAt: 1 })
}
