import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '../contexts/LanguageContext'
import { playAchievementUnlock } from '../utils/audio'
import InkPattern from './InkPattern'

export default function AchievementToast({ newAchievements, themeColor }) {
  const { lang } = useLanguage()
  const [displayIndex, setDisplayIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!newAchievements || newAchievements.length === 0) return

    let idx = 0

    function show() {
      if (idx >= newAchievements.length) return
      setDisplayIndex(idx)
      setVisible(true)
      playAchievementUnlock()

      timerRef.current = setTimeout(() => {
        setVisible(false)
        idx++
        if (idx < newAchievements.length) {
          timerRef.current = setTimeout(show, 1500)
        }
      }, 2500)
    }

    show()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [newAchievements])

  if (!newAchievements || newAchievements.length === 0) return null

  const current = newAchievements[displayIndex]
  if (!current) return null

  const name = typeof current.name === 'object'
    ? (current.name[lang] || current.name.zh)
    : current.name

  const accentColor = themeColor || '#1A1714'

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '0 1.5rem calc(3rem + env(safe-area-inset-bottom))',
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 64 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#F5F0E8',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(26,23,20,0.18), 0 2px 8px rgba(26,23,20,0.1)',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            {/* Accent line — theme start color */}
            <div style={{ height: 3, backgroundColor: accentColor }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.875rem 1.25rem',
            }}>
              {/* Ink pattern placeholder */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(26,23,20,0.05)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <InkPattern id={current.id} size={28} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: '"Noto Serif SC", Georgia, serif',
                  fontSize: 16,
                  color: '#1A1714',
                  letterSpacing: '0.08em',
                  lineHeight: 1.3,
                }}>
                  {name}
                </div>
                <div style={{
                  fontFamily: '"Noto Serif SC", Georgia, serif',
                  fontSize: 12,
                  color: '#7A6A5A',
                  letterSpacing: '0.06em',
                  marginTop: 4,
                }}>
                  成就解锁
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
