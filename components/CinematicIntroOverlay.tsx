import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { GameState, ActionType } from '../types';
import { CHARACTERS } from '../constants';
import { announceFighterIntro, announceVoice, announceRound, announceFight } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';

export const CinematicIntroOverlay: React.FC = () => {
  const gameState = useGameStore(s => s.gameState);
  const player = useGameStore(s => s.player);
  const enemy = useGameStore(s => s.enemy);
  const currentRound = useGameStore(s => s.currentRound);
  const setGameState = useGameStore(s => s.setGameState);
  const setCinematicState = useGameStore(s => s.setCinematicState);
  const updateFighter = useGameStore(s => s.updateFighter);
  const setIntroText = useGameStore(s => s.setIntroText);

  const [phase, setPhase] = useState<'p1' | 'p2'>('p1');
  const [currentQuote, setCurrentQuote] = useState('');

  const p1Char = CHARACTERS.find(c => c.name.toLowerCase() === player.name.toLowerCase()) || CHARACTERS[0];
  const p2Char = CHARACTERS.find(c => c.name.toLowerCase() === enemy.name.toLowerCase()) || CHARACTERS[1];

  const skipIntro = () => {
    updateFighter('player', { action: ActionType.IDLE });
    updateFighter('enemy', { action: ActionType.IDLE });
    setCinematicState(null, null, '');
    setGameState(GameState.FIGHTING);
    announceRound(currentRound);
    setTimeout(() => {
      announceFight();
      setIntroText('¡PELEAN!');
    }, 1200);
  };

  useEffect(() => {
    if (gameState !== GameState.CINEMATIC_INTRO) return;

    let p2Timer: NodeJS.Timeout;
    let endTimer: NodeJS.Timeout;

    const getRandomQuote = (char: typeof p1Char) => {
      const list = (char as any).quotesEs || [char.quoteEs || '¡No podrás vencerme!'];
      return list[Math.floor(Math.random() * list.length)];
    };

    // STEP 1: P1 Cinematic Presentation Pose
    setPhase('p1');
    const quote1 = getRandomQuote(p1Char);
    setCurrentQuote(quote1);
    setCinematicState('p1', 'player', quote1);
    
    // Set P1 presentation pose (non-attack pose)
    const action1 = (ActionType as any)[p1Char.introAction] || ActionType.INTRO_POWERUP;
    updateFighter('player', { action: action1 });
    updateFighter('enemy', { action: ActionType.IDLE });

    // Announce P1
    announceFighterIntro(p1Char.name, true);
    setTimeout(() => {
      announceVoice(quote1, 'es-ES');
    }, 800);

    // STEP 2: P2 Cinematic Presentation Pose after 3.6s
    p2Timer = setTimeout(() => {
      setPhase('p2');
      const quote2 = getRandomQuote(p2Char);
      setCurrentQuote(quote2);
      setCinematicState('p2', 'enemy', quote2);

      updateFighter('player', { action: ActionType.IDLE });
      const action2 = (ActionType as any)[p2Char.introAction] || ActionType.INTRO_AURA;
      updateFighter('enemy', { action: action2 });

      announceFighterIntro(p2Char.name, false);
      setTimeout(() => {
        announceVoice(quote2, 'es-ES');
      }, 800);
    }, 3600);

    // STEP 3: Complete Intro & Start Round
    endTimer = setTimeout(() => {
      skipIntro();
    }, 7200);

    return () => {
      clearTimeout(p2Timer);
      clearTimeout(endTimer);
    };
  }, [gameState]);

  if (gameState !== GameState.CINEMATIC_INTRO) return null;

  return (
    <div id="cinematic-intro-overlay" className="absolute inset-0 z-50 pointer-events-none select-none">
      {/* Top Bar: Skip Button ONLY */}
      <div className="absolute top-6 right-6 z-10">
        <button
          id="skip-intro-btn"
          onClick={skipIntro}
          className="pointer-events-auto px-5 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-yellow-200 text-black font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.6)] transform hover:scale-105 active:scale-95 transition-all"
        >
          OMITIR [SKIP] ⏩
        </button>
      </div>

      {/* Subtitles strictly pinned to the bottom of the screen */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-end px-4 z-20">
        <AnimatePresence mode="wait">
          {phase === 'p1' && (
            <motion.div
              key="p1-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl w-full text-center flex flex-col items-center bg-black/80 backdrop-blur-md border border-yellow-500/40 rounded-2xl py-3 px-6 shadow-2xl"
            >
              <span className="text-yellow-400 font-black text-sm md:text-base uppercase tracking-widest drop-shadow">
                {p1Char.name}
              </span>
              <p className="text-white font-bold text-lg md:text-2xl leading-snug drop-shadow mt-0.5">
                "{currentQuote}"
              </p>
            </motion.div>
          )}

          {phase === 'p2' && (
            <motion.div
              key="p2-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl w-full text-center flex flex-col items-center bg-black/80 backdrop-blur-md border border-red-500/40 rounded-2xl py-3 px-6 shadow-2xl"
            >
              <span className="text-red-400 font-black text-sm md:text-base uppercase tracking-widest drop-shadow">
                {p2Char.name}
              </span>
              <p className="text-white font-bold text-lg md:text-2xl leading-snug drop-shadow mt-0.5">
                "{currentQuote}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
