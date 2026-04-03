import React, { useEffect, useState } from 'react'
import { progressAPI, subscriptionAPI } from '../../api/services'
import { Card, Badge, ScoreRing, Button, ProgressBar, Spinner } from '../../components/ui/index.jsx'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'

// ─── Progress Page ────────────────────────────────────────────────────────────
export function ProgressPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    progressAPI.getDashboard().then(r => setData(r.data)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  const radarData = data ? [
    { subject:'Resumes', A: Math.min(100, (data.resumeCount||0)*25) },
    { subject:'ATS',     A: Math.min(100, data.avgAtsScore||0) },
    { subject:'Interviews', A: Math.min(100, (data.interviewCount||0)*20) },
    { subject:'Job Matches', A: Math.min(100, (data.jobMatchCount||0)*25) },
    { subject:'Cover Letters', A: Math.min(100, (data.coverLetterCount||0)*25) },
  ] : []

  return (
    <div className="animate-fadeUp" style={{ maxWidth:900 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>Progress Tracker</h1>
        <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>Your career preparation journey at a glance</p>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:14, marginBottom:24 }} className="stagger">
        {[
          { label:'Resumes Built',    value:data?.resumeCount||0,       color:'var(--blue)',   emoji:'📄' },
          { label:'ATS Analyses',     value:data?.atsCheckCount||0,     color:'var(--green)',  emoji:'🎯' },
          { label:'Mock Interviews',  value:data?.interviewCount||0,    color:'var(--accent)', emoji:'🎤' },
          { label:'Job Matches',      value:data?.jobMatchCount||0,     color:'var(--gold)',   emoji:'🔍' },
          { label:'Cover Letters',    value:data?.coverLetterCount||0,  color:'var(--blue)',   emoji:'✉️' },
        ].map(s => (
          <Card key={s.label} className="animate-fadeUp" style={{ padding:'16px 20px', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.emoji}</div>
            <div style={{ fontSize:26, fontWeight:700, color:s.color, lineHeight:1, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--stone)', fontWeight:500 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Radar */}
        <Card>
          <h3 style={{ fontFamily:'var(--font-serif)', fontSize:17, fontWeight:400, marginBottom:16 }}>Activity Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--cream-200)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:11, fill:'var(--stone)' }} />
              <Radar name="Activity" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Avg scores */}
        <Card>
          <h3 style={{ fontFamily:'var(--font-serif)', fontSize:17, fontWeight:400, marginBottom:16 }}>Average Scores</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { label:'ATS Score',       score:data?.avgAtsScore,       color:'var(--green)' },
              { label:'Interview Score', score:data?.avgInterviewScore, color:'var(--accent)' },
              { label:'Job Match Score', score:data?.avgMatchScore,     color:'var(--blue)' },
            ].map(s => s.score != null && (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:16 }}>
                <ScoreRing score={Math.round(s.score)} size={48} strokeWidth={4} />
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>{s.label}</div>
                  <div style={{ fontSize:12, color:'var(--stone)' }}>Average across all sessions</div>
                </div>
              </div>
            ))}
            {!data?.avgAtsScore && !data?.avgInterviewScore && (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--stone)', fontSize:13 }}>
                Complete activities to see your scores here
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      {data?.recentInterviews?.length > 0 && (
        <Card>
          <h3 style={{ fontFamily:'var(--font-serif)', fontSize:17, fontWeight:400, marginBottom:16 }}>Recent Sessions</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.recentInterviews.map(iv => (
              <div key={iv._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 0', borderBottom:'1px solid var(--cream-200)' }}>
                <ScoreRing score={iv.totalScore} size={40} strokeWidth={4} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{iv.role}</div>
                  <div style={{ fontSize:11, color:'var(--stone)' }}>{iv.roundType} interview · {new Date(iv.createdAt).toLocaleDateString()}</div>
                </div>
                <Badge variant={iv.status==='completed'?'success':'warning'}>{iv.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Subscription Page ────────────────────────────────────────────────────────
export function SubscriptionPage() {
  const [plans, setPlans] = useState({})
  const [sub, setSub] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  const loadData = async () => {
    try {
      const [p, s, u] = await Promise.all([subscriptionAPI.getPlans(), subscriptionAPI.getMySubscription(), subscriptionAPI.getUsage()])
      setPlans(p.data||{})
      setSub(s.data)
      setUsage(u.data)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { loadData() }, [])

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const orderRes = await subscriptionAPI.createOrder()
      const order = orderRes.data
      if (typeof window.Razorpay === 'undefined') {
        toast.error('Razorpay not loaded. Add <script src="https://checkout.razorpay.com/v1/checkout.js"></script>')
        setUpgrading(false); return
      }
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CareerForge Pro',
        description: 'Monthly Pro Subscription',
        order_id: order.id,
        handler: async (response) => {
          try {
            await subscriptionAPI.verifyPayment({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature })
            toast.success('🎉 Upgraded to Pro!'); loadData()
          } catch (err) { toast.error('Payment verification failed') }
        },
        theme: { color: '#C17B3F' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) { toast.error(err.message) }
    setUpgrading(false)
  }

  const handleCancel = async () => {
    if (!confirm('Cancel your Pro subscription?')) return
    try { await subscriptionAPI.cancel(); toast.success('Subscription cancelled'); loadData() } catch (err) { toast.error(err.message) }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>

  const isPro = sub?.plan === 'pro'

  return (
    <div className="animate-fadeUp" style={{ maxWidth:760 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:28, fontWeight:400 }}>Plans & Subscription</h1>
        <p style={{ color:'var(--stone)', fontSize:13, marginTop:4 }}>
          Current plan: <strong style={{ color: isPro ? 'var(--gold)' : 'var(--ink)' }}>{isPro ? '⭐ Pro' : 'Free'}</strong>
          {isPro && sub?.expiresAt && ` · Renews ${new Date(sub.expiresAt).toLocaleDateString()}`}
        </p>
      </div>

      {/* Plan cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        {/* Free */}
        <Card style={{ padding:28, border: !isPro ? '2px solid var(--accent)' : '1px solid var(--cream-200)' }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:24, marginBottom:8 }}>🆓</div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:400, marginBottom:4 }}>Free</h2>
            <div style={{ fontSize:28, fontWeight:700, color:'var(--ink)' }}>₹0<span style={{ fontSize:14, fontWeight:400, color:'var(--stone)' }}>/mo</span></div>
          </div>
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
            {(plans.free?.features||['1 resume','3 ATS checks/day','2 mock interviews/day','1 job match/day','1 cover letter/day']).map((f,i) => (
              <li key={i} style={{ fontSize:13, color:'var(--stone-dark)', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ color:'var(--green)', fontWeight:600 }}>✓</span>{f}
              </li>
            ))}
          </ul>
          {!isPro && <Badge variant="accent" style={{ width:'100%', justifyContent:'center', padding:'8px' }}>Current Plan</Badge>}
        </Card>

        {/* Pro */}
        <Card style={{ padding:28, background:'linear-gradient(135deg, #1A1915 0%, #3D3B35 100%)', border:'none', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(193,123,63,0.15)' }} />
          <div style={{ marginBottom:20, position:'relative' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>⭐</div>
            <h2 style={{ fontFamily:'var(--font-serif)', fontSize:22, fontWeight:400, marginBottom:4, color:'#fff' }}>Pro</h2>
            <div style={{ fontSize:28, fontWeight:700, color:'var(--accent-light)' }}>₹999<span style={{ fontSize:14, fontWeight:400, color:'rgba(255,255,255,0.5)' }}>/mo</span></div>
          </div>
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, marginBottom:20, position:'relative' }}>
            {(plans.pro?.features||['Unlimited resumes','Unlimited ATS checks','Unlimited mock interviews','Unlimited job matches','Unlimited cover letters','PDF downloads','Interview analytics','Progress tracking']).map((f,i) => (
              <li key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ color:'var(--accent-light)', fontWeight:600 }}>✓</span>{f}
              </li>
            ))}
          </ul>
          <div style={{ position:'relative' }}>
            {isPro ? (
              <div>
                <div style={{ padding:'8px 16px', background:'rgba(193,123,63,0.2)', borderRadius:'var(--radius-sm)', color:'var(--accent-light)', fontSize:13, fontWeight:600, textAlign:'center', marginBottom:8 }}>Active ✓</div>
                <button onClick={handleCancel} style={{ width:'100%', padding:'6px', background:'none', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.5)', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:12 }}>Cancel subscription</button>
              </div>
            ) : (
              <button onClick={handleUpgrade} disabled={upgrading} style={{
                width:'100%', padding:'12px', background:'var(--accent)', border:'none',
                borderRadius:'var(--radius-sm)', color:'#fff', fontWeight:600, fontSize:14,
                cursor:'pointer', transition:'all 0.2s',
              }}>
                {upgrading ? 'Processing...' : 'Upgrade to Pro →'}
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Usage */}
      {usage && (
        <Card>
          <h3 style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:400, marginBottom:16 }}>Today's Usage</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { key:'atsChecks',    label:'ATS Checks',    max: isPro?'∞':3 },
              { key:'interviews',   label:'Interviews',    max: isPro?'∞':2 },
              { key:'jobMatches',   label:'Job Matches',   max: isPro?'∞':1 },
              { key:'coverLetters', label:'Cover Letters', max: isPro?'∞':1 },
            ].map(u => {
              const used = usage[u.key] ?? 0
              const max = isPro ? Infinity : u.max
              const pct = isPro ? 0 : Math.min(100, (used/max)*100)
              const color = pct >= 100 ? 'var(--red)' : pct >= 66 ? 'var(--gold)' : 'var(--green)'
              return (
                <div key={u.key}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                    <span style={{ color:'var(--stone-dark)', fontWeight:500 }}>{u.label}</span>
                    <span style={{ color, fontWeight:600 }}>{used} / {isPro ? '∞' : u.max}</span>
                  </div>
                  {!isPro && (
                    <div style={{ height:5, background:'var(--cream-200)', borderRadius:3 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.6s ease' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
