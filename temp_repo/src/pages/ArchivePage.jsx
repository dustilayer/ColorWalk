import { useState } from 'react'
import { getWalks } from '../utils/archive'
import EndPage from './EndPage'

const MODE_LABELS = { single: '单色', free: '多色' }
const STRICT_LABELS = { ambient: '氛围漫游', hunter: '色彩猎人', precise: '精准采集' }

function formatDate(isoString) {
  const d = new Date(isoString)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
}

function WalkCard({ record, onClick }) {
  const { themeGradient, collectedColors, mode, strictLevel, date } = record
  const firstPhoto = collectedColors[0]?.photoUrl
  const firstColor = collectedColors[0]?.hex || '#9A9A9A'

  return (
    <button style={styles.card} onClick={onClick}>
      {/* 左：主题色带竖条 */}
      <div style={{
        width: 8,
        flexShrink: 0,
        alignSelf: 'stretch',
        background: `linear-gradient(to bottom, ${themeGradient.start.hex}, ${themeGradient.end.hex})`,
      }} />

      {/* 中：照片缩略图 */}
      <div style={styles.thumbWrap}>
        {firstPhoto
          ? <img src={firstPhoto} alt="" style={styles.thumb} />
          : <div style={{ ...styles.thumb, backgroundColor: firstColor }} />
        }
      </div>

      {/* 右：文字信息 */}
      <div style={styles.meta}>
        <span style={styles.metaDate}>{formatDate(date)}</span>
        <div style={styles.metaTags}>
          <span style={styles.tag}>{MODE_LABELS[mode]}</span>
          <span style={styles.tag}>{STRICT_LABELS[strictLevel]}</span>
        </div>
        {mode === 'free' && collectedColors.length > 0 && (
          <span style={styles.metaCount}>{collectedColors.length} 个颜色</span>
        )}
      </div>
    </button>
  )
}

export default function ArchivePage({ onStartWalk }) {
  const [walks] = useState(() => getWalks())
  const [detail, setDetail] = useState(null)

  if (detail) {
    return <EndPage record={detail} readonly onBack={() => setDetail(null)} />
  }

  return (
    <div className="page-enter" style={styles.root}>
      <div style={styles.topNav}>
        <h1 style={styles.title}>档案</h1>
        <button style={styles.startBtn} onClick={onStartWalk}>去采集 →</button>
      </div>

      {walks.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>还没有漫步记录</p>
          <p style={styles.emptyHint}>完成一次 Color Walk 并存入档案后在这里查看</p>
        </div>
      ) : (
        <div style={styles.list}>
          {walks.map((record) => (
            <WalkCard key={record.id} record={record} onClick={() => setDetail(record)} />
          ))}
        </div>
      )}
    </div>
  )
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '2.5rem 1.5rem 1.25rem',
  },
  title: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: 400,
    color: '#1A1714',
    margin: 0,
    letterSpacing: '0.05em',
  },
  startBtn: {
    background: 'none',
    border: 'none',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: '#7A6A5A',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    padding: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
    padding: '0 1.5rem 2.5rem',
  },
  card: {
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(26,23,20,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'stretch',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    padding: 0,
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
    color: '#1A1714',
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
    color: '#7A6A5A',
    border: '1px solid rgba(26,23,20,0.18)',
    borderRadius: 20,
    padding: '0.15rem 0.5rem',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  metaCount: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.72rem',
    color: '#9A8A7A',
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
    color: '#7A6A5A',
    margin: 0,
    letterSpacing: '0.08em',
  },
  emptyHint: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.78rem',
    color: 'rgba(26,23,20,0.3)',
    margin: 0,
    letterSpacing: '0.04em',
    textAlign: 'center',
    lineHeight: 1.7,
  },
}
