// Realistic audio effects system with layered Web Audio API synthesis
const ctx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

export const getAudioContext = () => ctx;

// Master limiter / compressor to prevent clipping when multiple sounds play simultaneously
let masterCompressor: DynamicsCompressorNode | null = null;
const getMasterNode = () => {
    if (!ctx) return null;
    if (!masterCompressor) {
        try {
            masterCompressor = ctx.createDynamicsCompressor();
            masterCompressor.threshold.value = -10;
            masterCompressor.knee.value = 8;
            masterCompressor.ratio.value = 5;
            masterCompressor.attack.value = 0.003;
            masterCompressor.release.value = 0.1;
            masterCompressor.connect(ctx.destination);
        } catch(e) {
            return ctx.destination;
        }
    }
    return masterCompressor;
};

// Rate limiting for hit sounds to prevent node stack overflows
let lastHitSoundTime = 0;
const MIN_HIT_SOUND_INTERVAL = 0.035; // 35ms minimum between hit sound triggers

// Pre-compute noise buffers for massive performance gains
let shortNoiseBuffer: AudioBuffer | null = null;
let mediumNoiseBuffer: AudioBuffer | null = null;
let heavyNoiseBuffer: AudioBuffer | null = null;
let explosionNoiseBuffer: AudioBuffer | null = null;

const createNoiseBuffer = (durationSec: number) => {
    if (!ctx) return null;
    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

// Play epic laser / kamehameha / acid sounds
export const playLaserSound = () => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const dest = getMasterNode() || ctx.destination;
        const time = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(1400, time);
        osc1.frequency.exponentialRampToValueAtTime(120, time + 0.28);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2200, time);
        osc2.frequency.exponentialRampToValueAtTime(180, time + 0.28);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3800, time);
        filter.frequency.exponentialRampToValueAtTime(350, time + 0.28);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.29);
        osc2.stop(time + 0.29);
    } catch(e) {}
};

export const playKamehamehaSound = () => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const dest = getMasterNode() || ctx.destination;
        const time = ctx.currentTime;

        // Energy charge-up rising pitch wave
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, time);
        osc.frequency.linearRampToValueAtTime(450, time + 0.35);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(time);
        osc.stop(time + 0.45);

        // Explosive energy beam roar blast
        setTimeout(() => {
            try {
                if (!ctx) return;
                const currentTime = ctx.currentTime;
                if (!explosionNoiseBuffer) explosionNoiseBuffer = createNoiseBuffer(0.65);
                if (!explosionNoiseBuffer) return;

                const noise = ctx.createBufferSource();
                noise.buffer = explosionNoiseBuffer;

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1200, currentTime);
                filter.frequency.exponentialRampToValueAtTime(80, currentTime + 0.6);

                const subOsc = ctx.createOscillator();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(70, currentTime);
                subOsc.frequency.exponentialRampToValueAtTime(20, currentTime + 0.6);

                const subGain = ctx.createGain();
                subGain.gain.setValueAtTime(0.8, currentTime);
                subGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.6);

                const roarGain = ctx.createGain();
                roarGain.gain.setValueAtTime(0.8, currentTime);
                roarGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.6);

                noise.connect(filter);
                filter.connect(roarGain);
                roarGain.connect(dest);

                subOsc.connect(subGain);
                subGain.connect(dest);

                noise.start(currentTime);
                subOsc.start(currentTime);
                subOsc.stop(currentTime + 0.62);
            } catch (err) {}
        }, 180);
    } catch(e) {}
};

export const playAcidSound = () => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const dest = getMasterNode() || ctx.destination;
        const time = ctx.currentTime;

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, time);
        osc.frequency.exponentialRampToValueAtTime(420, time + 0.25);

        // FM modulation for liquid acid sizzle
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(65, time);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 160;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, time);
        filter.frequency.exponentialRampToValueAtTime(220, time + 0.25);
        filter.Q.value = 3.0;

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        lfo.start(time);
        osc.start(time);
        lfo.stop(time + 0.26);
        osc.stop(time + 0.26);
    } catch(e) {}
};

export const playRunSound = () => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const dest = getMasterNode() || ctx.destination;
        const time = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Wind swoosh / swift speed sound
        if (!shortNoiseBuffer) shortNoiseBuffer = createNoiseBuffer(0.035);
        if (shortNoiseBuffer) {
            const noise = ctx.createBufferSource();
            noise.buffer = shortNoiseBuffer;
            noise.loop = true;
            
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(400, time);
            noiseFilter.frequency.exponentialRampToValueAtTime(1200, time + 0.1);
            noiseFilter.Q.value = 0.5;

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.001, time);
            noiseGain.gain.linearRampToValueAtTime(0.15, time + 0.05);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(dest);
            noise.start(time);
            noise.stop(time + 0.2);
        }
    } catch(e) {}
};

// REALISTIC IMPACT/HIT SOUND SYNTHESIS
export const playHitSound = (damage: number, volumeMultiplier: number = 1.0) => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const time = ctx.currentTime;

        if (time - lastHitSoundTime < MIN_HIT_SOUND_INTERVAL) return;
        lastHitSoundTime = time;

        const dest = getMasterNode() || ctx.destination;

        if (damage <= 5) {
            // Light Jab / Low Kick - Snappy organic flesh slap + crisp transient
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(240, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, time);

            gain.gain.setValueAtTime(0.42 * volumeMultiplier, time);
            gain.gain.exponentialRampToValueAtTime(0.003, time + 0.08);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            osc.start(time);
            osc.stop(time + 0.09);

            if (!shortNoiseBuffer) shortNoiseBuffer = createNoiseBuffer(0.035);
            if (shortNoiseBuffer) {
                const noise = ctx.createBufferSource();
                noise.buffer = shortNoiseBuffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.value = 1800;
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.25 * volumeMultiplier, time);
                noiseGain.gain.exponentialRampToValueAtTime(0.003, time + 0.035);
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(dest);
                noise.start(time);
            }
        } else if (damage <= 12) {
            // Medium Hit (Cross, Hook, Kick) - Deep chest thud + body crunch
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, time);
            osc.frequency.exponentialRampToValueAtTime(28, time + 0.14);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(950, time);

            gain.gain.setValueAtTime(0.65 * volumeMultiplier, time);
            gain.gain.exponentialRampToValueAtTime(0.003, time + 0.14);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            osc.start(time);
            osc.stop(time + 0.15);

            if (!mediumNoiseBuffer) mediumNoiseBuffer = createNoiseBuffer(0.07);
            if (mediumNoiseBuffer) {
                const noise = ctx.createBufferSource();
                noise.buffer = mediumNoiseBuffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.value = 750;
                noiseFilter.Q.value = 1.0;
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.45 * volumeMultiplier, time);
                noiseGain.gain.exponentialRampToValueAtTime(0.003, time + 0.07);

                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(dest);
                noise.start(time);
            }
        } else {
            // Heavy Hit / Ultra (Uppercut, Spin Kick, Slam) - Thunderous sub impact + bone crunch
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, time);
            osc.frequency.exponentialRampToValueAtTime(18, time + 0.25);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(700, time);
            filter.frequency.exponentialRampToValueAtTime(80, time + 0.25);

            gain.gain.setValueAtTime(0.9 * volumeMultiplier, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            osc.start(time);
            osc.stop(time + 0.26);

            // Sub-bass impact kick layer
            const subOsc = ctx.createOscillator();
            const subGain = ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(95, time);
            subOsc.frequency.exponentialRampToValueAtTime(20, time + 0.24);
            subGain.gain.setValueAtTime(0.85 * volumeMultiplier, time);
            subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

            subOsc.connect(subGain);
            subGain.connect(dest);
            subOsc.start(time);
            subOsc.stop(time + 0.25);

            // Heavy crunch noise layer
            if (!heavyNoiseBuffer) heavyNoiseBuffer = createNoiseBuffer(0.14);
            if (heavyNoiseBuffer) {
                const noise = ctx.createBufferSource();
                noise.buffer = heavyNoiseBuffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(1400, time);
                noiseFilter.frequency.exponentialRampToValueAtTime(150, time + 0.14);
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.7 * volumeMultiplier, time);
                noiseGain.gain.exponentialRampToValueAtTime(0.003, time + 0.14);

                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(dest);
                noise.start(time);
            }
        }
    } catch(e) {}
};

// REALISTIC GROUND BOUNCE & LANDING IMPACT SOUND
export const playGroundThud = (velocity: number = 0.2) => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const time = ctx.currentTime;
        const volume = Math.min(0.9, Math.max(0.35, velocity * 2.8));
        const dest = getMasterNode() || ctx.destination;

        // Sub bass floor impact
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(100, time);
        subOsc.frequency.exponentialRampToValueAtTime(18, time + 0.18);

        subGain.gain.setValueAtTime(volume, time);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        subOsc.connect(subGain);
        subGain.connect(dest);
        subOsc.start(time);
        subOsc.stop(time + 0.19);

        // Ground thud noise crunch
        if (!heavyNoiseBuffer) heavyNoiseBuffer = createNoiseBuffer(0.14);
        if (heavyNoiseBuffer) {
            const noise = ctx.createBufferSource();
            noise.buffer = heavyNoiseBuffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(500, time);
            filter.frequency.exponentialRampToValueAtTime(60, time + 0.12);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(volume * 0.75, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.003, time + 0.12);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(dest);
            noise.start(time);
        }
    } catch(e) {}
};

// REALISTIC UI & MENU SOUND EFFECTS
export const playMenuClickSound = () => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const dest = getMasterNode() || ctx.destination;
        const time = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(1400, time + 0.05);

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(time);
        osc.stop(time + 0.055);
    } catch(e) {}
};

export const playFighterSelectSound = () => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const dest = getMasterNode() || ctx.destination;
        const time = ctx.currentTime;

        // Metallic power chime + punchy synth select
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(220, time);
        osc1.frequency.exponentialRampToValueAtTime(880, time + 0.18);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, time);
        osc2.frequency.exponentialRampToValueAtTime(1760, time + 0.18);

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(dest);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.19);
        osc2.stop(time + 0.19);
    } catch(e) {}
};

export const playExplosionSound = () => {
    if (!ctx) return;
    try {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(12, ctx.currentTime + 0.75);

        gain.gain.setValueAtTime(0.9, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.78);

        if (!explosionNoiseBuffer) explosionNoiseBuffer = createNoiseBuffer(1.2);
        if (explosionNoiseBuffer) {
            const noise = ctx.createBufferSource();
            noise.buffer = explosionNoiseBuffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(250, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.0);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(1.2, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.05);

            noise.connect(filter);
            filter.connect(noiseGain);
            gain.connect(ctx.destination);
            noise.start();
        }
    } catch(e) {}
};

// --- 100% CUSTOM WEB AUDIO MALE ARCADE VOICE SYNTHESIZER (NO SpeechSynthesis API) ---
let lastAnnounceTime = 0;

// High-impact synthesized male vocal callout using Web Audio API dual-formants
const playCustomArcadeMaleAnnouncer = (text: string) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const dest = getMasterNode() || ctx.destination;

    // Deep sub-bass announcer contact hit
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start(now);
    subOsc.stop(now + 0.36);

    // Dual-formant male vocal synthesis per word
    const words = text.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').split(' ').filter(Boolean).slice(0, 5);
    let timeOffset = 0.02;

    words.forEach((word, wordIdx) => {
      const syllables = Math.min(3, Math.max(1, Math.ceil(word.length / 3)));
      for (let i = 0; i < syllables; i++) {
        const start = now + timeOffset;
        const duration = 0.12 + (i === syllables - 1 ? 0.06 : 0);

        // Male vocal tract fundamental pitch (approx 90-115Hz for deep male voice)
        const basePitch = 95 + (wordIdx * 12) + (i * 18);

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const formantFilter = ctx.createBiquadFilter();
        const vGain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(basePitch, start);
        osc1.frequency.exponentialRampToValueAtTime(basePitch * 0.85, start + duration);

        osc2.frequency.setValueAtTime(basePitch * 1.5, start);
        osc2.frequency.exponentialRampToValueAtTime(basePitch * 1.3, start + duration);

        // Male vocal tract formant resonance filter
        formantFilter.type = 'bandpass';
        const formantFreq = 500 + (i * 220) + ((wordIdx % 2) * 150);
        formantFilter.frequency.setValueAtTime(formantFreq, start);
        formantFilter.Q.setValueAtTime(4.2, start);

        vGain.gain.setValueAtTime(0, start);
        vGain.gain.linearRampToValueAtTime(0.38, start + 0.02);
        vGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc1.connect(formantFilter);
        osc2.connect(formantFilter);
        formantFilter.connect(vGain);
        vGain.connect(dest);

        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + duration + 0.01);
        osc2.stop(start + duration + 0.01);

        timeOffset += duration + 0.035;
      }
      timeOffset += 0.06;
    });
  } catch (e) {}
};

export const announceVoice = (text: string, lang = 'es-ES') => {
  if (typeof window === 'undefined') return;

  const nowTime = Date.now();
  if (nowTime - lastAnnounceTime < 180) return; // Debounce rapid calls
  lastAnnounceTime = nowTime;

  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  // 100% Pure Web Audio synthesized male arcade vocal callout
  playCustomArcadeMaleAnnouncer(text);
};

export const announceRound = (roundNumber: number) => {
  const roundText = roundNumber === 1 ? '¡Ronda 1!' : roundNumber === 2 ? '¡Ronda 2!' : roundNumber === 3 ? '¡Ronda 3!' : '¡Ronda Final!';
  announceVoice(roundText);
};

export const announceFight = () => {
  announceVoice('¡Pelean!');
};

export const announceKO = () => {
  announceVoice('¡K.O.!');
};

export const announceWinner = (name: string) => {
  announceVoice(`¡Victoria para ${name}!`);
};

export const announceFighterIntro = (name: string, isPlayer1: boolean) => {
  const prefix = isPlayer1 ? 'Jugador 1' : 'Jugador 2';
  announceVoice(`${prefix}: ${name}`);
};
