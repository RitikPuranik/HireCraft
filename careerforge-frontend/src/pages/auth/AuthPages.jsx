import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button, Input, Card } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await login(form.email, form.password)
    if (res.success) { toast.success('Welcome back!'); navigate('/dashboard') }
    else toast.error(res.error)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--cream)' }}>
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:-100, right:-100, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(193,123,63,0.08) 0%, transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:-100, left:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(74,124,89,0.06) 0%, transparent 70%)' }} />
      </div>
      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }} className="animate-fadeUp">
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'var(--accent)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16, boxShadow:'0 4px 16px rgba(193,123,63,0.3)' }}>⚡</div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400, color:'var(--ink)', marginBottom:6 }}>Welcome back</h1>
          <p style={{ color:'var(--stone)', fontSize:14 }}>Sign in to your CareerForge account</p>
        </div>

        <Card style={{ padding:32 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <Input label="Email address" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input label="Password" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <Button type="submit" loading={loading} size="lg" style={{ width:'100%', marginTop:4 }}>
              Sign in
            </Button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--stone)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--accent)', fontWeight:500 }}>Create one →</Link>
          </p>
        </Card>

        <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'var(--stone)' }}>
          AI-powered career tools · Built with ❤️
        </p>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (form.password.length < 6) e.password = 'At least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const res = await register(form.name, form.email, form.password)
    if (res.success) { toast.success('Account created! Welcome aboard 🎉'); navigate('/dashboard') }
    else toast.error(res.error)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--cream)' }}>
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:-80, left:-80, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(193,123,63,0.07) 0%, transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(58,107,138,0.06) 0%, transparent 70%)' }} />
      </div>
      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }} className="animate-fadeUp">
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'var(--accent)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16, boxShadow:'0 4px 16px rgba(193,123,63,0.3)' }}>⚡</div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400, color:'var(--ink)', marginBottom:6 }}>Start your journey</h1>
          <p style={{ color:'var(--stone)', fontSize:14 }}>Create your free CareerForge account</p>
        </div>

        <Card style={{ padding:32 }}>
          {/* Free plan highlights */}
          <div style={{ background:'var(--cream-100)', borderRadius:'var(--radius-sm)', padding:'12px 16px', marginBottom:24, display:'flex', gap:16, flexWrap:'wrap' }}>
            {['1 Resume free', '3 ATS checks/day', '2 Interviews/day'].map(f => (
              <span key={f} style={{ fontSize:12, color:'var(--stone-dark)', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ color:'var(--green)' }}>✓</span> {f}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <Input label="Full name" type="text" placeholder="Ritik Sharma" value={form.name}
              error={errors.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input label="Email address" type="email" placeholder="you@example.com" value={form.email}
              error={errors.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password}
              error={errors.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <Button type="submit" loading={loading} size="lg" style={{ width:'100%', marginTop:4 }}>
              Create free account
            </Button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--stone)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent)', fontWeight:500 }}>Sign in →</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
