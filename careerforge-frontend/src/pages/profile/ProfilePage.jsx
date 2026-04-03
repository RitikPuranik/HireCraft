import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { userAPI } from '../../api/services'
import { Card, Button, Input } from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name||'', phone: user?.phone||'', location: user?.location||'' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await userAPI.updateProfile(form)
      await refreshUser()
      toast.success('Profile updated!')
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  return (
    <div className="animate-fadeUp" style={{ maxWidth:520 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>My Profile</h1>
        <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>Manage your account details</p>
      </div>

      <Card style={{ padding:28, marginBottom:16, textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:18, background:'var(--accent-pale)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700, color:'var(--accent-dark)', marginBottom:12 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400 }}>{user?.name}</div>
        <div style={{ color:'var(--stone)', fontSize:13, marginTop:2 }}>{user?.email}</div>
        <div style={{ marginTop:8 }}>
          <span style={{ padding:'3px 10px', background:'var(--cream-100)', borderRadius:20, fontSize:12, color:'var(--stone-dark)' }}>
            Free Plan
          </span>
        </div>
      </Card>

      <Card style={{ padding:28 }}>
        <h3 style={{ fontFamily:'var(--font-serif)', fontSize:17, fontWeight:400, marginBottom:20 }}>Edit Profile</h3>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Input label="Full Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          <Input label="Email" value={user?.email} disabled style={{ opacity:0.6 }} />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+91 98765 43210" />
          <Input label="Location" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Bhopal, India" />
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </Card>
    </div>
  )
}
