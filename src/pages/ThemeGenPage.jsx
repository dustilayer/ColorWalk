import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { generateTheme, getSeason, getChineseDate, SEASON_LABELS, generateMonochromatic } from '../utils/seasonColors'
import { findNearestColor, hexToRgb } from '../utils/colorUtils'
import { playClick, playChime } from '../utils/audio'
import { HexColorPicker } from 'react-colorful'
import { Settings, X, BookOpen, Trophy, Volume2, VolumeX } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

// 根据渐变两端均值亮度决定叠加文字颜色
function textColors(startHex, endHex) {
  const s = hexToRgb(startHex), e = hexToRgb(endHex)
  const lum = (0.299 * (s.r + e.r) / 2 + 0.587 * (s.g + e.g) / 2 + 0.114 * (s.b + e.b) / 2) / 255
  return lum > 0.58
    ? { main: 'rgba(26,23,20,0.9)',   sub: 'rgba(26,23,20,0.55)'  }
    : { main: 'rgba(245,240,232,0.95)', sub: 'rgba(245,240,232,0.6)' }
}

function ColorSwatch({ hex, onChange, label, isRight }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    const handleOutside = (e) => {
      // 如果点击的是按钮本身，让按钮自己的 onClick 处理切换逻辑
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [showPicker]);

  return (
    <div style={{ position: 'relative' }}>
      <motion.div 
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button 
          ref={buttonRef}
          onClick={() => setShowPicker(!showPicker)}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            backgroundColor: hex,
            border: '2.5px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            padding: 0,
          }} 
        />
        <span style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </motion.div>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: '110%',
              left: isRight ? 'auto' : '50%',
              right: isRight ? -20 : 'auto',
              transform: isRight ? 'none' : 'translateX(-50%)',
              backgroundColor: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(12px)',
              borderRadius: 24,
              padding: '1rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              zIndex: 100,
              width: 200,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} color="#7A6A5A" />
              </button>
            </div>

            <div className="custom-picker">
              <HexColorPicker color={hex} onChange={onChange} style={{ width: '100%', height: 160 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ThemeGenPage({ onNext, onOpenSettings, onOpenArchive, onOpenAchievements, bgmMuted, onToggleBgm }) {
  const { t } = useLanguage()
  const season = getSeason()
  const [theme, setTheme]     = useState(() => generateTheme(season))
  const [customOpen, setCustomOpen] = useState(false)
  const [customStart, setCustomStart] = useState(theme.start.hex)
  const [customEnd,   setCustomEnd]   = useState(theme.end.hex)
  const [bgAngle] = useState(() => Math.floor(Math.random() * 360))

  const canvasRef  = useRef(null)
  const ripplesRef = useRef([])   // [{x,y,maxR,startTime,duration,alpha}]
  const rafRef     = useRef(null)

  const handleStartChange = (hex) => {
    setCustomStart(hex)
    const mono = generateMonochromatic(hex, true)
    setCustomEnd(mono.hex)
    playChime(400 + Math.random() * 400)
  }

  const handleEndChange = (hex) => {
    setCustomEnd(hex)
    const mono = generateMonochromatic(hex, false)
    setCustomStart(mono.hex)
    playChime(400 + Math.random() * 400)
  }

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
    <div
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      {/* 全屏渐变背景，background-position 动画产生流动感 */}
      <div
        style={{
          position: 'absolute',
          inset: -200, // 扩大范围防止旋转时露边
          backgroundImage: `linear-gradient(${bgAngle}deg, ${displayTheme.start.hex}, ${displayTheme.end.hex}, ${displayTheme.start.hex})`,
          backgroundSize: '300% 300%',
          animation: 'gradientFlow 30s ease-in-out infinite, rotateBg 45s linear infinite',
          filter: 'blur(60px)',
          zIndex: -1,
        }}
      />
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
          {t('season' + season.charAt(0).toUpperCase() + season.slice(1)) || SEASON_LABELS[season]}
        </p>
        <h1 style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '2rem', fontWeight: 400, color: tc.main, margin: '0.35rem 0 0', letterSpacing: '0.05em' }}>
          {t('todayTheme')}
        </h1>
        <p style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.8rem', color: tc.sub, margin: '0.4rem 0 0', letterSpacing: '0.1em' }}>
          {getChineseDate()}
        </p>
      </div>

      {/* 右上角图标列 */}
      <div style={{
        position: 'absolute',
        top: 'calc(3.5rem + env(safe-area-inset-top))',
        right: '1.5rem',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}>
        {[
          { icon: <Settings size={20} color={tc.main} />, action: onOpenSettings },
          { icon: <BookOpen size={20} color={tc.main} />, action: onOpenArchive },
          { icon: <Trophy   size={20} color={tc.main} />, action: onOpenAchievements },
          { icon: bgmMuted ? <VolumeX size={20} color={tc.main} /> : <Volume2 size={20} color={tc.main} />, action: onToggleBgm },
        ].map(({ icon, action }, i) => (
          <motion.button
            key={i}
            style={{
              background: 'rgba(0,0,0,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { e.stopPropagation(); action?.() }}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.25)' }}
            whileTap={{ scale: 0.9 }}
          >
            {icon}
          </motion.button>
        ))}
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
              {t('selectColor')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
              <ColorSwatch hex={customStart} onChange={handleStartChange} label={hexToName(customStart)} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '1.1rem' }}>→</span>
              <ColorSwatch hex={customEnd}   onChange={handleEndChange}   label={hexToName(customEnd)} isRight />
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
          <motion.button 
            style={s.btnLink} 
            onClick={(e) => { handleRegenerate(e); playClick(); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >{t('regen')}</motion.button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>·</span>
          <motion.button 
            style={s.btnLink} 
            onClick={e => { e.stopPropagation(); setCustomOpen(v => !v); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {customOpen ? t('collapse') : t('customGradient')}
          </motion.button>
        </div>

        {/* 开始漫步：半透明白色 */}
        <motion.button
          style={s.btnStart}
          onClick={e => { e.stopPropagation(); onNext(displayTheme); playClick(); }}
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.95)' }}
          whileTap={{ scale: 0.98 }}
        >
          {t('startWalk')}
        </motion.button>
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
