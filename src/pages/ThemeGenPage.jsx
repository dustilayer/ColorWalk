import { useState, useEffect, useRef, useCallback } from 'react'
import { generateTheme, getSeason, getChineseDate, SEASON_LABELS } from '../utils/seasonColors'
import { findNearestColor, hexToRgb } from '../utils/colorUtils'

// 根据渐变两端均值亮度决定叠加文字颜色
function textColors(startHex, endHex) {
  const s = hexToRgb(startHex), e = hexToRgb(endHex)
  const lum = (0.299 * (s.r + e.r) / 2 + 0.587 * (s.g + e.g) / 2 + 0.114 * (s.b + e.b) / 2) / 255
  return lum > 0.58
    ? { main: 'rgba(26,23,20,0.9)',   sub: 'rgba(26,23,20,0.55)'  }
    : { main: 'rgba(245,240,232,0.95)', sub: 'rgba(245,240,232,0.6)' }
}

function ColorSwatch({ hex, onChange, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      <label style={{ position: 'relative', cursor: 'pointer' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 10,
          backgroundColor: hex,
          border: '1.5px solid rgba(255,255,255,0.5)',
        }} />
        <input
          type="color" value={hex} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer', padding: 0, border: 'none' }}
        />
      </label>
      <span style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  )
}

export default function ThemeGenPage({ onNext }) {
  const season = getSeason()
  const [theme, setTheme]     = useState(() => generateTheme(season))
  const [customOpen, setCustomOpen] = useState(false)
  const [customStart, setCustomStart] = useState(theme.start.hex)
  const [customEnd,   setCustomEnd]   = useState(theme.end.hex)

  const canvasRef  = useRef(null)
  const ripplesRef = useRef([])   // [{x,y,maxR,startTime,duration,alpha}]
  const rafRef     = useRef(null)

  // ── Canvas 涟漪动画 ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function loop() {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const now = Date.now()

      ripplesRef.current = ripplesRef.current.filter(r => {
        const t = (now - r.startTime) / r.duration
        if (t >= 1) return false
        const radius = r.maxRadius * t
        const alpha  = r.alpha * (1 - t)
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
        ctx.lineWidth = 1.5
        ctx.stroke()
        return true
      })

      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // 每次点击/触摸添加两圈涟漪（错开 100ms，像水波）
  function spawnRipple(x, y) {
    const maxR = Math.max(window.innerWidth, window.innerHeight) * 0.55
    const now = Date.now()
    ripplesRef.current.push({ x, y, maxRadius: maxR,       startTime: now,       duration: 1200, alpha: 0.48 })
    setTimeout(() =>
      ripplesRef.current.push({ x, y, maxRadius: maxR * 0.6, startTime: Date.now(), duration: 900,  alpha: 0.28 })
    , 110)
  }

  const handlePointerDown = useCallback((e) => {
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    spawnRipple(x, y)
  }, [])

  // ── 数据 ───────────────────────────────────────────────────────
  function hexToName(hex) {
    const { r, g, b } = hexToRgb(hex)
    return findNearestColor(r, g, b)
  }

  const displayTheme = customOpen
    ? { start: { hex: customStart, name: hexToName(customStart) },
        end:   { hex: customEnd,   name: hexToName(customEnd)   } }
    : theme

  function handleRegenerate(e) {
    e.stopPropagation()
    const next = generateTheme(season)
    setTheme(next)
    setCustomStart(next.start.hex)
    setCustomEnd(next.end.hex)
    setCustomOpen(false)
  }

  const tc = textColors(displayTheme.start.hex, displayTheme.end.hex)

  return (
    // 全屏渐变背景，background-position 动画产生流动感
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: `linear-gradient(135deg, ${displayTheme.start.hex}, ${displayTheme.end.hex}, ${displayTheme.start.hex})`,
        backgroundSize: '300% 300%',
        animation: 'gradientFlow 8s ease-in-out infinite',
        overflow: 'hidden',
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      {/* Canvas：涟漪层，pointer-events:none 让点击穿透 */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      {/* 左上角文字叠加 */}
      <div style={{
        position: 'absolute',
        top: 'calc(3.5rem + env(safe-area-inset-top))',
        left: '1.75rem',
        pointerEvents: 'none',
        zIndex: 1,
      }}>
        <p style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.78rem', color: tc.sub, margin: 0, letterSpacing: '0.22em' }}>
          {SEASON_LABELS[season]}
        </p>
        <h1 style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '2rem', fontWeight: 400, color: tc.main, margin: '0.35rem 0 0', letterSpacing: '0.05em' }}>
          今日主题色
        </h1>
        <p style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.8rem', color: tc.sub, margin: '0.4rem 0 0', letterSpacing: '0.1em' }}>
          {getChineseDate()}
        </p>
      </div>

      {/* 底部浮层 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          zIndex: 2,
          backgroundColor: 'rgba(0,0,0,0.22)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '1rem 1.5rem',
          paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))',
        }}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      >
        {/* 自定义色带（展开） */}
        {customOpen && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1rem', marginBottom: '0.875rem' }}>
            <p style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.875rem', textAlign: 'center', letterSpacing: '0.05em' }}>
              点击色块选择颜色
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
              <ColorSwatch hex={customStart} onChange={setCustomStart} label={hexToName(customStart)} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem' }}>→</span>
              <ColorSwatch hex={customEnd}   onChange={setCustomEnd}   label={hexToName(customEnd)}   />
            </div>
          </div>
        )}

        {/* 色名行：左下 / 右下 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={s.colorName}>{displayTheme.start.name}</span>
          <span style={s.colorName}>{displayTheme.end.name}</span>
        </div>

        {/* 操作文字链接 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.875rem' }}>
          <button style={s.btnLink} onClick={handleRegenerate}>重新生成</button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>·</span>
          <button style={s.btnLink} onClick={e => { e.stopPropagation(); setCustomOpen(v => !v) }}>
            {customOpen ? '收起' : '自定义色带'}
          </button>
        </div>

        {/* 开始漫步：半透明白色 */}
        <button
          style={s.btnStart}
          onClick={e => { e.stopPropagation(); onNext(displayTheme) }}
        >
          开始漫步
        </button>
      </div>
    </div>
  )
}

const s = {
  colorName: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: '0.1em',
  },
  btnLink: {
    background: 'none',
    border: 'none',
    padding: '0.2rem 0',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    textDecorationColor: 'rgba(255,255,255,0.35)',
  },
  btnStart: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.88)',
    color: '#1A1714',
    border: 'none',
    borderRadius: 16,
    padding: '1rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
}
