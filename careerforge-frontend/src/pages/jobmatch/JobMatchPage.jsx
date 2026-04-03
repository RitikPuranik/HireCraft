import React, { useEffect, useState } from 'react'
import { jobmatchAPI, resumeAPI } from '../../api/services'
import { Card, Button, Badge, ScoreRing, EmptyState, Select, Textarea, Spinner } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

// ─── Job Match ────────────────────────────────────────────────────────────────
export function JobMatchPage() {
  const [resumes, setResumes] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ resumeId:'', jobDescription:'' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  const loadData = async () => {
    try {
      const [r, h] = await Promise.all([resumeAPI.getAll(), jobmatchAPI.getHistory()])
      setResumes(r.data||[])
      setHistory(h.data||[])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  const handleAnalyze = async () => {
    if (!form.resumeId) { toast.error('Select a resume'); return }
    if (!form.jobDescription.trim()) { toast.error('Paste a job description'); return }
    setAnalyzing(true); setResult(null)
    try {
      const r = await jobmatchAPI.analyze(form)
      setResult(r.data)
      toast.success('Match analysis complete!')
      loadData()
    } catch (err) { toast.error(err.message) }
    setAnalyzing(false)
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  return (
    <div className="animate-fadeUp" style={{ maxWidth:800 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>Job Match Analyzer</h1>
        <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>See how well your resume matches a job posting</p>
      </div>

      <Card style={{ padding:24, marginBottom:24 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Select label="Select Resume" value={form.resumeId} onChange={e => setForm(f=>({...f,resumeId:e.target.value}))}
            options={[{ value:'', label:'— Choose a resume —' }, ...resumes.map(r=>({value:r._id,label:r.title}))]} />
          <Textarea label="Job Description *" rows={8} value={form.jobDescription}
            onChange={e => setForm(f=>({...f,jobDescription:e.target.value}))}
            placeholder="Paste the full job description here..." />
          <Button onClick={handleAnalyze} loading={analyzing} size="lg">🔍 Analyze Match</Button>
        </div>
      </Card>

      {result && (
        <Card style={{ marginBottom:24, border:'2px solid var(--accent-pale)' }} className="animate-fadeUp">
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20 }}>
            <ScoreRing score={result.matchScore} size={80} strokeWidth={6} />
            <div>
              <h3 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:400, marginBottom:4 }}>Match Score: {result.matchScore}%</h3>
              <Badge variant={result.matchScore>=75?'success':result.matchScore>=50?'warning':'danger'}>
                {result.matchScore>=75?'Strong Match':result.matchScore>=50?'Moderate Match':'Weak Match'}
              </Badge>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {result.matchedKeywords?.length > 0 && (
              <div>
                <h4 style={{ fontSize:13, fontWeight:600, color:'var(--green)', marginBottom:8 }}>✓ Matched Keywords</h4>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {result.matchedKeywords.map((k,i) => <span key={i} style={{ padding:'2px 8px', background:'var(--green-pale)', color:'var(--green)', borderRadius:20, fontSize:11, fontWeight:500 }}>{k}</span>)}
                </div>
              </div>
            )}
            {result.missingKeywords?.length > 0 && (
              <div>
                <h4 style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:8 }}>✗ Missing Keywords</h4>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {result.missingKeywords.map((k,i) => <span key={i} style={{ padding:'2px 8px', background:'var(--red-pale)', color:'var(--red)', borderRadius:20, fontSize:11, fontWeight:500 }}>{k}</span>)}
                </div>
              </div>
            )}
          </div>

          {result.suggestions?.length > 0 && (
            <div style={{ marginTop:16, padding:'12px 16px', background:'var(--blue-pale)', borderRadius:'var(--radius-sm)' }}>
              <h4 style={{ fontSize:13, fontWeight:600, color:'var(--blue)', marginBottom:8 }}>💡 Suggestions</h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
                {result.suggestions.map((s,i) => <li key={i} style={{ fontSize:12, color:'var(--ink-light)', paddingLeft:12, position:'relative' }}><span style={{ position:'absolute', left:0, color:'var(--blue)' }}>→</span>{s}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}

      {history.length > 0 && (
        <div>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400, marginBottom:16 }}>Match History</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {history.map(h => (
              <Card key={h._id} style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <ScoreRing score={h.matchScore} size={40} strokeWidth={4} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{h.jobTitle || 'Job Match'}</div>
                    <div style={{ fontSize:11, color:'var(--stone)' }}>{new Date(h.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <Badge variant={h.matchScore>=75?'success':h.matchScore>=50?'warning':'danger'}>{h.matchScore}% match</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
