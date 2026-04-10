// Audio Context setup
let audioCtx = null;

// Global settings
let clickVolume = 0.5;
let captureVolume = 0.5;
let bgmVolume = 0.5;

export function setClickVolume(v) { clickVolume = v; }
export function setCaptureVolume(v) { captureVolume = v; }
export function setBgmVolume(v) {
  bgmVolume = v;
  const bgm = document.getElementById('bgm-player');
  if (bgm) {
    bgm.volume = v;
  }
}

export function getBgmVolume() { return bgmVolume; }

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Synthesize an ethereal drum (steel tongue drum) sound
function playEtherealDrum(baseFreq, volume, duration = 2.0, isAgile = false) {
  try {
    initAudio();
    if (!audioCtx || volume <= 0) return;

    const now = audioCtx.currentTime;
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioCtx.destination);

    // A steel tongue drum has a fundamental and a few distinct overtones
    // For "agile" sounds, we use shorter decay and a bit more high-end
    const decayMult = isAgile ? 0.4 : 1.0;
    const partials = [
      { ratio: 1,    amp: 1,    decay: duration * decayMult },
      { ratio: 2.76, amp: 0.4,  decay: duration * 0.6 * decayMult },
      { ratio: 5.4,  amp: 0.2,  decay: duration * 0.4 * decayMult },
      { ratio: 8.9,  amp: 0.1,  decay: duration * 0.2 * decayMult }
    ];

    partials.forEach(p => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = baseFreq * p.ratio;
      
      // Envelope: faster attack for "agile" feel
      const attack = isAgile ? 0.005 : 0.02;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(p.amp, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, now + p.decay);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(now);
      osc.stop(now + p.decay);
    });

    // Add a tiny bit of "ping" noise for agility
    if (isAgile) {
      const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.05 * volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
}

export function playChime(frequency = 523.25) {
  playEtherealDrum(frequency, clickVolume, 1.2, true);
}

export function playCaptureSound() {
  // Play a chord (e.g., C major pentatonic) for capture
  playEtherealDrum(523.25, captureVolume, 2.5); // C5
  setTimeout(() => playEtherealDrum(659.25, captureVolume * 0.8, 2.5), 80); // E5
  setTimeout(() => playEtherealDrum(783.99, captureVolume * 0.6, 2.5), 160); // G5
}

export function playClick() {
  // A higher, more agile "ping" for clicks
  playEtherealDrum(659.25, clickVolume * 0.6, 0.8, true); // E5
}
