import { lazy, Suspense, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';
import { initialHeroMotion, type HeroMotionValues } from '../../lib/homeMotion';
import DashboardReveal from './DashboardReveal';
import ProductRevealCopy from './ProductRevealCopy';

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
  const productStageRef = useRef<HTMLDivElement>(null);
  const productCopyRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const motion = useRef<HeroMotionValues>({ ...initialHeroMotion });
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();

  useGSAP(
    () => {
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 720;
      const isTablet = viewportWidth > 720 && viewportWidth <= 1040;
      const heroCup = isMobile
        ? { cupX: 0.42, cupY: 0.12, cupScale: 0.74, cameraX: -0.02, cameraZ: 4.82 }
        : isTablet
          ? { cupX: 0.68, cupY: 0.12, cupScale: 0.8, cameraX: -0.03, cameraZ: 4.72 }
          : { cupX: 0.9, cupY: 0.12, cupScale: 0.84, cameraX: -0.04, cameraZ: 4.65 };
      const dashboardCup = isMobile
        ? { cupX: 0.54, cupY: 0.2, cupScale: 0.62, cameraX: -0.02, cameraZ: 4.95 }
        : isTablet
          ? { cupX: 0.88, cupY: 0.18, cupScale: 0.7, cameraX: -0.04, cameraZ: 4.86 }
          : { cupX: 1.18, cupY: 0.18, cupScale: 0.76, cameraX: -0.06, cameraZ: 4.78 };
      const stableCup = isMobile
        ? { cupX: 0.62, cupY: 0.22, cupScale: 0.56, cameraX: -0.03, cameraZ: 5.02 }
        : isTablet
          ? { cupX: 1.02, cupY: 0.2, cupScale: 0.64, cameraX: -0.05, cameraZ: 4.92 }
          : { cupX: 1.38, cupY: 0.2, cupScale: 0.68, cameraX: -0.08, cameraZ: 4.85 };
      if (reducedMotion) {
        gsap.set(copyRef.current, { autoAlpha: 1, y: 0, pointerEvents: 'auto', clearProps: 'transform' });
        gsap.set(markerRef.current, { autoAlpha: 0 });
        gsap.set([productStageRef.current, productCopyRef.current, dashboardRef.current], { autoAlpha: 1, clearProps: 'transform,filter' });
        gsap.set(productStageRef.current, { pointerEvents: 'auto' });
        Object.assign(motion.current, { ...initialHeroMotion, ...stableCup, cupRotY: Math.PI * 0.2, beanScatter: 1 });
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
      gsap.set(productStageRef.current, { autoAlpha: 0, pointerEvents: 'none' });
      gsap.set(productCopyRef.current, { autoAlpha: 0, y: 34 });
      gsap.set(dashboardRef.current, { autoAlpha: 0, y: 88, x: 44, scale: 0.9, rotateX: 8, rotateY: -7, filter: 'blur(14px)', transformPerspective: 1100, transformOrigin: '58% 54%' });
      gsap.set('.dashboard-card, .dashboard-panel', { autoAlpha: 0, y: 18 });

      timeline
        .fromTo(motion.current, { cupY: 0, cupScale: 1, cupRotX: 0, cupRotY: 0.14, cupX: 0, cameraX: 0, cameraZ: 5.2, beanScatter: 0 }, { cupRotY: Math.PI * 0.08, cupRotX: -0.045, cameraZ: 4.9, duration: 0.18, ease: 'power2.inOut' }, 0.12)
        .to(motion.current, { beanScatter: 1, cupRotY: Math.PI * 0.12, cameraZ: 4.72, duration: 0.36, ease: 'power2.out' }, 0.12)
        .fromTo(copyRef.current, { autoAlpha: 0, y: 24, pointerEvents: 'none' }, { autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: 0.16, ease: 'power2.out' }, 0.42)
        .to(motion.current, { ...heroCup, cupRotY: Math.PI * 0.18, cupRotX: -0.08, duration: 0.28 }, 0.55)
        .to(copyRef.current, { autoAlpha: 0, y: -42, pointerEvents: 'none', duration: 0.24, ease: 'power2.out' }, 0.82)
        .to(motion.current, { ...dashboardCup, cupRotY: Math.PI * 0.22, duration: 0.34, ease: 'power2.inOut' }, 0.9)
        .to(productStageRef.current, { autoAlpha: 1, pointerEvents: 'auto', duration: 0.06 }, 0.94)
        .to(dashboardRef.current, { autoAlpha: 1, y: 0, x: 0, scale: 1, rotateX: 0, rotateY: 0, filter: 'blur(0px)', duration: 0.46, ease: 'power3.out' }, 1.02)
        .to(productCopyRef.current, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out' }, 1.18)
        .to('.dashboard-card, .dashboard-panel', { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.035, ease: 'power2.out' }, 1.22)
        .to(motion.current, { ...stableCup, cupRotX: -0.05, cupRotY: Math.PI * 0.2, duration: 0.34 }, 1.32);

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

        <div ref={productStageRef} className="product-reveal-stage">
          <div ref={productCopyRef}><ProductRevealCopy /></div>
          <div ref={dashboardRef}><DashboardReveal /></div>
        </div>

        <div ref={markerRef} className="phase-one-marker" id="workflow-preview" aria-hidden="true">
          <span>Phase 1 hero prepares the workflow reveal</span>
        </div>
      </div>
    </section>
  );
}
