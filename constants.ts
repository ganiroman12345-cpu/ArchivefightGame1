import { ModelType } from './types';

export const ARENA_WIDTH = 22;
export const MOVE_SPEED = 0.12; 
export const RUN_SPEED = 0.28; 
export const ATTACK_RANGE = 1.5;

// Precise Attack Ranges
export const RANGE_JAB = 1.55;      
export const RANGE_CROSS = 1.65;    
export const RANGE_HOOK = 1.60;
export const RANGE_UPPERCUT = 1.80; 
export const RANGE_KICK = 1.75;
export const RANGE_LOW_KICK = 1.65;
export const RANGE_SPIN_KICK = 1.80;
export const RANGE_CROUCH_JAB = 1.60;
export const RANGE_GRAB = 1.3; // Very close range

// Damage Values
export const JAB_DAMAGE = 4;
export const CROSS_DAMAGE = 8;
export const HOOK_DAMAGE = 12;
export const UPPERCUT_DAMAGE = 15;
export const KICK_DAMAGE = 10;
export const LOW_KICK_DAMAGE = 5;
export const SPIN_KICK_DAMAGE = 14;
export const CROUCH_JAB_DAMAGE = 4;
export const GRAB_DAMAGE = 25; // Massive damage

// Knockback Forces
export const PUSH_JAB = 0.5;
export const PUSH_CROSS = 1.0;
export const PUSH_HOOK = 1.3;
export const PUSH_UPPERCUT = 1.0; 
export const PUSH_KICK = 0.8;
export const PUSH_LOW_KICK = 0.3;
export const PUSH_SPIN_KICK = 2.0; 
export const PUSH_ROLL = 3.5;

export const BLOCK_REDUCTION = 0.85; 
export const AI_THINK_INTERVAL = 300; 

// Character Definitions
export const CHARACTERS = [
  {
    id: 'jin',
    name: 'James',
    modelType: 'HUMAN' as ModelType,
    color: '#e0ac69', // Skin
    subColor: '#6b7280', // Gray clothes
    description: 'Balanced Fighter',
    quoteEs: '¡Te voy a hacer pedazos en esta arena!',
    quoteEn: 'I will break you into pieces in this arena!',
    quotesEs: [
      '¡Te voy a hacer pedazos en esta arena!',
      '¡Siente la verdadera disciplina del Puño de Hierro!',
      '¡No me detendré hasta que caigas al suelo!'
    ],
    introAction: 'INTRO_POWERUP'
  },
  {
    id: 'fox',
    name: 'Osbamo',
    modelType: 'FOX' as ModelType,
    color: '#38bdf8', // Light Blue (Celeste)
    subColor: '#ffffff', // White
    description: 'Agile Furry Fighter',
    quoteEs: '¡Siente el rayo de mi velocidad celestial!',
    quoteEn: 'Feel the thunderous surge of my speed!',
    quotesEs: [
      '¡Siente el rayo de mi velocidad celestial!',
      '¡Eres demasiado lento para tocar a la zafiro azul!',
      '¡Ni siquiera pudiste ver de dónde vino ese golpe!'
    ],
    introAction: 'INTRO_AURA'
  },
  {
    id: 'sakura',
    name: 'Ava',
    modelType: 'HUMAN' as ModelType,
    color: '#ff66b2', // Hot Pink
    subColor: '#ff007f', // Rose Shirt
    description: 'Agile Kunoichi with curves',
    quoteEs: '¡Las sombras danzan antes de tu caída!',
    quoteEn: 'Shadows dance before your total defeat!',
    quotesEs: [
      '¡Las sombras danzan antes de tu caída!',
      'Un solo parpadeo y la flor de cerezo cortará tu destino.',
      '¡Mi velocidad silenciará cada uno de tus movimientos!'
    ],
    introAction: 'INTRO_SALUTE'
  },
  {
    id: 'alien',
    name: 'Alien Ko-Al',
    modelType: 'HUMAN' as ModelType,
    color: '#800080', // Purple body
    subColor: '#00f0ff', // Blue head/highlights
    description: 'Alien warrior',
    quoteEs: '¡Tu extinción es lógicamente inevitable!',
    quoteEn: 'Your biological extinction is inevitable!',
    quotesEs: [
      '¡Tu extinción es lógicamente inevitable!',
      'Análisis biológico completo... Eres una especie inferior.',
      '¡Sufrirás el peso aplastante del horizonte de sucesos!'
    ],
    introAction: 'INTRO_TAUNT'
  },
  {
    id: 'mecha',
    name: 'Mecha Gold',
    modelType: 'HUMAN' as ModelType,
    color: '#ffd700', // Gold
    subColor: '#daa520', // Goldenrod
    description: 'Golden Mechanical Fighter',
    quoteEs: '¡Sistemas de combate al 100%. Blanco fijado!',
    quoteEn: 'Combat protocol 100%. Target eliminated!',
    quotesEs: [
      '¡Sistemas de combate al 100%. Blanco fijado!',
      'ERROR 404: Tus probabilidades de supervivencia son nulas.',
      '¡Iniciando secuencia de aniquilación dorada!'
    ],
    introAction: 'INTRO_POWERUP'
  },
  {
    id: 'alternate',
    name: 'Alternate',
    modelType: 'HUMAN' as ModelType,
    color: '#ff0000', // Red skin
    subColor: '#000000', // Black
    description: 'Ogre-like Demon Fighter',
    quoteEs: '¡Devoraré tu alma en la oscuridad!',
    quoteEn: 'I will devour your soul in darkness!',
    quotesEs: [
      '¡Devoraré tu alma en la profunda oscuridad!',
      '¡Siente el tormento de los mil infiernos en tus huesos!',
      '¡Jajaja... Tu dolor es la música de mi victoria!'
    ],
    introAction: 'INTRO_STANCE'
  }
];

export const ENEMY_COLOR = '#ff003c'; 
export const ENEMY_SUB_COLOR = '#330000';