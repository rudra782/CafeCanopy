import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

const POSTER_SRC = '/assets/home/cafeCanopy-scroll-poster.jpg';
const MOBILE_SRC = '/assets/home/cafeCanopy-scroll-mobile.mp4';
const DESKTOP_WEBM_SRC = '/assets/home/cafeCanopy-scroll-web.webm';
const DESKTOP_MP4_SRC = '/assets/home/cafeCanopy-scroll-web.mp4';
const MOBILE_QUERY = '(max-width: 720px), (pointer: coarse) and (max-width: 920px)';
const SEEK_EPSILON_SECONDS = 0.08;

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ScrollScrubVideoProps = {
  rootRef: RefObject<HTMLElement | null>;
  stickyRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  onVideoError: () => void;
};

function getPrefersMobileSource() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

export default function ScrollScrubVideo({ rootRef, stickyRef, reducedMotion, onVideoError }: ScrollScrubVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const desiredTimeRef = useRef(0);
  const lastTimeRef = useRef(-1);
  const hiddenRef = useRef(typeof document !== 'undefined' ? document.hidden : false);
  const [isMobileSource, setIsMobileSource] = useState(getPrefersMobileSource);
  const sourceKey = isMobileSource ? 'mobile' : 'desktop';
  const [metadataReadyFor, setMetadataReadyFor] = useState<string | null>(null);

  const desktopSources = useMemo(() => [
    <source key="webm" src={DESKTOP_WEBM_SRC} type="video/webm" />,
    <source key="mp4" src={DESKTOP_MP4_SRC} type="video/mp4" />,
  ], []);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobileSource(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    desiredTimeRef.current = 0;
    lastTimeRef.current = -1;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      video.load();
    }
  }, [isMobileSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return undefined;

    const handleLoadedMetadata = () => {
      video.pause();
      video.muted = true;
      if (Number.isFinite(video.duration) && video.duration > 0) setMetadataReadyFor(sourceKey);
    };
    const handleError = () => onVideoError();
    const handleVisibility = () => {
      hiddenRef.current = document.hidden;
      if (!document.hidden && frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(seekVideo);
      }
    };
    const seekVideo = () => {
      frameRef.current = null;
      if (!hiddenRef.current && Number.isFinite(video.duration) && video.duration > 0) {
        const next = desiredTimeRef.current;
        if (Math.abs(next - lastTimeRef.current) > 0.015) {
          video.currentTime = next;
          lastTimeRef.current = next;
        }
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibility);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) handleLoadedMetadata();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [onVideoError, reducedMotion, sourceKey]);

  useGSAP(
    () => {
      const video = videoRef.current;
      if (!video || reducedMotion || metadataReadyFor !== sourceKey) return;

      triggerRef.current?.kill();
      triggerRef.current = ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: () => (isMobileSource ? '+=1600' : '+=3600'),
        scrub: 0.65,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (!Number.isFinite(video.duration) || video.duration <= 0) return;
          const maxTime = Math.max(0, video.duration - SEEK_EPSILON_SECONDS);
          desiredTimeRef.current = gsap.utils.clamp(0, maxTime, self.progress * maxTime);
          if (!document.hidden && frameRef.current === null) {
            frameRef.current = window.requestAnimationFrame(() => {
              frameRef.current = null;
              if (document.hidden) return;
              if (Math.abs(desiredTimeRef.current - lastTimeRef.current) > 0.015) {
                video.currentTime = desiredTimeRef.current;
                lastTimeRef.current = desiredTimeRef.current;
              }
            });
          }
        },
      });

      return () => {
        triggerRef.current?.kill();
        triggerRef.current = null;
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      };
    },
    { scope: stickyRef, dependencies: [metadataReadyFor, reducedMotion, isMobileSource, sourceKey] },
  );

  if (reducedMotion) {
    return <img className="scroll-scrub-video scroll-scrub-video--poster" src={POSTER_SRC} alt="" aria-hidden="true" />;
  }

  return (
    <video
      key={sourceKey}
      ref={videoRef}
      className="scroll-scrub-video"
      muted
      playsInline
      preload="auto"
      poster={POSTER_SRC}
      aria-hidden="true"
      tabIndex={-1}
      controls={false}
      disablePictureInPicture
    >
      {isMobileSource ? <source src={MOBILE_SRC} type="video/mp4" /> : desktopSources}
    </video>
  );
}
