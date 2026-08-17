import { create } from 'zustand';
import { GameState, FighterState, ActionType, FightResult, MusicSequence, HitImpact, MapType } from './types';
import { ARENA_WIDTH, ENEMY_COLOR, ENEMY_SUB_COLOR } from './constants';
import { playExplosionSound } from './utils/audio';

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  
  player: FighterState;
  enemy: FighterState;
  
  playerWins: number;
  enemyWins: number;
  currentRound: number;
  incrementPlayerWins: () => void;
  incrementEnemyWins: () => void;
  nextRound: () => void;
  resetMatch: () => void;

  selectCharacter: (name: string, color: string, subColor: string, modelType: 'HUMAN' | 'FOX') => void;
  updateFighter: (who: 'player' | 'enemy', updates: Partial<FighterState>) => void;
  batchUpdateFighters: (playerUpdates: Partial<FighterState> | null, enemyUpdates: Partial<FighterState> | null, otherUpdates?: any) => void;
  resetFight: () => void;
  
  introText: string;
  setIntroText: (text: string) => void;
  
  shakeIntensity: number;
  setShakeIntensity: (intensity: number) => void;
  
  hitStop: number; // Frames to freeze the game for impact feel
  setHitStop: (frames: number) => void;
  
  stageY: number; // Rising platform height
  setStageY: (y: number) => void;
  
  selectedMap: MapType;
  setSelectedMap: (map: MapType) => void;
  
  gameMode: 'NORMAL' | 'ARCADE';
  setGameMode: (mode: 'NORMAL' | 'ARCADE') => void;

  npcAura: { type: 'BANANA' | 'HEART' | 'SKULL' | 'SAYAYIN' | 'WHIRLWIND' | 'FIRE'; color: string } | null;
  setNpcAura: (aura: { type: 'BANANA' | 'HEART' | 'SKULL' | 'SAYAYIN' | 'WHIRLWIND' | 'FIRE'; color: string } | null) => void;
  
  lastResult: FightResult | null;
  setLastResult: (result: FightResult) => void;

  showKoBanner: boolean;
  setShowKoBanner: (show: boolean) => void;

  texturesEnabled: boolean;
  setTexturesEnabled: (enabled: boolean) => void;

  timer: number;
  setTimer: (time: number) => void;

  customMusic: MusicSequence;
  setCustomMusic: (music: MusicSequence) => void;

  currentStep: number;
  setCurrentStep: (step: number) => void;

  hitImpacts: HitImpact[];
  playerHitsReceived: number;
  incrementPlayerHitsReceived: () => void;
  resetPlayerHitsReceived: () => void;
  addHitImpact: (impact: Omit<HitImpact, 'id'>) => void;
  removeHitImpact: (id: string) => void;

  cinematicStage: 'p1' | 'p2' | 'fight' | null;
  cinematicSpeaker: 'player' | 'enemy' | null;
  cinematicQuote: string;
  setCinematicState: (stage: 'p1' | 'p2' | 'fight' | null, speaker: 'player' | 'enemy' | null, quote: string) => void;

  combatLogs: string[];
  addCombatLog: (log: string) => void;
  clearCombatLogs: () => void;

  forestLeftBroken: boolean;
  forestRightBroken: boolean;
  rooftopLeftBroken: boolean;
  rooftopRightBroken: boolean;
  setForestLeftBroken: (broken: boolean) => void;
  setForestRightBroken: (broken: boolean) => void;
  setRooftopLeftBroken: (broken: boolean) => void;
  setRooftopRightBroken: (broken: boolean) => void;
  forestWaterColor: string;
  setForestWaterColor: (color: string) => void;
}

const defaultMusic: MusicSequence = {
  kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
  bass: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
  bpm: 140
};

const initialPlayerState: FighterState = {
  hp: 100,
  maxHp: 100,
  energy: 0,
  maxEnergy: 100,
  position: -1.5,
  y: 0,
  velocityY: 0, velocityX: 0,
  action: ActionType.IDLE,
  direction: 1,
  isAi: false,
  color: '#e0ac69',
  subColor: '#ffffff',
  name: "Player",
  modelType: 'HUMAN'
};

const initialEnemyState: FighterState = {
  hp: 100,
  maxHp: 100,
  energy: 0,
  maxEnergy: 100,
  position: 1.5,
  y: 0,
  velocityY: 0, velocityX: 0,
  action: ActionType.IDLE,
  direction: -1,
  isAi: true,
  color: ENEMY_COLOR,
  subColor: ENEMY_SUB_COLOR,
  name: "Mecha Ogre",
  modelType: 'HUMAN'
};

export const useGameStore = create<GameStore>((set) => ({
  gameState: GameState.MENU,
  setGameState: (gameState) => set({ gameState }),
  
  player: { ...initialPlayerState },
  enemy: { ...initialEnemyState },
  
  playerWins: 0,
  enemyWins: 0,
  currentRound: 1,
  incrementPlayerWins: () => set((state) => ({ playerWins: state.playerWins + 1 })),
  incrementEnemyWins: () => set((state) => ({ enemyWins: state.enemyWins + 1 })),
  nextRound: () => set((state) => ({ 
    currentRound: state.currentRound + 1,
    player: { ...state.player, hp: 100, energy: 0, position: -1.5, action: ActionType.IDLE, y: 0, velocityY: 0, velocityX: 0, direction: 1 },
    enemy: { ...state.enemy, hp: 100, energy: 0, position: 1.5, action: ActionType.IDLE, y: 0, velocityY: 0, velocityX: 0, direction: -1 },
    gameState: GameState.FIGHTING,
    showKoBanner: false,
    texturesEnabled: true,
    setTexturesEnabled: (enabled: boolean) => set({ texturesEnabled: enabled }),
    timer: 60,
    introText: "FIGHT",
    forestLeftBroken: false,
    forestRightBroken: false,
    rooftopLeftBroken: false,
    rooftopRightBroken: false,
    forestWaterColor: '#226688',
  })),
  resetMatch: () => set({ 
    playerWins: 0, 
    enemyWins: 0, 
    currentRound: 1,
    forestLeftBroken: false,
    forestRightBroken: false,
    rooftopLeftBroken: false,
    rooftopRightBroken: false,
    forestWaterColor: '#226688',
  }),

  texturesEnabled: true,
  setTexturesEnabled: (enabled) => set({ texturesEnabled: enabled }),

  timer: 60,
  setTimer: (timer) => set({ timer }),

  introText: "",
  setIntroText: (text) => set({ introText: text }),
  
  shakeIntensity: 0,
  setShakeIntensity: (intensity) => set({ shakeIntensity: intensity }),
  
  hitStop: 0,
  setHitStop: (frames) => set({ hitStop: frames }),
  
  stageY: 0, // Flat platform from the start
  setStageY: (y) => set({ stageY: y }),
  
  selectedMap: 'FOREST',
  setSelectedMap: (selectedMap) => set({ selectedMap }),
  
  forestLeftBroken: false,
  forestRightBroken: false,
  rooftopLeftBroken: false,
  rooftopRightBroken: false,
  setForestLeftBroken: (forestLeftBroken) => set({ forestLeftBroken }),
  setForestRightBroken: (forestRightBroken) => set({ forestRightBroken }),
  setRooftopLeftBroken: (rooftopLeftBroken) => set({ rooftopLeftBroken }),
  setRooftopRightBroken: (rooftopRightBroken) => set({ rooftopRightBroken }),
  forestWaterColor: '#226688',
  setForestWaterColor: (forestWaterColor) => set({ forestWaterColor }),
  
  gameMode: 'NORMAL',
  setGameMode: (gameMode) => set({ gameMode }),

  npcAura: null,
  setNpcAura: (npcAura) => set({ npcAura }),

  lastResult: null,
  setLastResult: (lastResult) => set({ lastResult }),

  showKoBanner: false,
  setShowKoBanner: (showKoBanner) => set({ showKoBanner }),

  customMusic: { ...defaultMusic },
  setCustomMusic: (customMusic) => set({ customMusic }),

  currentStep: 0,
  setCurrentStep: (currentStep) => set({ currentStep }),

  hitImpacts: [],
  playerHitsReceived: 0,
  incrementPlayerHitsReceived: () => set((state) => ({ playerHitsReceived: state.playerHitsReceived + 1 })),
  resetPlayerHitsReceived: () => set({ playerHitsReceived: 0 }),
  addHitImpact: (impact) => set((state) => {
    const id = Math.random().toString(36).substr(2, 9);
    const updated = [...state.hitImpacts, { ...impact, id }];
    if (updated.length > 40) updated.shift();
    return { hitImpacts: updated };
  }),
  removeHitImpact: (id) => set((state) => ({
    hitImpacts: state.hitImpacts.filter((imp) => imp.id !== id)
  })),

  cinematicStage: null,
  cinematicSpeaker: null,
  cinematicQuote: '',
  setCinematicState: (cinematicStage, cinematicSpeaker, cinematicQuote) => set({ cinematicStage, cinematicSpeaker, cinematicQuote }),

  combatLogs: [],
  addCombatLog: (log) => set((state) => {
    const updated = [log, ...state.combatLogs];
    if (updated.length > 25) updated.pop();
    return { combatLogs: updated };
  }),
  clearCombatLogs: () => set({ combatLogs: [] }),

  selectCharacter: (name, color, subColor, modelType) => set((state) => ({
    player: {
      ...state.player,
      name,
      color,
      subColor,
      modelType
    }
  })),

  updateFighter: (who, updates) => set((state) => {
    const currentFighter = state[who];
    const otherWho = who === 'player' ? 'enemy' : 'player';
    const otherFighter = state[otherWho];
    
    let nextPosition = updates.position !== undefined ? updates.position : currentFighter.position;
    const otherPosition = otherFighter.position;
    
    if (updates.position !== undefined) {
      const MAX_PLAYER_DISTANCE = 9.5;
      
      // Enforce max distance between fighters to prevent off-screen visual issues in vertical play
      if (Math.abs(nextPosition - otherPosition) > MAX_PLAYER_DISTANCE) {
        if (nextPosition < otherPosition) {
          nextPosition = otherPosition - MAX_PLAYER_DISTANCE;
        } else {
          nextPosition = otherPosition + MAX_PLAYER_DISTANCE;
        }
      }

      // Enforce arena boundary clamp
      let leftLimit = -8.0;
      let rightLimit = 8.0;
      const isNoqueado = currentFighter.action === ActionType.KNOCKDOWN || currentFighter.action === ActionType.DEAD || currentFighter.action === ActionType.AIR_SPIN_HIT || currentFighter.hp <= 0 || updates.action === ActionType.KNOCKDOWN || updates.action === ActionType.DEAD || updates.action === ActionType.AIR_SPIN_HIT;

      if (state.selectedMap === 'WAR_OPPONENT' || state.selectedMap === 'PARK_FESTIVAL' || state.selectedMap === 'HELL') {
        leftLimit = -12.0;
        rightLimit = 12.0;
      } else if (state.selectedMap === 'FOREST') {
        leftLimit = (state.forestLeftBroken || isNoqueado) ? -12.0 : -11.2;
        rightLimit = (state.forestRightBroken || isNoqueado) ? 12.0 : 11.2;
      } else if (state.selectedMap === 'ROOFTOP') {
        leftLimit = (state.rooftopLeftBroken || isNoqueado) ? -12.0 : -11.2;
        rightLimit = (state.rooftopRightBroken || isNoqueado) ? 12.0 : 11.2;
      } else {
        leftLimit = -ARENA_WIDTH / 2; // -11.0
        rightLimit = ARENA_WIDTH / 2;  // 11.0
      }

      nextPosition = Math.max(leftLimit, Math.min(rightLimit, nextPosition));
    }

    let extraUpdates: any = {};
    const isNoqueado = currentFighter.action === ActionType.KNOCKDOWN || currentFighter.action === ActionType.DEAD || currentFighter.action === ActionType.AIR_SPIN_HIT || currentFighter.hp <= 0 || updates.action === ActionType.KNOCKDOWN || updates.action === ActionType.DEAD || updates.action === ActionType.AIR_SPIN_HIT;
    let nextHitImpacts = [...state.hitImpacts];

    if (isNoqueado && updates.position !== undefined) {
      if (state.selectedMap === 'FOREST') {
        if (nextPosition <= -11.4 && !state.forestLeftBroken) {
          extraUpdates.forestLeftBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.5, color: '#8b5a2b', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.1, color: '#555555', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
        if (nextPosition >= 11.4 && !state.forestRightBroken) {
          extraUpdates.forestRightBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.5, color: '#8b5a2b', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.1, color: '#555555', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
      } else if (state.selectedMap === 'ROOFTOP') {
        if (nextPosition <= -11.4 && !state.rooftopLeftBroken) {
          extraUpdates.rooftopLeftBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.5, color: '#cccccc', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.1, color: '#777777', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
        if (nextPosition >= 11.4 && !state.rooftopRightBroken) {
          extraUpdates.rooftopRightBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.5, color: '#cccccc', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.1, color: '#777777', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
      }
    }
    
    return {
      [who]: { 
        ...currentFighter, 
        ...updates,
        position: nextPosition
      },
      hitImpacts: nextHitImpacts,
      ...extraUpdates
    };
  }),

  batchUpdateFighters: (playerUpdates, enemyUpdates, otherUpdates) => set((state) => {
    let nextPlayer = { ...state.player };
    let nextEnemy = { ...state.enemy };

    if (playerUpdates) {
      nextPlayer = { ...nextPlayer, ...playerUpdates };
    }
    if (enemyUpdates) {
      nextEnemy = { ...nextEnemy, ...enemyUpdates };
    }

    // Resolve positions and distance clamps
    let pPos = nextPlayer.position;
    let ePos = nextEnemy.position;

    const MAX_PLAYER_DISTANCE = 9.5;
    if (Math.abs(pPos - ePos) > MAX_PLAYER_DISTANCE) {
      if (pPos < ePos) {
        if (playerUpdates && playerUpdates.position !== undefined && (!enemyUpdates || enemyUpdates.position === undefined)) {
          pPos = ePos - MAX_PLAYER_DISTANCE;
        } else if (enemyUpdates && enemyUpdates.position !== undefined && (!playerUpdates || playerUpdates.position === undefined)) {
          ePos = pPos + MAX_PLAYER_DISTANCE;
        } else {
          const mid = (pPos + ePos) / 2;
          pPos = mid - MAX_PLAYER_DISTANCE / 2;
          ePos = mid + MAX_PLAYER_DISTANCE / 2;
        }
      } else {
        if (playerUpdates && playerUpdates.position !== undefined && (!enemyUpdates || enemyUpdates.position === undefined)) {
          pPos = ePos + MAX_PLAYER_DISTANCE;
        } else if (enemyUpdates && enemyUpdates.position !== undefined && (!playerUpdates || playerUpdates.position === undefined)) {
          ePos = pPos - MAX_PLAYER_DISTANCE;
        } else {
          const mid = (pPos + ePos) / 2;
          pPos = mid + MAX_PLAYER_DISTANCE / 2;
          ePos = mid - MAX_PLAYER_DISTANCE / 2;
        }
      }
    }

    // Enforce arena boundary clamp
    let leftLimit = -8.0;
    let rightLimit = 8.0;
    const pNoqueado = nextPlayer.action === ActionType.KNOCKDOWN || nextPlayer.action === ActionType.DEAD || nextPlayer.action === ActionType.AIR_SPIN_HIT || nextPlayer.hp <= 0;
    const eNoqueado = nextEnemy.action === ActionType.KNOCKDOWN || nextEnemy.action === ActionType.DEAD || nextEnemy.action === ActionType.AIR_SPIN_HIT || nextEnemy.hp <= 0;

    if (state.selectedMap === 'WAR_OPPONENT' || state.selectedMap === 'PARK_FESTIVAL' || state.selectedMap === 'HELL') {
      leftLimit = -12.0;
      rightLimit = 12.0;
      nextPlayer.position = Math.max(leftLimit, Math.min(rightLimit, pPos));
      nextEnemy.position = Math.max(leftLimit, Math.min(rightLimit, ePos));
    } else if (state.selectedMap === 'FOREST') {
      const pLeftLimit = (state.forestLeftBroken || pNoqueado) ? -12.0 : -11.2;
      const pRightLimit = (state.forestRightBroken || pNoqueado) ? 12.0 : 11.2;
      const eLeftLimit = (state.forestLeftBroken || eNoqueado) ? -12.0 : -11.2;
      const eRightLimit = (state.forestRightBroken || eNoqueado) ? 12.0 : 11.2;
      nextPlayer.position = Math.max(pLeftLimit, Math.min(pRightLimit, pPos));
      nextEnemy.position = Math.max(eLeftLimit, Math.min(eRightLimit, ePos));
    } else if (state.selectedMap === 'ROOFTOP') {
      const pLeftLimit = (state.rooftopLeftBroken || pNoqueado) ? -12.0 : -11.2;
      const pRightLimit = (state.rooftopRightBroken || pNoqueado) ? 12.0 : 11.2;
      const eLeftLimit = (state.rooftopLeftBroken || eNoqueado) ? -12.0 : -11.2;
      const eRightLimit = (state.rooftopRightBroken || eNoqueado) ? 12.0 : 11.2;
      nextPlayer.position = Math.max(pLeftLimit, Math.min(pRightLimit, pPos));
      nextEnemy.position = Math.max(eLeftLimit, Math.min(eRightLimit, ePos));
    } else {
      leftLimit = -ARENA_WIDTH / 2; // -11.0
      rightLimit = ARENA_WIDTH / 2;  // 11.0
      nextPlayer.position = Math.max(leftLimit, Math.min(rightLimit, pPos));
      nextEnemy.position = Math.max(leftLimit, Math.min(rightLimit, ePos));
    }

    let extraUpdates: any = {};
    let nextHitImpacts = [...state.hitImpacts];

    // Check player for breakable object collision
    if (pNoqueado) {
      if (state.selectedMap === 'FOREST') {
        if (nextPlayer.position <= -11.4 && !state.forestLeftBroken) {
          extraUpdates.forestLeftBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.5, color: '#8b5a2b', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.1, color: '#555555', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
        if (nextPlayer.position >= 11.4 && !state.forestRightBroken) {
          extraUpdates.forestRightBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.5, color: '#8b5a2b', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.1, color: '#555555', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
      } else if (state.selectedMap === 'ROOFTOP') {
        if (nextPlayer.position <= -11.4 && !state.rooftopLeftBroken) {
          extraUpdates.rooftopLeftBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.5, color: '#cccccc', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.1, color: '#777777', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
        if (nextPlayer.position >= 11.4 && !state.rooftopRightBroken) {
          extraUpdates.rooftopRightBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.5, color: '#cccccc', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.1, color: '#777777', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
      }
    }

    // Check enemy for breakable object collision
    if (eNoqueado) {
      if (state.selectedMap === 'FOREST') {
        if (nextEnemy.position <= -11.4 && !state.forestLeftBroken) {
          extraUpdates.forestLeftBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.5, color: '#8b5a2b', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.1, color: '#555555', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
        if (nextEnemy.position >= 11.4 && !state.forestRightBroken) {
          extraUpdates.forestRightBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.5, color: '#8b5a2b', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.1, color: '#555555', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
      } else if (state.selectedMap === 'ROOFTOP') {
        if (nextEnemy.position <= -11.4 && !state.rooftopLeftBroken) {
          extraUpdates.rooftopLeftBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.5, color: '#cccccc', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: -11.6, y: 0.1, color: '#777777', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
        if (nextEnemy.position >= 11.4 && !state.rooftopRightBroken) {
          extraUpdates.rooftopRightBroken = true;
          extraUpdates.shakeIntensity = 5.0;
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.5, color: '#cccccc', type: 'HEAVY' });
          nextHitImpacts.push({ id: Math.random().toString(36).substr(2, 9), x: 11.6, y: 0.1, color: '#777777', type: 'DUST_CLOUD' });
          setTimeout(() => { try { playExplosionSound(); } catch(e){} }, 0);
        }
      }
    }

    return {
      player: nextPlayer,
      enemy: nextEnemy,
      hitImpacts: nextHitImpacts,
      ...extraUpdates,
      ...otherUpdates
    };
  }),
  
  resetFight: () => set((state) => ({
    player: { ...state.player, hp: 100, energy: 0, position: -1.5, action: ActionType.IDLE, y: 0, velocityY: 0, velocityX: 0, direction: 1 },
    enemy: { ...state.enemy, hp: 100, energy: 0, position: 1.5, action: ActionType.IDLE, y: 0, velocityY: 0, velocityX: 0, direction: -1 },
    gameState: GameState.CHARACTER_SELECT, 
    playerWins: 0,
    enemyWins: 0,
    currentRound: 1,
    lastResult: null,
    shakeIntensity: 0,
    hitStop: 0,
    stageY: 0,
    timer: 60,
    hitImpacts: [],
    playerHitsReceived: 0,
    npcAura: null,
    combatLogs: [],
    forestLeftBroken: false,
    forestRightBroken: false,
    rooftopLeftBroken: false,
    rooftopRightBroken: false,
    forestWaterColor: '#226688',
  }))
}));