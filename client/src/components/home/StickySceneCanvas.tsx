import { Suspense, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Shadow } from '@react-three/drei';
import * as THREE from 'three';
import { useResponsiveQuality } from '../../hooks/useResponsiveQuality';
import type { HeroMotionValues } from '../../lib/homeMotion';
import RealisticCoffeeCup from './scene/RealisticCoffeeCup';
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

  useFrame(() => {
    if (!cupRef.current) return;
    cupRef.current.position.set(motion.current.cupX, motion.current.cupY, motion.current.cupZ);
    cupRef.current.rotation.set(motion.current.cupRotX, motion.current.cupRotY, 0);
    cupRef.current.scale.setScalar(motion.current.cupScale);
  });

  return (
    <>
      <color attach="background" args={["#1A120E"]} />
      <SceneCamera motion={motion} />
      <Environment preset="apartment" environmentIntensity={0.24} />
      <LightingRig />
      <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.85, 64]} />
        <meshStandardMaterial color="#17110D" roughness={0.9} metalness={0} transparent opacity={0.74} />
      </mesh>
      <group ref={cupRef}>
        <RealisticCoffeeCup groundY={-1.25} receiveShadows={!quality.isMobile} targetHeight={quality.isMobile ? 1.28 : quality.isTablet ? 1.45 : 1.55} />
        <Shadow color="#000000" colorStop={0.46} opacity={0.26} scale={[1.72, 0.86, 1]} position={[0.03, -1.235, 0.04]} rotation={[-Math.PI / 2, 0, 0]} />
        <SteamParticles count={Math.min(quality.steamCount, 5)} reducedMotion={reducedMotion} position={[0, -0.36, 0.08]} />
      </group>
      <CoffeeBeanField count={quality.beanCount} motion={motion} reducedMotion={reducedMotion} />
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
