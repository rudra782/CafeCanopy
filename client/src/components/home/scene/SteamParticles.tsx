import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type SteamParticlesProps = {
  count: number;
  reducedMotion: boolean;
};

function SteamParticles({ count, reducedMotion }: SteamParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#F2E8D8',
    transparent: true,
    opacity: reducedMotion ? 0 : 0.09,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [reducedMotion]);
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.055, 0.58, 1, 8), []);
  const particles = useMemo(() => Array.from({ length: count }, (_, index) => ({
    x: (index - count / 2) * 0.11,
    y: 0.78 + index * 0.03,
    z: 0.02 - index * 0.02,
    phase: index * 0.9,
  })), [count]);

  useFrame(({ clock }) => {
    if (reducedMotion || !groupRef.current) return;
    const elapsed = clock.elapsedTime;
    groupRef.current.children.forEach((child, index) => {
      const particle = particles[index];
      child.position.x = particle.x + Math.sin(elapsed * 0.7 + particle.phase) * 0.024;
      child.position.y = particle.y + Math.sin(elapsed * 0.42 + particle.phase) * 0.024;
      child.rotation.z = Math.sin(elapsed * 0.5 + particle.phase) * 0.14;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((particle) => (
        <mesh key={particle.phase} geometry={geometry} material={material} position={[particle.x, particle.y, particle.z]} />
      ))}
    </group>
  );
}

export default memo(SteamParticles);
