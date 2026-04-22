import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { getWalks, deleteWalk } from '../utils/archive'
import { getPhoto, photoKey } from '../utils/storage'
import { useLanguage } from '../contexts/LanguageContext'
import EndPage from './EndPage'
import { Calendar, Palette, Star, Trophy } from 'lucide-react'
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

// 始终渲染 3 层堆叠，统一卡片感
// walkId + colors: 从 IndexedDB 异步加载照片；themeGradient: 渐变兜底色
function PhotoStack({ walkId, colors, themeGradient }) {
  const [loadedPhotos, setLoadedPhotos] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const photos = await Promise.all(
        (colors || []).slice(0, 3).map((_, i) => getPhoto(photoKey(walkId, i)))
      )
      if (!cancelled) setLoadedPhotos(photos)
    }
    load()
    return () => { cancelled = true }
  }, [walkId, colors])

  const LAYERS = 3
  const center = (LAYERS - 1) / 2  // = 1

  return (
    <div style={{ position: 'relative', width: 120, height: 98, flexShrink: 0, marginRight: '1rem' }}>
      {Array.from({ length: LAYERS }, (_, i) => {
        const isTop  = i === LAYERS - 1
        // 倒序取照片：顶层 (i=2) 取 photos[0]，中层 (i=1) 取 photos[1]，底层 (i=0) 取 photos[2]
        const photoIdx = LAYERS - 1 - i
        const photo  = loadedPhotos[photoIdx] ?? null
        const bgColor = colors[photoIdx]?.hex ?? themeGradient.start.hex
        const rotate  = (i - center) * 7          // bottom:-7°  mid:0°  top:+7°
        const opacity = isTop ? 1 : 0.42 + i * 0.12
        const scale   = isTop ? 1 : 0.88 + i * 0.04

        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: 66,
              height: 84,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: bgColor,
              border: `1.5px solid ${isTop ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)'}`,
              boxShadow: isTop
                ? '0 6px 18px rgba(0,0,0,0.22)'
                : '0 2px 6px rgba(0,0,0,0.12)',
              left: i * 17,
              top:  i % 2 === 0 ? 4 : 10,
              rotate,
              zIndex: i,
              filter: isTop ? 'none' : 'blur(2px) brightness(0.82) saturate(0.72)',
              opacity,
              scale,
            }}
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity, scale }}
            transition={{ duration: 0.38, delay: i * 0.06 }}
          >
            {photo && (
              <img
                src={photo}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

function WalkCard({ record, onClick, onDelete, t, MODE_LABELS, STRICT_LABELS, hideMeta }) {
  const { id, themeGradient, collectedColors, strictLevel, date } = record
  const [confirming, setConfirming] = useState(false)

  return (
    <motion.div
      style={{ ...styles.card, cursor: 'pointer' }}
      onClick={() => { if (!confirming) { onClick() } }}
      whileHover={{ scale: 1.02, y: -2, boxShadow: '0 8px 24px rgba(26,23,20,0.1)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {!hideMeta && (
        <div style={{
          width: 6,
          flexShrink: 0,
          alignSelf: 'stretch',
          background: `linear-gradient(to bottom, ${themeGradient.start.hex}, ${themeGradient.end.hex})`,
        }} />
      )}

      <div style={styles.cardContent}>
        <PhotoStack walkId={id} colors={collectedColors} themeGradient={themeGradient} />

        {!hideMeta && (
          <div style={styles.meta}>
            <span style={styles.metaDate}>{formatDate(date)}</span>
            <div style={styles.metaTags}>
              <span style={styles.tag}>{STRICT_LABELS[strictLevel]}</span>
              {(record.collectedColors || record.colors || []).some(c => c.isPerfect) && (
                <span style={{ ...styles.tag, borderColor: '#FFD700', color: '#B8860B', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={10} fill="#FFD700" color="#FFD700" />
                  {t('perfectPhotos')}
                </span>
              )}
            </div>
            {collectedColors.length > 0 && (
              <span style={styles.metaCount}>{collectedColors.length} {t('colorsCount')}</span>
            )}

            {onDelete && (
              confirming ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={styles.deleteHint}>确认删除这条记录？</span>
                  <button
                    style={styles.confirmBtn}
                    onClick={e => { e.stopPropagation(); onDelete(record.id) }}
                  >确认</button>
                  <button
                    style={styles.cancelBtn}
                    onClick={e => { e.stopPropagation(); setConfirming(false) }}
                  >取消</button>
                </div>
              ) : (
                <button
                  style={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); setConfirming(true) }}
                >删除</button>
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ColorStack({ bucket, walks, onSelectWalk, onDelete, t, MODE_LABELS, STRICT_LABELS }) {
  const [expanded, setExpanded] = useState(false)
  const isStack = walks.length > 1

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <motion.div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '1rem',
          cursor: 'pointer',
        }}
        onClick={() => { setExpanded(!expanded); }}
        whileTap={{ scale: 0.98 }}
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: bucket.color, boxShadow: `0 0 8px ${bucket.color}44` }} />
        <span style={{ fontFamily: '"Noto Serif SC", Georgia, serif', fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-color, #1A1714)' }}>
          {bucket.name}{t('hueSeries')} ({walks.length})
        </span>
      </motion.div>

      {!expanded ? (
        isStack ? (
          <div 
            style={{ position: 'relative', height: 150, cursor: 'pointer' }}
            onClick={() => { setExpanded(true); }}
          >
            {walks.slice(0, 3).map((record, idx) => (
              <motion.div
                key={record.id}
                style={{
                  position: 'absolute',
                  top: idx * 10,
                  left: idx * 6,
                  right: -idx * 6,
                  zIndex: 10 - idx,
                  opacity: 1 - idx * 0.15,
                  transformOrigin: 'top center',
                }}
                whileHover={{ y: -4 }}
              >
                <WalkCard record={record} onClick={() => {}} t={t} MODE_LABELS={MODE_LABELS} STRICT_LABELS={STRICT_LABELS} hideMeta={idx > 0} />
              </motion.div>
            ))}
          </div>
        ) : (
          <WalkCard record={walks[0]} onClick={() => onSelectWalk(walks[0])} onDelete={onDelete} t={t} MODE_LABELS={MODE_LABELS} STRICT_LABELS={STRICT_LABELS} />
        )
      ) : (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {walks.map((record) => (
            <WalkCard key={record.id} record={record} onClick={() => onSelectWalk(record)} onDelete={onDelete} t={t} MODE_LABELS={MODE_LABELS} STRICT_LABELS={STRICT_LABELS} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

function PerfectGridItem({ photo, index, onPress }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    let cancelled = false
    getPhoto(photoKey(photo.walkId, photo.colorIndex)).then(url => {
      if (!cancelled) setSrc(url)
    })
    return () => { cancelled = true }
  }, [photo.walkId, photo.colorIndex])

  return (
    <motion.div
      style={{ ...styles.perfectItem, backgroundColor: photo.hex }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onPress}
    >
      {src && <img src={src} alt="" style={styles.perfectImg} />}
      <div style={styles.perfectOverlay}>
        <Star size={12} fill="#FFD700" color="#FFD700" />
        <span style={styles.perfectName}>{photo.name}</span>
      </div>
    </motion.div>
  )
}

export default function ArchivePage({ onStartWalk, onAchievements }) {
  const { t } = useLanguage()
  const [walks, setWalks] = useState(() => getWalks())

  async function handleDelete(id) {
    await deleteWalk(id)
    setWalks(prev => prev.filter(w => w.id !== id))
  }
  const [detail, setDetail] = useState(null)
  const [sortMode, setSortMode] = useState('date') // 'date' | 'color' | 'perfect'

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

  const perfectPhotos = useMemo(() => {
    const photos = []
    walks.forEach(w => {
      const colors = w.collectedColors || w.colors || []
      colors.forEach((c, colorIndex) => {
        if (c.isPerfect) {
          photos.push({ ...c, walkId: w.id, date: w.date, colorIndex })
        }
      })
    })
    return photos.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [walks])

  if (detail) {
    return <EndPage record={detail} readonly onBack={() => { setDetail(null); }} />
  }

  return (
    <div className="page-enter" style={styles.root}>
      <div style={styles.topNav}>
        <h1 style={styles.title}>{t('archive')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={styles.sortToggle}>
            {onAchievements && (
              <motion.button
                style={{ ...styles.sortBtn, opacity: 0.7 }}
                onClick={() => { onAchievements(); }}
                whileHover={{ scale: 1.1, opacity: 1 }}
                whileTap={{ scale: 0.9 }}
                title={t('achievements')}
              >
                <Trophy size={18} color="var(--text-color, #1A1714)" />
              </motion.button>
            )}
            <div style={{ width: 1, height: 14, backgroundColor: 'rgba(26,23,20,0.15)', margin: '0 2px' }} />
            <motion.button
              style={{ ...styles.sortBtn, opacity: sortMode === 'date' ? 1 : 0.4 }}
              onClick={() => { setSortMode('date'); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Calendar size={18} color="#1A1714" />
            </motion.button>
            <motion.button
              style={{ ...styles.sortBtn, opacity: sortMode === 'color' ? 1 : 0.4 }}
              onClick={() => { setSortMode('color'); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Palette size={18} color="#1A1714" />
            </motion.button>
            <motion.button
              style={{ ...styles.sortBtn, opacity: sortMode === 'perfect' ? 1 : 0.4 }}
              onClick={() => { setSortMode('perfect'); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Star size={18} color={sortMode === 'perfect' ? '#FFD700' : '#1A1714'} fill={sortMode === 'perfect' ? '#FFD700' : 'none'} />
            </motion.button>
          </div>
          <motion.button 
            style={styles.startBtn} 
            onClick={() => { onStartWalk(); }}
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
            <WalkCard key={record.id} record={record} onClick={() => setDetail(record)} onDelete={handleDelete} t={t} MODE_LABELS={MODE_LABELS} STRICT_LABELS={STRICT_LABELS} />
          ))}
        </div>
      ) : sortMode === 'color' ? (
        <div style={styles.list}>
          {groupedWalks.map(group => (
            <ColorStack
              key={group.bucket.id}
              bucket={group.bucket}
              walks={group.walks}
              onSelectWalk={setDetail}
              onDelete={handleDelete}
              t={t}
              MODE_LABELS={MODE_LABELS}
              STRICT_LABELS={STRICT_LABELS}
            />
          ))}
        </div>
      ) : (
        <div style={styles.perfectGrid}>
          {perfectPhotos.map((photo, i) => (
            <PerfectGridItem
              key={i}
              photo={photo}
              index={i}
              onPress={() => {
                const walk = walks.find(w => w.id === photo.walkId)
                if (walk) setDetail(walk)
              }}
            />
          ))}
          {perfectPhotos.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', paddingTop: '4rem', opacity: 0.5 }}>
              <p style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '0.9rem' }}>还没有完美拍摄的照片</p>
            </div>
          )}
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
  perfectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    padding: '0 1.5rem 2rem',
  },
  perfectItem: {
    position: 'relative',
    aspectRatio: '3/4',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    cursor: 'pointer',
  },
  perfectImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  perfectOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: '0.4rem',
    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  perfectName: {
    color: 'rgba(245,240,232,0.95)',
    fontSize: '0.6rem',
    fontFamily: '"Noto Serif SC", serif',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    padding: '0 1.5rem 2.5rem',
  },
  card: {
    minHeight: 120,
    backgroundColor: 'var(--card-bg, #F5F0E8)',
    border: '1px solid var(--card-border, rgba(26,23,20,0.08))',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'stretch',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    padding: 0,
    transition: 'background-color 0.3s ease, border-color 0.3s ease, transform 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
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
  deleteBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.68rem',
    color: 'rgba(26,23,20,0.28)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    marginTop: '0.2rem',
    alignSelf: 'flex-start',
  },
  deleteHint: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.66rem',
    color: 'rgba(26,23,20,0.38)',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
  confirmBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.68rem',
    color: 'rgba(26,23,20,0.55)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    flexShrink: 0,
  },
  cancelBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.68rem',
    color: 'rgba(26,23,20,0.28)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    flexShrink: 0,
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
