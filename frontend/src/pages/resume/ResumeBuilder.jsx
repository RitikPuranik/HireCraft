import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeAPI } from '../../api/resume';
import { Spinner } from '../../components/ui';

const Section = ({ title, children, open, onToggle }) => (
  <div className="card overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-cream-50 transition-colors">
      <span className="font-semibold text-charcoal-800 text-sm">{title}</span>
      {open ? <ChevronUp size={18} className="text-sage-400" /> : <ChevronDown size={18} className="text-sage-400" />}
    </button>
    {open && <div className="px-5 pb-5 border-t border-cream-200 pt-4 space-y-4">{children}</div>}
  </div>
);

const emptyExp = () => ({ jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: [''] });
const emptyEdu = () => ({ degree: '', institution: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '' });
const emptyProj = () => ({ title: '', company: '', techStack: '', liveUrl: '', description: [''] });
const emptyCert = () => ({ name: '', issuingBody: '', issueDate: '', expiryDate: '', credentialUrl: '' });

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState({ personal: true, work: false, edu: false, skills: false, projects: false, certs: false });
  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const [title, setTitle] = useState('My Resume');
  const [personal, setPersonal] = useState({ fullName: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '' });
  const [work, setWork] = useState([emptyExp()]);
  const [edu, setEdu] = useState([emptyEdu()]);
  const [skills, setSkills] = useState({ technical: '', tools: '', soft: '', languages: '' });
  const [projects, setProjects] = useState([emptyProj()]);
  const [certs, setCerts] = useState([emptyCert()]);

  const setP = (k, v) => setPersonal((p) => ({ ...p, [k]: v }));

  // Work experience helpers
  const setWork_ = (i, k, v) => setWork((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const setWorkBullet = (i, bi, v) => setWork((arr) => arr.map((x, j) => j === i ? { ...x, description: x.description.map((b, k) => k === bi ? v : b) } : x));
  const addWorkBullet = (i) => setWork((arr) => arr.map((x, j) => j === i ? { ...x, description: [...x.description, ''] } : x));
  const removeWorkBullet = (i, bi) => setWork((arr) => arr.map((x, j) => j === i ? { ...x, description: x.description.filter((_, k) => k !== bi) } : x));

  // Project helpers
  const setProj = (i, k, v) => setProjects((arr) => arr.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const setProjBullet = (i, bi, v) => setProjects((arr) => arr.map((x, j) => j === i ? { ...x, description: x.description.map((b, k) => k === bi ? v : b) } : x));
  const addProjBullet = (i) => setProjects((arr) => arr.map((x, j) => j === i ? { ...x, description: [...x.description, ''] } : x));

  const splitCSV = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!personal.fullName.trim()) return toast.error('Full name is required');
    if (!personal.email.trim()) return toast.error('Email is required');

    setSaving(true);
    try {
      const payload = {
        title,
        personalInfo: personal,
        workExperience: work.filter((w) => w.jobTitle).map((w) => ({
          ...w, description: w.description.filter(Boolean),
        })),
        education: edu.filter((e) => e.degree && e.institution),
        skills: {
          technical: splitCSV(skills.technical),
          tools:     splitCSV(skills.tools),
          soft:      splitCSV(skills.soft),
          languages: splitCSV(skills.languages),
        },
        projects: projects.filter((p) => p.title).map((p) => ({
          ...p,
          techStack:   splitCSV(p.techStack),
          description: p.description.filter(Boolean),
        })),
        certifications: certs.filter((c) => c.name),
      };

      const res = await resumeAPI.create(payload);
      const id = res.data?.data?._id || res.data?._id;
      toast.success('Resume saved!');
      navigate(id ? `/resumes/${id}` : '/resumes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, value, onChange, placeholder, type = 'text', required }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-up pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-800">Resume Builder</h1>
          <p className="text-sm text-sage-400 mt-1">Build a clean, ATS-optimised resume</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <><Spinner size={16} className="text-white" /> Saving…</> : <><Save size={16} /> Save Resume</>}
        </button>
      </div>

      <div className="mb-4">
        <label className="label">Resume Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Software Engineer Resume" />
      </div>

      <div className="space-y-3">
        {/* Personal Info */}
        <Section title="Personal Information" open={open.personal} onToggle={() => toggle('personal')}>
          <div className="grid md:grid-cols-2 gap-4">
            <F label="Full Name" value={personal.fullName} onChange={(v) => setP('fullName', v)} placeholder="Arjun Sharma" required />
            <F label="Email" value={personal.email} onChange={(v) => setP('email', v)} placeholder="arjun@example.com" type="email" required />
            <F label="Phone" value={personal.phone} onChange={(v) => setP('phone', v)} placeholder="+91 98765 43210" />
            <F label="Location" value={personal.location} onChange={(v) => setP('location', v)} placeholder="Mumbai, India" />
            <F label="LinkedIn" value={personal.linkedin} onChange={(v) => setP('linkedin', v)} placeholder="linkedin.com/in/arjun" />
            <F label="GitHub" value={personal.github} onChange={(v) => setP('github', v)} placeholder="github.com/arjun" />
            <F label="Portfolio" value={personal.portfolio} onChange={(v) => setP('portfolio', v)} placeholder="arjun.dev" />
          </div>
          <div>
            <label className="label">Professional Summary</label>
            <textarea value={personal.summary} onChange={(e) => setP('summary', e.target.value)}
              placeholder="Brief 2-3 sentence professional summary…" rows={3} className="input-field resize-none" />
          </div>
        </Section>

        {/* Work Experience */}
        <Section title={`Work Experience (${work.length})`} open={open.work} onToggle={() => toggle('work')}>
          {work.map((w, i) => (
            <div key={i} className="border border-cream-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sage-500">Experience {i + 1}</span>
                {work.length > 1 && (
                  <button onClick={() => setWork((arr) => arr.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <F label="Job Title" value={w.jobTitle} onChange={(v) => setWork_(i, 'jobTitle', v)} placeholder="Software Engineer" required />
                <F label="Company (optional)" value={w.company} onChange={(v) => setWork_(i, 'company', v)} placeholder="Infosys" />
                <F label="Location" value={w.location} onChange={(v) => setWork_(i, 'location', v)} placeholder="Bangalore" />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`curr-${i}`} checked={w.current} onChange={(e) => setWork_(i, 'current', e.target.checked)} className="accent-sage-500" />
                  <label htmlFor={`curr-${i}`} className="text-sm text-sage-600">Currently working here</label>
                </div>
                <F label="Start Date" value={w.startDate} onChange={(v) => setWork_(i, 'startDate', v)} placeholder="Jan 2022" />
                {!w.current && <F label="End Date" value={w.endDate} onChange={(v) => setWork_(i, 'endDate', v)} placeholder="Dec 2023" />}
              </div>
              <div>
                <label className="label">Bullet Points</label>
                {w.description.map((b, bi) => (
                  <div key={bi} className="flex gap-2 mb-2">
                    <input value={b} onChange={(e) => setWorkBullet(i, bi, e.target.value)} placeholder="Achieved…" className="input-field flex-1" />
                    {w.description.length > 1 && (
                      <button onClick={() => removeWorkBullet(i, bi)} className="text-red-400"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => addWorkBullet(i)} className="text-xs text-sage-500 hover:text-sage-600 font-medium flex items-center gap-1">
                  <Plus size={12} /> Add bullet
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => setWork((arr) => [...arr, emptyExp()])} className="btn-secondary text-sm py-2 w-full">
            <Plus size={14} /> Add Experience
          </button>
        </Section>

        {/* Education */}
        <Section title={`Education (${edu.length})`} open={open.edu} onToggle={() => toggle('edu')}>
          {edu.map((e, i) => (
            <div key={i} className="border border-cream-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sage-500">Education {i + 1}</span>
                {edu.length > 1 && (
                  <button onClick={() => setEdu((arr) => arr.filter((_, j) => j !== i))} className="text-red-400"><Trash2 size={14} /></button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <F label="Degree" value={e.degree} onChange={(v) => setEdu((arr) => arr.map((x, j) => j === i ? { ...x, degree: v } : x))} placeholder="B.Tech Computer Science" required />
                <F label="Institution" value={e.institution} onChange={(v) => setEdu((arr) => arr.map((x, j) => j === i ? { ...x, institution: v } : x))} placeholder="IIT Mumbai" required />
                <F label="Field of Study" value={e.fieldOfStudy} onChange={(v) => setEdu((arr) => arr.map((x, j) => j === i ? { ...x, fieldOfStudy: v } : x))} placeholder="Computer Science" />
                <F label="Grade / CGPA" value={e.grade} onChange={(v) => setEdu((arr) => arr.map((x, j) => j === i ? { ...x, grade: v } : x))} placeholder="8.5 / 10" />
                <F label="Start Date" value={e.startDate} onChange={(v) => setEdu((arr) => arr.map((x, j) => j === i ? { ...x, startDate: v } : x))} placeholder="2018" required />
                <F label="End Date" value={e.endDate} onChange={(v) => setEdu((arr) => arr.map((x, j) => j === i ? { ...x, endDate: v } : x))} placeholder="2022" />
              </div>
            </div>
          ))}
          <button onClick={() => setEdu((arr) => [...arr, emptyEdu()])} className="btn-secondary text-sm py-2 w-full">
            <Plus size={14} /> Add Education
          </button>
        </Section>

        {/* Skills */}
        <Section title="Skills" open={open.skills} onToggle={() => toggle('skills')}>
          <p className="text-xs text-sage-400 -mt-1 mb-2">Enter comma-separated values</p>
          <div className="grid md:grid-cols-2 gap-4">
            <F label="Technical Skills" value={skills.technical} onChange={(v) => setSkills((s) => ({ ...s, technical: v }))} placeholder="React, Node.js, Python, SQL" />
            <F label="Tools & Platforms" value={skills.tools} onChange={(v) => setSkills((s) => ({ ...s, tools: v }))} placeholder="Git, Docker, AWS, Figma" />
            <F label="Soft Skills" value={skills.soft} onChange={(v) => setSkills((s) => ({ ...s, soft: v }))} placeholder="Leadership, Communication" />
            <F label="Languages" value={skills.languages} onChange={(v) => setSkills((s) => ({ ...s, languages: v }))} placeholder="English, Hindi, Tamil" />
          </div>
        </Section>

        {/* Projects */}
        <Section title={`Projects (${projects.length})`} open={open.projects} onToggle={() => toggle('projects')}>
          {projects.map((p, i) => (
            <div key={i} className="border border-cream-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-sage-500">Project {i + 1}</span>
                {projects.length > 1 && (
                  <button onClick={() => setProjects((arr) => arr.filter((_, j) => j !== i))} className="text-red-400"><Trash2 size={14} /></button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <F label="Project Title" value={p.title} onChange={(v) => setProj(i, 'title', v)} placeholder="E-commerce Platform" required />
                <F label="Built For (optional)" value={p.company} onChange={(v) => setProj(i, 'company', v)} placeholder="Internship / Freelance" />
                <F label="Tech Stack" value={p.techStack} onChange={(v) => setProj(i, 'techStack', v)} placeholder="React, Node.js, MongoDB" />
                <F label="Live URL (optional)" value={p.liveUrl} onChange={(v) => setProj(i, 'liveUrl', v)} placeholder="https://myproject.com" />
              </div>
              <div>
                <label className="label">Description Bullets</label>
                {p.description.map((b, bi) => (
                  <div key={bi} className="flex gap-2 mb-2">
                    <input value={b} onChange={(e) => setProjBullet(i, bi, e.target.value)} placeholder="Built feature that…" className="input-field flex-1" />
                  </div>
                ))}
                <button onClick={() => addProjBullet(i)} className="text-xs text-sage-500 hover:text-sage-600 font-medium flex items-center gap-1">
                  <Plus size={12} /> Add bullet
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => setProjects((arr) => [...arr, emptyProj()])} className="btn-secondary text-sm py-2 w-full">
            <Plus size={14} /> Add Project
          </button>
        </Section>

        {/* Certifications */}
        <Section title={`Certifications (${certs.length})`} open={open.certs} onToggle={() => toggle('certs')}>
          {certs.map((c, i) => (
            <div key={i} className="border border-cream-300 rounded-xl p-4 grid md:grid-cols-2 gap-3">
              <F label="Certification Name" value={c.name} onChange={(v) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="AWS Solutions Architect" required />
              <F label="Issuing Body (optional)" value={c.issuingBody} onChange={(v) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, issuingBody: v } : x))} placeholder="Amazon" />
              <F label="Issue Date" value={c.issueDate} onChange={(v) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, issueDate: v } : x))} placeholder="Jan 2023" />
              <F label="Expiry Date" value={c.expiryDate} onChange={(v) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, expiryDate: v } : x))} placeholder="Jan 2026" />
              <F label="Credential URL (optional)" value={c.credentialUrl} onChange={(v) => setCerts((arr) => arr.map((x, j) => j === i ? { ...x, credentialUrl: v } : x))} placeholder="https://credly.com/…" />
              {certs.length > 1 && (
                <div className="flex items-end">
                  <button onClick={() => setCerts((arr) => arr.filter((_, j) => j !== i))} className="btn-secondary text-xs py-2 text-red-400">
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setCerts((arr) => [...arr, emptyCert()])} className="btn-secondary text-sm py-2 w-full">
            <Plus size={14} /> Add Certification
          </button>
        </Section>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-6 py-4 text-base">
        {saving ? <><Spinner size={18} className="text-white" /> Saving…</> : <><FileText size={18} /> Save Resume</>}
      </button>
    </div>
  );
}