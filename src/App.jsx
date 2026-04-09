import { useState } from 'react'
import ThemeGenPage from './pages/ThemeGenPage'
import SettingsPage from './pages/SettingsPage'
import CameraPage from './pages/CameraPage'
import EndPage from './pages/EndPage'
import ArchivePage from './pages/ArchivePage'
import './App.css'

export default function App() {
  const [step, setStep] = useState('theme')
  const [walkConfig, setWalkConfig] = useState({})
  const [currentRecord, setCurrentRecord] = useState(null)

  function handleThemeNext(themeGradient) {
    setWalkConfig((c) => ({ ...c, themeGradient }))
    setStep('settings')
  }

  function handleSettingsNext(mode, strictLevel) {
    setWalkConfig((c) => ({ ...c, mode, strictLevel }))
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

  if (step === 'theme')
    return <ThemeGenPage key="theme" onNext={handleThemeNext} />

  if (step === 'settings')
    return <SettingsPage key="settings" onNext={handleSettingsNext} onBack={() => setStep('theme')} />

  if (step === 'camera')
    return (
      <CameraPage
        key="camera"
        walkConfig={walkConfig}
        onEnd={handleCameraEnd}
        onArchive={() => setStep('archive')}
      />
    )

  if (step === 'end' && currentRecord)
    return (
      <EndPage
        key="end"
        record={currentRecord}
        readonly={false}
        onWalkAgain={handleWalkAgain}
        onViewArchive={() => setStep('archive')}
      />
    )

  if (step === 'archive')
    return <ArchivePage key="archive" onStartWalk={handleWalkAgain} />

  return null
}
