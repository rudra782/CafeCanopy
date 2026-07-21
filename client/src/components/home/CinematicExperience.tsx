import { lazy, Suspense, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';
import { initialHeroMotion, type HeroMotionValues } from '../../lib/homeMotion';

const StickySceneCanvas = lazy(() => import('./StickySceneCanvas'));

gsap.registerPlugin(ScrollTrigger, useGSAP);

type CinematicExperienceProps = {
  onEnter: () => void;
  onWorkflow: () => void;
};

export default function CinematicExperience({ onEnter, onWorkflow }: CinematicExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const motion = useRef<HeroMotionValues>({ ...initialHeroMotion });
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();

  useGSAP(
    () => {
      if (reducedMotion) {
        gsap.set(copyRef.current, { autoAlpha: 1, y: 0, pointerEvents: 'auto', clearProps: 'transform' });
        gsap.set(markerRef.current, { autoAlpha: 0 });
        Object.assign(motion.current, { ...initialHeroMotion, cupY: 0, cupScale: 1, cupRotY: 0.14, beanScatter: 0 });
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: '+=3600',
          scrub: 1,
          pin: stickyRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.set(copyRef.current, { autoAlpha: 0, y: 24, pointerEvents: 'none' });
      gsap.set(markerRef.current, { autoAlpha: 0 });

      timeline
        .fromTo(motion.current, { cupY: 0, cupScale: 1, cupRotX: 0, cupRotY: 0.14, cupX: 0, cameraX: 0, cameraZ: 5.2, beanScatter: 0 }, { cupRotY: Math.PI * 0.08, cupRotX: -0.045, cameraZ: 4.9, duration: 0.18, ease: 'power2.inOut' }, 0.12)
        .to(motion.current, { beanScatter: 1, cupRotY: Math.PI * 0.12, cameraZ: 4.72, duration: 0.36, ease: 'power2.out' }, 0.12)
        .fromTo(copyRef.current, { autoAlpha: 0, y: 24, pointerEvents: 'none' }, { autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: 0.16, ease: 'power2.out' }, 0.42)
        .to(motion.current, { cupX: 1.35, cupRotY: Math.PI * 0.18, cupRotX: -0.08, cameraX: -0.22, cameraZ: 4.55, duration: 0.28 }, 0.55)
        .to(copyRef.current, { autoAlpha: 0, y: -42, pointerEvents: 'none', duration: 0.24, ease: 'power2.out' }, 0.82);

      window.requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: rootRef, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={rootRef}
      id="hero"
      className="cinematic-home"
      aria-labelledby="home-title"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <div ref={stickyRef} className="cinematic-home__sticky">
        <Suspense fallback={<div className="hero-canvas hero-canvas--loading" aria-hidden="true" />}>
          <StickySceneCanvas motion={motion} reducedMotion={reducedMotion} webglSupported={webglSupported} />
        </Suspense>

        <div className="cinematic-home__grain" aria-hidden="true" />
        <div ref={copyRef} className="cinematic-home__copy">
          <p className="home-eyebrow">CAFE OPERATIONS, REIMAGINED</p>
          <h1 id="home-title">Brew brilliance.<br />Run everything.</h1>
          <p className="home-support">Orders, kitchen, inventory and insights—one beautifully connected flow.</p>
          <p className="home-mantra" aria-label="Brew. Serve. Grow.">
            <span>BREW.</span><span>SERVE.</span><span>GROW.</span>
          </p>
          <div className="home-actions" aria-label="Homepage actions">
            <button className="home-button home-button--primary" type="button" onClick={onEnter}>Enter CafeCanopy</button>
            <button className="home-button home-button--ghost" type="button" onClick={onWorkflow}>See the workflow</button>
          </div>
        </div>

        <div ref={markerRef} className="phase-one-marker" id="workflow-preview" aria-hidden="true">
          <span>Phase 1 hero prepares the workflow reveal</span>
        </div>
      </div>
    </section>
  );
}
