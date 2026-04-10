import { useEffect, useRef, useState, useCallback } from 'react'
import { findNearestColor, rgbToHex, computeMatchScore } from '../utils/colorUtils'

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

export default function CameraPage({ walkConfig, onEnd, onArchive }) {
  const { themeGradient, mode, strictLevel } = walkConfig
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const smoothRef = useRef({ r: 128, g: 128, b: 128 })

  const [liveColor, setLiveColor] = useState({ r: 128, g: 128, b: 128, hex: '#808080', name: '银灰' })
  const [captureState, setCaptureState] = useState('idle') // 'idle' | 'captured'
  const [collectedColors, setCollectedColors] = useState([])
  const [lastCapture, setLastCapture] = useState(null) // {color + photoUrl}
  const [error, setError] = useState(null)

  useEffect(() => {
    let stream = null
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        setError('无法访问摄像头，请检查浏览器权限设置。')
        console.error(err)
      }
    }
    startCamera()
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

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
  }, [])

  const handleVideoPlay = useCallback(() => {
    rafRef.current = requestAnimationFrame(sample)
  }, [sample])

  // 截取当前帧（缩放至 480px 宽，控制体积）
  function captureFrame() {
    const video = videoRef.current
    if (!video || video.readyState < 2) return null
    const W = 480
    const H = Math.round(video.videoHeight * (W / video.videoWidth))
    const cap = document.createElement('canvas')
    cap.width = W; cap.height = H
    cap.getContext('2d').drawImage(video, 0, 0, W, H)
    return cap.toDataURL('image/jpeg', 0.82)
  }

  function handleCapture() {
    const s = smoothRef.current
    const color = {
      r: s.r, g: s.g, b: s.b,
      hex: rgbToHex(s.r, s.g, s.b),
      name: findNearestColor(s.r, s.g, s.b),
    }
    const photoUrl = captureFrame()
    const entry = { ...color, photoUrl }

    setLastCapture(entry)
    setCollectedColors((prev) => [...prev, entry]) // 始终追加，继续捕猎不会丢失旧照片
    setCaptureState('captured')
  }

  function handleContinue() {
    setCaptureState('idle')
  }

  function handleFinish() {
    const score = strictLevel === 'precise' && collectedColors.length > 0
      ? computeMatchScore(collectedColors[collectedColors.length - 1], themeGradient)
      : null

    onEnd(collectedColors, score)
  }

  const displayColor = captureState === 'captured' && lastCapture ? lastCapture : liveColor
  const count = collectedColors.length

  const luminance = (0.299 * displayColor.r + 0.587 * displayColor.g + 0.114 * displayColor.b) / 255
  const textOnColor = luminance > 0.5 ? '#1A1714' : '#F5F0E8'

  const matchScore = strictLevel === 'precise'
    ? computeMatchScore({ r: liveColor.r, g: liveColor.g, b: liveColor.b }, themeGradient)
    : null
  const highMatch = matchScore !== null && matchScore >= 80

  return (
    <div style={styles.root}>
      <video ref={videoRef} autoPlay playsInline muted onPlay={handleVideoPlay} style={styles.video} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* 顶部操作栏 */}
      <div style={styles.topBar}>
        <div style={{
          ...styles.themeThumb,
          background: `linear-gradient(to right, ${themeGradient.start.hex}, ${themeGradient.end.hex})`,
        }} />
        <div style={{ flex: 1 }} />
        {count > 0 && (
          <div style={styles.countBadge}>
            <span style={styles.countText}>{count}</span>
          </div>
        )}
        <button style={styles.archiveBtn} onClick={onArchive}>档案</button>
      </div>

      {/* 准星区 */}
      <div style={styles.reticleWrap}>
        {matchScore !== null && (
          <div style={styles.scoreWrap}>
            <span style={{ ...styles.scoreText, opacity: highMatch ? 1 : 0.65 }}>{matchScore}%</span>
          </div>
        )}
        <div style={{
          ...styles.reticle,
          borderColor: highMatch ? liveColor.hex : 'rgba(245,240,232,0.85)',
          boxShadow: highMatch
            ? `0 0 0 1.5px ${liveColor.hex}, 0 0 14px ${liveColor.hex}55`
            : `0 0 0 1px rgba(0,0,0,0.3), 0 0 0 2px rgba(245,240,232,0.8)`,
          transition: 'border-color 0.4s ease-in-out, box-shadow 0.4s ease-in-out',
        }} />
      </div>

      {/* 底部面板 */}
      <div style={styles.panel}>
        {/* 色值行 */}
        <div style={styles.colorRow}>
          <div style={{
            ...styles.swatch,
            backgroundColor: displayColor.hex,
            transition: 'background-color 0.4s ease-in-out',
          }}>
            <span style={{ ...styles.swatchName, color: textOnColor }}>{displayColor.name}</span>
          </div>
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
            <button style={styles.btnCapture} onClick={handleCapture}>捕捉</button>
          ) : (
            <>
              <button style={styles.btnContinue} onClick={handleContinue}>继续捕猎</button>
              <button style={styles.btnFinish} onClick={handleFinish}>完成漫步</button>
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
    backgroundColor: 'rgba(245,240,232,0.92)',
    color: '#1A1714',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    padding: '1.5rem 2rem',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '80%',
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
