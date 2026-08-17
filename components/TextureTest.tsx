import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { getProceduralTexture } from './Fighter3D';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import * as THREE from 'three';

const TEXTURES = [
  { name: 'MECHA Gray', type: 'MECHA', color: '#6b7280' },
  { name: 'MECHA Red', type: 'MECHA', color: '#8b0000' },
  { name: 'ALIEN Purple', type: 'ALIEN', color: '#800080' },
  { name: 'ALIEN Cyan', type: 'ALIEN', color: '#00f0ff' },
  { name: 'SAKURA Pink', type: 'SAKURA', color: '#ff66b2' },
  { name: 'FUR Light Blue', type: 'FUR', color: '#38bdf8' },
  { name: 'MECHA Gold', type: 'MECHA', color: '#ffd700' },
  { name: 'MECHA Gold Bright', type: 'MECHA', color: '#ffe53b' },
  { name: 'MECHA Gold Bronze', type: 'MECHA', color: '#cd7f32' },
  { name: 'ALIEN Neon Green', type: 'ALIEN', color: '#39ff14' },
  { name: 'SAKURA Red', type: 'SAKURA', color: '#dc2626' },
  { name: 'FUR White', type: 'FUR', color: '#ffffff' },
  { name: 'CLASSIC Red', type: 'CLASSIC', color: '#ff0000' },
  { name: 'CLASSIC Blue', type: 'CLASSIC', color: '#0000ff' },
  { name: 'CLASSIC Green', type: 'CLASSIC', color: '#00ff00' },
  { name: 'CLASSIC Yellow', type: 'CLASSIC', color: '#ffff00' },
  { name: 'CLASSIC Black', type: 'CLASSIC', color: '#111111' },
  { name: 'CLASSIC Gi White', type: 'CLASSIC', color: '#ffffff' },
  { name: 'WOOD Pine', type: 'WOOD', color: '#c19a6b' },
  { name: 'WOOD Oak', type: 'WOOD', color: '#8b5a2b' },
  { name: 'WOOD Dark Ebony', type: 'WOOD', color: '#3d2715' },
  { name: 'STONE Cobble', type: 'STONE', color: '#555555' },
  { name: 'STONE Slate', type: 'STONE', color: '#3f3f46' },
  { name: 'STONE Granite', type: 'STONE', color: '#a1a1aa' },
  { name: 'LAVA Texture', type: 'LAVA', color: '#ff2200' },
  { name: 'METAL Texture', type: 'METAL', color: '#9ca3af' },
  { name: 'CARBON Texture', type: 'CARBON', color: '#1f2937' },
  { name: 'MARBLE Texture', type: 'MARBLE', color: '#f3f4f6' },
  { name: 'ICE Texture', type: 'ICE', color: '#bbf7ff' },
  { name: 'BRICK Texture', type: 'BRICK', color: '#b91c1c' },
  { name: 'LEATHER Texture', type: 'LEATHER', color: '#451a03' },
  { name: 'FABRIC Texture', type: 'FABRIC', color: '#312e81' },
];

const noEvents = () => ({
  enabled: false,
  priority: 0,
  compute: () => {},
  connect: () => {},
  disconnect: () => {},
});

const RotatingBox: React.FC<{ texture: THREE.CanvasTexture; color: string }> = ({ texture, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.2;
      meshRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial map={texture} color={color} />
    </mesh>
  );
};

export const TextureTest: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [index, setIndex] = useState(0);

  const texDef = TEXTURES[index];
  const texture = getProceduralTexture(texDef.type, texDef.color);

  const handlePrev = () => {
    setIndex((i) => (i - 1 + TEXTURES.length) % TEXTURES.length);
  };
  const handleNext = () => {
    setIndex((i) => (i + 1) % TEXTURES.length);
  };

  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors"
      >
        <X size={32} />
      </button>

      <div className="text-3xl font-black text-cyan-400 uppercase tracking-widest mb-8">
        Texture Test
      </div>

      <div className="w-[300px] h-[300px] bg-gray-900 border-2 border-cyan-500 rounded-lg overflow-hidden mb-6 relative">
        <Canvas events={noEvents} camera={{ position: [0, 0, 3], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <RotatingBox texture={texture} color={texDef.color} />
        </Canvas>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={handlePrev} className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full">
          <ArrowLeft />
        </button>
        <div className="w-48 text-center text-xl font-mono text-white">
          {texDef.name}
        </div>
        <button onClick={handleNext} className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full">
          <ArrowRight />
        </button>
      </div>
    </div>
  );
};
