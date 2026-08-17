export enum GameState {
  MENU = 'MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  LOADING = 'LOADING',
  VS_SCREEN = 'VS_SCREEN',
  CINEMATIC_INTRO = 'CINEMATIC_INTRO',
  FIGHTING = 'FIGHTING',
  GAME_OVER = 'GAME_OVER',
  REPLAY = 'REPLAY'
}

export enum ActionType {
  IDLE = 'IDLE',
  MOVE_FORWARD = 'MOVE_FORWARD',
  MOVE_BACKWARD = 'MOVE_BACKWARD',
  RUN_FORWARD = 'RUN_FORWARD',
  CROUCH = 'CROUCH',
  CROUCH_JAB = 'CROUCH_JAB',
  JAB = 'JAB',
  CROSS = 'CROSS',
  HOOK = 'HOOK',           
  UPPERCUT = 'UPPERCUT',
  KICK = 'KICK',
  LOW_KICK = 'LOW_KICK',   
  SPIN_KICK = 'SPIN_KICK', 
  GRAB_INIT = 'GRAB_INIT',     // Attempting to grab
  GRAB_ACTIVE = 'GRAB_ACTIVE', // Successfully throwing
  BLOCK = 'BLOCK',
  SLIDE = 'SLIDE',
  HIT = 'HIT',             
  STUNNED = 'STUNNED',     
  BEING_GRABBED = 'BEING_GRABBED', // Held by opponent
  THROWN = 'THROWN',               // Flying through air after grab
  AIR_SPIN_HIT = 'AIR_SPIN_HIT',   // Spinning through the air after a mid-air hit
  LAYING_FLAT = 'LAYING_FLAT',
  KNOCKDOWN = 'KNOCKDOWN', 
  GET_UP = 'GET_UP',
  ROLL_RECOVERY = 'ROLL_RECOVERY',       
  DEAD = 'DEAD',
  INTRO_TAUNT = 'INTRO_TAUNT',
  INTRO_POWERUP = 'INTRO_POWERUP',
  INTRO_SALUTE = 'INTRO_SALUTE',
  INTRO_AURA = 'INTRO_AURA',
  INTRO_STANCE = 'INTRO_STANCE',
  SPECIAL_LIGHTNING = 'SPECIAL_LIGHTNING',
  SPECIAL_ULTIMATE = 'SPECIAL_ULTIMATE'
}

export type ModelType = 'HUMAN' | 'FOX';

export interface MusicSequence {
  kick: boolean[];   // 16 steps
  snare: boolean[];  // 16 steps
  hihat: boolean[];  // 16 steps
  bass: number[];    // 16 steps (0 = rest, 1 = E2, 2 = G2, 3 = A2, 4 = C3, 5 = D3)
  bpm: number;
}

export type MapType = 'DEFAULT' | 'WAR_OPPONENT' | 'PARK_FESTIVAL' | 'HELL' | 'FOREST' | 'ROOFTOP';

export interface FighterState {
  hp: number;
  maxHp: number;
  energy: number;     // For special attacks
  maxEnergy: number;
  position: number;
  y: number;          // Height from ground
  velocityY: number;  // Vertical velocity
  velocityX: number;
  action: ActionType;
  actionStartTime?: number;
  direction: 1 | -1;
  isAi: boolean;
  color: string;
  subColor: string; 
  name: string;
  modelType: ModelType;
  isFaceDown?: boolean;
  spinMultiplier?: number;
}

export interface FightResult {
  winner: string;
  loser: string;
}

export interface HitImpact {
  id: string;
  x: number;
  y: number;
  color: string;
  direction?: number;
  type: string;
}