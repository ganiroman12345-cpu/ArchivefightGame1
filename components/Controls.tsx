import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, Shield, Zap, Target, ArrowUp, Footprints, Hand, Sparkles, AlertTriangle } from 'lucide-react';
import { ActionType } from '../types';
import { useGameStore } from '../store';

interface ControlsProps {
  onAction: (action: ActionType) => void;
  onRelease: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ onAction, onRelease }) => {
  const energy = useGameStore(s => s.player.energy);
  const playerName = useGameStore(s => s.player.name);
  
  // Double tap detection refs
  const lastRightTapRef = useRef<number>(0);
  const lastLeftTapRef = useRef<number>(0);
  const lastCrouchTapRef = useRef<number>(0);
  const doubleTapThreshold = 300; // ms

  const handlePointerDown = (action: ActionType) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();

    // Special logic for Sliding (Double Tap Crouch)
    if (action === ActionType.CROUCH) {
        if (now - lastCrouchTapRef.current < doubleTapThreshold) {
            onAction(ActionType.SLIDE);
            lastCrouchTapRef.current = 0; // Reset
            return;
        }
        lastCrouchTapRef.current = now;
    }

    // Special logic for Sliding (Double Tap Right/Forward)
    if (action === ActionType.MOVE_FORWARD) {
        if (now - lastRightTapRef.current < doubleTapThreshold) {
            onAction(ActionType.RUN_FORWARD);
            lastRightTapRef.current = 0; // Reset
            return;
        }
        lastRightTapRef.current = now;
    }

    // Special logic for Sliding (Double Tap Left/Backward)
    if (action === ActionType.MOVE_BACKWARD) {
        if (now - lastLeftTapRef.current < doubleTapThreshold) {
            onAction(ActionType.RUN_FORWARD);
            lastLeftTapRef.current = 0; // Reset
            return;
        }
        lastLeftTapRef.current = now;
    }

    let finalAction = action;
    if (action === ActionType.KICK) {
        const player = useGameStore.getState().player;
        if (player.action === ActionType.CROUCH) finalAction = ActionType.SPIN_KICK;
    }

    onAction(finalAction);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRelease();
  };

  // Shared button styles
  const btnBase = "rounded-full border-2 transition flex items-center justify-center shadow-lg active:scale-95 touch-none select-none cursor-pointer";
  const moveBtn = `${btnBase} w-16 h-16 bg-gray-800/80 border-gray-600 active:bg-cyan-600`;
  const actionBtn = `${btnBase} bg-opacity-90 backdrop-blur-sm`;

  return (
    <div className="absolute bottom-4 left-0 w-full px-4 pb-2 flex justify-between items-end z-20 noselect pointer-events-auto touch-none">
      
      {/* LEFT: MOVEMENT, BLOCK, CROUCH */}
      <div className="flex flex-col gap-2 mb-2">
        {/* Left/Right Row */}
        <div className="flex gap-2">
            <button
                className={moveBtn}
                onPointerDown={handlePointerDown(ActionType.MOVE_BACKWARD)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <ArrowLeft className="text-white w-8 h-8" />
            </button>
            <button
                className={moveBtn}
                onPointerDown={handlePointerDown(ActionType.MOVE_FORWARD)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <ArrowRight className="text-white w-8 h-8" />
            </button>
        </div>
        
        {/* Down/Block Row */}
        <div className="flex gap-2 justify-center">
             <button
                className={`${moveBtn} w-14 h-14 bg-gray-800/80 border-gray-600 active:bg-cyan-600`}
                onPointerDown={handlePointerDown(ActionType.CROUCH)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <ArrowDown className="text-white w-6 h-6" />
            </button>
            <button
                className={`${actionBtn} w-14 h-14 bg-blue-900 border-blue-500 active:bg-blue-700`}
                onPointerDown={handlePointerDown(ActionType.BLOCK)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <Shield className="text-white w-6 h-6" />
            </button>
        </div>
      </div>

      {/* RIGHT: ATTACK CLUSTER (Arcade Layout) */}
      <div className="grid grid-cols-3 gap-3 mb-2 transform -translate-x-2 items-end">
         
          {/* Special Button */}
          <div className="flex flex-col gap-2 mb-2 items-center justify-end">
             <button
                className={`${actionBtn} w-16 h-16 relative ${energy >= 100 ? 'bg-amber-400 border-yellow-200 shadow-[0_0_25px_rgba(250,204,21,1)] scale-110 animate-pulse active:bg-yellow-300' : 'bg-gray-800/90 border-gray-600 opacity-60'} transition-all`}
                onPointerDown={handlePointerDown(ActionType.SPECIAL_ULTIMATE)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {playerName === 'Iron Jin' ? (
                    <Target className={`w-8 h-8 ${energy >= 100 ? 'text-black font-bold' : 'text-gray-400'}`} />
                ) : (
                    <Sparkles className={`w-8 h-8 ${energy >= 100 ? 'text-black font-bold animate-spin' : 'text-gray-400'}`} />
                )}
                <span className={`absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded border ${energy >= 100 ? 'bg-yellow-400 text-black border-black animate-bounce' : 'bg-gray-900 text-gray-300 border-gray-700'}`}>
                   {energy >= 100 ? 'ULTRA!' : `${Math.floor(energy)}%`}
                </span>
            </button>
          </div>

         {/* Punches */}
         <div className="flex flex-col gap-2">
            <button
              className={`${actionBtn} w-16 h-16 bg-yellow-900 border-yellow-500 active:bg-yellow-600`}
              onPointerDown={handlePointerDown(ActionType.JAB)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <Zap className="text-white w-6 h-6" />
            </button>

            <button
              className={`${actionBtn} w-16 h-16 bg-purple-900 border-purple-500 active:bg-purple-600`}
              onPointerDown={handlePointerDown(ActionType.UPPERCUT)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <ArrowUp className="text-white w-7 h-7" />
            </button>
        </div>

        {/* Kicks */}
        <div className="flex flex-col gap-2">
            <button
              className={`${actionBtn} w-16 h-16 bg-red-900 border-red-500 active:bg-red-600`}
              onPointerDown={handlePointerDown(ActionType.CROSS)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <Target className="text-white w-6 h-6" />
            </button>

            <button
              className={`${actionBtn} w-16 h-16 bg-orange-900 border-orange-500 active:bg-orange-600`}
              onPointerDown={handlePointerDown(ActionType.KICK)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <Footprints className="text-white w-7 h-7" />
            </button>
        </div>
      </div>
    </div>
  );
};