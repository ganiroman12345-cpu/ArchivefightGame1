import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, PerspectiveCamera, Environment } from '@react-three/drei';
import { Vector3, MathUtils, Mesh, Group, CanvasTexture, RepeatWrapping, BufferGeometry, BufferAttribute } from 'three';
import { useGameStore } from '../store';
import { Fighter3D } from './Fighter3D';
import { HitImpact, GameState } from '../types';
import { playExplosionSound } from '../utils/audio';

// Camera Controller Component
const CameraController: React.FC = () => {
  const { camera } = useThree();
  
  // Smooth dampening vectors
  const currentPos = useRef(new Vector3(0, 2, 7));
  const currentLookAt = useRef(new Vector3(0, 1, 0));

  useFrame((state, delta) => {
    const s = useGameStore.getState();
    const playerPos = s.player.position;
    const enemyPos = s.enemy.position;
    const shakeIntensity = s.shakeIntensity;
    const stageY = s.stageY;
    const gState = s.gameState;

    // 1. Calculate Midpoint
    const midX = (playerPos + enemyPos) / 2;
    
    // 2. Calculate Distance for Zoom
    const distance = Math.abs(playerPos - enemyPos);
    
    if (gState === GameState.CINEMATIC_INTRO) {
      const cinematicStage = s.cinematicStage;
      const time = state.clock.getElapsedTime();
      const targetFocusX = cinematicStage === 'p1' ? playerPos : (cinematicStage === 'p2' ? enemyPos : midX);
      const targetX = targetFocusX; // Directly centered in front of character
      const targetZ = 2.6; // Dramatic front close-up view
      const targetY = 1.25 + Math.sin(time * 1.2) * 0.08 + stageY;
      
      const lerpSpeed = 5.0 * delta;
      currentPos.current.x = MathUtils.lerp(currentPos.current.x, targetX, lerpSpeed);
      currentPos.current.y = MathUtils.lerp(currentPos.current.y, targetY, lerpSpeed);
      currentPos.current.z = MathUtils.lerp(currentPos.current.z, targetZ, lerpSpeed);

      camera.position.set(currentPos.current.x, currentPos.current.y, currentPos.current.z);

      const targetLookAtX = targetFocusX;
      const targetLookAtY = 1.15 + stageY;
      currentLookAt.current.x = MathUtils.lerp(currentLookAt.current.x, targetLookAtX, lerpSpeed * 2);
      currentLookAt.current.y = MathUtils.lerp(currentLookAt.current.y, targetLookAtY, lerpSpeed * 2);
      currentLookAt.current.z = MathUtils.lerp(currentLookAt.current.z, 0, lerpSpeed * 2);

      camera.lookAt(currentLookAt.current);
      return;
    }

    if (gState === GameState.REPLAY || gState === GameState.CHARACTER_SELECT) {
      // Cinematic Rotating Replay Camera
      const time = state.clock.getElapsedTime();
      
      // Orbiting angle (theta) rotates slowly around the midpoint
      const angle = time * 0.45; // Speed of rotation
      const radius = Math.max(5.0, distance * 0.85 + 2.0); // Cinematic zoom closer
      
      // Calculate rotating position around the midpoint
      const targetX = midX + Math.sin(angle) * radius;
      const targetZ = Math.cos(angle) * radius;
      // Moving up and down gracefully for vertical dynamism
      const targetY = 1.8 + Math.sin(time * 0.7) * 0.6 + stageY;
      
      const lerpSpeed = 4.0 * delta; // Faster reaction for cinematic motion
      currentPos.current.x = MathUtils.lerp(currentPos.current.x, targetX, lerpSpeed);
      currentPos.current.y = MathUtils.lerp(currentPos.current.y, targetY, lerpSpeed);
      currentPos.current.z = MathUtils.lerp(currentPos.current.z, targetZ, lerpSpeed);
      
      camera.position.set(
          currentPos.current.x,
          currentPos.current.y,
          currentPos.current.z
      );
      
      // Focus exactly on the midpoint between characters at chest level
      const targetLookAtX = midX;
      const targetLookAtY = 0.95 + stageY;
      
      currentLookAt.current.x = MathUtils.lerp(currentLookAt.current.x, targetLookAtX, lerpSpeed * 2);
      currentLookAt.current.y = MathUtils.lerp(currentLookAt.current.y, targetLookAtY, lerpSpeed * 2);
      currentLookAt.current.z = MathUtils.lerp(currentLookAt.current.z, 0, lerpSpeed * 2);
      
      camera.lookAt(currentLookAt.current);
      return;
    }

    // Camera is zoomed out dynamically based on aspect ratio so characters never leave the screen boundaries in vertical/portrait layout
    const aspect = state.size.width / state.size.height;
    const multiplier = aspect < 1 ? (1.25 / Math.max(0.45, aspect)) : 0.95;
    const targetZ = Math.max(8.4, 6.0 + distance * multiplier);
    const targetY = 2.0 + distance * (aspect < 1 ? 0.28 : 0.16) + stageY; // Adjusted camera height for vertical viewport

    // 3. Smoothly interpolate position (Lerp)
    const lerpSpeed = 2.5 * delta;
    
    currentPos.current.x = MathUtils.lerp(currentPos.current.x, midX, lerpSpeed);
    currentPos.current.y = MathUtils.lerp(currentPos.current.y, targetY, lerpSpeed);
    currentPos.current.z = MathUtils.lerp(currentPos.current.z, targetZ, lerpSpeed);

    // Apply Shake
    const shakeX = (Math.random() - 0.5) * shakeIntensity * 0.2;
    const shakeY = (Math.random() - 0.5) * shakeIntensity * 0.2;
    
    camera.position.set(
        currentPos.current.x + shakeX,
        currentPos.current.y + shakeY,
        currentPos.current.z
    );

    // 4. Look slightly above midpoint (chest level), rising with stageY
    const targetLookAtX = midX;
    const targetLookAtY = 1.1 + stageY; 

    currentLookAt.current.x = MathUtils.lerp(currentLookAt.current.x, targetLookAtX, lerpSpeed * 1.5);
    currentLookAt.current.y = MathUtils.lerp(currentLookAt.current.y, targetLookAtY, lerpSpeed * 1.5);
    
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

// Dynamic physical Acid Spit particles component
const AcidSpitEffect: React.FC<{ direction: number }> = ({ direction }) => {
  const groupRef = useRef<Group>(null);
  const particles = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number }>>([]);

  if (particles.current.length === 0) {
    // Generate 25 glowing green spray particles shooting forward
    for (let i = 0; i < 25; i++) {
      particles.current.push({
        x: 0,
        y: 0,
        z: 0,
        vx: direction * (4.5 + Math.random() * 9.0),
        vy: 0.5 + Math.random() * 2.5, // slight arc
        vz: (Math.random() - 0.5) * 1.2,
        size: 0.035 + Math.random() * 0.055
      });
    }
  }

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const p = particles.current[idx];
        if (p) {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.z += p.vz * delta;

          // Apply gravitational drop
          p.vy -= 7.5 * delta;
          // Apply air drag
          p.vx *= 0.96;

          child.position.set(p.x, p.y, p.z);

          // Shrink over time
          const s = Math.max(0.01, child.scale.x - delta * 0.95);
          child.scale.set(s, s, s);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.current.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color="#39ff14" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Lava Splash Effect Component
const LavaSplashEffect: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const particles = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number }>>([]);

  if (particles.current.length === 0) {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      particles.current.push({
        x: (Math.random() - 0.5) * 0.4,
        y: 0,
        z: (Math.random() - 0.5) * 0.4,
        vx: Math.cos(angle) * speed,
        vy: 4.0 + Math.random() * 6.5,
        vz: Math.sin(angle) * speed,
        size: 0.05 + Math.random() * 0.12
      });
    }
  }

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const p = particles.current[idx];
        if (p) {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.z += p.vz * delta;

          p.vy -= 14.0 * delta;

          child.position.set(p.x, p.y, p.z);

          const s = Math.max(0.01, child.scale.x - delta * 0.6);
          child.scale.set(s, s, s);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.current.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#ff3300" : "#ffaa00"} transparent opacity={0.95} />
        </mesh>
      ))}
    </group>
  );
};

// Water Splash Effect Component
const WaterSplashEffect: React.FC<{ isRed?: boolean }> = ({ isRed }) => {
  const groupRef = useRef<Group>(null);
  const particles = useRef<Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; color: string }>>([]);

  if (particles.current.length === 0) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 5.0;
      const colors = isRed 
        ? ["#ff1111", "#aa0000", "#d62828", "#ffffff", "#ff4d4d"]
        : ["#00e5ff", "#38bdf8", "#7dd3fc", "#ffffff", "#00d8ff"];
      particles.current.push({
        x: (Math.random() - 0.5) * 0.4,
        y: 0,
        z: (Math.random() - 0.5) * 0.4,
        vx: Math.cos(angle) * speed,
        vy: 3.5 + Math.random() * 6.0,
        vz: Math.sin(angle) * speed,
        size: 0.04 + Math.random() * 0.10,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const p = particles.current[idx];
        if (p) {
          p.x += p.vx * delta;
          p.y += p.vy * delta;
          p.z += p.vz * delta;

          p.vy -= 13.0 * delta;

          child.position.set(p.x, p.y, p.z);

          const s = Math.max(0.01, child.scale.x - delta * 0.65);
          child.scale.set(s, s, s);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.current.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Hit Impact Particle Explosions Component
const HitImpactEffect: React.FC<{ impact: HitImpact }> = ({ impact }) => {
  const meshRef = useRef<Mesh>(null);
  const removeHitImpact = useGameStore(s => s.removeHitImpact);

  const isLightning = impact.type === 'LIGHTNING_EFFECT';
  const isLaser = impact.type === 'LASER_BEAM';
  const isKamehameha = impact.type === 'KAMEHAMEHA';
  const isAcid = impact.type === 'ACID_SPIT';
  const isShield = impact.type === 'SHIELD_SPHERE';
  const isDust = impact.type === 'DUST_CLOUD';
  const isLavaSplash = impact.type === 'LAVA_SPLASH';
  const isWaterSplash = impact.type === 'WATER_SPLASH' || impact.type === 'SPLASH';
  const isGroundCrack = impact.type === 'GROUND_CRACK';
  const isEnergyBall = isKamehameha;

  const duration = isGroundCrack ? 6000 : (isLightning ? 5000 : (isLaser ? 1500 : (isKamehameha ? 2600 : (isShield ? 800 : (isAcid ? 1000 : (isDust ? 650 : (isLavaSplash || isWaterSplash ? 1500 : 300)))))));

  useFrame((state, delta) => {
    if (meshRef.current) {
        if (isLightning) {
            // Flicker electricity
            const mat = meshRef.current.material as any;
            if (mat) {
               mat.opacity = 0.5 + Math.random() * 0.5;
            }
        } else if (isDust) {
             meshRef.current.children.forEach((child: any, idx: number) => {
                 const angle = (idx / 8) * Math.PI * 2;
                 const speed = 1.8 + (idx % 3) * 0.4;
                 child.position.x += Math.cos(angle) * speed * delta;
                 child.position.y += Math.abs(Math.sin(angle)) * speed * delta * 0.5;
                 const mat = child.material as any;
                 if (mat) mat.opacity = Math.max(0, mat.opacity - delta * 1.6);
             });
        } else if (isLaser || isKamehameha || isShield || isAcid) {
             const mat = meshRef.current.material as any;
             if (mat) mat.opacity = Math.max(0, mat.opacity - delta * 0.7);
             
             // Movement for effects
             if (isShield || isAcid || isEnergyBall) {
                 const speed = isAcid ? 4.5 : 12; // Slow down acid spit so it is clearly visible
                 meshRef.current.position.x += delta * speed * (impact.direction || 1); 
                 if (isEnergyBall) {
                     meshRef.current.rotation.z += delta * 15;
                 }
             }
        } else {
            meshRef.current.scale.addScalar(delta * 10.0);
            const mat = meshRef.current.material as any;
            if (mat) {
                mat.opacity = Math.max(0, mat.opacity - delta * 3.5);
            }
        }
    }
  });

  useEffect(() => {
    if (isGroundCrack) return; // Keep ground cracks permanently!
    const t = setTimeout(() => {
      removeHitImpact(impact.id);
    }, duration);
    return () => clearTimeout(t);
  }, [impact.id, removeHitImpact, duration, isGroundCrack]);

  const color = impact.type === 'BLOCKED' ? '#888888' : (impact.type === 'HEAVY' ? '#ffa600' : '#ff003c');
  const scale = impact.type === 'HEAVY' ? 1.5 : 0.8;

  if (isGroundCrack) {
       const crackScale = impact.direction || 1.0;
       return (
          <group position={[impact.x, impact.y + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              {/* Central fractured crater ring */}
              <mesh position={[0, 0, 0]}>
                  <ringGeometry args={[0.08 * crackScale, 0.45 * crackScale, 16]} />
                  <meshStandardMaterial color="#1a1816" roughness={1.0} />
              </mesh>
              {/* Dark inner crater depth */}
              <mesh position={[0, 0, 0.001]}>
                  <ringGeometry args={[0.01, 0.12 * crackScale, 12]} />
                  <meshBasicMaterial color="#0f0e0d" />
              </mesh>
              {/* Radial fracture lines / cracks spreading across floor */}
              {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2 + (i * 0.17);
                  const length = (0.5 + (i % 3) * 0.25) * crackScale;
                  const width = (0.025 + (i % 2) * 0.015) * crackScale;
                  return (
                      <mesh
                          key={i}
                          position={[Math.cos(angle) * (length / 2), Math.sin(angle) * (length / 2), 0.002]}
                          rotation={[0, 0, angle]}
                      >
                          <boxGeometry args={[length, width, 0.005]} />
                          <meshStandardMaterial color="#0c0b0a" roughness={1.0} />
                      </mesh>
                  );
              })}
              {/* Glowing crack ember energy lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                  const angle = (i / 4) * Math.PI * 2 + 0.4;
                  const length = 0.4 * crackScale;
                  return (
                      <mesh
                          key={i}
                          position={[Math.cos(angle) * (length / 2), Math.sin(angle) * (length / 2), 0.003]}
                          rotation={[0, 0, angle]}
                      >
                          <boxGeometry args={[length, 0.012 * crackScale, 0.005]} />
                          <meshBasicMaterial color="#ff5500" transparent opacity={0.7} />
                      </mesh>
                  );
              })}
          </group>
       );
  }

  if (isDust) {
       const particlesData = [
         { scale: 0.22, offsetZ: -0.1 },
         { scale: 0.18, offsetZ: 0.15 },
         { scale: 0.14, offsetZ: -0.2 },
         { scale: 0.20, offsetZ: 0.05 },
         { scale: 0.16, offsetZ: -0.05 },
         { scale: 0.24, offsetZ: 0.1 },
         { scale: 0.12, offsetZ: -0.15 },
         { scale: 0.15, offsetZ: 0.2 }
       ];
       const dustColor = "#78716c"; // Realistic dust/stone color

       return (
          <group ref={meshRef} position={[impact.x, impact.y + 0.05, 0]}>
              {particlesData.map((p, i) => (
                  <mesh key={i} position={[0, 0, p.offsetZ]}>
                      <sphereGeometry args={[p.scale, 8, 8]} />
                      <meshBasicMaterial color={dustColor} transparent opacity={0.65} />
                  </mesh>
              ))}
          </group>
       );
  }

  if (isLightning) {
      return (
          <group position={[impact.x, 3, 0.1]}>
             <mesh ref={meshRef}>
                 <cylinderGeometry args={[0.3, 0.3, 6, 8]} />
                 <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
             </mesh>
             <mesh position={[0, -2, 0]} scale={[2, 2, 2]}>
                 <sphereGeometry args={[0.5, 8, 8]} />
                 <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
             </mesh>
          </group>
      );
  }

  if (isKamehameha) {
       return (
          <group ref={meshRef} position={[impact.x, impact.y, 0.1]}>
               {/* Massive swirling energy wave trail */}
               <mesh rotation={[0, 0, Math.PI/2]} position={[-0.9 * (impact.direction || 1), 0, 0]} scale={[1.2, 1.0, 1.2]}>
                   <cylinderGeometry args={[0.28, 0.15, 2.4, 12]} />
                   <meshBasicMaterial color={impact.color || "#00f0ff"} transparent opacity={0.35} />
               </mesh>
               <mesh rotation={[0, 0, Math.PI/2]} position={[-0.9 * (impact.direction || 1), 0, 0]} scale={[0.6, 1.0, 0.6]}>
                   <cylinderGeometry args={[0.18, 0.05, 2.4, 8]} />
                   <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
               </mesh>

               {/* Rotating Swirling Rings for true anime style */}
               <group rotation={[0, 0, Date.now() / 150]}>
                   <mesh rotation={[Math.PI / 4, 0, 0]}>
                       <torusGeometry args={[0.55, 0.02, 8, 24]} />
                       <meshBasicMaterial color={impact.color || "#00f0ff"} transparent opacity={0.7} />
                   </mesh>
                   <mesh rotation={[-Math.PI / 4, 0, 0]}>
                       <torusGeometry args={[0.5, 0.02, 8, 24]} />
                       <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
                   </mesh>
               </group>

               {/* Outer glowing shell */}
               <mesh scale={[1.5, 1.5, 1.5]}>
                   <sphereGeometry args={[0.4, 16, 16]} />
                   <meshBasicMaterial color={impact.color || "#00f0ff"} transparent opacity={0.5} />
               </mesh>
               {/* Inner core */}
               <mesh scale={[1.1, 1.1, 1.1]}>
                   <sphereGeometry args={[0.4, 16, 16]} />
                   <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
               </mesh>
          </group>
       );
  }

  if (isLaser) {
       return (
          <group ref={meshRef} position={[impact.x, impact.y, 0]}>
              {/* Eye flare at Right Eye */}
              <mesh position={[0, 0, 0.055]}>
                  <sphereGeometry args={[0.04, 16, 16]} />
                  <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Eye flare at Left Eye */}
              <mesh position={[0, 0, -0.055]}>
                  <sphereGeometry args={[0.04, 16, 16]} />
                  <meshBasicMaterial color="#ffffff" />
              </mesh>

              {/* Right Eye - Ultra Fine Laser Beam */}
              <group position={[0, 0, 0.055]}>
                  {/* Outer Glow Red Beam */}
                  <mesh rotation={[0, 0, Math.PI/2]} position={[10 * (impact.direction || 1), 0, 0]}>
                      <cylinderGeometry args={[0.03, 0.03, 20, 8]} />
                      <meshBasicMaterial color="#ff0000" transparent opacity={0.4} />
                  </mesh>
                  {/* Mid Red/Pink Beam */}
                  <mesh rotation={[0, 0, Math.PI/2]} position={[10 * (impact.direction || 1), 0, 0]}>
                      <cylinderGeometry args={[0.015, 0.015, 20, 8]} />
                      <meshBasicMaterial color="#ff3366" transparent opacity={0.7} />
                  </mesh>
                  {/* Inner White Core */}
                  <mesh rotation={[0, 0, Math.PI/2]} position={[10 * (impact.direction || 1), 0, 0]}>
                      <cylinderGeometry args={[0.006, 0.006, 20, 8]} />
                      <meshBasicMaterial color="#ffffff" transparent opacity={1.0} />
                  </mesh>
              </group>

              {/* Left Eye - Ultra Fine Laser Beam */}
              <group position={[0, 0, -0.055]}>
                  {/* Outer Glow Red Beam */}
                  <mesh rotation={[0, 0, Math.PI/2]} position={[10 * (impact.direction || 1), 0, 0]}>
                      <cylinderGeometry args={[0.03, 0.03, 20, 8]} />
                      <meshBasicMaterial color="#ff0000" transparent opacity={0.4} />
                  </mesh>
                  {/* Mid Red/Pink Beam */}
                  <mesh rotation={[0, 0, Math.PI/2]} position={[10 * (impact.direction || 1), 0, 0]}>
                      <cylinderGeometry args={[0.015, 0.015, 20, 8]} />
                      <meshBasicMaterial color="#ff3366" transparent opacity={0.7} />
                  </mesh>
                  {/* Inner White Core */}
                  <mesh rotation={[0, 0, Math.PI/2]} position={[10 * (impact.direction || 1), 0, 0]}>
                      <cylinderGeometry args={[0.006, 0.006, 20, 8]} />
                      <meshBasicMaterial color="#ffffff" transparent opacity={1.0} />
                  </mesh>
              </group>

              {/* Concentrated Transverse Energy Rings along the dual laser path */}
              {[1, 3, 5, 7, 9, 11, 13, 15, 17, 19].map((dist, i) => (
                  <mesh 
                      key={i} 
                      position={[dist * (impact.direction || 1), 0, 0]} 
                      rotation={[0, Math.PI/2, 0]}
                  >
                      <torusGeometry args={[0.13, 0.006, 8, 16]} />
                      <meshBasicMaterial color="#ff0055" transparent opacity={0.5} />
                  </mesh>
              ))}
          </group>
       );
  }

  if (isAcid) {
       return (
          <group ref={meshRef} position={[impact.x, impact.y, 0.1]}>
                {/* Main bubbly acid glob */}
                <mesh scale={[1.3, 1.0, 1.0]}>
                    <sphereGeometry args={[0.22, 16, 16]} />
                    <meshBasicMaterial color="#39ff14" transparent opacity={0.95} />
                </mesh>
                {/* Outer boiling neon glow */}
                <mesh scale={[1.6, 1.2, 1.2]}>
                    <sphereGeometry args={[0.22, 16, 16]} />
                    <meshBasicMaterial color="#00ff00" transparent opacity={0.4} />
                </mesh>
                {/* Secondary bubbling droplets trailing behind */}
                <mesh position={[-0.4 * (impact.direction || 1), 0.08, 0.03]} scale={[0.6, 0.6, 0.6]}>
                    <sphereGeometry args={[0.18, 8, 8]} />
                    <meshBasicMaterial color="#39ff14" transparent opacity={0.8} />
                </mesh>
                <mesh position={[-0.8 * (impact.direction || 1), -0.06, -0.03]} scale={[0.4, 0.4, 0.4]}>
                    <sphereGeometry args={[0.18, 8, 8]} />
                    <meshBasicMaterial color="#00ff00" transparent opacity={0.7} />
                </mesh>
                {/* Real-time physical Green Spray Particles */}
                <AcidSpitEffect direction={impact.direction || 1} />
          </group>
       );
  }

  if (isLavaSplash) {
      return (
          <group position={[impact.x, -1.2, 0]}>
             <mesh rotation={[-Math.PI / 2, 0, 0]}>
                 <ringGeometry args={[0.2, 2.5, 32]} />
                 <meshBasicMaterial color="#ff2200" transparent opacity={0.8} />
             </mesh>
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                 <ringGeometry args={[0.1, 1.5, 32]} />
                 <meshBasicMaterial color="#ffaa00" transparent opacity={0.9} />
             </mesh>
             <LavaSplashEffect />
          </group>
      );
  }

  if (isWaterSplash) {
      const isRed = impact.color === "#ff0000" || impact.color === "red";
      return (
          <group position={[impact.x, impact.y ?? -0.4, 0]}>
             <mesh rotation={[-Math.PI / 2, 0, 0]}>
                 <ringGeometry args={[0.2, 2.2, 32]} />
                 <meshBasicMaterial color={isRed ? "#ff1111" : "#00e5ff"} transparent opacity={0.75} />
             </mesh>
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                 <ringGeometry args={[0.1, 1.2, 32]} />
                 <meshBasicMaterial color={isRed ? "#aa0000" : "#ffffff"} transparent opacity={0.85} />
             </mesh>
             <WaterSplashEffect isRed={isRed} />
          </group>
      );
  }

  if (isShield) {
      return (
          <group position={[impact.x, impact.y, 0.1]}>
             <mesh ref={meshRef}>
                 <sphereGeometry args={[0.6, 16, 16]} />
                 <meshBasicMaterial color="#00ff88" transparent opacity={0.7} />
             </mesh>
          </group>
      );
  }

  return (
    <group position={[impact.x, impact.y, 0.1]}>
      {/* Growing inner core */}
      <mesh ref={meshRef} scale={[scale, scale, scale]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={1.0} depthWrite={false} />
      </mesh>
      
      {/* Outer expansion flash */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.01, 0.7 * scale, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
};

// Lava Plane with boiling animation
const Lava: React.FC = () => {
  const lavaRef = useRef<Mesh>(null);
  
  useFrame((state) => {
    if (lavaRef.current) {
      // Oscillate Y position gently to simulate boiling wave
      lavaRef.current.position.y = -1.2 + Math.sin(state.clock.getElapsedTime() * 0.6) * 0.04;
    }
  });

  return (
    <mesh ref={lavaRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
      <planeGeometry args={[150, 150]} />
      <meshStandardMaterial 
        color="#de3a0d" 
        emissive="#bf1c00" 
        emissiveIntensity={2.5} 
        roughness={0.9} 
        metalness={0.1}
      />
    </mesh>
  );
};

// Stage Fences (Rejas) and corner neon posts
const Fences: React.FC = () => {
  const selectedMap = useGameStore(s => s.selectedMap);
  const isWar = selectedMap === 'WAR_OPPONENT';
  const isForest = selectedMap === 'FOREST';
  const isRooftop = selectedMap === 'ROOFTOP';
  if (isWar || isForest || isRooftop) return null;

  // Neon posts at the four corners of our 16x4.2 platform
  const corners = [
    [-8, -2.1],
    [8, -2.1],
    [-8, 2.1],
    [8, 2.1],
  ];

  return (
    <group>
      {corners.map(([cx, cz], idx) => (
        <group key={`corner-${idx}`} position={[cx, 1.0, cz]}>
          {/* Main Metal Post */}
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
            <meshStandardMaterial color="#18181b" metalness={0.95} roughness={0.05} />
          </mesh>
          {/* Glowing neon laser core */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 2.2, 6]} />
            <meshBasicMaterial color="#ff0055" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Procedural Grass Texture for the outside
const createGrassTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  // Base vibrant field green
  ctx.fillStyle = '#1a3014';
  ctx.fillRect(0, 0, 256, 256);
  // Draw blades of grass
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const h = 5 + Math.random() * 10;
    ctx.strokeStyle = Math.random() > 0.4 ? '#254a1a' : '#11220c';
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 4, y - h / 2, x + (Math.random() - 0.5) * 8, y - h);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
};

// Procedural Concrete Texture for Wet Floor
const createConcreteTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  // Wet charcoal concrete base
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(0, 0, 256, 256);
  // Specks and noise for wet pavement
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 1 + Math.random() * 2;
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    // reflective highlight drops
    if (Math.random() > 0.85) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.12})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
};

// Procedural Wood/Concrete Room Tile Texture
const createRoomTileTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  // Warm dusty ruined interior tile base
  ctx.fillStyle = '#221e1a';
  ctx.fillRect(0, 0, 512, 256);
  
  // Draw tiled patterns
  ctx.strokeStyle = '#0d0b09';
  ctx.lineWidth = 3;
  
  // Grid lines
  for (let x = 0; x <= 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  
  // Add scuffs, ruined wood/concrete cracks
  ctx.strokeStyle = '#3d322b';
  ctx.lineWidth = 1;
  for (let i = 0; i < 15; i++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (Math.random() - 0.5) * 50, cy + (Math.random() - 0.5) * 50);
    ctx.stroke();
  }
  
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
};

// Procedural Wood Texture
const createWoodTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Base wood brown - more natural forest tone
  ctx.fillStyle = '#4a2c1d';
  ctx.fillRect(0, 0, 512, 512);
  
  // Planks
  const plankHeight = 64;
  for (let y = 0; y < 512; y += plankHeight) {
    // Plank color variations
    const shade = (Math.random() - 0.5) * 15;
    ctx.fillStyle = `rgb(${74+shade}, ${44+shade}, ${29+shade})`;
    ctx.fillRect(0, y, 512, plankHeight);
    
    // Wood grain for each plank
    for (let i = 0; i < 400; i++) {
        const gx = Math.random() * 512;
        const gy = y + Math.random() * plankHeight;
        const gw = 10 + Math.random() * 50;
        const gh = 1 + Math.random() * 1.5;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(40, 20, 10, 0.3)' : 'rgba(100, 70, 50, 0.1)';
        ctx.fillRect(gx, gy, gw, gh);
    }
    
    // Knots
    if (Math.random() > 0.6) {
        const kx = Math.random() * 512;
        const ky = y + Math.random() * plankHeight;
        ctx.fillStyle = 'rgba(30, 15, 5, 0.4)';
        ctx.beginPath();
        ctx.ellipse(kx, ky, 8 + Math.random() * 12, 4 + Math.random() * 6, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Plank separator line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    
    // Random vertical plank cuts (staggered)
    for (let x = 0; x < 512; x += 128) {
        const offset = (y / plankHeight) % 2 === 0 ? 0 : 64;
        const lineX = (x + offset + (Math.random() - 0.5) * 20) % 512;
        ctx.beginPath();
        ctx.moveTo(lineX, y);
        ctx.lineTo(lineX, y + plankHeight);
        ctx.stroke();
    }
  }
  
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
};

// Indoor room floor covering the StagePlatform
const RoomFloor: React.FC = () => {
  const texturesEnabled = useGameStore(s => s.texturesEnabled);
  const texture = React.useMemo(() => createRoomTileTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.25]} receiveShadow>
      <planeGeometry args={[24.0, 8.5]} />
      <meshStandardMaterial 
        map={texturesEnabled ? texture : null} 
        roughness={0.7} 
        metalness={0.15} 
      />
    </mesh>
  );
};



// Forest floor covering the StagePlatform
const ForestFloor: React.FC = () => {
  const texturesEnabled = useGameStore(s => s.texturesEnabled);
  const texture = React.useMemo(() => createWoodTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.25]} receiveShadow>
      <planeGeometry args={[24.0, 8.5]} />
      <meshStandardMaterial 
        map={texturesEnabled ? texture : null} 
        roughness={0.8} 
        metalness={0.1} 
      />
    </mesh>
  );
};

// Raised 3D Cube Stage Platform
const StagePlatform: React.FC = () => {
  const selectedMap = useGameStore(s => s.selectedMap);
  const isWar = selectedMap === 'WAR_OPPONENT';
  const isPark = selectedMap === 'PARK_FESTIVAL';
  const isHell = selectedMap === 'HELL';
  const isForest = selectedMap === 'FOREST';
  const isRooftop = selectedMap === 'ROOFTOP';
  const texturesEnabled = useGameStore(s => s.texturesEnabled);
  const woodTexture = React.useMemo(() => createWoodTexture(), []);

  return (
    <group>
      {/* Platform Cube: Expanded for War/Park/Hell/Forest/Rooftop map to cover the entire room interior */}
      <mesh position={[0, -0.2, (isWar || isPark || isHell || isForest || isRooftop) ? -0.25 : 0]} receiveShadow>
        <boxGeometry args={[(isWar || isPark || isHell || isForest || isRooftop) ? 24.0 : 16, 0.4, (isWar || isPark || isHell || isForest || isRooftop) ? 8.5 : 4.2]} />
        <meshStandardMaterial 
          color={isWar ? "#3b3634" : (isPark ? "#355e3b" : (isHell ? "#1a1a1a" : (isForest ? "#8b5a2b" : (isRooftop ? "#3a3c40" : "#2a2a30"))))} 
          map={(isForest && texturesEnabled) ? woodTexture : null}
          roughness={isWar ? 0.7 : ((isPark || isHell) ? 0.9 : (isForest ? 0.8 : (isRooftop ? 0.6 : 0.2)))} 
          metalness={isWar ? 0.15 : ((isPark || isHell) ? 0.0 : (isForest ? 0.1 : (isRooftop ? 0.15 : 0.9)))} 
        />
      </mesh>
      
      {/* If war, render the custom textured room floor plane right over the stage top surface, and the grass underneath it! */}
      {isWar && (
         <>
           <RoomFloor />
         </>
      )}

      {/* Forest Floor Wood texture */}
      {isForest && (
        <>
          <ForestFloor />
        </>
      )}

      {/* Rooftop Floor Concrete texture */}
      {isRooftop && (
        <>
          <RooftopFloor />
        </>
      )}
      
      {/* Neon border trims - Omitted in WAR, PARK, HELL, FOREST and ROOFTOP maps */}
      {(!isWar && !isPark && !isHell && !isForest && !isRooftop) && (
         <>
           <mesh position={[0, 0.01, -2.08]}>
             <boxGeometry args={[16, 0.02, 0.04]} />
             <meshBasicMaterial color="#ff0055" />
           </mesh>
           <mesh position={[0, 0.01, 2.08]}>
             <boxGeometry args={[16, 0.02, 0.04]} />
             <meshBasicMaterial color="#ff0055" />
           </mesh>
           <mesh position={[-7.98, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
             <boxGeometry args={[4.2, 0.02, 0.04]} />
             <meshBasicMaterial color="#ff0055" />
           </mesh>
           <mesh position={[7.98, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
             <boxGeometry args={[4.2, 0.02, 0.04]} />
             <meshBasicMaterial color="#ff0055" />
           </mesh>
         </>
      )}
    </group>
  );
};

// Outer Rock Rim (Dark platform further out)
const OuterRim: React.FC = () => {
  return (
    <mesh position={[0, -2.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[20, 50, 32]} />
      <meshStandardMaterial 
        color="#08080a" 
        roughness={0.95} 
        metalness={0.1} 
      />
    </mesh>
  );
};

const StageGroup: React.FC = () => {
  const groupRef = useRef<Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = useGameStore.getState().stageY;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stage platform */}
      <StagePlatform />
      
      {/* Fences */}
      <Fences />
      
      {/* Contact shadows on stage platform floor */}
      <ContactShadows position={[0, 0.01, 0]} resolution={256} scale={16} blur={2.2} opacity={0.7} far={2.5} color="#000000" />

      {/* Fighters */}
      <Fighter3D who="player" />
      <Fighter3D who="enemy" />
    </group>
  );
};

// Wet Concrete/Asphalt floor for War Opponent stage
const WetFloor: React.FC = () => {
  const texturesEnabled = useGameStore(s => s.texturesEnabled);
  const texture = React.useMemo(() => createGrassTexture(), []);
  return (
    <group>
      {/* Grass Pavement representing all the outside landscape */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.21, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial 
          map={texturesEnabled ? texture : null}
          roughness={0.9}
          metalness={0.0} 
        />
      </mesh>
    </group>
  );
};

// Background City Skyscrapers
const CitySkyline: React.FC = () => {
  const buildings = [
    { x: -18, z: -15, w: 4, h: 12, d: 4 },
    { x: -12, z: -18, w: 5, h: 18, d: 5 },
    { x: -5, z: -22, w: 6, h: 22, d: 6 },
    { x: 3, z: -20, w: 5, h: 15, d: 5 },
    { x: 10, z: -16, w: 4, h: 16, d: 4 },
    { x: 16, z: -14, w: 5, h: 10, d: 5 },
  ];

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 4, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color="#080c12" roughness={0.9} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// Destroyed Room structure surrounding the fight zone - Daytime Illuminated & Heavily Ruined
const DestroyedRoom: React.FC = () => {
  return (
    <group>
      {/* Broken Back Wall - Left part */}
      <mesh position={[-7, 2.5, -4.5]}>
        <boxGeometry args={[4, 7, 0.4]} />
        <meshStandardMaterial color="#44444a" roughness={0.8} />
      </mesh>
      {/* Broken Back Wall - Right part */}
      <mesh position={[7, 2.5, -4.5]}>
        <boxGeometry args={[4, 7, 0.4]} />
        <meshStandardMaterial color="#44444a" roughness={0.8} />
      </mesh>
      {/* Broken Back Wall - Header arch connecting them */}
      <mesh position={[0, 5.5, -4.5]}>
        <boxGeometry args={[18, 1, 0.4]} />
        <meshStandardMaterial color="#44444a" roughness={0.8} />
      </mesh>
      
      {/* Collapsing Left Side Wall */}
      <mesh position={[-8.4, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8, 5, 0.4]} />
        <meshStandardMaterial color="#404046" roughness={0.8} />
      </mesh>
      {/* Collapsed Right Side Wall (Lower height) */}
      <mesh position={[8.4, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[8, 2.4, 0.4]} />
        <meshStandardMaterial color="#404046" roughness={0.8} />
      </mesh>

      {/* Shattered metal roof girders framing the daylight sky */}
      <mesh position={[-4, 5.8, 0]} rotation={[0.1, 0, 0.5]}>
        <boxGeometry args={[8.5, 0.15, 0.15]} />
        <meshStandardMaterial color="#1f1f21" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[4, 5.8, 0]} rotation={[-0.1, 0, -0.5]}>
        <boxGeometry args={[8.5, 0.15, 0.15]} />
        <meshStandardMaterial color="#1f1f21" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* Cracked left concrete pillar */}
      <group position={[-8.1, 1.5, -2]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.4, 3, 6]} />
          <meshStandardMaterial color="#38383e" roughness={0.9} />
        </mesh>
        {/* Debris at bottom */}
        <mesh position={[0, -1.3, 0.1]}>
          <boxGeometry args={[0.7, 0.4, 0.7]} />
          <meshStandardMaterial color="#2d2d32" />
        </mesh>
      </group>
      {/* Cracked right concrete pillar */}
      <group position={[8.1, 1.5, -2]}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.3, 3, 6]} />
          <meshStandardMaterial color="#38383e" roughness={0.9} />
        </mesh>
        {/* Debris at bottom */}
        <mesh position={[0, -1.3, -0.1]}>
          <boxGeometry args={[0.8, 0.3, 0.6]} />
          <meshStandardMaterial color="#2d2d32" />
        </mesh>
      </group>

      {/* Ruined debris clusters in the room corners */}
      <group position={[-6.2, -0.8, -3.8]}>
         <mesh rotation={[0.4, 0.5, 0.1]}>
            <boxGeometry args={[0.85, 0.85, 0.85]} />
            <meshStandardMaterial color="#303036" roughness={0.9} />
         </mesh>
         <mesh position={[0.4, -0.2, 0.3]} rotation={[-0.3, 0.2, 0.5]}>
            <boxGeometry args={[0.55, 0.55, 0.55]} />
            <meshStandardMaterial color="#2b2b2f" roughness={0.9} />
         </mesh>
      </group>
      <group position={[6.2, -0.8, -3.8]}>
         <mesh rotation={[-0.2, -0.4, 0.3]}>
            <boxGeometry args={[0.95, 0.65, 0.95]} />
            <meshStandardMaterial color="#303036" roughness={0.9} />
         </mesh>
         <mesh position={[-0.5, -0.2, 0.2]} rotation={[0.4, -0.1, 0.2]}>
            <boxGeometry args={[0.65, 0.45, 0.65]} />
            <meshStandardMaterial color="#2b2b2f" roughness={0.9} />
         </mesh>
      </group>
    </group>
  );
};

// Live 3D rain particle generator
const Rain: React.FC = () => {
  const pointsRef = useRef<any>(null);
  const count = 350;

  // Compute clean, non-NaN static buffer geometry once on mount
  const geometry = React.useMemo(() => {
    const geo = new BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;     // X: spread across room
      arr[i * 3 + 1] = Math.random() * 20;          // Y: height
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15;  // Z: depth
    }
    geo.setAttribute('position', new BufferAttribute(arr, 3));
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.position.y -= delta * 14;
      if (pointsRef.current.position.y < -15) {
        pointsRef.current.position.y = 0;
      }
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial color="#5577aa" size={0.065} transparent opacity={0.6} />
    </points>
  );
};

// Animated missiles that fall outside the fight arena, detonating to trigger screen shakes
const MissileStrike: React.FC = () => {
  const missileMeshRef = useRef<Mesh>(null);
  const explosionGroupRef = useRef<Group>(null);
  const explosionMeshRef = useRef<Mesh>(null);

  const stateRef = useRef({
    active: true,
    x: -12,
    y: 18,
    z: -6,
    exploding: false,
    explosionScale: 0.1,
  });

  useFrame((_, delta) => {
    const s = stateRef.current;
    if (s.active && !s.exploding) {
      s.y -= delta * 15.0;
      s.x += delta * 3.5;

      if (s.y <= -1.0) {
        s.exploding = true;
        s.y = -1.0;
        playExplosionSound();
        useGameStore.getState().setShakeIntensity(5.8);
      }
      
      if (missileMeshRef.current) {
        missileMeshRef.current.position.set(s.x, s.y, s.z);
        missileMeshRef.current.visible = !s.exploding;
      }
      if (explosionGroupRef.current) {
        explosionGroupRef.current.visible = s.exploding;
      }
    } else if (s.exploding) {
      s.explosionScale += delta * 8.0;
      if (s.explosionScale > 4.5) {
        s.active = true;
        s.x = (Math.random() > 0.5 ? 12 : -12) + (Math.random() - 0.5) * 4;
        s.y = 20;
        s.z = -4 - Math.random() * 6;
        s.exploding = false;
        s.explosionScale = 0.1;
      }
      
      if (explosionGroupRef.current) {
        explosionGroupRef.current.visible = s.exploding;
        explosionGroupRef.current.position.set(s.x, -1.0, s.z);
      }
      if (explosionMeshRef.current) {
        explosionMeshRef.current.scale.setScalar(s.explosionScale);
      }
    }
  });

  return (
    <group>
      <mesh ref={missileMeshRef} position={[-12, 18, -6]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
        <meshBasicMaterial color="#ff2200" />
      </mesh>

      <group ref={explosionGroupRef} visible={false}>
        <mesh ref={explosionMeshRef}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#ff4500" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
};

// Random atmospheric/artillery explosions outside the fighting zone
const WarAmbientExplosions: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  
  const stateRef = useRef({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    scale: 0.1,
  });

  useFrame((_, delta) => {
    const s = stateRef.current;
    if (!s.active) {
      if (Math.random() > 0.993) {
        s.active = true;
        s.x = (Math.random() - 0.5) * 20;
        s.y = Math.random() * 4 + 1;
        s.z = -6 - Math.random() * 4;
        s.scale = 0.1;
      }
    } else {
      s.scale += delta * 9.0;
      if (s.scale > 4.0) {
        s.active = false;
      }
    }

    if (groupRef.current) {
      groupRef.current.visible = s.active;
      if (s.active) {
        groupRef.current.position.set(s.x, s.y, s.z);
      }
    }
    if (meshRef.current && s.active) {
      meshRef.current.scale.setScalar(s.scale);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

const PartyNPC: React.FC<{ x: number, z: number, color: string, speed: number, offset: number }> = ({ x, z, color, speed, offset }) => {
  const meshRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
     if (meshRef.current) {
         meshRef.current.position.y = Math.abs(Math.sin(clock.getElapsedTime() * speed + offset)) * 0.8 + 0.6;
         meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * speed * 0.5 + offset) * 0.5;
     }
  });
  return (
      <group position={[x, 0, z]}>
         <mesh ref={meshRef} position={[0, 0.6, 0]} castShadow>
             <boxGeometry args={[0.6, 1.2, 0.6]} />
             <meshStandardMaterial color={color} roughness={0.7} />
         </mesh>
         <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
             <circleGeometry args={[0.5, 16]} />
             <meshBasicMaterial color="#000000" transparent opacity={0.3} />
         </mesh>
      </group>
  );
};

const ParkFestivalEnv: React.FC = () => {
  return (
    <group>
      {/* Grass Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, -2]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <meshStandardMaterial color="#355e3b" roughness={0.9} />
      </mesh>
      
      {/* Fences around fight zone */}
      {/* Back fence rails */}
      <mesh position={[0, 0.8, -3.5]}>
        <boxGeometry args={[20, 0.1, 0.05]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, -3.5]}>
        <boxGeometry args={[20, 0.1, 0.05]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
      </mesh>
      {/* Back fence posts */}
      {[-9, -6, -3, 0, 3, 6, 9].map(x => (
         <mesh key={`post-${x}`} position={[x, 0.6, -3.5]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.7} />
         </mesh>
      ))}

      {/* Celebrating NPCs */}
      <PartyNPC x={-5} z={-4.5} color="#ff00ff" speed={5} offset={0} />
      <PartyNPC x={4} z={-5} color="#00ffff" speed={6} offset={1} />
      <PartyNPC x={0} z={-6} color="#ffff00" speed={4} offset={2} />
      <PartyNPC x={-7} z={-5.5} color="#ff4500" speed={5.5} offset={3} />
      <PartyNPC x={6} z={-4.8} color="#00fa9a" speed={4.5} offset={4} />
      <PartyNPC x={2} z={-5.2} color="#8a2be2" speed={6.5} offset={5} />
    </group>
  );
};

// --- Detailed Brown Demon Horn Helper for Zombie ---

const CLOTHING_COLORS = [
  "#dc2626", // red
  "#2563eb", // blue
  "#16a34a", // green
  "#ca8a04", // yellow
  "#9333ea", // purple
  "#ea580c", // orange
  "#db2777", // pink
  "#0d9488", // teal
  "#4b5563", // gray
  "#06b6d4", // light blue
  "#f43f5e", // light red
  "#10b981"  // light green
];

// Headless Zombie walking on the water in the distance occasionally
const HeadlessZombie: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const [active, setActive] = React.useState(false);
  const xPosRef = useRef(-25);
  const directionRef = useRef(1);
  const zPosRef = useRef(-15);
  const speedRef = useRef(1.5);

  // Stable random clothing colors on mount
  const shirtColor = React.useMemo(() => CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)], [active]);
  const pantsColor = React.useMemo(() => {
    let color = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
    while (color === shirtColor) {
      color = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
    }
    return color;
  }, [shirtColor, active]);

  useFrame((state, delta) => {
    if (!active) {
      if (Math.random() < 0.0015) { // Occurs occasionally
        setActive(true);
        const startLeft = Math.random() > 0.5;
        xPosRef.current = startLeft ? -25 : 25;
        directionRef.current = startLeft ? 1 : -1;
        zPosRef.current = -14 - Math.random() * 8; // deep background water
        speedRef.current = 1.0 + Math.random() * 0.8;
      }
    } else {
      xPosRef.current += directionRef.current * speedRef.current * delta;
      if (groupRef.current) {
        groupRef.current.position.set(xPosRef.current, -1.0, zPosRef.current);
        
        const time = state.clock.getElapsedTime();
        const legL = groupRef.current.getObjectByName('legL');
        const legR = groupRef.current.getObjectByName('legR');
        const armL = groupRef.current.getObjectByName('armL');
        const armR = groupRef.current.getObjectByName('armR');
        const shinL = groupRef.current.getObjectByName('shinL');
        const shinR = groupRef.current.getObjectByName('shinR');
        
        if (legL && legR) {
          legL.rotation.x = Math.sin(time * 5) * 0.5;
          legR.rotation.x = -Math.sin(time * 5) * 0.5;
        }
        if (shinL && shinR) {
          shinL.rotation.x = Math.max(0, Math.sin(time * 5 + 0.5) * 0.4);
          shinR.rotation.x = Math.max(0, -Math.sin(time * 5 + 0.5) * 0.4);
        }
        if (armL && armR) {
          armL.rotation.x = -1.3 + Math.sin(time * 3) * 0.15;
          armR.rotation.x = -1.3 + Math.sin(time * 3) * 0.15;
        }
        
        groupRef.current.rotation.y = directionRef.current === 1 ? Math.PI / 2 : -Math.PI / 2;
      }

      if (Math.abs(xPosRef.current) > 26) {
        setActive(false);
      }
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[xPosRef.current, -1.0, zPosRef.current]}>
      {/* Detailed Segmented James Zombie Body */}
      {/* Hips */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.12, 4, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} />
      </mesh>

      {/* Torso / Chest */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.26, 4, 8]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      
      {/* Red Neck Stump (where head was cut off) */}
      <mesh position={[0, 1.03, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 8]} />
        <meshStandardMaterial color="#aa0000" roughness={0.5} />
      </mesh>

      {/* Left Upper Arm & Shoulder (Sleeve) */}
      <mesh position={[-0.19, 0.9, 0.05]} rotation={[-1.3, 0, -0.1]}>
        <capsuleGeometry args={[0.04, 0.14, 4, 8]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      {/* Left Forearm (Zombie Skin) */}
      <mesh name="armL" position={[-0.22, 0.75, 0.15]} rotation={[-1.3, 0, 0]}>
        <capsuleGeometry args={[0.035, 0.21, 4, 8]} />
        <meshStandardMaterial color="#5c6c4e" roughness={0.9} />
      </mesh>

      {/* Right Upper Arm & Shoulder (Sleeve) */}
      <mesh position={[0.19, 0.9, 0.05]} rotation={[-1.3, 0, 0.1]}>
        <capsuleGeometry args={[0.04, 0.14, 4, 8]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      {/* Right Forearm (Zombie Skin) */}
      <mesh name="armR" position={[0.22, 0.75, 0.15]} rotation={[-1.3, 0, 0]}>
        <capsuleGeometry args={[0.035, 0.21, 4, 8]} />
        <meshStandardMaterial color="#5c6c4e" roughness={0.9} />
      </mesh>

      {/* Left Thigh (Pants) */}
      <group name="legL" position={[-0.1, 0.4, 0]}>
        <mesh position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.045, 0.19, 4, 8]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {/* Left Shin & Boot */}
        <group name="shinL" position={[0, -0.24, 0]}>
          <mesh position={[0, -0.12, 0]}>
            <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.28, 0.02]}>
            <capsuleGeometry args={[0.045, 0.05, 4, 8]} />
            <meshStandardMaterial color="#1a120b" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Right Thigh (Pants) */}
      <group name="legR" position={[0.1, 0.4, 0]}>
        <mesh position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.045, 0.19, 4, 8]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {/* Right Shin & Boot */}
        <group name="shinR" position={[0, -0.24, 0]}>
          <mesh position={[0, -0.12, 0]}>
            <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          {/* Boot */}
          <mesh position={[0, -0.28, 0.02]}>
            <capsuleGeometry args={[0.045, 0.05, 4, 8]} />
            <meshStandardMaterial color="#1a120b" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// Zombie like James with demon horns and spiky hair looking at the fight area from the mountains high up
const MountainZombie: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const [active, setActive] = React.useState(false);
  const timerRef = useRef<number>(0);

  // Stable random clothing colors on mount
  const shirtColor = React.useMemo(() => CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)], [active]);
  const pantsColor = React.useMemo(() => {
    let color = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
    while (color === shirtColor) {
      color = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];
    }
    return color;
  }, [shirtColor, active]);

  useFrame((state, delta) => {
    if (!active) {
      if (Math.random() < 0.0008) { // rare trigger
        setActive(true);
        timerRef.current = 0;
      }
    } else {
      timerRef.current += delta;
      if (timerRef.current >= 3.0) {
        setActive(false);
      }
      if (groupRef.current) {
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = 8.5 + Math.sin(t * 1.5) * 0.15;
        groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
      }
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[6, 8.5, -25]} rotation={[0.2, -0.6, 0]}>
      {/* Detailed Segmented James Zombie Body */}
      {/* Hips */}
      <mesh position={[0, 0.45, 0]}>
        <capsuleGeometry args={[0.09, 0.12, 4, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} />
      </mesh>

      {/* Torso / Chest */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.26, 4, 8]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 8]} />
        <meshStandardMaterial color="#4e5c3e" roughness={0.9} />
      </mesh>

      {/* Head with James head and Ava's pink hair */}
      <group position={[0, 1.25, 0]}>
        {/* Zombie Head Sphere (James shape) */}
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#4e5c3e" roughness={0.9} />
        </mesh>

        {/* Glowing Zombie Eyes */}
        <mesh position={[-0.05, 0.03, 0.12]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[0.05, 0.03, 0.12]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>

        {/* Ava's Pink Hair (pelo de ava) - positioned a bit lower as requested */}
        <group position={[0, -0.05, -0.05]}>
          <mesh scale={[1.1, 1.1, 1.1]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#ffb7c5" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.18, -0.1]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#ff1493" roughness={0.4} />
          </mesh>
          {/* Twin tails */}
          <mesh position={[-0.18, -0.05, -0.1]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.06, 0.35, 6]} />
            <meshStandardMaterial color="#ffb7c5" roughness={0.4} />
          </mesh>
          <mesh position={[0.18, -0.05, -0.1]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.06, 0.35, 6]} />
            <meshStandardMaterial color="#ffb7c5" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* Arms crossed in front (James resting pose) */}
      {/* Left Upper Arm & Shoulder */}
      <mesh position={[-0.2, 0.85, 0.05]} rotation={[0.4, 0, 0.1]}>
        <capsuleGeometry args={[0.04, 0.14, 4, 8]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      {/* Left Forearm (crossed over chest) */}
      <mesh position={[-0.1, 0.75, 0.12]} rotation={[0, 1.1, 1.47]}>
        <capsuleGeometry args={[0.035, 0.21, 4, 8]} />
        <meshStandardMaterial color="#5c6c4e" roughness={0.9} />
      </mesh>

      {/* Right Upper Arm & Shoulder */}
      <mesh position={[0.2, 0.85, 0.05]} rotation={[0.4, 0, -0.1]}>
        <capsuleGeometry args={[0.04, 0.14, 4, 8]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      {/* Right Forearm (crossed over chest) */}
      <mesh position={[0.1, 0.72, 0.14]} rotation={[0, -1.1, -1.47]}>
        <capsuleGeometry args={[0.035, 0.21, 4, 8]} />
        <meshStandardMaterial color="#5c6c4e" roughness={0.9} />
      </mesh>

      {/* Left Thigh (Pants) */}
      <group position={[-0.1, 0.4, 0]}>
        <mesh position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.045, 0.19, 4, 8]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {/* Left Shin & Boot */}
        <group position={[0, -0.24, 0]}>
          <mesh position={[0, -0.12, 0]}>
            <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.28, 0.02]}>
            <capsuleGeometry args={[0.045, 0.05, 4, 8]} />
            <meshStandardMaterial color="#1a120b" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Right Thigh (Pants) */}
      <group position={[0.1, 0.4, 0]}>
        <mesh position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.045, 0.19, 4, 8]} />
          <meshStandardMaterial color={pantsColor} roughness={0.7} />
        </mesh>
        {/* Right Shin & Boot */}
        <group position={[0, -0.24, 0]}>
          <mesh position={[0, -0.12, 0]}>
            <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.28, 0.02]}>
            <capsuleGeometry args={[0.045, 0.05, 4, 8]} />
            <meshStandardMaterial color="#1a120b" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

const ForestEnv: React.FC = () => {
  const waterColor = useGameStore(s => s.forestWaterColor);
  const rocksData = React.useMemo(() => {
    return Array.from({ length: 40 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      // Push radius far out to prevent intersecting the fight zone
      const radius = 18 + Math.random() * 20;
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        scale: [2 + Math.random() * 4, 3 + Math.random() * 6, 2 + Math.random() * 4] as [number, number, number],
        rotationY: Math.random() * Math.PI
      };
    });
  }, []);

  return (
    <group>
       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} receiveShadow>
         <planeGeometry args={[100, 100]} />
         <meshStandardMaterial color={waterColor} roughness={0.1} metalness={0.8} transparent opacity={0.65} />
       </mesh>
       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 4.0]} receiveShadow>
         <planeGeometry args={[100, 17.5]} />
         <meshStandardMaterial color="#1a2b1a" roughness={1.0} />
       </mesh>
       {rocksData.map((rock, i) => (
         <mesh key={i} position={[rock.x, -1.0, rock.z]} rotation={[0, rock.rotationY, 0]} scale={rock.scale} receiveShadow castShadow>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#4a554a" roughness={0.9} />
         </mesh>
       ))}
       
       {/* Background zombie hazards/secrets */}
       <HeadlessZombie />
       <MountainZombie />
    </group>
  );
};

// Procedural Concrete Rooftop Tile Texture
const createConcreteTileTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // Concrete gray rooftop base
  ctx.fillStyle = '#3a3d40';
  ctx.fillRect(0, 0, 512, 512);
  
  // Grid lines for square tiles
  ctx.strokeStyle = '#1e2022';
  ctx.lineWidth = 4;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  
  // Concrete noise
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = 1 + Math.random() * 2;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x, y, size, size);
  }
  
  // Cracks
  ctx.strokeStyle = '#1a1c1e';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 30;
      cy += (Math.random() - 0.5) * 30;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
};

const RooftopFloor: React.FC = () => {
  const texturesEnabled = useGameStore(s => s.texturesEnabled);
  const texture = React.useMemo(() => createConcreteTileTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.25]} receiveShadow>
      <planeGeometry args={[24.0, 8.5]} />
      <meshStandardMaterial 
        map={texturesEnabled ? texture : null} 
        roughness={0.75} 
        metalness={0.2} 
      />
    </mesh>
  );
};

const RooftopDustCloud: React.FC<{ x: number, y: number, z: number, color?: string }> = ({ x, y, z, color = "#cccccc" }) => {
  const groupRef = useRef<Group>(null);
  const particles = React.useMemo(() => {
    return Array.from({ length: 16 }).map(() => ({
      vx: (Math.random() - 0.5) * 2.2,
      vy: 0.5 + Math.random() * 2.0,
      vz: (Math.random() - 0.5) * 5.0,
      size: 0.15 + Math.random() * 0.25,
      opacity: 0.8,
    }));
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      if (child && p.opacity > 0) {
        const mesh = child as any;
        mesh.position.x += p.vx * delta;
        mesh.position.y += p.vy * delta;
        mesh.position.z += p.vz * delta;
        p.opacity = Math.max(0, p.opacity - delta * 0.6);
        if (mesh.material) {
          mesh.material.opacity = p.opacity;
        }
        mesh.scale.setScalar(1 + (0.8 - p.opacity) * 3);
      }
    });
  });

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const BreakableCliff: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const isBroken = useGameStore(s => side === 'left' ? s.forestLeftBroken : s.forestRightBroken);
  const xPos = side === 'left' ? -12.3 : 12.3;
  
  // Symmetrical uniform building dimensions:
  // Height: 2.2 units, Depth: 1.8 units, Width: 0.9 units. Same height for all blocks!
  return (
    <group position={[xPos, 0, -0.25]}>
      {!isBroken ? (
        // Untouched high-tech scientific research Mini Laboratory!
        <group>
          {/* Rocky ravine/cliff wall backing the laboratory (integrating it to mountains/barrancos) */}
          <mesh castShadow receiveShadow position={[side === 'left' ? -0.4 : 0.4, 1.1, 0]}>
            <boxGeometry args={[0.8, 2.2, 8.5]} />
            <meshStandardMaterial color="#403934" roughness={0.9} />
          </mesh>
          {/* Ivy/Grass topping the ravine behind the lab */}
          <mesh position={[side === 'left' ? -0.4 : 0.4, 2.25, 0]}>
            <boxGeometry args={[0.85, 0.1, 8.55]} />
            <meshStandardMaterial color="#1a3311" roughness={1.0} />
          </mesh>

          {/* 1. MAIN LAB BUILDING MODULE (Center) - Height 2.2 */}
          <group position={[0, 1.1, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.9, 2.2, 2.0]} />
              <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.6} />
            </mesh>
            
            {/* Glowing Laboratory Observation Terminal Window (Cyan Neon) */}
            <mesh position={[0.46, 0.3, 0]}>
              <planeGeometry args={[0.1, 0.8, 1.4]} />
              <meshBasicMaterial color="#00f5ff" />
            </mesh>
            
            {/* Warning Hazard Stripes on Building Frame */}
            <mesh position={[0.47, -0.9, 0]}>
              <boxGeometry args={[0.01, 0.15, 2.02]} />
              <meshStandardMaterial color="#eab308" roughness={0.5} />
            </mesh>

            {/* Scientific Radar/Antenna dish on top */}
            <group position={[0, 1.1, 0]}>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} />
              </mesh>
              <mesh position={[0, 0.25, 0]} rotation={[0.4, 0, 0]}>
                <coneGeometry args={[0.2, 0.15, 12, 1, true]} />
                <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.8} />
              </mesh>
            </group>
          </group>

          {/* 2. REACTION CHAMBER BUILDING MODULE (Left side) - Height 2.2 (Uniform height!) */}
          <group position={[0, 1.1, -2.1]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.9, 2.2, 1.6]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
            </mesh>

            {/* High-tech server vent / circular cooling fan */}
            <mesh position={[0.46, 0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
              <cylinderGeometry args={[0.25, 0.25, 0.04, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} />
            </mesh>

            {/* Glowing Blue Neon Terminal Light Bar */}
            <mesh position={[0.46, -0.4, 0]}>
              <boxGeometry args={[0.02, 0.08, 1.1]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>

          {/* 3. STORAGE CORES MODULE (Right side) - Height 2.2 (Uniform height!) */}
          <group position={[0, 1.1, 2.1]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.9, 2.2, 1.6]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
            </mesh>

            {/* Vertical toxic chemical pipelines linking modules */}
            <mesh position={[0.2, 0, -1.0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 2.1, 8]} />
              <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.2, 0, 1.0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 2.1, 8]} />
              <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Glowing warning terminal */}
            <mesh position={[0.46, 0.2, 0]}>
              <planeGeometry args={[0.1, 0.4, 0.4]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>

          {/* Symmetrical Solar energy grids on top of the side modules */}
          <mesh position={[0, 2.23, -2.1]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.8, 0.04, 1.3]} />
            <meshStandardMaterial color="#0b132b" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[0, 2.23, 2.1]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.8, 0.04, 1.3]} />
            <meshStandardMaterial color="#0b132b" roughness={0.1} metalness={0.9} />
          </mesh>
        </group>
      ) : (
        // Shattered destructed laboratory ruins! Smashed when a player is knocked into it!
        <group>
          {/* Smashed server consoles, metal shards, and rock debris */}
          {Array.from({ length: 14 }).map((_, i) => {
            const rx = (Math.random() - 0.5) * 1.6 + (side === 'left' ? -0.8 : 0.8);
            const rz = (Math.random() - 0.5) * 7.5;
            const ry = 0.12 + Math.random() * 0.4;
            const scale = 0.35 + Math.random() * 0.45;
            const isMetal = Math.random() > 0.4;
            return (
              <mesh key={i} position={[rx, ry, rz]} rotation={[Math.random() * 2, Math.random() * 2, 0]} scale={scale}>
                <boxGeometry args={[0.6, 0.4, 0.6]} />
                <meshStandardMaterial 
                  color={isMetal ? (Math.random() > 0.5 ? "#64748b" : "#475569") : "#3a3430"} 
                  roughness={isMetal ? 0.4 : 0.95} 
                  metalness={isMetal ? 0.7 : 0.1}
                />
              </mesh>
            );
          })}

          {/* Smashed server terminal faceplate with half-glowing sparks */}
          <mesh position={[side === 'left' ? -0.4 : 0.4, 0.15, (Math.random() - 0.5) * 2]} rotation={[1.4, 0.5, 0]}>
            <planeGeometry args={[0.6, 0.4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.2} />
          </mesh>

          {/* Flickering blue electric spark light source */}
          <pointLight color="#00f5ff" intensity={1.8} distance={4} />

          {/* Smashed solar grids lying in pieces */}
          <mesh position={[side === 'left' ? -0.5 : 0.5, 0.05, -2.5]} rotation={[0.1, 0.2, 1.5]}>
            <boxGeometry args={[0.7, 0.02, 0.6]} />
            <meshStandardMaterial color="#030712" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[side === 'left' ? -0.5 : 0.5, 0.05, 2.5]} rotation={[0.1, -0.2, -1.5]}>
            <boxGeometry args={[0.7, 0.02, 0.6]} />
            <meshStandardMaterial color="#030712" roughness={0.1} metalness={0.9} />
          </mesh>

          {/* High-tech scientific steam / smoke cloud escaping */}
          <RooftopDustCloud x={0} y={0.8} z={0} color="#cbd5e1" />
        </group>
      )}
    </group>
  );
};

const BreakableRooftopObject: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const isBroken = useGameStore(s => side === 'left' ? s.rooftopLeftBroken : s.rooftopRightBroken);
  const xPos = side === 'left' ? -12.3 : 12.3;
  
  return (
    <group position={[xPos, 0, -0.25]}>
      {!isBroken ? (
        // Untouched industrial rooftop objects
        <group>
          {side === 'left' ? (
            // Big HVAC/Electrical Unit + Pipes
            <group>
              {/* HVAC Unit block */}
              <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
                <boxGeometry args={[1.2, 2.2, 5.0]} />
                <meshStandardMaterial color="#718096" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Fan Grill */}
              <mesh position={[0.61, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.05, 12]} />
                <meshStandardMaterial color="#1a202c" roughness={0.5} />
              </mesh>
              {/* Pipes */}
              <mesh position={[-0.2, 0.4, 2.8]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 2.5, 8]} />
                <meshStandardMaterial color="#a0aec0" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Small Electrical Control Panel */}
              <mesh position={[0.1, 1.2, 1.8]} castShadow>
                <boxGeometry args={[0.4, 0.8, 0.6]} />
                <meshStandardMaterial color="#4a5568" />
              </mesh>
            </group>
          ) : (
            // Same height large unit to match left side
            <group>
              <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
                <boxGeometry args={[1.2, 2.2, 5.0]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.4} />
              </mesh>
              <mesh position={[-0.61, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.05, 12]} />
                <meshStandardMaterial color="#1a202c" roughness={0.5} />
              </mesh>
              {/* Steel safety barrier fence */}
              <mesh position={[0, 0.5, -2.5]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.1, 1.0, 3.0]} />
                <meshStandardMaterial color="#4a5568" metalness={0.8} />
              </mesh>
              <mesh position={[0, 0.5, 2.5]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.1, 1.0, 3.0]} />
                <meshStandardMaterial color="#4a5568" metalness={0.8} />
              </mesh>
            </group>
          )}
        </group>
      ) : (
        // Broken shattered HVAC / Satellite Dish
        <group>
          {side === 'left' ? (
            <group>
              {/* Broken pieces on floor */}
              <mesh position={[-0.4, 0.4, -1.2]} rotation={[0.5, 0.8, 1.1]}>
                <boxGeometry args={[1.0, 0.8, 1.2]} />
                <meshStandardMaterial color="#4a5568" metalness={0.5} />
              </mesh>
              <mesh position={[0.5, 0.2, 1.5]} rotation={[1.2, -0.4, 0.3]}>
                <boxGeometry args={[0.8, 0.5, 1.0]} />
                <meshStandardMaterial color="#2d3748" metalness={0.5} />
              </mesh>
              {/* Fallen pipe */}
              <mesh position={[0.8, 0.15, 0]} rotation={[0.2, 1.1, 1.55]}>
                <cylinderGeometry args={[0.15, 0.15, 1.8]} />
                <meshStandardMaterial color="#718096" metalness={0.8} />
              </mesh>
            </group>
          ) : (
            <group>
              {/* Shattered dish lying face down */}
              <mesh position={[0.7, 0.15, -0.5]} rotation={[1.5, 0.2, -0.8]}>
                <cylinderGeometry args={[1.2, 0.1, 0.3, 16]} />
                <meshStandardMaterial color="#cbd5e0" />
              </mesh>
              {/* Ruined base columns */}
              <mesh position={[-0.2, 0.2, 0]} rotation={[0.2, 0, 1.3]}>
                <cylinderGeometry args={[0.18, 0.25, 0.9]} />
                <meshStandardMaterial color="#718096" metalness={0.6} />
              </mesh>
            </group>
          )}
          {/* Dust and sparks rising from destroyed electrical HVAC/dish */}
          <RooftopDustCloud x={0} y={0.5} z={0} color="#a0aec0" />
          <group>
            {/* Sparks */}
            {Array.from({ length: 6 }).map((_, i) => (
              <pointLight key={i} position={[(Math.random() - 0.5) * 2, 0.2 + Math.random() * 1.5, (Math.random() - 0.5) * 2]} color="#ff9900" intensity={0.8} distance={2} />
            ))}
          </group>
        </group>
      )}
    </group>
  );
};

const RooftopEnv: React.FC = () => {
  const rooftopLeftBroken = useGameStore(s => s.rooftopLeftBroken);
  const rooftopRightBroken = useGameStore(s => s.rooftopRightBroken);

  // Background city buildings with reflective windows for daytime
  const buildings = React.useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => {
      const angle = (i / 28) * Math.PI * 2;
      const radius = 28 + Math.random() * 12;
      const height = 15 + Math.random() * 25;
      const width = 6 + Math.random() * 8;
      const depth = 6 + Math.random() * 8;
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius - 8,
        w: width,
        h: height,
        d: depth,
        color: i % 3 === 0 ? "#718096" : (i % 3 === 1 ? "#94a3b8" : "#475569"),
        // Windows
        windows: Array.from({ length: 12 }).map(() => ({
          wx: (Math.random() - 0.5) * (width - 1.5),
          wy: 2 + Math.random() * (height - 4),
          wz: depth / 2 + 0.05,
          color: Math.random() > 0.5 ? "#e2e8f0" : "#93c5fd" // soft daytime window reflection colors
        }))
      };
    });
  }, []);

  return (
    <group>
      {/* 2. Solid Concrete parapet / ledge walls enclosing the rooftop fight zone completely on all 4 sides */}
      {/* Back Wall */}
      <mesh position={[0, 0.3, -4.6]} castShadow receiveShadow>
        <boxGeometry args={[24.2, 0.6, 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      
      {/* Left Wall - moved to 11.8 to align with map boundaries, and made breakable */}
      {!rooftopLeftBroken ? (
        <mesh position={[-11.8, 0.3, 0.0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.6, 9.6]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      ) : (
        <group position={[-11.8, 0, 0]}>
          {/* Shattered wall debris on the floor */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh 
              key={`broken-l-${i}`} 
              position={[(Math.random() - 0.5) * 1.5, 0.15 + Math.random() * 0.4, (Math.random() - 0.5) * 8.5]} 
              rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[0.5, 0.35, 0.5]} />
              <meshStandardMaterial color="#222b35" roughness={0.9} />
            </mesh>
          ))}
          <RooftopDustCloud x={0} y={0.3} z={0} color="#778599" />
        </group>
      )}

      {/* Right Wall - moved to 11.8 to align with map boundaries, and made breakable */}
      {!rooftopRightBroken ? (
        <mesh position={[11.8, 0.3, 0.0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.6, 9.6]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      ) : (
        <group position={[11.8, 0, 0]}>
          {/* Shattered wall debris on the floor */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh 
              key={`broken-r-${i}`} 
              position={[(Math.random() - 0.5) * 1.5, 0.15 + Math.random() * 0.4, (Math.random() - 0.5) * 8.5]} 
              rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[0.5, 0.35, 0.5]} />
              <meshStandardMaterial color="#222b35" roughness={0.9} />
            </mesh>
          ))}
          <RooftopDustCloud x={0} y={0.3} z={0} color="#778599" />
        </group>
      )}

      {/* Front Wall (same height on all 4 sides) */}
      <mesh position={[0, 0.3, 4.4]} castShadow receiveShadow>
        <boxGeometry args={[24.2, 0.6, 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* 3. City Skyline buildings in distance */}
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2 - 15, b.z]}>
          {/* Main Tower Box */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Little glowing windows on front-facing side */}
          {b.windows.map((w, j) => (
            <mesh key={j} position={[w.wx, w.wy - b.h / 2, w.wz]}>
              <planeGeometry args={[0.3, 0.5]} />
              <meshBasicMaterial color={w.color} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

const HellEnv: React.FC = () => {
  return (
    <group>
      {/* Grey Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, -2]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#444444" roughness={0.9} />
      </mesh>
      {/* Red Moon */}
      <mesh position={[-15, 20, -30]}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      {/* Moon glow */}
      <mesh position={[-15, 20, -30]}>
        <sphereGeometry args={[4.5, 32, 32]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
      {/* Rocky Mountains Far Away */}
      {[-40, -20, 0, 20, 40].map((x, i) => (
        <mesh key={`mountain-${i}`} position={[x, -0.21, -40 + Math.abs(x)*0.2]} rotation={[0, Math.random(), 0]}>
          <coneGeometry args={[15, 35, 4]} />
          <meshStandardMaterial color="#2d2d2d" roughness={1.0} />
        </mesh>
      ))}
      {/* Fences around fight zone */}
      <mesh position={[0, 0.8, -3.5]}>
        <boxGeometry args={[20, 0.1, 0.05]} />
        <meshStandardMaterial color="#444444" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.4, -3.5]}>
        <boxGeometry args={[20, 0.1, 0.05]} />
        <meshStandardMaterial color="#444444" roughness={0.6} />
      </mesh>
      {[-9, -6, -3, 0, 3, 6, 9].map(x => (
         <mesh key={`post-${x}`} position={[x, 0.6, -3.5]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2]} />
            <meshStandardMaterial color="#333333" roughness={0.7} />
         </mesh>
      ))}
      <MountainZombie />
    </group>
  );
};

const HitImpactsGroup = () => {
  const hitImpacts = useGameStore(s => s.hitImpacts);
  return (
    <>
      {hitImpacts.map((impact) => (
        <HitImpactEffect key={impact.id} impact={impact} />
      ))}
    </>
  );
};

const noEvents = () => ({
  enabled: false,
  priority: 0,
  compute: () => {},
  connect: () => {},
  disconnect: () => {},
});

export const GameScene: React.FC = () => {
  const selectedMap = useGameStore(s => s.selectedMap);
  const isWar = selectedMap === 'WAR_OPPONENT';
  const isPark = selectedMap === 'PARK_FESTIVAL';
  const isHell = selectedMap === 'HELL';
  const isForest = selectedMap === 'FOREST';
  const isRooftop = selectedMap === 'ROOFTOP';

  return (
    <Canvas 
      shadows 
      events={noEvents}
      className="w-full h-full bg-neutral-950"
      dpr={1} 
      gl={{ powerPreference: "high-performance", antialias: false }}
    >
      {/* Bright daytime background and clear fog tailored to the selected stage */}
      <color attach="background" args={[isWar ? "#a3bacc" : (isPark ? "#87CEEB" : (isHell ? "#666666" : (isForest ? "#bae6fd" : (isRooftop ? "#090d16" : "#030101"))))]} />
      {(!isWar && !isPark && !isHell && !isForest && !isRooftop) && <fog attach="fog" args={["#030101", 8, 26]} />}
      {isPark && <fog attach="fog" args={["#87CEEB", 15, 35]} />}
      {isHell && <fog attach="fog" args={["#666666", 12, 45]} />}
      {isForest && <fog attach="fog" args={["#bae6fd", 15, 38]} />}
      {isRooftop && <fog attach="fog" args={["#cbd5e1", 15, 45]} />}
      
      <PerspectiveCamera makeDefault position={[0, 2, 7]} fov={45} />
      <CameraController />
      
      <Environment preset={(isPark || isHell || isRooftop) ? "forest" : (isForest ? "sunset" : "apartment")} />
      
      {/* Daylight Ambient Light */}
      <ambientLight intensity={isWar ? 1.35 : (isRooftop ? 1.35 : ((isPark || isHell || isForest) ? 1.5 : 0.6))} color={isWar ? "#f4f8ff" : (isRooftop ? "#cbd5e1" : ((isPark || isHell || isForest) ? "#ffffff" : "#ffd4cc"))} />
      
      {/* Atmospheric light bounce */}
      {isWar ? (
        <pointLight position={[0, -0.6, 0]} intensity={1.8} distance={25} color="#cbd9e8" />
      ) : (isPark || isHell || isForest) ? (
        <pointLight position={[0, 1.0, 0]} intensity={1.2} distance={25} color="#ffffff" />
      ) : isRooftop ? (
        <pointLight position={[0, -0.6, 0]} intensity={1.8} distance={25} color="#cbd9e8" />
      ) : (
        <pointLight position={[0, -0.6, 0]} intensity={5.5} distance={20} color="#ff3a00" />
      )}
      
      {/* Sunlight / Lab Overhead Light */}
      <directionalLight 
        position={[10, 16, 6]} 
        intensity={isWar ? 4.5 : (isRooftop ? 4.5 : ((isPark || isHell || isForest) ? 5.5 : 3.5))} 
        castShadow 
        shadow-mapSize={[256, 256]}
        shadow-bias={-0.0001}
        color={isWar ? "#fffaeb" : (isRooftop ? "#e2e8f0" : ((isPark || isHell || isForest) ? "#fffff0" : "#ffd3b3"))}
      />
      
      {/* Stage Environment */}
      {isWar ? (
         <>
           <WetFloor />
           <CitySkyline />
           <DestroyedRoom />
           <Rain />
           <MissileStrike />
           <WarAmbientExplosions />
         </>
      ) : isPark ? (
         <>
           <ParkFestivalEnv />
         </>
      ) : isHell ? (
         <>
           <HellEnv />
         </>
      ) : isForest ? (
         <>
           <ForestEnv />
           <BreakableCliff side="left" />
           <BreakableCliff side="right" />
         </>
      ) : isRooftop ? (
         <>
           <RooftopEnv />
           <Rain />
         </>
      ) : (
         <>
           <OuterRim />
           <Lava />
         </>
      )}
      
      <StageGroup />
 
      {/* Render Hit Impact particle explosions */}
      <HitImpactsGroup />
    </Canvas>
  );
};
