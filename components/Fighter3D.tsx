import * as THREE from 'three';
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, CanvasTexture, RepeatWrapping } from 'three';
import { ActionType, FighterState, GameState } from '../types';
import { useGameStore } from '../store';
import { NpcAura3D } from './NpcAura3D';

const FighterEye = ({ isLeft, scale = 1, irisColor = "#0055ff", isChargingLaser = false, who, skinColor = "#e0ac69", isAlien = false }: { isLeft: boolean, scale?: number, irisColor?: string, isChargingLaser?: boolean, who: 'player' | 'enemy' | 'preview', skinColor?: string, isAlien?: boolean }) => {
  const openEyeRef = useRef<THREE.Group>(null);
  const closedEyeRef = useRef<THREE.Group>(null);

  const lastActionRef = useRef<ActionType | null>(null);
  const lastHitTimeRef = useRef<number>(0);

  useFrame(() => {
    let isClosed = false;
    if (who === 'preview') {
      isClosed = (Date.now() % 3500 < 130);
    } else {
      const state = useGameStore.getState()[who];
      if (state) {
        if (state.action === ActionType.HIT && lastActionRef.current !== ActionType.HIT) {
          lastHitTimeRef.current = Date.now();
        }
        lastActionRef.current = state.action;

        const hitDurationActive = (Date.now() - lastHitTimeRef.current) < 200;
        const isHitAction = state.action === ActionType.HIT || state.action === ActionType.BEING_GRABBED || hitDurationActive;
        const isBlinking = (Date.now() % 3500 < 130);
        isClosed = isHitAction || isBlinking;
      }
    }

    if (openEyeRef.current) openEyeRef.current.visible = !isClosed;
    if (closedEyeRef.current) closedEyeRef.current.visible = isClosed;
  });

  const eyeScale = scale * 0.95;

  return (
    <group position={[0, 0, 0]} rotation={[0, isLeft ? -0.05 : 0.05, 0]}>
      {/* OPEN ANIME EYE (Drawing / Anime Style) */}
      <group ref={openEyeRef}>
        {/* Upper Anime Eyeliner / Lash Line */}
        <mesh position={[0, 0.016 * eyeScale, 0.02 * eyeScale]} rotation={[0, 0, isLeft ? 0.08 : -0.08]} scale={[0.048 * eyeScale, 0.008 * eyeScale, 0.005 * eyeScale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#0f0f14" />
        </mesh>
        
        {/* Wing Tip Eyelash */}
        <mesh position={[(isLeft ? -0.024 : 0.024) * eyeScale, 0.018 * eyeScale, 0.019 * eyeScale]} rotation={[0, 0, isLeft ? -0.4 : 0.4]} scale={[0.015 * eyeScale, 0.006 * eyeScale, 0.004 * eyeScale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#0f0f14" />
        </mesh>

        {/* Sclera - Crisp White Anime Sclera */}
        <mesh position={[0, 0, 0.015 * eyeScale]} scale={[0.038 * eyeScale, 0.028 * eyeScale, 0.005 * eyeScale]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={isAlien ? "#002b36" : "#ffffff"} />
        </mesh>

        {/* Anime Iris - Vibrant Large Almond / Circle */}
        <mesh position={[0, -0.002 * eyeScale, 0.017 * eyeScale]} scale={[0.022 * eyeScale, 0.024 * eyeScale, 0.002 * eyeScale]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color={isChargingLaser || irisColor === '#ff0000' ? '#ff0000' : irisColor} />
        </mesh>

        {/* Anime Pupil - Centered Dark Pupil */}
        <mesh position={[0, -0.002 * eyeScale, 0.019 * eyeScale]} scale={[0.011 * eyeScale, 0.013 * eyeScale, 0.002 * eyeScale]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="#0a0a0f" />
        </mesh>

        {/* Anime Glare Sparkle 1 (Large Top Highlight) */}
        {!isAlien && (
          <mesh position={[(isLeft ? -0.006 : 0.006) * eyeScale, 0.005 * eyeScale, 0.021 * eyeScale]} scale={[0.005 * eyeScale, 0.005 * eyeScale, 0.002 * eyeScale]}>
            <circleGeometry args={[1, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}

        {/* Anime Glare Sparkle 2 (Small Secondary Highlight) */}
        {!isAlien && (
          <mesh position={[(isLeft ? 0.005 : -0.005) * eyeScale, -0.006 * eyeScale, 0.021 * eyeScale]} scale={[0.0025 * eyeScale, 0.0025 * eyeScale, 0.002 * eyeScale]}>
            <circleGeometry args={[1, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}

        {/* Lower Eyeliner Rim */}
        <mesh position={[0, -0.014 * eyeScale, 0.018 * eyeScale]} scale={[0.034 * eyeScale, 0.004 * eyeScale, 0.003 * eyeScale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#1a1a24" />
        </mesh>
      </group>

      {/* CLOSED ANIME EYE (Expressive anime arc line when blinking / hit) */}
      <group ref={closedEyeRef} visible={false}>
        <mesh position={[0, 0, 0.018 * eyeScale]} rotation={[0, 0, isLeft ? 0.05 : -0.05]} scale={[0.046 * eyeScale, 0.007 * eyeScale, 0.004 * eyeScale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#0f0f14" />
        </mesh>
      </group>

      {isChargingLaser && (
        <mesh position={[0, 0, 0.022 * eyeScale]} scale={[0.04 * eyeScale, 0.04 * eyeScale, 0.002 * eyeScale]}>
            <circleGeometry args={[1, 16]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

const FighterMouth = ({ who, scale = 1, isFox = false }: { who: 'player' | 'enemy' | 'preview', scale?: number, isFox?: boolean }) => {
  const calmRef = useRef<THREE.Group>(null);
  const agonyRef = useRef<THREE.Group>(null);

  const lastActionRef = useRef<ActionType | null>(null);
  const lastHitTimeRef = useRef<number>(0);

  useFrame(() => {
    if (who === 'preview') {
      if (calmRef.current) calmRef.current.visible = true;
      if (agonyRef.current) agonyRef.current.visible = false;
      return;
    }
    const state = useGameStore.getState()[who];
    if (!state) return;

    if (state.action === ActionType.HIT && lastActionRef.current !== ActionType.HIT) {
      lastHitTimeRef.current = Date.now();
    }
    lastActionRef.current = state.action;

    const hitDurationActive = (Date.now() - lastHitTimeRef.current) < 1000;
    const isHitAction = state.action === ActionType.HIT || state.action === ActionType.KNOCKDOWN || state.action === ActionType.STUNNED || state.action === ActionType.THROWN || state.action === ActionType.BEING_GRABBED || hitDurationActive;

    if (calmRef.current) calmRef.current.visible = !isHitAction;
    if (agonyRef.current) agonyRef.current.visible = isHitAction;
  });

  const positionY = isFox ? 0.035 : 0.045;
  const positionZ = isFox ? 0.175 : 0.155;

  return (
    <group position={[0, positionY, positionZ]}>
      {/* Calm / determined mouth line */}
      <group ref={calmRef}>
        <mesh scale={[0.035 * scale, 0.007 * scale, 0.01 * scale]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#330a0d" roughness={0.9} />
        </mesh>
      </group>
      {/* Pained / screaming mouth */}
      <group ref={agonyRef} visible={false}>
        {/* Outer mouth cavity */}
        <mesh scale={[0.022 * scale, 0.04 * scale, 0.012 * scale]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#2d0505" roughness={0.9} />
        </mesh>
        {/* Tongue / deep-red inside */}
        <mesh position={[0, -0.01 * scale, 0.003 * scale]} scale={[0.015 * scale, 0.008 * scale, 0.008 * scale]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#ff4d4d" />
        </mesh>
      </group>
    </group>
  );
};

const FighterFist = ({ isLeft, color, map, roughness = 0.6, metalness = 0, action }: { isLeft: boolean, color: string, map?: any, roughness?: number, metalness?: number, action?: ActionType }) => {
  const sideScale = isLeft ? -1 : 1;

  return (
    <group position={[0, -0.26, 0]} rotation={[0, 0, 0]} scale={[1.65, 1.65, 1.65]}>
      {/* Main Palm / Glove Body - beautiful rounded sphere */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={color} map={map} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Folded fingers knuckle bar - a clean horizontal cylinder representing clenched fingers */}
      <mesh position={[0, -0.02, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.024, 0.06, 8, 8]} />
        <meshStandardMaterial color={color} map={map} roughness={roughness} metalness={metalness} />
      </mesh>

      {/* Thumb wrapped across the front of the fist */}
      <mesh position={[-0.03 * sideScale, -0.01, 0.035]} rotation={[0.4, sideScale * 0.4, -sideScale * 0.5]}>
        <capsuleGeometry args={[0.016, 0.04, 4, 8]} />
        <meshStandardMaterial color={color} map={map} roughness={roughness} metalness={metalness} />
      </mesh>
    </group>
  );
};

// --- James Segmented Hair Helper ---

// --- Detailed Brown Demon Horn Helper ---

// --- Detailed Realistic Demon Wings (Flapping Slowly) ---
const DemonWings = () => {
  const lWingRef = useRef<Group>(null);
  const rWingRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const flapAngle = Math.sin(t * 1.5) * 0.25;
    
    if (lWingRef.current) {
      lWingRef.current.rotation.y = -Math.PI / 4 - flapAngle;
      lWingRef.current.rotation.z = Math.sin(t * 1.5) * 0.12;
    }
    if (rWingRef.current) {
      rWingRef.current.rotation.y = Math.PI / 4 + flapAngle;
      rWingRef.current.rotation.z = -Math.sin(t * 1.5) * 0.12;
    }
  });

  return (
    <group position={[0, 0.15, -0.15]}>
      {/* Left Wing */}
      <group ref={lWingRef} position={[-0.08, 0, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <capsuleGeometry args={[0.025, 0.28, 4, 8]} />
          <meshStandardMaterial color="#3b2314" roughness={0.8} />
        </mesh>
        <group position={[-0.2, 0.2, 0]} rotation={[0, 0, Math.PI / 2.5]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.018, 0.44, 4, 8]} />
            <meshStandardMaterial color="#3b2314" roughness={0.8} />
          </mesh>
          <group position={[0, -0.4, 0]} rotation={[0, 0, -0.35]}>
             <mesh position={[0, -0.2, 0]}>
                <capsuleGeometry args={[0.012, 0.4, 4, 8]} />
                <meshStandardMaterial color="#422816" roughness={0.85} />
             </mesh>
          </group>
          <group position={[0, -0.4, 0]} rotation={[0, 0, -0.75]}>
             <mesh position={[0, -0.16, 0]}>
                <capsuleGeometry args={[0.012, 0.32, 4, 8]} />
                <meshStandardMaterial color="#422816" roughness={0.85} />
             </mesh>
          </group>
          <group position={[0, -0.4, 0]} rotation={[0, 0, -1.15]}>
             <mesh position={[0, -0.12, 0]}>
                <capsuleGeometry args={[0.012, 0.24, 4, 8]} />
                <meshStandardMaterial color="#422816" roughness={0.85} />
             </mesh>
          </group>
          <group position={[0, -0.2, -0.01]} rotation={[0, 0, -0.6]} scale={[0.22, 0.35, 0.005]}>
             <mesh>
                 <boxGeometry args={[1, 1, 1]} />
                 <meshStandardMaterial color="#420d09" roughness={0.9} transparent opacity={0.9} />
             </mesh>
          </group>
          <group position={[-0.1, -0.3, -0.01]} rotation={[0, 0, -1.0]} scale={[0.18, 0.3, 0.005]}>
             <mesh>
                 <boxGeometry args={[1, 1, 1]} />
                 <meshStandardMaterial color="#420d09" roughness={0.9} transparent opacity={0.9} />
             </mesh>
          </group>
        </group>
      </group>

      {/* Right Wing */}
      <group ref={rWingRef} position={[0.08, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <capsuleGeometry args={[0.025, 0.28, 4, 8]} />
          <meshStandardMaterial color="#3b2314" roughness={0.8} />
        </mesh>
        <group position={[0.2, 0.2, 0]} rotation={[0, 0, -Math.PI / 2.5]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.018, 0.44, 4, 8]} />
            <meshStandardMaterial color="#3b2314" roughness={0.8} />
          </mesh>
          <group position={[0, -0.4, 0]} rotation={[0, 0, 0.35]}>
             <mesh position={[0, -0.2, 0]}>
                <capsuleGeometry args={[0.012, 0.4, 4, 8]} />
                <meshStandardMaterial color="#422816" roughness={0.85} />
             </mesh>
          </group>
          <group position={[0, -0.4, 0]} rotation={[0, 0, 0.75]}>
             <mesh position={[0, -0.16, 0]}>
                <capsuleGeometry args={[0.012, 0.32, 4, 8]} />
                <meshStandardMaterial color="#422816" roughness={0.85} />
             </mesh>
          </group>
          <group position={[0, -0.4, 0]} rotation={[0, 0, 1.15]}>
             <mesh position={[0, -0.12, 0]}>
                <capsuleGeometry args={[0.012, 0.24, 4, 8]} />
                <meshStandardMaterial color="#422816" roughness={0.85} />
             </mesh>
          </group>
          <group position={[0, -0.2, -0.01]} rotation={[0, 0, 0.6]} scale={[0.22, 0.35, 0.005]}>
             <mesh>
                 <boxGeometry args={[1, 1, 1]} />
                 <meshStandardMaterial color="#420d09" roughness={0.9} transparent opacity={0.9} />
             </mesh>
          </group>
          <group position={[0.1, -0.3, -0.01]} rotation={[0, 0, 1.0]} scale={[0.18, 0.3, 0.005]}>
             <mesh>
                 <boxGeometry args={[1, 1, 1]} />
                 <meshStandardMaterial color="#420d09" roughness={0.9} transparent opacity={0.9} />
             </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

const texturesCache = new Map<string, CanvasTexture>();

export function getProceduralTexture(type: string, color: string, subColor = "#000000"): CanvasTexture {
  const cacheKey = `${type}_${color}_${subColor}`;
  if (texturesCache.has(cacheKey)) {
    return texturesCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Fill base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 64, 64);

  if (type === 'MECHA') {
    // Carbon fiber / Metal plating with rivets
    ctx.strokeStyle = color === '#ffd700' ? '#b8860b' : '#111111'; // Golden borders for mecha gold
    ctx.lineWidth = 1.5;
    // Draw some plates
    ctx.strokeRect(2, 2, 124, 124);
    ctx.beginPath();
    ctx.moveTo(64, 2);
    ctx.lineTo(64, 126);
    ctx.moveTo(2, 64);
    ctx.lineTo(126, 64);
    ctx.stroke();

    // Rivet dots
    ctx.fillStyle = color === '#ffd700' ? '#8b4513' : '#444444';
    const rivets = [10, 54, 74, 118];
    rivets.forEach(x => {
      rivets.forEach(y => {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color === '#ffd700' ? '#ffffff' : '#444444';
        ctx.beginPath();
        ctx.arc(x - 0.5, y - 0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color === '#ffd700' ? '#8b4513' : '#444444';
      });
    });
  } else if (type === 'METAL') {
    // Brushed metal
    for (let i = 0; i < 128; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(128, i);
        ctx.stroke();
    }
  } else if (type === 'CARBON') {
    // Hexagonal carbon fiber pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 128; i += 8) {
        for (let j = 0; j < 128; j += 8) {
            ctx.strokeRect(i, j, 6, 6);
        }
    }
  } else if (type === 'MARBLE') {
    // Marble veins
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 128, 0);
        ctx.bezierCurveTo(Math.random() * 128, 40, Math.random() * 128, 80, Math.random() * 128, 128);
        ctx.stroke();
    }
  } else if (type === 'ICE') {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 128, Math.random() * 128);
        ctx.lineTo(Math.random() * 128, Math.random() * 128);
        ctx.stroke();
    }
  } else if (type === 'BRICK') {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 128; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(128, y);
        ctx.stroke();
        const offset = (y / 16) % 2 === 0 ? 0 : 16;
        for (let x = offset; x < 128; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 16);
            ctx.stroke();
        }
    }
  } else if (type === 'LEATHER') {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < 300; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 128, Math.random() * 128, Math.random() * 3, 0, Math.PI * 2);
        ctx.stroke();
    }
  } else if (type === 'FABRIC') {
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 128; i += 2) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
    }
  } else if (type === 'ALIEN') {
    // Cyber circuitry / Bio-scales
    ctx.strokeStyle = '#00f0ff'; // glowing cyan lines
    ctx.lineWidth = 1.0;

    // Draw some cool circuitry tracks
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.lineTo(64, 16);
    ctx.lineTo(80, 32);
    ctx.lineTo(80, 80);
    ctx.lineTo(112, 112);

    ctx.moveTo(112, 16);
    ctx.lineTo(112, 48);
    ctx.lineTo(96, 64);
    ctx.lineTo(48, 64);
    ctx.lineTo(32, 80);
    ctx.stroke();

    // Node circles
    ctx.fillStyle = '#00f0ff';
    [[64, 16], [80, 80], [96, 64], [32, 80]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'SAKURA') {
    // Cherry blossom floral petal pattern
    ctx.fillStyle = '#ffb7c5'; // light blossom pink
    // Draw some cute petals
    const drawPetal = (cx: number, cy: number, rotation: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-7, -10, -7, -20, 0, -25);
      ctx.bezierCurveTo(7, -20, 7, -10, 0, 0);
      ctx.fill();
      // Detail lines
      ctx.strokeStyle = '#ff1493';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -17);
      ctx.stroke();
      ctx.restore();
    };
    drawPetal(32, 32, 0.5);
    drawPetal(96, 35, -0.8);
    drawPetal(64, 96, 1.2);
    drawPetal(20, 90, -2.1);
  } else if (type === 'FUR') {
    // Fluffy fur texture lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 20; i++) {
      const sx = Math.random() * 128;
      const sy = Math.random() * 128;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 8, sy + 8 + Math.random() * 5);
      ctx.stroke();
    }
  } else if (type === 'WOOD') {
    // Wood grain
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 8 + Math.random() * 2);
      ctx.bezierCurveTo(40, i * 8 + Math.random() * 5, 80, i * 8 - Math.random() * 5, 128, i * 8 + Math.random() * 2);
      ctx.stroke();
    }
  } else if (type === 'STONE') {
    // Stone bricks/cracks
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
       ctx.strokeRect(Math.random() * 128, Math.random() * 128, 20 + Math.random() * 20, 15 + Math.random() * 15);
    }
  } else if (type === 'LAVA') {
    // Magma cracks
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
       ctx.beginPath();
       ctx.moveTo(Math.random() * 128, Math.random() * 128);
       ctx.lineTo(Math.random() * 128, Math.random() * 128);
       ctx.lineTo(Math.random() * 128, Math.random() * 128);
       ctx.stroke();
    }
    // bright spots
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 128, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'CLASSIC') {
    // Classic fighting game Gi fabric texture (subtle weave)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    for(let i=0; i<128; i+=4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(128, i);
      ctx.stroke();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  texturesCache.set(cacheKey, texture);
  return texture;
}

interface Fighter3DProps {
  who: 'player' | 'enemy' | 'preview';
  previewState?: {
    name: string;
    modelType: string;
    color: string;
    subColor: string;
    action: ActionType;
    direction: number;
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
  };
}

export const Fighter3D: React.FC<Fighter3DProps> = ({ who, previewState }) => {
  const groupRef = useRef<Group>(null);

  // Slide ghost trail refs
  const ghost1Ref = useRef<Group>(null);
  const ghost2Ref = useRef<Group>(null);
  const ghost3Ref = useRef<Group>(null);

  const ghostPositionsRef = useRef<{ x: number; y: number; rotY: number; active: boolean; alpha: number; action?: ActionType; direction?: number }[]>([
    { x: 0, y: 0, rotY: 0, active: false, alpha: 0 },
    { x: 0, y: 0, rotY: 0, active: false, alpha: 0 },
    { x: 0, y: 0, rotY: 0, active: false, alpha: 0 },
  ]);
  const ghostTimerRef = useRef<number>(0);

  // --- Skeleton Hierarchy Refs ---
  const hipsRef = useRef<Group>(null);
  const tail0Ref = useRef<Group>(null);
  const tail1Ref = useRef<Group>(null);
  const tail2Ref = useRef<Group>(null);
  const tail3Ref = useRef<Group>(null);
  const tail4Ref = useRef<Group>(null);
  const spineRef = useRef<Group>(null);
  const chestRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const rEarRef = useRef<Group>(null);
  const lEarRef = useRef<Group>(null);

  // Arms
  const rShoulderRef = useRef<Group>(null);
  const rElbowRef = useRef<Group>(null);
  const lShoulderRef = useRef<Group>(null);
  const lElbowRef = useRef<Group>(null);

  // Legs
  const rHipJointRef = useRef<Group>(null);
  const rKneeRef = useRef<Group>(null);
  const lHipJointRef = useRef<Group>(null);
  const lKneeRef = useRef<Group>(null);
  const hairGroupRef = useRef<Group>(null);
  const breastsGroupRef = useRef<Group>(null);
  const glutesGroupRef = useRef<Group>(null);

  // Deforming joint union refs
  const rElbowDeformRef = useRef<Group>(null);
  const lElbowDeformRef = useRef<Group>(null);
  const rKneeDeformRef = useRef<Group>(null);
  const lKneeDeformRef = useRef<Group>(null);
  const rShoulderDeformRef = useRef<Group>(null);
  const lShoulderDeformRef = useRef<Group>(null);
  const rHipDeformRef = useRef<Group>(null);
  const lHipDeformRef = useRef<Group>(null);

  // --- Sakura Segmented Female Hair Refs ---
  const sakuraHairLeftRefs = useRef<(Group | null)[]>([]);
  const sakuraHairRightRefs = useRef<(Group | null)[]>([]);
  const sakuraHairJointsRef = useRef(
      Array.from({ length: 12 }, () => ({ rotX: 0, rotZ: 0, velX: 0, velZ: 0 }))
  );

  // --- Frost Segmented Blue Hair Refs ---
  const frostHairLeftRefs = useRef<(Group | null)[]>([]);
  const frostHairRightRefs = useRef<(Group | null)[]>([]);
  const frostHairCenterRefs = useRef<(Group | null)[]>([]);
  const frostHairJointsRef = useRef(
      Array.from({ length: 10 }, () => ({ rotX: 0, rotZ: 0, velX: 0, velZ: 0 }))
  );

  const renderSegmentedHair = (index: number, maxSegments: number, isLeft: boolean, color: string): React.ReactNode => {
      if (index >= maxSegments) return null;
      const size = 0.058 * (1 - index / maxSegments * 0.72); // Slightly thicker tapering size
      return (
          <group
              ref={el => {
                  if (isLeft) sakuraHairLeftRefs.current[index] = el;
                  else sakuraHairRightRefs.current[index] = el;
              }}
              position={[0, -0.065, -0.015]}
          >
              <mesh>
                  <sphereGeometry args={[size, 10, 10]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} roughness={0.2} metalness={0.1} />
              </mesh>
              {/* Offset secondary and tertiary spheres for extra luxurious ribbon thickness */}
              <mesh position={[-size * 0.35, 0, -size * 0.15]} scale={[0.85, 0.85, 0.85]}>
                  <sphereGeometry args={[size, 8, 8]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.25} />
              </mesh>
              <mesh position={[size * 0.35, 0, -size * 0.15]} scale={[0.85, 0.85, 0.85]}>
                  <sphereGeometry args={[size, 8, 8]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.25} />
              </mesh>
              {renderSegmentedHair(index + 1, maxSegments, isLeft, color)}
          </group>
      );
  };

  const renderFrostHairStrand = (index: number, maxSegments: number, type: 'left' | 'right' | 'center', color: string): React.ReactNode => {
      if (index >= maxSegments) return null;
      const size = 0.048 * (1 - index / maxSegments * 0.7); // Tapering size
      return (
          <group
              ref={el => {
                  if (type === 'left') frostHairLeftRefs.current[index] = el;
                  else if (type === 'right') frostHairRightRefs.current[index] = el;
                  else frostHairCenterRefs.current[index] = el;
              }}
              position={[0, -0.06, -0.012]}
          >
              <mesh>
                  <sphereGeometry args={[size, 10, 10]} />
                  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.1} metalness={0.2} />
              </mesh>
              {renderFrostHairStrand(index + 1, maxSegments, type, color)}
          </group>
      );
  };

  // Subscribe to the low-frequency properties of the state to avoid re-renders on position/Y changes
  const name = useGameStore(s => {
    const target = who === 'player' ? s.player : (who === 'enemy' ? s.enemy : s.player);
    return target.name;
  });
  const modelType = useGameStore(s => {
    const target = who === 'player' ? s.player : (who === 'enemy' ? s.enemy : s.player);
    return target.modelType;
  });
  const color = useGameStore(s => {
    const target = who === 'player' ? s.player : (who === 'enemy' ? s.enemy : s.player);
    return target.color;
  });
  const subColor = useGameStore(s => {
    const target = who === 'player' ? s.player : (who === 'enemy' ? s.enemy : s.player);
    return target.subColor;
  });
  const action = useGameStore(s => {
    const target = who === 'player' ? s.player : (who === 'enemy' ? s.enemy : s.player);
    return target.action;
  });

  const texturesEnabled = useGameStore(s => s.texturesEnabled);

  const state = who === 'preview' && previewState ? previewState : { name, modelType, color, subColor, action, direction: 1, hp: 100, maxHp: 100, energy: 0, maxEnergy: 100 };

  // Animation state
  const animTime = useRef(0);

  // Alternating JAB and animation state resets
  const lastActionRef = useRef<ActionType | null>(null);
  const lastActionStartTimeRef = useRef<number>(0);
  const useRightArmForJabRef = useRef(false);
  const actionStartTimeRef = useRef(Date.now());

  const isAttacking = state.action === ActionType.JAB || state.action === ActionType.CROSS || state.action === ActionType.HOOK || state.action === ActionType.KICK || state.action === ActionType.SPIN_KICK || state.action === ActionType.LOW_KICK || state.action === ActionType.CROUCH_JAB;
  const isHit = state.action === ActionType.HIT || state.action === ActionType.KNOCKDOWN;

  useEffect(() => {
    if (state.action !== lastActionRef.current) {
      animTime.current = 0; // Reset animation time for smooth start
      actionStartTimeRef.current = Date.now();
      if (state.action === ActionType.JAB) {
        useRightArmForJabRef.current = !useRightArmForJabRef.current;
      }
      if (isAttacking || isHit) {
          breastsPhysicsRef.current.velY += (Math.random() > 0.5 ? 1 : -1) * 0.2;
          glutesPhysicsRef.current.velY += (Math.random() > 0.5 ? 1 : -1) * 0.15;
          if (hairPhysicsRef.current) {
              hairPhysicsRef.current.velX += (Math.random() > 0.5 ? 1 : -1) * 2.0;
          }
      }
    }
    lastActionRef.current = state.action;
  }, [state.action, isAttacking, isHit]);

  // --- Physics & Inertia state ---
  const lastXRef = useRef(who === 'player' ? -1.5 : 1.5);
  const lastYRef = useRef(0);

  const tailJointsRef = useRef([
    { rotX: 0.8, rotY: 0, velX: 0, velY: 0 },
    { rotX: 0.6, rotY: 0, velX: 0, velY: 0 },
    { rotX: 0.4, rotY: 0, velX: 0, velY: 0 },
    { rotX: 0.2, rotY: 0, velX: 0, velY: 0 },
    { rotX: 0.1, rotY: 0, velX: 0, velY: 0 },
  ]);

  const earsPhysicsRef = useRef({
    rRotZ: 0,
    lRotZ: 0,
    rRotX: 0,
    lRotX: 0,
    rVelZ: 0,
    lVelZ: 0,
    rVelX: 0,
    lVelX: 0,
  });

  const hairPhysicsRef = useRef({ rotX: 0, velX: 0 });
  const breastsPhysicsRef = useRef({ y: 0, velY: 0 });
  const glutesPhysicsRef = useRef({ y: 0, velY: 0 });

  const isFox = state.modelType === 'FOX' || state.name.toLowerCase().includes("fox");
  const isOsbamo = state.name === "Osbamo";
  const isFemale = state.name === "Ava";
  const isAlien = state.name === "Alien Ko-Al" || state.name.toLowerCase().includes("alien");
  const isAlternate = state.name.toLowerCase().includes("alternate");
  const isJames = state.name === "James" || state.name === "James";
  const isMechaGold = state.name === "Mecha Gold";

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (who === 'preview') {
      if (!groupRef.current || !hipsRef.current) return;
      groupRef.current.position.set(0, -0.65, 0); // slightly lowered to fit nicely in the frame
      groupRef.current.rotation.y += delta * 1.0; // Rotate slowly
      
      // Let's run a slow breathing idle animation on the preview character
      animTime.current += delta;
      const t = animTime.current;
      
      // Idle animation rotations: chest breathing, hips sway
      const breathing = Math.sin(t * 2.0) * 0.04;
      
      if (hipsRef.current) {
        hipsRef.current.position.y = 0.85 + breathing * 0.2;
      }
      if (spineRef.current) {
        spineRef.current.rotation.x = breathing;
      }
      if (chestRef.current) {
        chestRef.current.rotation.x = -breathing * 0.5;
      }
      
      // Standard arm posture for preview characters so they look amazing
      if (rShoulderRef.current) rShoulderRef.current.rotation.set(-0.3, 0, 0.2);
      if (lShoulderRef.current) lShoulderRef.current.rotation.set(-0.3, 0, -0.2);
      if (rElbowRef.current) rElbowRef.current.rotation.set(-0.5, 0, 0);
      if (lElbowRef.current) lElbowRef.current.rotation.set(-0.5, 0, 0);
      
      return; // Skip standard fighting game physics lerps for preview characters!
    }

    // Fetch freshest properties to avoid React state-sync lag
    const latestState: FighterState = who === 'player' ? useGameStore.getState().player : useGameStore.getState().enemy;
    const currentAction = latestState.action;
    const currentActionStartTime = latestState.actionStartTime || 0;

    // Detect action changes or re-triggered actions in real-time to guarantee 0ms animation reset
    if (currentAction !== lastActionRef.current || (currentActionStartTime > 0 && currentActionStartTime !== lastActionStartTimeRef.current)) {
        animTime.current = 0;
        actionStartTimeRef.current = currentActionStartTime || Date.now();
        lastActionStartTimeRef.current = currentActionStartTime;
        if (currentAction === ActionType.JAB || currentAction === ActionType.CROUCH_JAB) {
            useRightArmForJabRef.current = !useRightArmForJabRef.current;
        }
        lastActionRef.current = currentAction;
    }

    // --- Global Position & Orientation ---
    if (!groupRef.current || !hipsRef.current) return;
    const moveLerp = 0.2;
    // Horizontal lerp
    groupRef.current.position.x += (latestState.position - groupRef.current.position.x) * moveLerp;

    // Vertical position direct assignment for crisp physics
    groupRef.current.position.y = latestState.y;

    // Facing direction
    const gState = useGameStore.getState().gameState;
    const cinematicStage = useGameStore.getState().cinematicStage;

    let targetRotY = latestState.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
    if (gState === GameState.CINEMATIC_INTRO) {
      if (who === 'player' && cinematicStage === 'p1') {
        targetRotY = 0.12; // Face forward towards camera
      } else if (who === 'enemy' && cinematicStage === 'p2') {
        targetRotY = -0.12; // Face forward towards camera
      }
    }
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.25;

    // Scale logic
    const baseScale = isAlternate ? 1.25 : 1.0;
    groupRef.current.scale.setScalar(baseScale);

    // --- Dynamic Physics ---
    const deltaY = latestState.y - lastYRef.current;
    const jiggleSpeedY = delta > 0 ? deltaY / delta : 0;
    const deltaX = latestState.position - lastXRef.current;
    const jiggleSpeedX = delta > 0 ? deltaX / delta : 0;

    if (hairGroupRef.current) {
        hairPhysicsRef.current.velX -= jiggleSpeedY * 0.15 + hairPhysicsRef.current.rotX * 0.25;
        hairPhysicsRef.current.velX *= 0.85; // damping
        hairPhysicsRef.current.rotX += hairPhysicsRef.current.velX * delta * 5;

        const idleWave = Math.sin(Date.now() * 0.002) * 0.03;
        const drag = jiggleSpeedX * latestState.direction * 0.15;
        const actionSpeed = (currentAction === ActionType.RUN_FORWARD ? 2 : (currentAction === ActionType.MOVE_FORWARD ? 1 : (currentAction === ActionType.JAB || currentAction === ActionType.CROSS || currentAction === ActionType.KICK ? 3 : 0.2)));
        const actionWobble = Math.sin(Date.now() * 0.015) * 0.05 * actionSpeed;
        hairGroupRef.current.rotation.x = hairPhysicsRef.current.rotX + idleWave - drag + actionWobble;
    }

    if (isFemale || isAlien) {
        if (isFemale) {
            if (breastsGroupRef.current) {
                breastsPhysicsRef.current.y = 0;
                breastsPhysicsRef.current.velY = 0;
                breastsGroupRef.current.position.y = 0.12;
            }
            if (glutesGroupRef.current) {
                glutesPhysicsRef.current.y = 0;
                glutesPhysicsRef.current.velY = 0;
                glutesGroupRef.current.position.y = -0.015;
            }
        }

        // Dynamic Segmented Hair Physics for Ava
        if (isFemale && sakuraHairLeftRefs.current.length > 0) {
            const hairJoints = sakuraHairJointsRef.current;
            const speedX = jiggleSpeedX;
            const speedY = jiggleSpeedY;
            const tVal = Date.now() * 0.005;

            hairJoints.forEach((joint, i) => {
                // Wave travels down the segment chain
                const targetX = 0.2 + Math.sin(tVal - i * 0.4) * 0.08 + speedY * 0.05;
                const targetZ = Math.sin(tVal * 0.8 + i * 0.3) * 0.06 + speedX * latestState.direction * 0.08;

                const springK = 0.18;
                const damping = 0.82;

                joint.velX = (joint.velX + (targetX - joint.rotX) * springK) * damping;
                joint.rotX += joint.velX;

                joint.velZ = (joint.velZ + (targetZ - joint.rotZ) * springK) * damping;
                joint.rotZ += joint.velZ;

                const leftGroup = sakuraHairLeftRefs.current[i];
                const rightGroup = sakuraHairRightRefs.current[i];

                if (leftGroup) {
                    leftGroup.rotation.x = joint.rotX;
                    leftGroup.rotation.z = joint.rotZ + 0.06;
                }
                if (rightGroup) {
                    rightGroup.rotation.x = joint.rotX;
                    rightGroup.rotation.z = -joint.rotZ - 0.06;
                }
            });
        }
    }

    if (isFox) {
        // Dynamic Segmented Hair Physics for Osbamo
        if (frostHairLeftRefs.current.length > 0) {
            const hairJoints = frostHairJointsRef.current;
            const speedX = jiggleSpeedX;
            const speedY = jiggleSpeedY;
            const tVal = Date.now() * 0.005;

            hairJoints.forEach((joint, i) => {
                // Wave travels down the segment chain
                const targetX = 0.18 + Math.sin(tVal - i * 0.35) * 0.07 + speedY * 0.04;
                const targetZ = Math.sin(tVal * 0.75 + i * 0.28) * 0.06 + speedX * latestState.direction * 0.07;

                const springK = 0.2;
                const damping = 0.8;

                joint.velX = (joint.velX + (targetX - joint.rotX) * springK) * damping;
                joint.rotX += joint.velX;

                joint.velZ = (joint.velZ + (targetZ - joint.rotZ) * springK) * damping;
                joint.rotZ += joint.velZ;

                const leftGroup = frostHairLeftRefs.current[i];
                const rightGroup = frostHairRightRefs.current[i];
                const centerGroup = frostHairCenterRefs.current[i];

                if (leftGroup) {
                    leftGroup.rotation.x = joint.rotX;
                    leftGroup.rotation.z = joint.rotZ + 0.08;
                }
                if (rightGroup) {
                    rightGroup.rotation.x = joint.rotX;
                    rightGroup.rotation.z = -joint.rotZ - 0.08;
                }
                if (centerGroup) {
                    centerGroup.rotation.x = joint.rotX * 1.1;
                    centerGroup.rotation.z = joint.rotZ;
                }
            });
        }
    }

    // Update position memory for next frame physics
    lastXRef.current = latestState.position;
    lastYRef.current = latestState.y;

    // --- Animation Logic ---
    animTime.current += delta * 25;
    const t = animTime.current;

    // Default Poses (Initial T-Pose values)
    let hipY = 0.96;
    let hipRot = [0, 0, 0];
    let tailRot = [-0.5, 0, 0];
    let spineRot = [0, 0, 0];
    let chestRot = [0, 0, 0];

    // Head base rotation
    let baseHeadRotX = 0;
    let baseHeadRotY = 0;

    let rArmRot = [0, 0, 0.2];
    let rForeRot = [0.1, 0, 0];
    let lArmRot = [0, 0, -0.2];
    let lForeRot = [0.1, 0, 0];

    let rLegRot = [-0.3, 0, 0.35];
    let rShinRot = [0.5, 0, 0];
    let lLegRot = [0.2, 0, -0.35];
    let lShinRot = [0.2, 0, 0];

    // Idle Tail Animation
    if (isFox) {
        tailRot[1] = Math.sin(t * 0.3) * 0.2;
        tailRot[0] = -0.6 + Math.cos(t * 0.2) * 0.1;
    }

    switch (currentAction) {
      case ActionType.IDLE:
        hipY = 0.96 - Math.sin(t * 0.2) * 0.015;
        spineRot[0] = 0.2;
        rArmRot = [-0.6, 0.1, 0.3];
        rForeRot = [-2.0, 0, 0];
        lArmRot = [-0.7, 0.2, -0.3];
        lForeRot = [-2.2, 0, 0];

        rLegRot = [-0.3, 0, 0.35];
        rShinRot = [0.5, 0, 0];
        lLegRot = [0.2, 0, -0.35];
        lShinRot = [0.2, 0, 0];
        spineRot[2] = Math.sin(t * 0.2) * 0.02;
        break;

      case ActionType.MOVE_FORWARD: {
        const wt = t * 0.45; // Slower walking cycle for heavy, deliberate combat pacing
        hipY = 0.93 - Math.cos(wt * 2) * 0.025;
        spineRot[0] = 0.25; // Alert combat stance lean forward

        // Balanced arms swinging in combat guard
        rArmRot = [-0.6 - Math.sin(wt) * 0.35, 0.1, 0.22];
        rForeRot = [-1.8, 0, 0];
        lArmRot = [-0.6 + Math.sin(wt) * 0.35, 0.1, -0.22];
        lForeRot = [-1.8, 0, 0];

        // Fluid walking strides with clean, athletic alignment (narrow Z-axis splay)
        rLegRot = [Math.sin(wt) * 0.45, 0, 0.04];
        rShinRot = [0.45 - Math.sin(wt) * 0.35, 0, 0];
        lLegRot = [-Math.sin(wt) * 0.45, 0, -0.04];
        lShinRot = [0.45 + Math.sin(wt) * 0.35, 0, 0];

        if (isFox) tailRot[0] = -0.4;
        break;
      }

      case ActionType.SLIDE:
        // Low-profile sliding dash with arms up in guard
        hipY = 0.65; // Lower hips
        spineRot[0] = 0.45; // Lean forward

        // Keeping guard up
        rArmRot = [-1.1, 0.4, 0.4];
        rForeRot = [-2.4, 0, 0];
        lArmRot = [-1.1, -0.4, -0.4];
        lForeRot = [-2.4, 0, 0];

        // Sliding legs stance
        rLegRot = [-0.9, 0, 0.3];
        rShinRot = [1.4, 0, 0];
        lLegRot = [0.8, 0, -0.3];
        lShinRot = [0.8, 0, 0];

        if(isFox) tailRot = [0.4, 0, 0]; // Tail trails low/down behind
        break;

      case ActionType.RUN_FORWARD: {
        const rt = t * 15.0; // Dynamic energetic running cycle frequency
        const rSwing = Math.sin(rt);
        hipY = 0.82 - Math.abs(Math.sin(rt)) * 0.06; // Rhythmic vertical bobbing

        spineRot[0] = 0.45; // Athletic forward lean
        chestRot[1] = rSwing * 0.45; // Dynamic chest/shoulder twist opposite to hip swing
        hipRot[2] = -rSwing * 0.12; // Natural hip sway

        // Pumping arms bent at ~90 degrees swinging vigorously in opposite sync with legs
        rArmRot = [-0.6 - rSwing * 1.3, 0.1, 0.15];
        rForeRot = [-1.6, 0, 0];
        lArmRot = [-0.6 + rSwing * 1.3, -0.1, -0.15];
        lForeRot = [-1.6, 0, 0];

        // Running strides: high knees forward and folding legs backward
        rLegRot = [rSwing * 1.0 + 0.1, 0, 0.05];
        rShinRot = [rSwing > 0 ? 0.4 : 1.4 - rSwing * 0.8, 0, 0];
        lLegRot = [-rSwing * 1.0 + 0.1, 0, -0.05];
        lShinRot = [rSwing < 0 ? 0.4 : 1.4 + rSwing * 0.8, 0, 0];

        if (isFox) tailRot = [-0.2, Math.sin(t * 3) * 0.3, 0];
      }
      break;

      case ActionType.MOVE_BACKWARD: {
         const wt = t * 0.45; // Match walking forward pacing
         hipY = 0.94 - Math.cos(wt) * 0.02;
         spineRot[0] = 0.16; // Balanced lean

         // Smooth defensive arm guard swings
         rArmRot = [-0.6 + Math.sin(wt) * 0.22, 0.1, 0.22];
         rForeRot = [-1.9, 0, 0];
         lArmRot = [-0.6 - Math.sin(wt) * 0.22, 0.1, -0.22];
         lForeRot = [-1.9, 0, 0];

         // Flowing leg steps back out of phase (narrow splay)
         rLegRot = [-Math.sin(wt) * 0.4, 0, 0.04];
         rShinRot = [0.4 + Math.sin(wt) * 0.28, 0, 0];
         lLegRot = [Math.sin(wt) * 0.4, 0, -0.04];
         lShinRot = [0.4 - Math.sin(wt) * 0.28, 0, 0];
      }
      break;

      case ActionType.CROUCH:
      case ActionType.CROUCH_JAB:
         hipY = 0.55;
         spineRot[0] = 0.6;
         rLegRot = [-0.8, 0, 0.4];
         rShinRot = [1.5, 0, 0];
         lLegRot = [0.5, 0, -0.4];
         lShinRot = [1.5, 0, 0];

         if (currentAction === ActionType.CROUCH_JAB) {
             const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
             const progress = Math.min(1.0, elapsedSeconds / 0.18); // 180ms duration matching MOVES.CROUCH_JAB.total
             const punchExt = Math.sin(progress * Math.PI);
             rArmRot = [-1.7 - punchExt * 0.2, 0, 0.2]; // Thrust punch forward low
             rForeRot = [0.1 + punchExt * 2.0, 0, 0];
         } else {
             rArmRot = [-0.8, 0, 0.4];
             rForeRot = [-2.2, 0, 0];
         }
         lArmRot = [-0.8, 0, -0.4];
         lForeRot = [-2.2, 0, 0];
         break;

      case ActionType.LOW_KICK: {
         const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
         const progress = Math.min(1.0, elapsedSeconds / 0.20); // 200ms duration matching MOVES.LOW_KICK.total
         if (progress < 0.35) {
             const p = progress / 0.35;
             hipY = 0.85 - p * 0.15;
             spineRot[0] = -0.2 * p;
             spineRot[1] = 0.4 * p;
             rLegRot = [-0.4 * p, 0.2, 0.4 * p];
             rShinRot = [0.1, 0, 0];
             lLegRot = [0.4 * p, 0, -0.1];
             lShinRot = [0.8 * p, 0, 0];
         } else if (progress < 0.75) {
             const p = (progress - 0.35) / 0.40;
             hipY = 0.7;
             spineRot[0] = -0.4;
             spineRot[1] = 0.8;
             rLegRot = [-0.8, 0.5, 0.8];
             rShinRot = [0.1, 0, 0];
             lLegRot = [0.8 + p * 0.4, 0, -0.3];
             lShinRot = [1.5 - p * 0.5, 0, 0];
             rArmRot = [0.5, 0, 1.2];
             lArmRot = [-0.5, 0.5, -0.5];
         } else {
             const p = (progress - 0.75) / 0.25;
             hipY = 0.7 + p * 0.26;
             spineRot[1] = 0.8 * (1 - p);
         }
         break;
      }

      case ActionType.JAB: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.18); // 180ms jab matching MOVES.JAB.total
        const useRight = useRightArmForJabRef.current;

        // Grounded fighting stance legs with dynamic weight shift
        rLegRot = [-0.35 + progress * 0.1, 0, 0.35];
        rShinRot = [0.55 - progress * 0.1, 0, 0];
        lLegRot = [0.18 + progress * 0.12, 0, -0.35];
        lShinRot = [0.25 + progress * 0.1, 0, 0];

        if (progress < 0.25) {
            const p = progress / 0.25;
            hipY = 0.95 - p * 0.02;
            if (useRight) {
                chestRot[1] = p * 0.15;
                rArmRot = [-0.7, 0.1, 0.3];
                rForeRot = [-2.2, 0, 0];
                lArmRot = [-0.7, 0.2, -0.3];
                lForeRot = [-2.2, 0, 0];
            } else {
                chestRot[1] = -p * 0.15;
                lArmRot = [-0.8, 0.2, -0.3];
                lForeRot = [-2.2, 0, 0];
                rArmRot = [-0.6, 0.1, 0.3];
                rForeRot = [-2.0, 0, 0];
            }
        } else if (progress < 0.65) {
            const p = (progress - 0.25) / 0.4;
            hipY = 0.94;
            if (useRight) {
                chestRot[1] = 0.15 - p * 0.45;
                hipRot[1] = -p * 0.15;
                rArmRot = [-1.55, 0.1, 0.05];
                rForeRot = [-2.2 + p * 2.2, 0, 0];
                lArmRot = [-0.7, 0.2, -0.3];
                lForeRot = [-2.2, 0, 0];
            } else {
                chestRot[1] = -0.15 + p * 0.45;
                hipRot[1] = p * 0.15;
                lArmRot = [-1.55, -0.1, -0.05];
                lForeRot = [-2.2 + p * 2.2, 0, 0];
                rArmRot = [-0.6, 0.1, 0.3];
                rForeRot = [-2.0, 0, 0];
            }
        } else {
            const p = (progress - 0.65) / 0.35;
            const invP = 1 - p;
            hipY = 0.94 + p * 0.02;
            if (useRight) {
                chestRot[1] = -0.3 * invP;
                hipRot[1] = -0.15 * invP;
                rArmRot = [-1.55 + p * 0.85, 0.1, 0.3];
                rForeRot = [0 - p * 2.0, 0, 0];
                lArmRot = [-0.7, 0.2, -0.3];
                lForeRot = [-2.2, 0, 0];
            } else {
                chestRot[1] = 0.3 * invP;
                hipRot[1] = 0.15 * invP;
                lArmRot = [-1.55 + p * 0.85, -0.1, -0.3];
                lForeRot = [0 - p * 2.2, 0, 0];
                rArmRot = [-0.6, 0.1, 0.3];
                rForeRot = [-2.0, 0, 0];
            }
        }
        break;
      }

      case ActionType.CROSS: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.22); // 220ms matching MOVES.CROSS.total
        const useRight = useRightArmForJabRef.current;

        // Grounded fighting stance base legs with pivoting rear heel
        rLegRot = [-0.3, 0, 0.35];
        rShinRot = [0.5, 0, 0];
        lLegRot = [0.2, 0, -0.35];
        lShinRot = [0.2, 0, 0];

        if (progress < 0.35) {
            const p = progress / 0.35;
            const easeP = Math.sin(p * Math.PI * 0.5);
            hipY = 0.93;
            
            if (useRight) {
                hipRot[1] = -0.35 * easeP;
                chestRot[1] = -0.45 * easeP;
                rArmRot = [-1.48, 0.1, 0.1];
                rForeRot = [-2.2 + easeP * 2.0, 0, 0];
                lArmRot = [-0.8, 0.3, -0.4];
                lForeRot = [-2.2, 0, 0];
            } else {
                hipRot[1] = 0.35 * easeP;
                chestRot[1] = 0.45 * easeP;
                lArmRot = [-1.48, -0.1, -0.1];
                lForeRot = [-2.2 + easeP * 2.0, 0, 0];
                rArmRot = [-0.8, -0.3, 0.4];
                rForeRot = [-2.2, 0, 0];
            }
        } else if (progress < 0.75) {
            const p = (progress - 0.35) / 0.40;
            const easeP = Math.sin(p * Math.PI * 0.5);
            hipY = 0.90;
            spineRot[0] = 0.15 * easeP;
            
            if (useRight) {
                hipRot[1] = -0.35 + easeP * 1.0;
                chestRot[1] = -0.45 + easeP * 1.2;
                spineRot[1] = easeP * 0.4;
                lArmRot = [-1.52, -0.2, -0.1];
                lForeRot = [-2.2 + easeP * 2.1, 0, 0];
                rArmRot = [-0.8, -0.3, 0.4];
                rForeRot = [-2.2, 0, 0];
                rLegRot = [-0.4 * easeP, 0.2, 0.35];
            } else {
                hipRot[1] = 0.35 - easeP * 1.0;
                chestRot[1] = 0.45 - easeP * 1.2;
                spineRot[1] = -easeP * 0.4;
                rArmRot = [-1.52, 0.2, 0.1];
                rForeRot = [-2.2 + easeP * 2.1, 0, 0];
                lArmRot = [-0.8, 0.3, -0.4];
                lForeRot = [-2.2, 0, 0];
                lLegRot = [-0.4 * easeP, -0.2, -0.35];
            }
        } else {
            const p = (progress - 0.75) / 0.25;
            const invP = 1 - p;
            hipY = 0.90 + p * 0.06;
            if (useRight) {
                hipRot[1] = 0.65 * invP;
                chestRot[1] = 0.75 * invP;
                spineRot[1] = 0.4 * invP;
                lArmRot = [-1.52 + p * 0.7, -0.1, -0.3];
                lForeRot = [0 - p * 2.2, 0, 0];
                rArmRot = [-0.8 + p * 0.2, 0.1, 0.3];
                rForeRot = [-2.2, 0, 0];
            } else {
                hipRot[1] = -0.65 * invP;
                chestRot[1] = -0.75 * invP;
                spineRot[1] = -0.4 * invP;
                rArmRot = [-1.52 + p * 0.7, 0.1, 0.3];
                rForeRot = [0 - p * 2.2, 0, 0];
                lArmRot = [-0.8 + p * 0.2, -0.1, -0.3];
                lForeRot = [-2.2, 0, 0];
            }
        }
        break;
      }

      case ActionType.HOOK: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.26); // 260ms matching MOVES.HOOK.total

        // Grounded legs base
        rLegRot = [-0.35, 0.1, 0.35];
        rShinRot = [0.55, 0, 0];
        lLegRot = [0.2, -0.1, -0.35];
        lShinRot = [0.25, 0, 0];

        if (progress < 0.25) {
            const p = progress / 0.25;
            hipY = 0.94;
            chestRot[1] = p * 0.5;
            hipRot[1] = p * 0.3;
            rArmRot = [-0.8, 0.6, 0.6];
            rForeRot = [-1.8, 0, 0];
            lArmRot = [-0.8, 0.2, -0.4];
            lForeRot = [-2.2, 0, 0];
        } else if (progress < 0.65) {
            const p = (progress - 0.25) / 0.40;
            hipY = 0.92;
            chestRot[1] = 0.5 - p * 1.2;
            hipRot[1] = 0.3 - p * 0.8;
            spineRot[0] = 0.1;
            
            rArmRot = [-1.45, 1.1 - p * 0.4, 0.9];
            rForeRot = [-1.5, 0, 0];
            lArmRot = [-0.8, 0.3, -0.4];
            lForeRot = [-2.2, 0, 0];
        } else {
            const p = (progress - 0.65) / 0.35;
            const invP = 1 - p;
            hipY = 0.92 + p * 0.04;
            chestRot[1] = -0.7 * invP;
            hipRot[1] = -0.5 * invP;
            rArmRot = [-1.45 + p * 0.85, 0.1, 0.3];
            rForeRot = [-1.5 - p * 0.5, 0, 0];
            lArmRot = [-0.8, 0.2, -0.3];
            lForeRot = [-2.2, 0, 0];
        }
        break;
      }

      case ActionType.UPPERCUT: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.38); // 380ms matching MOVES.UPPERCUT.total

        if (progress < 0.25) {
            const p = progress / 0.25;
            hipY = 0.96 - p * 0.25;
            hipRot[1] = p * 0.4 * state.direction;
            spineRot[0] = p * 0.3;
            chestRot[1] = p * 0.5 * state.direction;
            
            rArmRot = [0.3 + p * 0.7, 0.2, 0.4];
            rForeRot = [-1.2, 0, 0];
            lArmRot = [-1.1, 0.3, -0.5];
            lForeRot = [-2.5, 0, 0];
            
            rLegRot = [-0.5 * p, 0, 0.35];
            rShinRot = [0.5 + 0.6 * p, 0, 0];
            lLegRot = [0.2 * p, 0, -0.35];
            lShinRot = [0.2 + 0.6 * p, 0, 0];
        } else if (progress < 0.55) {
            const p = (progress - 0.25) / 0.30;
            hipY = 0.71 + p * 0.95;
            hipRot[1] = (0.4 - p * 0.8) * state.direction;
            spineRot[0] = 0.3 - p * 0.6;
            chestRot[1] = (0.5 - p * 1.0) * state.direction;
            
            rArmRot = [1.0 - p * 3.2, 0, 0.2];
            rForeRot = [-1.2 + p * 0.5, 0, 0]; 
            lArmRot = [-1.1 + p * 0.8, 0, -0.2];
            lForeRot = [-2.5 + p * 0.8, 0, 0];
            
            rLegRot = [-0.5 + p * 0.6, 0, 0.2];
            rShinRot = [1.1 - p * 0.9, 0, 0];
            lLegRot = [0.2 - p * 0.3, 0, -0.2];
            lShinRot = [0.8 - p * 0.6, 0, 0];
        } else {
            const p = (progress - 0.55) / 0.45;
            hipY = 1.66 - p * 0.70;
            hipRot[1] = (-0.4 + p * 0.4) * state.direction;
            spineRot[0] = -0.3 + p * 0.3;
            chestRot[1] = (-0.5 + p * 0.5) * state.direction;
            
            rArmRot = [-2.2 + p * 1.5, 0.1, 0.3];
            rForeRot = [-0.7 - p * 1.3, 0, 0];
            lArmRot = [-0.3 - p * 0.4, 0.2, -0.3];
            lForeRot = [-1.7 - p * 0.5, 0, 0];
            
            rLegRot = [-0.3, 0, 0.35];
            rShinRot = [0.2 + p * 0.3, 0, 0];
            lLegRot = [0.2, 0, -0.35];
            lShinRot = [0.2, 0, 0];
        }
        break;
      }

      case ActionType.SPECIAL_ULTIMATE: {
        // Calculate progress in real milliseconds so animation is perfectly in sync with the 1.7s gameplay action duration!
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 1.7);
        const isJamesCharacter = state.name === 'James' || state.name.toLowerCase().includes('james') || state.name.toLowerCase().includes('jin');
        const isSakura = state.name === 'Ava' || state.name.toLowerCase().includes('sakura');
        const isAlien = state.name.toLowerCase().includes('alien');
        const isMecha = state.name.toLowerCase().includes('mecha');
        const isOsbamo = state.name.toLowerCase().includes('osbamo');

        // Threshold 0.588 corresponds to 1000ms startup out of 1700ms total move time
        if (isJamesCharacter) {
            if (progress < 0.588) {
                // Preparation: Ultimate concentration, aura pulsing
                const shake = (Math.random() - 0.5) * 0.05;
                hipY = 0.72 + shake;
                spineRot[0] = 0.4;
                baseHeadRotX = 0.3;
                // Dramatic energy gathering pose at hip
                rArmRot = [1.2, -0.6, 1.4];
                rForeRot = [-2.3, 0, 0];
                lArmRot = [1.2, 0.6, -1.4];
                lForeRot = [-2.3, 0, 0];
                rLegRot = [-0.3, 0.1, 0.35];
                rShinRot = [0.85, 0, 0];
                lLegRot = [0.4, -0.1, -0.35];
                lShinRot = [0.65, 0, 0];
            } else {
                // Attack: SHINRA TENSEI style blast!
                const p = (progress - 0.588) / 0.412;
                hipY = 0.82;
                spineRot[0] = -0.5;
                baseHeadRotX = -0.4;
                // Explosive dual arm thrust forward
                rArmRot = [-1.6, 0.2, 0.2];
                rForeRot = [0, 0, 0];
                lArmRot = [-1.6, -0.2, -0.2];
                lForeRot = [0, 0, 0];
                
                rLegRot = [-0.5, 0.2, 0.4];
                rShinRot = [0.75, 0, 0];
                lLegRot = [0.5, -0.2, -0.4];
                lShinRot = [0.55, 0, 0];
            }
        } else if (isMecha) {
            if (progress < 0.588) {
                // Preparation: Mechanical override, systems locking
                const jitter = (Math.random() - 0.5) * 0.06;
                hipY = 0.80 + jitter;
                spineRot[0] = 0.3;
                // Arms transform and lock into shoulder cannons
                rArmRot = [-1.4, 0.2, 0.5];
                rForeRot = [-2.0, 0, 0];
                lArmRot = [-1.4, -0.2, -0.5];
                lForeRot = [-2.0, 0, 0];

                rLegRot = [-0.2, 0.1, 0.3];
                rShinRot = [0.7, 0, 0];
                lLegRot = [0.3, -0.1, -0.3];
                lShinRot = [0.5, 0, 0];
            } else {
                // Attack: TITAN CANNON VOLLEY
                const p = (progress - 0.588) / 0.412;
                hipY = 0.72;
                spineRot[0] = -0.6; // Heavy recoil
                // Cannon recoil vibration
                const recoil = Math.sin(Date.now() / 15) * 0.06;
                rArmRot = [-1.57 + recoil, 0, 0.1];
                lArmRot = [-1.57 + recoil, 0, -0.1];
                rForeRot = [0, 0, 0];
                lForeRot = [0, 0, 0];
                
                rLegRot = [-0.6, 0.2, 0.45];
                rShinRot = [0.9, 0, 0];
                lLegRot = [0.6, -0.2, -0.45];
                lShinRot = [0.6, 0, 0];
            }
        } else if (isAlternate) {
            if (progress < 0.588) {
                // Preparation: Primal nightmare charge
                const shake = (Math.random() - 0.5) * 0.08;
                hipY = 0.52 + shake;
                spineRot[0] = 0.8; // Deep animalistic hunch
                baseHeadRotX = 0.4;
                // Claws digging into ground, twitching
                rArmRot = [-1.5, 0.5, 0.3];
                rForeRot = [0.4, 0, 0];
                lArmRot = [-1.5, -0.5, -0.3];
                lForeRot = [0.4, 0, 0];
                rLegRot = [-0.4, 0.1, 0.4];
                rShinRot = [1.1, 0, 0];
                lLegRot = [0.4, -0.1, -0.4];
                lShinRot = [1.0, 0, 0];
            } else {
                // Attack: RUPTURE OVERDRIVE (Leaping X-Slash)
                const p = (progress - 0.588) / 0.412;
                hipY = 1.25; // Explosive leap upward
                spineRot[0] = -0.7; // Back arching violently
                baseHeadRotX = -0.7; // Roaring upwards
                // Claws extended in wide dual diagonal strike
                rArmRot = [-0.6, 0.8, 1.4];
                rForeRot = [-0.2, 0, 0];
                lArmRot = [-0.6, -0.8, -1.4];
                lForeRot = [-0.2, 0, 0];
                
                rLegRot = [-0.5, 0, 0.3];
                rShinRot = [0.4, 0, 0];
                lLegRot = [0.6, 0, -0.3];
                lShinRot = [1.2, 0, 0];
            }
        } else if (isSakura) {
            if (progress < 0.588) {
                // Preparation: Zen focus, floating floral aura gathering
                const float = Math.sin(Date.now() / 20) * 0.08;
                hipY = 1.05 + float;
                // Elegant lotus focus pose at chest
                rArmRot = [1.2, -0.4, 0.9];
                rForeRot = [-2.4, 0, 0];
                lArmRot = [1.2, 0.4, -0.9];
                lForeRot = [-2.4, 0, 0];

                rLegRot = [-0.2, 0, 0.25];
                rShinRot = [0.5, 0, 0];
                lLegRot = [0.2, 0, -0.25];
                lShinRot = [0.4, 0, 0];
            } else {
                // Attack: CHERRY BLOSSOM BURST
                const p = (progress - 0.588) / 0.412;
                hipY = 0.82;
                spineRot[0] = -0.4;
                // Graceful palm strike release forward
                rArmRot = [-1.57, 0, 0.2];
                rForeRot = [0, 0, 0];
                lArmRot = [-1.57, 0, -0.2];
                lForeRot = [0, 0, 0];
                
                rLegRot = [-0.4, 0.1, 0.35];
                rShinRot = [0.7, 0, 0];
                lLegRot = [0.4, -0.1, -0.35];
                lShinRot = [0.5, 0, 0];
            }
        } else if (isAlien) {
            if (progress < 0.588) {
                // Preparation: Cosmic resonance, floating high
                const float = Math.sin(Date.now() / 15) * 0.12;
                hipY = 1.35 + float;
                spineRot[0] = -0.2;
                // Channeling cosmic energy orb overhead
                rArmRot = [-2.5, 0.4, 0.8];
                lArmRot = [-2.5, -0.4, -0.8];

                rLegRot = [0.3, 0, 0.2];
                rShinRot = [0.4, 0, 0];
                lLegRot = [-0.2, 0, -0.2];
                lShinRot = [0.5, 0, 0];
            } else {
                // Attack: EVENT HORIZON BEAM
                const p = (progress - 0.588) / 0.412;
                hipY = 0.75;
                spineRot[0] = -0.5; // Heavy beam recoil
                // Beam firing pose
                rArmRot = [-1.57, 0, 0.1];
                lArmRot = [-1.57, 0, -0.1];
                rForeRot = [0, 0, 0];
                lForeRot = [0, 0, 0];
                
                rLegRot = [-0.5, 0.1, 0.35];
                rShinRot = [0.8, 0, 0];
                lLegRot = [0.5, -0.1, -0.35];
                lShinRot = [0.6, 0, 0];
            }
        } else if (isOsbamo) {
            if (progress < 0.588) {
                // Preparation: DEMONIC DRAGON CANNON CHARGE
                const vibration = Math.sin(Date.now() / 10) * 0.05;
                hipY = 0.60 + vibration;
                // Deep martial arts crouch and side twist
                hipRot[1] = -Math.PI / 2.2;
                spineRot[0] = 0.4;
                spineRot[1] = -0.3;
                baseHeadRotX = -0.2;
                // Dual hands cupped back at right hip
                rArmRot = [1.5, 0, 1.8];
                rForeRot = [-2.4, 0, 0];
                lArmRot = [1.8, 0, -0.6];
                lForeRot = [-2.5, 0, 0];
                
                rLegRot = [-0.4, 0.1, 0.4];
                rShinRot = [0.9, 0, 0];
                lLegRot = [0.5, -0.1, -0.4];
                lShinRot = [0.7, 0, 0];
            } else {
                // Attack: HYPER SUPERSONIC SHADOW DRAGON STRIKE
                const p = (progress - 0.588) / 0.412;
                hipY = 0.78;
                spineRot[0] = -0.55; // Deep power thrust
                hipRot[1] = 0.8;
                baseHeadRotX = 0.2;
                // Explosive dual hand shockwave thrust
                rArmRot = [-1.6, 0.2, -0.2];
                lArmRot = [-1.6, -0.2, 0.2];
                rForeRot = [0, 0, 0];
                lForeRot = [0, 0, 0];
                
                rLegRot = [-0.6, 0.2, 0.45];
                rShinRot = [0.8, 0, 0];
                lLegRot = [0.6, -0.2, -0.45];
                lShinRot = [0.6, 0, 0];
            }
        } else {
            // Default Ultra animation for all other characters
            if (progress < 0.588) {
                // Preparation: Charging with hands together at side
                const pulse = Math.sin(Date.now() / 25) * 0.03;
                hipY = 0.72 + pulse;
                spineRot[0] = 0.3;
                spineRot[1] = 0.6;
                chestRot[1] = 0.6;
                baseHeadRotX = 0.2;
                
                // Arms drawn to the side for energy blast
                rArmRot = [1.2, 0, 0.8];
                rForeRot = [-2.0, 0, 0];
                lArmRot = [1.4, 0, -0.4];
                lForeRot = [-2.2, 0, 0];
                rLegRot = [-0.3, 0.1, 0.35];
                rShinRot = [0.8, 0, 0];
                lLegRot = [0.4, -0.1, -0.35];
                lShinRot = [0.6, 0, 0];
            } else {
                // Attack: Thrust hands forward with lunging power
                const p = (progress - 0.588) / 0.412;
                hipY = 0.80;
                spineRot[0] = -0.5;
                spineRot[1] = -0.2;
                chestRot[1] = -0.2;
                
                rArmRot = [-1.6, 0.1, 0.1];
                rForeRot = [0, 0, 0];
                lArmRot = [-1.6, -0.1, -0.1];
                lForeRot = [0, 0, 0];
                
                rLegRot = [-0.5, 0.2, 0.4];
                rShinRot = [0.75, 0, 0];
                lLegRot = [0.5, -0.2, -0.4];
                lShinRot = [0.55, 0, 0];
            }
        }
        break;
      }
      case ActionType.GRAB_INIT:
         // Active, aggressive wrestle-grappling forward lunge to snatch opponent
         hipY = 0.85;
         spineRot[0] = 0.5; // Lean far forward

         // Both arms open wide like a giant clamp to grapple
         rArmRot = [-1.6, 0.4, 0.6];
         lArmRot = [-1.6, -0.4, -0.6];
         rForeRot = [0, 0, 0];
         lForeRot = [0, 0, 0];

         // Lunge legs forward
         rLegRot = [-1.0, 0, 0.2];
         lLegRot = [0.6, 0, -0.2];
         break;

      case ActionType.GRAB_ACTIVE:
         // DYNAMIC TWO-PHASE OVERHEAD BODY SLAM (Suplex / Chokeslam)
         if (t < 8.0) {
             // Phase 1: Lift victim high in the air
             hipY = 0.75;
             spineRot[0] = -0.4; // Lean back to lift heavy weight
             baseHeadRotX = -0.5; // Look up at the lifted opponent

             // Arms raised high holding opponent up
             rArmRot = [-2.6, 0, 0.4];
             lArmRot = [-2.6, 0, -0.4];
             rForeRot = [-0.5, 0, 0];
             lForeRot = [-0.5, 0, 0];

             rLegRot = [-0.8, 0, 0.2];
             lLegRot = [-0.8, 0, -0.2];
         } else {
             // Phase 2: Whip them down violently to the floor with full force
             hipY = 0.65;
             spineRot[0] = 0.8; // Whip body forward
             baseHeadRotX = 0.4; // Look down at impact

             // Slam arms down to the ground
             rArmRot = [-0.2, 0, 0.1];
             lArmRot = [-0.2, 0, -0.1];
             rForeRot = [0, 0, 0];
             lForeRot = [0, 0, 0];

             rLegRot = [-1.2, 0, 0.3];
             lLegRot = [-1.2, 0, -0.3];
         }
         break;

      case ActionType.BEING_GRABBED: {
         // Victim reactions matching the lift and slam phases of the attacker perfectly
         if (t < 8.0) {
             // Helplessly lifted high in the air, legs flailing
             hipY = 1.65;
             spineRot[0] = 0.1;
             rArmRot = [0, 0, 1.8]; // arms high up
             lArmRot = [0, 0, -1.8];
             rLegRot = [0.8, 0, 0.3];
             lLegRot = [0.4, 0, -0.3];
         } else {
             // Pulled down face-first violently toward the ground
             hipY = 0.35;
             spineRot[0] = 0.8;
             rArmRot = [-1.0, 0, 1.0];
             lArmRot = [-1.0, 0, -1.0];
             rLegRot = [-1.2, 0, 0];
             lLegRot = [-1.2, 0, 0];
         }
         break;
      }

      case ActionType.AIR_SPIN_HIT: {
         hipY = 0.5;
         const spinMult = (latestState.spinMultiplier || 1.0) * 0.36;
         hipRot[0] = t * 5.0 * spinMult * -latestState.direction; 
         hipRot[1] = 0;
         hipRot[2] = 0;
         rArmRot = [-1.5, 0.5, 0.5];
         lArmRot = [-1.5, -0.5, -0.5];
         rLegRot = [-0.5, 0, 0];
         rShinRot = [1.5, 0, 0];
         lLegRot = [-0.5, 0, 0];
         lShinRot = [1.5, 0, 0];
         break;
      }

      case ActionType.THROWN:
         // Mid-air flying tumbling, flat
         hipY = 0.5;
         hipRot[0] = -1.57; // Flat on back
         hipRot[2] = 0; // No spin, as requested
         rArmRot = [0, 0, 2.5];
         lArmRot = [0, 0, -2.5];
         rLegRot = [0.2, 0, 0];
         lLegRot = [0.2, 0, 0];
         break;

      case ActionType.KICK: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.22); // 220ms fast snappy kick duration matching MOVES.KICK.total

        if (progress < 0.20) {
            // Chamber Knee with LEFT leg (la otra pierna) - Grounded, straight facing
            const p = progress / 0.20;
            hipY = 0.95; // Grounded stance, strictly NO jump
            spineRot[0] = -0.25 * p; // Slight backward lean to raise leg cleanly
            chestRot[1] = 0; // Strictly NO body rotation/twisting
            hipRot[1] = 0;
            hipRot[2] = 0;
            
            // Standing right leg (grounded base)
            rLegRot = [-0.3, 0, 0.35];
            rShinRot = [0.4, 0, 0];
            
            // Kicking left leg
            lLegRot = [-1.8 * p, 0, -0.1 * p];
            lShinRot = [1.8 * p, 0, 0];
            
            rArmRot = [-0.5 * p, 0, 0.4 * p];
            lArmRot = [0.2 * p, 0, -0.4 * p];
            rForeRot = [-2.0, 0, 0];
            lForeRot = [-2.0, 0, 0];
        } else if (progress < 0.65) {
            // HIGH KICK EXTENSION - Straight forward, grounded, zero body rotation
            const p = (progress - 0.20) / 0.45;
            hipY = 0.95; // Grounded, strictly NO jump
            spineRot[0] = -0.45; // Lean torso back for vertical leg strike height
            chestRot[1] = 0; // Strictly NO body rotation/twisting
            hipRot[1] = 0;
            hipRot[2] = 0;
            
            // Standing right leg (grounded base)
            rLegRot = [-0.3, 0, 0.35];
            rShinRot = [0.4, 0, 0];
            
            // Kicking left leg extends high forward
            lLegRot = [-1.8 - p * 1.3, 0, -0.05]; // Reaches high vertical head strike (rotated higher!)
            lShinRot = [1.8 - p * 1.8, 0, 0]; // Foot extends out straight
            
            rArmRot = [-0.6, 0, 0.8];
            lArmRot = [0.3, 0, -0.8];
        } else {
            // Retract & Plant Foot - Grounded, straight facing
            const p = (progress - 0.65) / 0.35;
            const invP = 1 - p;
            hipY = 0.95; // Grounded!
            spineRot[0] = -0.45 * invP;
            chestRot[1] = 0; // Strictly NO body rotation/twisting
            hipRot[1] = 0;
            hipRot[2] = 0;
            
            rLegRot = [-0.3, 0, 0.35];
            rShinRot = [0.4 - p * 0.1, 0, 0];
            
            // Left leg lowers back down smoothly to stance
            lLegRot = [-3.10 + p * 3.3, 0, -0.35 * p];
            lShinRot = [0.0 + p * 0.35, 0, 0];
            
            rArmRot = [-0.6 + p * 0.1, 0.2, 0.3];
            lArmRot = [0.3 - p * 0.9, 0.1, -0.3];
            rForeRot = [-2.2, 0, 0];
            lForeRot = [-2.0, 0, 0];
        }
        break;
      }

      case ActionType.SPIN_KICK: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.28); // 280ms fast spin kick duration matching MOVES.SPIN_KICK.total

        if (progress < 0.22) {
            const p = progress / 0.22;
            hipY = 0.96;
            hipRot[1] = -p * 1.2;
            spineRot[0] = 0.2;
            
            rLegRot = [-0.3, 0, 0.35];
            rShinRot = [0.5, 0, 0];
            lLegRot = [0.2, 0, -0.35];
            lShinRot = [0.2, 0, 0];
            
            rArmRot = [-0.8, 0, 0.8];
            lArmRot = [-0.8, 0, -0.8];
        } else if (progress < 0.70) {
            const p = (progress - 0.22) / 0.48;
            hipY = 1.02 + Math.sin(p * Math.PI) * 0.30; // High leap into air
            hipRot[1] = -1.2 - p * (Math.PI * 2 - 1.2); // Full 360 spin
            spineRot[0] = -0.3;
            chestRot[1] = 0.4;
            
            rLegRot = [-2.45, 0.2, 0.15]; // High spinning heel kick
            rShinRot = [0.0, 0, 0];
            lLegRot = [0.3, 0, -0.2];
            lShinRot = [0.5, 0, 0];
            
            rArmRot = [0, 0, 1.4];
            lArmRot = [-0.8, 0, -1.0];
        } else {
            const p = (progress - 0.70) / 0.30;
            const invP = 1 - p;
            hipY = 0.96;
            hipRot[1] = -Math.PI * 2 * invP;
            spineRot[0] = 0.2 * p;
            
            rLegRot = [-2.45 + p * 2.1, 0, 0.35 * p];
            rShinRot = [0.0 + p * 0.5, 0, 0];
            lLegRot = [0.2, 0, -0.35];
            lShinRot = [0.2, 0, 0];
            
            rArmRot = [-0.6, 0.1, 0.3];
            lArmRot = [-0.7, 0.2, -0.3];
            rForeRot = [-2.0, 0, 0];
            lForeRot = [-2.2, 0, 0];
        }
        break;
      }

      case ActionType.BLOCK: {
        hipY = 0.85 + Math.sin(t * 0.3) * 0.01;
        spineRot[0] = 0.35;
        rLegRot = [-0.4, 0, 0.38];
        rShinRot = [0.65, 0, 0];
        lLegRot = [0.25, 0, -0.38];
        lShinRot = [0.35, 0, 0];
        rArmRot = [-1.25, 0.4, 0.55];
        rForeRot = [-2.5, 0, 0];
        lArmRot = [-1.25, -0.4, -0.55];
        lForeRot = [-2.5, 0, 0];
        break;
      }

      case ActionType.HIT: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.25);
        const p = Math.sin(progress * Math.PI);

        hipY = 0.94 - p * 0.05;
        spineRot[0] = -0.45 * p;
        spineRot[1] = 0.35 * p;
        chestRot[1] = 0.35 * p;
        baseHeadRotX = -0.3 * p;

        rLegRot = [-0.3 - p * 0.15, 0, 0.35];
        rShinRot = [0.5 + p * 0.2, 0, 0];
        lLegRot = [0.2 + p * 0.1, 0, -0.35];
        lShinRot = [0.2 + p * 0.2, 0, 0];

        rArmRot = [-0.5 - p * 0.6, 0.2, 0.8];
        rForeRot = [-1.8 + p * 0.5, 0, 0];
        lArmRot = [-0.5 - p * 0.6, -0.2, -0.8];
        lForeRot = [-1.8 + p * 0.5, 0, 0];
        break;
      }

      case ActionType.STUNNED: {
        hipY = 0.82 + Math.sin(t * 0.25) * 0.02;
        spineRot[0] = 0.65 + Math.sin(t * 0.2) * 0.1;
        spineRot[2] = Math.sin(t * 0.18) * 0.12;
        baseHeadRotX = 0.45 + Math.cos(t * 0.2) * 0.1;
        baseHeadRotY = Math.sin(t * 0.15) * 0.25;

        rLegRot = [-0.5 + Math.sin(t * 0.3) * 0.08, 0, 0.35];
        rShinRot = [0.9 + Math.cos(t * 0.3) * 0.1, 0, 0];
        lLegRot = [0.3 - Math.sin(t * 0.3) * 0.08, 0, -0.35];
        lShinRot = [0.8 - Math.cos(t * 0.3) * 0.1, 0, 0];

        rArmRot = [-0.4 + Math.sin(t * 0.2) * 0.1, 0.1, 0.4];
        rForeRot = [-2.4, 0, 0];
        lArmRot = [-0.5 - Math.sin(t * 0.2) * 0.1, -0.1, -0.4];
        lForeRot = [-2.4, 0, 0];
        break;
      }

      case ActionType.SPECIAL_LIGHTNING: {
        const elapsedSeconds = (Date.now() - actionStartTimeRef.current) / 1000;
        const progress = Math.min(1.0, elapsedSeconds / 0.60);
        const vibrate = Math.sin(Date.now() / 15) * 0.04;

        rLegRot = [-0.4, 0.1, 0.4];
        rShinRot = [0.7, 0, 0];
        lLegRot = [0.3, -0.1, -0.4];
        lShinRot = [0.5, 0, 0];

        if (progress < 0.30) {
            const p = progress / 0.30;
            hipY = 0.88 + vibrate;
            spineRot[0] = 0.25;
            rArmRot = [-1.8 * p, 0.2, 0.6 * p];
            rForeRot = [-2.2, 0, 0];
            lArmRot = [-1.8 * p, -0.2, -0.6 * p];
            lForeRot = [-2.2, 0, 0];
        } else if (progress < 0.75) {
            const p = (progress - 0.30) / 0.45;
            hipY = 0.85 + vibrate;
            spineRot[0] = -0.35;
            chestRot[1] = vibrate * 2;
            
            rArmRot = [-1.57, 0.1, 0.15];
            rForeRot = [0, 0, 0];
            lArmRot = [-1.57, -0.1, -0.15];
            lForeRot = [0, 0, 0];
        } else {
            const p = (progress - 0.75) / 0.25;
            const invP = 1 - p;
            hipY = 0.85 + p * 0.11;
            spineRot[0] = -0.35 * invP;
            rArmRot = [-1.57 + p * 0.9, 0.1, 0.3];
            rForeRot = [-2.0 * p, 0, 0];
            lArmRot = [-1.57 + p * 0.8, -0.1, -0.3];
            lForeRot = [-2.2 * p, 0, 0];
        }
        break;
      }



      case ActionType.ROLL_RECOVERY: {
          const p = Math.min(1.0, t / 18.0);

          if (p < 0.35) {
              // Phase 1: Sitting Up
              const p1 = p / 0.35;
              hipY = 0.16 + p1 * 0.09; // rise slightly
              hipRot[0] = -(1.0 - p1 * 0.33) * (Math.PI / 2); // tilt trunk upward
              hipRot[1] = 0;
              hipRot[2] = 0;
              
              spineRot[0] = p1 * 0.6; // sit up
              baseHeadRotX = p1 * 0.3; // head looking forward
              
              // Hands supporting behind on the ground
              rArmRot = [1.0, -0.4, 0.5];
              rForeRot = [-1.0, 0, 0];
              lArmRot = [1.0, 0.4, -0.5];
              lForeRot = [-1.0, 0, 0];
              
              // Bend knees up
              rLegRot = [-1.2 * p1, 0, 0.2];
              rShinRot = [1.4 * p1, 0, 0];
              lLegRot = [-1.2 * p1, 0, -0.2];
              lShinRot = [1.4 * p1, 0, 0];
          } else if (p < 0.70) {
              // Phase 2: Pushing Off the Floor
              const p2 = (p - 0.35) / 0.35;
              hipY = 0.25 + p2 * 0.45; // rise up to 0.70
              hipRot[0] = -0.67 * (1.0 - p2) * (Math.PI / 2); // rotate to upright stance
              hipRot[1] = 0;
              hipRot[2] = 0;
              
              spineRot[0] = 0.6 * (1.0 - p2 * 0.17); // keep forward crouch lean
              baseHeadRotX = 0.3;
              
              // Arms pushing down off the ground
              rArmRot = [-0.5, 0, 0.2];
              rForeRot = [-0.8, 0, 0];
              lArmRot = [-0.5, 0, -0.2];
              lForeRot = [-0.8, 0, 0];
              
              // Low leg crouch
              rLegRot = [-1.2 + p2 * 0.4, 0, 0.3];
              rShinRot = [1.4 - p2 * 0.2, 0, 0];
              lLegRot = [-1.2 + p2 * 0.7, 0, -0.3];
              lShinRot = [1.4 - p2 * 0.2, 0, 0];
          } else {
              // Phase 3: Standing Up & Combat Guard
              const p3 = (p - 0.70) / 0.30;
              hipY = 0.70 + p3 * 0.26; // rise to stand (0.96)
              hipRot[0] = 0;
              hipRot[1] = 0;
              hipRot[2] = 0;
              
              spineRot[0] = 0.5 * (1.0 - p3) + 0.2 * p3; // return to alert combat stance
              baseHeadRotX = 0.3 * (1.0 - p3);
              
              // Bring arms back to combat guard
              rArmRot = [-0.5 + p3 * -0.1, 0.1 * p3, 0.2 + p3 * 0.1];
              rForeRot = [-0.8 + p3 * -1.2, 0, 0];
              lArmRot = [-0.5 + p3 * -0.2, 0.2 * p3, -0.2 + p3 * -0.1];
              lForeRot = [-0.8 + p3 * -1.4, 0, 0];
              
              // Straighten knees and stand
              rLegRot = [-0.8 + p3 * 0.5, 0, 0.3 + p3 * 0.05];
              rShinRot = [1.2 - p3 * 0.7, 0, 0];
              lLegRot = [-0.5 + p3 * 0.7, 0, -0.3 + p3 * -0.05];
              lShinRot = [1.2 - p3 * 1.0, 0, 0];
          }
          break;
      }

      case ActionType.KNOCKDOWN: 
      case ActionType.LAYING_FLAT: {
         const isLaying = state.action === ActionType.LAYING_FLAT || (state.action === ActionType.KNOCKDOWN && latestState.y < 0.2);
         const fallProgress = Math.min(1.0, t / 15);
         const faceDown = !!latestState.isFaceDown;
         
         if (!isLaying) {
             // 1. Initial flying phase from high impact (Knockdown)
             hipY = 0.16; // Set to lying flat immediately so state.y handles the bounce!
             
             // If knocked out (hp <= 0), keep completely flat and limp immediately so flights and bounces look realistic!
             if (state.hp <= 0) {
                 hipRot[0] = -(Math.PI / 2); // Fully flat on back
                 hipRot[1] = 0;
                 hipRot[2] = faceDown ? Math.PI : 0;
                 spineRot[0] = -0.05;
                 rArmRot = [Math.PI / 2 - 0.2, 0.4, 1.3];
                 lArmRot = [Math.PI / 2 - 0.2, -0.4, -1.3];
                 rForeRot = [0, 0, 0];
                 lForeRot = [0, 0, 0];
                 rLegRot = [0.1, 0, 0.4];
                 lLegRot = [0.1, 0, -0.4];
                 rShinRot = [0, 0, 0];
                 lShinRot = [0, 0, 0];
                 baseHeadRotX = -0.1;
             } else {
                 hipRot[0] = -fallProgress * (Math.PI / 2); // Tilted back
                 hipRot[1] = 0;
                 hipRot[2] = faceDown ? Math.PI : 0;
                 spineRot[0] = -0.3;
                 rArmRot = [-1.8, 0.6, 1.2];
                 lArmRot = [-1.8, -0.6, -1.2];
                 rForeRot = [-0.2, 0, 0];
                 lForeRot = [-0.2, 0, 0];
                 rLegRot = [-0.6, 0.1, 0.2];
                 rShinRot = [0.9, 0, 0];
                 lLegRot = [-0.4, -0.1, -0.2];
                 lShinRot = [0.8, 0, 0];
                 baseHeadRotX = -0.4;
             }
         } else {
             // 2. Landing and lying limp on ground phase (Laying Flat)
             hipY = 0.16; // Flat on ground
             hipRot[0] = -(Math.PI / 2); // Lands flat
             hipRot[1] = 0;
             hipRot[2] = faceDown ? Math.PI : 0; // Roll over to stomach if faceDown
             
             spineRot[0] = -0.05;
             rArmRot = [Math.PI / 2 - 0.2, 0.4, faceDown ? 0.3 : 1.3];
             lArmRot = [Math.PI / 2 - 0.2, -0.4, faceDown ? -0.3 : -1.3];
             rForeRot = [0, 0, 0];
             lForeRot = [0, 0, 0];
             
             rLegRot = [0.1, 0, 0.4];
             lLegRot = [0.1, 0, -0.4];
             rShinRot = [0, 0, 0];
             lShinRot = [0, 0, 0];
             baseHeadRotX = -0.1;
             baseHeadRotY = 0.15 * state.direction;
         }
         break;
      }

      case ActionType.GET_UP: {
          const p = Math.min(1.0, t / 18.0);
          const faceDown = !!latestState.isFaceDown;

          if (!faceDown) {
              // NORMAL GET-UP FROM BACK (BOCA ARRIBA)
              if (p < 0.35) {
                  // Phase 1: Sitting Up
                  const p1 = p / 0.35;
                  hipY = 0.16 + p1 * 0.09; // rise slightly
                  hipRot[0] = -(1.0 - p1 * 0.33) * (Math.PI / 2); // tilt trunk upward
                  hipRot[1] = 0;
                  hipRot[2] = 0;
                  
                  spineRot[0] = p1 * 0.6; // sit up
                  baseHeadRotX = p1 * 0.3; // head looking forward
                  
                  rArmRot = [1.0, -0.4, 0.5];
                  rForeRot = [-1.0, 0, 0];
                  lArmRot = [1.0, 0.4, -0.5];
                  lForeRot = [-1.0, 0, 0];
                  
                  rLegRot = [-1.2 * p1, 0, 0.2];
                  rShinRot = [1.4 * p1, 0, 0];
                  lLegRot = [-1.2 * p1, 0, -0.2];
                  lShinRot = [1.4 * p1, 0, 0];
              } else if (p < 0.70) {
                  // Phase 2: Pushing Off the Floor
                  const p2 = (p - 0.35) / 0.35;
                  hipY = 0.25 + p2 * 0.45; // rise up to 0.70
                  hipRot[0] = -0.67 * (1.0 - p2) * (Math.PI / 2); // rotate to upright stance
                  hipRot[1] = 0;
                  hipRot[2] = 0;
                  
                  spineRot[0] = 0.6 * (1.0 - p2 * 0.17); // keep forward crouch lean
                  baseHeadRotX = 0.3;
                  
                  rArmRot = [-0.5, 0, 0.2];
                  rForeRot = [-0.8, 0, 0];
                  lArmRot = [-0.5, 0, -0.2];
                  lForeRot = [-0.8, 0, 0];
                  
                  rLegRot = [-1.2 + p2 * 0.4, 0, 0.3];
                  rShinRot = [1.4 - p2 * 0.2, 0, 0];
                  lLegRot = [-1.2 + p2 * 0.7, 0, -0.3];
                  lShinRot = [1.4 - p2 * 0.2, 0, 0];
              } else {
                  // Phase 3: Standing Up & Guard
                  const p3 = (p - 0.70) / 0.30;
                  hipY = 0.70 + p3 * 0.26; // rise to stand (0.96)
                  hipRot[0] = 0;
                  hipRot[1] = 0;
                  hipRot[2] = 0;
                  
                  spineRot[0] = 0.5 * (1.0 - p3) + 0.2 * p3; // return to alert combat stance
                  baseHeadRotX = 0.3 * (1.0 - p3);
                  
                  rArmRot = [-0.5 + p3 * -0.1, 0.1 * p3, 0.2 + p3 * 0.1];
                  rForeRot = [-0.8 + p3 * -1.2, 0, 0];
                  lArmRot = [-0.5 + p3 * -0.2, 0.2 * p3, -0.2 + p3 * -0.1];
                  lForeRot = [-0.8 + p3 * -1.4, 0, 0];
                  
                  rLegRot = [-0.8 + p3 * 0.5, 0, 0.3 + p3 * 0.05];
                  rShinRot = [1.2 - p3 * 0.7, 0, 0];
                  lLegRot = [-0.5 + p3 * 0.7, 0, -0.3 + p3 * -0.05];
                  lShinRot = [1.2 - p3 * 1.0, 0, 0];
              }
          } else {
              // ATHLETIC PUSH-UP GET-UP FROM STOMACH (BOCA ABAJO)
              if (p < 0.35) {
                  // Phase 1: Push-up stance
                  const p1 = p / 0.35;
                  hipY = 0.16 + p1 * 0.20; // rise off floor
                  hipRot[0] = -(1.0 - p1 * 0.5) * (Math.PI / 2); // arch trunk
                  hipRot[1] = 0;
                  hipRot[2] = Math.PI; // maintain face down
                  
                  spineRot[0] = p1 * 0.3;
                  baseHeadRotX = -0.2 * p1; // looking slightly up
                  
                  rArmRot = [-0.3, 0, 0.3];
                  rForeRot = [-1.2 * (1 - p1), 0, 0];
                  lArmRot = [-0.3, 0, -0.3];
                  lForeRot = [-1.2 * (1 - p1), 0, 0];
                  
                  rLegRot = [0.1, 0, 0.2];
                  rShinRot = [0, 0, 0];
                  lLegRot = [0.1, 0, -0.2];
                  lShinRot = [0, 0, 0];
              } else if (p < 0.70) {
                  // Phase 2: Pulling Knees Under Chest & Turning Around
                  const p2 = (p - 0.35) / 0.35;
                  hipY = 0.36 + p2 * 0.34; // rise to 0.70
                  hipRot[0] = -0.5 * (1.0 - p2) * (Math.PI / 2);
                  hipRot[1] = 0;
                  hipRot[2] = Math.PI * (1.0 - p2); // rotate around to face forward
                  
                  spineRot[0] = 0.5;
                  baseHeadRotX = 0.2;
                  
                  rArmRot = [-0.4, 0, 0.2];
                  rForeRot = [-1.0, 0, 0];
                  lArmRot = [-0.4, 0, -0.2];
                  lForeRot = [-1.0, 0, 0];
                  
                  rLegRot = [-1.2 + p2 * 0.4, 0, 0.3];
                  rShinRot = [1.2 - p2 * 0.2, 0, 0];
                  lLegRot = [-1.2 + p2 * 0.7, 0, -0.3];
                  lShinRot = [1.2 - p2 * 0.2, 0, 0];
              } else {
                  // Phase 3: Straighten Up & Combat Guard
                  const p3 = (p - 0.70) / 0.30;
                  hipY = 0.70 + p3 * 0.26;
                  hipRot[0] = 0;
                  hipRot[1] = 0;
                  hipRot[2] = 0;
                  
                  spineRot[0] = 0.5 * (1.0 - p3) + 0.2 * p3;
                  baseHeadRotX = 0.3 * (1.0 - p3);
                  
                  rArmRot = [-0.5 + p3 * -0.1, 0.1 * p3, 0.2 + p3 * 0.1];
                  rForeRot = [-1.0 + p3 * -1.0, 0, 0];
                  lArmRot = [-0.5 + p3 * -0.2, 0.2 * p3, -0.2 + p3 * -0.1];
                  lForeRot = [-1.0 + p3 * -1.2, 0, 0];
                  
                  rLegRot = [-0.8 + p3 * 0.5, 0, 0.3 + p3 * 0.05];
                  rShinRot = [1.0 - p3 * 0.5, 0, 0];
                  lLegRot = [-0.5 + p3 * 0.7, 0, -0.3 + p3 * -0.05];
                  lShinRot = [1.0 - p3 * 0.8, 0, 0];
              }
          }
          break;
      }

      case ActionType.INTRO_POWERUP: {
        // Dramatic power-up pose: chest open, flexed arms, charging aura energy
        const pulse = Math.sin(t * 3.5) * 0.02;
        hipY = 0.88 + pulse;
        spineRot[0] = -0.25;
        baseHeadRotX = -0.35; // Head looking up roaring/powering up
        rArmRot = [0.4, 0.3, 0.9];
        rForeRot = [-1.8, 0, 0];
        lArmRot = [0.4, -0.3, -0.9];
        lForeRot = [-1.8, 0, 0];
        rLegRot = [-0.4, 0.2, 0.4];
        rShinRot = [0.7, 0, 0];
        lLegRot = [0.4, -0.2, -0.4];
        lShinRot = [0.6, 0, 0];
        break;
      }

      case ActionType.INTRO_AURA: {
        // Floating celestial aura posture
        const float = Math.sin(t * 2.0) * 0.04;
        hipY = 1.05 + float;
        spineRot[0] = -0.1;
        baseHeadRotX = -0.15;
        rArmRot = [-0.8, 0.4, 1.1];
        rForeRot = [-0.8, 0, 0];
        lArmRot = [-0.8, -0.4, -1.1];
        lForeRot = [-0.8, 0, 0];
        rLegRot = [-0.2, 0, 0.2];
        rShinRot = [0.4, 0, 0];
        lLegRot = [0.2, 0, -0.2];
        lShinRot = [0.3, 0, 0];
        break;
      }

      case ActionType.INTRO_SALUTE: {
        // Elegant martial arts salute pose
        hipY = 0.95;
        spineRot[0] = 0.05;
        baseHeadRotX = 0;
        // Right fist at left palm in front of chest
        rArmRot = [-1.2, -0.5, 0.8];
        rForeRot = [-1.8, 0, 0];
        lArmRot = [-1.2, 0.5, -0.8];
        lForeRot = [-1.8, 0, 0];
        rLegRot = [-0.2, 0, 0.2];
        rShinRot = [0.3, 0, 0];
        lLegRot = [0.2, 0, -0.2];
        lShinRot = [0.3, 0, 0];
        break;
      }

      case ActionType.INTRO_TAUNT: {
        // Dramatic taunt pose: one arm pointing forward, chest proud
        hipY = 0.94;
        spineRot[0] = -0.15;
        spineRot[1] = 0.3;
        baseHeadRotX = -0.1;
        rArmRot = [-1.5, 0, 0.1]; // Right arm extended forward pointing
        rForeRot = [0, 0, 0];
        lArmRot = [0.5, 0, -0.4]; // Left arm resting at side hip
        lForeRot = [-0.8, 0, 0];
        rLegRot = [-0.3, 0.1, 0.3];
        rShinRot = [0.5, 0, 0];
        lLegRot = [0.3, -0.1, -0.3];
        lShinRot = [0.4, 0, 0];
        break;
      }

      case ActionType.INTRO_STANCE: {
        // Heroic focused combat stance pose
        hipY = 0.90;
        spineRot[0] = 0.25;
        baseHeadRotX = 0.1;
        rArmRot = [-0.8, 0.2, 0.5];
        rForeRot = [-2.2, 0, 0];
        lArmRot = [-0.9, -0.2, -0.5];
        lForeRot = [-2.2, 0, 0];
        rLegRot = [-0.5, 0.2, 0.4];
        rShinRot = [0.7, 0, 0];
        lLegRot = [0.4, -0.2, -0.4];
        lShinRot = [0.5, 0, 0];
        break;
      }

      case ActionType.DEAD: {
         const secondsElapsed = (Date.now() - actionStartTimeRef.current) / 1000;
         const fallT = Math.min(1.0, secondsElapsed / 0.6); // 0.6 second fall duration
         hipY = 0.96 - fallT * 0.82;
         hipRot[0] = -fallT * (Math.PI / 2); // Rotate to lay flat on back
         hipRot[1] = 0;
         hipRot[2] = 0;

         spineRot[0] = -0.3 * fallT;

         // Completely stiff straight limbs for a rigid knockout thud (tieso)
         rLegRot = [0, 0, 0.02];
         rShinRot = [0, 0, 0];
         lLegRot = [0, 0, -0.02];
         lShinRot = [0, 0, 0];

         rArmRot = [0, 0, 0.05];
         rForeRot = [0, 0, 0];
         lArmRot = [0, 0, -0.05];
         lForeRot = [0, 0, 0];

         baseHeadRotX = -0.4;
         break;
      }
    }

    // --- Dynamic Interpolation ---
    let rotLerp = 0.35;
    if (isAttacking) rotLerp = 0.85;
    if (isHit) rotLerp = 0.7;
    if (state.action === ActionType.UPPERCUT) rotLerp = 0.6; // Clean fluid punch drive
    if (state.action === ActionType.BEING_GRABBED) rotLerp = 0.15; // Smooth float
    if (state.action === ActionType.IDLE) rotLerp = 0.65; // Recover to guard stance quickly
    if (state.action === ActionType.IDLE && lastActionRef.current === ActionType.CROUCH) rotLerp = 0.75; // recover from crouch quickly!

    const setRot = (ref: React.RefObject<Group>, rot: number[]) => {
        if (!ref.current) return;
        ref.current.rotation.x += (rot[0] - ref.current.rotation.x) * rotLerp;
        ref.current.rotation.y += (rot[1] - ref.current.rotation.y) * rotLerp;
        ref.current.rotation.z += (rot[2] - ref.current.rotation.z) * rotLerp;
    };

    if (hipsRef.current) {
        hipsRef.current.position.y += (hipY - hipsRef.current.position.y) * rotLerp;
        setRot(hipsRef, hipRot);
    }

    // --- Fox Tail & Ears Physics Update ---
    const speedX = delta > 0 ? (latestState.position - lastXRef.current) / delta : 0;
    const speedY = delta > 0 ? (latestState.y - lastYRef.current) / delta : 0;
    lastXRef.current = latestState.position;
    lastYRef.current = latestState.y;

    if (isFox) {
        // Movement-based inertia forces for tail & ears
        const localSpeedZ = speedX * state.direction; // positive when moving forward
        const tailForceX = localSpeedZ * 0.15 + speedY * 0.12;
        const tailForceY = speedX * 0.15;

        const baseRotX = [0.35, 0.25, 0.15, -0.05, -0.15];
        const baseRotY = [0, 0, 0, 0, 0];

        tailJointsRef.current.forEach((joint, i) => {
            // Sinusoidal wave/wag based on activity
            let wave = Math.sin(t * 0.15 - i * 0.4) * 0.05;
            if (state.action === ActionType.RUN_FORWARD) {
                wave = Math.sin(t * 0.45 - i * 0.6) * 0.18;
            } else if (state.action === ActionType.MOVE_FORWARD) {
                wave = Math.sin(t * 0.3 - i * 0.5) * 0.11;
            }

            // Adjust tail angle for crouching or being dead
            let actionX = 0;
            if (state.action === ActionType.DEAD) {
                actionX = -0.5; // drape flat
            } else if (state.action === ActionType.CROUCH || state.action === ActionType.CROUCH_JAB || state.action === ActionType.LOW_KICK) {
                actionX = 0.3; // bend back
            }

            const targetX = baseRotX[i] + wave + tailForceX * (i + 1) * 0.15 + actionX;
            const targetY = baseRotY[i] + tailForceY * (i + 1) * 0.15;

            const springK = 0.05 + (4 - i) * 0.01; // softer base, very floppy tips for flaccid hanging effect
            const damping = 0.82;

            joint.velX = (joint.velX + (targetX - joint.rotX) * springK) * damping;
            joint.rotX += joint.velX;

            joint.velY = (joint.velY + (targetY - joint.rotY) * springK) * damping;
            joint.rotY += joint.velY;
        });

        // Apply tail rotations
        if (tail0Ref.current) { tail0Ref.current.rotation.x = tailJointsRef.current[0].rotX; tail0Ref.current.rotation.y = tailJointsRef.current[0].rotY; }
        if (tail1Ref.current) { tail1Ref.current.rotation.x = tailJointsRef.current[1].rotX; tail1Ref.current.rotation.y = tailJointsRef.current[1].rotY; }
        if (tail2Ref.current) { tail2Ref.current.rotation.x = tailJointsRef.current[2].rotX; tail2Ref.current.rotation.y = tailJointsRef.current[2].rotY; }
        if (tail3Ref.current) { tail3Ref.current.rotation.x = tailJointsRef.current[3].rotX; tail3Ref.current.rotation.y = tailJointsRef.current[3].rotY; }
        if (tail4Ref.current) { tail4Ref.current.rotation.x = tailJointsRef.current[4].rotX; tail4Ref.current.rotation.y = tailJointsRef.current[4].rotY; }

        // Ears physics calculations (sideways wobble and forward/backward flap)
        const earForceY = -speedX * 0.05;
        const earForceX = Math.abs(speedX) * 0.03 - speedY * 0.04;

        const targetREarZ = earForceY + (state.action === ActionType.HIT ? -0.15 : 0);
        const targetLEarZ = earForceY + (state.action === ActionType.HIT ? 0.15 : 0);
        const targetREarX = earForceX + (state.action === ActionType.HIT ? 0.25 : 0);
        const targetLEarX = earForceX + (state.action === ActionType.HIT ? 0.25 : 0);

        const earSpringK = 0.12;
        const earDamping = 0.8;

        const ears = earsPhysicsRef.current;
        ears.rVelZ = (ears.rVelZ + (targetREarZ - ears.rRotZ) * earSpringK) * earDamping;
        ears.rRotZ += ears.rVelZ;

        ears.lVelZ = (ears.lVelZ + (targetLEarZ - ears.lRotZ) * earSpringK) * earDamping;
        ears.lRotZ += ears.lVelZ;

        ears.rVelX = (ears.rVelX + (targetREarX - ears.rRotX) * earSpringK) * earDamping;
        ears.rRotX += ears.rVelX;

        ears.lVelX = (ears.lVelX + (targetLEarX - ears.lRotX) * earSpringK) * earDamping;
        ears.lRotX += ears.lVelX;

        if (rEarRef.current) { rEarRef.current.rotation.z = ears.rRotZ; rEarRef.current.rotation.x = ears.rRotX; }
        if (lEarRef.current) { lEarRef.current.rotation.z = ears.lRotZ; lEarRef.current.rotation.x = ears.lRotX; }
    }

    setRot(spineRef, spineRot);
    setRot(chestRef, chestRot);

    if (headRef.current &&
        state.action !== ActionType.DEAD &&
        state.action !== ActionType.KNOCKDOWN &&
        state.action !== ActionType.STUNNED &&
        state.action !== ActionType.THROWN) {

        let desiredHeadY = baseHeadRotY;
        let desiredHeadX = baseHeadRotX;
        let desiredHeadZ = 0;

        headRef.current.rotation.y += (desiredHeadY - headRef.current.rotation.y) * 0.3;
        headRef.current.rotation.x += (desiredHeadX - headRef.current.rotation.x) * 0.3;
        headRef.current.rotation.z += (desiredHeadZ - headRef.current.rotation.z) * 0.3;

    } else if (headRef.current) {
         setRot(headRef, [baseHeadRotX, baseHeadRotY, 0]);
    }

    setRot(rShoulderRef, rArmRot);
    setRot(rElbowRef, rForeRot);
    setRot(lShoulderRef, lArmRot);
    setRot(lElbowRef, lForeRot);

    setRot(rHipJointRef, rLegRot);
    setRot(rKneeRef, rShinRot);
    setRot(lHipJointRef, lLegRot);
    setRot(lKneeRef, lShinRot);

    // Apply dynamic joint/capsule deformations based on actual rotation angles!
    if (rElbowDeformRef.current) {
        const bend = Math.abs(rForeRot[0]);
        rElbowDeformRef.current.scale.set(1.0 + bend * 0.08, 1.0 - bend * 0.05, 1.0 + bend * 0.15);
        rElbowDeformRef.current.position.z = -bend * 0.015;
    }
    if (lElbowDeformRef.current) {
        const bend = Math.abs(lForeRot[0]);
        lElbowDeformRef.current.scale.set(1.0 + bend * 0.08, 1.0 - bend * 0.05, 1.0 + bend * 0.15);
        lElbowDeformRef.current.position.z = -bend * 0.015;
    }
    if (rKneeDeformRef.current) {
        const bend = Math.abs(rShinRot[0]);
        rKneeDeformRef.current.scale.set(1.0 + bend * 0.06, 1.0 - bend * 0.04, 1.0 + bend * 0.12);
        rKneeDeformRef.current.position.z = bend * 0.012;
    }
    if (lKneeDeformRef.current) {
        const bend = Math.abs(lShinRot[0]);
        lKneeDeformRef.current.scale.set(1.0 + bend * 0.06, 1.0 - bend * 0.04, 1.0 + bend * 0.12);
        lKneeDeformRef.current.position.z = bend * 0.012;
    }
    if (rShoulderDeformRef.current) {
        const bend = Math.sqrt(rArmRot[0] * rArmRot[0] + rArmRot[1] * rArmRot[1] + rArmRot[2] * rArmRot[2]);
        rShoulderDeformRef.current.scale.set(1.0 + bend * 0.05, 1.0 - bend * 0.03, 1.0 + bend * 0.08);
    }
    if (lShoulderDeformRef.current) {
        const bend = Math.sqrt(lArmRot[0] * lArmRot[0] + lArmRot[1] * lArmRot[1] + lArmRot[2] * lArmRot[2]);
        lShoulderDeformRef.current.scale.set(1.0 + bend * 0.05, 1.0 - bend * 0.03, 1.0 + bend * 0.08);
    }
    if (rHipDeformRef.current) {
        const bend = Math.sqrt(rLegRot[0] * rLegRot[0] + rLegRot[1] * rLegRot[1] + rLegRot[2] * rLegRot[2]);
        rHipDeformRef.current.scale.set(1.0 + bend * 0.05, 1.0 - bend * 0.03, 1.0 + bend * 0.08);
    }
    if (lHipDeformRef.current) {
        const bend = Math.sqrt(lLegRot[0] * lLegRot[0] + lLegRot[1] * lLegRot[1] + lLegRot[2] * lLegRot[2]);
        lHipDeformRef.current.scale.set(1.0 + bend * 0.05, 1.0 - bend * 0.03, 1.0 + bend * 0.08);
    }

    // --- Slide & Attack Ghost/Afterimage Trail Logic ---
    ghostTimerRef.current += delta;
    const hasTrail = state.action === ActionType.RUN_FORWARD;

    if (hasTrail) {
        // Every 35ms, capture true current 3D position snapshot
        if (ghostTimerRef.current > 0.035) {
            ghostTimerRef.current = 0;
            ghostPositionsRef.current[2] = { ...ghostPositionsRef.current[1] };
            ghostPositionsRef.current[1] = { ...ghostPositionsRef.current[0] };
            ghostPositionsRef.current[0] = {
                x: groupRef.current.position.x,
                y: groupRef.current.position.y + (hipsRef.current ? hipsRef.current.position.y : 0.96),
                rotY: groupRef.current.rotation.y,
                active: true,
                alpha: 0.75,
                action: state.action,
                direction: state.direction,
            };
        }
    } else {
        // Smoothly fade out active ghosts when high-speed movement ends
        ghostPositionsRef.current.forEach(g => {
            if (g.active) {
                g.alpha -= delta * 4.0;
                if (g.alpha <= 0) {
                    g.active = false;
                    g.alpha = 0;
                }
            }
        });
    }

    // Direct scene-graph updates to avoid React state overhead
    const ghosts = [ghost1Ref, ghost2Ref, ghost3Ref];
    ghostPositionsRef.current.forEach((g, idx) => {
        const ref = ghosts[idx];
        if (ref.current) {
            if (g.active) {
                ref.current.visible = true;

                // Position ghost at exact historical coordinate recorded when character moved
                ref.current.position.x = g.x;
                ref.current.position.y = g.y;
                ref.current.rotation.y = g.rotY;

                if (!ref.current.userData.materials) {
                    const mats: any[] = [];
                    ref.current.traverse((child: any) => {
                        if (child.isMesh && child.material) {
                            child.material.transparent = true;
                            mats.push(child.material);
                        }
                    });
                    ref.current.userData.materials = mats;
                }
                const ghostOpacity = Math.max(0, g.alpha * (0.85 - idx * 0.22));
                (ref.current.userData.materials as any[]).forEach((mat: any) => {
                    mat.opacity = ghostOpacity;
                });
            } else {
                ref.current.visible = false;
            }
        }
    });

    // Real-time Update for Ultra Charging Sphere (Matched to 1.0-second charge delay)
    const ultraElapsed = (Date.now() - actionStartTimeRef.current) / 1000;
    const isCharging = latestState.action === ActionType.SPECIAL_ULTIMATE && ultraElapsed < 1.0;
  });

  const mainColor = state.color;
  // James is no longer treated as 'IronJin' in terms of mechanical skins, he's human!
  const isIronJin = false;
  
  const ironJinRed = "#8b0000";
  const ironJinGray = "#6b7280";
  const ironJinDark = "#111111";

  const femaleRed = "#dc2626";
  const skinColor = "#e0ac69";
  const furryWhite = "#ffffff";

  const alienGray = "#4b5563"; // Darker gray for alien
  const alienPurple = "#800080";
  const celesteBlue = "#00f0ff";

  const mechaGoldColor = "#ffd700";
  const alternateSkin = "#cc0000";
  const lightGray = "#d1d5db";
  const darkGray = "#374151";

  const torsoColor = isAlternate ? alternateSkin : (isMechaGold ? mechaGoldColor : (isAlien ? darkGray : (isFox ? mainColor : (isFemale ? mainColor : subColor))));
  const pantsColor = isAlternate ? "#111" : (isMechaGold ? mechaGoldColor : (state.name === 'James' ? "#6b7280" : (isAlien ? darkGray : (isFemale ? mainColor : mainColor))));
  const armColor = isAlternate ? alternateSkin : (isMechaGold ? mechaGoldColor : (isAlien ? darkGray : mainColor));
  const shoulderColor = isAlternate ? alternateSkin : (isMechaGold ? mechaGoldColor : (isAlien ? darkGray : (isFox ? mainColor : (isFemale ? mainColor : subColor))));
  const legColor = isAlternate ? alternateSkin : (isMechaGold ? mechaGoldColor : (state.name === 'James' ? "#6b7280" : (isAlien ? alienPurple : mainColor)));
  const feetColor = isAlternate ? "#111" : (isMechaGold ? mechaGoldColor : (state.name === 'James' ? "#6b7280" : (isAlien ? alienPurple : (isFemale ? mainColor : (isFox ? subColor : "#111111")))));
  const shinColor = isAlternate ? alternateSkin : (isMechaGold ? mechaGoldColor : (state.name === 'James' ? "#6b7280" : (isAlien ? alienPurple : (isFox ? subColor : mainColor))));
  const handColor = isAlternate ? alternateSkin : (isMechaGold ? mechaGoldColor : (isAlien ? darkGray : (isFox ? subColor : skinColor)));
  const ankleColor = isFox ? furryWhite : shinColor;
  const headColor = isAlternate ? alternateSkin : (isMechaGold ? mechaGoldColor : (state.name === 'Ava' ? skinColor : (isAlien ? celesteBlue : mainColor)));
  const jointColor = isMechaGold ? "#b8860b" : "#111";

  // Get the texture type
  const textureType = isMechaGold ? 'MECHA' : (isAlien ? 'ALIEN' : (isFemale ? 'SAKURA' : 'CLASSIC'));

  // Create procedural textures matching each character
  const classicWhiteTexture = getProceduralTexture('CLASSIC', '#ffffff');
  const torsoTexture = isFox ? classicWhiteTexture : getProceduralTexture(textureType, torsoColor);
  const pantsTexture = isFox ? classicWhiteTexture : getProceduralTexture(textureType, pantsColor);
  // Alien's arms specifically use MECHA grey texture
  const armTexture = isFox ? classicWhiteTexture : getProceduralTexture(isAlien ? 'MECHA' : textureType, armColor);
  const shoulderTexture = isFox ? classicWhiteTexture : getProceduralTexture(isAlien ? 'MECHA' : textureType, shoulderColor);
  const legTexture = isFox ? classicWhiteTexture : getProceduralTexture(textureType, legColor);
  const feetTextureObj = isFox ? classicWhiteTexture : getProceduralTexture(textureType, feetColor);
  const shinTextureObj = isFox ? classicWhiteTexture : getProceduralTexture(textureType, shinColor);
  const handTextureObj = isFox ? classicWhiteTexture : getProceduralTexture(isAlien ? 'MECHA' : textureType, handColor);
  const ankleTexture = isFox ? classicWhiteTexture : getProceduralTexture(textureType, shinColor);

  const baseMaterial = isFemale
    ? { roughness: 0.1, metalness: 0.9 }
    : (isFox ? { roughness: 0.9, metalness: 0 } : (isAlien ? { roughness: 0.2, metalness: 0.8 } : (isMechaGold ? { roughness: 0.2, metalness: 0.8 } : { roughness: 0.6, metalness: 0 })));

  const avaMatProps = {};

  const isChargingLaser = state.action === ActionType.SPECIAL_ULTIMATE && (state.name === 'James' || isMechaGold);

  const actualHeadColor = isMechaGold ? torsoColor : (state.name === 'Ava' ? skinColor : (isAlien ? headColor : (isFox ? pantsColor : (isOsbamo ? pantsColor : headColor))));
  const npcAura = useGameStore(s => s.npcAura);

  return (
    <>
    <group ref={groupRef} position={[who === 'player' ? -1.5 : 1.5, 0, 0]}>
        {who === 'enemy' && npcAura && (
            <NpcAura3D 
              type={npcAura.type} 
              color={npcAura.color} 
              active={state.action !== ActionType.DEAD && state.action !== ActionType.KNOCKDOWN && state.action !== ActionType.LAYING_FLAT && state.action !== ActionType.THROWN}
            />
        )}
        <group ref={hipsRef}>
            {(isFemale || isAlien) && (
                <group ref={glutesGroupRef} position={[0, -0.015, -0.11]}>
                    {/* Beautiful Glutes curves (Larger) */}
                    <mesh position={[-0.055, 0, 0]} scale={[0.18, 0.18, 0.18]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial
                            color={pantsColor}
                            map={texturesEnabled ? pantsTexture : null}
                            {...baseMaterial}
                        />
                    </mesh>
                    <mesh position={[0.055, 0, 0]} scale={[0.18, 0.18, 0.18]}>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial
                            color={pantsColor}
                            map={texturesEnabled ? pantsTexture : null}
                            {...baseMaterial}
                        />
                    </mesh>
                </group>
            )}
            {/* Pelvis/Hips: aligned with belly capsule geometry for perfect seamless proportions */}
            <mesh position={[0, 0, 0]} scale={[1.1, 0.95, 1.1]} rotation={[0, -state.direction * Math.PI / 2, 0]}>
                <capsuleGeometry args={[0.12, 0.05, 8, 16]} />
                <meshStandardMaterial
                    color={pantsColor}
                    map={texturesEnabled ? pantsTexture : null}
                    {...baseMaterial}
                />
            </mesh>
            {isFox && (
                <group ref={tail0Ref} position={[0, 0.05, -0.12]}>
                    {/* Segment 0 */}
                    <mesh position={[0, -0.09, 0]}>
                        <capsuleGeometry args={[0.13, 0.09, 8, 16]} />
                        <meshStandardMaterial color={mainColor} map={texturesEnabled ? torsoTexture : null} roughness={0.7} />
                    </mesh>
                    <group ref={tail1Ref} position={[0, -0.16, 0]}>
                        {/* Segment 1: Wood grain, as requested */}
                        <mesh position={[0, -0.09, 0]}>
                            <capsuleGeometry args={[0.155, 0.08, 8, 16]} />
                            <meshStandardMaterial color={mainColor} map={texturesEnabled ? torsoTexture : null} roughness={0.7} />
                        </mesh>
                        <group ref={tail2Ref} position={[0, -0.16, 0]}>
                            {/* Segment 2 */}
                            <mesh position={[0, -0.09, 0]}>
                                <capsuleGeometry args={[0.16, 0.07, 8, 16]} />
                                <meshStandardMaterial color={mainColor} map={texturesEnabled ? torsoTexture : null} roughness={0.7} />
                            </mesh>
                            <group ref={tail3Ref} position={[0, -0.15, 0]}>
                                {/* Segment 3 (White Part of Tail Tip) */}
                                <mesh position={[0, -0.08, 0]}>
                                    <capsuleGeometry args={[0.135, 0.08, 8, 16]} />
                                    <meshStandardMaterial color={furryWhite} map={getProceduralTexture('CLASSIC', furryWhite)} roughness={0.7} />
                                </mesh>
                                <group ref={tail4Ref} position={[0, -0.14, 0]}>
                                    {/* Segment 4 (White Tip) */}
                                    <mesh position={[0, -0.07, 0]}>
                                        <capsuleGeometry args={[0.095, 0.07, 8, 16]} />
                                        <meshStandardMaterial color={furryWhite} map={getProceduralTexture('CLASSIC', furryWhite)} roughness={0.7} />
                                    </mesh>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            )}

            {/* Demon Tail for Alternate */}
            {isAlternate && (
                <group position={[0, 0.05, -0.12]} rotation={[0.8, 0, 0]}>
                   {[...Array(15)].map((_, i) => (
                       <mesh key={i} position={[Math.sin(animTime.current * 3 + i * 0.3) * 0.08, -i * 0.1, -Math.cos(i * 0.2) * 0.05]} rotation={[0.4, 0, 0]}>
                           <sphereGeometry args={[0.07 - i * 0.003, 8, 8]} />
                           <meshStandardMaterial color="#cc0000" />
                       </mesh>
                   ))}
                   {/* Pointy tip */}
                   <mesh position={[Math.sin(animTime.current * 3 + 15 * 0.3) * 0.08, -15 * 0.1, -Math.cos(15 * 0.2) * 0.05]} rotation={[Math.PI, 0, 0]}>
                       <coneGeometry args={[0.06, 0.2, 8]} />
                       <meshStandardMaterial color="#111" />
                   </mesh>
                </group>
            )}
            <group ref={spineRef} position={[0, 0.08, 0]}>
                 {/* Spine/Abdomen: slender, athletic profile */}
                 <mesh position={[0, 0.12, 0]} scale={[1.1, 1.1, 1.1]} rotation={[0, -state.direction * Math.PI / 2, 0]}>
                    <capsuleGeometry args={[0.12, 0.12, 8, 16]} />
                    <meshStandardMaterial color={torsoColor} map={texturesEnabled ? torsoTexture : null} {...baseMaterial} />
                 </mesh>
                 {/* Navel / Ombligo - Hidden for James and Alternate as requested */}
                 {!(state.name === 'James' || isAlternate) && (
                     <mesh position={[0, 0.18, 0.125]} scale={[0.025, 0.035, 0.015]}>
                        <sphereGeometry args={[1, 8, 8]} />
                        <meshStandardMaterial color={isAlien ? "#1e293b" : "#b07d4f"} roughness={0.9} />
                     </mesh>
                 )}
                 {isFox && (
                      <>
                           {/* Fluffy stomach fur: capsule matching the spine geometry for seamless blending */}
                           <mesh position={[0, 0.13, 0.05]} scale={[1.12, 1.05, 0.65]} rotation={[0, -state.direction * Math.PI / 2, 0]}>
                               <capsuleGeometry args={[0.12, 0.12, 8, 16]} />
                               <meshStandardMaterial color={furryWhite} roughness={0.9} />
                           </mesh>
                      </>
                 )}
                 <group ref={chestRef} position={[0, 0.31, 0]}>
                     {(isFemale || isAlien) && (
                          <group ref={breastsGroupRef} position={[0, 0.14, 0.11]} rotation={[0.15, 0, 0]}>
                              {/* Left breast */}
                              <mesh position={[-0.055, 0, 0.01]} scale={[0.17, 0.17, 0.18]}>
                                  <sphereGeometry args={[1, 16, 16]} />
                                  <meshStandardMaterial color={torsoColor} map={texturesEnabled ? torsoTexture : null} {...baseMaterial} />
                               </mesh>
                               {/* Right breast */}
                               <mesh position={[0.055, 0, 0.01]} scale={[0.17, 0.17, 0.18]}>
                                   <sphereGeometry args={[1, 16, 16]} />
                                   <meshStandardMaterial color={torsoColor} map={texturesEnabled ? torsoTexture : null} {...baseMaterial} />
                               </mesh>
                          </group>
                     )}
                     {/* Chest/Torso: athletic capsule geometry for powerful proportions */}
                    <mesh position={[0, 0.14, 0]} scale={[1.15, 1.12, 1.15]} rotation={[0, -state.direction * Math.PI / 2, 0]}>
                       <capsuleGeometry args={[0.125, 0.14, 8, 16]} />
                       <meshStandardMaterial
                           color={torsoColor}
                           map={texturesEnabled ? torsoTexture : null}
                           {...baseMaterial}
                       />
                    </mesh>
                    {isFox && (
                        <>
                             {/* Fluffy neck collar fur: capsule matching the chest geometry for seamless blending */}
                             <mesh position={[0, 0.10, 0.05]} scale={[1.18, 1.05, 0.7]} rotation={[0, -state.direction * Math.PI / 2, 0]}>
                                 <capsuleGeometry args={[0.125, 0.14, 8, 16]} />
                                 <meshStandardMaterial color={furryWhite} roughness={0.9} />
                             </mesh>
                        </>
                    )}

                    {/* Energy Ball Charging Effect removed */}

                    <group ref={headRef} position={[0, 0.35, 0]}>
                        <mesh position={[0, -0.05, 0]}>
                             <cylinderGeometry args={[0.08, 0.09, 0.15, 8]} />
                             <meshStandardMaterial
                                color={isMechaGold ? torsoColor : (state.name === 'Ava' ? skinColor : (isAlien ? headColor : (isFox ? pantsColor : (isOsbamo ? pantsColor : headColor))))}
                                map={isMechaGold ? torsoTexture : (state.name === 'Ava' ? undefined : (isFemale ? torsoTexture : (isFox ? torsoTexture : undefined)))}
                                roughness={state.name === 'Ava' ? 1.0 : (isAlien ? 0.9 : baseMaterial.roughness)}
                                metalness={state.name === 'Ava' ? 0.0 : (isAlien ? 0.0 : baseMaterial.metalness)}
                             />
                        </mesh>
                        <mesh position={[0, 0.12, 0]}>
                             <sphereGeometry args={[0.14, 24, 24]} />
                             <meshStandardMaterial
                                color={isMechaGold ? torsoColor : (state.name === 'Ava' ? skinColor : (isAlien ? headColor : (isFox ? pantsColor : (isOsbamo ? pantsColor : headColor))))}
                                map={isMechaGold ? torsoTexture : (state.name === 'Ava' ? undefined : (isFemale ? torsoTexture : (isFox ? torsoTexture : undefined)))}
                                roughness={state.name === 'Ava' ? 1.0 : (isAlien ? 0.9 : baseMaterial.roughness)}
                                metalness={state.name === 'Ava' ? 0.0 : (isAlien ? 0.0 : baseMaterial.metalness)}
                             />
                        </mesh>

                        {isFox && (
                            /* Lower Head Wood Fur - colored pure white as requested */
                            <mesh position={[0, 0.07, 0.035]} scale={[1.01, 0.55, 1.01]}>
                                 <sphereGeometry args={[0.14, 24, 24]} />
                                 <meshStandardMaterial color="#ffffff" roughness={0.8} />
                             </mesh>
                        )}
                        {isFox ? (
                            <>


                                {/* Premium Eye design matching the user's reference exactly for Fox */}
                                <group position={[0.055, 0.14, 0.145]}>
                                    <FighterEye isLeft={false} scale={1.25} irisColor="#ffcc00" skinColor={actualHeadColor} isChargingLaser={isChargingLaser} who={who} />
                                    {/* Eye-brows to keep character expression determined */}
                                    <mesh position={[0, 0.045, 0.005]} rotation={[0, 0, 0.15]} scale={[0.048, 0.012, 0.005]}>
                                        <boxGeometry args={[1, 1, 1]} />
                                        <meshStandardMaterial color="#1e293b" />
                                    </mesh>
                                </group>
                                <group position={[-0.055, 0.14, 0.145]}>
                                    <FighterEye isLeft={true} scale={1.25} irisColor="#ffcc00" skinColor={actualHeadColor} isChargingLaser={isChargingLaser} who={who} />
                                    <mesh position={[0, 0.045, 0.005]} rotation={[0, 0, -0.15]} scale={[0.048, 0.012, 0.005]}>
                                        <boxGeometry args={[1, 1, 1]} />
                                        <meshStandardMaterial color="#1e293b" />
                                    </mesh>
                                </group>

                                {/* Snout/Muzzle - white, as requested */}
                                <mesh position={[0, 0.08, 0.13]} scale={[1.05, 0.8, 1.15]}>
                                    <sphereGeometry args={[0.06, 16, 16]} />
                                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.15} roughness={0.7} />
                                </mesh>
                                {/* Small Black Nose */}
                                <mesh position={[0, 0.11, 0.19]}>
                                    <sphereGeometry args={[0.012, 8, 8]} />
                                    <meshStandardMaterial color="#111111" roughness={0.9} />
                                </mesh>
                                <mesh position={[0, 0.05, 0.115]} scale={[0.85, 0.6, 0.8]} rotation={[0.15, 0, 0]}>
                                    <sphereGeometry args={[0.025, 16, 16]} />
                                    <meshStandardMaterial color="#330005" roughness={0.8} />
                                </mesh>

                                {/* Wobbling Ears with White Inside */}
                                <group ref={rEarRef} position={[0.1, 0.24, 0]}>
                                    <mesh rotation={[0, 0, -0.3]}>
                                        <coneGeometry args={[0.05, 0.15, 16]} />
                                        <meshStandardMaterial color={mainColor} roughness={0.9} />
                                    </mesh>
                                    <mesh position={[0, -0.01, 0.02]} rotation={[0, 0, -0.3]}>
                                        <coneGeometry args={[0.04, 0.12, 16]} />
                                        <meshStandardMaterial color={furryWhite} roughness={0.9} />
                                    </mesh>
                                </group>
                                <group ref={lEarRef} position={[-0.1, 0.24, 0]}>
                                    <mesh rotation={[0, 0, 0.3]}>
                                        <coneGeometry args={[0.05, 0.15, 16]} />
                                        <meshStandardMaterial color={mainColor} roughness={0.9} />
                                    </mesh>
                                    <mesh position={[0, -0.01, 0.02]} rotation={[0, 0, 0.3]}>
                                        <coneGeometry args={[0.04, 0.12, 16]} />
                                        <meshStandardMaterial color={furryWhite} roughness={0.9} />
                                    </mesh>
                                </group>
                            </>
                        ) : (
                             <>
                                {/* Premium Eye design matching Osbamo structure exactly for all characters */}
                                <group position={[0.055, 0.14, 0.145]}>
                                    <FighterEye 
                                        isLeft={false} 
                                        scale={1.25} 
                                        irisColor={isAlien ? "#9b59b6" : (isMechaGold ? "#ff0000" : (isAlternate ? "#dc2626" : (isFemale ? "#ff66b2" : (state.name === 'James' || state.name === 'Jin' ? "#2563eb" : "#8B4513"))))} 
                                        skinColor={actualHeadColor} 
                                        isChargingLaser={isChargingLaser} 
                                        who={who} 
                                        isAlien={isAlien} 
                                    />
                                    {/* Eyebrow matching Osbamo expression */}
                                    <mesh position={[0, 0.045, 0.005]} rotation={[0, 0, 0.15]} scale={[0.048, 0.012, 0.005]}>
                                        <boxGeometry args={[1, 1, 1]} />
                                        <meshStandardMaterial color={state.name === 'Ava' ? "#2d1a24" : "#1e293b"} />
                                    </mesh>
                                </group>
                                <group position={[-0.055, 0.14, 0.145]}>
                                    <FighterEye 
                                        isLeft={true} 
                                        scale={1.25} 
                                        irisColor={isAlien ? "#9b59b6" : (isMechaGold ? "#ff0000" : (isAlternate ? "#dc2626" : (isFemale ? "#ff66b2" : (state.name === 'James' || state.name === 'Jin' ? "#2563eb" : "#8B4513"))))} 
                                        skinColor={actualHeadColor} 
                                        isChargingLaser={isChargingLaser} 
                                        who={who} 
                                        isAlien={isAlien} 
                                    />
                                    <mesh position={[0, 0.045, 0.005]} rotation={[0, 0, -0.15]} scale={[0.048, 0.012, 0.005]}>
                                        <boxGeometry args={[1, 1, 1]} />
                                        <meshStandardMaterial color={state.name === 'Ava' ? "#2d1a24" : "#1e293b"} />
                                    </mesh>
                                </group>

                                 {(state.name === 'James' || state.name === 'Jin' || state.name.toLowerCase().includes('james')) && (
                                      <group position={[0, 0.19, 0]}>
                                          {/* Base Head Hair Scalp Cap */}
                                          <mesh scale={[1.12, 1.05, 1.15]} position={[0, 0.02, -0.01]}>
                                              <sphereGeometry args={[0.13, 16, 16]} />
                                              <meshStandardMaterial color="#1a120b" roughness={0.7} metalness={0.1} />
                                          </mesh>

                                          {/* Spiky Hero Hair Model */}
                                          {/* Front Bang Spikes */}
                                          <mesh position={[0, 0.07, 0.01]} scale={[1.1, 0.7, 1.15]}>
                                               <sphereGeometry args={[0.12, 20, 20]} />
                                               <meshStandardMaterial color="#22160d" roughness={0.5} metalness={0.1} />
                                           </mesh>
                                           <mesh position={[0, 0.08, 0.08]} rotation={[0.2, 0, 0]} scale={[1.15, 0.5, 0.6]}>
                                              <sphereGeometry args={[0.09, 16, 16]} />
                                              <meshStandardMaterial color="#24180e" roughness={0.5} metalness={0.2} />
                                          </mesh>
                                           {/* Sideburns and Side Taper */}
                                           <mesh position={[-0.12, -0.01, 0.03]} rotation={[0.1, 0, 0.15]}>
                                               <boxGeometry args={[0.025, 0.12, 0.05]} />
                                               <meshStandardMaterial color="#1a120b" roughness={0.6} />
                                           </mesh>
                                           <mesh position={[0.12, -0.01, 0.03]} rotation={[0.1, 0, -0.15]}>
                                               <boxGeometry args={[0.025, 0.12, 0.05]} />
                                               <meshStandardMaterial color="#1a120b" roughness={0.6} />
                                           </mesh>

                                           {/* Back Nape Taper */}
                                           <mesh position={[0, 0.01, -0.07]} scale={[1.08, 0.8, 0.8]}>
                                               <sphereGeometry args={[0.11, 16, 16]} />
                                               <meshStandardMaterial color="#180f08" roughness={0.6} />
                                           </mesh>
                                      </group>
                                  )}

                                 {/* Alternate / Demon Horns */}
                                 {isAlternate && (
                                      <group position={[0, 0.18, 0.06]}>
                                         <group position={[-0.08, 0.05, -0.05]} rotation={[0.4, 0, 0.6]}>
                                             <mesh>
                                                 <coneGeometry args={[0.06, 0.4, 12]} />
                                                 <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
                                             </mesh>
                                             <mesh position={[0, 0.18, 0.05]} rotation={[0.5, 0, 0]}>
                                                 <coneGeometry args={[0.04, 0.25, 12]} />
                                                 <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
                                             </mesh>
                                         </group>
                                         <group position={[0.08, 0.05, -0.05]} rotation={[0.4, 0, -0.6]}>
                                             <mesh>
                                                 <coneGeometry args={[0.06, 0.4, 12]} />
                                                 <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
                                             </mesh>
                                             <mesh position={[0, 0.18, 0.05]} rotation={[0.5, 0, 0]}>
                                                 <coneGeometry args={[0.04, 0.25, 12]} />
                                                 <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
                                             </mesh>
                                         </group>
                                     </group>
                                 )}

                                {state.name === 'Ava' && (
                                     <group position={[0, 0.07, 0]}>
                                        {/* Base Hair Cap covering top, crown, and back of head for realism */}
                                        <mesh position={[0, 0.14, -0.02]} scale={[1.15, 1.1, 1.12]}>
                                            <sphereGeometry args={[0.13, 20, 20]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.3} metalness={0.1} />
                                        </mesh>
                                        {/* Hair Volume back mass (occipital area) */}
                                        <mesh position={[0, 0.07, -0.08]} scale={[1.08, 1.05, 1.05]}>
                                            <sphereGeometry args={[0.12, 16, 16]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.35} metalness={0.1} />
                                        </mesh>

                                        {/* Forehead Bangs / Fringe to cover head nicely and look feminine */}
                                        <mesh position={[0, 0.17, 0.1]} rotation={[0.25, 0, 0]} scale={[1.05, 0.5, 0.5]}>
                                            <sphereGeometry args={[0.11, 16, 16]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.3} />
                                        </mesh>
                                        {/* Front center strand hanging down slightly */}
                                        <mesh position={[0, 0.12, 0.125]} rotation={[0.4, 0, 0]} scale={[0.03, 0.07, 0.02]}>
                                            <sphereGeometry args={[1, 8, 8]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.3} />
                                        </mesh>
                                        {/* Left front framing piece */}
                                        <mesh position={[-0.06, 0.13, 0.12]} rotation={[0.3, 0, 0.15]} scale={[0.035, 0.08, 0.02]}>
                                            <sphereGeometry args={[1, 8, 8]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.3} />
                                        </mesh>
                                        {/* Right front framing piece */}
                                        <mesh position={[0.06, 0.13, 0.12]} rotation={[0.3, 0, -0.15]} scale={[0.035, 0.08, 0.02]}>
                                            <sphereGeometry args={[1, 8, 8]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.3} />
                                        </mesh>

                                        {/* Long side-framing hair hime-cut cheek strands */}
                                        <mesh position={[-0.12, 0.04, 0.06]} rotation={[0.15, 0, 0.05]} scale={[0.03, 0.14, 0.02]}>
                                            <sphereGeometry args={[1, 8, 8]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.3} />
                                        </mesh>
                                        <mesh position={[0.12, 0.04, 0.06]} rotation={[0.15, 0, -0.05]} scale={[0.03, 0.14, 0.02]}>
                                            <sphereGeometry args={[1, 8, 8]} />
                                            <meshStandardMaterial color="#ff007f" roughness={0.3} />
                                        </mesh>

                                        {/* Glowing Neon Pink Sakura Hair Flowers / Ribbons on her head */}
                                        <mesh position={[0.08, 0.22, 0.03]} rotation={[0, 0, -0.4]}>
                                            <sphereGeometry args={[0.045, 8, 8]} />
                                            <meshBasicMaterial color="#ff007f" />
                                        </mesh>
                                        <mesh position={[-0.08, 0.22, 0.03]} rotation={[0, 0, 0.4]}>
                                            <sphereGeometry args={[0.045, 8, 8]} />
                                            <meshBasicMaterial color="#ff007f" />
                                        </mesh>

                                         {/* Segmented pink hair strands with physics, as requested */}
                                        <group position={[0.08, 0.20, -0.05]}>{renderSegmentedHair(0, 12, true, "#ff007f")}</group>
                                        <group position={[-0.08, 0.20, -0.05]}>{renderSegmentedHair(0, 12, false, "#ff007f")}</group>

                                        {/* Glowing acid charge in mouth when using ultimate */}
                                        {state.action === ActionType.SPECIAL_ULTIMATE && (
                                             <mesh position={[0, 0.06, 0.12]}>
                                                 <sphereGeometry args={[0.05, 12, 12]} />
                                                 <meshBasicMaterial color="#39ff14" />
                                             </mesh>
                                         )}
                                     </group>
                                )}

                                {/* Alien-specific Head features */}
                                {isAlien && (
                                     <>
                                         {/* Alien sci-fi bio-antennae */}
                                        <group position={[0.08, 0.23, 0.02]} rotation={[0.3, 0, -0.35]}>
                                            <mesh>
                                                <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
                                                <meshStandardMaterial color={celesteBlue} roughness={0.9} metalness={0.0} />
                                            </mesh>
                                            <mesh position={[0, 0.1, 0]}>
                                                <sphereGeometry args={[0.025, 8, 8]} />
                                                <meshBasicMaterial color={celesteBlue} />
                                            </mesh>
                                        </group>
                                        <group position={[-0.08, 0.23, 0.02]} rotation={[0.3, 0, 0.35]}>
                                            <mesh>
                                                <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
                                                <meshStandardMaterial color={celesteBlue} roughness={0.9} metalness={0.0} />
                                            </mesh>
                                            <mesh position={[0, 0.1, 0]}>
                                                <sphereGeometry args={[0.025, 8, 8]} />
                                                <meshBasicMaterial color={celesteBlue} />
                                            </mesh>
                                        </group>

                                        {/* Removed cybernetic hair cables for Ko-al */}
                                         <FighterMouth who={who} scale={1} isFox={isFox} />
                                         {/* */}

                                        {/* Glowing alien cyan laser charge in mouth/eyes when using ultimate */}
                                        {state.action === ActionType.SPECIAL_ULTIMATE && (
                                             <mesh position={[0, 0.06, 0.12]}>
                                                 <sphereGeometry args={[0.05, 12, 12]} />
                                                 <meshBasicMaterial color="#00ffff" />
                                             </mesh>
                                         )}
                                     </>
                                )}
                                 {/* Universal Mouth */}
                                 <FighterMouth who={who} scale={1} isFox={isFox} />
                             </>
                        )}
                    </group>
                    <group ref={rShoulderRef} position={[0.20, 0.20, 0]}>
                        <mesh>
                           <sphereGeometry args={[0.13, 16, 16]} />
                           <meshStandardMaterial color={shoulderColor} map={texturesEnabled ? shoulderTexture : null} {...baseMaterial} />
                        </mesh>
                        {/* Deforming Shoulder Tube Union */}
                        <group ref={rShoulderDeformRef} position={[0, -0.05, 0]} visible={false}>
                             <mesh scale={[1.05, 0.4, 1.05]}>
                                 <torusGeometry args={[0.095, 0.018, 8, 16]} />
                                 <meshStandardMaterial color={jointColor} roughness={0.5} />
                             </mesh>
                             <mesh position={[0, 0.035, 0]} scale={[1.0, 0.06, 1.0]} rotation={[0.08, 0, 0]}>
                                 <cylinderGeometry args={[0.10, 0.11, 1, 8]} />
                                 <meshStandardMaterial color={shoulderColor} map={texturesEnabled ? shoulderTexture : null} {...baseMaterial} />
                             </mesh>
                             <mesh position={[0, -0.035, 0]} scale={[0.95, 0.06, 0.95]} rotation={[-0.08, 0, 0]}>
                                 <cylinderGeometry args={[0.10, 0.09, 1, 8]} />
                                 <meshStandardMaterial color={armColor} map={texturesEnabled ? armTexture : null} {...baseMaterial} />
                             </mesh>
                        </group>
                        {isIronJin && (
                            <mesh position={[0.08, 0.08, 0]} rotation={[0, 0, -Math.PI / 4]}>
                                <coneGeometry args={[0.035, 0.16, 8]} />
                                <meshStandardMaterial color="#18181b" metalness={0.9} roughness={0.1} />
                            </mesh>
                        )}
                        <mesh position={[0, -0.125, 0]}>
                           <capsuleGeometry args={[0.08, 0.09, 8, 16]} />
                           <meshStandardMaterial color={armColor} map={texturesEnabled ? armTexture : null} {...baseMaterial} />
                        </mesh>
                        <group ref={rElbowRef} position={[0, -0.25, 0]}>
                             <mesh>
                                <sphereGeometry args={[0.08, 16, 16]} />
                                <meshStandardMaterial color={isFox ? subColor : armColor} map={isFox ? classicWhiteTexture : armTexture} {...baseMaterial} />
                             </mesh>
                             {/* Deforming Joint Tube Union */}
                             <group ref={rElbowDeformRef} visible={false}>
                                 {/* Central bulge ring */}
                                 <mesh scale={[1.05, 0.4, 1.05]}>
                                     <torusGeometry args={[0.075, 0.015, 8, 16]} />
                                     <meshStandardMaterial color={jointColor} roughness={0.5} />
                                 </mesh>
                                 {/* Upper transition tube */}
                                 <mesh position={[0, 0.035, 0]} scale={[1.0, 0.06, 1.0]} rotation={[0.1, 0, 0]}>
                                     <cylinderGeometry args={[0.08, 0.085, 1, 8]} />
                                     <meshStandardMaterial color={armColor} roughness={0.7} />
                                 </mesh>
                                 {/* Lower transition tube */}
                                 <mesh position={[0, -0.035, 0]} scale={[0.95, 0.06, 0.95]} rotation={[-0.1, 0, 0]}>
                                     <cylinderGeometry args={[0.08, 0.075, 1, 8]} />
                                     <meshStandardMaterial color={armColor} roughness={0.7} />
                                 </mesh>
                             </group>
                             {isFox && (
                                <group position={[0, -0.03, 0]}>
                                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                                        <torusGeometry args={[0.075, 0.015, 8, 16]} />
                                        <meshStandardMaterial color={subColor} map={classicWhiteTexture} roughness={0.8} />
                                    </mesh>
                                </group>
                             )}
                             <mesh position={[0, -0.125, 0]}>
                                <capsuleGeometry args={[0.07, 0.11, 8, 16]} />
                                <meshStandardMaterial color={isFox ? subColor : armColor} map={isFox ? classicWhiteTexture : armTexture} {...baseMaterial} />
                             </mesh>
                             {/* Anatomical Wrist / Muñeca Derecha */}
                             <group position={[0, -0.21, 0]}>
                                 <mesh>
                                     <sphereGeometry args={[0.068, 12, 12]} />
                                     <meshStandardMaterial color={isFox ? subColor : armColor} map={isFox ? classicWhiteTexture : armTexture} {...baseMaterial} />
                                 </mesh>
                                 <mesh rotation={[Math.PI / 2, 0, 0]}>
                                     <torusGeometry args={[0.068, 0.012, 8, 16]} />
                                     <meshStandardMaterial color={isFox ? subColor : armColor} roughness={baseMaterial.roughness} metalness={baseMaterial.metalness} />
                                 </mesh>
                             </group>
                             <FighterFist
                                isLeft={false}
                                action={state.action}
                                color={isIronJin ? ironJinRed : (isFox ? subColor : handColor)}
                                map={isMechaGold ? torsoTexture : (isFox ? classicWhiteTexture : (isFemale ? getProceduralTexture("SAKURA", mainColor) : undefined))}
                                roughness={baseMaterial.roughness}
                                metalness={baseMaterial.metalness}
                             />
                        </group>
                    </group>
                    <group ref={lShoulderRef} position={[-0.20, 0.20, 0]}>
                        <mesh>
                           <sphereGeometry args={[0.13, 16, 16]} />
                           <meshStandardMaterial color={shoulderColor} map={texturesEnabled ? shoulderTexture : null} {...baseMaterial} />
                        </mesh>
                        {/* Deforming Shoulder Tube Union */}
                        <group ref={lShoulderDeformRef} position={[0, -0.05, 0]} visible={false}>
                             <mesh scale={[1.05, 0.4, 1.05]}>
                                 <torusGeometry args={[0.095, 0.018, 8, 16]} />
                                 <meshStandardMaterial color={jointColor} roughness={0.5} />
                             </mesh>
                             <mesh position={[0, 0.035, 0]} scale={[1.0, 0.06, 1.0]} rotation={[-0.08, 0, 0]}>
                                 <cylinderGeometry args={[0.10, 0.11, 1, 8]} />
                                 <meshStandardMaterial color={shoulderColor} map={texturesEnabled ? shoulderTexture : null} {...baseMaterial} />
                             </mesh>
                             <mesh position={[0, -0.035, 0]} scale={[0.95, 0.06, 0.95]} rotation={[0.08, 0, 0]}>
                                 <cylinderGeometry args={[0.10, 0.09, 1, 8]} />
                                 <meshStandardMaterial color={armColor} map={texturesEnabled ? armTexture : null} {...baseMaterial} />
                             </mesh>
                        </group>
                        {isIronJin && (
                            <mesh position={[-0.08, 0.08, 0]} rotation={[0, 0, Math.PI / 4]}>
                                <coneGeometry args={[0.035, 0.16, 8]} />
                                <meshStandardMaterial color="#18181b" metalness={0.9} roughness={0.1} />
                            </mesh>
                        )}
                        <mesh position={[0, -0.125, 0]}>
                           <capsuleGeometry args={[0.08, 0.09, 8, 16]} />
                           <meshStandardMaterial color={armColor} map={texturesEnabled ? armTexture : null} {...baseMaterial} />
                        </mesh>
                        <group ref={lElbowRef} position={[0, -0.25, 0]}>
                             <mesh>
                                <sphereGeometry args={[0.08, 16, 16]} />
                                <meshStandardMaterial color={isFox ? subColor : armColor} map={isFox ? classicWhiteTexture : armTexture} {...baseMaterial} />
                             </mesh>
                             {/* Deforming Joint Tube Union */}
                             <group ref={lElbowDeformRef} visible={false}>
                                 {/* Central bulge ring */}
                                 <mesh scale={[1.05, 0.4, 1.05]}>
                                     <torusGeometry args={[0.075, 0.015, 8, 16]} />
                                     <meshStandardMaterial color={jointColor} roughness={0.5} />
                                 </mesh>
                                 {/* Upper transition tube */}
                                 <mesh position={[0, 0.035, 0]} scale={[1.0, 0.06, 1.0]} rotation={[0.1, 0, 0]}>
                                     <cylinderGeometry args={[0.08, 0.085, 1, 8]} />
                                     <meshStandardMaterial color={armColor} roughness={0.7} />
                                 </mesh>
                                 {/* Lower transition tube */}
                                 <mesh position={[0, -0.035, 0]} scale={[0.95, 0.06, 0.95]} rotation={[-0.1, 0, 0]}>
                                     <cylinderGeometry args={[0.08, 0.075, 1, 8]} />
                                     <meshStandardMaterial color={armColor} roughness={0.7} />
                                 </mesh>
                             </group>
                             {isFox && (
                                <group position={[0, -0.03, 0]}>
                                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                                        <torusGeometry args={[0.075, 0.015, 8, 16]} />
                                        <meshStandardMaterial color={subColor} map={classicWhiteTexture} roughness={0.8} />
                                    </mesh>
                                </group>
                             )}
                             <mesh position={[0, -0.125, 0]}>
                                <capsuleGeometry args={[0.07, 0.11, 8, 16]} />
                                <meshStandardMaterial color={isFox ? subColor : armColor} map={isFox ? classicWhiteTexture : armTexture} {...baseMaterial} />
                             </mesh>
                             {/* Anatomical Wrist / Muñeca Izquierda */}
                             <group position={[0, -0.21, 0]}>
                                 <mesh>
                                     <sphereGeometry args={[0.068, 12, 12]} />
                                     <meshStandardMaterial color={isFox ? subColor : armColor} map={isFox ? classicWhiteTexture : armTexture} {...baseMaterial} />
                                 </mesh>
                                 <mesh rotation={[Math.PI / 2, 0, 0]}>
                                     <torusGeometry args={[0.068, 0.012, 8, 16]} />
                                     <meshStandardMaterial color={isFox ? subColor : armColor} roughness={baseMaterial.roughness} metalness={baseMaterial.metalness} />
                                 </mesh>
                             </group>
                             <FighterFist
                                isLeft={true}
                                action={state.action}
                                color={isIronJin ? ironJinRed : (isFox ? subColor : handColor)}
                                map={isMechaGold ? torsoTexture : (isFox ? classicWhiteTexture : (isFemale ? getProceduralTexture("SAKURA", mainColor) : undefined))}
                                roughness={baseMaterial.roughness}
                                metalness={baseMaterial.metalness}
                             />
                        </group>
                    </group>
                 </group>
            </group>
            <group ref={rHipJointRef} position={[0.1, -0.05, 0]}>
                <mesh>
                    <sphereGeometry args={[0.11, 16, 16]} />
                    <meshStandardMaterial 
                        color={pantsColor} 
                        map={texturesEnabled ? pantsTexture : null} 
                        {...baseMaterial} 
                        roughness={isAlien ? 0.9 : baseMaterial.roughness}
                        metalness={isAlien ? 0.0 : baseMaterial.metalness}
                    />
                </mesh>
                {/* Deforming Hip Joint Tube Union */}
                <group ref={rHipDeformRef} position={[0, -0.05, 0]} visible={false}>
                     <mesh scale={[1.05, 0.4, 1.05]}>
                         <torusGeometry args={[0.115, 0.02, 8, 16]} />
                         <meshStandardMaterial color={jointColor} roughness={0.5} />
                     </mesh>
                     <mesh position={[0, 0.035, 0]} scale={[1.0, 0.06, 1.0]} rotation={[0.08, 0, 0]}>
                         <cylinderGeometry args={[0.12, 0.125, 1, 8]} />
                         <meshStandardMaterial color={pantsColor} map={texturesEnabled ? pantsTexture : null} {...baseMaterial} />
                     </mesh>
                     <mesh position={[0, -0.035, 0]} scale={[0.95, 0.06, 0.95]} rotation={[-0.08, 0, 0]}>
                         <cylinderGeometry args={[0.12, 0.115, 1, 8]} />
                         <meshStandardMaterial color={legColor} map={texturesEnabled ? legTexture : null} {...baseMaterial} />
                     </mesh>
                </group>
                <mesh position={[0, -0.175, 0]}>
                    <capsuleGeometry args={[0.11, 0.13, 8, 16]} />
                    <meshStandardMaterial 
                        color={legColor} 
                        map={texturesEnabled ? legTexture : null} 
                        {...baseMaterial} 
                        roughness={isAlien ? 0.9 : baseMaterial.roughness}
                        metalness={isAlien ? 0.0 : baseMaterial.metalness}
                    />
                </mesh>

                <group ref={rKneeRef} position={[0, -0.38, 0]}>
                    <mesh>
                         <sphereGeometry args={[0.10, 16, 16]} />
                         <meshStandardMaterial 
                             color={isFox ? subColor : (isAlien ? shinColor : legColor)} 
                             map={isFox ? classicWhiteTexture : (isAlien ? shinTextureObj : legTexture)} 
                             {...baseMaterial} 
                             roughness={isAlien ? 1.0 : (isFox ? 0.9 : baseMaterial.roughness)}
                             metalness={isAlien ? 0.0 : (isFox ? 0.0 : baseMaterial.metalness)}
                         />
                    </mesh>
                    {/* Deforming Knee Tube Union */}
                    <group ref={rKneeDeformRef} visible={false}>
                        {/* Central bulge ring */}
                        <mesh scale={[1.1, 0.4, 1.1]}>
                            <torusGeometry args={[0.09, 0.02, 8, 16]} />
                            <meshStandardMaterial color={jointColor} roughness={0.5} />
                        </mesh>
                        {/* Upper transition tube */}
                        <mesh position={[0, 0.04, 0]} scale={[1.05, 0.08, 1.05]} rotation={[0.1, 0, 0]}>
                            <cylinderGeometry args={[0.095, 0.105, 1, 8]} />
                            <meshStandardMaterial color={legColor} roughness={0.7} />
                        </mesh>
                        {/* Lower transition tube */}
                        <mesh position={[0, -0.04, 0]} scale={[1.0, 0.08, 1.0]} rotation={[-0.1, 0, 0]}>
                            <cylinderGeometry args={[0.095, 0.085, 1, 8]} />
                            <meshStandardMaterial color={isFox ? subColor : (isAlien ? shinColor : legColor)} roughness={0.7} />
                        </mesh>
                    </group>
                    <mesh position={[0, -0.175, 0]}>
                        <capsuleGeometry args={[0.095, 0.16, 8, 16]} />
                        <meshStandardMaterial 
                            color={isFox ? subColor : (isAlien ? shinColor : legColor)} 
                            map={isFox ? classicWhiteTexture : (isAlien ? shinTextureObj : legTexture)} 
                            {...baseMaterial} 
                            roughness={isAlien ? 1.0 : baseMaterial.roughness}
                            metalness={isAlien ? 0.0 : baseMaterial.metalness}
                        />
                    </mesh>
                    {/* Anatomical Ankle / Tobillo Derecho */}
                    <group position={[0, -0.34, 0]}>
                        <mesh>
                            <sphereGeometry args={[0.088, 12, 12]} />
                            <meshStandardMaterial 
                                color={isAlien ? shinColor : ankleColor} 
                                map={isAlien ? shinTextureObj : ankleTexture} 
                                {...baseMaterial} 
                                roughness={isAlien ? 1.0 : baseMaterial.roughness}
                                metalness={isAlien ? 0.0 : baseMaterial.metalness}
                            />
                        </mesh>
                    </group>
                    <group position={[0, -0.42, 0.05]}>
                        <mesh position={[0, 0, -0.05]}>
                           <sphereGeometry args={[0.09, 12, 12]} />
                           <meshStandardMaterial color={feetColor} map={texturesEnabled ? feetTextureObj : null} {...baseMaterial} />
                        </mesh>
                        <mesh position={[0, -0.04, 0.04]}>
                           <sphereGeometry args={[0.12, 16, 16]} />
                           <meshStandardMaterial color={feetColor} map={texturesEnabled ? feetTextureObj : null} {...baseMaterial} />
                        </mesh>
                        {/* 3 dark elegant short claws on the front of the foot, as requested */}
                        {isFox && (
                            <group position={[0, -0.04, 0.05]}>
                                {/* Left toe claw */}
                                <mesh position={[-0.05, 0, 0.055]} rotation={[Math.PI / 2, 0, -0.25]}>
                                    <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
                                </mesh>
                                {/* Center toe claw */}
                                <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                                    <capsuleGeometry args={[0.02, 0.09, 4, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
                                </mesh>
                                {/* Right toe claw */}
                                <mesh position={[0.05, 0, 0.055]} rotation={[Math.PI / 2, 0, 0.25]}>
                                    <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
                                </mesh>
                            </group>
                        )}
                    </group>
                </group>
            </group>
            <group ref={lHipJointRef} position={[-0.1, -0.05, 0]}>
                <mesh>
                    <sphereGeometry args={[0.11, 16, 16]} />
                    <meshStandardMaterial 
                        color={pantsColor} 
                        map={texturesEnabled ? pantsTexture : null} 
                        {...baseMaterial} 
                        roughness={isAlien ? 0.9 : baseMaterial.roughness}
                        metalness={isAlien ? 0.0 : baseMaterial.metalness}
                    />
                </mesh>
                {/* Deforming Hip Joint Tube Union */}
                <group ref={lHipDeformRef} position={[0, -0.05, 0]} visible={false}>
                     <mesh scale={[1.05, 0.4, 1.05]}>
                         <torusGeometry args={[0.115, 0.02, 8, 16]} />
                         <meshStandardMaterial color={jointColor} roughness={0.5} />
                     </mesh>
                     <mesh position={[0, 0.035, 0]} scale={[1.0, 0.06, 1.0]} rotation={[-0.08, 0, 0]}>
                         <cylinderGeometry args={[0.12, 0.125, 1, 8]} />
                         <meshStandardMaterial color={pantsColor} map={texturesEnabled ? pantsTexture : null} {...baseMaterial} />
                     </mesh>
                     <mesh position={[0, -0.035, 0]} scale={[0.95, 0.06, 0.95]} rotation={[0.08, 0, 0]}>
                         <cylinderGeometry args={[0.12, 0.115, 1, 8]} />
                         <meshStandardMaterial color={legColor} map={texturesEnabled ? legTexture : null} {...baseMaterial} />
                     </mesh>
                </group>
                <mesh position={[0, -0.175, 0]}>
                    <capsuleGeometry args={[0.11, 0.13, 8, 16]} />
                    <meshStandardMaterial 
                        color={legColor} 
                        map={texturesEnabled ? legTexture : null} 
                        {...baseMaterial} 
                        roughness={isAlien ? 0.9 : baseMaterial.roughness}
                        metalness={isAlien ? 0.0 : baseMaterial.metalness}
                    />
                </mesh>

                <group ref={lKneeRef} position={[0, -0.38, 0]}>
                    <mesh>
                         <sphereGeometry args={[0.10, 16, 16]} />
                         <meshStandardMaterial 
                             color={isFox ? subColor : (isAlien ? shinColor : legColor)} 
                             map={isFox ? classicWhiteTexture : (isAlien ? shinTextureObj : legTexture)} 
                             {...baseMaterial} 
                             roughness={isAlien ? 1.0 : (isFox ? 0.9 : baseMaterial.roughness)}
                             metalness={isAlien ? 0.0 : (isFox ? 0.0 : baseMaterial.metalness)}
                         />
                    </mesh>
                    {/* Deforming Knee Tube Union */}
                    <group ref={lKneeDeformRef} visible={false}>
                        {/* Central bulge ring */}
                        <mesh scale={[1.1, 0.4, 1.1]}>
                            <torusGeometry args={[0.09, 0.02, 8, 16]} />
                            <meshStandardMaterial color={jointColor} roughness={0.5} />
                        </mesh>
                        {/* Upper transition tube */}
                        <mesh position={[0, 0.04, 0]} scale={[1.05, 0.08, 1.05]} rotation={[0.1, 0, 0]}>
                            <cylinderGeometry args={[0.095, 0.105, 1, 8]} />
                            <meshStandardMaterial color={legColor} roughness={0.7} />
                        </mesh>
                        {/* Lower transition tube */}
                        <mesh position={[0, -0.04, 0]} scale={[1.0, 0.08, 1.0]} rotation={[-0.1, 0, 0]}>
                            <cylinderGeometry args={[0.095, 0.085, 1, 8]} />
                            <meshStandardMaterial color={isFox ? subColor : (isAlien ? shinColor : legColor)} roughness={0.7} />
                        </mesh>
                    </group>
                    <mesh position={[0, -0.175, 0]}>
                        <capsuleGeometry args={[0.095, 0.16, 8, 16]} />
                        <meshStandardMaterial 
                            color={isFox ? subColor : (isAlien ? shinColor : legColor)} 
                            map={isFox ? classicWhiteTexture : (isAlien ? shinTextureObj : legTexture)} 
                            {...baseMaterial} 
                            roughness={isAlien ? 1.0 : baseMaterial.roughness}
                            metalness={isAlien ? 0.0 : baseMaterial.metalness}
                        />
                    </mesh>
                    {/* Anatomical Ankle / Tobillo Izquierdo */}
                    <group position={[0, -0.34, 0]}>
                        <mesh>
                            <sphereGeometry args={[0.088, 12, 12]} />
                            <meshStandardMaterial 
                                color={isAlien ? shinColor : ankleColor} 
                                map={isAlien ? shinTextureObj : ankleTexture} 
                                {...baseMaterial} 
                                roughness={isAlien ? 1.0 : baseMaterial.roughness}
                                metalness={isAlien ? 0.0 : baseMaterial.metalness}
                            />
                        </mesh>
                    </group>
                    <group position={[0, -0.42, 0.05]}>
                        <mesh position={[0, 0, -0.05]}>
                           <sphereGeometry args={[0.09, 12, 12]} />
                           <meshStandardMaterial color={feetColor} map={texturesEnabled ? feetTextureObj : null} {...baseMaterial} />
                        </mesh>
                        <mesh position={[0, -0.04, 0.04]}>
                           <sphereGeometry args={[0.12, 16, 16]} />
                           <meshStandardMaterial color={feetColor} map={texturesEnabled ? feetTextureObj : null} {...baseMaterial} />
                        </mesh>
                        {/* 3 dark elegant short claws on the front of the foot, as requested */}
                        {isFox && (
                            <group position={[0, -0.04, 0.05]}>
                                {/* Left toe claw */}
                                <mesh position={[-0.05, 0, 0.055]} rotation={[Math.PI / 2, 0, -0.25]}>
                                    <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
                                </mesh>
                                {/* Center toe claw */}
                                <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                                    <capsuleGeometry args={[0.02, 0.09, 4, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
                                </mesh>
                                {/* Right toe claw */}
                                <mesh position={[0.05, 0, 0.055]} rotation={[Math.PI / 2, 0, 0.25]}>
                                    <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
                                    <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
                                </mesh>
                            </group>
                        )}
                    </group>
                </group>
            </group>
        </group>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
           <circleGeometry args={[0.55, 32]} />
           <meshBasicMaterial color="black" opacity={0.3} transparent />
        </mesh>
    </group>

    {/* Slide Ghost Afterimages */}
    <group ref={ghost1Ref} visible={false}>
        <group scale={[1.0, 1.0, 1.0]}>
            {/* Pelvis */}
            <mesh position={[0, 0, 0]} scale={[1.1, 0.95, 1.1]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.4} depthWrite={false} />
            </mesh>
            {/* Spine */}
            <mesh position={[0, 0.18, 0]} scale={[1.1, 0.95, 1.1]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.3} depthWrite={false} />
            </mesh>
            {/* Chest */}
            <mesh position={[0, 0.45, 0]} scale={[1.15, 0.95, 1.15]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.3} depthWrite={false} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.4} depthWrite={false} />
            </mesh>
        </group>
    </group>
    <group ref={ghost2Ref} visible={false}>
        <group scale={[1.0, 1.0, 1.0]}>
            {/* Pelvis */}
            <mesh position={[0, 0, 0]} scale={[1.1, 0.95, 1.1]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.3} depthWrite={false} />
            </mesh>
            {/* Spine */}
            <mesh position={[0, 0.18, 0]} scale={[1.1, 0.95, 1.1]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.25} depthWrite={false} />
            </mesh>
            {/* Chest */}
            <mesh position={[0, 0.45, 0]} scale={[1.15, 0.95, 1.15]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.25} depthWrite={false} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.3} depthWrite={false} />
            </mesh>
        </group>
    </group>
    <group ref={ghost3Ref} visible={false}>
        <group scale={[1.0, 1.0, 1.0]}>
            {/* Pelvis */}
            <mesh position={[0, 0, 0]} scale={[1.1, 0.95, 1.1]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.2} depthWrite={false} />
            </mesh>
            {/* Spine */}
            <mesh position={[0, 0.18, 0]} scale={[1.1, 0.95, 1.1]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.15} depthWrite={false} />
            </mesh>
            {/* Chest */}
            <mesh position={[0, 0.45, 0]} scale={[1.15, 0.95, 1.15]}>
                <capsuleGeometry args={[0.13, 0.15, 8, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.15} depthWrite={false} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshBasicMaterial color={mainColor} transparent opacity={0.2} depthWrite={false} />
            </mesh>
        </group>
    </group>
  </>
);
};
