import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useLanguage } from '../contexts/LanguageContext'
import { achievements, ACHIEVEMENT_CATEGORIES } from '../data/achievements'
import { getUnlockedAchievements } from '../utils/achievementUtils'
import InkPattern from '../components/InkPattern'

function formatUnlockDate(isoString) {
  const d = new Date(isoString)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function AchievementCard({ achievement, unlockData, lang }) {
  const unlocked = !!unlockData
  const name = typeof achievement.name === 'object'
    ? (achievement.name[lang] || achievement.name.zh)
    : achievement.name
  const desc = typeof achievement.desc === 'object'
    ? (achievement.desc[lang] || achievement.desc.zh)
    : achievement.desc

  return (
    <motion.div
      style={{
        backgroundColor: '#F5F0E8',
        border: '1px solid rgba(26,23,20,0.1)',
        borderRadius: 12,
        padding: '1.25rem 0.875rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.625rem',
        opacity: unlocked ? 1 : 0.45,
        textAlign: 'center',
        transition: 'opacity 0.3s ease',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: unlocked ? 1 : 0.45, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Ink pattern area — 80×80 */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: unlocked ? 'rgba(26,23,20,0.05)' : 'rgba(26,23,20,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <InkPattern id={achievement.id} size={56} locked={!unlocked} />
      </div>

      {/* Achievement name */}
      <span style={{
        fontFamily: '"Noto Serif SC", Georgia, serif',
        fontSize: '0.9rem',
        color: '#1A1714',
        letterSpacing: '0.06em',
        lineHeight: 1.3,
      }}>
        {unlocked ? name : '？？'}
      </span>

      {/* Unlock date or locked hint */}
      <span style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.65rem',
        color: '#9A8A7A',
        letterSpacing: '0.04em',
        lineHeight: 1.4,
      }}>
        {unlocked
          ? formatUnlockDate(unlockData.unlockedAt)
          : desc
        }
      </span>
    </motion.div>
  )
}

export default function AchievementPage({ onBack }) {
  const { t, lang } = useLanguage()

  const unlocked = useMemo(() => getUnlockedAchievements(), [])

  const unlockedCount = Object.keys(unlocked).length
  const totalCount = achievements.length

  const byCategory = useMemo(() => {
    const map = {}
    achievements.forEach(a => {
      if (!map[a.category]) map[a.category] = []
      map[a.category].push(a)
    })
    return map
  }, [])

  function getCategoryName(cat) {
    const found = ACHIEVEMENT_CATEGORIES.find(c => c.id === cat)
    if (!found) return cat
    return typeof found.name === 'object'
      ? (found.name[lang] || found.name.zh)
      : found.name
  }

  return (
    <div className="page-enter" style={styles.root}>
      {/* Header */}
      <div style={styles.topNav}>
        <motion.button
          style={styles.backBtn}
          onClick={() => { onBack(); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← {t('back')}
        </motion.button>
      </div>

      <div style={styles.titleRow}>
        <h1 style={styles.title}>{t('achievements')}</h1>
        <span style={styles.counter}>
          {unlockedCount} / {totalCount}
        </span>
      </div>

      {/* Category sections */}
      <div style={styles.content}>
        {ACHIEVEMENT_CATEGORIES.map(cat => {
          const items = byCategory[cat.id] || []
          return (
            <div key={cat.id} style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionDot} />
                <span style={styles.sectionTitle}>{getCategoryName(cat.id)}</span>
                <span style={styles.sectionCount}>
                  {items.filter(a => !!unlocked[a.id]).length}/{items.length}
                </span>
              </div>

              <div style={styles.grid}>
                {items.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    unlockData={unlocked[achievement.id] || null}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )
        })}

        <div style={{ height: 'calc(2rem + env(safe-area-inset-bottom))' }} />
      </div>
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
    padding: '2.5rem 1.5rem 0',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: '#7A6A5A',
    cursor: 'pointer',
    letterSpacing: '0.05em',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem 1.5rem',
  },
  title: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: 400,
    color: 'var(--text-color, #1A1714)',
    margin: 0,
    letterSpacing: '0.05em',
  },
  counter: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.85rem',
    color: 'var(--text-muted, #7A6A5A)',
    letterSpacing: '0.06em',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 1.5rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.875rem',
  },
  sectionDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: '#1A1714',
    opacity: 0.4,
    flexShrink: 0,
  },
  sectionTitle: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.8rem',
    color: 'var(--text-muted, #7A6A5A)',
    letterSpacing: '0.1em',
    flex: 1,
  },
  sectionCount: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.7rem',
    color: 'var(--text-muted, #9A8A7A)',
    letterSpacing: '0.04em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
}
