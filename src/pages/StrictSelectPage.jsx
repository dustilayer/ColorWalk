import { useState } from 'react'

const LEVELS = [
  {
    id: 'ambient',
    title: '氛围漫游',
    desc: '主题色只是出发氛围的参考\n采集无限制，无匹配提示',
  },
  {
    id: 'hunter',
    title: '色彩猎人',
    desc: '采集时显示色相接近度指示\n感受偏差，不强制对齐',
  },
  {
    id: 'precise',
    title: '精准采集',
    desc: '实时显示匹配度百分比\n匹配度 ≥ 80% 时准星变色',
  },
]

export default function StrictSelectPage({ onNext, onBack }) {
  const [selected, setSelected] = useState('ambient')

  return (
    <div className="page-enter" style={styles.root}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← 返回</button>
        <h1 style={styles.title}>设定漫游节奏</h1>
        <p style={styles.subtitle}>决定这次漫步的专注程度</p>
      </div>

      <div style={styles.options}>
        {LEVELS.map((level, idx) => {
          const isSelected = selected === level.id
          return (
            <button
              key={level.id}
              style={{
                ...styles.optionCard,
                borderColor: isSelected ? '#1A1714' : 'rgba(26,23,20,0.12)',
                borderWidth: isSelected ? 1.5 : 1,
              }}
              onClick={() => setSelected(level.id)}
            >
              <div style={styles.optionInner}>
                <div style={styles.indexWrap}>
                  <span
                    style={{
                      ...styles.indexNum,
                      color: isSelected ? '#1A1714' : 'rgba(26,23,20,0.25)',
                    }}
                  >
                    {['一', '二', '三'][idx]}
                  </span>
                </div>
                <div style={styles.optionText}>
                  <span style={styles.optionTitle}>{level.title}</span>
                  <span style={styles.optionDesc}>{level.desc}</span>
                </div>
                {isSelected && <div style={styles.selectedMark}>·</div>}
              </div>
            </button>
          )
        })}
      </div>

      <div style={styles.actions}>
        <button style={styles.btnPrimary} onClick={() => onNext(selected)}>
          进入采集
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
  indexWrap: {
    flexShrink: 0,
    paddingTop: 2,
  },
  indexNum: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1rem',
    transition: 'color 0.3s ease-in-out',
  },
  optionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    flex: 1,
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
  selectedMark: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '1.5rem',
    color: '#1A1714',
    lineHeight: 1,
    alignSelf: 'center',
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
