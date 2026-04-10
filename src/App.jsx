import { useState, useEffect } from 'react'
import ThemeGenPage from './pages/ThemeGenPage'
import SettingsPage from './pages/SettingsPage'
import GlobalSettingsPage from './pages/GlobalSettingsPage'
import CameraPage from './pages/CameraPage'
import EndPage from './pages/EndPage'
import ArchivePage from './pages/ArchivePage'
import { setClickVolume, setCaptureVolume, setBgmVolume } from './utils/audio'
import { LanguageProvider } from './contexts/LanguageContext'
import './App.css'

function AppContent() {
  const [step, setStep] = useState('theme')
  const [walkConfig, setWalkConfig] = useState({})
  const [currentRecord, setCurrentRecord] = useState(null)

  useEffect(() => {
    // Initialize settings from localStorage
    const savedClick = localStorage.getItem('clickVolume')
    const savedCapture = localStorage.getItem('captureVolume')
    const savedBgm = localStorage.getItem('bgmVolume')
    const savedTheme = localStorage.getItem('appTheme')
    
    if (savedClick !== null) setClickVolume(parseFloat(savedClick))
    if (savedCapture !== null) setCaptureVolume(parseFloat(savedCapture))
    if (savedBgm !== null) setBgmVolume(parseFloat(savedBgm))
    
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else if (savedTheme === 'light') {
      document.body.classList.add('light-theme')
    }

    // BGM Playlist logic
    const tracks = ['/bgm.mp3.mp3', '/bgm1.mp3.mp3']
    let currentTrackIdx = 0

    const handleFirstInteraction = () => {
      const bgm = document.getElementById('bgm-player');
      if (bgm) {
        console.log('Initial BGM attempt:', tracks[currentTrackIdx]);
        bgm.src = tracks[currentTrackIdx];
        bgm.load(); // 强制重新加载资源
        
        bgm.play().then(() => {
          console.log('BGM started playing');
        }).catch(e => {
          console.warn('BGM autoplay blocked or file missing:', e);
        });
        
        bgm.onended = () => {
          currentTrackIdx = (currentTrackIdx + 1) % tracks.length;
          console.log('Switching to next track:', tracks[currentTrackIdx]);
          bgm.src = tracks[currentTrackIdx];
          bgm.play().catch(err => console.error('Next track play failed:', err));
        };

        // 监听错误
        bgm.onerror = (e) => {
          console.error('Audio element error:', bgm.error);
        };
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    }
  }, [])

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

  return (
    <>
      <audio id="bgm-player" loop={false} />
      {step === 'theme' && <ThemeGenPage key="theme" onNext={handleThemeNext} onOpenSettings={() => setStep('global_settings')} />}
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
      {step === 'archive' && <ArchivePage key="archive" onStartWalk={handleWalkAgain} />}
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
