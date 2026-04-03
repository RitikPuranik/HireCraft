import React, { useEffect, useState } from 'react'
import { coverletterAPI, resumeAPI } from '../../api/services'
import { Card, Button, Badge, Select, Input, Textarea, EmptyState, Modal, Spinner } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

export default function CoverLetterPage() {
  const [resumes, setResumes] = useState([])
  const [letters, setLetters] = useState([])
  const [form, setForm] = useState({ resumeId:'', companyName:'', jobTitle:'', jobDescription:'', tone:'professional' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const [r, l] = await Promise.all([resumeAPI.getAll(), coverletterAPI.getAll()])
      setResumes(r.data||[])
      setLetters(l.data||[])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  const handleGenerate = async () => {
    if (!form.resumeId) { toast.error('Select a resume'); return }
    if (!form.jobTitle.trim()) { toast.error('Enter the job title'); return }
    setGenerating(true); setResult(null)
    try {
      const r = await coverletterAPI.generate(form)
      setResult(r.data)
      toast.success('Cover letter generated!')
      loadData()
    } catch (err) { toast.error(err.message) }
    setGenerating(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this cover letter?')) return
    try { await coverletterAPI.delete(id); toast.success('Deleted'); loadData() } catch (err) { toast.error(err.message) }
  }

  const handleView = async (id) => {
    try { const r = await coverletterAPI.getOne(id); setSelected(r.data); setModalOpen(true) } catch {}
  }

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard!') }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  return (
    <div className="animate-fadeUp" style={{ maxWidth:800 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>Cover Letter Generator</h1>
        <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>AI-crafted cover letters tailored to your role</p>
      </div>

      <Card style={{ padding:24, marginBottom:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Select label="Resume" value={form.resumeId} onChange={e => setForm(f=>({...f,resumeId:e.target.value}))}
            options={[{ value:'', label:'— Choose a resume —' }, ...resumes.map(r=>({value:r._id,label:r.title}))]}
            style={{ gridColumn:'1/-1' }} />
          <Input label="Company Name" value={form.companyName} onChange={e => setForm(f=>({...f,companyName:e.target.value}))} placeholder="e.g. Google" />
          <Input label="Job Title *" value={form.jobTitle} onChange={e => setForm(f=>({...f,jobTitle:e.target.value}))} placeholder="e.g. Software Engineer" />
          <Select label="Tone" value={form.tone} onChange={e => setForm(f=>({...f,tone:e.target.value}))}
            options={[
              { value:'professional', label:'Professional' },
              { value:'enthusiastic', label:'Enthusiastic' },
              { value:'concise', label:'Concise' },
            ]} />
          <div />
          <Textarea label="Job Description (optional)" rows={5} value={form.jobDescription}
            onChange={e => setForm(f=>({...f,jobDescription:e.target.value}))}
            placeholder="Paste job description for a more targeted letter..."
            style={{ gridColumn:'1/-1' }} />
        </div>
        <Button onClick={handleGenerate} loading={generating} size="lg" style={{ width:'100%', marginTop:16 }}>
          ✉️ Generate Cover Letter
        </Button>
      </Card>

      {result && (
        <Card style={{ marginBottom:24, border:'2px solid var(--accent-pale)' }} className="animate-fadeUp">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:400 }}>Generated Cover Letter</h3>
            <Button size="sm" variant="secondary" onClick={() => copyToClipboard(result.content)}>Copy</Button>
          </div>
          <div style={{ background:'var(--cream-100)', borderRadius:'var(--radius-sm)', padding:'20px 24px', whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.8, color:'var(--ink-light)', fontFamily:'Georgia, serif', maxHeight:400, overflowY:'auto' }}>
            {result.content}
          </div>
        </Card>
      )}

      {letters.length > 0 && (
        <div>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400, marginBottom:16 }}>Saved Letters</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {letters.map(l => (
              <Card key={l._id} style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                  <span style={{ fontSize:20 }}>✉️</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {l.jobTitle} {l.companyName ? `@ ${l.companyName}` : ''}
                    </div>
                    <div style={{ fontSize:11, color:'var(--stone)' }}>{new Date(l.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <Button size="sm" variant="secondary" onClick={() => handleView(l._id)}>View</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(l._id)}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? `${selected.jobTitle}${selected.companyName?' @ '+selected.companyName:''}` : 'Cover Letter'} maxWidth={640}>
        {selected && (
          <div>
            <div style={{ background:'var(--cream-100)', borderRadius:'var(--radius-sm)', padding:'20px 24px', whiteSpace:'pre-wrap', fontSize:13, lineHeight:1.8, color:'var(--ink-light)', fontFamily:'Georgia, serif', maxHeight:500, overflowY:'auto', marginBottom:16 }}>
              {selected.content}
            </div>
            <Button variant="secondary" onClick={() => copyToClipboard(selected.content)} style={{ width:'100%' }}>Copy to Clipboard</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
