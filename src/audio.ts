let audioContext: AudioContext | null = null;
let musicAudio: HTMLAudioElement | null = null;
export function startMusic(): void {
  try {
    if (!musicAudio) {
      musicAudio = new Audio('dist/cosmic-coin-chase.mp3');
      musicAudio.loop = true;
      musicAudio.volume = 0.5;
    }
    musicAudio.currentTime = 0;
    musicAudio.play().catch(() => {
      // Autoplay-Sperre – wird stillschweigend ignoriert
    });
  } catch (_) {
    // Audio nicht verfügbar – ignorieren
  }
}
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}
export function playShootSound(pitchHz: number = 880): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitchHz, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitchHz * 0.2, ctx.currentTime + 0.13);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  } catch (_) {
    // Audio nicht verfügbar – ignorieren
  }
}
export function playExplosionSound(energy: number): void {
  try {
    const ctx = getAudioContext();
    const duration = 0.38;
    const sampleCount = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseFreq = 180 + (energy / 100) * 820;
    filter.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + duration);
    const gain = ctx.createGain();
    const vol = 0.12 + (energy / 100) * 0.33;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
  } catch (_) {}
}
