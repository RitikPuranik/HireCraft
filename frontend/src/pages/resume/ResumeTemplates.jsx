import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, ArrowRight, Check, Loader2, Sparkles, User, Briefcase, GraduationCap, Code2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeAPI } from '../../api/resume';

/* ─── Template definitions ───────────────────────────────── */
const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic Professional',
    desc: 'Clean, ATS-friendly. Single column. Best for traditional industries.',
    color: '#1e293b',
    accent: '#3b82f6',
    preview: (
      <div className="w-full h-full bg-white text-[7px] p-3 font-mono leading-tight overflow-hidden rounded-lg">
        <div className="border-b-2 border-slate-800 pb-2 mb-2">
          <div className="h-3 w-24 bg-slate-800 rounded mb-1" />
          <div className="h-1.5 w-32 bg-slate-400 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <div className="h-1.5 w-16 bg-slate-600 rounded" />
            {[28,24,30,22].map((w,i) => <div key={i} className="h-1 bg-slate-200 rounded" style={{width:`${w*3}px`}} />)}
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 w-10 bg-slate-600 rounded" />
            {[20,16,18].map((w,i) => <div key={i} className="h-1 bg-slate-200 rounded" style={{width:`${w*3}px`}} />)}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    desc: 'Left sidebar with accent color. Perfect for tech and creative roles.',
    color: '#0f172a',
    accent: '#6366f1',
    preview: (
      <div className="w-full h-full bg-white text-[7px] overflow-hidden rounded-lg flex">
        <div className="w-1/3 bg-indigo-600 p-2 space-y-2">
          <div className="w-10 h-10 rounded-full bg-indigo-400 mx-auto" />
          {[20,16,22,18].map((w,i) => <div key={i} className="h-1 bg-indigo-400/60 rounded" style={{width:`${w*2}px`}} />)}
        </div>
        <div className="flex-1 p-2 space-y-1.5">
          <div className="h-2 w-20 bg-slate-700 rounded" />
          {[28,22,30,20,26].map((w,i) => <div key={i} className="h-1 bg-slate-200 rounded" style={{width:`${w*2.5}px`}} />)}
        </div>
      </div>
    ),
  },
  {
    id: 'elegant',
    name: 'Elegant Executive',
    desc: 'Serif fonts, centered header, refined spacing. For senior roles.',
    color: '#1c1917',
    accent: '#b45309',
    preview: (
      <div className="w-full h-full bg-amber-50 text-[7px] p-3 overflow-hidden rounded-lg">
        <div className="text-center mb-2 border-b border-amber-800/30 pb-2">
          <div className="h-2.5 w-20 bg-amber-900 rounded mx-auto mb-1" />
          <div className="h-1.5 w-28 bg-amber-600/60 rounded mx-auto" />
        </div>
        <div className="space-y-1.5">
          {['Experience','Education','Skills'].map((s,i) => (
            <div key={i}>
              <div className="h-1.5 w-16 bg-amber-800 rounded mb-1" />
              {[28,22,26].map((w,j) => <div key={j} className="h-1 bg-amber-900/20 rounded mb-0.5" style={{width:`${w*3}px`}} />)}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    desc: 'Bold header, project-focused layout. For designers and developers.',
    color: '#0c0a09',
    accent: '#ec4899',
    preview: (
      <div className="w-full h-full bg-gray-900 text-[7px] p-3 overflow-hidden rounded-lg">
        <div className="mb-2 border-l-4 border-pink-500 pl-2">
          <div className="h-2.5 w-20 bg-white rounded mb-1" />
          <div className="h-1.5 w-16 bg-pink-400 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-gray-800 rounded p-1.5 space-y-1">
              <div className="h-1.5 w-12 bg-pink-400 rounded" />
              {[20,16].map((w,j) => <div key={j} className="h-1 bg-gray-600 rounded" style={{width:`${w*2}px`}} />)}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'compact',
    name: 'Compact 1-Page',
    desc: 'Dense, information-rich. Fits everything on one page. ATS-optimized.',
    color: '#064e3b',
    accent: '#10b981',
    preview: (
      <div className="w-full h-full bg-white text-[7px] p-2 overflow-hidden rounded-lg">
        <div className="bg-emerald-700 text-white p-1.5 rounded mb-2 flex justify-between items-center">
          <div>
            <div className="h-2 w-16 bg-white rounded mb-0.5" />
            <div className="h-1 w-20 bg-emerald-300 rounded" />
          </div>
          <div className="space-y-0.5">
            {[12,14,12].map((w,i) => <div key={i} className="h-1 bg-emerald-300/60 rounded" style={{width:`${w*2}px`}} />)}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          <div className="col-span-3 space-y-1">
            {[0,1,2].map(i => (
              <div key={i}>
                <div className="h-1.5 w-14 bg-emerald-700 rounded mb-0.5" />
                {[20,16,18].map((w,j) => <div key={j} className="h-0.5 bg-gray-200 rounded mb-0.5" style={{width:`${w*2.5}px`}} />)}
              </div>
            ))}
          </div>
          <div className="col-span-2 space-y-1">
            {[0,1].map(i => (
              <div key={i}>
                <div className="h-1.5 w-10 bg-emerald-700 rounded mb-0.5" />
                {[12,10,14,11].map((w,j) => <div key={j} className="h-0.5 bg-gray-200 rounded mb-0.5" style={{width:`${w*2}px`}} />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

/* ─── Main component ─────────────────────────────────────── */
export default function ResumeTemplates() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [step,       setStep]       = useState('pick');  // pick | fill-method | creating
  const [selected,   setSelected]   = useState(null);
  const [fillMethod, setFillMethod] = useState(null);    // 'upload' | 'manual'
  const [uploading,  setUploading]  = useState(false);
  const [uploadedId, setUploadedId] = useState(null);

  const handleSelectTemplate = (tpl) => {
    setSelected(tpl);
    setStep('fill-method');
  };

  const handleUploadResume = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await resumeAPI.upload(formData);
      const resumeId = res.data?.data?._id || res.data?._id;
      setUploadedId(resumeId);
      toast.success('Resume uploaded! Redirecting to builder…');
      // Navigate to builder with template + resumeId pre-filled
      setTimeout(() => {
        navigate(`/resumes/build?template=${selected.id}&from=${resumeId}`);
      }, 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleManualBuild = () => {
    navigate(`/resumes/build?template=${selected.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-up pb-10">

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 mb-8">
        {['pick','fill-method'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${step === s || (i === 0 && step !== 'pick') ? 'bg-sage-500 text-white' : 'bg-cream-200 text-sage-400'}`}>
              {step !== 'pick' && i === 0 ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === s ? 'text-charcoal-800' : 'text-sage-400'}`}>
              {i === 0 ? 'Choose Template' : 'Fill Information'}
            </span>
            {i === 0 && <div className="w-8 h-px bg-cream-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Pick Template ── */}
      {step === 'pick' && (
        <>
          <div className="mb-6">
            <h1 className="font-display text-3xl font-semibold text-charcoal-800">Choose a Template</h1>
            <p className="text-sm text-sage-400 mt-1">Pick a design, then fill in your information — manually or from an existing resume.</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)}
                className="group text-left border-2 border-transparent hover:border-sage-400 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-white shadow-sm">
                {/* Preview thumbnail */}
                <div className="h-36 p-2" style={{ background: `${tpl.color}15` }}>
                  {tpl.preview}
                </div>
                <div className="p-3 border-t border-cream-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-charcoal-800 leading-tight">{tpl.name}</p>
                      <p className="text-[10px] text-sage-400 mt-0.5 leading-snug">{tpl.desc}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-transparent group-hover:border-sage-400 flex items-center justify-center flex-shrink-0 transition-all">
                      <ArrowRight size={12} className="text-sage-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: tpl.accent, background: `${tpl.accent}20` }} />
                    <span className="text-[9px] text-sage-400">Accent color</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/resumes/build')}
              className="text-sm text-sage-400 hover:text-sage-600 underline transition-colors">
              Skip templates — start from scratch
            </button>
          </div>
        </>
      )}

      {/* ── STEP 2: Fill Method ── */}
      {step === 'fill-method' && selected && (
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('pick')} className="flex items-center gap-1.5 text-sage-400 hover:text-sage-600 text-sm mb-6 transition-colors">
            ← Back to templates
          </button>

          <h1 className="font-display text-2xl font-semibold text-charcoal-800 mb-1">
            Fill Your Information
          </h1>
          <p className="text-sm text-sage-400 mb-8">
            You selected <strong className="text-charcoal-700">{selected.name}</strong>. How would you like to fill in your details?
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Option A: Upload existing resume */}
            <div className="card p-5 hover:shadow-md transition-all cursor-pointer group border-2 border-transparent hover:border-sage-300"
              onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => handleUploadResume(e.target.files?.[0])} />

              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                {uploading ? <Loader2 size={22} className="text-blue-500 animate-spin" />
                           : <Upload size={22} className="text-blue-500" />}
              </div>
              <h3 className="font-semibold text-charcoal-800 mb-2">Upload Existing Resume</h3>
              <p className="text-sm text-sage-500 leading-relaxed">
                Upload your current resume (PDF or Word). We'll extract your information and pre-fill the template automatically.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['PDF', 'DOC', 'DOCX'].map(f => (
                  <span key={f} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-semibold">{f}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-blue-500 text-sm font-semibold group-hover:gap-3 transition-all">
                {uploading ? 'Uploading…' : 'Choose file'} <ArrowRight size={14} />
              </div>
            </div>

            {/* Option B: Fill manually */}
            <div className="card p-5 hover:shadow-md transition-all cursor-pointer group border-2 border-transparent hover:border-sage-300"
              onClick={handleManualBuild}>
              <div className="w-12 h-12 rounded-xl bg-sage-50 flex items-center justify-center mb-4 group-hover:bg-sage-100 transition-colors">
                <FileText size={22} className="text-sage-500" />
              </div>
              <h3 className="font-semibold text-charcoal-800 mb-2">Fill Manually</h3>
              <p className="text-sm text-sage-500 leading-relaxed">
                Open the resume builder and fill in your information section by section — personal info, experience, education, and skills.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['Personal Info','Experience','Education','Skills'].map(s => (
                  <span key={s} className="px-2 py-0.5 bg-cream-100 text-sage-600 rounded-md text-[10px] font-medium">{s}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sage-500 text-sm font-semibold group-hover:gap-3 transition-all">
                Open Builder <ArrowRight size={14} />
              </div>
            </div>
          </div>

          {/* Template preview */}
          <div className="mt-6 p-4 bg-cream-50 rounded-2xl border border-cream-200 flex items-center gap-4">
            <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-cream-300">
              <div className="w-full h-full scale-[0.8] origin-top-left">{selected.preview}</div>
            </div>
            <div>
              <p className="font-semibold text-charcoal-800 text-sm">{selected.name}</p>
              <p className="text-xs text-sage-400 mt-0.5">{selected.desc}</p>
              <button onClick={() => setStep('pick')} className="text-xs text-sage-500 hover:text-sage-700 mt-1 underline transition-colors">
                Change template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}