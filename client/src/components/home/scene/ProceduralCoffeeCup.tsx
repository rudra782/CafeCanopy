import { memo, useMemo } from 'react';
import * as THREE from 'three';

export type CupMaterials = {
  ceramic: THREE.MeshStandardMaterial;
  coffee: THREE.MeshStandardMaterial;
  saucer: THREE.MeshStandardMaterial;
};

type ProceduralCoffeeCupProps = {
  materials: CupMaterials;
};

function ProceduralCoffeeCup({ materials }: ProceduralCoffeeCupProps) {
  const bodyGeometry = useMemo(() => new THREE.CylinderGeometry(0.82, 0.58, 1.24, 64, 1, true), []);
  const coffeeGeometry = useMemo(() => new THREE.CylinderGeometry(0.73, 0.73, 0.035, 64), []);
  const saucerGeometry = useMemo(() => new THREE.CylinderGeometry(1.12, 1.24, 0.12, 64), []);
  const handleGeometry = useMemo(() => new THREE.TorusGeometry(0.38, 0.055, 16, 48, Math.PI * 1.28), []);

  return (
    <group>
      <mesh geometry={bodyGeometry} material={materials.ceramic} castShadow receiveShadow position={[0, 0, 0]} />
      <mesh geometry={coffeeGeometry} material={materials.coffee} position={[0, 0.64, 0]} receiveShadow />
      <mesh geometry={saucerGeometry} material={materials.saucer} position={[0, -0.72, 0]} receiveShadow />
      <mesh geometry={handleGeometry} material={materials.ceramic} position={[0.78, 0.08, 0]} rotation={[0, 0, Math.PI * 0.5]} castShadow />
    </group>
  );
}

export default memo(ProceduralCoffeeCup);
