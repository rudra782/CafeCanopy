import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';

const StickySceneCanvas = lazy(() => import('./StickySceneCanvas'));

type CinematicExperienceProps = {
  onEnter: () => void;
  onWorkflow: () => void;
};

export default function CinematicExperience({ onEnter, onWorkflow }: CinematicExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [visualProgress, setVisualProgress] = useState(0);
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();

  useEffect(() => {
    if (reducedMotion) {
      progress.current = 0.16;
      return undefined;
    }

    let frame = 0;
    let lastProgress = -1;

    const updateProgress = () => {
      const root = rootRef.current;
      if (!root) return;

      const rect = root.getBoundingClientRect();
      const travel = Math.max(rect.height - window.innerHeight, 1);
      const next = Math.min(Math.max(-rect.top / travel, 0), 1);
      progress.current = next;

      if (Math.abs(next - lastProgress) > 0.012) {
        lastProgress = next;
        setVisualProgress(next);
      }
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reducedMotion]);

  const displayedProgress = reducedMotion ? 0.16 : visualProgress;
  const textStyle = reducedMotion ? undefined : {
    opacity: Math.max(0, 1 - displayedProgress * 1.5),
    transform: `translate3d(0, ${displayedProgress * -42}px, 0)`,
  };

  return (
    <section
      ref={rootRef}
      id="hero"
      className="cinematic-home"
      aria-labelledby="home-title"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <div className="cinematic-home__sticky">
        <Suspense fallback={<div className="hero-canvas hero-canvas--loading" aria-hidden="true" />}>
          <StickySceneCanvas progress={progress} reducedMotion={reducedMotion} webglSupported={webglSupported} />
        </Suspense>

        <div className="cinematic-home__grain" aria-hidden="true" />
        <div className="cinematic-home__copy" style={textStyle}>
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

        <div className="phase-one-marker" id="workflow-preview" aria-hidden="true">
          <span>Phase 1 hero prepares the workflow reveal</span>
        </div>
      </div>
    </section>
  );
}
