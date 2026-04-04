import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Mic2, CheckCircle, AlertCircle, Star, Plus,
  TrendingUp, Award, Target, Clock, BarChart2, Download, Share2
} from 'lucide-react';
import { interviewAPI } from '../../api/interview';
import { PageLoader, ScoreRing, Badge } from '../../components/ui';

/* Circular progress ring for sub-scores */
function MiniScoreRing({ score, max = 10, label, color = '#ec4899' }) {
  const pct  = (score / max) * 100;
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb20" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color}
            strokeWidth="5" strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-charcoal-800">{score}/{max}</span>
        </div>
      </div>
      <span className="text-[10px] text-sage-500 font-medium text-center leading-tight max-w-[70px]">{label}</span>
    </div>
  );
}

/* Colored bar for per-question scores */
function ScoreBar({ score, max = 10 }) {
  const pct   = (score / max) * 100;
  const color = score >= 7 ? 'bg-emerald-400' : score >= 4 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-cream-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-charcoal-700 w-8 text-right">{score}/10</span>
    </div>
  );
}

export default function InterviewReport() {
  const { id } = useParams();

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['interview-report', id],
    queryFn: () => interviewAPI.getReport(id).then(r => r.data),
    retry: 2,
  });

  const { data: evalData, isLoading: evalLoading } = useQuery({
    queryKey: ['interview-eval', id],
    queryFn: () => interviewAPI.evaluate(id).then(r => r.data),
    retry: 1,
  });

  if (reportLoading || evalLoading) return <PageLoader />;

  const report    = reportData?.report || reportData;
  const session   = reportData?.session || report;
  const evalObj   = evalData?.data || evalData?.evaluation || evalData;
  const source    = evalObj || report || session;

  if (!source) return <div className="text-center text-sage-400 py-16">Report not found</div>;

  const score      = evalObj?.overallScore ?? report?.overallScore ?? report?.score ?? session?.totalScore;
  const breakdown  = evalObj?.breakdown || {};
  const strengths  = evalObj?.strengths  || report?.strengths  || [];
  const weaknesses = evalObj?.weaknesses || report?.weaknesses || report?.improvements || [];
  const suggestions= evalObj?.suggestions || report?.suggestions || [];
  const perQ       = evalObj?.perQuestion || report?.perQuestion || [];
  const qaList     = report?.answers || session?.answers || [];
  const role       = session?.role || report?.role || 'Interview';
  const roundType  = session?.roundType || report?.roundType || '';
  const createdAt  = source?.createdAt ? new Date(source.createdAt) : new Date();

  // Merge perQ feedback with qaList answers
  const mergedQA = qaList.map((qa, i) => ({
    ...qa,
    score:    perQ[i]?.score,
    feedback: perQ[i]?.feedback,
  }));

  const scoreLabel = score == null ? 'Complete'
                   : score >= 80   ? 'Excellent'
                   : score >= 65   ? 'Strong'
                   : score >= 50   ? 'Good'
                   : score >= 35   ? 'Fair'
                   : 'Needs Work';

  const scoreColor = score == null ? '#94a3b8'
                   : score >= 80   ? '#10b981'
                   : score >= 65   ? '#3b82f6'
                   : score >= 50   ? '#f59e0b'
                   : score >= 35   ? '#f97316'
                   : '#ef4444';

  const breakdownItems = [
    { key: 'technicalKnowledge',   label: 'Technical\nKnowledge',   color: '#3b82f6' },
    { key: 'communicationClarity', label: 'Communication\nClarity',  color: '#8b5cf6' },
    { key: 'answerCompleteness',   label: 'Answer\nCompleteness',    color: '#ec4899' },
    { key: 'confidence',           label: 'Confidence\n& Presence',  color: '#f59e0b' },
  ];

  const handlePrint = () => window.print();

  return (
    <div className="max-w-4xl mx-auto animate-fade-up pb-12">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/interview" className="p-2 rounded-xl hover:bg-cream-100 text-sage-400 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold text-charcoal-800">Interview Report</h1>
          <p className="text-xs text-sage-400 mt-0.5">
            {role} · <span className="capitalize">{roundType}</span> ·{' '}
            {createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-sage-600 text-xs font-medium transition-colors">
            <Download size={14} /> Export PDF
          </button>
          <Link to="/interview" className="btn-primary text-sm py-2.5">
            <Plus size={16} /> New Interview
          </Link>
        </div>
      </div>

      {/* ── Score Hero ── */}
      <div className="card p-6 mb-5">
        <div className="flex items-center gap-8">
          {/* Big score ring */}
          <div className="flex-shrink-0">
            {score != null ? (
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="64" cy="64" r="56" fill="none" stroke={scoreColor}
                    strokeWidth="10" strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-charcoal-800">{score}</span>
                  <span className="text-xs text-sage-400">/100</span>
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-cream-100 flex items-center justify-center">
                <Mic2 size={28} className="text-sage-400" />
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-2xl font-semibold text-charcoal-800">{scoreLabel}</h2>
              <Badge variant={score >= 65 ? 'success' : score >= 40 ? 'warning' : 'danger'}>
                {source.status || 'completed'}
              </Badge>
            </div>

            {(evalObj?.summary || report?.feedback || report?.summary) && (
              <p className="text-sm text-sage-600 leading-relaxed mb-3">
                {evalObj?.summary || report?.feedback || report?.summary}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {qaList.length > 0 && (
                <div className="flex items-center gap-1.5 bg-cream-50 rounded-lg px-3 py-1.5">
                  <BarChart2 size={13} className="text-sage-400" />
                  <span className="text-xs text-sage-600 font-medium">{qaList.length} Questions</span>
                </div>
              )}
              {roundType && (
                <div className="flex items-center gap-1.5 bg-cream-50 rounded-lg px-3 py-1.5">
                  <Target size={13} className="text-sage-400" />
                  <span className="text-xs text-sage-600 font-medium capitalize">{roundType} Round</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown mini rings */}
        {Object.keys(breakdown).length > 0 && (
          <div className="mt-6 pt-5 border-t border-cream-200">
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-widest mb-4">Score Breakdown</p>
            <div className="flex justify-around flex-wrap gap-4">
              {breakdownItems.map(({ key, label, color }) => (
                breakdown[key] != null && (
                  <MiniScoreRing key={key} score={breakdown[key]} label={label} color={color} />
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Strengths & Improvements ── */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          {strengths.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={14} className="text-emerald-500" />
                </div>
                What went well
              </h3>
              <ul className="space-y-2.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-emerald-600">{i + 1}</span>
                    </div>
                    <span className="text-sm text-sage-600 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertCircle size={14} className="text-amber-500" />
                </div>
                Areas to improve
              </h3>
              <ul className="space-y-2.5">
                {weaknesses.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-amber-600">{i + 1}</span>
                    </div>
                    <span className="text-sm text-sage-600 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Actionable Suggestions ── */}
      {suggestions.length > 0 && (
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-blue-500" />
            </div>
            Action Plan
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-white">{i + 1}</span>
                </div>
                <span className="text-sm text-sage-700 leading-relaxed">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detailed Q&A Review ── */}
      {(mergedQA.length > 0 || perQ.length > 0) && (
        <div className="card p-5">
          <h3 className="font-semibold text-charcoal-800 mb-5 flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
              <Star size={14} className="text-purple-500" />
            </div>
            Question-by-Question Review
          </h3>

          <div className="space-y-6">
            {(mergedQA.length > 0 ? mergedQA : perQ).map((item, i) => (
              <div key={i} className="border border-cream-200 rounded-xl overflow-hidden">
                {/* Question header */}
                <div className="flex items-start gap-3 p-4 bg-cream-50/50">
                  <div className="w-7 h-7 rounded-full bg-white border border-cream-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-sage-600">{i + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-charcoal-800 flex-1 leading-relaxed">
                    {item.question || item.q}
                  </p>
                  {item.score != null && (
                    <div className="flex-shrink-0 ml-2">
                      <Badge variant={item.score >= 7 ? 'success' : item.score >= 4 ? 'warning' : 'danger'}>
                        {item.score}/10
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {/* Score bar */}
                  {item.score != null && (
                    <ScoreBar score={item.score} />
                  )}

                  {/* Answer */}
                  {(item.answer || item.a) && (item.answer || item.a) !== '[Skipped]' && (
                    <div className="p-3 bg-white rounded-xl border border-cream-200">
                      <p className="text-xs text-sage-400 mb-1.5 font-semibold uppercase tracking-wide">Your Answer</p>
                      <p className="text-sm text-sage-700 leading-relaxed">{item.answer || item.a}</p>
                    </div>
                  )}

                  {(item.answer || item.a) === '[Skipped]' && (
                    <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                      <p className="text-xs text-sage-400 italic">Question skipped</p>
                    </div>
                  )}

                  {/* AI feedback */}
                  {item.feedback && (
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <p className="text-xs text-purple-500 mb-1.5 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <Star size={10} /> AI Feedback
                      </p>
                      <p className="text-sm text-sage-700 leading-relaxed">{item.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {mergedQA.length === 0 && perQ.length === 0 && (
        <div className="card p-8 text-center">
          <Award size={32} className="text-sage-300 mx-auto mb-3" />
          <h3 className="font-semibold text-charcoal-700 mb-1">Interview Completed</h3>
          <p className="text-sm text-sage-400">Detailed Q&A analysis will appear here once evaluation is complete.</p>
        </div>
      )}
    </div>
  );
}