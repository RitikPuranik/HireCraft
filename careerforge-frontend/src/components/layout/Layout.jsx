import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',     emoji: '🏠' },
  { to: '/resumes',       label: 'Resumes',        emoji: '📄' },
  { to: '/ats',           label: 'ATS Checker',    emoji: '🎯' },
  { to: '/interview',     label: 'Mock Interview', emoji: '🎤' },
  { to: '/jobmatch',      label: 'Job Match',      emoji: '🔍' },
  { to: '/coverletter',   label: 'Cover Letter',   emoji: '✉️' },
  { to: '/progress',      label: 'Progress',       emoji: '📊' },
  { to: '/subscription',  label: 'Plans',          emoji: '⭐' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--cream)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240, flexShrink:0,
        background: '#fff', borderRight: '1px solid var(--cream-200)',
        display:'flex', flexDirection:'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'sticky', top:0, height:'100vh', overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed?'20px 12px':'20px 20px', borderBottom:'1px solid var(--cream-200)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, background:'var(--accent)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            fontSize:16,
          }}>⚡</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily:'var(--font-serif)', fontSize:16, fontWeight:400, color:'var(--ink)' }}>CareerForge</div>
              <div style={{ fontSize:10, color:'var(--stone)', letterSpacing:'0.05em', textTransform:'uppercase' }}>AI Platform</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding: collapsed ? '10px 12px' : '10px 12px',
              borderRadius: 'var(--radius-sm)', fontSize:13, fontWeight:500,
              color: isActive ? 'var(--accent-dark)' : 'var(--stone-dark)',
              background: isActive ? 'var(--accent-pale)' : 'transparent',
              transition:'all 0.15s', justifyContent: collapsed?'center':'flex-start',
            })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background='var(--cream-100)' }}
            onMouseLeave={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background='transparent' }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.emoji}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + collapse */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--cream-200)' }}>
          <NavLink to="/profile" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px', borderRadius:'var(--radius-sm)', justifyContent: collapsed?'center':'flex-start' }}>
            <div style={{
              width:32, height:32, borderRadius:8, background:'var(--accent-pale)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              fontSize:13, fontWeight:600, color:'var(--accent-dark)',
            }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'var(--stone)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
              </div>
            )}
          </NavLink>

          <button onClick={() => setCollapsed(v => !v)} style={{
            width:'100%', marginTop:4, padding:'6px', border:'none',
            background:'none', color:'var(--stone)', fontSize:12, cursor:'pointer',
            borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent: collapsed?'center':'flex-start', gap:6,
          }}>
            <span style={{ fontSize:14 }}>{collapsed ? '→' : '←'}</span>
            {!collapsed && 'Collapse'}
          </button>

          <button onClick={handleLogout} style={{
            width:'100%', marginTop:2, padding:'6px 12px', border:'none',
            background:'none', color:'var(--red)', fontSize:12, cursor:'pointer',
            borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent: collapsed?'center':'flex-start', gap:6,
          }}>
            <span>🚪</span>
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, minWidth:0, padding:'32px', overflowX:'hidden' }}>
        {children}
      </main>
    </div>
  )
}
