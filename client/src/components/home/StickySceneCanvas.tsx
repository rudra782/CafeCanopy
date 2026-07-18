import { Suspense, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useResponsiveQuality } from '../../hooks/useResponsiveQuality';
import type { HeroMotionValues } from '../../lib/homeMotion';
import ProceduralCoffeeCup from './scene/ProceduralCoffeeCup';
import LightingRig from './scene/LightingRig';
import CoffeeBeanField from './scene/CoffeeBeanField';
import SteamParticles from './scene/SteamParticles';

type StickySceneCanvasProps = {
  motion: MutableRefObject<HeroMotionValues>;
  reducedMotion: boolean;
  webglSupported: boolean;
};

function SceneCamera({ motion }: { motion: MutableRefObject<HeroMotionValues> }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const target = useMemo(() => new THREE.Vector3(0, 0.1, 0), []);

  useFrame(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.position.set(motion.current.cameraX, 0.15, motion.current.cameraZ);
    camera.lookAt(target);
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault fov={38} position={[0, 0.15, 5.2]} />;
}

function HomeScene({ motion, reducedMotion }: { motion: MutableRefObject<HeroMotionValues>; reducedMotion: boolean }) {
  const cupRef = useRef<THREE.Group>(null);
  const quality = useResponsiveQuality();
  const materials = useMemo(() => ({
    ceramic: new THREE.MeshStandardMaterial({ color: '#F2E8D8', roughness: 0.62, metalness: 0.02 }),
    coffee: new THREE.MeshStandardMaterial({ color: '#2A1711', roughness: 0.78, metalness: 0.0 }),
    saucer: new THREE.MeshStandardMaterial({ color: '#D8C9B4', roughness: 0.7, metalness: 0.01 }),
  }), []);

  useFrame(() => {
    if (!cupRef.current) return;
    cupRef.current.position.set(motion.current.cupX, motion.current.cupY, motion.current.cupZ);
    cupRef.current.rotation.set(motion.current.cupRotX, motion.current.cupRotY, 0);
    cupRef.current.scale.setScalar(motion.current.cupScale);
  });

  return (
    <>
      <color attach="background" args={["#0A100D"]} />
      <SceneCamera motion={motion} />
      <LightingRig />
      <group ref={cupRef}>
        <ProceduralCoffeeCup materials={materials} />
        <SteamParticles count={quality.steamCount} reducedMotion={reducedMotion} />
      </group>
      <CoffeeBeanField count={quality.beanCount} reducedMotion={reducedMotion} />
    </>
  );
}

function WebGLFallback() {
  return (
    <div className="hero-canvas hero-canvas--fallback" aria-hidden="true">
      <div className="css-cup">
        <span className="css-cup__steam css-cup__steam--one" />
        <span className="css-cup__steam css-cup__steam--two" />
        <span className="css-cup__body" />
        <span className="css-cup__handle" />
        <span className="css-cup__saucer" />
      </div>
      <div className="hero-canvas__fallback-note">Premium non-WebGL fallback active</div>
    </div>
  );
}

export default function StickySceneCanvas({ motion, reducedMotion, webglSupported }: StickySceneCanvasProps) {
  const quality = useResponsiveQuality();

  if (!webglSupported) return <WebGLFallback />;

  return (
    <div className="hero-canvas" aria-hidden="true" data-webgl="supported">
      <Canvas
        dpr={quality.dpr}
        frameloop={reducedMotion ? 'demand' : 'always'}
        shadows={!quality.isMobile}
        gl={{ antialias: true, alpha: true, powerPreference: quality.isMobile ? 'default' : 'high-performance' }}
      >
        <Suspense fallback={null}>
          <HomeScene motion={motion} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
