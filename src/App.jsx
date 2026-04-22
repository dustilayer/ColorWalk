import { useState, useEffect, useRef } from 'react'
import ThemeGenPage from './pages/ThemeGenPage'
import SettingsPage from './pages/SettingsPage'
import GlobalSettingsPage from './pages/GlobalSettingsPage'
import CameraPage from './pages/CameraPage'
import EndPage from './pages/EndPage'
import ArchivePage from './pages/ArchivePage'
import AchievementPage from './pages/AchievementPage'
import { setClickVolume, setCaptureVolume, setBgmVolume, getBgmVolume } from './utils/audio'
import { LanguageProvider } from './contexts/LanguageContext'
import { savePhoto, photoKey } from './utils/storage'
import './App.css'

const SCHEMA_VERSION = '1.0'
const BGM_TRACKS = ['/audio/bgm.mp3', '/audio/bgm1.mp3']

function getRandomNextIdx(current, total) {
  if (total <= 1) return 0
  let next
  do { next = Math.floor(Math.random() * total) } while (next === current)
  return next
}

// Migrate old records that stored base64 photoUrls in localStorage → IndexedDB
async function migrateToV1() {
  try {
    const key = 'colorwalk_archive_v4'
    const raw = localStorage.getItem(key)
    if (!raw) return
    const walks = JSON.parse(raw)
    let changed = false

    for (const walk of walks) {
      for (let i = 0; i < (walk.collectedColors || []).length; i++) {
        const c = walk.collectedColors[i]
        if (c.photoUrl && c.photoUrl.startsWith('data:')) {
          await savePhoto(photoKey(walk.id, i), c.photoUrl)
          delete c.photoUrl
          changed = true
        }
      }
    }

    if (changed) {
      localStorage.setItem(key, JSON.stringify(walks))
    }
  } catch (e) {
    // Migration failed — degrade gracefully, never clear data
    console.warn('[ColorWalk] Schema migration failed:', e)
  }
}

function AppContent() {
  const [step, setStep] = useState('theme')
  const [walkConfig, setWalkConfig] = useState({})
  const [currentRecord, setCurrentRecord] = useState(null)
  const [bgmMuted, setBgmMutedState] = useState(
    () => localStorage.getItem('bgmMuted') === 'true'
  )
  const [currentTrackIdx, setCurrentTrackIdx] = useState(
    () => Math.floor(Math.random() * BGM_TRACKS.length)
  )
  const isFirstTrackRender = useRef(true)

  // ── Schema version check ─────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('colorwalk_schema_version')
    if (stored !== SCHEMA_VERSION) {
      migrateToV1().then(() => {
        localStorage.setItem('colorwalk_schema_version', SCHEMA_VERSION)
      })
    }
  }, [])

  // ── App settings ─────────────────────────────────────────────────
  useEffect(() => {
    const savedClick   = localStorage.getItem('clickVolume')
    const savedCapture = localStorage.getItem('captureVolume')
    const savedBgm     = localStorage.getItem('bgmVolume')
    const savedTheme   = localStorage.getItem('appTheme')

    if (savedClick   !== null) setClickVolume(parseFloat(savedClick))
    if (savedCapture !== null) setCaptureVolume(parseFloat(savedCapture))
    setBgmVolume(savedBgm !== null ? parseFloat(savedBgm) : 0.3)

    if (savedTheme === 'dark')  document.body.classList.add('dark-theme')
    else if (savedTheme === 'light') document.body.classList.add('light-theme')
  }, [])

  // ── BGM: first user interaction ──────────────────────────────────
  useEffect(() => {
    function handleFirstInteraction() {
      const bgm = document.getElementById('bgm-player')
      if (bgm && bgm.paused && !bgmMuted) {
        bgm.volume = getBgmVolume()
        bgm.play().catch(() => {})
      }
      window.removeEventListener('click',      handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
    window.addEventListener('click',      handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)
    return () => {
      window.removeEventListener('click',      handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [bgmMuted])

  // ── BGM: track change (skip on initial mount to respect autoplay policy) ──
  useEffect(() => {
    if (isFirstTrackRender.current) {
      isFirstTrackRender.current = false
      return
    }
    const bgm = document.getElementById('bgm-player')
    if (bgm && !bgmMuted) {
      bgm.volume = getBgmVolume()
      bgm.play().catch(() => {})
    }
  }, [currentTrackIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleToggleBgm() {
    const next = !bgmMuted
    setBgmMutedState(next)
    localStorage.setItem('bgmMuted', String(next))
    const bgm = document.getElementById('bgm-player')
    if (bgm) {
      bgm.muted = next
      if (!next && bgm.paused) {
        bgm.play().catch(() => {})
      }
    }
  }

  const handleBgmEnded = () => {
    setCurrentTrackIdx(prev => getRandomNextIdx(prev, BGM_TRACKS.length))
  }

  // ── Navigation ───────────────────────────────────────────────────
  function handleThemeNext(themeGradient) {
    setWalkConfig(c => ({ ...c, themeGradient }))
    setStep('settings')
  }

  function handleSettingsNext(mode, strictLevel) {
    setWalkConfig(c => ({ ...c, mode, strictLevel }))
    setStep('camera')
  }

  function handleCameraEnd(collectedColors, matchScore) {
    const record = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: walkConfig.mode,
      strictLevel: walkConfig.strictLevel,
      themeGradient: walkConfig.themeGradient,
      collectedColors,
      matchScore: matchScore ?? null,
    }
    setCurrentRecord(record)
    setStep('end')
  }

  function handleWalkAgain() {
    setWalkConfig({})
    setCurrentRecord(null)
    setStep('theme')
  }

  return (
    <>
      <audio
        id="bgm-player"
        loop={false}
        src={BGM_TRACKS[currentTrackIdx]}
        onEnded={handleBgmEnded}
        onError={() => {}}
      />
      {step === 'theme' && (
        <ThemeGenPage
          key="theme"
          onNext={handleThemeNext}
          onOpenSettings={() => setStep('global_settings')}
          onOpenArchive={() => setStep('archive')}
          onOpenAchievements={() => setStep('achievement')}
          bgmMuted={bgmMuted}
          onToggleBgm={handleToggleBgm}
        />
      )}
      {step === 'global_settings' && <GlobalSettingsPage key="global_settings" onBack={() => setStep('theme')} />}
      {step === 'settings' && <SettingsPage key="settings" onNext={handleSettingsNext} onBack={() => setStep('theme')} />}
      {step === 'camera' && (
        <CameraPage
          key="camera"
          walkConfig={walkConfig}
          onEnd={handleCameraEnd}
          onArchive={() => setStep('archive')}
        />
      )}
      {step === 'end' && currentRecord && (
        <EndPage
          key="end"
          record={currentRecord}
          readonly={false}
          onWalkAgain={handleWalkAgain}
          onViewArchive={() => setStep('archive')}
        />
      )}
      {step === 'archive' && (
        <ArchivePage
          key="archive"
          onStartWalk={handleWalkAgain}
          onAchievements={() => setStep('achievement')}
        />
      )}
      {step === 'achievement' && (
        <AchievementPage
          key="achievement"
          onBack={() => setStep('archive')}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
