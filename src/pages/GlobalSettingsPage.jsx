import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { playClick, setClickVolume, setCaptureVolume, setBgmVolume } from '../utils/audio'
import { useLanguage } from '../contexts/LanguageContext'
import {
  getStats,
  getTopColorNames,
  getAveragePhotosPerWalk,
  getTotalAchievements,
} from '../utils/statsUtils'
import { getReportOptIn, setReportOptIn } from '../utils/reportStats'

function pickFavoritePacing(strictLevelCount, t) {
  const order = ['precise', 'hunter', 'ambient']
  let best = null
  let bestCount = -1
  for (const k of order) {
    const c = strictLevelCount[k] || 0
    if (c > bestCount) { best = k; bestCount = c }
  }
  if (bestCount <= 0) return null
  return t(best)
}

export default function GlobalSettingsPage({ onBack }) {
  const { t, lang, changeLang } = useLanguage()
  const [clickVol, setClickVol] = useState(0.5)
  const [captureVol, setCaptureVol] = useState(0.5)
  const [bgmVol, setBgmVol] = useState(0.5)
  const [theme, setTheme] = useState('system')
  const [stats] = useState(() => getStats())
  const [topColors] = useState(() => getTopColorNames(3))
  const [reportOptIn, setReportOptInState] = useState(() => getReportOptIn())

  const totalAchievements = getTotalAchievements()
  const avgPhotos = getAveragePhotosPerWalk()
  const favoritePacing = pickFavoritePacing(stats.strictLevelCount, t)
  const warmCoolTotal = stats.warmColorCount + stats.coolColorCount
  const warmPct = warmCoolTotal > 0 ? Math.round((stats.warmColorCount / warmCoolTotal) * 100) : 0
  const coolPct = warmCoolTotal > 0 ? 100 - warmPct : 0
  const hasData = stats.totalWalks > 0

  const handleToggleOptIn = () => {
    const next = !reportOptIn
    setReportOptInState(next)
    setReportOptIn(next)
    playClick()
  }

  useEffect(() => {
    // Load from localStorage
    const savedClick = localStorage.getItem('clickVolume')
    const savedCapture = localStorage.getItem('captureVolume')
    const savedBgm = localStorage.getItem('bgmVolume')
    const savedTheme = localStorage.getItem('appTheme')
    
    if (savedClick !== null) setClickVol(parseFloat(savedClick))
    if (savedCapture !== null) setCaptureVol(parseFloat(savedCapture))
    if (savedBgm !== null) setBgmVol(parseFloat(savedBgm))
    if (savedTheme !== null) setTheme(savedTheme)
  }, [])

  const handleClickVolChange = (e) => {
    const val = parseFloat(e.target.value)
    setClickVol(val)
    setClickVolume(val)
    localStorage.setItem('clickVolume', val)
    playClick()
  }

  const handleCaptureVolChange = (e) => {
    const val = parseFloat(e.target.value)
    setCaptureVol(val)
    setCaptureVolume(val)
    localStorage.setItem('captureVolume', val)
    playClick()
  }

  const handleBgmVolChange = (e) => {
    const val = parseFloat(e.target.value)
    setBgmVol(val)
    setBgmVolume(val)
    localStorage.setItem('bgmVolume', val)
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('appTheme', newTheme)
    // Apply theme to body
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme')
      document.body.classList.remove('light-theme')
    } else if (newTheme === 'light') {
      document.body.classList.add('light-theme')
      document.body.classList.remove('dark-theme')
    } else {
      document.body.classList.remove('dark-theme', 'light-theme')
    }
    playClick()
  }

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
        <h1 style={styles.title}>{t('settings')}</h1>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('language')}</h2>
        <div style={styles.card}>
          <div style={styles.themeGroup}>
            {['zh', 'en', 'ja', 'ko'].map(l => (
              <motion.button
                key={l}
                style={{
                  ...styles.themeBtn,
                  backgroundColor: lang === l ? 'rgba(26,23,20,0.08)' : 'transparent',
                  borderColor: lang === l ? 'rgba(26,23,20,0.2)' : 'transparent',
                }}
                onClick={() => { changeLang(l); playClick(); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {l === 'zh' ? '中文' : l === 'en' ? 'EN' : l === 'ja' ? '日本語' : '한국어'}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('myReport')}</h2>
        <div style={styles.card}>
          {!hasData ? (
            <p style={styles.emptyHint}>{t('noReportData')}</p>
          ) : (
            <>
              <div style={styles.reportRow}>
                <span style={styles.label}>{t('reportTotalWalks')}</span>
                <span style={styles.reportValue}>{stats.totalWalks} {t('reportTimes')}</span>
              </div>

              {favoritePacing && (
                <>
                  <div style={styles.divider} />
                  <div style={styles.reportRow}>
                    <span style={styles.label}>{t('reportFavoritePacing')}</span>
                    <span style={styles.reportValue}>{favoritePacing}</span>
                  </div>
                </>
              )}

              <div style={styles.divider} />
              <div style={styles.reportRow}>
                <span style={styles.label}>{t('reportAvgColors')}</span>
                <span style={styles.reportValue}>{avgPhotos.toFixed(1)} {t('reportColorsUnit')}</span>
              </div>

              {warmCoolTotal > 0 && (
                <>
                  <div style={styles.divider} />
                  <div style={{ ...styles.reportColumn }}>
                    <span style={styles.label}>{t('reportWarmCool')}</span>
                    <div style={styles.warmCoolBar}>
                      <div style={{
                        ...styles.warmCoolFill,
                        width: `${warmPct}%`,
                        background: 'linear-gradient(90deg, #F4845F, #E8504A)',
                      }} />
                      <div style={{
                        ...styles.warmCoolFill,
                        width: `${coolPct}%`,
                        background: 'linear-gradient(90deg, #3D9BE9, #5B8DB8)',
                      }} />
                    </div>
                    <div style={styles.warmCoolLegend}>
                      <span>{t('reportWarm')} {warmPct}%</span>
                      <span>{t('reportCool')} {coolPct}%</span>
                    </div>
                  </div>
                </>
              )}

              {topColors.length > 0 && (
                <>
                  <div style={styles.divider} />
                  <div style={styles.reportColumn}>
                    <span style={styles.label}>{t('reportTopColors')}</span>
                    <div style={styles.topColorsRow}>
                      {topColors.map((c, i) => (
                        <div key={i} style={styles.topColorItem}>
                          <div style={{
                            ...styles.topColorSwatch,
                            backgroundColor: c.hex || '#CCC',
                          }} />
                          <span style={styles.topColorName}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={styles.divider} />
              <div style={styles.reportRow}>
                <span style={styles.label}>{t('reportAchievements')}</span>
                <span style={styles.reportValue}>{stats.achievementsUnlocked}/{totalAchievements}</span>
              </div>

              <div style={styles.divider} />
              <div style={styles.reportRow}>
                <span style={styles.label}>{t('reportStreak')}</span>
                <span style={styles.reportValue}>{stats.consecutiveDays} {t('reportDays')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.row}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, paddingRight: '1rem' }}>
              <span style={styles.label}>{t('reportImprove')}</span>
              <span style={styles.optInHint}>{t('reportImproveHint')}</span>
            </div>
            <button
              onClick={handleToggleOptIn}
              style={{
                ...styles.toggle,
                backgroundColor: reportOptIn ? 'rgba(26,23,20,0.8)' : 'rgba(26,23,20,0.15)',
              }}
              aria-pressed={reportOptIn}
            >
              <span style={{
                ...styles.toggleKnob,
                transform: reportOptIn ? 'translateX(20px)' : 'translateX(0)',
              }} />
            </button>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('audioSettings')}</h2>
        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.label}>{t('clickVol')}</span>
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={clickVol} 
              onChange={handleClickVolChange}
              style={styles.slider}
            />
          </div>
          <div style={styles.divider} />
          <div style={styles.row}>
            <span style={styles.label}>{t('captureVol')}</span>
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={captureVol} 
              onChange={handleCaptureVolChange}
              style={styles.slider}
            />
          </div>
          <div style={styles.divider} />
          <div style={styles.row}>
            <span style={styles.label}>{t('bgmVol')}</span>
            <input 
              type="range" 
              min="0" max="1" step="0.05" 
              value={bgmVol} 
              onChange={handleBgmVolChange}
              style={styles.slider}
            />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('themeColor')}</h2>
        <div style={styles.card}>
          <div style={styles.themeGroup}>
            {['light', 'dark', 'system'].map(tOption => (
              <motion.button
                key={tOption}
                style={{
                  ...styles.themeBtn,
                  backgroundColor: theme === tOption ? 'rgba(26,23,20,0.08)' : 'transparent',
                  borderColor: theme === tOption ? 'rgba(26,23,20,0.2)' : 'transparent',
                }}
                onClick={() => handleThemeChange(tOption)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t(tOption)}
              </motion.button>
            ))}
          </div>
        </div>
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
    color: 'var(--text-color, #1A1714)',
    transition: 'background-color 0.3s ease, color 0.3s ease',
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
    margin: '0 0 0.3rem',
    letterSpacing: '0.05em',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: 'var(--text-muted, #9A8A7A)',
    letterSpacing: '0.1em',
    marginBottom: '0.75rem',
    fontWeight: 'normal',
  },
  card: {
    backgroundColor: 'var(--card-bg, rgba(255,255,255,0.55))',
    borderRadius: 16,
    padding: '1rem 1.25rem',
    border: '1px solid var(--card-border, rgba(26,23,20,0.08))',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  label: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.95rem',
  },
  slider: {
    flex: 1,
    accentColor: 'var(--text-color, #1A1714)',
  },
  divider: {
    height: 1,
    backgroundColor: 'var(--card-border, rgba(26,23,20,0.08))',
    margin: '1rem 0',
  },
  themeGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  themeBtn: {
    flex: 1,
    padding: '0.75rem 0',
    borderRadius: 10,
    border: '1px solid transparent',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.9rem',
    color: 'var(--text-color, #1A1714)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyHint: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.85rem',
    color: 'var(--text-muted, #7A6A5A)',
    margin: 0,
    textAlign: 'center',
    padding: '0.5rem 0',
    letterSpacing: '0.05em',
  },
  reportRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  reportColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  reportValue: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.95rem',
    color: 'var(--text-color, #1A1714)',
    letterSpacing: '0.05em',
  },
  warmCoolBar: {
    display: 'flex',
    width: '100%',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(26,23,20,0.06)',
  },
  warmCoolFill: {
    height: '100%',
  },
  warmCoolLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.78rem',
    color: 'var(--text-muted, #7A6A5A)',
    letterSpacing: '0.05em',
  },
  topColorsRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  topColorItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    flex: 1,
  },
  topColorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.7)',
    boxShadow: '0 2px 6px rgba(26,23,20,0.08)',
  },
  topColorName: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.78rem',
    color: 'var(--text-color, #1A1714)',
    letterSpacing: '0.05em',
    textAlign: 'center',
  },
  optInHint: {
    fontFamily: '"Noto Serif SC", Georgia, serif',
    fontSize: '0.75rem',
    color: 'var(--text-muted, #7A6A5A)',
    lineHeight: 1.4,
    letterSpacing: '0.02em',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    padding: 2,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  },
  toggleKnob: {
    display: 'block',
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: '#F5F0E8',
    transition: 'transform 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
}
