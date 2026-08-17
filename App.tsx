import React, { useEffect, useRef, useCallback, useState } from 'react';
import { GameScene } from './components/GameScene';
import { HUD } from './components/HUD';
import { Controls } from './components/Controls';
import { MusicSystem } from './components/MusicSystem';
import { MusicEditor } from './components/MusicEditor';
import { TextureTest } from './components/TextureTest';
import { VSScreen } from './components/VSScreen';
import { CinematicIntroOverlay } from './components/CinematicIntroOverlay';
import { FighterPreviewCard } from './components/FighterPreviewCard';
import { useGameStore } from './store';
import { GameState, ActionType, ModelType, MapType } from './types';
import { playLaserSound, playKamehamehaSound, playAcidSound, playHitSound, playGroundThud, playMenuClickSound, playFighterSelectSound, playRunSound, announceKO, announceWinner, announceVoice } from './utils/audio';
import {
  ARENA_WIDTH, MOVE_SPEED, RUN_SPEED, ATTACK_RANGE,
  JAB_DAMAGE, CROSS_DAMAGE, UPPERCUT_DAMAGE, KICK_DAMAGE, CROUCH_JAB_DAMAGE, HOOK_DAMAGE, LOW_KICK_DAMAGE, SPIN_KICK_DAMAGE, GRAB_DAMAGE,
  BLOCK_REDUCTION, AI_THINK_INTERVAL,
  RANGE_JAB, RANGE_CROSS, RANGE_UPPERCUT, RANGE_KICK, RANGE_CROUCH_JAB, RANGE_HOOK, RANGE_LOW_KICK, RANGE_SPIN_KICK, RANGE_GRAB, CHARACTERS,
  PUSH_JAB, PUSH_CROSS, PUSH_UPPERCUT, PUSH_KICK, PUSH_ROLL, PUSH_HOOK, PUSH_LOW_KICK, PUSH_SPIN_KICK
} from './constants';
import { Play, Trophy, Sword, Music, Sparkles, Gamepad2, Settings, X } from 'lucide-react';

// Attack Timing Configuration (Fast arcade timing for hyper-responsive combat)
const MOVES: Record<string, any> = {
    [ActionType.JAB]:        { startup: 25, total: 180, range: RANGE_JAB, damage: JAB_DAMAGE, push: PUSH_JAB, stop: 1 },
    [ActionType.CROSS]:      { startup: 30, total: 220, range: RANGE_CROSS, damage: CROSS_DAMAGE, push: PUSH_CROSS, stop: 2 },
    [ActionType.HOOK]:       { startup: 35, total: 260, range: RANGE_HOOK, damage: HOOK_DAMAGE, push: PUSH_HOOK, stop: 3 },
    [ActionType.UPPERCUT]:   { startup: 45, total: 380, range: RANGE_UPPERCUT, damage: UPPERCUT_DAMAGE, push: PUSH_UPPERCUT, stop: 4 },
    [ActionType.KICK]:       { startup: 30, total: 1220, range: RANGE_KICK, damage: KICK_DAMAGE, push: PUSH_KICK, stop: 3 },
    [ActionType.LOW_KICK]:   { startup: 25, total: 1200, range: RANGE_LOW_KICK, damage: LOW_KICK_DAMAGE, push: PUSH_LOW_KICK, stop: 2 },
    [ActionType.SPIN_KICK]:  { startup: 40, total: 1280, range: RANGE_SPIN_KICK, damage: SPIN_KICK_DAMAGE, push: PUSH_SPIN_KICK, stop: 5 },
    [ActionType.CROUCH_JAB]: { startup: 25, total: 180, range: RANGE_CROUCH_JAB, damage: CROUCH_JAB_DAMAGE, push: PUSH_ROLL, stop: 2 },
    [ActionType.GRAB_INIT]:  { startup: 60, total: 800, range: RANGE_GRAB, damage: 0, push: 0, stop: 0 },
    [ActionType.SPECIAL_LIGHTNING]: { startup: 150, total: 1000, range: 999, damage: 25, push: 0, stop: 5 },
    [ActionType.SPECIAL_ULTIMATE]: { startup: 400, total: 1200, range: 999, damage: 35, push: 5, stop: 0 },
};

// Physics Constants
const GRAVITY = 0.022;
const BOUNCE_DAMPING = 0.3;
const LAUNCH_VELOCITY = 0.4;
const THROW_VELOCITY_Y = 0.32;
const THROW_VELOCITY_X = 0.12;

const App: React.FC = () => {
  const gameState = useGameStore(s => s.gameState);
  const setGameState = useGameStore(s => s.setGameState);
  const updateFighter = useGameStore(s => s.updateFighter);
  const selectCharacter = useGameStore(s => s.selectCharacter);
  const setIntroText = useGameStore(s => s.setIntroText);
  const setLastResult = useGameStore(s => s.setLastResult);
  const lastResult = useGameStore(s => s.lastResult);
  const resetFight = useGameStore(s => s.resetFight);
  const setShakeIntensity = useGameStore(s => s.setShakeIntensity);
  const setHitStop = useGameStore(s => s.setHitStop);
  const selectedMap = useGameStore(s => s.selectedMap);
  const setSelectedMap = useGameStore(s => s.setSelectedMap);

  const [showMusicEditor, setShowMusicEditor] = useState(false);
  const [showTextureTest, setShowTextureTest] = useState(false);
  const [replayActive, setReplayActive] = useState(false);
  const [selectionStep, setSelectionStep] = useState<'fighter' | 'map'>('fighter');
  const timer = useGameStore(s => s.timer);
  const setTimer = useGameStore(s => s.setTimer);
  const [showSettings, setShowSettings] = useState(false);
  const texturesEnabled = useGameStore(s => s.texturesEnabled);
  const setTexturesEnabled = useGameStore(s => s.setTexturesEnabled);

  // Fixed map per user request to eliminate lag during gameplay
  useEffect(() => {
    // Map is kept constant to prevent mid-game texture reloading lag
  }, [gameState]);

  // Click to skip replay
  const handleScreenClick = () => {
    if (gameState === GameState.REPLAY) {
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
      }
      setReplayActive(false);
      
      // Execute the end-of-replay logic immediately
      const currentState = useGameStore.getState();
      const p = currentState.player;
      const e = currentState.enemy;
      
      // Determine winner based on HP since it was a KO or Time Out
      const winnerWho = p.hp > e.hp ? 'player' : 'enemy';
      const winner = winnerWho === 'player' ? p : e;
      const loser = winnerWho === 'player' ? e : p;

      const store = useGameStore.getState();
      let pWins = store.playerWins;
      let eWins = store.enemyWins;
      
      if (winnerWho === 'player') pWins++; else eWins++;
      if (winnerWho === 'player') store.incrementPlayerWins(); else store.incrementEnemyWins();

      if (pWins >= 3 || eWins >= 3) {
          useGameStore.setState({
            player: { ...p, action: winnerWho === 'player' ? (p.hp > 0 ? ActionType.IDLE : ActionType.DEAD) : ActionType.DEAD },
            enemy: { ...e, action: winnerWho === 'player' ? ActionType.DEAD : (e.hp > 0 ? ActionType.IDLE : ActionType.DEAD) }
          });

          setGameState(GameState.GAME_OVER);
          setLastResult({ winner: winner.name, loser: loser.name });
          setIntroText("K.O.");
      } else {
          store.nextRound();
          pendingReplayRef.current = null;
          window.setTimeout(() => {
              useGameStore.getState().setIntroText("");
          }, 2000);
      }
    }
  };

  useEffect(() => {
    // Menu does not switch maps automatically
  }, [gameState]);


  const gameLoopRef = useRef<number>(0);
  const lastAiThinkRef = useRef<number>(0);

  const playerAttackTimeout = useRef<number | null>(null);
  const playerRecoveryTimeout = useRef<number | null>(null);
  const enemyAttackTimeout = useRef<number | null>(null);
  const enemyRecoveryTimeout = useRef<number | null>(null);
  const playerAttackIdRef = useRef<number>(0);
  const enemyAttackIdRef = useRef<number>(0);
  const playerInputBufferRef = useRef<{ action: ActionType; time: number } | null>(null);
  const gameOverTimeoutRef = useRef<any | null>(null);
  const playerSlideTimeoutRef = useRef<number | null>(null);
  const playerSlideDirRef = useRef<number>(1);
  const playerSlideStartRef = useRef<number>(0);
  const layingFlatStartRef = useRef<{player: number, enemy: number}>({player: 0, enemy: 0});
  const layingFlatWaitTimeRef = useRef<{player: number, enemy: number}>({player: 2000, enemy: 2000});
  const customLayingFlatWaitTimeRef = useRef<{player: number, enemy: number}>({player: 0, enemy: 0});
  const playerHitTimeoutRef = useRef<number | null>(null);
  const enemyHitTimeoutRef = useRef<number | null>(null);

  const replayFramesRef = useRef<any[]>([]);
  const replayTimeoutRef = useRef<any | null>(null);
  const stopRecordingReplayRef = useRef<boolean>(false);
  const currentFrameSoundsRef = useRef<string[]>([]);
  const consecutiveKicksRef = useRef<{ player: number, enemy: number }>({ player: 0, enemy: 0 });
  const pendingReplayRef = useRef<{
    winnerWho: 'player' | 'enemy';
    loserWho: 'player' | 'enemy';
    koTime: number;
    stoppedBouncingAt: number | null;
    replayTriggered: boolean;
  } | null>(null);

  // --- Core Game Logic ---

  const isAttack = (action: ActionType) => {
    return !!MOVES[action] || 
           action === ActionType.GRAB_INIT || 
           action === ActionType.GRAB_ACTIVE || 
           action === ActionType.SPECIAL_ULTIMATE || 
           action === ActionType.SPECIAL_LIGHTNING ||
           action === ActionType.SPIN_KICK ||
           action === ActionType.LOW_KICK ||
           action === ActionType.CROUCH_JAB ||
           action === ActionType.HOOK;
  };

  const getFighterMapLimits = useCallback((isNoqueado: boolean) => {
      const state = useGameStore.getState();
      const map = state.selectedMap;
      if (map === 'WAR_OPPONENT' || map === 'PARK_FESTIVAL' || map === 'HELL') {
          return { left: -12.0, right: 12.0 };
      } else if (map === 'FOREST') {
          return {
              left: (state.forestLeftBroken || isNoqueado) ? -12.0 : -11.2,
              right: (state.forestRightBroken || isNoqueado) ? 12.0 : 11.2
          };
      } else if (map === 'ROOFTOP') {
          return {
              left: (state.rooftopLeftBroken || isNoqueado) ? -12.0 : -11.2,
              right: (state.rooftopRightBroken || isNoqueado) ? 12.0 : 11.2
          };
      }
      return { left: -ARENA_WIDTH / 2, right: ARENA_WIDTH / 2 };
  }, []);

  const performAttackHitCheck = useCallback((attacker: 'player' | 'enemy', action: ActionType) => {
    const currentState = useGameStore.getState();
    const attackerState = attacker === 'player' ? currentState.player : currentState.enemy;
    const defenderState = attacker === 'player' ? currentState.enemy : currentState.player;
    const updateDefender = (updates: any) => updateFighter(attacker === 'player' ? 'enemy' : 'player', updates);
    const updateAttacker = (updates: any) => updateFighter(attacker, updates);

    // Can't hit if already dead or flying
    if (attackerState.action === ActionType.HIT || attackerState.action === ActionType.DEAD ||
        attackerState.action === ActionType.KNOCKDOWN || attackerState.action === ActionType.STUNNED ||
        attackerState.action === ActionType.BEING_GRABBED) {
        return;
    }

    const distance = Math.abs(currentState.player.position - currentState.enemy.position);
    const moveStats = MOVES[action];

    if (!moveStats) return;

    if (distance <= moveStats.range) {
        // --- GRAB LOGIC ---
        if (action === ActionType.GRAB_INIT) {
            // Cannot grab if enemy is crouching, in air, or dead
            if (defenderState.action === ActionType.CROUCH || defenderState.y > 0.1 || defenderState.action === ActionType.DEAD || defenderState.action === ActionType.KNOCKDOWN) {
                return; // Whiff grab
            }

            // SUCCESSFUL GRAB START
            updateAttacker({ action: ActionType.GRAB_ACTIVE }); // Animation change to throw
            updateDefender({ action: ActionType.BEING_GRABBED, position: attackerState.position + (attackerState.direction * 0.8) }); // Snap victim close

            setShakeIntensity(0.5); // Initial grab contact shake

            // Schedule the THROW IMPACT
            window.setTimeout(() => {
                 const currentD = attacker === 'player' ? useGameStore.getState().enemy : useGameStore.getState().player;
                 if (currentD.action === ActionType.BEING_GRABBED) {
                     // Slam them
                     const throwDir = attackerState.direction;
                     updateDefender({
                         action: ActionType.THROWN,
                         hp: Math.max(0, currentD.hp - GRAB_DAMAGE),
                         velocityY: THROW_VELOCITY_Y,
                         position: currentD.position + (throwDir * 1.5) // Throw them forward
                     });

                     // Massive Screen Shake on slam
                     setShakeIntensity(2.5);
                     setHitStop(10); // Freezing frame on impact

                     // Trigger slam hit impact
                     useGameStore.getState().addHitImpact({
                         x: currentD.position + (throwDir * 1.5),
                         y: 0.15,
                         color: attackerState.color,
                         type: 'HEAVY'
                     });

                     if (currentD.hp - GRAB_DAMAGE <= 0) {
                         endGame(attacker);
                     }
                 }
                 updateAttacker({ action: ActionType.IDLE });
            }, 600); // Time for the lift animation

            return;
        }

        // --- SPECIALS LOGIC ---
        if (action === ActionType.SPECIAL_LIGHTNING) {
            useGameStore.getState().addHitImpact({
                x: attackerState.position, // Strike self
                y: 1.5,
                color: '#00ffff',
                type: 'LIGHTNING_EFFECT'
            });
            // Apply buff/effect to self, no damage to enemy
            setShakeIntensity(2.0);
            return;
        }

        if (action === ActionType.SPECIAL_ULTIMATE) {
            const isJin = attackerState.name === 'James' || attackerState.name.toLowerCase().includes('jin');
            const isSakura = attackerState.name === 'Ava' || attackerState.name.toLowerCase().includes('sakura');
            const isAlien = attackerState.name.toLowerCase().includes("alien");

            const isMecha = attackerState.name.toLowerCase().includes('mecha');
            const isOsbamo = attackerState.name.toLowerCase().includes('osbamo');
            const projType = isSakura ? 'ACID_SPIT' : ((isJin || isAlien) ? 'LASER_BEAM' : (isMecha ? 'ROCKET' : 'KAMEHAMEHA'));
            const projColor = isSakura ? '#00ff00' : (isJin ? '#ff0000' : (isAlien ? '#00ffff' : (attackerState.color || '#ffff00')));

            // Consume energy if available, but do not block the attack to guarantee it always triggers perfectly
            updateAttacker({ energy: 0 });

            // This is called exactly after the 2-second startup charging phase. Launch the blast instantly!
            const currentAttacker = attacker === 'player' ? useGameStore.getState().player : useGameStore.getState().enemy;
            const currentDefender = attacker === 'player' ? useGameStore.getState().enemy : useGameStore.getState().player;

            if (isSakura) {
                if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playAcidSound();
                currentFrameSoundsRef.current.push('acid');
            } else if (isJin || isAlien) {
                if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playLaserSound();
                currentFrameSoundsRef.current.push('laser');
            } else {
                if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playKamehamehaSound();
                currentFrameSoundsRef.current.push('kamehameha');
            }
            if(isMecha || isOsbamo) { if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playKamehamehaSound(); currentFrameSoundsRef.current.push('kamehameha'); }

            // Align the heights of the projectiles to logically emerge from Sakura's mouth (1.38), Jin's eyes (1.45), Alien's arm (1.12), and Vulpes' cupped hands (1.15)
            const specialY = isSakura ? 1.38 : (isJin ? 1.45 : (isAlien || isMecha ? 1.12 : 1.15));

            useGameStore.getState().addHitImpact({
                x: currentAttacker.position + currentAttacker.direction * 0.5,
                y: currentAttacker.y + specialY,
                color: projColor,
                direction: currentAttacker.direction,
                type: projType
            });

            // Instant hit check and pushback upon launch as requested!
            const freshState = useGameStore.getState();
            const defender = attacker === 'player' ? 'enemy' : 'player';
            const freshDefender = freshState[defender];

            if (freshState.gameState === GameState.FIGHTING && freshDefender.action !== ActionType.DEAD) {
                // Ultra hits unless opponent is already laying flat on the floor or recovering from roll
                const isDownOnFloor = freshDefender.action === ActionType.LAYING_FLAT || freshDefender.action === ActionType.ROLL_RECOVERY;
                if (isDownOnFloor) {
                    // Add a "MISS" hit impact sparkle
                    useGameStore.getState().addHitImpact({
                        x: freshDefender.position,
                        y: freshDefender.y + 1.0,
                        color: '#ffffff',
                        type: 'BLOCKED'
                    });
                    setShakeIntensity(1.5);
                } else {
                    const damage = 35;
                    const newHp = Math.max(0, freshDefender.hp - damage);

                    const pushDir = Math.sign(freshDefender.position - currentAttacker.position) || currentAttacker.direction;
                    if (newHp <= 0) {
                        updateDefender({
                            hp: 0,
                            action: ActionType.DEAD,
                            velocityY: 0.06,
                            velocityX: pushDir * 0.08
                        });
                        endGame(attacker);
                    } else {
                        layingFlatStartRef.current[defender] = Date.now();
                        layingFlatWaitTimeRef.current[defender] = 1600;
                        updateDefender({
                            hp: newHp,
                            action: ActionType.AIR_SPIN_HIT,
                            velocityY: 0.32,
                            velocityX: pushDir * 0.45,
                            spinMultiplier: 3.5,
                            isFaceDown: Math.random() > 0.5
                        });
                    }

                    // Spawn a heavy hit splash on the defender exactly at impact
                    useGameStore.getState().addHitImpact({
                        x: freshDefender.position,
                        y: freshDefender.y + 1.0,
                        color: projColor,
                        type: 'HEAVY'
                    });

                    setShakeIntensity(5.0);
                    setHitStop(0);
                }
            }

            return;
        }

        // --- STRIKE LOGIC ---
        if (defenderState.action !== ActionType.DEAD && defenderState.action !== ActionType.BEING_GRABBED && defenderState.action !== ActionType.THROWN) {
            const defenderKey = attacker === 'player' ? 'enemy' : 'player';
            const pushDirection = Math.sign(defenderState.position - attackerState.position) || attackerState.direction;

            // Ground strike on downed opponent: pushed horizontally by kick/strike, sets 1 second wait time before getting up
            if (defenderState.action === ActionType.LAYING_FLAT) {
                const newHp = Math.max(0, defenderState.hp - moveStats.damage);
                const pushDist = (moveStats.push * 0.3) || 0.3;
                let newPos = defenderState.position + (pushDirection * pushDist);
                const limits = getFighterMapLimits(true);
                newPos = Math.max(limits.left, Math.min(limits.right, newPos));

                if (newHp <= 0) {
                    updateDefender({
                        hp: 0,
                        position: newPos,
                        action: ActionType.DEAD,
                        velocityY: 0,
                        velocityX: 0
                    });
                    if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                        const volumeMult = attackerState.name.toLowerCase().includes('alternate') ? 2.0 : 1.0;
                        playHitSound(moveStats.damage, volumeMult);
                    }
                    endGame(attacker);
                } else {
                    updateDefender({
                        hp: newHp,
                        position: newPos,
                        velocityX: pushDirection * 0.18, // Ground slide from kick/strike impact
                        actionStartTime: Date.now()
                    });
                    customLayingFlatWaitTimeRef.current[defenderKey] = 2000; // Increased by 1 second
                    layingFlatStartRef.current[defenderKey] = Date.now();
                    layingFlatWaitTimeRef.current[defenderKey] = 2000; // 2 seconds wait time before getting up after kick hit
                    if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                        const volumeMult = attackerState.name.toLowerCase().includes('alternate') ? 2.0 : 1.0;
                        playHitSound(moveStats.damage, volumeMult);
                    }
                    useGameStore.getState().addHitImpact({
                        x: newPos,
                        y: 0.15,
                        color: attackerState.color,
                        type: 'HEAVY'
                    });
                }
                return;
            }

            // Invulnerable when airborne knocked down, thrown, or getting up until fully recovered
            // UNLESS it's an airborne spin hit from a kick!
            const isAirborne = (defenderState.action === ActionType.KNOCKDOWN || defenderState.action === ActionType.AIR_SPIN_HIT) && defenderState.y > 0.05;
            const isKickAction = action === ActionType.KICK || action === ActionType.SPIN_KICK;
            
            if (isAirborne && isKickAction) {
                if (defenderState.action === ActionType.AIR_SPIN_HIT) return; // Only allow 1 kick in the air!
            } else if (defenderState.action === ActionType.KNOCKDOWN || defenderState.action === ActionType.GET_UP || defenderState.action === ActionType.AIR_SPIN_HIT) {
                return;
            }

            let damage = moveStats.damage;
            let pushForce = moveStats.push;
            let hitType = 'NORMAL';

            const isLowAttack = action === ActionType.LOW_KICK || action === ActionType.CROUCH_JAB;
            const isBlocking = defenderState.action === ActionType.BLOCK || defenderState.action === ActionType.SLIDE;
            const isCrouching = defenderState.action === ActionType.CROUCH;

            if (isBlocking && !isLowAttack) {
                 damage *= (1 - BLOCK_REDUCTION);
                 pushForce *= 0.5;
                 hitType = 'BLOCKED';
            } else if (isCrouching && !isLowAttack && action !== ActionType.KICK && action !== ActionType.UPPERCUT) {
                 damage = 0;
                 hitType = 'MISS';
                 const rangeName = action.replace(/_/g, ' ');
                 useGameStore.getState().addCombatLog(`${attackerState.name} ${rangeName} -> EVADED (Opponent Crouching)`);
                 return;
            }

            if (hitType !== 'BLOCKED') {
                setHitStop(moveStats.stop);

                // Energy Gain on land
                const attackerE = attacker === 'player' ? useGameStore.getState().player.energy : useGameStore.getState().enemy.energy;
                updateAttacker({ energy: Math.min(100, attackerE + 25) });
                const defenderE = defenderState.energy;

                // Close trade logic: If both are attacking at very close range, trade hits fairly!
                const isDefenderAttacking = [
                    ActionType.JAB, ActionType.CROSS, ActionType.KICK, ActionType.LOW_KICK, 
                    ActionType.SPIN_KICK, ActionType.UPPERCUT, ActionType.CROUCH_JAB
                ].includes(defenderState.action);

                if (distance <= 1.0 && isDefenderAttacking) {
                    const defenderDamage = damage;
                    const defenderMoveStats = MOVES[defenderState.action];
                    const attackerDamage = defenderMoveStats ? defenderMoveStats.damage : 10;

                    const defenderNewHp = Math.max(0, defenderState.hp - defenderDamage);
                    const attackerNewHp = Math.max(0, attackerState.hp - attackerDamage);

                    useGameStore.getState().addCombatLog(`CLOSE TRADE! ${attackerState.name} deals ${defenderDamage} DMG, ${defenderState.name} deals ${attackerDamage} DMG!`);

                    const limits = getFighterMapLimits(false);
                    const pushDist = 0.8;
                    const defPos = Math.max(limits.left, Math.min(limits.right, defenderState.position + pushDirection * pushDist));
                    const attPos = Math.max(limits.left, Math.min(limits.right, attackerState.position - pushDirection * pushDist));

                    updateDefender({
                        hp: defenderNewHp,
                        action: ActionType.HIT,
                        position: defPos,
                        actionStartTime: Date.now(),
                        energy: Math.min(100, defenderE + 20)
                    });

                    updateAttacker({
                        hp: attackerNewHp,
                        action: ActionType.HIT,
                        position: attPos,
                        actionStartTime: Date.now(),
                        energy: Math.min(100, attackerE + 20)
                    });

                    scheduleDefenderRecovery(defenderKey, ActionType.HIT, 250);
                    scheduleDefenderRecovery(attacker, ActionType.HIT, 250);

                    if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                        const volumeMult = attackerState.name.toLowerCase().includes('alternate') ? 2.0 : 1.0;
                        playHitSound(defenderDamage, volumeMult);
                    }

                    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
                    if (playerRecoveryTimeout.current) { clearTimeout(playerRecoveryTimeout.current); playerRecoveryTimeout.current = null; }
                    playerAttackIdRef.current++;

                    if (enemyAttackTimeout.current) { clearTimeout(enemyAttackTimeout.current); enemyAttackTimeout.current = null; }
                    if (enemyRecoveryTimeout.current) { clearTimeout(enemyRecoveryTimeout.current); enemyRecoveryTimeout.current = null; }
                    enemyAttackIdRef.current++;

                    if (defenderNewHp <= 0) {
                        updateDefender({ hp: 0, action: ActionType.DEAD, velocityY: 0.08, velocityX: attackerState.direction * 0.08 });
                        endGame(attacker);
                    } else if (attackerNewHp <= 0) {
                        updateAttacker({ hp: 0, action: ActionType.DEAD, velocityY: 0.08, velocityX: -attackerState.direction * 0.08 });
                        endGame(attacker === 'player' ? 'enemy' : 'player');
                    }
                    return;
                }
                
                // Clash Check: Same Kick/Uppercut move used by both at similar time
                const clashingActions = [ActionType.KICK, ActionType.LOW_KICK, ActionType.SPIN_KICK, ActionType.UPPERCUT];
                const isClash = clashingActions.includes(action) && defenderState.action === action;

                let finalDamage = damage;
                let defenderNewHp = Math.max(0, defenderState.hp - finalDamage);

                if (isClash) {
                    // Both take damage, but neither gets knocked out or knocked down (min 1 HP)
                    defenderNewHp = Math.max(1, defenderState.hp - finalDamage);
                    const attackerNewHp = Math.max(1, attackerState.hp - finalDamage);
                    updateAttacker({ hp: attackerNewHp });
                    useGameStore.getState().addCombatLog(`CLASH! Both take ${finalDamage} DMG!`);
                    
                    // Interrupt defender but only put them in standard hit (no knockdown)
                    updateDefender({
                        hp: defenderNewHp,
                        action: ActionType.HIT,
                        actionStartTime: Date.now(),
                        energy: Math.min(100, defenderE + 12)
                    });
                    
                    const volumeMult = attackerState.name.toLowerCase().includes('alternate') ? 2.0 : 1.0;
                    playHitSound(finalDamage, volumeMult);
                    
                    // We can also interrupt attacker if we want, but usually standard hit logic returns here.
                    // For now, let's just make both stagger.
                    updateAttacker({
                        action: ActionType.HIT,
                        actionStartTime: Date.now()
                    });
                    if (attacker === 'player') {
                        if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
                        if (playerRecoveryTimeout.current) { clearTimeout(playerRecoveryTimeout.current); playerRecoveryTimeout.current = null; }
                        playerAttackIdRef.current++;
                    } else {
                        if (enemyAttackTimeout.current) { clearTimeout(enemyAttackTimeout.current); enemyAttackTimeout.current = null; }
                        if (enemyRecoveryTimeout.current) { clearTimeout(enemyRecoveryTimeout.current); enemyRecoveryTimeout.current = null; }
                        enemyAttackIdRef.current++;
                    }
                    return;
                }

                const rangeName = action.replace(/_/g, ' ');
                useGameStore.getState().addCombatLog(`${attackerState.name} ${rangeName} -> HIT! ${finalDamage} DMG (Enemy HP: ${defenderNewHp})`);

                // Interrupt defender's pending attacks & input buffer when hit
                if (defenderKey === 'player') {
                    playerInputBufferRef.current = null;
                    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
                    if (playerRecoveryTimeout.current) { clearTimeout(playerRecoveryTimeout.current); playerRecoveryTimeout.current = null; }
                    playerAttackIdRef.current++;
                } else {
                    if (enemyAttackTimeout.current) { clearTimeout(enemyAttackTimeout.current); enemyAttackTimeout.current = null; }
                    if (enemyRecoveryTimeout.current) { clearTimeout(enemyRecoveryTimeout.current); enemyRecoveryTimeout.current = null; }
                    enemyAttackIdRef.current++;
                }

                // Immediate KO Check on any strike
                if (defenderNewHp <= 0) {
                    const pushDist = (moveStats.push * 0.8) || 1.2;
                    const limitsDead = getFighterMapLimits(true);
                    const newPos = Math.max(limitsDead.left, Math.min(limitsDead.right, defenderState.position + attackerState.direction * pushDist));
                    updateDefender({
                        hp: 0,
                        position: newPos,
                        action: ActionType.DEAD,
                        velocityY: 0.08,
                        velocityX: attackerState.direction * 0.08,
                        energy: Math.min(100, defenderE + 12)
                    });
                    if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                        const volumeMult = attackerState.name.toLowerCase().includes('alternate') ? 2.0 : 1.0;
                        playHitSound(damage, volumeMult);
                    }
                    endGame(attacker);
                    return;
                }

                // SUPER ARMOR CHECK: If defender is using SPECIAL_ULTIMATE, they take damage but cannot be interrupted or canceled
                if (defenderState.action === ActionType.SPECIAL_ULTIMATE) {
                    updateDefender({ hp: defenderNewHp, energy: Math.min(100, defenderE + 12) });
                    return;
                }

                const pushDirValue = Math.sign(defenderState.position - attackerState.position) || attackerState.direction;
                const isKick = action === ActionType.KICK || action === ActionType.LOW_KICK || action === ActionType.SPIN_KICK;

                if (isKick) {
                    consecutiveKicksRef.current[defenderKey] += 1;
                } else {
                    consecutiveKicksRef.current[defenderKey] = 0; // reset if non-kick
                }

                const pushDist = (moveStats.push || 0.5) + (distance < 0.6 ? 0.3 : 0);
                const limitsStandard = getFighterMapLimits(false);
                const hitPos = Math.max(limitsStandard.left, Math.min(limitsStandard.right, defenderState.position + pushDirection * pushDist));

                if (isAirborne && isKick) {
                    hitType = 'LAUNCH';
                    customLayingFlatWaitTimeRef.current[defenderKey] = 0;
                    layingFlatStartRef.current[defenderKey] = Date.now();
                    layingFlatWaitTimeRef.current[defenderKey] = 0; // immediate get up
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.AIR_SPIN_HIT,
                        velocityY: 0.15, // lower pop up
                        velocityX: pushDirection * 0.12, // strong push back
                        position: hitPos,
                        actionStartTime: Date.now()
                    });
                    setShakeIntensity(4.0);
                } else if (action === ActionType.SPIN_KICK) {
                    hitType = 'LAUNCH';
                    const pushDistSK = 1.4;
                    const limitsSK = getFighterMapLimits(true);
                    const newPosSK = Math.max(limitsSK.left, Math.min(limitsSK.right, defenderState.position + pushDirection * pushDistSK));
                    customLayingFlatWaitTimeRef.current[defenderKey] = 1600; // Increased by 1 second
                    layingFlatStartRef.current[defenderKey] = Date.now();
                    layingFlatWaitTimeRef.current[defenderKey] = 1600;
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.KNOCKDOWN,
                        velocityY: 0.22,
                        y: 0.1,
                        position: newPosSK,
                        actionStartTime: Date.now()
                    });
                    setShakeIntensity(3.5);
                } else if (action === ActionType.LOW_KICK && defenderState.action === ActionType.CROUCH) {
                    hitType = 'LAUNCH';
                    const pushDistLK = 1.0;
                    const limitsLK = getFighterMapLimits(true);
                    const newPosLK = Math.max(limitsLK.left, Math.min(limitsLK.right, defenderState.position + pushDirection * pushDistLK));
                    customLayingFlatWaitTimeRef.current[defenderKey] = 1600; // Increased by 1 second
                    layingFlatStartRef.current[defenderKey] = Date.now();
                    layingFlatWaitTimeRef.current[defenderKey] = 1600;
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.KNOCKDOWN,
                        velocityY: 0.22,
                        y: 0.05,
                        position: newPosLK,
                        actionStartTime: Date.now()
                    });
                    setShakeIntensity(2.5);
                } else if (consecutiveKicksRef.current[defenderKey] >= 2) {
                    consecutiveKicksRef.current[defenderKey] = 0; // reset
                    hitType = 'LAUNCH';
                    const pushDistCK = 1.2;
                    const limitsCK = getFighterMapLimits(true);
                    const newPosCK = Math.max(limitsCK.left, Math.min(limitsCK.right, defenderState.position + pushDirection * pushDistCK));
                    customLayingFlatWaitTimeRef.current[defenderKey] = 1600; // Increased by 1 second
                    layingFlatStartRef.current[defenderKey] = Date.now();
                    layingFlatWaitTimeRef.current[defenderKey] = 1600;
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.KNOCKDOWN,
                        velocityY: 0.25,
                        y: 0.1,
                        position: newPosCK,
                        actionStartTime: Date.now()
                    });
                    setShakeIntensity(3.0);
                } else if (action === ActionType.UPPERCUT) {
                    hitType = 'LAUNCH';
                    const pushDistUP = 2.0 + (damage * 0.18);
                    const limitsUP = getFighterMapLimits(true);
                    const newPosUP = Math.max(limitsUP.left, Math.min(limitsUP.right, defenderState.position + pushDirection * pushDistUP));
                    customLayingFlatWaitTimeRef.current[defenderKey] = 600;
                    layingFlatStartRef.current[defenderKey] = Date.now();
                    layingFlatWaitTimeRef.current[defenderKey] = 600;
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.KNOCKDOWN,
                        velocityY: 0.35,
                        y: 0.1,
                        position: newPosUP,
                        actionStartTime: Date.now()
                    });
                    setShakeIntensity(2.8);
                } else if (action === ActionType.HOOK) {
                    hitType = 'STUN';
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.STUNNED,
                        position: hitPos,
                        actionStartTime: Date.now()
                    });
                    setShakeIntensity(1.2);
                    scheduleDefenderRecovery(defenderKey, ActionType.STUNNED, 500);
                } else if (action === ActionType.CROUCH_JAB || action === ActionType.LOW_KICK) {
                    const hitDuration = 200;
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.HIT,
                        position: hitPos,
                        actionStartTime: Date.now()
                    });
                    scheduleDefenderRecovery(defenderKey, ActionType.HIT, hitDuration);
                } else {
                    updateDefender({
                        hp: defenderNewHp,
                        energy: Math.min(100, defenderE + 12),
                        action: ActionType.HIT,
                        position: hitPos,
                        actionStartTime: Date.now()
                    });
                    setShakeIntensity(action === ActionType.KICK ? 1.4 : 0.4);
                    scheduleDefenderRecovery(defenderKey, ActionType.HIT, 250);
                }
            } else {
                // Blocked hit logic: apply block chip damage and block pushback
                const blockDamage = Math.max(1, Math.round(moveStats.damage * (1 - BLOCK_REDUCTION)));
                const defenderNewHp = Math.max(0, defenderState.hp - blockDamage);
                const bPush = (moveStats.push * 0.4) || 0.2;
                const limitsBlocked = getFighterMapLimits(false);
                const bPos = Math.max(limitsBlocked.left, Math.min(limitsBlocked.right, defenderState.position + pushDirection * bPush));

                updateDefender({
                    hp: defenderNewHp,
                    position: bPos
                });

                const rangeName = action.replace(/_/g, ' ');
                useGameStore.getState().addCombatLog(`${attackerState.name} ${rangeName} -> BLOCKED! ${blockDamage} DMG (Enemy HP: ${defenderNewHp})`);

                if (defenderNewHp <= 0) {
                    updateDefender({
                        hp: 0,
                        action: ActionType.DEAD,
                        velocityY: 0.1,
                        velocityX: pushDirection * 0.1
                    });
                    endGame(attacker);
                    return;
                }
            }

            // Trigger hit impact explosion effect
            if (hitType !== 'MISS') {
                const s = useGameStore.getState();
                const isMapPreview = s.gameState === GameState.CHARACTER_SELECT;
                if (hitType !== 'BLOCKED') {
                    if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                        const volumeMult = attackerState.name.toLowerCase().includes('alternate') ? 2.0 : 1.0;
                        playHitSound(damage, volumeMult);
                    }
                    currentFrameSoundsRef.current.push(`hit:${damage}:${attackerState.name.toLowerCase().includes('alternate') ? 2 : 1}`);
                } else {
                    if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                        const volumeMult = attackerState.name.toLowerCase().includes('alternate') ? 2.0 : 1.0;
                        playHitSound(1, volumeMult);
                    }
                    currentFrameSoundsRef.current.push(`hit:1:${attackerState.name.toLowerCase().includes('alternate') ? 2 : 1}`);
                }
                if (attacker === 'enemy' && hitType !== 'BLOCKED') {
                     useGameStore.getState().incrementPlayerHitsReceived();
                }
                let hitY = defenderState.y + 0.9;
                if (action === ActionType.LOW_KICK || action === ActionType.CROUCH_JAB) {
                    hitY = defenderState.y + 0.25;
                } else if (action === ActionType.UPPERCUT) {
                    hitY = defenderState.y + 1.35;
                }
                const hitX = (attackerState.position + defenderState.position) / 2;
                useGameStore.getState().addHitImpact({
                    x: hitX,
                    y: hitY,
                    color: attackerState.color,
                    type: hitType === 'BLOCKED' ? 'BLOCKED' : (action === ActionType.UPPERCUT || action === ActionType.SPIN_KICK || action === ActionType.KICK ? 'HEAVY' : 'NORMAL')
                });
            }
        }
    } else {
        const rangeName = action.replace(/_/g, ' ');
        useGameStore.getState().addCombatLog(`${attackerState.name} ${rangeName} -> MISS (Out of range: ${distance.toFixed(2)} > ${moveStats.range})`);
    }
  }, [updateFighter, setShakeIntensity, setHitStop, getFighterMapLimits]);

  const endGame = useCallback((winnerWho: 'player' | 'enemy') => {
    if (useGameStore.getState().gameState === GameState.CHARACTER_SELECT) {
        window.setTimeout(() => {
             if (useGameStore.getState().gameState === GameState.CHARACTER_SELECT) {
                 updateFighter('player', { hp: 100, maxHp: 100, energy: 0, position: -1.5, action: ActionType.IDLE, y: 0, velocityY: 0 });
                 updateFighter('enemy', { hp: 100, maxHp: 100, energy: 0, position: 1.5, action: ActionType.IDLE, y: 0, velocityY: 0 });
             }
        }, 1500); // give them a moment to be dead
        return;
    }
    
    if (playerAttackTimeout.current) clearTimeout(playerAttackTimeout.current);
    if (enemyAttackTimeout.current) clearTimeout(enemyAttackTimeout.current);
    if (gameOverTimeoutRef.current) clearTimeout(gameOverTimeoutRef.current);

    const loserWho = winnerWho === 'player' ? 'enemy' : 'player';
    const loserState = loserWho === 'player' ? useGameStore.getState().player : useGameStore.getState().enemy;

    // Trigger pain posture
    if (loserState.action !== ActionType.KNOCKDOWN && loserState.action !== ActionType.THROWN) {
      updateFighter(loserWho, { action: ActionType.STUNNED, velocityY: 0.12 });
    }

    const staggerDir = -loserState.direction;
    
    // Launch upwards so they fly and bounce on the floor
    updateFighter(loserWho, { 
        action: ActionType.KNOCKDOWN, 
        velocityY: 0.35, 
        velocityX: staggerDir * 0.28 
    });

    setShakeIntensity(4.5);

    // Announce KO with system code voice
    announceKO();
    const winnerName = winnerWho === 'player' ? useGameStore.getState().player.name : useGameStore.getState().enemy.name;
    setTimeout(() => {
      announceWinner(winnerName);
    }, 1200);

    // Trigger K.O. banner overlay
    useGameStore.getState().setShowKoBanner(true);

    // Keep recording replay frames while bouncing
    stopRecordingReplayRef.current = false;

    // Register pending replay monitor
    pendingReplayRef.current = {
      winnerWho,
      loserWho,
      koTime: Date.now(),
      stoppedBouncingAt: null,
      replayTriggered: false
    };
  }, [updateFighter, setShakeIntensity]);

  // Timer Countdown Logic
  useEffect(() => {
    if (gameState === GameState.FIGHTING && timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (gameState === GameState.FIGHTING && timer === 0) {
      // Time Out - Winner is the one with more HP
      const player = useGameStore.getState().player;
      const enemy = useGameStore.getState().enemy;
      if (player.hp >= enemy.hp) {
        endGame('player');
      } else {
        endGame('enemy');
      }
    }
  }, [gameState, timer, setTimer, endGame]);


  // --- Game Loop ---

  const update = useCallback((time: number) => {
    const currentState = useGameStore.getState();
    const isMapPreview = currentState.gameState === GameState.CHARACTER_SELECT;
    
    // Monitor pending KO replay sequence (triggers exactly 2s after bounce stops)
    if (pendingReplayRef.current && !pendingReplayRef.current.replayTriggered) {
      const { winnerWho, loserWho, koTime, stoppedBouncingAt } = pendingReplayRef.current;
      const loserState = loserWho === 'player' ? currentState.player : currentState.enemy;

      // Character has landed on ground and stopped moving/bouncing
      const isStoppedBouncing = loserState.y <= 0.005 && Math.abs(loserState.velocityY) < 0.005 && Math.abs(loserState.velocityX) < 0.005;

      if (stoppedBouncingAt === null) {
        if (isStoppedBouncing || (Date.now() - koTime > 3500)) {
          pendingReplayRef.current.stoppedBouncingAt = Date.now();
          stopRecordingReplayRef.current = true; // Freeze replay buffer at exact end of bounce
        }
      } else {
        // Exactly 2000ms (2 seconds) after they finish bouncing, launch instant replay!
        if (Date.now() - stoppedBouncingAt >= 2000) {
          pendingReplayRef.current.replayTriggered = true;
          useGameStore.getState().setShowKoBanner(false);

          const p = currentState.player;
          const e = currentState.enemy;
          const winner = winnerWho === 'player' ? p : e;
          const loser = winnerWho === 'player' ? e : p;

          const recordedFrames = [...replayFramesRef.current];
          if (recordedFrames.length > 0) {
            setReplayActive(true);
            setGameState(GameState.REPLAY);
            setIntroText("INSTANT REPLAY");

            let frameIdx = 0;
            const playNextFrame = () => {
              if (frameIdx >= recordedFrames.length) {
                setReplayActive(false);

                const isPlayerWinner = winner.name === p.name;
                const store = useGameStore.getState();
                let pWins = store.playerWins;
                let eWins = store.enemyWins;
                
                if (isPlayerWinner) pWins++; else eWins++;
                if (isPlayerWinner) store.incrementPlayerWins(); else store.incrementEnemyWins();

                if (pWins >= 3 || eWins >= 3) {
                    useGameStore.setState({
                      player: { ...p, action: isPlayerWinner ? (p.hp > 0 ? ActionType.IDLE : ActionType.DEAD) : ActionType.DEAD },
                      enemy: { ...e, action: isPlayerWinner ? ActionType.DEAD : (e.hp > 0 ? ActionType.IDLE : ActionType.DEAD) }
                    });

                    if (winner.name === 'Osbamo' || winner.modelType === 'FOX') {
                        setIntroText("OSBAMO: 'YOU ARE COLD AS ICE!'");
                        window.setTimeout(() => {
                            setGameState(GameState.GAME_OVER);
                            const quotes = ["PERFECT!", "K.O.", "MATCH OVER", "COMPLETE"];
                            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                            setLastResult({ winner: winner.name, loser: loser.name });
                            setIntroText(randomQuote);
                        }, 2000);
                    } else {
                        setGameState(GameState.GAME_OVER);
                        const quotes = ["PERFECT!", "K.O.", "MATCH OVER", "COMPLETE"];
                        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                        setLastResult({ winner: winner.name, loser: loser.name });
                        setIntroText(randomQuote);
                    }
                } else {
                    store.nextRound();
                    pendingReplayRef.current = null;
                    // Provide a brief window before characters can move again
                    window.setTimeout(() => {
                        useGameStore.getState().setIntroText("");
                    }, 2000);
                }
                return;
              }

              const frame = recordedFrames[frameIdx];
              useGameStore.setState({
                player: frame.player,
                enemy: frame.enemy,
                shakeIntensity: frame.shakeIntensity,
                hitImpacts: frame.hitImpacts,
                stageY: frame.stageY
              });

              if (frame.sounds && frame.sounds.length > 0) {
                  frame.sounds.forEach((sound: string) => {
                      if (sound.startsWith('hit:')) {
                          const parts = sound.split(':');
                          const damage = parseInt(parts[1]) || 10;
                          const volumeMult = parts[2] ? parseFloat(parts[2]) : 1.0;
                          if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playHitSound(damage, volumeMult);
                      } else if (sound === 'acid') {
                          if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playAcidSound();
                      } else if (sound === 'laser') {
                          if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playLaserSound();
                      } else if (sound === 'kamehameha') {
                          if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) playKamehamehaSound();
                      }
                  });
              }

              frameIdx++;
              replayTimeoutRef.current = setTimeout(playNextFrame, 22);
            };

            playNextFrame();
          } else {
            if (winner.name === 'Osbamo' || winner.modelType === 'FOX') {
                setIntroText("OSBAMO: 'YOU ARE COLD AS ICE!'");
                window.setTimeout(() => {
                    setGameState(GameState.GAME_OVER);
                    const quotes = ["PERFECT!", "K.O.", "YOU WIN", "COMPLETE"];
                    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                    setLastResult({ winner: winner.name, loser: loser.name });
                    setIntroText(randomQuote);
                }, 2000);
            } else {
                setGameState(GameState.GAME_OVER);
                const quotes = ["PERFECT!", "K.O.", "YOU WIN", "COMPLETE"];
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                setLastResult({ winner: winner.name, loser: loser.name });
                setIntroText(randomQuote);
            }
          }
          pendingReplayRef.current = null;
        }
      }
    }
    
    if (currentState.gameState !== GameState.FIGHTING && !isMapPreview) return;
    
    const { player, enemy, hitStop, stageY, setStageY } = currentState;

    if (hitStop > 0) {
        useGameStore.getState().setHitStop(hitStop - 1);
        gameLoopRef.current = requestAnimationFrame(update);
        return;
    }

    // Platform always stays flat at 0, no rising or falling floor, as requested
    if (stageY !== 0) {
        setStageY(0);
    }

    // Local update collectors for the frame
    let pUpdates: Partial<typeof player> | null = null;
    let eUpdates: Partial<typeof enemy> | null = null;
    const otherUpdates: any = {};

    const localUpdateFighter = (who: 'player' | 'enemy', updates: Partial<typeof player>) => {
        if (who === 'player') {
            pUpdates = pUpdates ? { ...pUpdates, ...updates } : updates;
        } else {
            eUpdates = eUpdates ? { ...eUpdates, ...updates } : updates;
        }
    };

    const updatePos = (who: 'player' | 'enemy', pos: number) => {
        const limits = getFighterMapLimits(false);
        const p = Math.max(limits.left, Math.min(limits.right, pos));
        localUpdateFighter(who, { position: p });
    };

    // --- SAFETY GRAB RECOVERY ---
    // Release BEING_GRABBED if opponent got hit or is no longer holding them
    if (player.action === ActionType.BEING_GRABBED && enemy.action !== ActionType.GRAB_ACTIVE) {
        localUpdateFighter('player', { action: ActionType.IDLE, y: 0, velocityY: 0 });
    }
    if (enemy.action === ActionType.BEING_GRABBED && player.action !== ActionType.GRAB_ACTIVE) {
        localUpdateFighter('enemy', { action: ActionType.IDLE, y: 0, velocityY: 0 });
    }

    // --- SAFETY ATTACK WATCHDOG (Prevents desync / stuck state) ---
    const nowMs = Date.now();
    if (isAttack(player.action) && player.y <= 0.05 && player.actionStartTime) {
        const stats = MOVES[player.action] || { total: 600 };
        if (nowMs - player.actionStartTime > (stats.total + 150)) {
            localUpdateFighter('player', { action: ActionType.IDLE });
        }
    }
    if (isAttack(enemy.action) && enemy.y <= 0.05 && enemy.actionStartTime) {
        const stats = MOVES[enemy.action] || { total: 600 };
        if (nowMs - enemy.actionStartTime > (stats.total + 150)) {
            localUpdateFighter('enemy', { action: ActionType.IDLE });
        }
    }

    // --- STATE LOCK WATCHDOG (Prevents fighters from getting stuck in stagger, knockdown, rolling, blocking, getting up, etc.) ---
    const checkStateLock = (who: 'player' | 'enemy', entity: typeof player) => {
        if (entity.action === ActionType.IDLE || entity.action === ActionType.DEAD) return;

        const startTime = entity.actionStartTime || nowMs;
        const duration = nowMs - startTime;

        // 1. If stuck in a normal hit stagger or stun
        if (entity.action === ActionType.HIT && duration > 1000) {
            localUpdateFighter(who, { action: ActionType.IDLE });
        }
        else if (entity.action === ActionType.STUNNED && duration > 1500) {
            localUpdateFighter(who, { action: ActionType.IDLE });
        }
        // 2. If stuck in getting up or rolling
        else if (entity.action === ActionType.GET_UP && duration > 1000) {
            localUpdateFighter(who, { action: ActionType.IDLE });
        }
        else if (entity.action === ActionType.ROLL_RECOVERY && duration > 1500) {
            localUpdateFighter(who, { action: ActionType.IDLE });
        }
        // 3. If stuck in a knockdown/thrown state, air spin hit, or laying flat for too long without recovering
        else if ((entity.action === ActionType.KNOCKDOWN || entity.action === ActionType.THROWN || entity.action === ActionType.LAYING_FLAT || entity.action === ActionType.AIR_SPIN_HIT) && duration > 3000) {
            if (entity.hp > 0) {
                localUpdateFighter(who, { action: ActionType.GET_UP, velocityY: 0, velocityX: 0, y: 0, actionStartTime: nowMs });
            }
        }
        // 4. Grab/Throw active locks
        else if ((entity.action === ActionType.GRAB_ACTIVE || entity.action === ActionType.BEING_GRABBED) && duration > 2000) {
            localUpdateFighter(who, { action: ActionType.IDLE, y: 0, velocityY: 0 });
        }
    };

    checkStateLock('player', player);
    checkStateLock('enemy', enemy);

    // --- GRAVITY & PHYSICS LOOP ---
    const processPhysics = (who: 'player' | 'enemy', entity: typeof player) => {
        if (entity.action === ActionType.BEING_GRABBED) return;

        // If the platform has risen, characters can fall off the platform (range [-8, 8] for default, or outside broken walls for forest/rooftop)
        const storeState = useGameStore.getState();
        const map = storeState.selectedMap;
        const isForest = map === 'FOREST';
        const isRooftop = map === 'ROOFTOP';
        let isOffPlatform = false;
        if (isForest) {
            isOffPlatform = (entity.position < -11.5 && storeState.forestLeftBroken) || (entity.position > 11.5 && storeState.forestRightBroken);
        } else if (isRooftop) {
            isOffPlatform = (entity.position < -11.5 && storeState.rooftopLeftBroken) || (entity.position > 11.5 && storeState.rooftopRightBroken);
        } else if (map === 'WAR_OPPONENT' || map === 'PARK_FESTIVAL' || map === 'HELL') {
            isOffPlatform = false;
        } else {
            isOffPlatform = stageY >= -0.5 && (entity.position < -8.0 || entity.position > 8.0);
        }
        const floorY = isOffPlatform ? (isForest ? -1.0 : -15.0) : 0.0;

        const needsGravity = entity.y > floorY || entity.velocityY !== 0 || isOffPlatform || (entity.velocityX && entity.velocityX !== 0);

        if (needsGravity) {
            let newY = entity.y + entity.velocityY;
            let newVelY = entity.velocityY - GRAVITY;
            let newVelX = entity.velocityX || 0;
            let newPos = entity.position + newVelX;

            // Constrain arena width bounds ONLY if we are not falling off the platform in Hell/Rooftop/Forest maps
            if (!isOffPlatform) {
                const isNoqueado = entity.hp <= 0 || entity.action === ActionType.KNOCKDOWN || entity.action === ActionType.DEAD || entity.action === ActionType.AIR_SPIN_HIT;
                const limits = getFighterMapLimits(isNoqueado);
                newPos = Math.max(limits.left, Math.min(limits.right, newPos));
            }

            // Friction on X in air
            newVelX *= 0.98;
            if (Math.abs(newVelX) < 0.01) newVelX = 0;

            // Trigger instant death if they fall off the platform into the volcanic lava below, rooftop void, or forest water
            if (isOffPlatform && ((!isForest && !isRooftop && newY < -2.2) || (isForest && newY < -0.5) || (isRooftop && newY < -6.0)) && entity.hp > 0 && entity.action !== ActionType.DEAD) {
                if (isRooftop) {
                    // Rooftop: They just fall. Let them keep their downward velocity and fall out of screen (floorY is -15.0)
                    localUpdateFighter(who, { hp: 0, action: ActionType.DEAD, y: newY, velocityY: newVelY, velocityX: newVelX * 0.9, position: newPos });
                    otherUpdates.shakeIntensity = 2.0;
                    endGame(who === 'player' ? 'enemy' : 'player');
                    return;
                } else if (isForest) {
                    // Forest water fall
                    const turnsRed = Math.random() < 0.4; // 40% chance of turning red
                    if (turnsRed) {
                        useGameStore.getState().setForestWaterColor("#b30000");
                    }
                    localUpdateFighter(who, { hp: 0, action: ActionType.DEAD, y: newY, velocityY: 0, velocityX: 0, position: newPos });
                    
                    useGameStore.getState().addHitImpact({
                        x: newPos,
                        y: -1.0,
                        color: turnsRed ? "#ff0000" : "#00e5ff",
                        type: "WATER_SPLASH"
                    });
                    
                    otherUpdates.shakeIntensity = 3.0;
                    if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                        playAcidSound();
                    }
                    endGame(who === 'player' ? 'enemy' : 'player');
                    return;
                } else {
                    localUpdateFighter(who, { hp: 0, action: ActionType.DEAD, y: newY, velocityY: 0, velocityX: 0, position: newPos });
                    
                    // Trigger vibrant lava splash particle explosion
                    useGameStore.getState().addHitImpact({
                        x: newPos,
                        y: -1.2,
                        color: "#ff3300",
                        type: "LAVA_SPLASH"
                    });

                    otherUpdates.shakeIntensity = 5.5; // massive shake on falling into the lava!
                    endGame(who === 'player' ? 'enemy' : 'player');
                    return;
                }
            }

            // Floor collision
            if (newY <= floorY) {
                const isKoOrKnockdown = entity.action === ActionType.KNOCKDOWN || entity.action === ActionType.THROWN || entity.action === ActionType.DEAD || entity.action === ActionType.LAYING_FLAT || entity.action === ActionType.AIR_SPIN_HIT || entity.hp <= 0;

                if (isKoOrKnockdown && (entity.velocityY < -0.01 || entity.y > floorY + 0.01)) {
                    // Bounce physics!
                    newY = floorY;
                    newVelY = Math.abs(entity.velocityY) > 0.08 ? -entity.velocityY * 0.25 : 0; // Gentle bounce
                    newVelX *= 0.85; // Less friction so they skip/slide backwards!

                    // If it was an air spin hit, transition to KNOCKDOWN on the first bounce!
                    if (entity.action === ActionType.AIR_SPIN_HIT) {
                        localUpdateFighter(who, { action: ActionType.KNOCKDOWN, y: floorY, velocityY: newVelY, velocityX: newVelX });
                    }

                    // Trigger particle impacts
                    if (isForest && floorY < 0) {
                        const waterColor = useGameStore.getState().forestWaterColor;
                        const isRed = waterColor === "#b30000";
                        useGameStore.getState().addHitImpact({
                            x: newPos,
                            y: floorY + 0.1,
                            color: isRed ? "#ff0000" : "#00e5ff",
                            type: "WATER_SPLASH"
                        });
                        if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                            playAcidSound();
                        }
                    } else if (isRooftop && floorY < -10.0) {
                        // Falling from rooftop, bypass ground effects since they fell into the deep void
                    } else {
                        useGameStore.getState().addHitImpact({
                            x: newPos,
                            y: floorY,
                            color: entity.hp <= 0 ? "#dc2626" : "#78716c",
                            type: "DUST_CLOUD"
                        });
                        useGameStore.getState().addHitImpact({
                            x: newPos,
                            y: floorY + 0.2,
                            color: "#ff3300",
                            type: "HEAVY"
                        });
                        useGameStore.getState().addHitImpact({
                            x: newPos,
                            y: floorY,
                            color: "#ff5500",
                            direction: Math.max(1.0, Math.abs(entity.velocityY) * 5),
                            type: "GROUND_CRACK"
                        });
                        if (useGameStore.getState().gameState !== GameState.CHARACTER_SELECT) {
                            playGroundThud(Math.abs(entity.velocityY));
                        }
                    }

                    if (!isRooftop || floorY >= -10.0) {
                        otherUpdates.shakeIntensity = 2.2; // Camera shake on crash
                    }
                } else {
                    newY = floorY;
                    newVelY = 0;
                    newVelX = 0; // Stop horizontal movement when resting

                    if (isKoOrKnockdown) {
                        // Stay flat on the floor, no bouncing up like jumping
                        if (entity.hp <= 0) {
                            localUpdateFighter(who, { action: ActionType.DEAD, y: floorY, velocityY: 0, velocityX: 0, position: newPos });
                        } else if (entity.action !== ActionType.LAYING_FLAT) {
                            // Initialize laying flat timer ONCE when first hitting ground!
                            layingFlatStartRef.current[who] = Date.now();
                            if (customLayingFlatWaitTimeRef.current[who] > 0) {
                                layingFlatWaitTimeRef.current[who] = customLayingFlatWaitTimeRef.current[who];
                                customLayingFlatWaitTimeRef.current[who] = 0; // Reset after consumption
                            } else {
                                layingFlatWaitTimeRef.current[who] = 700; // 0.7 seconds auto floor recovery
                            }
                            localUpdateFighter(who, { action: ActionType.LAYING_FLAT, y: floorY, velocityY: 0, velocityX: 0, position: newPos });
                        } else {
                            // Already laying flat: maintain position on ground without resetting start timer
                            localUpdateFighter(who, { y: floorY, velocityY: 0, velocityX: 0, position: newPos });
                        }
                        
                        return; // Done
                    }
                }
            }

            localUpdateFighter(who, { y: newY, velocityY: newVelY, velocityX: newVelX, position: newPos });
        }
    };

    processPhysics('player', player);
    processPhysics('enemy', enemy);

    // Get freshest coordinates after physics processing to handle very close range separation
    const freshPlayer = useGameStore.getState().player;
    const freshEnemy = useGameStore.getState().enemy;
    const distanceBetween = freshPlayer.position - freshEnemy.position;
    const minDistance = 0.45;
    if (Math.abs(distanceBetween) < minDistance && freshPlayer.action !== ActionType.DEAD && freshEnemy.action !== ActionType.DEAD && freshPlayer.action !== ActionType.BEING_GRABBED && freshEnemy.action !== ActionType.BEING_GRABBED && freshPlayer.action !== ActionType.THROWN && freshEnemy.action !== ActionType.THROWN) {
        const overlap = minDistance - Math.abs(distanceBetween);
        const pushAmount = overlap / 2;
        const pushDir = distanceBetween >= 0 ? 1 : -1;
        const finalP = Math.max(-12, Math.min(12, freshPlayer.position + pushDir * pushAmount));
        const finalE = Math.max(-12, Math.min(12, freshEnemy.position - pushDir * pushAmount));
        localUpdateFighter('player', { position: finalP });
        localUpdateFighter('enemy', { position: finalE });
    }

    // Gradual passive energy recharge during combat (~5 energy per second)
    if (gameState === GameState.FIGHTING) {
        if (player.energy < 100 && player.hp > 0 && player.action !== ActionType.DEAD) {
            localUpdateFighter('player', { energy: Math.min(100, player.energy + 0.08) });
        }
        if (enemy.energy < 100 && enemy.hp > 0 && enemy.action !== ActionType.DEAD) {
            localUpdateFighter('enemy', { energy: Math.min(100, enemy.energy + 0.08) });
        }
    }

    if (player.action === ActionType.DEAD || enemy.action === ActionType.DEAD) {
        if (player.action !== ActionType.DEAD && [ActionType.MOVE_FORWARD, ActionType.RUN_FORWARD, ActionType.MOVE_BACKWARD].includes(player.action)) {
            localUpdateFighter('player', { action: ActionType.IDLE });
        }
        if (enemy.action !== ActionType.DEAD && [ActionType.MOVE_FORWARD, ActionType.RUN_FORWARD, ActionType.MOVE_BACKWARD].includes(enemy.action)) {
            localUpdateFighter('enemy', { action: ActionType.IDLE });
        }

        if (currentState.shakeIntensity > 0) {
            const nextShake = currentState.shakeIntensity * 0.8;
            otherUpdates.shakeIntensity = nextShake < 0.05 ? 0 : nextShake;
        }

        // Apply any local updates
        if (pUpdates || eUpdates || Object.keys(otherUpdates).length > 0) {
            useGameStore.getState().batchUpdateFighters(pUpdates, eUpdates, otherUpdates);
        }

        gameLoopRef.current = requestAnimationFrame(update);
        return;
    }

    if (currentState.shakeIntensity > 0) {
        const nextShake = currentState.shakeIntensity * 0.8;
        otherUpdates.shakeIntensity = nextShake < 0.05 ? 0 : nextShake;
    }

    // 1. Movement Logic (Player)
    if (player.action === ActionType.MOVE_FORWARD) {
       if (player.position + MOVE_SPEED < enemy.position - 0.7)
          updatePos('player', player.position + MOVE_SPEED);
    } else if (player.action === ActionType.RUN_FORWARD) {
       if (player.position + RUN_SPEED < enemy.position - 0.7)
          updatePos('player', player.position + RUN_SPEED);
    } else if (player.action === ActionType.MOVE_BACKWARD) {
       updatePos('player', player.position - MOVE_SPEED);

    } else if (player.action === ActionType.SLIDE) {
        const elapsed = Date.now() - playerSlideStartRef.current;
        const progress = Math.min(1.0, elapsed / 450); // Slower, smoother over 450ms
        // Smooth deceleration cosine curve
        const curve = Math.cos(progress * Math.PI / 2);
        const currentSlideSpeed = RUN_SPEED * 1.05 * curve;
        const slideAmount = currentSlideSpeed * playerSlideDirRef.current;
        if (slideAmount > 0) {
            if (player.position + slideAmount < enemy.position - 0.7) {
                updatePos('player', player.position + slideAmount);
            }
        } else {
            updatePos('player', player.position + slideAmount);
        }
    }

    // 2. AI Logic
    if (time - lastAiThinkRef.current > AI_THINK_INTERVAL) {
        lastAiThinkRef.current = time;
        const dist = Math.abs(player.position - enemy.position);

        // Enemy AI
        const canActEnemy = enemy.action === ActionType.IDLE || enemy.action === ActionType.MOVE_FORWARD || enemy.action === ActionType.MOVE_BACKWARD;
        
        if (canActEnemy) {
            const isPlayerDown = player.action === ActionType.KNOCKDOWN || player.action === ActionType.LAYING_FLAT || player.action === ActionType.GET_UP || player.action === ActionType.ROLL_RECOVERY || (player.action as any) === ActionType.DEAD;
            
            if (isPlayerDown) {
                // Do not attack a downed player, just reposition
                if (dist > 2.0) {
                     localUpdateFighter('enemy', { action: ActionType.MOVE_FORWARD });
                     window.setTimeout(() => { if (useGameStore.getState().enemy.action === ActionType.MOVE_FORWARD) updateFighter('enemy', { action: ActionType.IDLE }); }, 200);
                } else if (dist < 1.2) {
                     localUpdateFighter('enemy', { action: ActionType.MOVE_BACKWARD });
                     window.setTimeout(() => { if (useGameStore.getState().enemy.action === ActionType.MOVE_BACKWARD) updateFighter('enemy', { action: ActionType.IDLE }); }, 200);
                }
            } else if (isAttack(player.action) && dist < 2.8 && Math.random() > 0.45) {
                // To prevent unfair instant (0ms) "input reading" blocking, we add a realistic human reaction delay (140-200ms).
                // This allows the player's opening hit to land, but lets the AI block subsequent hits!
                const defAction = Math.random() > 0.35 ? ActionType.BLOCK : ActionType.CROUCH;
                const delayMs = 140 + Math.random() * 60;
                
                window.setTimeout(() => {
                    const freshState = useGameStore.getState();
                    const isStillAttacking = isAttack(freshState.player.action);
                    const canActEnemyFresh = freshState.enemy.action === ActionType.IDLE || freshState.enemy.action === ActionType.MOVE_FORWARD || freshState.enemy.action === ActionType.MOVE_BACKWARD;
                    
                    if (isStillAttacking && canActEnemyFresh && freshState.gameState === GameState.FIGHTING) {
                        updateFighter('enemy', { action: defAction });
                        window.setTimeout(() => {
                            if (useGameStore.getState().enemy.action === defAction) {
                                updateFighter('enemy', { action: ActionType.IDLE });
                            }
                        }, 400);
                    }
                }, delayMs);
            }
            else {
                const rand = Math.random();
                const attackRange = 1.6;

                if (dist < attackRange) {
                    if (enemy.energy >= 100 && rand > 0.4) triggerEnemyAttack(ActionType.SPECIAL_ULTIMATE);
                    else if (rand > 0.8) triggerEnemyAttack(ActionType.SPIN_KICK);
                    else if (rand > 0.65) triggerEnemyAttack(ActionType.KICK);
                    else if (rand > 0.5) triggerEnemyAttack(ActionType.JAB);
                    else if (rand > 0.35) triggerEnemyAttack(ActionType.LOW_KICK);
                    else if (rand > 0.2) triggerEnemyAttack(ActionType.UPPERCUT);
                    else triggerEnemyAttack(ActionType.HOOK);
                } else if (dist > 1.2) {
                    // Sometimes run even if closer
                    const moveAction = (dist > 2.2 || rand > 0.7) ? ActionType.RUN_FORWARD : ActionType.MOVE_FORWARD;
                    localUpdateFighter('enemy', { action: moveAction });
                    window.setTimeout(() => { if (useGameStore.getState().enemy.action === moveAction) updateFighter('enemy', { action: ActionType.IDLE }); }, moveAction === ActionType.RUN_FORWARD ? 400 : 200);
                } else {
                     localUpdateFighter('enemy', { action: ActionType.MOVE_FORWARD });
                     window.setTimeout(() => { if (useGameStore.getState().enemy.action === ActionType.MOVE_FORWARD) updateFighter('enemy', { action: ActionType.IDLE }); }, 100);
                }
            }
        }

        // Handle knockdown auto get-up recoveries for Enemy
        const isEnemyDown = (enemy.action === ActionType.LAYING_FLAT || enemy.action === ActionType.KNOCKDOWN || enemy.action === ActionType.THROWN) && enemy.y <= 0.25 && enemy.hp > 0;
        if (isEnemyDown) {
            if (!layingFlatStartRef.current.enemy) {
                layingFlatStartRef.current.enemy = Date.now();
            }
            const enemyWaitTime = layingFlatWaitTimeRef.current.enemy || 400;
            const startTime = layingFlatStartRef.current.enemy;
            if (Date.now() - startTime >= enemyWaitTime) {
                layingFlatStartRef.current.enemy = 0;
                localUpdateFighter('enemy', { action: ActionType.GET_UP, velocityY: 0, velocityX: 0, y: 0 });
                window.setTimeout(() => {
                    if (useGameStore.getState().enemy.action === ActionType.GET_UP) updateFighter('enemy', { action: ActionType.IDLE });
                }, 300);
            }
        }

        // Handle knockdown auto get-up recoveries for Player (ONLY tracking time, no auto get-up)
        const isPlayerDown = (player.action === ActionType.LAYING_FLAT || player.action === ActionType.KNOCKDOWN || player.action === ActionType.THROWN) && player.y <= 0.25 && player.hp > 0;
        if (isPlayerDown) {
            if (!layingFlatStartRef.current.player) {
                layingFlatStartRef.current.player = Date.now();
            }
        }

        // Auto Player AI during Map Preview
        if (isMapPreview) {
            const canActPlayer = player.action === ActionType.IDLE || player.action === ActionType.MOVE_FORWARD || player.action === ActionType.MOVE_BACKWARD;
            if (canActPlayer) {
                if (isAttack(enemy.action) && dist < 2.5 && Math.random() > 0.65) {
                    const defAction = Math.random() > 0.5 ? ActionType.BLOCK : ActionType.CROUCH;
                    localUpdateFighter('player', { action: defAction });
                    window.setTimeout(() => { if (useGameStore.getState().player.action === defAction) updateFighter('player', { action: ActionType.IDLE }) }, 300);
                }
                else {
                    const rand = Math.random();
                    const attackRange = 1.6;
                    if (dist < 0.9 && rand > 0.85) {
                        localUpdateFighter('player', { action: ActionType.GRAB_INIT });
                        playerAttackTimeout.current = window.setTimeout(() => performAttackHitCheck('player', ActionType.GRAB_INIT), MOVES[ActionType.GRAB_INIT].startup);
                        window.setTimeout(() => { if (useGameStore.getState().player.action === ActionType.GRAB_INIT) updateFighter('player', { action: ActionType.IDLE }) }, MOVES[ActionType.GRAB_INIT].total);
                    }
                    else if (dist < attackRange) {
                        const attackMap = [ActionType.JAB, ActionType.CROSS, ActionType.KICK, ActionType.SPIN_KICK, ActionType.LOW_KICK, ActionType.UPPERCUT];
                        const randAttack = attackMap[Math.floor(Math.random() * attackMap.length)];
                        if (player.energy >= 100 && rand > 0.8) {
                             localUpdateFighter('player', { action: ActionType.SPECIAL_ULTIMATE });
                             playerAttackTimeout.current = window.setTimeout(() => performAttackHitCheck('player', ActionType.SPECIAL_ULTIMATE), MOVES[ActionType.SPECIAL_ULTIMATE].startup);
                             window.setTimeout(() => { if (useGameStore.getState().player.action === ActionType.SPECIAL_ULTIMATE) updateFighter('player', { action: ActionType.IDLE }) }, MOVES[ActionType.SPECIAL_ULTIMATE].total);
                        } else {
                             localUpdateFighter('player', { action: randAttack });
                             playerAttackTimeout.current = window.setTimeout(() => performAttackHitCheck('player', randAttack), MOVES[randAttack].startup);
                             window.setTimeout(() => { if (useGameStore.getState().player.action === randAttack) updateFighter('player', { action: ActionType.IDLE }) }, MOVES[randAttack].total);
                        }
                    } else if (dist > 1.2) {
                        const moveAction = (dist > 3.0) ? ActionType.RUN_FORWARD : ActionType.MOVE_FORWARD;
                        localUpdateFighter('player', { action: moveAction });
                        window.setTimeout(() => {
                            if (useGameStore.getState().player.action === moveAction) updateFighter('player', { action: ActionType.IDLE });
                        }, moveAction === ActionType.RUN_FORWARD ? 300 : 200);
                    } else {
                        localUpdateFighter('player', { action: ActionType.MOVE_FORWARD });
                        window.setTimeout(() => {
                            if (useGameStore.getState().player.action === ActionType.MOVE_FORWARD) updateFighter('player', { action: ActionType.IDLE });
                        }, 100);
                    }
                }
            }
        }
    }

    // AI Physics/Movement update
    if (enemy.action === ActionType.MOVE_FORWARD) {
         if (enemy.position - MOVE_SPEED > player.position + 0.7)
            updatePos('enemy', enemy.position - MOVE_SPEED);
    } else if (enemy.action === ActionType.RUN_FORWARD) {
         if (enemy.position - RUN_SPEED > player.position + 0.7)
            updatePos('enemy', enemy.position - RUN_SPEED);
    } else if (enemy.action === ActionType.MOVE_BACKWARD) {
         updatePos('enemy', enemy.position + MOVE_SPEED);
    }

    // Dynamically update facing directions so they always face each other
    let currentP = useGameStore.getState().player;
    let currentE = useGameStore.getState().enemy;
    // merge with any pending local updates during this frame
    if (pUpdates) currentP = { ...currentP, ...pUpdates };
    if (eUpdates) currentE = { ...currentE, ...eUpdates };

    const canTurnP = currentP.action === ActionType.IDLE || currentP.action === ActionType.MOVE_FORWARD || currentP.action === ActionType.MOVE_BACKWARD || currentP.action === ActionType.RUN_FORWARD || currentP.action === ActionType.CROUCH;
    const canTurnE = currentE.action === ActionType.IDLE || currentE.action === ActionType.MOVE_FORWARD || currentE.action === ActionType.MOVE_BACKWARD || currentE.action === ActionType.RUN_FORWARD || currentE.action === ActionType.CROUCH;

    if (canTurnP || canTurnE) {
        let pDir = currentP.direction;
        let eDir = currentE.direction;
        
        if (currentP.position < currentE.position) {
            pDir = 1;
            eDir = -1;
        } else if (currentP.position > currentE.position) {
            pDir = -1;
            eDir = 1;
        }
        
        if (canTurnP && currentP.direction !== pDir) {
            pUpdates = pUpdates ? { ...pUpdates, direction: pDir } : { direction: pDir };
        }
        if (canTurnE && currentE.direction !== eDir) {
            eUpdates = eUpdates ? { ...eUpdates, direction: eDir } : { direction: eDir };
        }
    }

    // Apply all local frame updates in a single batch set call!
    if (pUpdates || eUpdates || Object.keys(otherUpdates).length > 0) {
        useGameStore.getState().batchUpdateFighters(pUpdates, eUpdates, otherUpdates);
    }

    // Record frames for instant replay (last 4 seconds = 240 frames at 60fps)
    if (!stopRecordingReplayRef.current) {
        // Read latest states from store after our batch updates to ensure accurate recordings
        const latestState = useGameStore.getState();
        const snapFrame = {
          player: { ...latestState.player },
          enemy: { ...latestState.enemy },
          shakeIntensity: latestState.shakeIntensity,
          stageY: stageY,
          hitImpacts: [...latestState.hitImpacts],
          sounds: [...currentFrameSoundsRef.current]
        };
        replayFramesRef.current.push(snapFrame);
        if (replayFramesRef.current.length > 240) {
          replayFramesRef.current.shift();
        }
    }
    // Clear captured sounds so they do not stack up across frames
    currentFrameSoundsRef.current = [];

    gameLoopRef.current = requestAnimationFrame(update);
  }, [gameState, updateFighter, performAttackHitCheck, setShakeIntensity]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [update]);


  // --- Action Handlers ---

  const applyAttackImpulse = (attacker: 'player' | 'enemy', action: ActionType) => {
    const currentState = useGameStore.getState();
    const attackerState = attacker === 'player' ? currentState.player : currentState.enemy;
    const defenderState = attacker === 'player' ? currentState.enemy : currentState.player;

    let impulseAmount = 0;
    if (action === ActionType.JAB || action === ActionType.CROUCH_JAB) impulseAmount = 0.28;
    else if (action === ActionType.CROSS) impulseAmount = 0.40;
    else if (action === ActionType.HOOK) impulseAmount = 0.35;
    else if (action === ActionType.UPPERCUT) impulseAmount = 1.2; // Much further forward!
    else if (action === ActionType.KICK) impulseAmount = 0.38;
    else if (action === ActionType.LOW_KICK) impulseAmount = 0.30;
    else if (action === ActionType.SPIN_KICK) impulseAmount = 0.48;

    if (impulseAmount > 0) {
        let newPos = attackerState.position + attackerState.direction * impulseAmount;
        if (attackerState.direction === 1) {
            newPos = Math.min(defenderState.position - 0.45, newPos);
        } else {
            newPos = Math.max(defenderState.position + 0.45, newPos);
        }
        const limits = getFighterMapLimits(false);
        newPos = Math.max(limits.left, Math.min(limits.right, newPos));
        updateFighter(attacker, { position: newPos });
    }
  };

  const triggerEnemyAttack = (action: ActionType) => {
      // Clear prior enemy attack timeouts
      if (enemyAttackTimeout.current) clearTimeout(enemyAttackTimeout.current);
      if (enemyRecoveryTimeout.current) clearTimeout(enemyRecoveryTimeout.current);

      enemyAttackIdRef.current++;
      const currentAttackId = enemyAttackIdRef.current;

      updateFighter('enemy', { action, actionStartTime: Date.now() });
      const stats = MOVES[action];
      if (!stats) return;

      applyAttackImpulse('enemy', action);

      enemyAttackTimeout.current = window.setTimeout(() => {
          if (enemyAttackIdRef.current === currentAttackId) {
            performAttackHitCheck('enemy', action);
            enemyAttackTimeout.current = null;
          }
      }, stats.startup);

      enemyRecoveryTimeout.current = window.setTimeout(() => {
           if (enemyAttackIdRef.current === currentAttackId) {
             const curr = useGameStore.getState().enemy;
             if (curr.action === action) {
               updateFighter('enemy', { action: ActionType.IDLE });
             }
             enemyRecoveryTimeout.current = null;
           }
      }, stats.total);
  };

  function triggerPlayerBufferedAction() {
      const buffered = playerInputBufferRef.current;
      if (buffered && (Date.now() - buffered.time < 500)) {
          playerInputBufferRef.current = null;
          handlePlayerAction(buffered.action);
      }
  }

  function scheduleDefenderRecovery(defender: 'player' | 'enemy', actionToClear: ActionType, duration: number) {
      const ref = defender === 'player' ? playerHitTimeoutRef : enemyHitTimeoutRef;
      if (ref.current) clearTimeout(ref.current);
      ref.current = window.setTimeout(() => {
          const curr = defender === 'player' ? useGameStore.getState().player : useGameStore.getState().enemy;
          if (curr.action === actionToClear) {
              updateFighter(defender, { action: ActionType.IDLE });
              if (defender === 'player') {
                  triggerPlayerBufferedAction();
              }
          }
          ref.current = null;
      }, duration);
  }

  function handlePlayerAction(action: ActionType) {
    if (gameState !== GameState.FIGHTING) return;
    const p = useGameStore.getState().player;
    const e = useGameStore.getState().enemy;

    // Handle knockdown manual recoveries: press ANY button to get up or move to roll
    const isGroundedDown = (p.action === ActionType.LAYING_FLAT || p.action === ActionType.KNOCKDOWN || p.action === ActionType.THROWN) && p.y <= 0.35;
    if (isGroundedDown) {
        // Enforce Ring-out / Dead rule: "al caer de zona de pelea ya no se levante"
        const storeState = useGameStore.getState();
        const map = storeState.selectedMap;
        const isForest = map === 'FOREST';
        const isRooftop = map === 'ROOFTOP';
        let isOffStage = p.y < -0.5;
        if (isForest) {
            isOffStage = isOffStage || (p.position < -11.5 && storeState.forestLeftBroken) || (p.position > 11.5 && storeState.forestRightBroken);
        } else if (isRooftop) {
            isOffStage = isOffStage || (p.position < -11.5 && storeState.rooftopLeftBroken) || (p.position > 11.5 && storeState.rooftopRightBroken);
        } else if (map === 'WAR_OPPONENT' || map === 'PARK_FESTIVAL' || map === 'HELL') {
            isOffStage = false;
        } else {
            isOffStage = isOffStage || p.position < -8.0 || p.position > 8.0;
        }
        if (p.hp <= 0 || isOffStage) return; // Cannot get up if dead or fell off stage!

        // Enforce minimum wait time before allowed to get up
        const waitTime = layingFlatWaitTimeRef.current.player || 400;
        const timeSinceDown = Date.now() - (layingFlatStartRef.current.player || Date.now());
        if (timeSinceDown < waitTime) return; // Still dizzy/recovering, can't move yet

        layingFlatStartRef.current.player = 0; // Reset floor start time

        if (action === ActionType.MOVE_BACKWARD || action === ActionType.MOVE_FORWARD) {
            updateFighter('player', { action: ActionType.ROLL_RECOVERY, y: 0, velocityY: 0, velocityX: 0 });
            const rollDir = action === ActionType.MOVE_FORWARD ? p.direction : -p.direction;
            let steps = 0;
            const rollInterval = setInterval(() => {
                const currentP = useGameStore.getState().player;
                if (currentP.action === ActionType.ROLL_RECOVERY && steps < 8) {
                    let newPos = currentP.position + rollDir * 0.22;
                    const limits = getFighterMapLimits(false);
                    newPos = Math.max(limits.left, Math.min(limits.right, newPos));
                    updateFighter('player', { position: newPos });
                    steps++;
                } else {
                    clearInterval(rollInterval);
                    if (currentP.action === ActionType.ROLL_RECOVERY) {
                        updateFighter('player', { action: ActionType.IDLE });
                        triggerPlayerBufferedAction();
                    }
                }
            }, 30);
        } else {
            // Standard Get up
            updateFighter('player', { action: ActionType.GET_UP, y: 0, velocityY: 0, velocityX: 0 });
            window.setTimeout(() => {
                const currentP = useGameStore.getState().player;
                if (currentP.action === ActionType.GET_UP) {
                    updateFighter('player', { action: ActionType.IDLE });
                    triggerPlayerBufferedAction();
                }
            }, 300);
        }
        return;
    }

    // Enforce dead/grab state lockout (cannot buffer)
    if (p.action === ActionType.DEAD || e.action === ActionType.DEAD || p.action === ActionType.BEING_GRABBED || p.action === ActionType.GRAB_ACTIVE || p.action === ActionType.THROWN) return;

    // If we are currently in HIT, KNOCKDOWN, GET_UP, STUNNED, LAYING_FLAT, or ROLL_RECOVERY, buffer the attack if they press an attack button!
    if (p.action === ActionType.HIT || p.action === ActionType.KNOCKDOWN || p.action === ActionType.GET_UP || p.action === ActionType.STUNNED || p.action === ActionType.LAYING_FLAT || p.action === ActionType.ROLL_RECOVERY) {
        if (isAttack(action) || action === ActionType.SPECIAL_ULTIMATE) {
            playerInputBufferRef.current = { action, time: Date.now() };
        }
        return;
    }

    // Smart Attack Handling with Input Buffering (Combo Chaining):
    if (isAttack(p.action)) {
        if (action !== ActionType.CROUCH && action !== ActionType.MOVE_FORWARD && action !== ActionType.MOVE_BACKWARD) {
            playerInputBufferRef.current = { action, time: Date.now() };
        }
        return;
    }

    // Ultra requirement check: Must have 100 energy to use SPECIAL_ULTIMATE
    if (action === ActionType.SPECIAL_ULTIMATE) {
        if (p.energy < 100) return;
        // Trigger code-based voice announcement for special attack!
        announceVoice(`${p.name}: ¡Ataque Especial!`);
    }

    // Alternate character restriction: No grab attacks as requested
    if (action === ActionType.GRAB_INIT && p.name.toLowerCase().includes('alternate')) return;

    // --- INPUT BUFFER ---
    let finalAction = action;

    if (p.action === ActionType.CROUCH) {
        if (action === ActionType.JAB) finalAction = ActionType.CROUCH_JAB;
        if (action === ActionType.KICK || action === ActionType.LOW_KICK) finalAction = ActionType.LOW_KICK; // low kick (patada2) on down + kick!
    }
    else if (p.action === ActionType.MOVE_FORWARD) {
        if (action === ActionType.KICK) finalAction = ActionType.SPIN_KICK;
        if (action === ActionType.CROSS) finalAction = ActionType.HOOK;
    }
    else {
        if (action === ActionType.LOW_KICK) finalAction = ActionType.LOW_KICK;
    }

    // Grab override
    if (action === ActionType.GRAB_INIT) finalAction = ActionType.GRAB_INIT;

    if (finalAction === ActionType.CROUCH && p.action === ActionType.CROUCH) return;

    if (finalAction === ActionType.SLIDE) {
        if (playerSlideTimeoutRef.current) clearTimeout(playerSlideTimeoutRef.current);

        playerSlideStartRef.current = Date.now();

        // Determine slide direction relative to current facing direction and move state
        if (p.action === ActionType.CROUCH) {
            playerSlideDirRef.current = -1; // Force left slide on double-tap crouch
        } else if (p.action === ActionType.MOVE_BACKWARD) {
            playerSlideDirRef.current = -p.direction;
        } else if (p.action === ActionType.MOVE_FORWARD || p.action === ActionType.RUN_FORWARD) {
            playerSlideDirRef.current = p.direction;
        } else {
            playerSlideDirRef.current = -1; // Default to left slide as requested!
        }

        playerSlideTimeoutRef.current = window.setTimeout(() => {
            const curr = useGameStore.getState().player;
            if (curr.action === ActionType.SLIDE) {
                updateFighter('player', { action: ActionType.IDLE });
            }
        }, 450);
    }

    // Clear prior player attack timeouts
    if (playerAttackTimeout.current) clearTimeout(playerAttackTimeout.current);
    if (playerRecoveryTimeout.current) clearTimeout(playerRecoveryTimeout.current);

    playerAttackIdRef.current++;
    const currentAttackId = playerAttackIdRef.current;

    updateFighter('player', { action: finalAction, actionStartTime: Date.now() });

    applyAttackImpulse('player', finalAction);

    if (isAttack(finalAction)) {
        const stats = MOVES[finalAction] || { startup: 60, total: 500 };
        playerAttackTimeout.current = window.setTimeout(() => {
            if (playerAttackIdRef.current === currentAttackId) {
                performAttackHitCheck('player', finalAction);
                playerAttackTimeout.current = null;
            }
        }, stats.startup);

        playerRecoveryTimeout.current = window.setTimeout(() => {
             if (playerAttackIdRef.current === currentAttackId) {
                 const curr = useGameStore.getState().player;
                 const buffered = playerInputBufferRef.current;
                 playerInputBufferRef.current = null;

                 // If a fresh combo attack was buffered during recovery (< 350ms old), chain it seamlessly!
                 if (buffered && (Date.now() - buffered.time < 350) && curr.hp > 0 && curr.action !== ActionType.DEAD && curr.action !== ActionType.HIT && curr.action !== ActionType.KNOCKDOWN && curr.action !== ActionType.STUNNED && curr.action !== ActionType.BEING_GRABBED) {
                     updateFighter('player', { action: ActionType.IDLE });
                     handlePlayerAction(buffered.action);
                 } else {
                     if (isAttack(curr.action) || curr.action === finalAction) {
                        if (finalAction === ActionType.CROUCH_JAB || finalAction === ActionType.LOW_KICK) {
                            if (useGameStore.getState().player.action === ActionType.CROUCH) updateFighter('player', { action: ActionType.CROUCH });
                            else updateFighter('player', { action: ActionType.IDLE });
                        } else {
                            updateFighter('player', { action: ActionType.IDLE });
                        }
                     }
                 }
                 playerRecoveryTimeout.current = null;
             }
        }, stats.total);
    }
  };

  const handlePlayerRelease = () => {
     if (gameState !== GameState.FIGHTING) return;
     const p = useGameStore.getState().player;

     // Never interrupt an active attack animation on button release!
     if (isAttack(p.action) || p.action === ActionType.HIT || p.action === ActionType.KNOCKDOWN || p.action === ActionType.STUNNED || p.action === ActionType.SPECIAL_ULTIMATE || p.action === ActionType.GRAB_ACTIVE || p.action === ActionType.BEING_GRABBED) {
        return;
     }

     if (p.action === ActionType.MOVE_FORWARD ||
         p.action === ActionType.RUN_FORWARD ||
         p.action === ActionType.MOVE_BACKWARD ||
         p.action === ActionType.BLOCK ||
         p.action === ActionType.CROUCH) {
        updateFighter('player', { action: ActionType.IDLE });
     }
  };

  const handleCharacterSelect = (char: typeof CHARACTERS[0]) => {
      selectCharacter(char.name, char.color, char.subColor, char.modelType);

      // Select a random opponent from the roster for a dynamic experience
      const opponents = CHARACTERS.filter(c => c.name !== char.name);
      const chosenOpponent = opponents.length > 0
        ? opponents[Math.floor(Math.random() * opponents.length)]
        : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

      updateFighter('enemy', {
          name: chosenOpponent.name,
          color: chosenOpponent.color,
          subColor: chosenOpponent.subColor,
          modelType: chosenOpponent.modelType,
          hp: 100,
          maxHp: 100,
          position: 3,
          action: ActionType.IDLE,
          y: 0,
          velocityY: 0
      });

      const mode = useGameStore.getState().gameMode;
      if (mode === 'ARCADE') {
          // Random map selection in Arcade Mode
          const maps = ['DEFAULT', 'WAR_OPPONENT', 'PARK_FESTIVAL', 'HELL', 'FOREST', 'ROOFTOP'] as const;
          const randomMap = maps[Math.floor(Math.random() * maps.length)];
          useGameStore.getState().setSelectedMap(randomMap);

          // Random NPC aura with random color
          const auraTypes = ['BANANA', 'HEART', 'SKULL', 'SAYAYIN', 'WHIRLWIND', 'FIRE'] as const;
          const randomAuraType = auraTypes[Math.floor(Math.random() * auraTypes.length)];
          const auraColors = ['#ffee00', '#ff0055', '#00ffff', '#39ff14', '#a855f7', '#ff6600', '#ff00bb', '#00ffaa'];
          const randomAuraColor = auraColors[Math.floor(Math.random() * auraColors.length)];
          useGameStore.getState().setNpcAura({ type: randomAuraType, color: randomAuraColor });

          // Skip map screen and start fight immediately
          handleStartGame();
      } else {
          // Normal mode: no NPC aura
          useGameStore.getState().setNpcAura(null);
          setSelectionStep('map');
      }
  };

  const handleStartGame = async () => {
    updateFighter('player', { hp: 100, maxHp: 100, energy: 0, position: -1.5, action: ActionType.IDLE, y: 0, velocityY: 0, direction: 1 });
    updateFighter('enemy', { hp: 100, maxHp: 100, energy: 0, position: 1.5, action: ActionType.IDLE, y: 0, velocityY: 0, direction: -1 });
    setGameState(GameState.LOADING);
    window.setTimeout(() => {
      setGameState(GameState.VS_SCREEN);
    }, 600);
  };

  // Reactive Intro Text overlay when fighting starts
  useEffect(() => {
    if (gameState === GameState.FIGHTING) {
      const intros = ["FIGHT"];
      setIntroText(intros[Math.floor(Math.random() * intros.length)]);
      const timer = window.setTimeout(() => setIntroText(""), 1800);
      return () => clearTimeout(timer);
    }
  }, [gameState, setIntroText]);

  // Reset instant replay buffer when starting a new selection or battle
  useEffect(() => {
    if (gameState === GameState.CHARACTER_SELECT || gameState === GameState.FIGHTING) {
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
        replayTimeoutRef.current = null;
      }
      replayFramesRef.current = [];
      setReplayActive(false);
      stopRecordingReplayRef.current = false;
    }
  }, [gameState]);

  useEffect(() => {
    let lastRightPress = 0;
    let lastLeftPress = 0;
    let lastDownPress = 0;

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.repeat) return;

        const p = useGameStore.getState().player;
        const isMovingForward = p.action === ActionType.MOVE_FORWARD;
        const isCrouching = p.action === ActionType.CROUCH;

        switch(e.key) {
            case 'ArrowRight':
                const now = Date.now();
                if (now - lastRightPress < 300) {
                    handlePlayerAction(ActionType.RUN_FORWARD);
                    if (gameState === GameState.FIGHTING) playRunSound();
                } else {
                    handlePlayerAction(ActionType.MOVE_FORWARD);
                }
                lastRightPress = now;
                break;
            case 'ArrowLeft':
                const nowLeft = Date.now();
                if (nowLeft - lastLeftPress < 300) {
                    handlePlayerAction(ActionType.RUN_FORWARD);
                    if (gameState === GameState.FIGHTING) playRunSound();
                } else {
                    handlePlayerAction(ActionType.MOVE_BACKWARD);
                }
                lastLeftPress = nowLeft;
                break;
            case 'ArrowDown': {
                const nowDown = Date.now();
                if (nowDown - lastDownPress < 300) {
                    handlePlayerAction(ActionType.SLIDE);
                } else {
                    handlePlayerAction(ActionType.CROUCH);
                }
                lastDownPress = nowDown;
                break;
            }
            case 's': handlePlayerAction(ActionType.SPECIAL_ULTIMATE); break; // Add Special key
            case 'z': handlePlayerAction(ActionType.JAB); break;
            case 'x':
                if (isMovingForward) handlePlayerAction(ActionType.HOOK);
                else handlePlayerAction(ActionType.CROSS);
                break;
            case 'c': handlePlayerAction(ActionType.UPPERCUT); break;
            case 'v':
                if (isCrouching) handlePlayerAction(ActionType.SPIN_KICK);
                else handlePlayerAction(ActionType.KICK);
                break;
            case 'a': handlePlayerAction(ActionType.GRAB_INIT); break; // 'a' key for grab
            case 'b': handlePlayerAction(ActionType.BLOCK); break;
        }
    };
    const onKeyUp = () => handlePlayerRelease();
    const onBlur = () => {
        const currP = useGameStore.getState().player;
        if ([ActionType.MOVE_FORWARD, ActionType.RUN_FORWARD, ActionType.MOVE_BACKWARD, ActionType.BLOCK, ActionType.CROUCH].includes(currP.action)) {
            useGameStore.getState().updateFighter('player', { action: ActionType.IDLE });
        }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
        };
    }
  }, [gameState]);


  return (
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden select-none"
      onClick={handleScreenClick}
    >
      <MusicSystem />
      <div className={`absolute inset-0 z-0 transition-all duration-700 ${(gameState !== GameState.FIGHTING && gameState !== GameState.REPLAY && selectionStep !== 'map') ? 'scale-105' : ''}`}>
         
          {gameState === GameState.MENU && (
            <div className="absolute inset-0 bg-black z-10 pointer-events-none" style={{ animation: 'fadeToBlack 5s infinite' }}>
              <style>
                {`
                  @keyframes fadeToBlack {
                    0%, 100% { opacity: 1; }
                    10%, 90% { opacity: 0; }
                  }
                `}
              </style>
            </div>
          )}
          <GameScene />

      </div>
      {gameState === GameState.FIGHTING && (
        <>
          <HUD />
          <Controls onAction={handlePlayerAction} onRelease={handlePlayerRelease} />
        </>
      )}
      {gameState === GameState.REPLAY && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-8 border-[20px] border-red-500/20 animate-pulse">
          {/* Replay skipped labels, replaced with skip hint */}
          <div className="flex flex-col items-center gap-2 self-center">
             <div className="bg-red-600/85 backdrop-blur-md px-8 py-3 skew-x-[-12deg] border border-red-400 text-white font-black text-3xl tracking-[0.2em] shadow-[0_0_20px_rgba(239,68,68,0.6)]">
               <span className="skew-x-[12deg] flex items-center gap-3">
                 REPLAY
               </span>
             </div>
             <div className="text-white font-mono text-xs uppercase tracking-[0.4em] bg-black/60 px-4 py-1 rounded-full animate-pulse border border-white/20">
               Click to skip
             </div>
          </div>
          {/* Scanline vintage VHS effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[length:100%_4px] opacity-35 mix-blend-overlay pointer-events-none" />
          {/* Minimal timer */}
          <div className="text-red-500 font-mono text-lg tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)] self-start mt-auto">
            00:0{Math.floor(Math.random() * 9)}:24
          </div>
        </div>
      )}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 flex items-center justify-start bg-black/40 backdrop-blur-sm p-10 overflow-y-auto">
          <div className="flex flex-col items-start gap-8 z-10 w-full max-w-[400px]">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-tighter drop-shadow-lg italic transform -skew-x-12 animate-pulse">
              FALGOR
            </h1>
            <div className="flex flex-col items-start gap-6 w-full">
              <button
                onClick={() => {
                  playMenuClickSound();
                  useGameStore.getState().setGameMode('ARCADE');
                  setSelectionStep('fighter');
                  setGameState(GameState.CHARACTER_SELECT);
                }}
                className="group w-full relative px-10 py-5 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 hover:from-red-500 hover:to-yellow-400 border-2 border-yellow-300 transition-all transform skew-x-[-12deg] hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
              >
                 <div className="flex items-center gap-3 text-white font-black text-2xl skew-x-[12deg] uppercase tracking-widest drop-shadow-md">
                    <Gamepad2 className="w-8 h-8 text-yellow-300 animate-bounce" /> ARCADE
                 </div>
              </button>
              <button
                onClick={() => {
                  playMenuClickSound();
                  useGameStore.getState().setGameMode('NORMAL');
                  useGameStore.getState().setNpcAura(null);
                  setSelectionStep('fighter');
                  setGameState(GameState.CHARACTER_SELECT);
                }}
                className="group w-full relative px-10 py-5 bg-yellow-400 hover:bg-yellow-300 transition-all transform skew-x-[-12deg] hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.6)]"
              >
                 <div className="flex items-center gap-3 text-black font-black text-xl skew-x-[12deg] uppercase tracking-widest">
                    <Play className="fill-black" /> DUEL
                 </div>
              </button>
              
            </div>

            {/* Settings Button */}
            <button 
              onClick={() => {
                playMenuClickSound();
                setShowSettings(true);
              }}
              className="mt-4 flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase font-black text-xs tracking-widest"
            >
              <Settings className="w-4 h-4" /> Ajustes
            </button>
          </div>
        </div>
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
          <div className="bg-slate-900 border-2 border-white/20 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,1)] relative">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-black text-white italic skew-x-[-10deg] mb-8 border-b-2 border-white/10 pb-4">AJUSTES</h2>
            
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <span className="text-white font-black tracking-widest uppercase text-sm">Texturas de Personajes</span>
                  <button 
                    onClick={() => setTexturesEnabled(!texturesEnabled)}
                    className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${texturesEnabled ? 'bg-cyan-500 text-black' : 'bg-red-600 text-white'}`}
                  >
                    {texturesEnabled ? 'ACTIVADAS' : 'DESACTIVADAS'}
                  </button>
               </div>

               <div className="pt-8 border-t border-white/10">
                  <button 
                    onClick={() => {
                      setGameState(GameState.MENU);
                      setShowSettings(false);
                    }}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Regresar a Menu
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
      {gameState === GameState.CHARACTER_SELECT && (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 transition-all duration-500 overflow-y-auto ${selectionStep === 'map' ? 'bg-black/45' : 'bg-black/85 backdrop-blur-md'}`}>
           {selectionStep === 'fighter' ? (
             <>
               <div className="flex flex-col items-center mb-6 mt-4">
                  <h2 className="text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 font-black uppercase tracking-tighter italic drop-shadow-[0_4px_4px_rgba(0,0,0,1)] transform skew-x-[-8deg]">SELECT FIGHTER</h2>
                  
               </div>
               
               {/* Fighter Selection Container */}
               <div className="w-full max-w-5xl flex flex-wrap gap-4 px-4 py-4 justify-center">
                  {CHARACTERS.map(char => (
                     <FighterPreviewCard 
                       key={char.id}
                       character={char}
                       isSelected={false}
                       onSelect={() => handleCharacterSelect(char)}
                     />
                  ))}
               </div>
             </>
           ) : (
             <>
               <div className="flex flex-col items-center mb-6 text-center">
                  <h2 className="text-4xl md:text-5xl text-white font-black uppercase tracking-widest border-b-4 border-red-500 pb-2 italic text-shadow-red">Select Battle Ground</h2>
                  <div className="text-[10px] text-gray-300 font-mono uppercase tracking-widest mt-2">Click below to preview and surround yourself in the environment</div>
               </div>

               {/* Map Selection Container with horizontal scroll */}
               <div className="w-full max-w-4xl overflow-x-auto flex gap-4 px-6 py-4 justify-start md:justify-center scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-slate-900 mb-6">
                  <button 
                     onClick={() => setSelectedMap('DEFAULT')}
                     className={`w-32 h-32 p-3 border-2 transition-all flex flex-col justify-between items-center rounded-xl cursor-pointer shrink-0 ${selectedMap === 'DEFAULT' ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105' : 'border-slate-800 bg-slate-950/80 hover:border-slate-500 hover:bg-slate-900/60'}`}
                  >
                     <div className="text-3xl mt-1">🌋</div>
                     <div className="text-center w-full">
                        <div className="font-black text-white text-[10px] uppercase tracking-wider leading-none truncate">Volcanic Outpost</div>
                        <div className="text-[7px] text-yellow-400 font-mono mt-1.5 uppercase tracking-widest leading-none">Lava Platform</div>
                     </div>
                  </button>

                  <button 
                     onClick={() => setSelectedMap('WAR_OPPONENT')}
                     className={`w-32 h-32 p-3 border-2 transition-all flex flex-col justify-between items-center rounded-xl cursor-pointer shrink-0 ${selectedMap === 'WAR_OPPONENT' ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105' : 'border-slate-800 bg-slate-950/80 hover:border-slate-500 hover:bg-slate-900/60'}`}
                  >
                     <div className="text-3xl mt-1">🌧️</div>
                     <div className="text-center w-full">
                        <div className="font-black text-white text-[10px] uppercase tracking-wider leading-none truncate">War Opponent</div>
                        <div className="text-[7px] text-red-400 font-mono mt-1.5 uppercase tracking-widest leading-none">Missile Rain</div>
                     </div>
                  </button>

                  <button 
                     onClick={() => setSelectedMap('PARK_FESTIVAL')}
                     className={`w-32 h-32 p-3 border-2 transition-all flex flex-col justify-between items-center rounded-xl cursor-pointer shrink-0 ${selectedMap === 'PARK_FESTIVAL' ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105' : 'border-slate-800 bg-slate-950/80 hover:border-slate-500 hover:bg-slate-900/60'}`}
                  >
                     <div className="text-3xl mt-1">🌳</div>
                     <div className="text-center w-full">
                        <div className="font-black text-white text-[10px] uppercase tracking-wider leading-none truncate">Park Festival</div>
                        <div className="text-[7px] text-cyan-400 font-mono mt-1.5 uppercase tracking-widest leading-none">Grass Arena</div>
                     </div>
                  </button>

                  <button 
                     onClick={() => setSelectedMap('HELL')}
                     className={`w-32 h-32 p-3 border-2 transition-all flex flex-col justify-between items-center rounded-xl cursor-pointer shrink-0 ${selectedMap === 'HELL' ? 'border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105' : 'border-slate-800 bg-slate-950/80 hover:border-slate-500 hover:bg-slate-900/60'}`}
                  >
                     <div className="text-3xl mt-1">😈</div>
                     <div className="text-center w-full">
                        <div className="font-black text-white text-[10px] uppercase tracking-wider leading-none truncate flex items-center justify-center gap-1">
                           Hell Stage <span className="text-[6px] bg-purple-600 text-white font-mono px-1 py-0.5 rounded animate-pulse">NEW</span>
                        </div>
                        <div className="text-[7px] text-purple-400 font-mono mt-1.5 uppercase tracking-widest leading-none">Red Moon</div>
                     </div>
                  </button>

                  <button 
                     onClick={() => setSelectedMap('FOREST')}
                     className={`w-32 h-32 p-3 border-2 transition-all flex flex-col justify-between items-center rounded-xl cursor-pointer shrink-0 ${selectedMap === 'FOREST' ? 'border-sky-400 bg-sky-400/20 shadow-[0_0_15px_rgba(56,189,248,0.5)] scale-105' : 'border-slate-800 bg-slate-950/80 hover:border-slate-500 hover:bg-slate-900/60'}`}
                  >
                     <div className="text-3xl mt-1">🌲</div>
                     <div className="text-center w-full">
                        <div className="font-black text-white text-[10px] uppercase tracking-wider leading-none truncate flex items-center justify-center gap-1">
                           Forest <span className="text-[6px] bg-sky-600 text-white font-mono px-1 py-0.5 rounded animate-pulse">NEW</span>
                        </div>
                        <div className="text-[7px] text-sky-400 font-mono mt-1.5 uppercase tracking-widest leading-none">Nature</div>
                     </div>
                  </button>

                  <button 
                     onClick={() => setSelectedMap('ROOFTOP')}
                     className={`w-32 h-32 p-3 border-2 transition-all flex flex-col justify-between items-center rounded-xl cursor-pointer shrink-0 ${selectedMap === 'ROOFTOP' ? 'border-indigo-400 bg-indigo-400/20 shadow-[0_0_15px_rgba(129,140,248,0.5)] scale-105' : 'border-slate-800 bg-slate-950/80 hover:border-slate-500 hover:bg-slate-900/60'}`}
                  >
                     <div className="text-3xl mt-1">🏢</div>
                     <div className="text-center w-full">
                        <div className="font-black text-white text-[10px] uppercase tracking-wider leading-none truncate flex items-center justify-center gap-1">
                           Rooftop <span className="text-[6px] bg-indigo-600 text-white font-mono px-1 py-0.5 rounded animate-pulse">NEW</span>
                        </div>
                        <div className="text-[7px] text-indigo-400 font-mono mt-1.5 uppercase tracking-widest leading-none">Rooftop Edifices</div>
                     </div>
                  </button>
               </div>

               {/* Large Confirm/Fight Button */}
               <button
                 onClick={() => { playMenuClickSound(); handleStartGame(); }}
                 className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border-2 border-red-400 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:scale-105 active:scale-95 flex items-center gap-2"
               >
                  LET'S FIGHT <Play className="w-4 h-4 fill-white" />
               </button>

               {/* Back Button to go back to Fighter Select */}
               <button
                 onClick={() => { playMenuClickSound(); setSelectionStep('fighter'); }}
                 className="mt-6 px-5 py-2 bg-slate-900/80 border border-slate-700 hover:border-white hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all"
               >
                 ← Back to Fighter Selection
               </button>
             </>
           )}
        </div>
      )}
      {gameState === GameState.LOADING && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-white font-mono text-2xl animate-pulse">
              INITIALIZING BATTLE SYSTEMS...
          </div>
      )}
      {gameState === GameState.VS_SCREEN && (
          <VSScreen />
      )}
      {gameState === GameState.CINEMATIC_INTRO && (
          <CinematicIntroOverlay />
      )}
      {gameState === GameState.GAME_OVER && lastResult && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
          <h2 className="text-6xl font-black text-white italic mb-2 tracking-widest text-shadow-red">
            K.O.
          </h2>
          <div className="text-4xl font-bold text-yellow-400 mb-8 uppercase">
             {lastResult.winner} WINS
          </div>
          <div className="max-w-md text-center mb-12 px-6">
             <p className="text-cyan-200 text-xl font-mono border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-900/20 italic">
                "{useGameStore.getState().introText}"
             </p>
          </div>
          <button
            onClick={resetFight}
            className="px-8 py-4 bg-gray-800 border-2 border-white hover:bg-gray-700 text-white font-bold tracking-wider rounded uppercase transition flex items-center gap-2"
          >
             <Trophy className="w-5 h-5" /> Play Again
          </button>
        </div>
      )}
      {showMusicEditor && (
        <MusicEditor onClose={() => setShowMusicEditor(false)} />
      )}
      {showTextureTest && (
        <TextureTest onClose={() => setShowTextureTest(false)} />
      )}
    </div>
  );
};

export default App;
