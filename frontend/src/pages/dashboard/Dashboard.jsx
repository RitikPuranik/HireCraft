import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Mic2, ArrowRight, Plus, TrendingUp, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { resumeAPI } from '../../api/resume';
import { interviewAPI } from '../../api/interview';
import { StatCard, PageLoader, Badge } from '../../components/ui';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const result = await resumeAPI.getAll();
      console.log('Resumes result:', result); // Debug
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['interview-sessions'],
    queryFn: async () => {
      const result = await interviewAPI.getSessions();
      console.log('Sessions result:', result); // Debug
      return Array.isArray(result) ? result : [];
    },
  });

  // Then use directly (no need for extra fallbacks)
  const resumeList = resumes || [];
  const sessionList = sessions || [];

  const avgScore = resumeList.length
    ? Math.round(resumeList.filter((r) => r.score).reduce((a, r) => a + (r.score || 0), 0) / resumeList.filter((r) => r.score).length) || 0
    : 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-sage-400 mb-1">{greeting} 👋</p>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800">
            {user?.name?.split(' ')[0] || 'Welcome'}
          </h1>
        </div>
        <Link to="/resumes/upload" className="btn-primary text-sm py-2.5">
          <Plus size={16} /> Upload Resume
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Resumes" value={resumeList.length} icon={FileText} color="sage" />
        <StatCard label="Interviews" value={sessionList.length} icon={Mic2} color="warm" />
        <StatCard label="Avg Score" value={avgScore || '—'} icon={TrendingUp} color="cream" />
        <StatCard label="Plan" value={user?.plan || 'Free'} icon={Clock} color="sage" />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link to="/resumes/upload" className="card p-6 group hover:border-sage-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sage-50 flex items-center justify-center group-hover:bg-sage-100 transition-colors">
              <FileText size={22} className="text-sage-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-charcoal-800 mb-0.5">Upload Resume</h3>
              <p className="text-xs text-sage-400">Get AI-powered analysis & score</p>
            </div>
            <ArrowRight size={18} className="text-sage-300 group-hover:text-sage-500 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link to="/interview" className="card p-6 group hover:border-warm-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-warm-50 flex items-center justify-center group-hover:bg-warm-100 transition-colors">
              <Mic2 size={22} className="text-warm-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-charcoal-800 mb-0.5">Start Interview</h3>
              <p className="text-xs text-sage-400">Practice with AI questions</p>
            </div>
            <ArrowRight size={18} className="text-sage-300 group-hover:text-warm-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent Resumes */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-charcoal-800">Recent Resumes</h2>
            <Link to="/resumes" className="text-xs text-sage-500 hover:text-sage-600 font-medium">View all →</Link>
          </div>
          {resumesLoading ? (
            <PageLoader />
          ) : resumeList.length === 0 ? (
            <div className="card p-6 text-center">
              <FileText size={28} className="text-sage-300 mx-auto mb-2" />
              <p className="text-sm text-sage-400">No resumes yet</p>
              <Link to="/resumes/upload" className="text-xs text-sage-600 font-medium mt-1 inline-block">Upload one →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {resumeList.slice(0, 3).map((r) => (
                <Link key={r._id} to={`/resumes/${r._id}`} className="card p-4 flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-xl bg-sage-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-sage-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-800 truncate">{r.filename || r.originalName || 'Resume'}</p>
                    <p className="text-xs text-sage-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  {r.score != null && (
                    <Badge variant={r.score >= 70 ? 'success' : r.score >= 40 ? 'warning' : 'danger'}>
                      {r.score}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-charcoal-800">Interview History</h2>
            <Link to="/interview" className="text-xs text-sage-500 hover:text-sage-600 font-medium">View all →</Link>
          </div>
          {sessionsLoading ? (
            <PageLoader />
          ) : sessionList.length === 0 ? (
            <div className="card p-6 text-center">
              <Mic2 size={28} className="text-sage-300 mx-auto mb-2" />
              <p className="text-sm text-sage-400">No sessions yet</p>
              <Link to="/interview" className="text-xs text-sage-600 font-medium mt-1 inline-block">Start practicing →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionList.slice(0, 3).map((s) => (
                <Link key={s._id} to={`/interview/report/${s._id}`} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warm-50 flex items-center justify-center flex-shrink-0">
                    <Mic2 size={16} className="text-warm-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-800 truncate">{s.role || s.jobRole || 'Mock Interview'}</p>
                    <p className="text-xs text-sage-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={s.status === 'completed' ? 'success' : 'warning'}>
                    {s.status || 'done'}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
