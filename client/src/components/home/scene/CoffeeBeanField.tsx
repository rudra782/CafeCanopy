import { memo, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HeroMotionValues } from '../../../lib/homeMotion';

type CoffeeBeanFieldProps = {
  count: number;
  motion: MutableRefObject<HeroMotionValues>;
  reducedMotion: boolean;
};

const BEAN_LAYOUT = [
  { x: -2.55, y: 1.05, z: -2.15 },
  { x: 2.4, y: 1.18, z: -2.3 },
  { x: -2.75, y: -0.55, z: -1.7 },
  { x: 2.75, y: -0.45, z: -1.55 },
  { x: 1.75, y: 0.42, z: -2.7 },
  { x: -2.1, y: 0.18, z: -2.55 },
  { x: 3.1, y: 0.62, z: -2.95 },
  { x: -3.05, y: 0.62, z: -2.85 },
  { x: 2.3, y: -1.05, z: -2.35 },
  { x: -2.25, y: -1.1, z: -2.25 },
  { x: 0.85, y: 1.52, z: -3.25 },
  { x: -0.9, y: 1.42, z: -3.15 },
  { x: 3.25, y: 1.52, z: -3.45 },
  { x: -3.25, y: 1.45, z: -3.35 },
];

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1);

function CoffeeBeanField({ count, motion, reducedMotion }: CoffeeBeanFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.12, 18, 10), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7b482b',
    roughness: 0.86,
    metalness: 0.02,
    transparent: true,
    opacity: 0.46,
  }), []);
  const beans = useMemo(() => BEAN_LAYOUT.slice(0, count).map((bean, index) => ({
    ...bean,
    startX: (index % 5 - 2) * 0.09,
    startY: -0.66 + (index % 3) * 0.08,
    startZ: -0.18 - (index % 4) * 0.04,
    stagger: index * 0.045,
    rot: index * 0.74,
    scale: 0.62 + (index % 4) * 0.1,
  })), [count]);

  const applyBeanMatrices = useCallback((scatter: number, elapsed = 0) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.visible = scatter > 0.002 || reducedMotion;

    beans.forEach((bean, index) => {
      const localProgress = reducedMotion ? 0 : easeOutCubic(clamp01((scatter - bean.stagger) / 0.34));
      const drift = reducedMotion ? 0 : Math.sin(elapsed * 0.22 + index) * 0.028 * localProgress;

      dummy.position.set(
        THREE.MathUtils.lerp(bean.startX, bean.x, localProgress),
        THREE.MathUtils.lerp(bean.startY, bean.y, localProgress) + drift,
        THREE.MathUtils.lerp(bean.startZ, bean.z, localProgress),
      );
      dummy.rotation.set(
        bean.rot * localProgress + elapsed * 0.055 * localProgress,
        bean.rot * 0.55 * localProgress,
        bean.rot * 0.2 * localProgress + elapsed * 0.03 * localProgress,
      );
      const beanScale = bean.scale * localProgress;
      dummy.scale.set(1.35 * beanScale, 0.58 * beanScale, 0.78 * beanScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [beans, dummy, reducedMotion]);

  useLayoutEffect(() => {
    applyBeanMatrices(reducedMotion ? 0 : motion.current.beanScatter);
  }, [applyBeanMatrices, motion, reducedMotion]);

  useFrame(({ clock }) => {
    applyBeanMatrices(motion.current.beanScatter, clock.elapsedTime);
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

export default memo(CoffeeBeanField);
