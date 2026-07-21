import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type CoffeeBeanFieldProps = {
  count: number;
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

function CoffeeBeanField({ count, reducedMotion }: CoffeeBeanFieldProps) {
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
    rot: index * 0.74,
    scale: 0.62 + (index % 4) * 0.1,
  })), [count]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    beans.forEach((bean, index) => {
      dummy.position.set(bean.x, bean.y, bean.z);
      dummy.rotation.set(bean.rot, bean.rot * 0.55, bean.rot * 0.2);
      dummy.scale.set(1.35 * bean.scale, 0.58 * bean.scale, 0.78 * bean.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [beans, dummy]);

  useFrame(({ clock }) => {
    if (reducedMotion || !meshRef.current) return;

    const elapsed = clock.elapsedTime;
    beans.forEach((bean, index) => {
      dummy.position.set(bean.x, bean.y + Math.sin(elapsed * 0.22 + index) * 0.028, bean.z);
      dummy.rotation.set(bean.rot + elapsed * 0.055, bean.rot * 0.55, bean.rot * 0.2 + elapsed * 0.03);
      dummy.scale.set(1.35 * bean.scale, 0.58 * bean.scale, 0.78 * bean.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(index, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

export default memo(CoffeeBeanField);
