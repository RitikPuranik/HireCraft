import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ChevronRight, ArrowLeft, AlertCircle, CheckCircle, Info, Mic2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeAPI } from '../../api/resume';
import { PageLoader, ScoreRing, Badge } from '../../components/ui';

export default function ResumeAnalysis() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeAPI.getOne(id).then((r) => r.data?.data || r.data),
  });

  const resume = data?.resume || data;
  // Normalise: the backend stores ATS results as atsScore / atsAnalysis on the resume document.
  // Map them to a single `analysis` shape so the JSX below works without changes.
  const analysis = resume?.atsAnalysis != null && resume?.atsScore != null ? {
    score:       resume.atsScore,
    summary:     resume.atsAnalysis.verdict,
    strengths:   [],
    improvements: (resume.atsAnalysis.missingSections || []).map(s => `Missing section: ${s}`),
    keywords:    resume.atsAnalysis.matchedKeywords || [],
    suggestions: resume.atsAnalysis.suggestions || [],
  } : resume?.analysis ?? null;

  const analyzeMutation = useMutation({
    mutationFn: () => resumeAPI.analyze(id),
    onMutate: () => setAnalyzing(true),
    onSuccess: () => {
      toast.success('Analysis complete!');
      qc.invalidateQueries(['resume', id]);
      qc.invalidateQueries(['resumes']);
    },

    onError: (err) => toast.error(err.response?.data?.message || 'Analysis failed'),
    onSettled: () => setAnalyzing(false),
  });

  if (isLoading) return <PageLoader />;
  if (!resume) return <div className="text-center text-sage-400 py-16">Resume not found</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/resumes" className="p-2 rounded-xl hover:bg-cream-100 text-sage-400 hover:text-sage-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold text-charcoal-800">
            {resume.filename || resume.originalName || 'Resume Analysis'}
          </h1>
          <p className="text-xs text-sage-400 mt-0.5">
            Uploaded {new Date(resume.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {!analysis && (
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzing}
            className="btn-primary text-sm py-2.5"
          >
            <Sparkles size={16} />
            {analyzing ? 'Analyzing...' : 'Analyze with AI'}
          </button>
        )}
      </div>

      {!analysis ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sage-50 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-sage-500" />
          </div>
          <h2 className="font-display text-xl font-semibold text-charcoal-800 mb-2">Ready for AI Analysis</h2>
          <p className="text-sm text-sage-400 max-w-sm mx-auto mb-6">
            Get your ATS score, keyword analysis, and personalized suggestions to improve your resume.
          </p>
          <button onClick={() => analyzeMutation.mutate()} disabled={analyzing} className="btn-primary">
            <Sparkles size={18} />
            {analyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score Card */}
          <div className="card p-6">
            <div className="flex items-center gap-6">
              <ScoreRing score={analysis.score ?? resume.atsScore ?? 0} size={100} />
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold text-charcoal-800 mb-1">ATS Score</h2>
                <p className="text-sm text-sage-400 mb-3">
                  {(analysis.score ?? 0) >= 70 ? 'Strong resume — likely to pass ATS filters' : (analysis.score ?? 0) >= 40 ? 'Moderate — needs some improvements' : 'Needs significant improvement'}
                </p>
                <div className="flex gap-3 flex-wrap">
                  {(analysis.score ?? 0) >= 70 ? (
                    <Badge variant="success">High Impact</Badge>
                  ) : (analysis.score ?? 0) >= 40 ? (
                    <Badge variant="warning">Moderate</Badge>
                  ) : (
                    <Badge variant="danger">Needs Work</Badge>
                  )}
                  {resume.skills?.length > 0 && (
                    <Badge variant="info">{resume.skills.length} skills detected</Badge>
                  )}
                </div>
              </div>
              <Link to="/interview" className="btn-secondary text-sm py-2.5 hidden md:flex">
                <Mic2 size={16} /> Practice Interview
              </Link>
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="card p-5">
              <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2 text-sm">
                <Info size={16} className="text-sage-500" /> Summary
              </h3>
              <p className="text-sm text-sage-600 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.strengths?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-sage-500" /> Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sage-400 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-sage-600">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.improvements?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2 text-sm">
                  <AlertCircle size={16} className="text-warm-500" /> Improvements
                </h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-sage-600">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Keywords */}
          {analysis.keywords?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-charcoal-800 mb-3 text-sm">Keywords Found</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((k) => (
                  <span key={k} className="text-xs px-3 py-1 bg-sage-50 text-sage-600 border border-sage-100 rounded-full">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resume.skills?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-charcoal-800 mb-3 text-sm">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((s) => (
                  <span key={s} className="text-xs px-3 py-1 bg-cream-100 text-charcoal-800 border border-cream-300 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2 text-sm">
                <Sparkles size={16} className="text-sage-500" /> AI Suggestions
              </h3>
              <div className="space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-cream-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <ChevronRight size={12} className="text-sage-600" />
                    </div>
                    <p className="text-sm text-sage-600">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}