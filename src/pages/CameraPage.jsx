import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { findNearestColor, rgbToHex, computeMatchScore } from '../utils/colorUtils'
import { playClick, playChime, playCaptureSound, playPerfectCaptureSound } from '../utils/audio'
import { SwitchCamera, Undo2, Redo2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

export default function CameraPage({ walkConfig, onEnd, onArchive }) {
  const { t } = useLanguage()
  const { themeGradient, mode, strictLevel } = walkConfig
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const smoothRef = useRef({ r: 128, g: 128, b: 128 })

  const [liveColor, setLiveColor] = useState({ r: 128, g: 128, b: 128, hex: '#808080', name: '' })
  const [captureState, setCaptureState] = useState('idle') // 'idle' | 'captured'
  const [collectedColors, setCollectedColors] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [lastCapture, setLastCapture] = useState(null) // {color + photoUrl}
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' | 'user'
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let stream = null
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        const name = err.name || ''
        let msg
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          msg = '请在系统设置中允许访问相机'
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          msg = '未找到可用摄像头'
        } else {
          msg = '相机启动失败，请刷新重试'
        }
        setError(msg)
      }
    }
    startCamera()
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [facingMode, t])

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const sample = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(sample)
      return
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Handle mirroring for front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    const cx = Math.floor(canvas.width / 2)
    const cy = Math.floor(canvas.height / 2)
    const region = 5, half = Math.floor(region / 2)
    const data = ctx.getImageData(cx - half, cy - half, region, region).data

    let sumR = 0, sumG = 0, sumB = 0
    const pixels = region * region
    for (let i = 0; i < pixels; i++) {
      sumR += data[i * 4]; sumG += data[i * 4 + 1]; sumB += data[i * 4 + 2]
    }
    const s = smoothRef.current
    s.r = lerp(s.r, Math.round(sumR / pixels), 0.15)
    s.g = lerp(s.g, Math.round(sumG / pixels), 0.15)
    s.b = lerp(s.b, Math.round(sumB / pixels), 0.15)
    setLiveColor({ r: s.r, g: s.g, b: s.b, hex: rgbToHex(s.r, s.g, s.b), name: findNearestColor(s.r, s.g, s.b) })
    rafRef.current = requestAnimationFrame(sample)
  }, [facingMode])

  const handleVideoPlay = useCallback(() => {
    rafRef.current = requestAnimationFrame(sample)
  }, [sample])

  // 截取当前帧（缩放至 480px 宽，控制体积）
  function captureFrame() {
    const video = videoRef.current
    const mainCanvas = canvasRef.current
    
    // 优先尝试从 video 截取
    if (video && video.readyState >= 2 && video.videoWidth && video.videoHeight) {
      const W = 480
      const H = Math.round(video.videoHeight * (W / video.videoWidth))
      const cap = document.createElement('canvas')
      cap.width = W; cap.height = H
      const ctx = cap.getContext('2d')
      if (facingMode === 'user') {
        ctx.translate(W, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, W, H)
      return cap.toDataURL('image/jpeg', 0.85)
    }
    
    // 如果 video 不可用，尝试从正在采样的 mainCanvas 截取
    if (mainCanvas && mainCanvas.width > 0) {
      const W = 480
      const H = Math.round(mainCanvas.height * (W / mainCanvas.width))
      const cap = document.createElement('canvas')
      cap.width = W; cap.height = H
      const ctx = cap.getContext('2d')
      ctx.drawImage(mainCanvas, 0, 0, W, H)
      return cap.toDataURL('image/jpeg', 0.85)
    }

    return null
  }

  async function handleCapture() {
    const matchScore = computeMatchScore({ r: smoothRef.current.r, g: smoothRef.current.g, b: smoothRef.current.b }, themeGradient)
    const threshold = strictLevel === 'ambient' ? 40 : strictLevel === 'hunter' ? 80 : 100
    const isPerfect = matchScore >= threshold;

    if (isPerfect) {
      playPerfectCaptureSound();
    } else {
      playCaptureSound();
    }

    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    
    const s = smoothRef.current
    const color = {
      r: s.r, g: s.g, b: s.b,
      hex: rgbToHex(s.r, s.g, s.b),
      name: findNearestColor(s.r, s.g, s.b),
    }
    
    let photoUrl = captureFrame()
    // 如果第一次抓取失败，延迟 50ms 再试一次
    if (!photoUrl) {
      await new Promise(r => setTimeout(r, 50))
      photoUrl = captureFrame()
    }
    
    const entry = { ...color, photoUrl, isPerfect }

    setLastCapture(entry)
    setCollectedColors((prev) => [...prev, entry])
    setRedoStack([])
    setCaptureState('captured')
  }

  function handleUndo() {
    if (collectedColors.length === 0) return
    const newCollected = [...collectedColors]
    const popped = newCollected.pop()
    setCollectedColors(newCollected)
    setRedoStack(prev => [...prev, popped])
    setCaptureState('idle')
  }

  function handleRedo() {
    if (redoStack.length === 0) return
    const newRedo = [...redoStack]
    const popped = newRedo.pop()
    setRedoStack(newRedo)
    setCollectedColors(prev => [...prev, popped])
    setLastCapture(popped)
    setCaptureState('captured')
  }

  function handleContinue() {
    setCaptureState('idle')
  }

  function handleFinish() {
    playClick();
    const score = strictLevel === 'precise' && collectedColors.length > 0
      ? computeMatchScore(collectedColors[collectedColors.length - 1], themeGradient)
      : null

    onEnd(collectedColors, score)
  }

  const displayColor = captureState === 'captured' && lastCapture ? lastCapture : liveColor
  const count = collectedColors.length

  const luminance = (0.299 * displayColor.r + 0.587 * displayColor.g + 0.114 * displayColor.b) / 255
  const textOnColor = luminance > 0.5 ? '#1A1714' : '#F5F0E8'

  const matchScore = computeMatchScore({ r: liveColor.r, g: liveColor.g, b: liveColor.b }, themeGradient)
  const threshold = strictLevel === 'ambient' ? 40 : strictLevel === 'hunter' ? 80 : 100
  const canCapture = matchScore >= threshold
  const highMatch = matchScore >= 80

  return (
    <div style={styles.root}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        onPlay={handleVideoPlay} 
        style={{
          ...styles.video,
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
        }} 
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: flash ? 0.8 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'white', pointerEvents: 'none', zIndex: 10 }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {error && (
        <div style={styles.errorBanner}>
          <div style={styles.errorIcon}>📷</div>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {/* 顶部操作栏 */}
      <div style={styles.topBar}>
        <div style={{
          ...styles.themeThumb,
          background: `linear-gradient(to right, ${themeGradient.start.hex}, ${themeGradient.end.hex})`,
        }} />
        <div style={{ flex: 1 }} />
        {collectedColors.length > 0 && (
          <motion.button 
            style={styles.iconBtn} 
            onClick={handleUndo}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Undo2 size={18} color="#1A1714" />
          </motion.button>
        )}
        {redoStack.length > 0 && (
          <motion.button 
            style={styles.iconBtn} 
            onClick={handleRedo}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Redo2 size={18} color="#1A1714" />
          </motion.button>
        )}
        {count > 0 && (
          <div style={styles.countBadge}>
            <span style={styles.countText}>{count}</span>
          </div>
        )}
        <motion.button 
          style={styles.iconBtn} 
          onClick={toggleCamera}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <SwitchCamera size={20} color="#1A1714" />
        </motion.button>
        <motion.button 
          style={styles.archiveBtn} 
          onClick={() => { onArchive(); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >{t('archive')}</motion.button>
      </div>

        {/* 准星区 */}
        <div style={styles.reticleWrap}>
          <div style={{ ...styles.scoreWrap, opacity: canCapture ? 1 : 0.5, backgroundColor: canCapture ? 'rgba(245,240,232,0.9)' : 'rgba(245,240,232,0.4)' }}>
            <span style={styles.scoreText}>{matchScore}% / {threshold}%</span>
          </div>
          <motion.div 
            animate={flash ? { scale: [1, 0.8, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              ...styles.reticle,
              borderColor: canCapture ? liveColor.hex : 'rgba(245,240,232,0.4)',
              boxShadow: canCapture
                ? `0 0 0 1.5px ${liveColor.hex}, 0 0 14px ${liveColor.hex}55`
                : `0 0 0 1px rgba(0,0,0,0.1), 0 0 0 2px rgba(245,240,232,0.3)`,
              transition: 'all 0.4s ease-in-out',
            }} 
          />
        </div>

      {/* 底部面板 */}
      <div style={{
        ...styles.panel,
        ...(captureState === 'captured' && count > 0 ? {
          backgroundColor: 'rgba(245,240,232,0.35)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
        } : {
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
        })
      }}>
        {/* 色值行 */}
        <div style={styles.colorRow}>
          <motion.div 
            animate={flash ? { scale: [1, 0.9, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              ...styles.swatch,
              backgroundColor: displayColor.hex,
              transition: 'background-color 0.4s ease-in-out',
            }}
          >
            <span style={{ ...styles.swatchName, color: textOnColor }}>{displayColor.name}</span>
          </motion.div>
          <div style={styles.info}>
            <span style={styles.hex}>{displayColor.hex}</span>
            <div style={styles.rgb}>
              <span>R <strong>{displayColor.r}</strong></span>
              <span>G <strong>{displayColor.g}</strong></span>
              <span>B <strong>{displayColor.b}</strong></span>
            </div>
          </div>
        </div>

        {/* 操作按钮行 */}
        <div style={styles.actionRow}>
          {captureState === 'idle' ? (
            <motion.button 
              style={{ 
                ...styles.btnCapture, 
                backgroundColor: canCapture ? '#FFD700' : '#1A1714',
                color: canCapture ? '#1A1714' : '#F5F0E8',
                boxShadow: canCapture ? '0 0 20px rgba(255,215,0,0.4)' : 'none',
                border: canCapture ? '2px solid #fff' : 'none'
              }} 
              onClick={handleCapture}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {canCapture ? t('perfectCapture') : t('capture')}
            </motion.button>
          ) : (
            <>
              <motion.button 
                style={styles.btnContinue} 
                onClick={handleContinue}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(26,23,20,0.05)' }}
                whileTap={{ scale: 0.98 }}
              >{t('continueHunt')}</motion.button>
              <motion.button 
                style={styles.btnFinish} 
                onClick={handleFinish}
                whileHover={{ scale: 1.02, backgroundColor: '#333' }}
                whileTap={{ scale: 0.98 }}
              >{t('finishWalk')}</motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    position: 'relative',
    width: '100dvw',
    height: '100dvh',
    overflow: 'hidden',
    backgroundColor: '#1A1714',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  errorBanner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(245,240,232,0.96)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 20,
    padding: '2rem 2rem 1.75rem',
    textAlign: 'center',
    maxWidth: '80%',
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 8px 32px rgba(26,23,20,0.18)',
  },
  errorIcon: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  errorText: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.95rem',
    color: '#1A1714',
    margin: 0,
    letterSpacing: '0.06em',
    lineHeight: 1.7,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    paddingTop: 'calc(1rem + env(safe-area-inset-top))',
  },
  themeThumb: {
    width: 44,
    height: 16,
    borderRadius: 4,
    flexShrink: 0,
  },
  countBadge: {
    backgroundColor: 'rgba(245,240,232,0.85)',
    borderRadius: 20,
    minWidth: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 0.5rem',
    backdropFilter: 'blur(8px)',
  },
  countText: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.85rem',
    color: '#1A1714',
  },
  iconBtn: {
    background: 'rgba(245,240,232,0.85)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  archiveBtn: {
    background: 'rgba(245,240,232,0.85)',
    border: 'none',
    borderRadius: 20,
    padding: '0.35rem 1rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: '#1A1714',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    backdropFilter: 'blur(8px)',
  },
  reticleWrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    pointerEvents: 'none',
  },
  scoreWrap: {
    backgroundColor: 'rgba(245,240,232,0.72)',
    borderRadius: 20,
    padding: '0.2rem 0.75rem',
    backdropFilter: 'blur(8px)',
  },
  scoreText: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.85rem',
    color: '#1A1714',
    letterSpacing: '0.08em',
  },
  reticle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid rgba(245,240,232,0.85)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(245,240,232,0.93)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRadius: '16px 16px 0 0',
    padding: '1rem 1.25rem',
    paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  swatch: {
    width: 60,
    height: 60,
    borderRadius: 10,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 5,
  },
  swatchName: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.72rem',
    letterSpacing: '0.05em',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1,
  },
  hex: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '1.15rem',
    color: '#1A1714',
    letterSpacing: '0.08em',
  },
  rgb: {
    display: 'flex',
    gap: '0.75rem',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.72rem',
    color: '#7A6A5A',
  },
  actionRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  btnCapture: {
    flex: 1,
    backgroundColor: '#1A1714',
    color: '#F5F0E8',
    border: 'none',
    borderRadius: 12,
    padding: '0.75rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    letterSpacing: '0.12em',
    cursor: 'pointer',
  },
  btnContinue: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#1A1714',
    border: '1px solid rgba(26,23,20,0.25)',
    borderRadius: 12,
    padding: '0.75rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.875rem',
    letterSpacing: '0.06em',
    cursor: 'pointer',
  },
  btnFinish: {
    flex: 1,
    backgroundColor: '#1A1714',
    color: '#F5F0E8',
    border: 'none',
    borderRadius: 12,
    padding: '0.75rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.875rem',
    letterSpacing: '0.06em',
    cursor: 'pointer',
  },
}
