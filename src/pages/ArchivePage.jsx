import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { getWalks } from '../utils/archive'
import { useLanguage } from '../contexts/LanguageContext'
import EndPage from './EndPage'
import { playClick } from '../utils/audio'
import { Calendar, Palette } from 'lucide-react'
import { hexToRgb } from '../utils/colorUtils'

function getHue(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm)
  let h = 0
  if (max === min) h = 0
  else if (max === rNorm) h = 60 * ((gNorm - bNorm) / (max - min)) + (gNorm < bNorm ? 360 : 0)
  else if (max === gNorm) h = 60 * ((bNorm - rNorm) / (max - min)) + 120
  else if (max === bNorm) h = 60 * ((rNorm - gNorm) / (max - min)) + 240
  return h
}

function getHueBucket(hue, t) {
  if (hue < 15 || hue >= 345) return { id: 'red', name: t('hueRed'), color: '#E8504A' }
  if (hue < 45) return { id: 'orange', name: t('hueOrange'), color: '#F4845F' }
  if (hue < 75) return { id: 'yellow', name: t('hueYellow'), color: '#F7E04B' }
  if (hue < 165) return { id: 'green', name: t('hueGreen'), color: '#56C596' }
  if (hue < 195) return { id: 'cyan', name: t('hueCyan'), color: '#3AB8C8' }
  if (hue < 255) return { id: 'blue', name: t('hueBlue'), color: '#3D9BE9' }
  if (hue < 290) return { id: 'purple', name: t('huePurple'), color: '#9B6FD4' }
  return { id: 'pink', name: t('huePink'), color: '#F2A8C8' }
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

function PhotoStack({ photos, colors }) {
  const displayPhotos = photos.slice(0, 4)
  const remaining = photos.length - 4

  return (
    <div style={{ position: 'relative', width: 140, height: 100, flexShrink: 0, marginRight: '1rem' }}>
      {displayPhotos.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 70,
            height: 90,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: colors[i]?.hex || '#eee',
            border: '1.5px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            left: i * 18,
            top: i % 2 === 0 ? 0 : 8,
            rotate: (i - 1.5) * 8,
            zIndex: 10 - i,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          {p ? (
            <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
          {i === 3 && remaining > 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.9rem',
              fontWeight: 'bold',
            }}>
              +{remaining}
            </div>
          )}
        </motion.div>
      ))}
      {photos.length === 0 && colors.length > 0 && (
        <div style={{
          position: 'absolute',
          width: 70,
          height: 90,
          borderRadius: 8,
          backgroundColor: colors[0].hex,
          border: '1.5px solid white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          left: 35,
          top: 5,
        }} />
      )}
    </div>
  )
}

function WalkCard({ record, onClick, t, MODE_LABELS, STRICT_LABELS }) {
  const { themeGradient, collectedColors, mode, strictLevel, date } = record
  const photos = collectedColors.map(c => c.photoUrl).filter(Boolean)

  return (
    <motion.button 
      style={styles.card} 
      onClick={() => { onClick(); playClick(); }}
      whileHover={{ scale: 1.02, y: -2, boxShadow: '0 8px 24px rgba(26,23,20,0.1)' }}
      whileTap={{ scale: 0.98 }}
      whileFocus={{ scale: 1.02, boxShadow: '0 0 0 2px rgba(26,23,20,0.2)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{
        width: 6,
        flexShrink: 0,
        alignSelf: 'stretch',
        background: `linear-gradient(to bottom, ${themeGradient.start.hex}, ${themeGradient.end.hex})`,
      }} />

      <div style={styles.cardContent}>
        <PhotoStack photos={photos} colors={collectedColors} />
        
        <div style={styles.meta}>
          <span style={styles.metaDate}>{formatDate(date)}</span>
          <div style={styles.metaTags}>
            <span style={styles.tag}>{STRICT_LABELS[strictLevel]}</span>
          </div>
          {collectedColors.length > 0 && (
            <span style={styles.metaCount}>{collectedColors.length} {t('colorsCount')}</span>
          )}
        </div>
      </div>
    </motion.button>
  )
}

function ColorStack({ bucket, walks, onSelectWalk, t, MODE_LABELS, STRICT_LABELS }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <motion.div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          cursor: 'pointer',
        }}
        onClick={() => { setExpanded(!expanded); playClick(); }}
        whileTap={{ scale: 0.98 }}
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: bucket.color }} />
        <span style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '1rem', color: 'var(--text-color, #1A1714)' }}>
          {bucket.name}{t('hueSeries')} ({walks.length})
        </span>
      </motion.div>

      {!expanded ? (
        <div 
          style={{ position: 'relative', height: 130, cursor: 'pointer' }}
          onClick={() => { setExpanded(true); playClick(); }}
        >
          {walks.slice(0, 3).map((record, idx) => (
            <motion.div
              key={record.id}
              style={{
                position: 'absolute',
                top: idx * 8,
                left: idx * 4,
                right: -idx * 4,
                zIndex: 3 - idx,
                opacity: 1 - idx * 0.15,
                transformOrigin: 'top center',
              }}
              whileHover={{ y: -4 }}
            >
              <WalkCard record={record} onClick={() => {}} t={t} MODE_LABELS={MODE_LABELS} STRICT_LABELS={STRICT_LABELS} />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >
          {walks.map((record) => (
            <WalkCard key={record.id} record={record} onClick={() => onSelectWalk(record)} t={t} MODE_LABELS={MODE_LABELS} STRICT_LABELS={STRICT_LABELS} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

export default function ArchivePage({ onStartWalk }) {
  const { t } = useLanguage()
  const [walks] = useState(() => getWalks())
  const [detail, setDetail] = useState(null)
  const [sortMode, setSortMode] = useState('date') // 'date' | 'color'

  const MODE_LABELS = { single: t('singleColor'), free: t('freeColor') }
  const STRICT_LABELS = { ambient: t('ambient'), hunter: t('hunter'), precise: t('precise') }

  const sortedWalks = useMemo(() => {
    const arr = [...walks]
    if (sortMode === 'date') {
      return arr.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      return arr.sort((a, b) => {
        const hueA = getHue(a.themeGradient.start.hex)
        const hueB = getHue(b.themeGradient.start.hex)
        return hueA - hueB
      })
    }
  }, [walks, sortMode])

  const groupedWalks = useMemo(() => {
    if (sortMode === 'date') return null
    const groups = {}
    walks.forEach(w => {
      const hue = getHue(w.themeGradient.start.hex)
      const bucket = getHueBucket(hue, t)
      if (!groups[bucket.id]) groups[bucket.id] = { bucket, walks: [] }
      groups[bucket.id].walks.push(w)
    })
    return Object.values(groups).sort((a, b) => b.walks.length - a.walks.length)
  }, [walks, sortMode, t])

  if (detail) {
    return <EndPage record={detail} readonly onBack={() => { setDetail(null); playClick(); }} />
  }

  return (
    <div className="page-enter" style={styles.root}>
      <div style={styles.topNav}>
        <h1 style={styles.title}>{t('archive')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={styles.sortToggle}>
            <motion.button
              style={{ ...styles.sortBtn, opacity: sortMode === 'date' ? 1 : 0.4 }}
              onClick={() => { setSortMode('date'); playClick(); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Calendar size={18} color="#1A1714" />
            </motion.button>
            <motion.button
              style={{ ...styles.sortBtn, opacity: sortMode === 'color' ? 1 : 0.4 }}
              onClick={() => { setSortMode('color'); playClick(); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Palette size={18} color="#1A1714" />
            </motion.button>
          </div>
          <motion.button 
            style={styles.startBtn} 
            onClick={() => { onStartWalk(); playClick(); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >{t('goCapture')}</motion.button>
        </div>
      </div>

      {walks.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>{t('noRecords')}</p>
          <p style={styles.emptyHint}>{t('noRecordsHint')}</p>
        </div>
      ) : sortMode === 'date' ? (
        <div style={styles.list}>
          {sortedWalks.map((record) => (
            <WalkCard key={record.id} record={record} onClick={() => setDetail(record)} t={t} MODE_LABELS={MODE_LABELS} STRICT_LABELS={STRICT_LABELS} />
          ))}
        </div>
      ) : (
        <div style={styles.list}>
          {groupedWalks.map(group => (
            <ColorStack 
              key={group.bucket.id} 
              bucket={group.bucket} 
              walks={group.walks} 
              onSelectWalk={setDetail} 
              t={t}
              MODE_LABELS={MODE_LABELS}
              STRICT_LABELS={STRICT_LABELS}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100dvh',
    backgroundColor: 'var(--bg-color, #F5F0E8)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    transition: 'background-color 0.3s ease',
  },
  topNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '2.5rem 1.5rem 1.25rem',
  },
  title: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: 400,
    color: 'var(--text-color, #1A1714)',
    margin: 0,
    letterSpacing: '0.05em',
  },
  startBtn: {
    background: 'none',
    border: 'none',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: 'var(--text-muted, #7A6A5A)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    padding: 0,
  },
  sortToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--card-border, rgba(26,23,20,0.05))',
    padding: '0.25rem',
    borderRadius: 20,
  },
  sortBtn: {
    background: 'none',
    border: 'none',
    padding: '0.25rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    color: 'var(--text-color, #1A1714)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    padding: '0 1.5rem 2.5rem',
  },
  card: {
    minHeight: 130,
    backgroundColor: 'var(--card-bg, rgba(255,255,255,0.55))',
    border: '1px solid var(--card-border, rgba(26,23,20,0.08))',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'stretch',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    padding: 0,
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    overflow: 'hidden',
  },
  thumbWrap: {
    width: 76,
    flexShrink: 0,
    padding: '1rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    objectFit: 'cover',
    display: 'block',
  },
  meta: {
    flex: 1,
    padding: '1rem 1rem 1rem 0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '0.4rem',
    minWidth: 0,
  },
  metaDate: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.85rem',
    color: 'var(--text-color, #1A1714)',
    letterSpacing: '0.04em',
  },
  metaTags: {
    display: 'flex',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  tag: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.7rem',
    color: 'var(--text-muted, #7A6A5A)',
    border: '1px solid var(--card-border, rgba(26,23,20,0.18))',
    borderRadius: 20,
    padding: '0.15rem 0.5rem',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  metaCount: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.72rem',
    color: 'var(--text-muted, #9A8A7A)',
    letterSpacing: '0.04em',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '4rem 2rem',
  },
  emptyText: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    color: 'var(--text-muted, #7A6A5A)',
    margin: 0,
    letterSpacing: '0.08em',
  },
  emptyHint: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.78rem',
    color: 'var(--card-border, rgba(26,23,20,0.3))',
    margin: 0,
    letterSpacing: '0.04em',
    textAlign: 'center',
    lineHeight: 1.7,
  },
}
