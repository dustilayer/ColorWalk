import { useState } from 'react'

const MODES = [
  { id: 'single', title: '传统 Color Walk', desc: '整次漫步只锁定一个颜色，选择即决定' },
  { id: 'free',   title: '自由采集',        desc: '随心收集，无数量限制，结束生成调色盘' },
]

const LEVELS = [
  { id: 'ambient', title: '氛围漫游', desc: '主题色只是氛围参考，无任何匹配提示' },
  { id: 'hunter',  title: '色彩猎人', desc: '显示色相接近度指示，感受而不强制' },
  { id: 'precise', title: '精准采集', desc: '实时匹配度百分比，≥80% 准星高亮' },
]

// 通用选项卡片：position:relative + absolute accent 竖线
function OptionCard({ selected, onClick, title, desc, large }) {
  return (
    <button
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        textAlign: 'left',
        border: `1px solid rgba(26,23,20,${selected ? '0.2' : '0.1'})`,
        borderRadius: large ? 14 : 11,
        backgroundColor: selected ? 'rgba(26,23,20,0.07)' : 'rgba(255,255,255,0.55)',
        padding: large ? '1.1rem 1.1rem 1.1rem 1.3rem' : '0.8rem 1rem 0.8rem 1.2rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: large ? '0.45rem' : '0.28rem',
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
      }}
      onClick={onClick}
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
        color: '#1A1714',
        letterSpacing: '0.04em',
        display: 'block',
      }}>
        {title}
      </span>
      <span style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: large ? '0.8rem' : '0.75rem',
        color: '#7A6A5A',
        lineHeight: 1.6,
        display: 'block',
      }}>
        {desc}
      </span>
    </button>
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
  const [mode,  setMode]  = useState('single')
  const [level, setLevel] = useState('ambient')

  return (
    <div className="page-enter" style={styles.root}>

      {/* 顶部 */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← 返回</button>
        <h1 style={styles.title}>出发设定</h1>
        <p style={styles.subtitle}>每次漫步前独立设置</p>
      </div>

      {/* 采集方式 */}
      <div style={styles.section}>
        <SectionLabel>采集方式</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {MODES.map(m => (
            <OptionCard
              key={m.id}
              selected={mode === m.id}
              onClick={() => setMode(m.id)}
              title={m.title}
              desc={m.desc}
              large
            />
          ))}
        </div>
      </div>

      {/* 漫游节奏 */}
      <div style={styles.section}>
        <SectionLabel>漫游节奏</SectionLabel>
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
        <button style={styles.btnStart} onClick={() => onNext(mode, level)}>
          开始漫步
        </button>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100dvh',
    backgroundColor: '#F5F0E8',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 1.5rem',
    boxSizing: 'border-box',
  },
  header: {
    paddingTop: '3rem',
    paddingBottom: '1.75rem',
  },
  backBtn: {
    background: 'none', border: 'none', padding: 0,
    marginBottom: '1.25rem', display: 'block',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem', color: '#7A6A5A',
    cursor: 'pointer', letterSpacing: '0.05em',
  },
  title: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '2rem', fontWeight: 400,
    color: '#1A1714', margin: '0 0 0.3rem',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.82rem', color: '#9A8A7A',
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
    backgroundColor: 'rgba(255,255,255,0.88)',
    color: '#1A1714',
    border: '1px solid rgba(26,23,20,0.15)',
    borderRadius: 16, padding: '1rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem', letterSpacing: '0.1em',
    cursor: 'pointer',
  },
}
