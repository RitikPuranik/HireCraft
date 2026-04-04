import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, CheckCircle, AlertCircle, Sparkles, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobmatchAPI } from '../../api/jobmatch';
import { resumeAPI } from '../../api/resume';
import { ScoreRing, Badge, Spinner, PageLoader } from '../../components/ui';

export default function JobMatch() {
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeAPI.getAll,
  });

  const { data: history = [], isLoading: histLoading, refetch } = useQuery({
    queryKey: ['jobmatch-history'],
    queryFn: () => jobmatchAPI.getHistory().then((r) => r.data?.data || []),
  });

  const getResumeName = (r) => r.uploadedPdf?.originalName || r.personalInfo?.fullName || r.title || 'Resume';

  const handleAnalyze = async () => {
    if (!selectedResume) return toast.error('Select a resume');
    if (!jobDescription.trim()) return toast.error('Paste a job description');
    setLoading(true);
    try {
      const res = await jobmatchAPI.analyze({ resumeId: selectedResume, jobDescription: jobDescription.trim() });
      setResult(res.data?.data || res.data);
      refetch();
      toast.success('Match analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-charcoal-800">Job Match</h1>
        <p className="text-sm text-sage-400 mt-1">Compare your resume against any job description</p>
      </div>

      <div className="card p-6 mb-6 space-y-4">
        <div>
          <label className="label">Select Resume</label>
          <select value={selectedResume} onChange={(e) => setSelectedResume(e.target.value)} className="input-field">
            <option value="">Choose a resume…</option>
            {resumes.map((r) => <option key={r._id} value={r._id}>{getResumeName(r)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={8}
            className="input-field resize-none"
          />
        </div>
        <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
          {loading ? <><Spinner size={16} className="text-white" /> Analysing…</> : <><Brain size={16} /> Analyse Match</>}
        </button>
      </div>

      {result && (
        <div className="space-y-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-6">
              <ScoreRing score={result.matchScore} size={100} />
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold text-charcoal-800 mb-1">Match Score: {result.matchScore}%</h2>
                {result.verdict && (
                  <p className="text-sm text-sage-500 mb-2">{result.verdict}</p>
                )}
                <Badge variant={result.matchScore >= 70 ? 'success' : result.matchScore >= 40 ? 'warning' : 'danger'}>
                  {result.matchScore >= 70 ? 'Strong Match' : result.matchScore >= 40 ? 'Moderate Match' : 'Weak Match'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {result.matchedKeywords?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-sage-500" /> Matched Keywords ({result.matchedKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.matchedKeywords.map((k) => (
                    <span key={k} className="text-xs px-2.5 py-1 bg-sage-50 text-sage-600 border border-sage-100 rounded-full">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {result.missingKeywords?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2 text-sm">
                  <AlertCircle size={16} className="text-warm-500" /> Missing Keywords ({result.missingKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((k) => (
                    <span key={k} className="text-xs px-2.5 py-1 bg-warm-50 text-warm-500 border border-warm-200 rounded-full">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.suggestions?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2 text-sm">
                <Sparkles size={16} className="text-sage-500" /> How to Improve Your Match
              </h3>
              <div className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-cream-50 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-sage-600">{i + 1}</div>
                    <p className="text-sm text-sage-600">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold text-charcoal-800 mb-4">Match History</h2>
        {histLoading ? <PageLoader /> : history.length === 0 ? (
          <div className="card p-8 text-center text-sage-400">No analyses yet</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item._id} className="card p-4 flex items-center gap-4">
                <ScoreRing score={item.matchScore} size={52} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-800 truncate">{item.verdict || 'Job Match'}</p>
                  <p className="text-xs text-sage-400 flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <Badge variant={item.matchScore >= 70 ? 'success' : item.matchScore >= 40 ? 'warning' : 'danger'}>
                  {item.matchScore}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}