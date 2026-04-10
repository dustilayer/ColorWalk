import { useState } from 'react'
import { saveWalk } from '../utils/archive'
import { downloadCard } from '../utils/exportCard'

const MODE_LABELS = { single: '单色', free: '多色' }
const STRICT_LABELS = { ambient: '氛围漫游', hunter: '色彩猎人', precise: '精准采集' }

function formatDisplay(isoString) {
  const d = new Date(isoString)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function luminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// ── 单色照片卡 ─────────────────────────────────────────────────────

function SingleCard({ record }) {
  const { themeGradient, collectedColors, matchScore, strictLevel, date } = record
  const hit = collectedColors[0]
  if (!hit) return null
  const lum = luminance(hit.r, hit.g, hit.b)
  const textOnHit = lum > 0.5 ? 'rgba(26,23,20,0.9)' : 'rgba(245,240,232,0.9)'
  const subOnHit  = lum > 0.5 ? 'rgba(26,23,20,0.5)' : 'rgba(245,240,232,0.5)'

  return (
    <div style={card.root}>
      {/* 照片主体 */}
      <div style={card.photoArea}>
        {hit.photoUrl
          ? <img src={hit.photoUrl} alt="" style={card.photo} />
          : <div style={{ ...card.photo, backgroundColor: hit.hex }} />
        }
        {/* 色值叠加条 */}
        <div style={card.colorOverlay}>
          <div style={{ width: 36, height: 36, borderRadius: 7, backgroundColor: hit.hex, border: '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ ...card.overlayName, color: textOnHit }}>{hit.name}</span>
            <span style={{ ...card.overlayHex, color: subOnHit }}>{hit.hex.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* 底部 footer */}
      <div style={card.footer}>
        <div style={{
          height: 10,
          background: `linear-gradient(to right, ${themeGradient.start.hex}, ${themeGradient.end.hex})`,
        }} />
        <div style={card.footerMeta}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={card.startDot}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: themeGradient.start.hex, display: 'inline-block', border: '1px solid rgba(26,23,20,0.12)' }} />
              <span style={card.gradientName}>{themeGradient.start.name}</span>
            </span>
            <span style={card.gradientArrow}>→</span>
            <span style={card.startDot}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: themeGradient.end.hex, display: 'inline-block', border: '1px solid rgba(26,23,20,0.12)' }} />
              <span style={card.gradientName}>{themeGradient.end.name}</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            {strictLevel === 'precise' && matchScore != null && (
              <span style={card.metaSmall}>匹配度 {matchScore}%</span>
            )}
            <span style={card.metaSmall}>{formatDisplay(date)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 自由模式：横向 Swiper ─────────────────────────────────────────

function FreeCard({ record }) {
  const photos = record?.collectedColors ?? []
  const { themeGradient, date } = record
  const [currentIdx, setCurrentIdx] = useState(0)
  const n = photos.length

  function handleScroll(e) {
    // 每张卡片 85vw + margin 左右各 8px = 85vw + 16px
    const cardW = window.innerWidth * 0.85 + 16
    const idx = Math.round(e.target.scrollLeft / cardW)
    setCurrentIdx(Math.max(0, Math.min(idx, n - 1)))
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 外层容器：display flex, overflow-x scroll, scroll-snap-type x mandatory */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
        }}
        onScroll={handleScroll}
      >
        {photos.length === 0 ? (
          <div style={{
            scrollSnapAlign: 'center',
            minWidth: '85vw',
            margin: '0 8px',
            borderRadius: 16,
            backgroundColor: '#EDE8DF',
            height: '70vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.85rem', color: '#9A8A7A' }}>
              暂无采集
            </span>
          </div>
        ) : photos.map((c, i) => (
          /* 每张卡片：scroll-snap-align center, min-width 85vw, margin 0 8px */
          <div
            key={i}
            style={{
              scrollSnapAlign: 'center',
              minWidth: '85vw',
              margin: '0 8px',
              flexShrink: 0,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(26,23,20,0.14)',
              backgroundColor: '#F5F0E8',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 上方照片，object-fit cover */}
            <div style={{ height: '56vw', flexShrink: 0 }}>
              {c.photoUrl
                ? <img src={c.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', backgroundColor: c.hex }} />
              }
            </div>
            {/* 下方色名 + HEX */}
            <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                backgroundColor: c.hex,
                border: '1px solid rgba(26,23,20,0.1)',
                flexShrink: 0,
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '0.95rem', color: '#1A1714', letterSpacing: '0.06em' }}>
                  {c.name}
                </span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: '#7A6A5A', letterSpacing: '0.08em' }}>
                  {c.hex.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部圆点：photos.map 生成，当前页高亮 */}
      {n > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '0.75rem 0 0.25rem' }}>
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                width:  i === currentIdx ? 16 : 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: i === currentIdx ? '#1A1714' : 'rgba(26,23,20,0.22)',
                transition: 'width 0.3s ease, background-color 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* 主题色带 + 日期 */}
      <div style={{ margin: '0.75rem 1.5rem 0' }}>
        <div style={{ height: 8, borderRadius: 4, background: `linear-gradient(to right, ${themeGradient.start.hex}, ${themeGradient.end.hex})` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={card.metaSmall}>{n} 个颜色</span>
          <span style={card.metaSmall}>{formatDisplay(date)}</span>
        </div>
      </div>
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────────────

export default function EndPage({ record, readonly, onWalkAgain, onViewArchive, onBack }) {
  console.log('EndPage收到的完整record:', JSON.stringify(record))
  const photos = record?.collectedColors ?? []
  console.log('收到的照片数据:', photos, '长度:', photos?.length)

  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)

  function handleSaveArchive() {
    saveWalk(record)
    setSaved(true)
  }

  async function handleDownload() {
    setDownloading(true)
    await downloadCard(record)
    setDownloading(false)
  }

  const scoreLabel = record.mode === 'single' && record.strictLevel === 'precise' && record.matchScore != null
    ? record.matchScore >= 90 ? '完美命中'
      : record.matchScore >= 70 ? '色相相近'
      : '意外之色'
    : null

  return (
    <div className="page-enter" style={styles.root}>
      {/* 顶部导航 */}
      <div style={styles.topNav}>
        {readonly
          ? <button style={styles.navBtn} onClick={onBack}>← 返回</button>
          : <div />
        }
        <div style={styles.tags}>
          <span style={styles.tag}>{MODE_LABELS[record.mode]}</span>
          <span style={styles.tag}>{STRICT_LABELS[record.strictLevel]}</span>
        </div>
      </div>

      {/* 色卡：两种模式都用滑动卡片 */}
      <FreeCard record={record} />

      {scoreLabel && <p style={styles.scoreLabel}>{scoreLabel}</p>}

      {/* 操作按钮 */}
      {!readonly && (
        <div style={styles.actions}>
          <button style={styles.btnSecondary} onClick={handleDownload} disabled={downloading}>
            {downloading ? '生成中…' : '保存到相册'}
          </button>
          <button
            style={saved ? styles.btnSaved : styles.btnSecondary}
            onClick={handleSaveArchive}
            disabled={saved}
          >
            {saved ? '已存入档案' : '存入档案'}
          </button>
          <button style={styles.btnPrimary} onClick={onWalkAgain}>再走一次</button>
          {saved && (
            <button style={styles.btnViewArchive} onClick={onViewArchive}>查看档案</button>
          )}
        </div>
      )}
    </div>
  )
}

// ── 色卡局部样式 ───────────────────────────────────────────────────

const card = {
  root: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 28px rgba(26,23,20,0.13)',
    backgroundColor: '#1A1714',
  },
  photoArea: {
    position: 'relative',
    aspectRatio: '4 / 3',
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  colorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
    padding: '2rem 1rem 0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  overlayName: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    letterSpacing: '0.08em',
    display: 'block',
  },
  overlayHex: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    display: 'block',
  },
  footer: {
    backgroundColor: '#F5F0E8',
    flexShrink: 0,
  },
  footerMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '0.625rem 0.875rem 0.75rem',
  },
  startDot: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  gradientName: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.72rem',
    color: '#7A6A5A',
    letterSpacing: '0.06em',
  },
  gradientArrow: {
    fontSize: '0.7rem',
    color: 'rgba(26,23,20,0.3)',
  },
  metaSmall: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.68rem',
    color: 'rgba(26,23,20,0.4)',
    letterSpacing: '0.04em',
    display: 'block',
  },
}

// ── 页面样式 ───────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: '100dvh',
    backgroundColor: '#F5F0E8',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  topNav: {
    padding: '2.5rem 1.5rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: '#7A6A5A',
    cursor: 'pointer',
    letterSpacing: '0.05em',
  },
  tags: { display: 'flex', gap: '0.5rem' },
  tag: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.72rem',
    color: '#7A6A5A',
    border: '1px solid rgba(26,23,20,0.2)',
    borderRadius: 20,
    padding: '0.2rem 0.6rem',
    letterSpacing: '0.05em',
  },
  cardWrapSingle: {
    padding: '0 1.5rem',
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  scoreLabel: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.875rem',
    color: '#7A6A5A',
    textAlign: 'center',
    margin: '0.75rem 1.5rem 0',
    letterSpacing: '0.12em',
  },
  actions: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom))',
  },
  btnPrimary: {
    backgroundColor: '#1A1714',
    color: '#F5F0E8',
    border: 'none',
    borderRadius: 16,
    padding: '1rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    width: '100%',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    color: '#1A1714',
    border: '1px solid rgba(26,23,20,0.28)',
    borderRadius: 16,
    padding: '0.875rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    width: '100%',
  },
  btnSaved: {
    backgroundColor: 'transparent',
    color: 'rgba(26,23,20,0.3)',
    border: '1px solid rgba(26,23,20,0.12)',
    borderRadius: 16,
    padding: '0.875rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    cursor: 'default',
    width: '100%',
  },
  btnViewArchive: {
    backgroundColor: 'transparent',
    color: '#5A4A3A',
    border: '1px solid rgba(26,23,20,0.22)',
    borderRadius: 16,
    padding: '0.875rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    width: '100%',
  },
}
