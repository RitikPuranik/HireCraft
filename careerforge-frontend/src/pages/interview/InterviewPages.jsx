import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { interviewAPI, resumeAPI } from '../../api/services'
import { Card, Button, Badge, ScoreRing, Select, Input, EmptyState, Spinner } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

// ─── Setup Page ───────────────────────────────────────────────────────────────
export function InterviewSetupPage() {
  const [form, setForm] = useState({ role:'', roundType:'technical', resumeId:'' })
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { resumeAPI.getAll().then(r => setResumes(r.data||[])).catch(()=>{}) }, [])

  const handleSetup = async () => {
    if (!form.role.trim()) { toast.error('Please enter the role'); return }
    setLoading(true)
    try {
      const r = await interviewAPI.setup({ role: form.role, roundType: form.roundType, resumeId: form.resumeId || undefined })
      toast.success('Interview session created!')
      navigate(`/interview/${r.data._id}`)
    } catch (err) { toast.error(err.message) }
    setLoading(false)
  }

  return (
    <div className="animate-fadeUp" style={{ maxWidth:520 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>Mock Interview</h1>
        <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>Practice with AI-generated questions tailored to your role</p>
      </div>

      <Card style={{ padding:28 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🎤</div>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400, marginBottom:4 }}>Set up your session</h2>
          <p style={{ color:'var(--stone)', fontSize:13 }}>Configure the interview to match your target role</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Input label="Target Role *" placeholder="e.g. Senior Frontend Engineer" value={form.role}
            onChange={e => setForm(f=>({...f, role:e.target.value}))} />

          <Select label="Round Type" value={form.roundType} onChange={e => setForm(f=>({...f, roundType:e.target.value}))}
            options={[
              { value:'technical', label:'🖥 Technical Round' },
              { value:'hr',        label:'👤 HR Round' },
              { value:'mixed',     label:'🔀 Mixed Round' },
            ]} />

          {resumes.length > 0 && (
            <Select label="Resume (optional)" value={form.resumeId} onChange={e => setForm(f=>({...f, resumeId:e.target.value}))}
              options={[{ value:'', label:'— No resume —' }, ...resumes.map(r => ({ value:r._id, label:r.title }))]} />
          )}

          <div style={{ background:'var(--cream-100)', borderRadius:'var(--radius-sm)', padding:'12px 16px', marginTop:4 }}>
            <p style={{ fontSize:12, color:'var(--stone-dark)', marginBottom:4, fontWeight:500 }}>What to expect:</p>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:2 }}>
              {['5–8 role-specific questions', 'AI evaluates each answer', 'Final score with feedback'].map(t => (
                <li key={t} style={{ fontSize:12, color:'var(--stone)', paddingLeft:16, position:'relative' }}>
                  <span style={{ position:'absolute', left:0 }}>·</span>{t}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleSetup} loading={loading} size="lg" style={{ marginTop:4 }}>
            Start Interview Session
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─── Active Interview ─────────────────────────────────────────────────────────
export function InterviewActivePage() {
  const { id } = useParams()
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    try { const r = await interviewAPI.getOne(id); setInterview(r.data) } catch { toast.error('Session not found'); navigate('/interview/history') }
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const handleStart = async () => {
    setSubmitting(true)
    try { await interviewAPI.start(id); load() } catch (err) { toast.error(err.message) }
    setSubmitting(false)
  }

  const currentQ = interview?.questions?.find(q => !q.answer && q.answer !== '')

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) { toast.error('Please write your answer'); return }
    setSubmitting(true)
    try {
      await interviewAPI.submitAnswer(id, { questionIndex: interview.questions.indexOf(currentQ), answer })
      setAnswer('')
      load()
    } catch (err) { toast.error(err.message) }
    setSubmitting(false)
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await interviewAPI.complete(id)
      toast.success('Interview completed! 🎉')
      load()
    } catch (err) { toast.error(err.message) }
    setCompleting(false)
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>
  if (!interview) return null

  const answeredCount = interview.questions.filter(q => q.answer).length
  const totalQ = interview.questions.length
  const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0

  return (
    <div className="animate-fadeUp" style={{ maxWidth:700 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:24, fontWeight:400 }}>{interview.role}</h1>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <Badge variant="info">{interview.roundType}</Badge>
            <Badge variant={interview.status==='completed'?'success':interview.status==='active'?'warning':'default'}>{interview.status}</Badge>
          </div>
        </div>
        {interview.status === 'setup' && <Button onClick={handleStart} loading={submitting} size="lg">▶ Begin Interview</Button>}
      </div>

      {/* Progress */}
      {interview.status !== 'setup' && (
        <Card style={{ padding:'16px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--stone)', marginBottom:8 }}>
            <span>Questions answered</span>
            <span style={{ fontWeight:600, color:'var(--ink)' }}>{answeredCount} / {totalQ}</span>
          </div>
          <div style={{ height:6, background:'var(--cream-200)', borderRadius:4 }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'var(--accent)', borderRadius:4, transition:'width 0.4s ease' }} />
          </div>
        </Card>
      )}

      {/* Completed state */}
      {interview.status === 'completed' && (
        <Card style={{ marginBottom:20, border:'2px solid var(--cream-200)', textAlign:'center', padding:32 }} className="animate-fadeUp">
          <ScoreRing score={interview.totalScore} size={100} strokeWidth={8} />
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:400, marginTop:16, marginBottom:6 }}>Interview Completed!</h2>
          <p style={{ color:'var(--stone)', fontSize:14, marginBottom:20 }}>
            You scored <strong style={{ color:'var(--ink)' }}>{interview.totalScore}/100</strong> on your {interview.role} interview
          </p>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <Button variant="secondary" onClick={() => navigate('/interview/history')}>View History</Button>
            <Button onClick={() => navigate('/interview/setup')}>New Interview</Button>
          </div>
        </Card>
      )}

      {/* Q&A */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {interview.questions.map((q, i) => (
          <Card key={i} style={{ padding:'20px 24px', borderLeft: q.answer ? '3px solid var(--green)' : currentQ === q && interview.status === 'active' ? '3px solid var(--accent)' : '3px solid var(--cream-300)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom: q.answer ? 12 : 0 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'var(--stone)', fontWeight:500, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.04em' }}>Question {i+1}</div>
                <p style={{ fontSize:14, fontWeight:500, color:'var(--ink)', lineHeight:1.5 }}>{q.question}</p>
              </div>
              {q.answer && <Badge variant="success">Answered ✓</Badge>}
            </div>

            {q.answer && (
              <div style={{ background:'var(--cream-100)', borderRadius:'var(--radius-sm)', padding:'12px 14px', marginTop:4 }}>
                <div style={{ fontSize:11, color:'var(--stone)', fontWeight:500, marginBottom:4 }}>YOUR ANSWER</div>
                <p style={{ fontSize:13, color:'var(--ink-light)', lineHeight:1.6 }}>{q.answer}</p>
              </div>
            )}

            {currentQ === q && interview.status === 'active' && (
              <div style={{ marginTop:16 }}>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer here... Be thorough and specific."
                  rows={5}
                  style={{
                    width:'100%', padding:'12px 14px', border:'1px solid var(--cream-300)', borderRadius:'var(--radius-sm)',
                    fontSize:13, color:'var(--ink)', background:'#fff', resize:'vertical', outline:'none', lineHeight:1.6,
                  }}
                  onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px rgba(193,123,63,0.1)' }}
                  onBlur={e => { e.target.style.borderColor='var(--cream-300)'; e.target.style.boxShadow='none' }}
                />
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                  <Button onClick={handleSubmitAnswer} loading={submitting}>Submit Answer →</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Complete button */}
      {interview.status === 'active' && answeredCount === totalQ && totalQ > 0 && (
        <div style={{ marginTop:20, textAlign:'center' }}>
          <Button onClick={handleComplete} loading={completing} size="lg">
            🏁 Complete Interview & Get Score
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── History Page ─────────────────────────────────────────────────────────────
export function InterviewHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    interviewAPI.getHistory().then(r => setHistory(r.data||[])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  return (
    <div className="animate-fadeUp" style={{ maxWidth:700 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>Interview History</h1>
          <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>{history.length} session{history.length!==1?'s':''} completed</p>
        </div>
        <Button onClick={() => navigate('/interview/setup')}>+ New Session</Button>
      </div>

      {history.length === 0 ? (
        <Card>
          <EmptyState icon="🎤" title="No interviews yet" description="Start a mock interview to practice your answers."
            action={<Button onClick={() => navigate('/interview/setup')}>Start Interview</Button>} />
        </Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }} className="stagger">
          {history.map(iv => (
            <Card key={iv._id} hover onClick={() => navigate(`/interview/${iv._id}`)} className="animate-fadeUp" style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <ScoreRing score={iv.totalScore} size={48} strokeWidth={5} />
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{iv.role}</div>
                  <div style={{ fontSize:12, color:'var(--stone)', marginTop:2 }}>
                    {iv.roundType} · {iv.questions?.length || 0} questions · {new Date(iv.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Badge variant={iv.status==='completed'?'success':iv.status==='active'?'warning':'default'}>{iv.status}</Badge>
                {iv.status !== 'completed' && <Badge variant="info">Resume →</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
