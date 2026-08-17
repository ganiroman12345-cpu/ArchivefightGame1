import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { Fighter3D } from './Fighter3D';
import { ActionType } from '../types';
import { playFighterSelectSound } from '../utils/audio';

interface Character {
  id: string;
  name: string;
  color: string;
  subColor: string;
  modelType: string;
  description: string;
}

interface FighterPreviewCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
}

const noEvents = () => ({
  enabled: false,
  priority: 0,
  compute: () => {},
  connect: () => {},
  disconnect: () => {},
});

export const FighterPreviewCard: React.FC<FighterPreviewCardProps> = ({ character, isSelected, onSelect }) => {
  const previewState = {
    name: character.name,
    modelType: character.modelType,
    color: character.color,
    subColor: character.subColor,
    action: ActionType.IDLE,
    direction: 1,
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100
  };

  return (
    <button
      id={`fighter-preview-btn-${character.id}`}
      onClick={() => {
        playFighterSelectSound();
        onSelect();
      }}
      className={`w-20 h-32 bg-slate-950 border-4 flex flex-col items-center justify-between p-1 relative group overflow-hidden transition-all duration-300 transform skew-x-[-4deg] hover:scale-105 active:scale-95 ${
        isSelected 
          ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] bg-slate-900/80 z-10 scale-110' 
          : 'border-slate-800 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] z-0'
      }`}
    >
      {/* Background radial gradient corresponding to character color */}
      <div 
        className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top, ${character.color} 0%, transparent 80%)`
        }}
      />
      {/* 3D Canvas Viewport - Rendered when selected for ultra-smooth 60fps performance */}
      <div id={`fighter-preview-canvas-container-${character.id}`} className="w-full h-32 relative z-10 overflow-hidden bg-black/60 border-b-2 border-slate-800 flex items-center justify-center">
        {isSelected ? (
          <Canvas dpr={[1, 1.25]} gl={{ powerPreference: 'high-performance' }} shadows events={noEvents} camera={{ position: [0, 0.45, 1.8], fov: 35 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 4, 3]} intensity={1.5} />
            <directionalLight position={[-3, 2, -2]} intensity={0.5} color={character.color} />
            
            <group position={[0, -0.3, 0]}>
              <Fighter3D who="preview" previewState={previewState} />
            </group>

            <ContactShadows position={[0, -0.75, 0]} opacity={0.8} scale={4} blur={2} far={2} color="#000000" />
          </Canvas>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div 
              className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center font-black text-lg italic shadow-lg"
              style={{ backgroundColor: character.color, color: '#000' }}
            >
              {character.name.charAt(0)}
            </div>
          </div>
        )}
      </div>

      {/* Text block & Name */}
      <div id={`fighter-preview-info-${character.id}`} className="relative z-10 w-full text-center flex flex-col justify-center flex-grow mt-2 bg-gradient-to-t from-black to-transparent pt-1">
        <div className="text-xs font-black text-white italic uppercase tracking-widest leading-none truncate drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
          {character.name}
        </div>
        <div className="text-[8px] text-cyan-400 font-mono uppercase tracking-widest mt-1">
          {character.modelType === 'FOX' ? 'STRIKER' : 'BRUISER'}
        </div>
      </div>
    </button>
  );
};
