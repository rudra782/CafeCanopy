import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type CoffeeBeanFieldProps = {
  count: number;
  reducedMotion: boolean;
};

function CoffeeBeanField({ count, reducedMotion }: CoffeeBeanFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.12, 18, 10), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7b482b', roughness: 0.82, metalness: 0.02 }), []);
  const beans = useMemo(() => Array.from({ length: count }, (_, index) => ({
    x: (index / Math.max(count - 1, 1) - 0.5) * 4.7,
    y: Math.sin(index * 1.91) * 1.45,
    z: -0.8 - (index % 4) * 0.32,
    rot: index * 0.74,
    scale: 0.72 + (index % 3) * 0.13,
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
      dummy.position.set(bean.x, bean.y + Math.sin(elapsed * 0.28 + index) * 0.035, bean.z);
      dummy.rotation.set(bean.rot + elapsed * 0.08, bean.rot * 0.55, bean.rot * 0.2 + elapsed * 0.04);
      dummy.scale.set(1.35 * bean.scale, 0.58 * bean.scale, 0.78 * bean.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(index, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

export default memo(CoffeeBeanField);
