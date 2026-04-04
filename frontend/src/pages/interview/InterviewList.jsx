import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Mic2, Plus, Clock, CheckCircle, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../../api/interview';
import { resumeAPI } from '../../api/resume';
import { PageLoader, EmptyState, Badge, Spinner } from '../../components/ui';

export default function InterviewList() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [starting, setStarting] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['interview-sessions'],
    queryFn: async () => {
      const result = await interviewAPI.getSessions();
      console.log('Sessions result:', result);
      return result || [];
    },
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const result = await resumeAPI.getAll();
      console.log('Resumes result:', result);
      return result || [];
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm();

const onStart = async (data) => {
  setStarting(true);
  try {
    const res = await interviewAPI.startSession(data);
    const id = res.data?.data?._id || res.data?.session?._id || res.data?._id;
    toast.success('Interview session started!');
    navigate(`/interview/session/${id}`);
  } catch (err) {
    console.error('Start session error:', err.response?.data);
    
    // Show specific validation errors
    if (err.response?.data?.errors && err.response.data.errors.length > 0) {
      const errorMessages = err.response.data.errors.map(e => e.msg || e.message).join(', ');
      toast.error(`Validation failed: ${errorMessages}`);
    } else {
      toast.error(err.response?.data?.message || 'Failed to start session');
    }
  } finally {
    setStarting(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800">Interview Prep</h1>
          <p className="text-sm text-sage-400 mt-1">Practice with AI-powered mock interviews</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2.5">
          <Plus size={16} /> New Session
        </button>
      </div>

      {isLoading ? <PageLoader /> : sessions?.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="No interview sessions yet"
          description="Start a mock interview to practice with AI-generated questions tailored to your role."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
              <Plus size={16} /> Start Interview
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sessions?.map((s) => (
            <div key={s._id} className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-warm-50 flex items-center justify-center flex-shrink-0">
                <Mic2 size={18} className="text-warm-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-charcoal-800 text-sm">{s.role || s.jobRole || 'Mock Interview'}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-sage-400">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {s.questionsCount != null && <span className="text-xs text-sage-400">{s.questionsCount} questions</span>}
                </div>
              </div>
              <Badge variant={s.status === 'completed' ? 'success' : 'warning'}>
                {s.status === 'completed' ? <CheckCircle size={12} className="inline mr-1" /> : <Clock size={12} className="inline mr-1" />}
                {s.status || 'in progress'}
              </Badge>
              <Link
                to={s.status === 'completed' ? `/interview/report/${s._id}` : `/interview/session/${s._id}`}
                className="btn-secondary text-xs py-2"
              >
                {s.status === 'completed' ? 'View Report' : 'Continue'}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Start Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-semibold text-charcoal-800">Start Mock Interview</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-cream-100 text-sage-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onStart)} className="space-y-4">
              <div>
                <label className="label">Job Role / Position</label>
                <input
                  {...register('jobRole', { required: 'Job role is required' })}
                  placeholder="e.g. Frontend Developer, Data Analyst"
                  className="input-field"
                />
                {errors.jobRole && <p className="error-text">{errors.jobRole.message}</p>}
              </div>

              <div>
                <label className="label">Interview Round Type</label>
                <select {...register('roundType', { required: 'Round type is required' })} className="input-field">
                  <option value="">Select round type</option>
                  <option value="technical">Technical Round</option>
                  <option value="hr">HR / Managerial Round</option>
                  <option value="mixed">Mixed (Both)</option>
                </select>
                {errors.roundType && <p className="error-text">{errors.roundType.message}</p>}
              </div>
              <div>
                <label className="label">Experience Level</label>
                <select {...register('experienceLevel', { required: 'Experience level is required' })} className="input-field">
                  <option value="">Select experience level</option>
                  <option value="fresher">Fresher (0–1 years)</option>
                  <option value="junior">Junior (1–3 years)</option>
                  <option value="mid">Mid-level (3–5 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                </select>
                {errors.experienceLevel && <p className="error-text">{errors.experienceLevel.message}</p>}
              </div>
              {resumes?.length > 0 && (
                <div>
                  <label className="label">Link Resume (optional)</label>
                  <select {...register('resumeId')} className="input-field">
                    <option value="">— Select a resume —</option>
                    {resumes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.filename || r.originalName || r.title || 'Resume'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Number of Questions</label>
                <select {...register('questionsCount')} className="input-field" defaultValue="10">
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                </select>
              </div>

              <button type="submit" disabled={starting} className="btn-primary w-full py-3 mt-2">
                {starting ? <><Spinner size={16} className="text-white" /> Starting...</> : <><Mic2 size={16} /> Start Interview</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}