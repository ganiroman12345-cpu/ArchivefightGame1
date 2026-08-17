import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NpcAura3DProps {
  type: string;
  color: string;
  active?: boolean;
}

export const NpcAura3D: React.FC<NpcAura3DProps> = ({ color, active = true }) => {
  const outerGroupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const currentOpacityRef = useRef<number>(0);
  
  // Pre-calculate positions for performance
  const particlesData = useMemo(() => {
      return Array.from({ length: 25 }).map((_, i) => {
          const angle = (i / 25) * Math.PI * 2;
          const radius = 0.3 + (i % 3) * 0.2;
          return {
              x: Math.cos(angle) * radius,
              y: (i * 0.1) - 0.5,
              z: Math.sin(angle) * radius,
              speed: 1.5 + (i % 4) * 0.8,
              scale: 0.5 + Math.random() * 0.5
          };
      });
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Smooth fade in / fade out transition (approx 250ms)
    const targetOpacity = active ? 1.0 : 0.0;
    currentOpacityRef.current += (targetOpacity - currentOpacityRef.current) * Math.min(1.0, delta * 6.0);
    const op = currentOpacityRef.current;
    
    // Jagged flame effect scaling
    if (outerGroupRef.current) {
        outerGroupRef.current.visible = op > 0.005;
        const fadeScale = 0.3 + op * 0.7;
        outerGroupRef.current.scale.x = (1.0 + Math.sin(time * 18) * 0.12) * fadeScale;
        outerGroupRef.current.scale.z = (1.0 + Math.sin(time * 18) * 0.12) * fadeScale;
        outerGroupRef.current.scale.y = (1.0 + Math.cos(time * 25) * 0.08) * fadeScale;
        outerGroupRef.current.rotation.y += delta * 1.5;
    }
    
    if (innerRef.current) {
        innerRef.current.scale.x = 0.8 + Math.sin(time * 14) * 0.06;
        innerRef.current.scale.z = 0.8 + Math.sin(time * 14) * 0.06;
        innerRef.current.rotation.y -= delta * 2;
    }
    
    if (particlesRef.current) {
        particlesRef.current.children.forEach((child, i) => {
            const data = particlesData[i];
            child.position.y += delta * data.speed;
            if (child.position.y > 2.0) {
                child.position.y = -0.6;
            }
            if ((child as THREE.Mesh).material) {
                const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
                mat.opacity = 0.7 * op;
            }
        });
    }

    if (lightRef.current) {
        lightRef.current.intensity = 2.5 * op;
    }
  });

  return (
    <group ref={outerGroupRef} position={[0, 0.75, 0]}>
      {/* Upward floating energy particles/sparks */}
      <group ref={particlesRef}>
          {particlesData.map((data, i) => (
              <mesh key={i} position={[data.x, data.y, data.z]} scale={[data.scale, data.scale * 1.5, data.scale]}>
                  <boxGeometry args={[0.06, 0.25, 0.06]} />
                  <meshBasicMaterial color={i % 3 === 0 ? "#ffffff" : color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
          ))}
      </group>
      
      {/* Point light to cast glow on environment */}
      <pointLight ref={lightRef} color={color} intensity={0} distance={4.5} position={[0, -0.2, 0]} />
    </group>
  );
};
