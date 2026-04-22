import { useState } from 'react'
import { motion } from 'motion/react'
import { playClick } from '../utils/audio'
import { useLanguage } from '../contexts/LanguageContext'

// 通用选项卡片：position:relative + absolute accent 竖线
function OptionCard({ selected, onClick, title, desc, large }) {
  return (
    <motion.button
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        textAlign: 'left',
        border: `1px solid var(--card-border, rgba(26,23,20,0.1))`,
        borderRadius: large ? 14 : 11,
        backgroundColor: selected ? 'var(--card-border, rgba(26,23,20,0.07))' : 'var(--card-bg, rgba(255,255,255,0.55))',
        padding: large ? '1.1rem 1.1rem 1.1rem 1.3rem' : '0.8rem 1rem 0.8rem 1.2rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: large ? '0.45rem' : '0.28rem',
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        boxShadow: selected ? '0 0 0 2px rgba(26,23,20,0.1), 0 4px 12px rgba(26,23,20,0.05)' : 'none',
      }}
      onClick={() => { onClick(); playClick(); }}
      whileHover={{ scale: 1.02, backgroundColor: selected ? 'rgba(26,23,20,0.07)' : 'rgba(255,255,255,0.8)' }}
      whileTap={{ scale: 0.98 }}
      whileFocus={{ scale: 1.02, boxShadow: '0 0 0 2px rgba(26,23,20,0.2)' }}
    >
      {/* 左侧 3px 竖线（选中时才渲染） */}
      {selected && (
        <span style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          backgroundColor: '#1A1714',
          borderRadius: '14px 0 0 14px',
        }} />
      )}

      <span style={{
        fontFamily: '"Noto Serif SC", Georgia, serif',
        fontSize: large ? '1rem' : '0.875rem',
        color: 'var(--text-color, #1A1714)',
        letterSpacing: '0.04em',
        display: 'block',
      }}>
        {title}
      </span>
      <span style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: large ? '0.8rem' : '0.75rem',
        color: 'var(--text-muted, #7A6A5A)',
        lineHeight: 1.6,
        display: 'block',
      }}>
        {desc}
      </span>
    </motion.button>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 0.75rem' }}>
      <span style={{
        fontFamily: '"Noto Serif SC", Georgia, serif',
        fontSize: '0.73rem',
        color: '#9A8A7A',
        letterSpacing: '0.15em',
        whiteSpace: 'nowrap',
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(26,23,20,0.1)' }} />
    </div>
  )
}

export default function SettingsPage({ onNext, onBack }) {
  const { t } = useLanguage()
  const [level, setLevel] = useState('ambient')

  const LEVELS = [
    { id: 'ambient', title: t('ambient'), desc: t('ambientDesc') },
    { id: 'hunter',  title: t('hunter'),  desc: t('hunterDesc') },
    { id: 'precise', title: t('precise'), desc: t('preciseDesc') },
  ]

  return (
    <div className="page-enter" style={styles.root}>

      {/* 顶部 */}
      <div style={styles.header}>
        <motion.button 
          style={styles.backBtn} 
          onClick={() => { onBack(); playClick(); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >← {t('back')}</motion.button>
        <h1 style={styles.title}>{t('departureSettings')}</h1>
        <p style={styles.subtitle}>{t('independentSettings')}</p>
      </div>

      {/* 漫游节奏 */}
      <div style={styles.section}>
        <SectionLabel>{t('pacing')}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {LEVELS.map(lv => (
            <OptionCard
              key={lv.id}
              selected={level === lv.id}
              onClick={() => setLevel(lv.id)}
              title={lv.title}
              desc={lv.desc}
              large={false}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* 底部按钮 */}
      <div style={styles.bottomArea}>
        <motion.button 
          style={styles.btnStart} 
          onClick={() => { onNext('free', level); playClick(); }}
          whileHover={{ scale: 1.02, backgroundColor: '#F5F0E8' }}
          whileTap={{ scale: 0.98 }}
        >
          {t('startWalk')}
        </motion.button>
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
    padding: '0 1.5rem',
    boxSizing: 'border-box',
    transition: 'background-color 0.3s ease',
  },
  header: {
    paddingTop: '3rem',
    paddingBottom: '1.75rem',
  },
  backBtn: {
    background: 'none', border: 'none', padding: 0,
    marginBottom: '1.25rem', display: 'block',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem', color: 'var(--text-muted, #7A6A5A)',
    cursor: 'pointer', letterSpacing: '0.05em',
  },
  title: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '2rem', fontWeight: 400,
    color: 'var(--text-color, #1A1714)', margin: '0 0 0.3rem',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.82rem', color: 'var(--text-muted, #9A8A7A)',
    margin: 0, letterSpacing: '0.08em',
  },
  section: {
    marginBottom: '1.75rem',
  },
  bottomArea: {
    paddingTop: '0.75rem',
    paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
  },
  btnStart: {
    width: '100%',
    backgroundColor: 'var(--card-bg, rgba(255,255,255,0.88))',
    color: 'var(--text-color, #1A1714)',
    border: '1px solid var(--card-border, rgba(26,23,20,0.15))',
    borderRadius: 16, padding: '1rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem', letterSpacing: '0.1em',
    cursor: 'pointer',
  },
}
