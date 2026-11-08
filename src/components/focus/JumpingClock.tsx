import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * A tiny analog clock that hops between the timer control buttons with
 * spring physics. Purely decorative; respects prefers-reduced-motion and
 * the app's reduceAnimations setting by sitting still.
 */
export const JumpingClock: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [target, setTarget] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTarget((t) => (t + 1) % 3), 3600);
    return () => clearInterval(id);
  }, [reduceMotion]);

  // Three stop positions inside the button row (percent of container width)
  const stops = [18, 50, 82];
  const x = stops[target];

  return (
    <motion.div
      className="pointer-events-none absolute -top-9 z-10"
      animate={reduceMotion ? { left: `${stops[1]}%`, y: 0 } : { left: `${x}%`, y: [0, -14, 0] }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              left: { type: 'spring', stiffness: 120, damping: 14 },
              y: { duration: 0.9, times: [0, 0.45, 1], ease: 'easeOut' },
            }
      }
      style={{ translateX: '-50%' }}
      aria-hidden="true"
    >
      <svg width="34" height="34" viewBox="0 0 34 34" className="drop-shadow-sm">
        <circle cx="17" cy="17" r="15" fill="var(--md-sys-color-surface-container-high)" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1.5" />
        <line x1="17" y1="17" x2="17" y2="9" stroke="var(--md-sys-color-primary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="17" y1="17" x2="22" y2="20" stroke="var(--md-sys-color-primary)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="17" r="1.8" fill="var(--md-sys-color-primary)" />
      </svg>
    </motion.div>
  );
};
