import { memo, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const COFFEE_CUP_MODEL_PATH = '/assets/models/coffee-cup/scene.gltf';

type RealisticCoffeeCupProps = {
  receiveShadows: boolean;
};

function RealisticCoffeeCup({ receiveShadows }: RealisticCoffeeCupProps) {
  const gltf = useGLTF(COFFEE_CUP_MODEL_PATH);

  const cupScene = useMemo(() => {
    const clone = gltf.scene.clone(true);

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

    return clone;
  }, [gltf.scene, receiveShadows]);

  return (
    <group position={[0, -0.56, 0]} rotation={[0, -0.34, 0]} scale={2.55}>
      <primitive object={cupScene} />
    </group>
  );
}

useGLTF.preload(COFFEE_CUP_MODEL_PATH);

export default memo(RealisticCoffeeCup);
