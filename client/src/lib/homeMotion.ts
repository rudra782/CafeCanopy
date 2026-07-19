export type HeroMotionValues = {
  cupX: number;
  cupY: number;
  cupZ: number;
  cupScale: number;
  cupRotX: number;
  cupRotY: number;
  cameraZ: number;
  cameraX: number;
};

export const initialHeroMotion: HeroMotionValues = {
  cupX: 0,
  cupY: 0,
  cupZ: 0,
  cupScale: 1,
  cupRotX: 0,
  cupRotY: 0.14,
  cameraZ: 5.2,
  cameraX: 0,
};
