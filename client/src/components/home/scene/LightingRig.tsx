export default function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-3.5, 4.5, 4]} intensity={2.2} color="#F2C28B" castShadow />
      <pointLight position={[3, 2.2, -2.8]} intensity={1.4} color="#8FB79B" />
      <pointLight position={[0, -1.5, 2]} intensity={0.7} color="#9A6035" />
    </>
  );
}
