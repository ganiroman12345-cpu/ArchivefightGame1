import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { GameState } from '../types';

// Tube Amp Distortion Curve for Industrial Metal Guitars
const makeDistortionCurve = (amount = 20) => {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 18 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
};

export const MusicSystem: React.FC = () => {
  const gameState = useGameStore(s => s.gameState);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const beatCountRef = useRef(0);
  
  const masterGainRef = useRef<GainNode | null>(null);
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const hasInitializedRef = useRef(false);

  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const lastMapRef = useRef<string | null>(null);

  const initAudio = () => {
    if (hasInitializedRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    masterGainRef.current = ctx.createGain();
    masterGainRef.current.gain.value = 0.35; // Rich punchy master mix

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 6;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;

    // Distortion Node for Heavy Elements
    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(30);
    distortion.oversample = '4x';
    distortionNodeRef.current = distortion;

    distortion.connect(masterGainRef.current);
    masterGainRef.current.connect(compressor);
    compressor.connect(ctx.destination);

    // Pre-allocate white noise buffer for drum transients & crash cymbals
    const noiseSize = Math.floor(ctx.sampleRate * 0.5);
    const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = noiseBuffer;

    hasInitializedRef.current = true;
  };

  const playBeat = (time: number, beat: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    const ctx = audioCtxRef.current;
    
    const step = beat % 16; 
    const bar = Math.floor(beat / 16);
    const section = Math.floor(bar / 4) % 4; // 0: Main Groove, 1: Rhythm Shift, 2: Build-up, 3: Heavy Drop / Breakdown
    
    const currentGameState = useGameStore.getState().gameState;
    const isMenu = currentGameState === GameState.MENU || currentGameState === GameState.CHARACTER_SELECT;
    const selectedMap = useGameStore.getState().selectedMap;

    // Genre assignments based on map - adjusted for distinct Metal, Electronica, and Chill styles
    const isSynthwave = isMenu;
    const isChillHouse = !isMenu && (selectedMap === 'PARK_FESTIVAL');
    const isCinematic = !isMenu && selectedMap === 'WAR_OPPONENT';
    const isIndustrialMetal = !isMenu && (selectedMap === 'HELL');
    const isTechnoElectronica = !isMenu && (selectedMap === 'DEFAULT' || selectedMap === 'ROOFTOP');
    const isDrumAndBass = !isMenu && selectedMap === 'FOREST';

    // --- 1. CRASH CYMBAL & NOISE SWEEPS ---
    if (step === 0 && (bar % 4 === 0) && noiseBufferRef.current) {
        const crash = ctx.createBufferSource();
        crash.buffer = noiseBufferRef.current;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        
        let crashFreq = 3500;
        if (isIndustrialMetal) crashFreq = 2500;
        else if (isTechnoElectronica) crashFreq = 4500;
        else if (isChillHouse) crashFreq = 5500;
        
        filter.frequency.setValueAtTime(crashFreq, time);

        const gain = ctx.createGain();
        const crashVol = isIndustrialMetal ? 0.28 : (isChillHouse ? 0.15 : 0.20);
        gain.gain.setValueAtTime(crashVol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (section === 3 ? 0.8 : 0.5));

        crash.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainRef.current);

        crash.start(time);
        crash.stop(time + 0.82);
    }

    // --- 2. DYNAMIC KICK DRUM PATTERNS (RHYTHM SHIFTS) ---
    let playKick = false;
    if (isSynthwave) {
        playKick = (step === 0 || step === 4 || step === 8 || step === 12) || (step === 10);
    } else if (isIndustrialMetal) {
        if (section === 0) playKick = (step === 0 || step === 4 || step === 8 || step === 10 || step === 12);
        else if (section === 1) playKick = (step === 0 || step === 3 || step === 6 || step === 8 || step === 11 || step === 14);
        else if (section === 2) playKick = (step % 2 === 0);
        else playKick = (step === 0 || step === 3 || step === 7 || step === 10 || step === 12 || step === 15);
    } else if (isTechnoElectronica) {
        // Strict 4-on-the-floor for Techno with some variation in fills
        if (section === 3 && bar % 2 === 1) playKick = (step === 0 || step === 4 || step === 8 || step === 12 || step === 14 || step === 15);
        else playKick = (step === 0 || step === 4 || step === 8 || step === 12);
    } else if (isCinematic) {
        playKick = (step === 0 || step === 6 || step === 11 || step === 14);
    } else if (isChillHouse) {
        playKick = (step === 0 || step === 4 || step === 8 || step === 12);
    } else if (isDrumAndBass) {
        playKick = (step === 0 || step === 10);
    } else {
        playKick = (step === 0 || step === 4 || step === 8 || step === 12);
    }

    if (playKick) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = (isIndustrialMetal || isTechnoElectronica) ? 'triangle' : 'sine'; // Fatter kick for heavy genres
        
        let startFreq = 150, endFreq = 40;
        if (isIndustrialMetal) { startFreq = 220; endFreq = 45; }
        else if (isTechnoElectronica) { startFreq = 200; endFreq = 45; }
        else if (isChillHouse) { startFreq = 140; endFreq = 50; }
        else if (isDrumAndBass) { startFreq = 160; endFreq = 45; }
        else if (isCinematic) { startFreq = 220; endFreq = 30; }
        
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.1); // Slightly longer punch
        
        let kickVol = 0.50;
        if (isIndustrialMetal) kickVol = 0.65;
        if (isTechnoElectronica) kickVol = 0.60;
        if (isChillHouse) kickVol = 0.45;
        if (isCinematic) kickVol = 0.65;

        gain.gain.setValueAtTime(kickVol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (isTechnoElectronica ? 0.2 : 0.15)); // longer decay for techno kick
        
        osc.connect(gain);
        
        // Add subtle distortion to the kick for metal/techno
        if ((isIndustrialMetal || isTechnoElectronica) && distortionNodeRef.current) {
            gain.connect(distortionNodeRef.current);
        } else {
            gain.connect(masterGainRef.current);
        }
        osc.start(time);
        osc.stop(time + 0.25);
    }

    // --- 3. DYNAMIC SNARE / CLAP / INDUSTRIAL IMPACTS ---
    let playSnare = false;
    if (isSynthwave) {
        playSnare = (step === 4 || step === 12);
    } else if (isIndustrialMetal) {
        if (section === 3) playSnare = (step === 8) || (bar % 2 === 1 && step === 15);
        else if (section === 2) playSnare = (step === 4 || step === 12) || (step % 2 === 0 && step >= 8);
        else playSnare = (step === 4 || step === 12) || (step === 15 && bar % 2 === 1);
    } else if (isTechnoElectronica) {
        if (section === 2) playSnare = (step === 4 || step === 12) || (step % 2 === 0 && step >= 10);
        else playSnare = (step === 4 || step === 12);
    } else if (isDrumAndBass) {
        playSnare = (step === 4 || step === 12);
    } else if (isCinematic) {
        playSnare = (step === 8);
    } else {
        playSnare = (step === 4 || step === 12);
    }

    if (playSnare && noiseBufferRef.current) {
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = (isIndustrialMetal || isCinematic) ? 'sawtooth' : (isTechnoElectronica ? 'square' : 'triangle');
        
        let snareFreq = 180;
        if (isIndustrialMetal) snareFreq = 220;
        if (isTechnoElectronica) snareFreq = 240;
        if (isChillHouse) snareFreq = 160;
        
        popOsc.frequency.setValueAtTime(snareFreq, time);
        popOsc.frequency.exponentialRampToValueAtTime(70, time + 0.08);
        
        const snareVol = isIndustrialMetal ? 0.38 : (isTechnoElectronica ? 0.32 : (isChillHouse ? 0.20 : 0.28));
        popGain.gain.setValueAtTime(snareVol, time);
        popGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        
        popOsc.connect(popGain);
        popGain.connect(masterGainRef.current);
        popOsc.start(time);
        popOsc.stop(time + 0.09);

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBufferRef.current;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        
        let noiseCutoff = 2000;
        if (isIndustrialMetal) noiseCutoff = 1500;
        if (isTechnoElectronica) noiseCutoff = 2800;
        if (isChillHouse) noiseCutoff = 3200;
        
        filter.frequency.setValueAtTime(noiseCutoff, time);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(isIndustrialMetal ? 0.30 : (isChillHouse ? 0.15 : 0.22), time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (isIndustrialMetal ? 0.18 : 0.12));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGainRef.current);
        noise.start(time);
        noise.stop(time + 0.20);
    }

    // --- 4. HI-HATS & METALLIC PERCUSSION ---
    if (noiseBufferRef.current) {
        let playHat = false;
        let isOpenHat = false;
        
        if (isSynthwave) {
            playHat = (step % 2 === 0);
            isOpenHat = (step % 4 === 2);
        } else if (isTechnoElectronica) {
            if (section === 2) {
                playHat = true;
                isOpenHat = (step % 2 === 1);
            } else {
                playHat = (step % 2 === 0);
                isOpenHat = (step % 4 === 2);
            }
        } else if (isIndustrialMetal) {
            playHat = (step % 2 === 0) || (section === 2) || (step === 15);
            isOpenHat = (step % 8 === 6);
        } else if (isDrumAndBass) {
            playHat = true;
            isOpenHat = (step % 8 === 2 || step % 8 === 6);
        } else if (isChillHouse) {
            playHat = (step % 2 === 0);
            isOpenHat = (step % 4 === 2);
        } else {
            playHat = (step % 2 === 0);
            isOpenHat = (step % 4 === 2);
        }

        if (playHat) {
            const hat = ctx.createBufferSource();
            hat.buffer = noiseBufferRef.current;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            
            let hatFreq = 7000;
            if (isTechnoElectronica) hatFreq = 8500;
            if (isDrumAndBass) hatFreq = 8000;
            if (isChillHouse) hatFreq = 9000;
            
            filter.frequency.setValueAtTime(hatFreq, time);
            
            const hatVol = isOpenHat 
                ? (isIndustrialMetal ? 0.16 : (isChillHouse ? 0.10 : 0.14)) 
                : (isIndustrialMetal ? 0.08 : (isChillHouse ? 0.05 : 0.06));
            const hatDur = isOpenHat ? (isChillHouse ? 0.10 : 0.08) : 0.03;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(hatVol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + hatDur);
            
            hat.connect(filter);
            filter.connect(gain);
            gain.connect(masterGainRef.current);
            
            hat.start(time);
            hat.stop(time + hatDur + 0.01);
        }
    }

    // --- 5. BASS & SYNTH INSTRUMENTATION ---
    let rootFreq = 82.41;
    if (isSynthwave) {
        const synthRoots = [55.00, 65.41, 73.42, 82.41]; // A1, C2, D2, E2
        rootFreq = synthRoots[bar % 4];
    } else if (isIndustrialMetal) {
        const metalRoots = [41.20, 49.00, 55.00, 58.27]; // E1, G1, A1, Bb1
        rootFreq = metalRoots[bar % 4];
    } else if (isTechnoElectronica) {
        const technoRoots = [65.41, 77.78, 87.31, 98.00]; // C2, Eb2, F2, G2
        rootFreq = technoRoots[bar % 4];
    } else if (isCinematic) {
        const cineRoots = [32.70, 41.20, 36.71, 32.70]; // C1, E1, D1, C1
        rootFreq = cineRoots[bar % 4];
    } else if (isChillHouse) {
        const chillRoots = [98.00, 110.00, 130.81, 146.83]; // G2, A2, C3, D3
        rootFreq = chillRoots[bar % 4];
    } else if (isDrumAndBass) {
        const dnbRoots = [55.00, 55.00, 65.41, 73.42]; // A1, A1, C2, D2
        rootFreq = dnbRoots[bar % 4];
    }

    // --- 5A. BASSLINES ---
    let playBassNote = false;
    if (isSynthwave) {
        playBassNote = (step % 2 === 0);
    } else if (isIndustrialMetal) {
        if (section === 3) playBassNote = (step === 0 || step === 3 || step === 7 || step === 10 || step === 12 || step === 15);
        else playBassNote = (step % 2 === 0) || (step === 3 || step === 7 || step === 11 || step === 15);
    } else if (isTechnoElectronica) {
        if (section === 1) playBassNote = (step % 2 === 1) || (step === 0 || step === 8);
        else if (section === 2) playBassNote = true;
        else playBassNote = (step % 2 === 0);
    } else if (isCinematic) {
        playBassNote = (step === 0 || step === 8); // Sustained deep bass
    } else if (isChillHouse) {
        playBassNote = (step === 0 || step === 3 || step === 6 || step === 10 || step === 12);
    } else if (isDrumAndBass) {
        playBassNote = (step === 0 || step === 3 || step === 6 || step === 8 || step === 14);
    }

    if (playBassNote) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        const type = (isIndustrialMetal || isTechnoElectronica) ? 'sawtooth' : (isChillHouse || isSynthwave ? 'square' : 'sine');
        osc1.type = type;
        osc2.type = type;
        osc1.frequency.setValueAtTime(rootFreq, time);
        osc2.frequency.setValueAtTime(rootFreq * 1.01, time); // Detuned for fatness

        filter.type = 'lowpass';
        if (isTechnoElectronica) {
            filter.Q.setValueAtTime(8, time); 
            const sweepCutoff = (step % 4 === 0 ? 3200 : (step % 2 === 1 ? 2200 : 1200));
            filter.frequency.setValueAtTime(sweepCutoff, time);
            filter.frequency.exponentialRampToValueAtTime(150, time + 0.15);
        } else if (isIndustrialMetal) {
            filter.frequency.setValueAtTime(1200, time);
            filter.frequency.exponentialRampToValueAtTime(200, time + 0.12);
        } else if (isCinematic) {
            filter.frequency.setValueAtTime(400, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 1.0);
        } else if (isChillHouse) {
            filter.frequency.setValueAtTime(800, time);
            filter.frequency.exponentialRampToValueAtTime(120, time + 0.25);
        } else {
            filter.frequency.setValueAtTime(600, time);
            filter.frequency.exponentialRampToValueAtTime(200, time + 0.15);
        }

        const bassVol = isIndustrialMetal ? 0.35 : (isTechnoElectronica ? 0.40 : (isCinematic ? 0.50 : (isChillHouse ? 0.25 : 0.25)));
        gain.gain.setValueAtTime(bassVol, time);
        
        let releaseTime = 0.14;
        if (isCinematic) releaseTime = 0.8;
        if (isChillHouse) releaseTime = 0.25;
        if (isTechnoElectronica) releaseTime = 0.20;
        gain.gain.exponentialRampToValueAtTime(0.001, time + releaseTime);

        osc1.connect(filter);
        osc2.connect(filter);
        
        if ((isIndustrialMetal || isTechnoElectronica) && distortionNodeRef.current) {
            filter.connect(gain);
            gain.connect(distortionNodeRef.current);
        } else {
            filter.connect(gain);
            gain.connect(masterGainRef.current);
        }

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + releaseTime + 0.05);
        osc2.stop(time + releaseTime + 0.05);
    }

    // --- 5B. SYNTH LEADS & ARPEGGIOS ---
    let riffScale: number[] = [];
    if (isSynthwave) {
        riffScale = [1.0, 1.25, 1.5, 2.0, 1.5, 1.25, 1.0, 0.75];
    } else if (isIndustrialMetal) {
        if (section === 0) riffScale = [1.0, 1.0, 1.414, 1.0, 1.5, 1.414, 1.0, 1.25];
        else if (section === 1) riffScale = [1.0, 1.2, 1.333, 1.2, 1.0, 0.88, 1.0, 1.5];
        else if (section === 2) riffScale = [1.0, 1.122, 1.26, 1.414, 1.5, 1.682, 1.888, 2.0];
        else riffScale = [1.0, 1.0, 1.0, 1.414, 1.0, 1.0, 1.5, 1.414];
    } else if (isTechnoElectronica) {
        if (section === 0) riffScale = [1.0, 1.2, 1.333, 1.5, 1.777, 1.5, 1.333, 1.2];
        else if (section === 1) riffScale = [1.0, 1.059, 1.333, 1.414, 1.682, 1.5, 1.333, 1.189];
        else if (section === 2) riffScale = [1.0, 1.25, 1.5, 2.0, 2.5, 2.0, 1.5, 1.25];
        else riffScale = [2.0, 1.777, 1.5, 1.333, 1.5, 1.777, 2.0, 2.37];
    } else if (isChillHouse) {
        riffScale = [1.0, 1.5, 1.25, 2.0, 1.5, 1.25, 1.0, 1.5];
    } else if (isDrumAndBass) {
        riffScale = [1.0, 1.2, 1.5, 1.0, 1.2, 1.5, 2.0, 1.5];
    } else {
        riffScale = [1.0, 1.2, 1.333, 1.5, 1.777, 2.0, 1.5, 1.333];
    }

    const leadMult = riffScale[step % riffScale.length];
    const leadFreq = rootFreq * (isIndustrialMetal ? 2.0 : (isChillHouse ? 4.0 : 3.0)) * leadMult;

    let playLeadNote = false;
    if (isSynthwave) playLeadNote = (step % 2 === 0) || (step === 3 || step === 7 || step === 11 || step === 15);
    else if (isIndustrialMetal) playLeadNote = (step % 2 === 0) || (section === 2) || (step === 3 || step === 7 || step === 11);
    else if (isTechnoElectronica) playLeadNote = (step % 2 === 0) || (step === 3 || step === 7 || step === 11 || step === 15);
    else if (isChillHouse) playLeadNote = (step === 2 || step === 4 || step === 8 || step === 10 || step === 14);
    else if (isDrumAndBass) playLeadNote = (step % 4 === 0) || (step === 6 || step === 14);
    else playLeadNote = (step % 2 === 0);

    if (playLeadNote) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = isChillHouse ? 'sine' : (isSynthwave ? 'sawtooth' : 'sawtooth');
        osc1.frequency.setValueAtTime(leadFreq, time);

        osc2.type = isChillHouse ? 'triangle' : 'square';
        osc2.frequency.setValueAtTime(leadFreq * 1.008, time); // detune

        filter.type = 'lowpass';
        let leadCutoff = 2000;
        if (isSynthwave) leadCutoff = 2500;
        if (isIndustrialMetal) leadCutoff = 2800;
        if (isTechnoElectronica) leadCutoff = 3500;
        if (isChillHouse) leadCutoff = 1500;
        
        filter.frequency.setValueAtTime(leadCutoff, time);
        filter.frequency.exponentialRampToValueAtTime(isIndustrialMetal ? 600 : (isChillHouse ? 400 : 800), time + 0.12);

        const leadVol = isIndustrialMetal ? 0.22 : (isTechnoElectronica ? 0.20 : (isChillHouse ? 0.12 : 0.15));
        gain.gain.setValueAtTime(leadVol, time);
        
        let leadRelease = 0.14;
        if (isChillHouse) leadRelease = 0.25;
        gain.gain.exponentialRampToValueAtTime(0.001, time + leadRelease);

        osc1.connect(filter);
        osc2.connect(filter);

        if (isIndustrialMetal && distortionNodeRef.current) {
            filter.connect(gain);
            gain.connect(distortionNodeRef.current);
        } else {
            filter.connect(gain);
            gain.connect(masterGainRef.current);
        }

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + leadRelease + 0.05);
        osc2.stop(time + leadRelease + 0.05);
    }
  };

  const schedule = () => {
    if (!audioCtxRef.current || !isPlayingRef.current) return;
    const currentGameState = useGameStore.getState().gameState;
    const selectedMap = useGameStore.getState().selectedMap;
    const lookahead = 25; // 25ms timer interval
    const scheduleAheadTime = 0.18; // 180ms schedule window
    
    let tempo = 122;
    if (currentGameState === GameState.MENU || currentGameState === GameState.CHARACTER_SELECT) {
        tempo = 118; 
    } else if (selectedMap === 'HELL') {
        tempo = 145; // Fast driving Industrial Metal
    } else if (selectedMap === 'DEFAULT') {
        tempo = 132; // Energetic Techno
    } else if (selectedMap === 'ROOFTOP') {
        tempo = 128; // Driving acid techno
    } else if (selectedMap === 'WAR_OPPONENT') {
        tempo = 95; // Cinematic lofi
    } else if (selectedMap === 'PARK_FESTIVAL') {
        tempo = 122; // Chill House tempo
    } else if (selectedMap === 'FOREST') {
        tempo = 170; // Fast Liquid Drum & Bass
    }

    const secondsPerBeat = 60.0 / tempo;
    const noteRate = 0.25; // 16th notes

    const currentTime = audioCtxRef.current.currentTime;

    if (nextNoteTimeRef.current < currentTime - 0.5) {
        nextNoteTimeRef.current = currentTime + 0.02;
    }

    while (nextNoteTimeRef.current < currentTime + scheduleAheadTime) {
        if (nextNoteTimeRef.current >= currentTime - 0.05) {
            try {
                playBeat(nextNoteTimeRef.current, beatCountRef.current);
            } catch (e) {}
        }
        nextNoteTimeRef.current += secondsPerBeat * noteRate; 
        beatCountRef.current++;
    }
    timerIDRef.current = window.setTimeout(schedule, lookahead);
  };

  const startAudioIfNeeded = () => {
    if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
    if (!hasInitializedRef.current) {
        initAudio();
    }

    const currentMap = useGameStore.getState().selectedMap;
    const mapChanged = lastMapRef.current !== currentMap;
    lastMapRef.current = currentMap;

    if (!isPlayingRef.current || mapChanged) {
        if (timerIDRef.current) {
            clearTimeout(timerIDRef.current);
            timerIDRef.current = null;
        }
        isPlayingRef.current = true;
        beatCountRef.current = 0;
        nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
        schedule();
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleInteraction = () => startAudioIfNeeded();
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    startAudioIfNeeded();

    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };
  }, [gameState, useGameStore(s => s.selectedMap)]);

  return null;
};
