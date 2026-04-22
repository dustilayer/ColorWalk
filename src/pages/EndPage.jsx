import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { Star } from 'lucide-react'
import { saveWalk, getWalks, loadPhotosIntoWalk } from '../utils/archive'
import { downloadCard, shareCard } from '../utils/exportCard'
import { useLanguage } from '../contexts/LanguageContext'
import { checkAchievements } from '../utils/achievementUtils'
import AchievementToast from '../components/AchievementToast'

function formatDisplay(isoString) {
  const d = new Date(isoString)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function luminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// ── 单色照片卡 ─────────────────────────────────────────────────────

function SingleCard({ record, currentIdx, onIndexChange, t }) {
  const { themeGradient, collectedColors, matchScore, strictLevel, date } = record
  const n = collectedColors.length
  const scrollRef = useRef(null)
  const scrollTimeout = useRef(null)

  function handleScroll(e) {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      const cardW = window.innerWidth * 0.8 + 16
      const idx = Math.round(e.target.scrollLeft / cardW)
      onIndexChange(Math.max(0, Math.min(idx, n - 1)))
    }, 50)
  }

  if (n === 0) return null

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          display: 'flex',
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overscrollBehaviorX: 'contain',
          padding: '0 calc(10vw - 8px)',
          paddingBottom: 4,
        }}
        onScroll={handleScroll}
      >
        {collectedColors.map((hit, i) => {
          const lum = luminance(hit.r, hit.g, hit.b)
          const textOnHit = lum > 0.5 ? 'rgba(26,23,20,0.9)' : 'rgba(245,240,232,0.9)'
          const subOnHit  = lum > 0.5 ? 'rgba(26,23,20,0.5)' : 'rgba(245,240,232,0.5)'
          
          return (
            <div key={i} style={{
              scrollSnapAlign: 'center',
              minWidth: '80vw',
              margin: '0 8px',
              flexShrink: 0,
              transform: 'translateZ(0)',
              ...card.root
            }}>
              <div style={card.photoArea}>
                {hit.photoUrl
                  ? <img src={hit.photoUrl} alt="" style={card.photoAbsolute} />
                  : <div style={{ ...card.photoAbsolute, backgroundColor: hit.hex }} />
                }
                <div style={card.colorOverlay}>
                  {hit.isPerfect && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(255,215,0,0.9)',
                      padding: '4px 8px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      zIndex: 5,
                    }}>
                      <Star size={12} fill="#1A1714" color="#1A1714" />
                    </div>
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: 7, backgroundColor: hit.hex, border: '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ ...card.overlayName, color: textOnHit }}>{hit.name}</span>
                    <span style={{ ...card.overlayHex, color: subOnHit }}>{hit.hex.toUpperCase()}</span>
                  </div>
                </div>
              </div>

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
                      <span style={card.metaSmall}>{t('precise')} {matchScore}%</span>
                    )}
                    <span style={card.metaSmall}>{formatDisplay(date)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {n > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '0.75rem 0 0.25rem' }}>
          {collectedColors.map((_, i) => (
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
    </div>
  )
}

// ── 自由模式：横向 Swiper ─────────────────────────────────────────

function FreeCard({ record, currentIdx, onIndexChange, t }) {
  const photos = record?.collectedColors ?? []
  const { themeGradient, date } = record
  const n = photos.length
  const scrollRef = useRef(null)
  const scrollTimeout = useRef(null)

  function handleScroll(e) {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    scrollTimeout.current = setTimeout(() => {
      const cardW = window.innerWidth * 0.8 + 16
      const idx = Math.round(e.target.scrollLeft / cardW)
      onIndexChange(Math.max(0, Math.min(idx, n - 1)))
    }, 50)
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          display: 'flex',
          overflowX: 'scroll',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          overscrollBehaviorX: 'contain',
          padding: '0 calc(10vw - 8px)',
          paddingBottom: 4,
        }}
        onScroll={handleScroll}
      >
        {photos.length === 0 ? (
          <div style={{
            scrollSnapAlign: 'center',
            minWidth: '80vw',
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
              {t('noRecords')}
            </span>
          </div>
        ) : photos.map((c, i) => (
          <div
            key={i}
            style={{
              scrollSnapAlign: 'center',
              minWidth: '80vw',
              margin: '0 8px',
              flexShrink: 0,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(26,23,20,0.14)',
              backgroundColor: '#F5F0E8',
              display: 'flex',
              flexDirection: 'column',
              transform: 'translateZ(0)',
            }}
          >
            <div style={{ height: '56vw', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              {c.isPerfect && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: 'rgba(255,215,0,0.9)',
                  padding: '4px 8px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  zIndex: 5,
                }}>
                  <Star size={12} fill="#1A1714" color="#1A1714" />
                </div>
              )}
              {c.photoUrl
                ? <img src={c.photoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ position: 'absolute', inset: 0, backgroundColor: c.hex }} />
              }
            </div>
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

      <div style={{ margin: '0.75rem 1.5rem 0' }}>
        <div style={{ height: 8, borderRadius: 4, background: `linear-gradient(to right, ${themeGradient.start.hex}, ${themeGradient.end.hex})` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={card.metaSmall}>{n} {t('colorsCount')}</span>
          <span style={card.metaSmall}>{formatDisplay(date)}</span>
        </div>
      </div>
    </div>
  )
}

// ── 主组件 ─────────────────────────────────────────────────────────

export default function EndPage({ record, readonly, onWalkAgain, onViewArchive, onBack }) {
  const { t } = useLanguage()
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [newAchievements, setNewAchievements] = useState([])
  // For readonly (archive) mode, photos come from IndexedDB; for fresh walk, photos are in memory
  const [displayRecord, setDisplayRecord] = useState(record)

  useEffect(() => {
    if (readonly) {
      // Load photos from IndexedDB for archive view
      loadPhotosIntoWalk(record).then(r => setDisplayRecord(r))
    } else {
      // Fresh walk — photos are already in memory
      setDisplayRecord(record)
    }
  }, [readonly, record])

  useEffect(() => {
    if (readonly) return
    const allRecords = [record, ...getWalks()]
    const unlocked = checkAchievements(record, allRecords)
    if (unlocked.length > 0) setNewAchievements(unlocked)
  }, [])

  const MODE_LABELS = { single: t('singleColor'), free: t('freeColor') }
  const STRICT_LABELS = { ambient: t('ambient'), hunter: t('hunter'), precise: t('precise') }

  async function handleSaveArchive() {
    await saveWalk(record)
    setSaved(true)
  }

  async function handleDownload() {
    setDownloading(true)
    await downloadCard(displayRecord, currentIdx)
    setDownloading(false)
  }

  async function handleShare() {
    setSharing(true)
    try {
      const success = await shareCard(displayRecord, currentIdx)
      if (!success) {
        await downloadCard(displayRecord, currentIdx)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSharing(false)
    }
  }

  const scoreLabel = record.mode === 'single' && record.strictLevel === 'precise' && record.matchScore != null
    ? record.matchScore >= 90 ? t('perfectMatch')
      : record.matchScore >= 70 ? t('closeMatch')
      : t('unexpectedColor')
    : null

  return (
    <div className="page-enter" style={styles.root}>
      <AchievementToast
        newAchievements={newAchievements}
        themeColor={record.themeGradient?.start?.hex}
      />
      <div style={styles.topNav}>
        {readonly
          ? <motion.button
              style={styles.navBtn}
              onClick={() => { onBack(); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >← {t('back')}</motion.button>
          : <div />
        }
        <div style={styles.tags}>
          <span style={styles.tag}>{STRICT_LABELS[record.strictLevel]}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: readonly ? '2rem' : 0 }}>
        {record.mode === 'single'
          ? <SingleCard record={displayRecord} currentIdx={currentIdx} onIndexChange={setCurrentIdx} t={t} />
          : <FreeCard record={displayRecord} currentIdx={currentIdx} onIndexChange={setCurrentIdx} t={t} />
        }

        {scoreLabel && <p style={styles.scoreLabel}>{scoreLabel}</p>}
      </div>

      {!readonly && (
        <div style={styles.actions}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <motion.button 
              style={{ ...styles.btnSecondary, flex: 1 }} 
              onClick={handleDownload} 
              disabled={downloading}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(26,23,20,0.05)' }}
              whileTap={{ scale: 0.98 }}
            >
              {downloading ? '...' : t('downloadCard')}
            </motion.button>
            <motion.button 
              style={{ ...styles.btnSecondary, flex: 1 }} 
              onClick={handleShare} 
              disabled={sharing}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(26,23,20,0.05)' }}
              whileTap={{ scale: 0.98 }}
            >
              {sharing ? '...' : t('share')}
            </motion.button>
          </div>
          <motion.button
            style={saved ? styles.btnSaved : styles.btnSecondary}
            onClick={handleSaveArchive}
            disabled={saved}
            whileHover={!saved ? { scale: 1.02, backgroundColor: 'rgba(26,23,20,0.05)' } : {}}
            whileTap={!saved ? { scale: 0.98 } : {}}
          >
            {saved ? t('saved') : t('saveArchive')}
          </motion.button>
          <motion.button 
            style={styles.btnPrimary} 
            onClick={() => { onWalkAgain(); }}
            whileHover={{ scale: 1.02, backgroundColor: '#333' }}
            whileTap={{ scale: 0.98 }}
          >{t('walkAgain')}</motion.button>
          {saved && (
            <motion.button 
              style={styles.btnViewArchive} 
              onClick={() => { onViewArchive(); }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(26,23,20,0.05)' }}
              whileTap={{ scale: 0.98 }}
            >{t('viewArchive')}</motion.button>
          )}
        </div>
      )}
    </div>
  )
}

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
  photoAbsolute: {
    position: 'absolute',
    inset: 0,
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
