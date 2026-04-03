import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resumeAPI } from '../../api/services'
import { Card, Button, Input, Textarea, Badge, EmptyState, Modal, Chip, Spinner } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

// ─── Resume List ──────────────────────────────────────────────────────────────
export function ResumesPage() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    try { const r = await resumeAPI.getAll(); setResumes(r.data) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this resume?')) return
    try { await resumeAPI.delete(id); toast.success('Deleted'); load() } catch (err) { toast.error(err.message) }
  }

  const handleSetDefault = async (id, e) => {
    e.stopPropagation()
    try { await resumeAPI.setDefault(id); toast.success('Set as default'); load() } catch (err) { toast.error(err.message) }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  return (
    <div className="animate-fadeUp" style={{ maxWidth:800 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>My Resumes</h1>
          <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>{resumes.length} resume{resumes.length!==1?'s':''} · Free plan allows 1</p>
        </div>
        <Button onClick={() => navigate('/resumes/new')}>+ New Resume</Button>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <EmptyState icon="📄" title="No resumes yet" description="Build your first AI-powered resume to get started."
            action={<Button onClick={() => navigate('/resumes/new')}>Create Resume</Button>} />
        </Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }} className="stagger">
          {resumes.map(r => (
            <Card key={r._id} hover onClick={() => navigate(`/resumes/${r._id}`)} className="animate-fadeUp" style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
                  <div style={{ width:44, height:44, background:'var(--accent-pale)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📄</div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:600, color:'var(--ink)', fontSize:15 }}>{r.title}</span>
                      {r.isDefault && <Badge variant="accent">Default</Badge>}
                      {r.atsScore && <Badge variant={r.atsScore>=75?'success':r.atsScore>=50?'warning':'danger'}>ATS {r.atsScore}%</Badge>}
                    </div>
                    <div style={{ fontSize:12, color:'var(--stone)', marginTop:2 }}>
                      {r.personalInfo?.fullName} · Updated {new Date(r.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                  {!r.isDefault && <Button size="sm" variant="ghost" onClick={(e) => handleSetDefault(r._id, e)}>Set Default</Button>}
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/resumes/${r._id}`)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={(e) => handleDelete(r._id, e)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Resume Form ──────────────────────────────────────────────────────────────
const emptyResume = {
  title: 'My Resume',
  personalInfo: { fullName:'', email:'', phone:'', location:'', linkedin:'', github:'', portfolio:'', summary:'' },
  workExperience: [],
  education: [],
  skills: { technical:[], soft:[], languages:[], tools:[] },
  projects: [],
  certifications: [],
}

export function ResumeFormPage() {
  const { id } = useParams()
  const isNew = id === 'new' || !id
  const [form, setForm] = useState(emptyResume)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('personal')
  const [skillInput, setSkillInput] = useState({ technical:'', soft:'', languages:'', tools:'' })
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNew) {
      resumeAPI.getOne(id).then(r => { setForm(r.data); setLoading(false) }).catch(() => { toast.error('Resume not found'); navigate('/resumes') })
    }
  }, [id])

  const set = (path, value) => {
    setForm(f => {
      const clone = JSON.parse(JSON.stringify(f))
      const parts = path.split('.')
      let cur = clone
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]]
      cur[parts[parts.length - 1]] = value
      return clone
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isNew) { const r = await resumeAPI.create(form); toast.success('Resume created!'); navigate(`/resumes/${r.data._id}`) }
      else { await resumeAPI.update(id, form); toast.success('Saved!') }
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const addWorkExp = () => setForm(f => ({ ...f, workExperience: [...f.workExperience, { jobTitle:'', company:'', location:'', startDate:'', endDate:'Present', current:false, description:[] }] }))
  const addEdu = () => setForm(f => ({ ...f, education: [...f.education, { degree:'', institution:'', fieldOfStudy:'', startDate:'', endDate:'', grade:'' }] }))
  const addProject = () => setForm(f => ({ ...f, projects: [...f.projects, { title:'', company:'', description:[], techStack:[], liveUrl:'', repoUrl:'', startDate:'', endDate:'' }] }))
  const addCert = () => setForm(f => ({ ...f, certifications: [...f.certifications, { name:'', issuingBody:'', issueDate:'', expiryDate:'', credentialUrl:'' }] }))

  const addSkill = (cat) => {
    const val = skillInput[cat].trim()
    if (!val) return
    setForm(f => ({ ...f, skills: { ...f.skills, [cat]: [...(f.skills[cat]||[]), val] } }))
    setSkillInput(s => ({ ...s, [cat]: '' }))
  }
  const removeSkill = (cat, i) => setForm(f => ({ ...f, skills: { ...f.skills, [cat]: f.skills[cat].filter((_,j)=>j!==i) } }))

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  const tabs = [
    { value:'personal', label:'Personal' },
    { value:'experience', label:'Experience' },
    { value:'education', label:'Education' },
    { value:'skills', label:'Skills' },
    { value:'projects', label:'Projects' },
    { value:'certifications', label:'Certifications' },
  ]

  return (
    <div className="animate-fadeUp" style={{ maxWidth:760 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:26, fontWeight:400 }}>{isNew ? 'New Resume' : 'Edit Resume'}</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Button variant="secondary" onClick={() => navigate('/resumes')}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save Resume</Button>
        </div>
      </div>

      <Card style={{ marginBottom:16, padding:'16px 20px' }}>
        <Input label="Resume Title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Software Engineer Resume" />
      </Card>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', marginBottom:16, padding:'4px 0' }}>
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} style={{
            padding:'8px 16px', fontSize:13, fontWeight:500, borderRadius:'var(--radius-sm)',
            border:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
            background: tab===t.value ? 'var(--accent)' : 'var(--cream-100)',
            color: tab===t.value ? '#fff' : 'var(--stone-dark)',
          }}>{t.label}</button>
        ))}
      </div>

      <Card>
        {/* Personal */}
        {tab === 'personal' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input label="Full Name *" value={form.personalInfo.fullName} onChange={e => set('personalInfo.fullName', e.target.value)} />
              <Input label="Email *" type="email" value={form.personalInfo.email} onChange={e => set('personalInfo.email', e.target.value)} />
              <Input label="Phone" value={form.personalInfo.phone} onChange={e => set('personalInfo.phone', e.target.value)} />
              <Input label="Location" value={form.personalInfo.location} onChange={e => set('personalInfo.location', e.target.value)} />
              <Input label="LinkedIn" value={form.personalInfo.linkedin} onChange={e => set('personalInfo.linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
              <Input label="GitHub" value={form.personalInfo.github} onChange={e => set('personalInfo.github', e.target.value)} placeholder="github.com/..." />
              <Input label="Portfolio" value={form.personalInfo.portfolio} onChange={e => set('personalInfo.portfolio', e.target.value)} placeholder="yoursite.com" style={{ gridColumn:'1/-1' }} />
            </div>
            <Textarea label="Professional Summary" rows={4} value={form.personalInfo.summary} onChange={e => set('personalInfo.summary', e.target.value)} placeholder="Brief description of your experience and goals..." />
          </div>
        )}

        {/* Work Experience */}
        {tab === 'experience' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {form.workExperience.map((w, i) => (
              <div key={i} style={{ padding:'16px', background:'var(--cream-100)', borderRadius:'var(--radius-sm)', position:'relative' }}>
                <button onClick={() => setForm(f => ({ ...f, workExperience: f.workExperience.filter((_,j)=>j!==i) }))}
                  style={{ position:'absolute', top:12, right:12, background:'var(--red-pale)', border:'none', color:'var(--red)', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:12 }}>Remove</button>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Input label="Job Title *" value={w.jobTitle} onChange={e => { const we=[...form.workExperience]; we[i].jobTitle=e.target.value; set('workExperience',we) }} />
                  <Input label="Company" value={w.company} onChange={e => { const we=[...form.workExperience]; we[i].company=e.target.value; set('workExperience',we) }} />
                  <Input label="Location" value={w.location} onChange={e => { const we=[...form.workExperience]; we[i].location=e.target.value; set('workExperience',we) }} />
                  <Input label="Start Date *" type="month" value={w.startDate} onChange={e => { const we=[...form.workExperience]; we[i].startDate=e.target.value; set('workExperience',we) }} />
                  <Input label="End Date" value={w.current?'Present':w.endDate} disabled={w.current} onChange={e => { const we=[...form.workExperience]; we[i].endDate=e.target.value; set('workExperience',we) }} type={w.current?'text':'month'} />
                  <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:20 }}>
                    <input type="checkbox" checked={w.current} onChange={e => { const we=[...form.workExperience]; we[i].current=e.target.checked; if(e.target.checked)we[i].endDate='Present'; set('workExperience',we) }} />
                    <label style={{ fontSize:13, color:'var(--stone-dark)' }}>Currently working here</label>
                  </div>
                </div>
                <div style={{ marginTop:12 }}>
                  <label style={{ fontSize:13, fontWeight:500, color:'var(--stone-dark)', display:'block', marginBottom:6 }}>Description (bullet points)</label>
                  <Textarea rows={3} value={w.description.join('\n')} onChange={e => { const we=[...form.workExperience]; we[i].description=e.target.value.split('\n'); set('workExperience',we) }} placeholder="• Led team of 5 engineers to deliver...&#10;• Reduced load time by 40%..." />
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addWorkExp}>+ Add Experience</Button>
          </div>
        )}

        {/* Education */}
        {tab === 'education' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {form.education.map((edu, i) => (
              <div key={i} style={{ padding:'16px', background:'var(--cream-100)', borderRadius:'var(--radius-sm)', position:'relative' }}>
                <button onClick={() => setForm(f => ({ ...f, education: f.education.filter((_,j)=>j!==i) }))}
                  style={{ position:'absolute', top:12, right:12, background:'var(--red-pale)', border:'none', color:'var(--red)', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:12 }}>Remove</button>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Input label="Degree *" value={edu.degree} onChange={e => { const ed=[...form.education]; ed[i].degree=e.target.value; set('education',ed) }} />
                  <Input label="Institution *" value={edu.institution} onChange={e => { const ed=[...form.education]; ed[i].institution=e.target.value; set('education',ed) }} />
                  <Input label="Field of Study" value={edu.fieldOfStudy} onChange={e => { const ed=[...form.education]; ed[i].fieldOfStudy=e.target.value; set('education',ed) }} />
                  <Input label="Grade / CGPA" value={edu.grade} onChange={e => { const ed=[...form.education]; ed[i].grade=e.target.value; set('education',ed) }} />
                  <Input label="Start Date" type="month" value={edu.startDate} onChange={e => { const ed=[...form.education]; ed[i].startDate=e.target.value; set('education',ed) }} />
                  <Input label="End Date" type="month" value={edu.endDate} onChange={e => { const ed=[...form.education]; ed[i].endDate=e.target.value; set('education',ed) }} />
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addEdu}>+ Add Education</Button>
          </div>
        )}

        {/* Skills */}
        {tab === 'skills' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {[['technical','Technical Skills'],['soft','Soft Skills'],['languages','Languages'],['tools','Tools & Frameworks']].map(([cat, label]) => (
              <div key={cat}>
                <label style={{ fontSize:13, fontWeight:500, color:'var(--stone-dark)', display:'block', marginBottom:8 }}>{label}</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                  {(form.skills[cat]||[]).map((s,i) => <Chip key={i} onRemove={() => removeSkill(cat, i)}>{s}</Chip>)}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={skillInput[cat]} onChange={e => setSkillInput(s=>({...s,[cat]:e.target.value}))}
                    onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addSkill(cat)} }}
                    placeholder={`Add ${label.toLowerCase()}...`}
                    style={{ flex:1, padding:'8px 12px', borderRadius:'var(--radius-sm)', border:'1px solid var(--cream-300)', fontSize:13, outline:'none' }} />
                  <Button size="sm" variant="secondary" onClick={() => addSkill(cat)}>Add</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {tab === 'projects' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {form.projects.map((p, i) => (
              <div key={i} style={{ padding:'16px', background:'var(--cream-100)', borderRadius:'var(--radius-sm)', position:'relative' }}>
                <button onClick={() => setForm(f => ({ ...f, projects: f.projects.filter((_,j)=>j!==i) }))}
                  style={{ position:'absolute', top:12, right:12, background:'var(--red-pale)', border:'none', color:'var(--red)', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:12 }}>Remove</button>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Input label="Project Title *" value={p.title} onChange={e => { const ps=[...form.projects]; ps[i].title=e.target.value; set('projects',ps) }} />
                  <Input label="Company / Context" value={p.company} onChange={e => { const ps=[...form.projects]; ps[i].company=e.target.value; set('projects',ps) }} />
                  <Input label="Live URL" value={p.liveUrl} onChange={e => { const ps=[...form.projects]; ps[i].liveUrl=e.target.value; set('projects',ps) }} />
                  <Input label="Repo URL" value={p.repoUrl} onChange={e => { const ps=[...form.projects]; ps[i].repoUrl=e.target.value; set('projects',ps) }} />
                </div>
                <div style={{ marginTop:12 }}>
                  <Textarea label="Description (bullet points)" rows={3} value={p.description.join('\n')} onChange={e => { const ps=[...form.projects]; ps[i].description=e.target.value.split('\n'); set('projects',ps) }} />
                </div>
                <div style={{ marginTop:12 }}>
                  <Input label="Tech Stack (comma separated)" value={p.techStack.join(', ')} onChange={e => { const ps=[...form.projects]; ps[i].techStack=e.target.value.split(',').map(s=>s.trim()).filter(Boolean); set('projects',ps) }} placeholder="React, Node.js, MongoDB..." />
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addProject}>+ Add Project</Button>
          </div>
        )}

        {/* Certifications */}
        {tab === 'certifications' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {form.certifications.map((c, i) => (
              <div key={i} style={{ padding:'16px', background:'var(--cream-100)', borderRadius:'var(--radius-sm)', position:'relative' }}>
                <button onClick={() => setForm(f => ({ ...f, certifications: f.certifications.filter((_,j)=>j!==i) }))}
                  style={{ position:'absolute', top:12, right:12, background:'var(--red-pale)', border:'none', color:'var(--red)', borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:12 }}>Remove</button>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Input label="Certification Name *" value={c.name} onChange={e => { const cs=[...form.certifications]; cs[i].name=e.target.value; set('certifications',cs) }} />
                  <Input label="Issuing Body" value={c.issuingBody} onChange={e => { const cs=[...form.certifications]; cs[i].issuingBody=e.target.value; set('certifications',cs) }} />
                  <Input label="Issue Date" type="month" value={c.issueDate} onChange={e => { const cs=[...form.certifications]; cs[i].issueDate=e.target.value; set('certifications',cs) }} />
                  <Input label="Expiry Date" type="month" value={c.expiryDate} onChange={e => { const cs=[...form.certifications]; cs[i].expiryDate=e.target.value; set('certifications',cs) }} />
                  <Input label="Credential URL" value={c.credentialUrl} onChange={e => { const cs=[...form.certifications]; cs[i].credentialUrl=e.target.value; set('certifications',cs) }} style={{ gridColumn:'1/-1' }} />
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addCert}>+ Add Certification</Button>
          </div>
        )}
      </Card>

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16, gap:8 }}>
        <Button variant="secondary" onClick={() => navigate('/resumes')}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Save Resume</Button>
      </div>
    </div>
  )
}
