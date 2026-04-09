import { useState } from 'react'

const MODES = [
  {
    id: 'single',
    title: '传统 Color Walk',
    desc: '整次漫步只锁定一个颜色\n选择即决定，不可更改',
  },
  {
    id: 'free',
    title: '自由采集',
    desc: '随心收集，无数量限制\n结束时生成调色盘色卡',
  },
]

export default function ModeSelectPage({ onNext, onBack }) {
  const [selected, setSelected] = useState('single')

  return (
    <div className="page-enter" style={styles.root}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← 返回</button>
        <h1 style={styles.title}>选择采集方式</h1>
        <p style={styles.subtitle}>每次漫步前选择一种</p>
      </div>

      <div style={styles.options}>
        {MODES.map((mode) => {
          const isSelected = selected === mode.id
          return (
            <button
              key={mode.id}
              style={{
                ...styles.optionCard,
                borderColor: isSelected ? '#1A1714' : 'rgba(26,23,20,0.12)',
                borderWidth: isSelected ? 1.5 : 1,
              }}
              onClick={() => setSelected(mode.id)}
            >
              <div style={styles.optionInner}>
                <div style={styles.optionDot}>
                  <div
                    style={{
                      ...styles.dot,
                      backgroundColor: isSelected ? '#1A1714' : 'transparent',
                      border: `1.5px solid ${isSelected ? '#1A1714' : 'rgba(26,23,20,0.3)'}`,
                    }}
                  />
                </div>
                <div style={styles.optionText}>
                  <span style={styles.optionTitle}>{mode.title}</span>
                  <span style={styles.optionDesc}>{mode.desc}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div style={styles.actions}>
        <button style={styles.btnPrimary} onClick={() => onNext(selected)}>
          下一步
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
    padding: '0 2rem',
    boxSizing: 'border-box',
  },
  header: {
    paddingTop: '3rem',
    paddingBottom: '2.5rem',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    marginBottom: '1.5rem',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: '#7A6A5A',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    display: 'block',
  },
  title: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: 400,
    color: '#1A1714',
    margin: '0 0 0.4rem',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: '#7A6A5A',
    margin: 0,
    letterSpacing: '0.08em',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    border: '1px solid rgba(26,23,20,0.12)',
    borderRadius: 16,
    padding: '1.25rem',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'border-color 0.3s ease-in-out',
  },
  optionInner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  optionDot: {
    paddingTop: 3,
    flexShrink: 0,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    transition: 'background-color 0.3s ease-in-out, border-color 0.3s ease-in-out',
  },
  optionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  optionTitle: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    color: '#1A1714',
    letterSpacing: '0.05em',
    display: 'block',
  },
  optionDesc: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.8rem',
    color: '#7A6A5A',
    letterSpacing: '0.03em',
    lineHeight: 1.6,
    whiteSpace: 'pre-line',
    display: 'block',
  },
  actions: {
    marginTop: 'auto',
    paddingBottom: '3rem',
    paddingTop: '2rem',
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
}
