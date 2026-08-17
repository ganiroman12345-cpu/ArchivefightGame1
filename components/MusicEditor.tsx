import React, { useState } from 'react';
import { useGameStore } from '../store';
import { MusicSequence } from '../types';
import { Play, Pause, RotateCcw, Copy, Check, Upload, Music, X } from 'lucide-react';

interface MusicEditorProps {
  onClose: () => void;
}

// Frequencies mapped: 0 = rest, 1 = E2, 2 = G2, 3 = A2, 4 = C3, 5 = D3
const BASS_NOTES = [
  { val: 0, label: 'REST', color: 'bg-gray-950 text-gray-500 border-gray-900 hover:bg-gray-900 shadow-none' },
  { val: 1, label: 'E2', color: 'bg-cyan-950/70 text-cyan-400 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' },
  { val: 2, label: 'G2', color: 'bg-blue-950/70 text-blue-400 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' },
  { val: 3, label: 'A2', color: 'bg-purple-950/70 text-purple-400 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]' },
  { val: 4, label: 'C3', color: 'bg-pink-950/70 text-pink-400 border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]' },
  { val: 5, label: 'D3', color: 'bg-orange-950/70 text-orange-400 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' },
];

const PRESETS = [
  {
    name: 'Neon Metal',
    description: 'Heavy, driving arcade metal beat',
    sequence: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      bass:  [1, 0, 1, 0, 2, 0, 2, 0, 3, 0, 3, 0, 1, 1, 2, 3],
      bpm: 160
    }
  },
  {
    name: 'Synthwave Rave',
    description: 'Classic cyberpunk four-on-the-floor loop',
    sequence: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, true],
      bass:  [1, 1, 1, 1, 4, 4, 4, 4, 3, 3, 3, 3, 5, 5, 5, 5],
      bpm: 125
    }
  },
  {
    name: 'Industrial Grind',
    description: 'Glitchy, chaotic beats and mechanical bassline',
    sequence: {
      kick:  [true, false, true, false, false, true, false, false, true, false, true, false, false, true, false, true],
      snare: [false, false, false, false, true, false, false, false, false, true, false, false, true, false, false, false],
      hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      bass:  [3, 3, 0, 1, 1, 0, 2, 2, 5, 0, 4, 0, 3, 1, 2, 5],
      bpm: 145
    }
  },
  {
    name: 'Minimal Techno',
    description: 'Subtle and continuous hypnotizing groove',
    sequence: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      bass:  [1, 0, 0, 1, 0, 0, 1, 0, 2, 0, 0, 2, 0, 0, 1, 0],
      bpm: 130
    }
  }
];

export const MusicEditor: React.FC<MusicEditorProps> = ({ onClose }) => {
  const customMusic = useGameStore(s => s.customMusic);
  const setCustomMusic = useGameStore(s => s.setCustomMusic);
  const currentStep = useGameStore(s => s.currentStep);

  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Helper serialization/deserialization functions
  const getMusicCode = (seq: MusicSequence): string => {
    const k = seq.kick.map(v => v ? '1' : '0').join('');
    const s = seq.snare.map(v => v ? '1' : '0').join('');
    const h = seq.hihat.map(v => v ? '1' : '0').join('');
    const b = seq.bass.map(n => n.toString()).join('');
    return JSON.stringify({ k, s, h, b, bpm: seq.bpm });
  };

  const loadMusicCode = (str: string): MusicSequence | null => {
    try {
      const data = JSON.parse(str.trim());
      if (typeof data.k === 'string' && typeof data.s === 'string' && typeof data.h === 'string' && typeof data.b === 'string' && typeof data.bpm === 'number') {
        const kick = data.k.split('').map((c: string) => c === '1');
        const snare = data.s.split('').map((c: string) => c === '1');
        const hihat = data.h.split('').map((c: string) => c === '1');
        const bass = data.b.split('').map((c: string) => parseInt(c) || 0);
        return {
          kick: kick.slice(0, 16),
          snare: snare.slice(0, 16),
          hihat: hihat.slice(0, 16),
          bass: bass.slice(0, 16),
          bpm: Math.max(60, Math.min(240, data.bpm))
        };
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleToggleStep = (track: 'kick' | 'snare' | 'hihat', index: number) => {
    const updated = { ...customMusic };
    updated[track] = [...updated[track]];
    updated[track][index] = !updated[track][index];
    setCustomMusic(updated);
  };

  const handleBassNoteChange = (index: number, val: number) => {
    const updated = { ...customMusic };
    updated.bass = [...updated.bass];
    updated.bass[index] = val;
    setCustomMusic(updated);
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bpm = parseInt(e.target.value) || 120;
    setCustomMusic({ ...customMusic, bpm });
  };

  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    setCustomMusic({ ...preset.sequence });
  };

  const handleCopyCode = () => {
    const code = getMusicCode(customMusic);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);
    const parsed = loadMusicCode(importCode);
    if (parsed) {
      setCustomMusic(parsed);
      setImportSuccess(true);
      setImportCode('');
      setTimeout(() => setImportSuccess(false), 3000);
    } else {
      setImportError('Invalid track code. Make sure to copy the exact code block.');
    }
  };

  const handleClear = () => {
    setCustomMusic({
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      bass: Array(16).fill(0),
      bpm: 140
    });
  };

  return (
    <div id="music-editor-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-gray-950 border-4 border-cyan-500 rounded-xl p-6 md:p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.3)]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <Music className="text-cyan-400 w-8 h-8 animate-bounce" />
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic tracking-wider">
              CYBER BEAT SEQUENCER
            </h2>
            <p className="text-xs text-gray-400 font-mono uppercase">Interactive 16-Step Music & Riff Designer</p>
          </div>
        </div>

        {/* Presets Row */}
        <div className="mb-6">
          <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase mb-2">Sound Presets</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleLoadPreset(preset)}
                className="bg-gray-900 border border-gray-800 hover:border-cyan-500 hover:bg-cyan-950/20 px-3 py-2 text-left rounded transition group"
              >
                <div className="font-bold text-white text-sm group-hover:text-cyan-300">{preset.name}</div>
                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header Steps Labels */}
            <div className="flex items-center mb-2">
              <div className="w-20 text-xs font-mono font-bold text-gray-500 uppercase">Track</div>
              <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5 text-center">
                {Array.from({ length: 16 }).map((_, i) => {
                  const isCurrent = i === currentStep;
                  const beatGroup = i > 0 && i % 4 === 0 ? 'ml-2 border-l border-gray-700 pl-1.5' : '';
                  return (
                    <div 
                      key={i} 
                      className={`text-[10px] font-mono font-black py-1 transition-all duration-75 ${
                        isCurrent 
                          ? 'text-yellow-400 scale-110 font-bold bg-yellow-400/20 rounded border border-yellow-400/40 shadow-[0_0_8px_rgba(234,179,8,0.4)]' 
                          : (i % 4 === 0 ? 'text-cyan-400' : 'text-gray-500')
                      } ${beatGroup}`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KICK Row */}
            <div className="flex items-center mb-3">
              <div className="w-20 text-xs font-mono font-bold text-red-500 uppercase">Kick Drum</div>
              <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                {customMusic.kick.map((active, i) => {
                  const isCurrent = i === currentStep;
                  const beatGroup = i > 0 && i % 4 === 0 ? 'ml-2 border-l border-gray-700 pl-1.5' : '';
                  const activeStyle = active 
                    ? 'bg-red-500 border-red-700 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                    : 'bg-gray-950 border-gray-800 hover:bg-gray-800';
                  const currentStyle = isCurrent 
                    ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)] scale-105 z-10' 
                    : '';
                  return (
                    <button
                      key={i}
                      onClick={() => handleToggleStep('kick', i)}
                      className={`h-10 rounded border-b-4 transition-all duration-75 ${activeStyle} ${currentStyle} ${beatGroup} ${i % 4 === 0 && !active ? 'border-cyan-950 bg-gray-950/40' : ''}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* SNARE Row */}
            <div className="flex items-center mb-3">
              <div className="w-20 text-xs font-mono font-bold text-green-400 uppercase">Snare</div>
              <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                {customMusic.snare.map((active, i) => {
                  const isCurrent = i === currentStep;
                  const beatGroup = i > 0 && i % 4 === 0 ? 'ml-2 border-l border-gray-700 pl-1.5' : '';
                  const activeStyle = active 
                    ? 'bg-green-400 border-green-600 shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                    : 'bg-gray-950 border-gray-800 hover:bg-gray-800';
                  const currentStyle = isCurrent 
                    ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)] scale-105 z-10' 
                    : '';
                  return (
                    <button
                      key={i}
                      onClick={() => handleToggleStep('snare', i)}
                      className={`h-10 rounded border-b-4 transition-all duration-75 ${activeStyle} ${currentStyle} ${beatGroup} ${i % 4 === 0 && !active ? 'border-cyan-950 bg-gray-950/40' : ''}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* HIHAT Row */}
            <div className="flex items-center mb-4">
              <div className="w-20 text-xs font-mono font-bold text-yellow-400 uppercase">Hi-Hat</div>
              <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                {customMusic.hihat.map((active, i) => {
                  const isCurrent = i === currentStep;
                  const beatGroup = i > 0 && i % 4 === 0 ? 'ml-2 border-l border-gray-700 pl-1.5' : '';
                  const activeStyle = active 
                    ? 'bg-yellow-400 border-yellow-600 shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                    : 'bg-gray-950 border-gray-800 hover:bg-gray-800';
                  const currentStyle = isCurrent 
                    ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)] scale-105 z-10' 
                    : '';
                  return (
                    <button
                      key={i}
                      onClick={() => handleToggleStep('hihat', i)}
                      className={`h-10 rounded border-b-4 transition-all duration-75 ${activeStyle} ${currentStyle} ${beatGroup} ${i % 4 === 0 && !active ? 'border-cyan-950 bg-gray-950/40' : ''}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* BASS/RIFF Row */}
            <div className="flex items-center border-t border-gray-800 pt-4">
              <div className="w-20 text-xs font-mono font-bold text-cyan-400 uppercase">Bass Riff</div>
              <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5">
                {customMusic.bass.map((val, i) => {
                  const isCurrent = i === currentStep;
                  const beatGroup = i > 0 && i % 4 === 0 ? 'ml-2 border-l border-gray-700 pl-1.5' : '';
                  const currentStyle = isCurrent 
                    ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)] scale-105 z-10' 
                    : '';
                  return (
                    <div key={i} className={`flex flex-col items-center ${beatGroup}`}>
                      <button
                        onClick={() => {
                          const nextVal = (val + 1) % BASS_NOTES.length;
                          handleBassNoteChange(i, nextVal);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleBassNoteChange(i, 0); // Reset on Right-Click
                        }}
                        title="Left-click to cycle note, Right-click to clear"
                        className={`w-full h-10 rounded border-b-4 font-mono text-xs font-black text-center flex items-center justify-center transition-all duration-75 ${
                          BASS_NOTES[val]?.color || 'text-gray-600 border-gray-800'
                        } ${currentStyle}`}
                      >
                        {BASS_NOTES[val]?.label || 'REST'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* BPM & Actions Slider */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Tempo (BPM): {customMusic.bpm}</span>
            <input
              type="range"
              min="80"
              max="200"
              value={customMusic.bpm}
              onChange={handleBpmChange}
              className="w-32 accent-cyan-400 cursor-pointer"
            />
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 border border-gray-800 hover:border-red-500 hover:bg-red-950/20 text-xs font-bold text-gray-400 hover:text-red-400 rounded transition"
          >
            <RotateCcw size={14} /> Reset Grid
          </button>
        </div>

        {/* Share & Import System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-800 pt-6">
          {/* Share Code */}
          <div className="bg-gray-900/50 p-4 border border-gray-800 rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase font-mono mb-1">Share Your Track</h4>
              <p className="text-xs text-gray-500 mb-3 leading-snug">Copy the serialized code below and share it, or send it to the developer to persist it permanently!</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={getMusicCode(customMusic)}
                className="flex-1 bg-gray-950 border border-gray-800 text-xs font-mono px-3 py-2 rounded text-gray-400 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase rounded transition font-mono whitespace-nowrap"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Import Code */}
          <div className="bg-gray-900/50 p-4 border border-gray-800 rounded-lg flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase font-mono mb-1">Import Custom Track</h4>
              <p className="text-xs text-gray-500 mb-3 leading-snug">Paste a shared track code below to load your custom soundtrack into the battle arena!</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder='Paste track JSON here...'
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                className="flex-1 bg-gray-950 border border-gray-800 text-xs font-mono px-3 py-2 rounded text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase rounded transition font-mono whitespace-nowrap"
              >
                <Upload size={14} />
                Load Code
              </button>
            </div>
            {importError && <p className="text-red-400 text-[11px] font-mono mt-1.5">{importError}</p>}
            {importSuccess && <p className="text-green-400 text-[11px] font-mono mt-1.5">✓ Track loaded successfully!</p>}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-[11px] font-mono text-gray-500 uppercase tracking-wider">
          💡 The track you design here will play live in the character select and battle arenas!
        </div>
      </div>
    </div>
  );
};
