import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { GameState, ActionType } from '../types';
import { motion } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Fighter3D } from './Fighter3D';

const noEvents = () => ({
  enabled: false,
  priority: 0,
  compute: () => {},
  connect: () => {},
  disconnect: () => {},
});

export const VSScreen: React.FC = () => {
  const player = useGameStore(s => s.player);
  const enemy = useGameStore(s => s.enemy);
  const setGameState = useGameStore(s => s.setGameState);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (countdown <= 0) {
      setGameState(GameState.CINEMATIC_INTRO);
    }
  }, [countdown, setGameState]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div id="vs-screen-container" className="absolute inset-0 z-50 flex flex-col justify-between bg-black text-white select-none overflow-hidden font-sans">
      
      {/* 3D Previews (Background layer) */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows events={noEvents}>
          <PerspectiveCamera makeDefault position={[0, 1.2, 5.5]} fov={40} />
          <Environment preset="city" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-5, 2, -5]} intensity={1} color="#00ffff" />
          <directionalLight position={[5, 2, -5]} intensity={1} color="#ff0000" />
          
          {/* Player Preview */}
          <group>
             <Fighter3D who="player" />
          </group>

          {/* Enemy Preview */}
          <group>
             <Fighter3D who="enemy" />
          </group>
          
          <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={15} blur={2.5} far={4} color="#000000" />
        </Canvas>
      </div>

      {/* Top Banner with Countdown */}
      <div className="w-full flex justify-center items-center py-6 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="text-center">
          <div className="text-sm text-gray-400 font-mono tracking-widest uppercase mb-2">BATTLE START IN</div>
          <motion.div 
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-6xl font-black text-yellow-400 font-mono tracking-tighter"
          >
            {countdown}
          </motion.div>
        </div>
      </div>

      {/* Center VS Divider */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-yellow-400 flex items-center justify-center border-[12px] border-black shadow-[0_0_80px_rgba(250,204,21,0.8)] transform"
        >
          <span className="text-black font-black text-4xl md:text-6xl italic tracking-tighter">VS</span>
        </motion.div>
        
        {/* Flash line effect across center */}
        <div className="hidden md:block absolute top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-50 shadow-[0_0_40px_rgba(250,204,21,1)] -skew-x-12" />
      </div>

      {/* Name Overlays (Above characters) */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10 px-8">
        
        {/* Left Fighter Name */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute left-[20%] top-[10%] text-center"
        >
          <div className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase mb-1">PLAYER 1</div>
          <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white text-shadow-cyan">
            {player.name}
          </h2>
        </motion.div>

        {/* Right Fighter Name */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute right-[20%] top-[10%] text-center"
        >
          <div className="text-red-500 font-mono text-[10px] tracking-widest uppercase mb-1">CPU</div>
          <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white text-shadow-red">
            {enemy.name}
          </h2>
        </motion.div>

      </div>
    </div>
  );
};
