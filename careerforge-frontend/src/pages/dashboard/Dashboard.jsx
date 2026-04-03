import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { progressAPI, subscriptionAPI } from '../../api/services'
import { Card, Badge, ScoreRing, Spinner } from '../../components/ui/index.jsx'

const quickActions = [
  { to:'/resumes/new',     emoji:'📄', label:'Build Resume',     desc:'Create or edit your resume' },
  { to:'/ats',             emoji:'🎯', label:'ATS Check',        desc:'Score your resume instantly' },
  { to:'/interview/setup', emoji:'🎤', label:'Mock Interview',   desc:'Practice with AI questions' },
  { to:'/jobmatch',        emoji:'🔍', label:'Job Match',        desc:'Analyze job fit instantly' },
  { to:'/coverletter',     emoji:'✉️', label:'Cover Letter',     desc:'Generate in seconds' },
  { to:'/progress',        emoji:'📊', label:'View Progress',    desc:'Track your career journey' },
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const [dashboard, setDashboard] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [d, u] = await Promise.all([progressAPI.getDashboard(), subscriptionAPI.getUsage()])
        setDashboard(d.data)
        setUsage(u.data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="animate-fadeUp" style={{ maxWidth:900 }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:13, color:'var(--stone)', marginBottom:4, letterSpacing:'0.03em' }}>{greeting} 👋</p>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:32, fontWeight:400, color:'var(--ink)', marginBottom:8 }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color:'var(--stone)', fontSize:14 }}>Here's your career progress at a glance.</p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div style={{ display:'flex', gap:16, marginBottom:28 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:100, background:'#fff', borderRadius:'var(--radius)', border:'1px solid var(--cream-200)', animation:'pulse 1.5s infinite' }} />)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:16, marginBottom:28 }} className="stagger">
          {[
            { label:'Resumes',    value: dashboard?.resumeCount ?? 0,    emoji:'📄', color:'var(--blue)' },
            { label:'ATS Checks', value: dashboard?.atsCheckCount ?? 0,  emoji:'🎯', color:'var(--green)' },
            { label:'Interviews', value: dashboard?.interviewCount ?? 0, emoji:'🎤', color:'var(--accent)' },
            { label:'Avg Score',  value: dashboard?.avgAtsScore ? `${Math.round(dashboard.avgAtsScore)}%` : '—', emoji:'⭐', color:'var(--gold)' },
          ].map(stat => (
            <Card key={stat.label} className="animate-fadeUp" style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:12, color:'var(--stone)', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }}>{stat.label}</p>
                  <p style={{ fontSize:28, fontWeight:600, color: stat.color, lineHeight:1 }}>{stat.value}</p>
                </div>
                <span style={{ fontSize:22, opacity:0.7 }}>{stat.emoji}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Usage bar */}
      {usage && (
        <Card style={{ marginBottom:28, padding:'20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>Today's Usage</h3>
              <p style={{ fontSize:12, color:'var(--stone)' }}>Free plan resets daily at midnight</p>
            </div>
            <Link to="/subscription">
              <Badge variant="accent">Upgrade to Pro ⭐</Badge>
            </Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:12 }}>
            {[
              { key:'atsChecks',    label:'ATS Checks',   max:3 },
              { key:'interviews',   label:'Interviews',   max:2 },
              { key:'jobMatches',   label:'Job Matches',  max:1 },
              { key:'coverLetters', label:'Cover Letters',max:1 },
            ].map(u => {
              const used = usage[u.key] ?? 0
              const pct = Math.min(100, (used/u.max)*100)
              const color = pct >= 100 ? 'var(--red)' : pct >= 66 ? 'var(--gold)' : 'var(--green)'
              return (
                <div key={u.key}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--stone)', marginBottom:4 }}>
                    <span style={{ fontWeight:500 }}>{u.label}</span>
                    <span style={{ color }}>{used}/{u.max}</span>
                  </div>
                  <div style={{ height:5, background:'var(--cream-200)', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div style={{ marginBottom:12 }}>
        <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400, color:'var(--ink)', marginBottom:16 }}>Quick Actions</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }} className="stagger">
          {quickActions.map(a => (
            <Link key={a.to} to={a.to}>
              <Card hover className="animate-fadeUp" style={{ padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'var(--cream-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {a.emoji}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', marginBottom:2 }}>{a.label}</div>
                  <div style={{ fontSize:12, color:'var(--stone)' }}>{a.desc}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent interviews */}
      {dashboard?.recentInterviews?.length > 0 && (
        <div style={{ marginTop:28 }}>
          <h2 style={{ fontFamily:'var(--font-serif)', fontSize:20, fontWeight:400, color:'var(--ink)', marginBottom:16 }}>Recent Interviews</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {dashboard.recentInterviews.slice(0,3).map(iv => (
              <Card key={iv._id} style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <ScoreRing score={iv.totalScore} size={44} strokeWidth={4} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{iv.role}</div>
                    <div style={{ fontSize:11, color:'var(--stone)', marginTop:1 }}>{iv.roundType} · {new Date(iv.completedAt || iv.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <Badge variant={iv.status==='completed' ? 'success' : 'warning'}>{iv.status}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
