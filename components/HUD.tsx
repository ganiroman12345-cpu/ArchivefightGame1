import React from 'react';
import { useGameStore } from '../store';
import { GameState } from '../types';

export const HUD: React.FC = () => {
  const playerHp = useGameStore(s => s.player.hp);
  const playerMaxHp = useGameStore(s => s.player.maxHp);
  const playerEnergy = useGameStore(s => s.player.energy);
  const playerName = useGameStore(s => s.player.name);
  const playerColor = useGameStore(s => s.player.color);
  const playerWins = useGameStore(s => s.playerWins);

  const enemyHp = useGameStore(s => s.enemy.hp);
  const enemyMaxHp = useGameStore(s => s.enemy.maxHp);
  const enemyEnergy = useGameStore(s => s.enemy.energy);
  const enemyName = useGameStore(s => s.enemy.name);
  const enemyColor = useGameStore(s => s.enemy.color);
  const enemyWins = useGameStore(s => s.enemyWins);

  const gameState = useGameStore(s => s.gameState);
  const introText = useGameStore(s => s.introText);
  const showKoBanner = useGameStore(s => s.showKoBanner);
  const timer = useGameStore(s => s.timer);
  const combatLogs = useGameStore(s => s.combatLogs);

  const getHealthPercent = (current: number, max: number) => (current / max) * 100;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      <div className="flex justify-between items-start w-full max-w-6xl mx-auto p-4 md:p-6 mt-2">
        
        {/* Player Health & Energy */}
        <div className="w-[43%]">
          <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col">
              <span 
                className="font-black uppercase tracking-widest text-lg italic drop-shadow-[0_4px_4px_rgba(0,0,0,1)]" 
                style={{ color: '#fff', textShadow: `0 0 10px ${playerColor}, 0 0 20px ${playerColor}` }}>
                {playerName}
              </span>
              <div className="flex gap-2 mt-1 ml-1">
                {[0, 1, 2].map(i => (
                  <div key={`p-win-${i}`} className={`w-4 h-4 rounded-full border-2 border-white/80 shadow-[0_0_5px_rgba(0,0,0,0.8)] ${i < playerWins ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-gray-600/80 backdrop-blur-sm'}`} />
                ))}
              </div>
            </div>
          </div>
          {/* Health Bar Wrapper */}
          <div className="h-9 w-full bg-black/60 border-2 border-white/50 skew-x-[-20deg] p-0.5 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-sm relative">
             {/* Red damage trailing bar */}
             <div 
                className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-1000 ease-out"
                style={{ width: `${getHealthPercent(playerHp, playerMaxHp)}%` }}
              />
             {/* Main health bar */}
             <div 
                className="absolute top-0 left-0 h-full transition-all duration-150 ease-out"
                style={{ 
                  width: `${getHealthPercent(playerHp, playerMaxHp)}%`, 
                  backgroundColor: playerColor,
                  boxShadow: `inset 0 0 15px rgba(255,255,255,0.5), 0 0 10px ${playerColor}`
                }}
              />
          </div>
          {/* Energy Bar */}
          <div className="h-5 w-4/5 mt-2 bg-black/80 border border-white/20 skew-x-[-20deg] relative overflow-hidden flex items-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
             <div 
                className={`absolute top-0 left-0 h-full transition-all duration-300 ${playerEnergy >= 100 ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse' : 'bg-gradient-to-r from-cyan-900 to-cyan-600 opacity-90'}`}
                style={{ width: `${playerEnergy}%` }}
              />
             <span className="relative z-10 text-[8px] font-black tracking-widest text-white px-3 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                {playerEnergy >= 100 ? 'MAXIMUM POWER' : `ENERGY ${Math.floor(playerEnergy)}%`}
             </span>
          </div>
        </div>

        {/* Timer / VS */}
        <div className="w-[10%] flex flex-col justify-center items-center mt-1">
            <div className="bg-black/40 backdrop-blur-md text-white font-black text-5xl italic w-20 h-20 flex items-center justify-center rounded-lg border-2 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{timer}</span>
            </div>
            <span className="text-[12px] text-white/70 font-black tracking-[0.3em] mt-2 bg-black/50 px-3 py-1 rounded-full">TIME</span>
        </div>

        {/* Enemy Health & Energy */}
        <div className="w-[43%]">
          <div className="flex justify-end items-end mb-2">
            <div className="flex flex-col items-end">
              <span 
                className="font-black uppercase tracking-widest text-lg italic drop-shadow-[0_4px_4px_rgba(0,0,0,1)]" 
                style={{ color: '#fff', textShadow: `0 0 10px ${enemyColor}, 0 0 20px ${enemyColor}` }}>
                {enemyName}
              </span>
              <div className="flex gap-2 mt-1 mr-1">
                {[0, 1, 2].map(i => (
                  <div key={`e-win-${i}`} className={`w-4 h-4 rounded-full border-2 border-white/80 shadow-[0_0_5px_rgba(0,0,0,0.8)] ${i < enemyWins ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-gray-600/80 backdrop-blur-sm'}`} />
                ))}
              </div>
            </div>
          </div>
          {/* Health Bar Wrapper */}
          <div className="h-9 w-full bg-black/60 border-2 border-white/50 skew-x-[20deg] p-0.5 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-sm relative flex justify-end">
             {/* Red damage trailing bar */}
             <div 
                className="absolute top-0 right-0 h-full bg-red-600 transition-all duration-1000 ease-out"
                style={{ width: `${getHealthPercent(enemyHp, enemyMaxHp)}%` }}
              />
             {/* Main health bar */}
             <div 
                className="absolute top-0 right-0 h-full transition-all duration-150 ease-out"
                style={{ 
                  width: `${getHealthPercent(enemyHp, enemyMaxHp)}%`, 
                  backgroundColor: enemyColor,
                  boxShadow: `inset 0 0 15px rgba(255,255,255,0.5), 0 0 10px ${enemyColor}`
                }}
              />
          </div>
          {/* Energy Bar */}
          <div className="h-5 w-4/5 mt-2 bg-black/80 border border-white/20 skew-x-[20deg] relative overflow-hidden flex items-center justify-end ml-auto shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
             <div 
                className={`absolute top-0 right-0 h-full transition-all duration-300 ${enemyEnergy >= 100 ? 'bg-gradient-to-l from-cyan-400 via-blue-500 to-cyan-400 animate-pulse' : 'bg-gradient-to-l from-cyan-900 to-cyan-600 opacity-90'}`}
                style={{ width: `${enemyEnergy}%` }}
              />
             <span className="relative z-10 text-[8px] font-black tracking-widest text-white px-3 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                {enemyEnergy >= 100 ? 'MAXIMUM POWER' : `ENERGY ${Math.floor(enemyEnergy)}%`}
             </span>
          </div>
        </div>
      </div>

      {/* Replay Indicators */}
      {gameState === GameState.REPLAY && (
        <div className="absolute top-1/2 left-0 w-full flex flex-col items-center justify-center pointer-events-none">
           <div className="bg-red-600/80 backdrop-blur-md px-12 py-4 skew-x-[-20deg] border-y-4 border-white animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.5)]">
              <span className="text-white font-black text-6xl italic tracking-tighter drop-shadow-lg">
                REPLAY
              </span>
           </div>
           <div className="mt-8 bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/30 animate-bounce">
              <span className="text-white font-black text-xl tracking-[0.2em] uppercase">
                Click screen to skip
              </span>
           </div>
        </div>
      )}

      {/* Intro Text Overlay */}
      {introText && gameState === GameState.FIGHTING && !showKoBanner && (
         <div className="absolute top-1/3 left-0 w-full text-center flex justify-center items-center">
            <h1 className="text-6xl md:text-8xl font-black italic text-white drop-shadow-[0_0_20px_rgba(255,200,0,1)] animate-pulse" style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
                {introText}
            </h1>
         </div>
      )}

      {/* Stylized Animated K.O. Banner Overlay */}
      {showKoBanner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-[fadeIn_0.5s_ease-out,fadeOut_0.5s_ease-in_2.5s_forwards]">
          <div className="relative flex flex-col items-center justify-center">
            <div className="absolute w-[150%] h-64 bg-gradient-to-r from-transparent via-red-900/60 to-transparent skew-y-[-5deg] backdrop-blur-md" />
            
            <div className="relative text-center transform hover:scale-105 transition-transform duration-75">
              <span 
                className="text-9xl md:text-[14rem] font-black italic tracking-tighter text-yellow-500 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]" 
                style={{ 
                  textShadow: '8px 8px 0 #991b1b, 12px 12px 0 #7f1d1d, 0 0 60px #dc2626', 
                  WebkitTextStroke: '3px white' 
                }}>
                K.O.
              </span>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: scale(2) rotate(-10deg); filter: blur(10px); } to { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0px); } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
          `}</style>
        </div>
      )}


    </div>
  );
};
