import { useState, useEffect } from 'react'
import ThemeGenPage from './pages/ThemeGenPage'
import SettingsPage from './pages/SettingsPage'
import GlobalSettingsPage from './pages/GlobalSettingsPage'
import CameraPage from './pages/CameraPage'
import EndPage from './pages/EndPage'
import ArchivePage from './pages/ArchivePage'
import AchievementPage from './pages/AchievementPage'
import { setClickVolume, setCaptureVolume, setBgmVolume, getBgmVolume } from './utils/audio'
import { LanguageProvider } from './contexts/LanguageContext'
import './App.css'

const BGM_TRACKS = ['/audio/bgm_mp3.mp3', '/audio/bgm1_mp3.mp3']

function getRandomNextIdx(current, total) {
  if (total <= 1) return 0
  let next
  do { next = Math.floor(Math.random() * total) } while (next === current)
  return next
}

function AppContent() {
  const [step, setStep] = useState('theme')
  const [walkConfig, setWalkConfig] = useState({})
  const [currentRecord, setCurrentRecord] = useState(null)
  const [bgmMuted, setBgmMutedState] = useState(
    () => localStorage.getItem('bgmMuted') === 'true'
  )

  function handleToggleBgm() {
    const next = !bgmMuted
    setBgmMutedState(next)
    localStorage.setItem('bgmMuted', String(next))
    const bgm = document.getElementById('bgm-player')
    if (bgm) bgm.muted = next
  }

  useEffect(() => {
    // Volume settings
    const savedClick   = localStorage.getItem('clickVolume')
    const savedCapture = localStorage.getItem('captureVolume')
    const savedBgm     = localStorage.getItem('bgmVolume')
    const savedTheme   = localStorage.getItem('appTheme')

    if (savedClick   !== null) setClickVolume(parseFloat(savedClick))
    if (savedCapture !== null) setCaptureVolume(parseFloat(savedCapture))
    // Always set bgm volume — defaults to 0.3 if no saved value
    setBgmVolume(savedBgm !== null ? parseFloat(savedBgm) : 0.3)

    if (savedTheme === 'dark')  document.body.classList.add('dark-theme')
    else if (savedTheme === 'light') document.body.classList.add('light-theme')

    // BGM — start on first user interaction
    let currentTrackIdx = Math.floor(Math.random() * BGM_TRACKS.length)

    const handleFirstInteraction = () => {
      const bgm = document.getElementById('bgm-player')
      if (bgm) {
        bgm.volume = getBgmVolume()
        bgm.muted  = localStorage.getItem('bgmMuted') === 'true'
        bgm.src    = BGM_TRACKS[currentTrackIdx]
        bgm.load()
        bgm.play().catch(() => {})

        bgm.onended = () => {
          currentTrackIdx = getRandomNextIdx(currentTrackIdx, BGM_TRACKS.length)
          bgm.src = BGM_TRACKS[currentTrackIdx]
          bgm.play().catch(() => {})
        }

        bgm.onerror = () => {
          currentTrackIdx = getRandomNextIdx(currentTrackIdx, BGM_TRACKS.length)
          bgm.src = BGM_TRACKS[currentTrackIdx]
          bgm.play().catch(() => {})
        }
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
  }, [])

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
      <audio id="bgm-player" loop={false} />
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
