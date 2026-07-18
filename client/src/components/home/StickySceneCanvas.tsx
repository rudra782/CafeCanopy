import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useResponsiveQuality } from '../../hooks/useResponsiveQuality';

const cream = '#F2E8D8';

type StickySceneCanvasProps = {
  progress: MutableRefObject<number>;
  reducedMotion: boolean;
  webglSupported: boolean;
};

type Bean = { x: number; y: number; z: number; r: number; speed: number };

function drawCup(ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) {
  const shift = Math.max(0, (progress - 0.72) / 0.28) * width * 0.17;
  const rise = (1 - Math.min(progress / 0.2, 1)) * 34;
  const rotation = (progress * 18 - 5) * Math.PI / 180;
  const scale = Math.min(width, height) / 620 * (0.9 + Math.min(progress / 0.18, 1) * 0.1);
  const cx = width / 2 + shift;
  const cy = height / 2 + rise;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation * 0.16);
  ctx.scale(scale, scale);

  const cupGradient = ctx.createLinearGradient(-120, -120, 120, 120);
  cupGradient.addColorStop(0, '#fff8ec');
  cupGradient.addColorStop(0.55, cream);
  cupGradient.addColorStop(1, '#b88b5d');

  ctx.shadowColor = 'rgba(154, 96, 53, .42)';
  ctx.shadowBlur = 44;
  ctx.beginPath();
  ctx.ellipse(0, 132, 148, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(154,96,53,.22)';
  ctx.fill();

  ctx.shadowBlur = 22;
  ctx.fillStyle = cupGradient;
  ctx.beginPath();
  ctx.moveTo(-88, -58);
  ctx.bezierCurveTo(-70, 92, -48, 130, 0, 132);
  ctx.bezierCurveTo(48, 130, 70, 92, 88, -58);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 16;
  ctx.strokeStyle = 'rgba(242,232,216,.88)';
  ctx.beginPath();
  ctx.ellipse(96, 12, 42, 58, 0.15, -1.1, 1.18);
  ctx.stroke();

  ctx.fillStyle = '#2A1711';
  ctx.beginPath();
  ctx.ellipse(0, -62, 96, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,248,236,.88)';
  ctx.lineWidth = 12;
  ctx.stroke();

  const coffeeGlow = ctx.createRadialGradient(-12, -66, 6, 0, -62, 95);
  coffeeGlow.addColorStop(0, 'rgba(201,242,123,.14)');
  coffeeGlow.addColorStop(1, '#2A1711');
  ctx.fillStyle = coffeeGlow;
  ctx.beginPath();
  ctx.ellipse(0, -62, 82, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export default function StickySceneCanvas({ progress, reducedMotion, webglSupported }: StickySceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const quality = useResponsiveQuality();
  const beans = useRef<Bean[]>([]);

  useEffect(() => {
    beans.current = Array.from({ length: quality.beanCount }, (_, index) => ({
      x: (index / Math.max(quality.beanCount - 1, 1) - 0.5) * 1.55,
      y: Math.sin(index * 1.7) * 0.32,
      z: 0.55 + (index % 3) * 0.26,
      r: index * 0.9,
      speed: 0.25 + index * 0.025,
    }));
  }, [quality.beanCount]);

  useEffect(() => {
    if (quality.isTouch || reducedMotion) return undefined;

    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [quality.isTouch, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrame = 0;
    let running = true;
    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * quality.dpr);
      canvas.height = Math.floor(height * quality.dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(quality.dpr, 0, 0, quality.dpr, 0, 0);
    };

    const draw = (time: number) => {
      const width = canvas.width / quality.dpr;
      const height = canvas.height / quality.dpr;
      const p = reducedMotion ? 0.18 : progress.current;
      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width * 0.5, height * 0.38, 0, width * 0.5, height * 0.38, width * 0.42);
      glow.addColorStop(0, 'rgba(154,96,53,.26)');
      glow.addColorStop(0.48, 'rgba(143,183,155,.13)');
      glow.addColorStop(1, 'rgba(10,16,13,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const parallaxX = pointer.current.x * (quality.isTouch ? 0 : 10);
      const parallaxY = pointer.current.y * (quality.isTouch ? 0 : 7);

      for (const bean of beans.current) {
        const depth = bean.z;
        const x = width / 2 + bean.x * width * 0.34 + parallaxX / depth;
        const y = height / 2 + bean.y * height * 0.46 + parallaxY / depth + Math.sin(time * 0.0004 * bean.speed + bean.r) * 8;
        const alpha = webglSupported ? 0.35 : 0.18;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(bean.r + p * 0.8);
        ctx.scale(1 / depth, 1 / depth);
        ctx.fillStyle = `rgba(154,96,53,${alpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(242,232,216,.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.quadraticCurveTo(0, 5, 9, 0);
        ctx.stroke();
        ctx.restore();
      }

      if (!reducedMotion) {
        for (let i = 0; i < quality.steamCount; i += 1) {
          const offset = (i - quality.steamCount / 2) * 18;
          const phase = time * 0.00045 + i;
          ctx.strokeStyle = `rgba(242,232,216,${0.14 - i * 0.01})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const baseX = width / 2 + offset + Math.max(0, (p - 0.72) / 0.28) * width * 0.17;
          const baseY = height / 2 - Math.min(width, height) * 0.18;
          ctx.moveTo(baseX, baseY);
          ctx.bezierCurveTo(baseX + Math.sin(phase) * 20, baseY - 42, baseX - Math.cos(phase) * 22, baseY - 88, baseX + Math.sin(phase + 1) * 14, baseY - 138);
          ctx.stroke();
        }
      }

      drawCup(ctx, width, height, p);

      if (running) animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      running = false;
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [progress, quality, reducedMotion, webglSupported]);

  return (
    <div className="hero-canvas" aria-hidden="true" data-webgl={webglSupported ? 'supported' : 'fallback'}>
      <canvas ref={canvasRef} />
      {!webglSupported && <div className="hero-canvas__fallback-note">Premium static fallback active</div>}
    </div>
  );
}
