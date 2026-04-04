import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Mic, MicOff, Video, VideoOff, CheckCircle,
  SkipForward, PhoneOff, Volume2, VolumeX, Loader2, AlertCircle, Lock, Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { interviewAPI } from '../../api/interview';
import { PageLoader } from '../../components/ui';

/* ─── voice helpers ─────────────────────────────────────────── */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function getBestFemaleVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find(v => /google.*us.*english/i.test(v.name)) ||
    voices.find(v => /samantha|victoria|karen|allison|ava|susan|zira|jenny|aria|natasha|moira|fiona|tessa/i.test(v.name)) ||
    voices.find(v => /microsoft.*(zira|cortana|hazel|jenny|aria)/i.test(v.name)) ||
    voices.find(v => v.lang === 'en-US' && !/male/i.test(v.name)) ||
    voices.find(v => v.lang?.startsWith('en')) ||
    voices[0]
  );
}

function speakText(text, { onStart, onEnd, rate = 0.82, pitch = 1.15 } = {}) {
  window.speechSynthesis.cancel();
  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = 1;
    const voice = getBestFemaleVoice();
    if (voice) utter.voice = voice;
    if (onStart) utter.onstart = onStart;
    utter.onend  = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  }, 80);
}

function isAnswerUnclear(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 8) return true;
  return /^(i don'?t know|no|yes|maybe|okay|um+|uh+|hmm+|nothing|not sure|idk)[\s.,!?]*$/i.test(text.trim());
}

/* ── Permission Gate ── */
function PermissionGate({ onGranted }) {
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const request = async () => {
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setStatus('granted');
      setTimeout(onGranted, 600);
    } catch (err) {
      setErrMsg(err.name === 'NotAllowedError'
        ? 'Camera & Microphone access was denied. Please allow both in browser settings.'
        : `Device error: ${err.message}`);
      setStatus('denied');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0b0f] z-50 flex flex-col items-center justify-center px-6"
      style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Video size={28} className="text-pink-400" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Mic size={28} className="text-pink-400" />
          </div>
        </div>
        <h1 className="text-white text-2xl font-bold mb-3">Camera & Mic Required</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          HireCraft needs <strong className="text-white/80">permanent access</strong> to your camera and microphone to conduct this interview.
          Click <strong className="text-white/80">Allow</strong> when your browser prompts you.
        </p>
        {status === 'denied' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
            <div className="flex gap-3">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm font-semibold mb-1">Access Denied</p>
                <p className="text-red-300/70 text-xs">{errMsg}</p>
                <p className="text-red-300/70 text-xs mt-2">
                  Go to browser Settings → Site Permissions → Camera & Microphone → Allow for this site, then retry.
                </p>
              </div>
            </div>
          </div>
        )}
        {status === 'granted' && (
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4 mb-6">
            <p className="text-pink-300 text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle size={16} /> Access granted — starting interview…
            </p>
          </div>
        )}
        <button onClick={request} disabled={status === 'requesting' || status === 'granted'}
          className="w-full py-4 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2">
          {status === 'requesting' ? <><Loader2 size={18} className="animate-spin" /> Requesting…</>
           : status === 'granted'  ? <><CheckCircle size={18} /> Starting…</>
           : <><Lock size={18} /> Grant Camera & Mic Access</>}
        </button>
        <p className="text-white/20 text-xs mt-4">You cannot proceed without granting both permissions.</p>
      </div>
    </div>
  );
}

/* ── Tab Guard Overlay ── */
function TabGuardOverlay({ count, onResume }) {
  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center backdrop-blur-lg"
      style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-white text-xl font-bold mb-3">Interview Paused</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-3">
          You switched tabs or left this window. Tab switching is <strong className="text-red-400">not allowed</strong> during the interview.
        </p>
        <p className="text-red-400/70 text-xs mb-8">Violation #{count} has been recorded.</p>
        <button onClick={onResume}
          className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition-all">
          Resume Interview
        </button>
      </div>
    </div>
  );
}

/* ── Fullscreen Nudge ── */
function FullscreenNudge({ onEnter }) {
  return (
    <div className="fixed inset-0 bg-[#0a0b0f] z-[90] flex flex-col items-center justify-center"
      style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <Maximize2 size={28} className="text-pink-400" />
        </div>
        <h2 className="text-white text-xl font-bold mb-3">Enter Fullscreen</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          This interview must be conducted in fullscreen mode. Exiting fullscreen pauses the interview.
        </p>
        <button onClick={onEnter}
          className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition-all">
          <Maximize2 size={16} className="inline mr-2" /> Enter Fullscreen
        </button>
      </div>
    </div>
  );
}

/* ── Main Session ── */
export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [permGranted, setPermGranted]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabViolation, setTabViolation] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showFSNudge, setShowFSNudge]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['interview-session', id],
    queryFn: () => interviewAPI.getSession(id).then(r => r.data?.data || r.data),
    enabled: permGranted,
  });

  const session   = data?.data || data?.session || data;
  const questions = session?.questions || [];
  const totalQ    = questions.length;

  const [currentQ,    setCurrentQ]    = useState(0);
  const [answers,     setAnswers]     = useState([]);
  const [transcript,  setTranscript]  = useState('');
  const [interim,     setInterim]     = useState('');
  const [phase,       setPhase]       = useState('loading');
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [camOn,       setCamOn]       = useState(true);
  const [micOn,       setMicOn]       = useState(true);
  const [voiceOn,     setVoiceOn]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [ending,      setEnding]      = useState(false);
  const [permError,   setPermError]   = useState('');
  const [elapsed,     setElapsed]     = useState(0);
  const [aiMessage,   setAiMessage]   = useState('');
  const [repeatCount, setRepeatCount] = useState(0);

  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const recRef        = useRef(null);
  const silenceTimer  = useRef(null);
  const timerRef      = useRef(null);
  const micOnRef      = useRef(true);
  const voiceOnRef    = useRef(true);
  const phaseRef      = useRef('loading');
  const transcriptRef = useRef('');
  const interimRef    = useRef('');
  const repeatRef     = useRef(0);
  const currentQRef   = useRef(0);

  useEffect(() => { micOnRef.current = micOn; },          [micOn]);
  useEffect(() => { voiceOnRef.current = voiceOn; },      [voiceOn]);
  useEffect(() => { phaseRef.current = phase; },          [phase]);
  useEffect(() => { transcriptRef.current = transcript; },[transcript]);
  useEffect(() => { interimRef.current = interim; },      [interim]);
  useEffect(() => { repeatRef.current = repeatCount; },   [repeatCount]);
  useEffect(() => { currentQRef.current = currentQ; },    [currentQ]);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  /* Tab guard */
  useEffect(() => {
    if (!permGranted) return;
    const onVisChange = () => {
      if (document.hidden && phaseRef.current !== 'done' && phaseRef.current !== 'loading') {
        window.speechSynthesis.cancel();
        setTabViolation(true);
        setViolationCount(c => c + 1);
      }
    };
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['t','n','w'].includes(e.key)) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') e.preventDefault();
      if (e.altKey && e.key === 'Tab') e.preventDefault();
    };
    const onContextMenu = (e) => e.preventDefault();
    document.addEventListener('visibilitychange', onVisChange);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [permGranted]);

  /* Fullscreen management */
  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      setIsFullscreen(true);
      setShowFSNudge(false);
    } catch {
      setIsFullscreen(true);
      setShowFSNudge(false);
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => {
      const inFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(inFS);
      if (!inFS && phaseRef.current !== 'done' && phaseRef.current !== 'loading' && permGranted) {
        window.speechSynthesis.cancel();
        setShowFSNudge(true);
      }
    };
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('webkitfullscreenchange', onFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange);
      document.removeEventListener('webkitfullscreenchange', onFSChange);
    };
  }, [permGranted]);

  const handlePermGranted = useCallback(async () => {
    setPermGranted(true);
    await enterFullscreen();
  }, [enterFullscreen]);

  /* Camera */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setPermError('Camera unavailable — continuing without video.');
      setCamOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  /* Timer */
  useEffect(() => {
    if (phase === 'listening') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  /* Silence detection */
  const resetSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimer.current);
    if (phaseRef.current !== 'listening') return;
    silenceTimer.current = setTimeout(() => {
      if (phaseRef.current !== 'listening') return;
      const hasAnswer = (transcriptRef.current + interimRef.current).trim().length > 0;
      if (!hasAnswer) handleAIReact('silence'); // eslint-disable-line
    }, 8000);
  }, []); // eslint-disable-line

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimer.current);
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
    setInterim('');
  }, []);

  const startListening = useCallback(() => {
    if (!SR || !micOnRef.current) return;
    stopListening();
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      let fin = '', tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' ';
        else tmp += e.results[i][0].transcript;
      }
      if (fin) setTranscript(prev => prev + fin);
      setInterim(tmp);
      resetSilenceTimer();
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech') { resetSilenceTimer(); return; }
      if (e.error === 'not-allowed') { setPermError('Mic denied. Reload and allow access.'); setMicOn(false); }
    };
    rec.onend = () => {
      if (phaseRef.current === 'listening' && micOnRef.current)
        setTimeout(() => { if (phaseRef.current === 'listening') startListening(); }, 200);
    };
    recRef.current = rec;
    try { rec.start(); } catch {}
  }, [stopListening, resetSilenceTimer]);

  /* AI React — KEY FIX: use currentQRef.current, not currentQ from closure */
  const handleAIReact = useCallback(async (caseType) => {
    if (phaseRef.current === 'ai-thinking' || phaseRef.current === 'ai-reacting') return;
    stopListening();
    window.speechSynthesis.cancel();
    setPhase('ai-thinking');

    const qIdx = currentQRef.current;  // ← FIX: always fresh
    const currentQuestion = questions[qIdx]?.question || questions[qIdx] || '';

    try {
      const res = await interviewAPI.aiResponse({
        question:    currentQuestion,
        answer:      (transcriptRef.current + interimRef.current).trim(),
        case:        caseType,
        repeatCount: repeatRef.current,
        role:        session?.role,
        roundType:   session?.roundType,
      });
      const aiText = res.data?.data?.text || res.data?.text || "Let's keep going.";
      setAiMessage(aiText);
      setPhase('ai-reacting');
      setIsSpeaking(true);
      if (voiceOnRef.current) {
        speakText(aiText, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => { setIsSpeaking(false); afterAIReact(caseType); },
        });
      } else {
        setTimeout(() => { setIsSpeaking(false); afterAIReact(caseType); }, 1800);
      }
    } catch {
      setPhase('listening');
      startListening();
      resetSilenceTimer();
    }
  }, [questions, session, stopListening, startListening, resetSilenceTimer]); // eslint-disable-line

  const afterAIReact = useCallback((caseType) => {
    if (caseType === 'silence' || caseType === 'unclear') {
      if (caseType === 'unclear') setRepeatCount(r => r + 1);
      setPhase('listening');
      startListening();
      resetSilenceTimer();
    }
  }, [startListening, resetSilenceTimer]);

  const askQuestion = useCallback((qText) => {
    setAiMessage(qText);
    setTranscript('');
    setInterim('');
    setRepeatCount(0);
    if (!voiceOnRef.current) {
      setPhase('listening');
      startListening();
      resetSilenceTimer();
      return;
    }
    setPhase('asking');
    setIsSpeaking(true);
    speakText(qText, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => { setIsSpeaking(false); setPhase('listening'); startListening(); resetSilenceTimer(); },
      rate: 0.82, pitch: 1.15,
    });
  }, [startListening, resetSilenceTimer]);

  useEffect(() => {
    if (!session || totalQ === 0 || phase !== 'loading') return;
    startCamera();
    setTimeout(() => askQuestion(questions[0]?.question || questions[0]), 900);
  }, [session]); // eslint-disable-line

  const submitAnswer = async () => {
    const finalAnswer = (transcript + ' ' + interim).trim();
    if (!finalAnswer) { toast.error('Please say something first!'); return; }
    if (isAnswerUnclear(finalAnswer) && repeatCount < 2) { handleAIReact('unclear'); return; }

    clearTimeout(silenceTimer.current);
    stopListening();
    window.speechSynthesis.cancel();
    setPhase('ai-thinking');
    setSubmitting(true);

    const qIdx  = currentQRef.current;  // ← FIX: snapshot before async
    const qText = questions[qIdx]?.question || questions[qIdx] || '';

    try {
      const res = await interviewAPI.aiResponse({
        question:  qText,
        answer:    finalAnswer,
        case:      'good',
        repeatCount,
        role:      session?.role,
        roundType: session?.roundType,
      });
      const aiText = res.data?.data?.text || res.data?.text || "Great, let's move on.";
      setAiMessage(aiText);
      setPhase('ai-reacting');
      setIsSpeaking(true);

      await interviewAPI.submitAnswer(id, { questionIndex: qIdx, answer: finalAnswer, question: qText });
      setAnswers(prev => [...prev, { q: qText, a: finalAnswer }]);

      const next = qIdx + 1;
      const goNext = () => {
        setIsSpeaking(false);
        if (next >= totalQ) { doEnd(); }
        else {
          setCurrentQ(next);
          currentQRef.current = next;
          const nextQ = questions[next]?.question || questions[next];
          setTimeout(() => askQuestion(nextQ), 400);
        }
      };

      if (voiceOnRef.current) {
        speakText(aiText, { onStart: () => setIsSpeaking(true), onEnd: goNext });
      } else {
        setTimeout(goNext, 800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
      setPhase('listening');
      startListening();
      resetSilenceTimer();
    } finally {
      setSubmitting(false);
    }
  };

  const skipQuestion = async () => {
    clearTimeout(silenceTimer.current);
    stopListening();
    window.speechSynthesis.cancel();
    const qIdx  = currentQRef.current;
    const qText = questions[qIdx]?.question || questions[qIdx];
    try { await interviewAPI.submitAnswer(id, { questionIndex: qIdx, answer: '[Skipped]', question: qText }); } catch {}
    setAnswers(prev => [...prev, { q: qText, a: '[Skipped]' }]);
    const next = qIdx + 1;
    if (next >= totalQ) { doEnd(); return; }
    setCurrentQ(next);
    currentQRef.current = next;
    setTimeout(() => askQuestion(questions[next]?.question || questions[next]), 400);
  };

  const doEnd = async () => {
    clearTimeout(silenceTimer.current);
    stopListening();
    window.speechSynthesis.cancel();
    stopCamera();
    setEnding(true);
    setPhase('done');
    try { if (document.exitFullscreen) document.exitFullscreen(); } catch {}
    try {
      await interviewAPI.endSession(id);
      toast.success('Interview complete! Generating report…');
      navigate(`/interview/report/${id}`);
    } catch {
      toast.error('Failed to end session');
      setEnding(false);
      setPhase('listening');
    }
  };

  const toggleMic = () => {
    if (micOn) { stopListening(); setMicOn(false); }
    else { setMicOn(true); if (phase === 'listening') setTimeout(startListening, 100); }
  };
  const toggleCam = () => {
    if (camOn) { stopCamera(); setCamOn(false); }
    else { startCamera(); setCamOn(true); }
  };
  const toggleVoice = () => {
    if (voiceOn) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceOn(false);
      if (phase === 'asking') { setPhase('listening'); startListening(); resetSilenceTimer(); }
    } else { setVoiceOn(true); }
  };

  useEffect(() => {
    return () => {
      clearTimeout(silenceTimer.current);
      clearInterval(timerRef.current);
      stopCamera();
      stopListening();
      window.speechSynthesis.cancel();
    };
  }, []); // eslint-disable-line

  if (!permGranted) return <PermissionGate onGranted={handlePermGranted} />;
  if (isLoading || phase === 'loading') return <PageLoader />;
  if (!session) return <div className="text-center text-sage-400 py-16">Session not found</div>;
  if (session.status === 'completed') { navigate(`/interview/report/${id}`); return null; }
  if (showFSNudge) return <FullscreenNudge onEnter={enterFullscreen} />;

  const progress   = totalQ > 0 ? Math.round((currentQ / totalQ) * 100) : 0;
  const qText      = questions[currentQ]?.question || questions[currentQ] || '';
  const fullAnswer = transcript + interim;
  const isThinking = phase === 'ai-thinking' || phase === 'ai-reacting';
  const phaseLabel = phase === 'asking'      ? 'Sofia is asking…'
                   : phase === 'listening'   ? `Q${currentQ + 1} of ${totalQ} — Your turn`
                   : phase === 'ai-thinking' ? 'Sofia is thinking…'
                   : phase === 'ai-reacting' ? 'Sofia is responding…'
                   : 'Wrapping up…';

  return (
    <div className="fixed inset-0 bg-[#0d0f14] z-50 flex flex-col" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {tabViolation && <TabGuardOverlay count={violationCount} onResume={() => {
        setTabViolation(false);
        if (phaseRef.current === 'listening') { startListening(); resetSilenceTimer(); }
      }} />}

      {violationCount > 0 && !tabViolation && (
        <div className="fixed top-4 right-20 z-[80] bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} className="text-red-400" />
          <span className="text-red-300 text-xs font-semibold">{violationCount} violation{violationCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/50 border-b border-white/10 flex-shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-lg shadow-lg ${isSpeaking ? 'ring-2 ring-pink-400/70 ring-offset-1 ring-offset-black' : ''}`}>
            👩‍💼
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Sofia · AI Interviewer</p>
            <p className="text-white/40 text-xs">{session.role} · <span className="capitalize">{session.roundType}</span> round</p>
          </div>
        </div>

        <div className="flex-1 max-w-sm mx-8">
          <div className="flex justify-between text-xs text-white/35 mb-1">
            <span>Question {Math.min(currentQ + 1, totalQ)} / {totalQ}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <button onClick={enterFullscreen} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/70 text-xs font-semibold px-3 py-2 rounded-xl transition-all">
              <Maximize2 size={13} /> Fullscreen
            </button>
          )}
          <button onClick={doEnd} disabled={ending}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95">
            <PhoneOff size={13} /> End Interview
          </button>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 min-h-0 gap-4 p-4 overflow-hidden">
        {/* LEFT */}
        <div className="flex flex-col flex-1 gap-3 min-w-0">
          {/* AI card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex gap-4 items-start flex-shrink-0">
            <div className={`relative w-14 h-14 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-700 flex items-center justify-center text-2xl shadow-xl ${isSpeaking ? 'ring-4 ring-pink-400/40 ring-offset-2 ring-offset-[#0d0f14] animate-pulse' : ''}`}>
              👩‍💼
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-pink-500 border-2 border-[#0d0f14] flex items-center justify-center">
                  <Volume2 size={9} className="text-white" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-pink-400 text-xs font-bold uppercase tracking-widest">{phaseLabel}</span>
                {(phase === 'asking' || phase === 'ai-reacting') && (
                  <span className="flex items-end gap-0.5 h-3.5">
                    {[0,1,2,3].map(i => (
                      <span key={i} className="w-[3px] bg-pink-400 rounded-full animate-bounce"
                        style={{ height: `${5 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </span>
                )}
                {phase === 'ai-thinking' && <Loader2 size={13} className="text-pink-400 animate-spin" />}
              </div>
              <p className="text-white text-[15px] font-medium leading-relaxed">
                {phase === 'ai-reacting' ? aiMessage : qText}
              </p>
              {phase === 'ai-reacting' && (
                <p className="text-white/30 text-xs mt-2 italic line-clamp-1">Re: {qText}</p>
              )}
            </div>
          </div>

          {/* transcript */}
          <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <span className="text-white/35 text-xs font-bold uppercase tracking-widest">Your Answer</span>
              {phase === 'listening' && (
                <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-red-300 text-xs font-semibold">REC {fmt(elapsed)}</span>
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {fullAnswer ? (
                <p className="text-white/90 text-sm leading-relaxed">
                  {transcript}<span className="text-white/35 italic">{interim}</span>
                </p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  {phase === 'asking' && <p className="text-white/20 text-sm">Listen to the question, then speak…</p>}
                  {phase === 'listening' && (
                    <>
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-pink-500/20 animate-ping" />
                        <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/40 flex items-center justify-center">
                          <Mic size={17} className="text-pink-400" />
                        </div>
                      </div>
                      <p className="text-white/25 text-sm">Speak your answer…</p>
                    </>
                  )}
                  {isThinking && <Loader2 size={22} className="text-pink-400/60 animate-spin" />}
                </div>
              )}
            </div>
            {repeatCount > 0 && phase === 'listening' && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 mt-3 flex-shrink-0">
                <AlertCircle size={13} className="text-yellow-400 flex-shrink-0" />
                <p className="text-yellow-300 text-xs">
                  {repeatCount === 1 ? 'Sofia asked for more detail — please elaborate.' : 'Last chance — give a fuller answer before submitting.'}
                </p>
              </div>
            )}
            {(phase === 'listening' || phase === 'asking') && (
              <div className="flex gap-2.5 mt-3 flex-shrink-0 pt-3 border-t border-white/[0.07]">
                <button onClick={skipQuestion} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 text-sm transition-all">
                  <SkipForward size={13} /> Skip
                </button>
                <button onClick={submitAnswer} disabled={!fullAnswer.trim() || submitting || isThinking}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-25 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98]">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {currentQ + 1 >= totalQ ? 'Finish Interview' : 'Submit Answer'}
                </button>
              </div>
            )}
          </div>

          {answers.length > 0 && (
            <div className="flex-shrink-0 max-h-28 overflow-y-auto space-y-1.5 pr-0.5">
              {answers.map((item, i) => (
                <div key={i} className="flex gap-2.5 items-start bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.06]">
                  <CheckCircle size={12} className="text-pink-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white/30 text-xs truncate">Q{i+1}: {item.q}</p>
                    <p className="text-white/55 text-xs mt-0.5 line-clamp-1">
                      {item.a === '[Skipped]' ? <em className="text-white/25">Skipped</em> : item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex-shrink-0 w-56 flex flex-col gap-3">
          <div className="relative bg-black rounded-2xl border border-white/10 overflow-hidden" style={{ aspectRatio: '3/4' }}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            {!camOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d0f14]">
                <VideoOff size={24} className="text-white/20" />
                <p className="text-white/20 text-xs">Camera off</p>
              </div>
            )}
            {phase === 'listening' && micOn && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/70 rounded-full px-2.5 py-1 backdrop-blur-sm border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-white text-xs font-semibold">LIVE</span>
              </div>
            )}
            {!micOn && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-red-500/80 rounded-full px-2.5 py-1 backdrop-blur-sm">
                <MicOff size={10} className="text-white" />
                <span className="text-white text-xs font-semibold">Muted</span>
              </div>
            )}
            {isFullscreen && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                <Lock size={9} className="text-white/40" />
                <span className="text-white/40 text-[10px]">Secure</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: micOn   ? 'Mic'   : 'Muted',  Icon: micOn   ? Mic     : MicOff,   on: micOn,   fn: toggleMic },
              { label: camOn   ? 'Cam'   : 'Off',    Icon: camOn   ? Video   : VideoOff,  on: camOn,   fn: toggleCam },
              { label: voiceOn ? 'Voice' : 'Silent', Icon: voiceOn ? Volume2 : VolumeX,   on: voiceOn, fn: toggleVoice },
            ].map(({ label, Icon, on, fn }) => (
              <button key={label} onClick={fn}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95 ${on ? 'bg-white/8 hover:bg-white/12 text-white/80' : 'bg-red-500/60 hover:bg-red-500/80 text-white'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {permError && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-2.5 flex gap-2">
              <AlertCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">{permError}</p>
            </div>
          )}
          {!SR && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 flex gap-2">
              <AlertCircle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">Use Chrome for best voice input.</p>
            </div>
          )}

          <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-3 overflow-y-auto min-h-0">
            <p className="text-white/25 text-xs font-bold uppercase tracking-widest mb-2">Questions</p>
            <div className="space-y-1.5">
              {questions.map((q, i) => (
                <div key={i} className={`flex gap-2 items-start p-2 rounded-lg transition-all ${i === currentQ ? 'bg-pink-500/20 border border-pink-500/40' : i < currentQ ? 'opacity-40' : 'opacity-20'}`}>
                  <span className={`w-4 h-4 flex-shrink-0 mt-0.5 rounded-full flex items-center justify-center text-[9px] font-bold ${i < currentQ ? 'bg-pink-500 text-white' : i === currentQ ? 'border border-pink-400 text-pink-400' : 'border border-white/20 text-white/30'}`}>
                    {i < currentQ ? '✓' : i + 1}
                  </span>
                  <p className="text-white text-xs leading-snug line-clamp-2">{q?.question || q}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}