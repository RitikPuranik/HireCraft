import React, { useEffect, useState, useRef } from 'react'
import { atsAPI, resumeAPI } from '../../api/services'
import { Card, Button, Badge, ScoreRing, EmptyState, Spinner } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

export default function ATSPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [jobDesc, setJobDesc] = useState('')
  const [resumes, setResumes] = useState([])
  const fileRef = useRef()

  const loadData = async () => {
    try {
      const [h, r] = await Promise.all([atsAPI.getHistory(), resumeAPI.getAll()])
      setHistory(h.data || [])
      setResumes(r.data || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.includes('pdf') && !f.name.endsWith('.pdf')) { toast.error('Please upload a PDF file'); return }
    setFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) { toast.error('Please upload your resume PDF'); return }
    setAnalyzing(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('resume', file)
      if (jobDesc) fd.append('jobDescription', jobDesc)
      const r = await atsAPI.analyze(fd)
      setResult(r.data)
      toast.success('Analysis complete!')
      loadData()
    } catch (err) { toast.error(err.message) }
    setAnalyzing(false)
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  return (
    <div className="animate-fadeUp" style={{ maxWidth:800 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>ATS Checker</h1>
        <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>Upload your resume to get an ATS compatibility score powered by AI</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Upload */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--cream-200)' }}>
            <h3 style={{ fontSize:14, fontWeight:600 }}>Upload Resume</h3>
          </div>
          <div style={{ padding:20 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--cream-300)'}`,
                borderRadius:'var(--radius-sm)', padding:'28px 16px', textAlign:'center',
                cursor:'pointer', background: dragOver ? 'var(--accent-pale)' : 'var(--cream-100)',
                transition:'all 0.2s',
              }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📎</div>
              {file ? (
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{file.name}</div>
                  <div style={{ fontSize:11, color:'var(--stone)', marginTop:2 }}>{(file.size/1024).toFixed(0)} KB · Click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', marginBottom:2 }}>Drop PDF here or click</div>
                  <div style={{ fontSize:11, color:'var(--stone)' }}>PDF format only</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".pdf" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
          </div>
        </Card>

        {/* Job description */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--cream-200)' }}>
            <h3 style={{ fontSize:14, fontWeight:600 }}>Job Description <span style={{ color:'var(--stone)', fontWeight:400 }}>(optional)</span></h3>
          </div>
          <div style={{ padding:20 }}>
            <textarea
              value={jobDesc}
              onChange={e => setJobDesc(e.target.value)}
              placeholder="Paste the job description here for a tailored ATS score..."
              style={{
                width:'100%', height:120, padding:'10px 12px', border:'1px solid var(--cream-300)',
                borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--ink)',
                background:'var(--cream-100)', resize:'none', outline:'none', lineHeight:1.5,
              }}
            />
            <p style={{ fontSize:11, color:'var(--stone)', marginTop:6 }}>
              Adding a job description gives you keyword-specific feedback
            </p>
          </div>
        </Card>
      </div>

      <Button onClick={handleAnalyze} loading={analyzing} size="lg" style={{ width:'100%', marginBottom:28 }}>
        {analyzing ? 'Analyzing with AI...' : '🎯 Analyze My Resume'}
      </Button>

      {/* Result */}
      {result && (
        <Card style={{ marginBottom:28, border:'2px solid var(--accent-pale)' }} className="animate-fadeUp">
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20, flexWrap:'wrap' }}>
            <ScoreRing score={result.score} size={80} strokeWidth={6} />
            <div style={{ flex:1 }}>
              <h3 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400, marginBottom:4 }}>
                ATS Score: {result.score}/100
              </h3>
              <Badge variant={result.score>=75?'success':result.score>=50?'warning':'danger'}>
                {result.score>=75 ? '✓ ATS Friendly' : result.score>=50 ? '⚠ Needs Work' : '✗ Poor Match'}
              </Badge>
            </div>
          </div>

          {result.feedback && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {result.feedback.strengths?.length > 0 && (
                <div>
                  <h4 style={{ fontSize:13, fontWeight:600, color:'var(--green)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>✓ Strengths</h4>
                  <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
                    {result.feedback.strengths.map((s,i) => <li key={i} style={{ fontSize:12, color:'var(--stone-dark)', paddingLeft:12, position:'relative' }}><span style={{ position:'absolute', left:0, color:'var(--green)' }}>·</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {result.feedback.improvements?.length > 0 && (
                <div>
                  <h4 style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>↑ Improvements</h4>
                  <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
                    {result.feedback.improvements.map((s,i) => <li key={i} style={{ fontSize:12, color:'var(--stone-dark)', paddingLeft:12, position:'relative' }}><span style={{ position:'absolute', left:0, color:'var(--red)' }}>·</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {result.feedback.keywords?.missing?.length > 0 && (
                <div style={{ gridColumn:'1/-1' }}>
                  <h4 style={{ fontSize:13, fontWeight:600, color:'var(--blue)', marginBottom:8 }}>🔑 Missing Keywords</h4>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {result.feedback.keywords.missing.map((k,i) => <span key={i} style={{ padding:'2px 8px', background:'var(--blue-pale)', color:'var(--blue)', borderRadius:20, fontSize:11, fontWeight:500 }}>{k}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400, marginBottom:16 }}>Analysis History</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {history.map(h => (
              <Card key={h._id} style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <ScoreRing score={h.score} size={40} strokeWidth={4} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{h.fileName || 'Resume PDF'}</div>
                    <div style={{ fontSize:11, color:'var(--stone)' }}>{new Date(h.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <Badge variant={h.score>=75?'success':h.score>=50?'warning':'danger'}>Score: {h.score}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
