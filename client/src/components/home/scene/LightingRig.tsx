export default function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.34} color="#E9DAC7" />
      <directionalLight
        position={[-3.8, 4.8, 4.2]}
        intensity={2.55}
        color="#FFD6A3"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[3.4, 2.4, -2.6]} intensity={0.78} color="#B8D1E6" />
      <pointLight position={[0.4, -0.8, 2.3]} intensity={0.52} color="#9B5933" />
    </>
  );
}
