import { memo, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const COFFEE_CUP_MODEL_PATH = '/assets/models/coffee-cup/scene.gltf';

type RealisticCoffeeCupProps = {
  groundY: number;
  receiveShadows: boolean;
  targetHeight: number;
};

function RealisticCoffeeCup({ groundY, receiveShadows, targetHeight }: RealisticCoffeeCupProps) {
  const gltf = useGLTF(COFFEE_CUP_MODEL_PATH);

  const { cupScene, offset, scale } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const safeHeight = Math.max(size.y, 0.0001);
    const normalizedScale = targetHeight / safeHeight;

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.castShadow = receiveShadows;
      object.receiveShadow = receiveShadows;

      const tuneMaterial = (material: THREE.Material) => {
        const clonedMaterial = material.clone();

        if (clonedMaterial instanceof THREE.MeshStandardMaterial) {
          clonedMaterial.roughness = Math.max(clonedMaterial.roughness, 0.58);
          clonedMaterial.metalness = Math.min(clonedMaterial.metalness, 0.04);
          clonedMaterial.envMapIntensity = 0.72;
          clonedMaterial.needsUpdate = true;
        }

        return clonedMaterial;
      };

      object.material = Array.isArray(object.material)
        ? object.material.map(tuneMaterial)
        : tuneMaterial(object.material);
    });

    return {
      cupScene: clone,
      offset: new THREE.Vector3(
        -center.x * normalizedScale,
        groundY - bounds.min.y * normalizedScale,
        -center.z * normalizedScale,
      ),
      scale: normalizedScale,
    };
  }, [gltf.scene, groundY, receiveShadows, targetHeight]);

  return (
    <group rotation={[0, -0.34, 0]}>
      <primitive object={cupScene} position={offset} scale={scale} />
    </group>
  );
}

useGLTF.preload(COFFEE_CUP_MODEL_PATH);

export default memo(RealisticCoffeeCup);
