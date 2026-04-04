import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Mic2, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../../api/interview';
import { PageLoader, Spinner } from '../../components/ui';

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const bottomRef = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['interview-session', id],
    queryFn: () => interviewAPI.getSession(id).then((r) => r.data),
  });

  const session = data?.data || data?.session || data;
  const questions = session?.questions || [];
  const totalQ = questions.length;
  const progress = totalQ > 0 ? Math.round(((currentQ) / totalQ) * 100) : 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQ, answers]);

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await interviewAPI.submitAnswer(id, {
        questionIndex: currentQ,
        answer: answer.trim(),
        question: questions[currentQ]?.question || questions[currentQ],
      });
      setAnswers((prev) => [...prev, { q: questions[currentQ]?.question || questions[currentQ], a: answer.trim() }]);
      setAnswer('');
      if (currentQ + 1 >= totalQ) {
        await handleEnd();
      } else {
        setCurrentQ((c) => c + 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await interviewAPI.endSession(id);
      toast.success('Interview completed! Generating report...');
      navigate(`/interview/report/${id}`);
    } catch {
      toast.error('Failed to end session');
      setEnding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitAnswer();
  };

  if (isLoading) return <PageLoader />;
  if (!session) return <div className="text-center text-sage-400 py-16">Session not found</div>;
  if (session.status === 'completed') {
    navigate(`/interview/report/${id}`);
    return null;
  }

  const currentQuestion = questions[currentQ];
  const questionText = currentQuestion?.question || currentQuestion;

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="card p-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-warm-50 flex items-center justify-center flex-shrink-0">
          <Mic2 size={18} className="text-warm-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <h1 className="font-medium text-charcoal-800 text-sm">{session.role || session.jobRole || 'Mock Interview'}</h1>
            <span className="text-xs text-sage-400 font-medium">{currentQ}/{totalQ} answered</span>
          </div>
          <div className="w-full bg-cream-200 rounded-full h-1.5">
            <div
              className="bg-sage-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="space-y-4 mb-5 min-h-[400px]">
        {/* Past Q&As */}
        {answers.map((item, i) => (
          <div key={i} className="space-y-3">
            {/* Question */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mic2 size={14} className="text-warm-500" />
              </div>
              <div className="flex-1 card p-4 bg-cream-50 border-cream-200">
                <p className="text-xs text-sage-400 mb-1 font-medium">Question {i + 1}</p>
                <p className="text-sm text-charcoal-800 leading-relaxed">{item.q}</p>
              </div>
            </div>
            {/* Answer */}
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-xl card p-4 bg-sage-500 border-sage-500">
                <p className="text-xs text-sage-200 mb-1 font-medium">Your answer</p>
                <p className="text-sm text-white leading-relaxed">{item.a}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={14} className="text-sage-500" />
              </div>
            </div>
          </div>
        ))}

        {/* Current Question */}
        {currentQ < totalQ && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mic2 size={14} className="text-warm-500" />
            </div>
            <div className="flex-1 card p-4 border-warm-200 bg-warm-50 animate-fade-up">
              <p className="text-xs text-warm-400 mb-1 font-medium">Question {currentQ + 1} of {totalQ}</p>
              <p className="text-sm text-charcoal-800 leading-relaxed font-medium">{questionText}</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Answer Input */}
      {currentQ < totalQ && (
        <div className="card p-4 sticky bottom-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here... (Ctrl+Enter to submit)"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-cream-300 bg-cream-50 text-sm text-charcoal-800 placeholder-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-200 focus:border-sage-400 resize-none transition-all"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-sage-300">Ctrl+Enter to submit</p>
            <div className="flex gap-2">
              {currentQ > 0 && (
                <button onClick={handleEnd} disabled={ending} className="btn-secondary text-xs py-2">
                  {ending ? <Spinner size={14} /> : <>End Session</>}
                </button>
              )}
              <button
                onClick={submitAnswer}
                disabled={!answer.trim() || submitting}
                className="btn-primary text-sm py-2"
              >
                {submitting ? <Spinner size={16} className="text-white" /> : currentQ + 1 >= totalQ ? <><CheckCircle size={16} /> Finish</> : <><Send size={16} /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}