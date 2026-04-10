let audioCtx = null

// Global volume levels
let clickVolume = 0.5
let captureVolume = 0.5
let bgmVolume = 0.3  // default 0.3 — not too loud

export function setClickVolume(v)   { clickVolume = v }
export function setCaptureVolume(v) { captureVolume = v }
export function setBgmVolume(v) {
  bgmVolume = v
  const bgm = document.getElementById('bgm-player')
  if (bgm) bgm.volume = v
}
export function getBgmVolume() { return bgmVolume }

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
}

// ── Ethereal drum (steel tongue drum) ─────────────────────────────

function playEtherealDrum(baseFreq, volume, duration = 2.0, isAgile = false) {
  try {
    initAudio()
    if (!audioCtx || volume <= 0) return

    const now = audioCtx.currentTime
    const masterGain = audioCtx.createGain()
    masterGain.gain.value = volume
    masterGain.connect(audioCtx.destination)

    const decayMult = isAgile ? 0.4 : 1.0
    const partials = [
      { ratio: 1,    amp: 1,   decay: duration * decayMult },
      { ratio: 2.76, amp: 0.4, decay: duration * 0.6 * decayMult },
      { ratio: 5.4,  amp: 0.2, decay: duration * 0.4 * decayMult },
      { ratio: 8.9,  amp: 0.1, decay: duration * 0.2 * decayMult },
    ]

    partials.forEach(p => {
      const osc  = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.value = baseFreq * p.ratio
      const attack = isAgile ? 0.005 : 0.02
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(p.amp, now + attack)
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.decay)
      osc.connect(gain)
      gain.connect(masterGain)
      osc.start(now)
      osc.stop(now + p.decay)
    })

    if (isAgile) {
      const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate)
      const out = noiseBuffer.getChannelData(0)
      for (let i = 0; i < noiseBuffer.length; i++) out[i] = Math.random() * 2 - 1
      const noise = audioCtx.createBufferSource()
      noise.buffer = noiseBuffer
      const noiseGain = audioCtx.createGain()
      noiseGain.gain.setValueAtTime(0.05 * volume, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      noise.connect(noiseGain)
      noiseGain.connect(masterGain)
      noise.start(now)
    }
  } catch (e) {
    console.error('Audio play failed', e)
  }
}

export function playChime(frequency = 523.25) {
  playEtherealDrum(frequency, clickVolume, 1.2, true)
}

export function playCaptureSound() {
  playEtherealDrum(523.25, captureVolume, 2.5)
  setTimeout(() => playEtherealDrum(659.25, captureVolume * 0.8, 2.5), 80)
  setTimeout(() => playEtherealDrum(783.99, captureVolume * 0.6, 2.5), 160)
}

export function playPerfectCaptureSound() {
  playEtherealDrum(523.25,  captureVolume,       3.0)
  setTimeout(() => playEtherealDrum(659.25,  captureVolume * 0.8, 3.0), 60)
  setTimeout(() => playEtherealDrum(783.99,  captureVolume * 0.7, 3.0), 120)
  setTimeout(() => playEtherealDrum(1046.50, captureVolume * 0.5, 3.0), 180)
}

// ── Button click sound — random ethereal note with echo ────────────

const CLICK_NOTES = [440, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880]

export function playClick() {
  try {
    initAudio()
    if (!audioCtx || clickVolume <= 0) return

    const freq = CLICK_NOTES[Math.floor(Math.random() * CLICK_NOTES.length)]
    const dur  = 0.3 + Math.random() * 0.2   // 0.3 – 0.5 s
    const vol  = clickVolume * 0.28
    const now  = audioCtx.currentTime

    const master = audioCtx.createGain()
    master.gain.value = vol
    master.connect(audioCtx.destination)

    // Primary note — sine, exponential decay
    const osc1  = audioCtx.createOscillator()
    const env1  = audioCtx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = freq
    env1.gain.setValueAtTime(1, now)
    env1.gain.exponentialRampToValueAtTime(0.001, now + dur)
    osc1.connect(env1)
    env1.connect(master)
    osc1.start(now)
    osc1.stop(now + dur)

    // Echo — same pitch, tiny delay, lower amplitude
    const echoAt = now + 0.07 + Math.random() * 0.05
    const osc2   = audioCtx.createOscillator()
    const env2   = audioCtx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = freq
    env2.gain.setValueAtTime(0.32, echoAt)
    env2.gain.exponentialRampToValueAtTime(0.001, echoAt + dur)
    osc2.connect(env2)
    env2.connect(master)
    osc2.start(echoAt)
    osc2.stop(echoAt + dur)
  } catch (e) {}
}

// ── Achievement unlock — two ascending notes ───────────────────────

export function playAchievementUnlock() {
  try {
    initAudio()
    if (!audioCtx || clickVolume <= 0) return

    const now = audioCtx.currentTime
    const vol = clickVolume * 0.42

    // C5 → G5, ascending, slight overlap
    ;[[523.25, 0], [783.99, 0.32]].forEach(([freq, offset]) => {
      const osc = audioCtx.createOscillator()
      const env = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + offset
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(vol, t + 0.018)
      env.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
      osc.connect(env)
      env.connect(audioCtx.destination)
      osc.start(t)
      osc.stop(t + 1.1)
    })
  } catch (e) {}
}
