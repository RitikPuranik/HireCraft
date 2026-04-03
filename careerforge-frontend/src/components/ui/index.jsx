import React from 'react'

// ─── Button ───────────────────────────────────────────────────────────────────
const btnStyles = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontWeight: 500, borderRadius: '10px', transition: 'all 0.2s',
    border: 'none', outline: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  sm:  { padding: '7px 14px', fontSize: '13px' },
  md:  { padding: '10px 20px', fontSize: '14px' },
  lg:  { padding: '14px 28px', fontSize: '15px' },
  primary: {
    background: 'var(--accent)', color: '#fff',
    boxShadow: '0 2px 8px rgba(193,123,63,0.25)',
  },
  secondary: {
    background: 'var(--cream-100)', color: 'var(--ink)',
    border: '1px solid var(--cream-300)',
  },
  ghost: {
    background: 'transparent', color: 'var(--stone-dark)',
    border: '1px solid var(--cream-200)',
  },
  danger: {
    background: 'var(--red-pale)', color: 'var(--red)',
    border: '1px solid rgba(181,70,58,0.2)',
  },
}

export const Button = ({ children, variant='primary', size='md', loading, disabled, style, onClick, type='button', ...props }) => {
  const base = { ...btnStyles.base, ...btnStyles[size], ...btnStyles[variant] }
  const hoverMap = {
    primary: 'var(--accent-dark)', secondary: 'var(--cream-200)',
    ghost: 'var(--cream-100)', danger: 'rgba(181,70,58,0.15)',
  }
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ ...base, opacity: (disabled || loading) ? 0.6 : 1, style }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.background = hoverMap[variant] || '' }}
      onMouseLeave={e => { e.currentTarget.style.background = btnStyles[variant].background || '' }}
      {...props}
    >
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20, color = 'var(--accent)' }) => (
  <div style={{
    width: size, height: size, border: `2px solid rgba(0,0,0,0.08)`,
    borderTop: `2px solid ${color}`, borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', flexShrink: 0,
  }} />
)

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, hover, className, onClick }) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background: '#fff', borderRadius: 'var(--radius)',
      border: '1px solid var(--cream-200)',
      boxShadow: 'var(--shadow-sm)', padding: '24px',
      transition: 'all 0.2s',
      cursor: onClick || hover ? 'pointer' : 'default',
      ...style,
    }}
    onMouseEnter={e => { if (hover || onClick) { e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.transform='translateY(-2px)' } }}
    onMouseLeave={e => { if (hover || onClick) { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(0)' } }}
  >
    {children}
  </div>
)

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, icon, style, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--stone-dark)' }}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {icon && (
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--stone)', pointerEvents: 'none' }}>
          {icon}
        </div>
      )}
      <input
        {...props}
        style={{
          width: '100%', padding: icon ? '10px 12px 10px 40px' : '10px 14px',
          borderRadius: 'var(--radius-sm)', border: `1px solid ${error ? 'var(--red)' : 'var(--cream-300)'}`,
          background: '#fff', fontSize: 14, color: 'var(--ink)',
          outline: 'none', transition: 'border 0.2s',
          ...style,
        }}
        onFocus={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--accent)'; e.target.style.boxShadow = `0 0 0 3px ${error ? 'rgba(181,70,58,0.1)' : 'rgba(193,123,63,0.1)'}` }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--cream-300)'; e.target.style.boxShadow = 'none' }}
      />
    </div>
    {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
  </div>
)

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = ({ label, error, rows=4, style, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--stone-dark)' }}>{label}</label>}
    <textarea
      rows={rows}
      {...props}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${error ? 'var(--red)' : 'var(--cream-300)'}`,
        background: '#fff', fontSize: 14, color: 'var(--ink)',
        outline: 'none', resize: 'vertical', transition: 'border 0.2s',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px rgba(193,123,63,0.1)' }}
      onBlur={e => { e.target.style.borderColor=error?'var(--red)':'var(--cream-300)'; e.target.style.boxShadow='none' }}
    />
    {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
  </div>
)

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = ({ label, error, options=[], style, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--stone-dark)' }}>{label}</label>}
    <select
      {...props}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${error ? 'var(--red)' : 'var(--cream-300)'}`,
        background: '#fff', fontSize: 14, color: 'var(--ink)',
        outline: 'none', cursor: 'pointer', ...style,
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
  </div>
)

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeColors = {
  default: { bg: 'var(--cream-200)', color: 'var(--stone-dark)' },
  success: { bg: 'var(--green-pale)', color: 'var(--green)' },
  warning: { bg: 'var(--gold-pale)', color: 'var(--gold)' },
  danger:  { bg: 'var(--red-pale)', color: 'var(--red)' },
  info:    { bg: 'var(--blue-pale)', color: 'var(--blue)' },
  accent:  { bg: 'var(--accent-pale)', color: 'var(--accent-dark)' },
}
export const Badge = ({ children, variant='default', style }) => {
  const c = badgeColors[variant] || badgeColors.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: '20px', fontSize: 12, fontWeight: 500,
      background: c.bg, color: c.color, ...style,
    }}>
      {children}
    </span>
  )
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
export const ScoreRing = ({ score, size = 80, strokeWidth = 6 }) => {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const fill = ((score || 0) / 100) * circ
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--gold)' : 'var(--red)'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--cream-200)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={circ - fill}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px`, fontFamily: 'var(--font-sans)', fontSize: size < 60 ? 12 : 16, fontWeight: 600, fill: color }}>
        {score ?? '—'}
      </text>
    </svg>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, marginBottom: 8, color: 'var(--ink)' }}>{title}</h3>
    <p style={{ color: 'var(--stone)', fontSize: 14, marginBottom: 24 }}>{description}</p>
    {action}
  </div>
)

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 500 }) => {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(26,25,21,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)', maxWidth,
        width: '100%', maxHeight: '90vh', overflow: 'auto',
        boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.25s ease both',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cream-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--stone)', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max=100, color='var(--accent)', label }) => {
  const pct = Math.min(100, ((value/max)*100))
  return (
    <div>
      {label && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--stone)', marginBottom:4 }}>
        <span>{label}</span><span>{value}/{max}</span>
      </div>}
      <div style={{ height:6, background:'var(--cream-200)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background: color, borderRadius:4, transition:'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:4, background:'var(--cream-100)', padding:4, borderRadius:'var(--radius-sm)' }}>
    {tabs.map(t => (
      <button key={t.value} onClick={() => onChange(t.value)} style={{
        flex:1, padding:'7px 14px', fontSize:13, fontWeight:500, border:'none',
        borderRadius:'var(--radius-sm)', transition:'all 0.2s', cursor:'pointer',
        background: active===t.value ? '#fff' : 'transparent',
        color: active===t.value ? 'var(--ink)' : 'var(--stone)',
        boxShadow: active===t.value ? 'var(--shadow-sm)' : 'none',
      }}>
        {t.label}
      </button>
    ))}
  </div>
)

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────
export const Chip = ({ children, onRemove }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:4,
    padding:'4px 10px', background:'var(--cream-100)',
    border:'1px solid var(--cream-300)', borderRadius:20, fontSize:12, fontWeight:500,
  }}>
    {children}
    {onRemove && <button onClick={onRemove} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--stone)',lineHeight:1,fontSize:14,padding:0 }}>×</button>}
  </span>
)

// ─── Loading skeleton ─────────────────────────────────────────────────────────
export const Skeleton = ({ w='100%', h=16, radius=6 }) => (
  <div style={{
    width:w, height:h, borderRadius:radius,
    background: 'linear-gradient(90deg, var(--cream-200) 25%, var(--cream-100) 50%, var(--cream-200) 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
  }} />
)
