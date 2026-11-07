import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

interface WavyRingProps {
  /** 0..1 fraction of the ring that should be filled */
  progress: number;
  size?: number;
  strokeWidth?: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Progress ring whose leading edge ripples like a wave.
 * The phase is animated with anime.js; with reduced motion the wave is static.
 */
export const WavyRing: React.FC<WavyRingProps> = ({
  progress,
  size = 320,
  strokeWidth = 10,
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const phaseRef = useRef(0);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const draw = (phase: number) => {
    const p = Math.min(1, Math.max(0, progressRef.current));
    const el = pathRef.current;
    if (!el) return;
    if (p <= 0) {
      el.setAttribute('d', '');
      return;
    }

    const radius = (size - strokeWidth * 2) / 2;
    const center = size / 2;
    const waveAmp = 7;
    const waveFreq = 6;
    const sweep = p * Math.PI * 2;
    const steps = Math.max(24, Math.floor((sweep / (Math.PI * 2)) * 160));

    let d = '';
    for (let i = 0; i <= steps; i++) {
      const theta = -Math.PI / 2 + (i / steps) * sweep;
      const wave = waveAmp * Math.sin(theta * waveFreq - phase);
      const r = radius + wave;
      const x = center + r * Math.cos(theta);
      const y = center + r * Math.sin(theta);
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }
    el.setAttribute('d', d);
  };

  useEffect(() => {
    draw(phaseRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, size, strokeWidth]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      phaseRef.current = 0;
      draw(0);
      return;
    }
    const state = { phase: 0 };
    const animation = animate(state, {
      phase: Math.PI * 2,
      duration: 2600,
      loop: true,
      ease: 'linear',
      onUpdate: () => {
        phaseRef.current = state.phase;
        draw(state.phase);
      },
    });
    return () => {
      animation.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  return (
    <svg
      className="w-full h-full"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        style={{ stroke: 'var(--md-sys-color-surface-container-highest)', opacity: 0.5 }}
      />
      <path
        ref={pathRef}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: 'var(--md-sys-color-primary)' }}
      />
    </svg>
  );
};
