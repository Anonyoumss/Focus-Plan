import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import type * as THREE from 'three';

const GAME_SECONDS = 45;

/**
 * Hidden 3D mini-game ("Focus Orbit"): catch falling orbs with a glowing
 * ring for 45 seconds. Unlocked by any badge or 4 focus sessions in a day.
 * Pure canvas + three.js, no game assets, respects reduced motion by
 * disabling orbit camera drift.
 */
export const EasterEggGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { locale } = useAppStore();
  const ar = locale === 'ar';
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [ended, setEnded] = useState(false);
  const scoreRef = useRef(0);
  const apiRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    void (async () => {
      const THREE = await import('three');
      if (disposed || !mountRef.current) return;
      const el = mountRef.current;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#1b1b1f');
      scene.fog = new THREE.Fog('#1b1b1f', 8, 20);
      const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 50);
      camera.position.set(0, 4, 9);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(3, 6, 4);
      scene.add(key);
      const rim = new THREE.PointLight(0x74c69d, 8, 20);
      rim.position.set(-3, 3, -2);
      scene.add(rim);

      // Player ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.08, 16, 48),
        new THREE.MeshStandardMaterial({ color: 0x74c69d, emissive: 0x2d6a4f, emissiveIntensity: 0.8 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.2, 0);
      scene.add(ring);

      // Orbs pool
      const orbGeo = new THREE.SphereGeometry(0.28, 20, 20);
      const orbColors = [0x74c69d, 0x40916c, 0xd8f3dc, 0xa7f3d0];
      const orbs: { m: THREE.Mesh; vy: number }[] = [];
      for (let i = 0; i < 14; i++) {
        const m = new THREE.Mesh(orbGeo, new THREE.MeshStandardMaterial({
          color: orbColors[i % orbColors.length], emissive: 0x1b4332, emissiveIntensity: 0.6,
        }));
        m.visible = false;
        scene.add(m);
        orbs.push({ m, vy: 0 });
      }
      let spawnTimer = 0;

      let targetX = 0;
      const onMove = (e: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        targetX = ((e.clientX - r.left) / r.width - 0.5) * 10;
      };
      renderer.domElement.addEventListener('pointermove', onMove);
      renderer.domElement.addEventListener('pointerdown', onMove);

      let last = performance.now();
      let elapsed = 0;
      const tick = (now: number) => {
        if (disposed) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        elapsed += dt;

        ring.position.x += (targetX - ring.position.x) * Math.min(1, dt * 10);
        if (!reduceMotion) ring.rotation.z += dt * 0.8;

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const o = orbs.find((x) => !x.m.visible);
          if (o) {
            o.m.visible = true;
            o.m.position.set((Math.random() - 0.5) * 8, 6 + Math.random() * 2, (Math.random() - 0.5) * 4);
            o.vy = 1.5 + Math.random() * 1.5 + elapsed * 0.02;
            spawnTimer = 0.45 + Math.random() * 0.4;
          }
        }

        for (const o of orbs) {
          if (!o.m.visible) continue;
          o.m.position.y -= o.vy * dt;
          o.m.rotation.y += dt * 2;
          const dx = o.m.position.x - ring.position.x;
          const dz = o.m.position.z;
          if (o.m.position.y <= 0.6 && Math.abs(dx) < 1.0 && Math.abs(dz) < 1.0) {
            o.m.visible = false;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            continue;
          }
          if (o.m.position.y < -1) o.m.visible = false;
        }

        if (!reduceMotion) {
          camera.position.x = Math.sin(elapsed * 0.3) * 0.4;
          camera.lookAt(0, 0, 0);
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      apiRef.current = {
        dispose: () => {
          disposed = true;
          cancelAnimationFrame(raf);
          renderer.domElement.removeEventListener('pointermove', onMove);
          renderer.domElement.removeEventListener('pointerdown', onMove);
          scene.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            mesh.geometry?.dispose?.();
            const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else mat?.dispose?.();
          });
          renderer.dispose();
          if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
        },
      };
    })();
    return () => apiRef.current?.dispose();
  }, []);

  // countdown
  useEffect(() => {
    if (ended) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setEnded(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ended]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,20,17,0.85)' }}
      role="dialog"
      aria-label={ar ? 'لعبة التركيز المخفية' : 'Hidden focus game'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border overflow-hidden"
        style={{ backgroundColor: 'var(--md-sys-color-surface-container)', borderColor: 'var(--md-sys-color-outline-variant)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {ar ? 'مدار التركيز' : 'Focus Orbit'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {ar ? 'العب بالماوس أو اللمس — امسك الكرات المتساقطة' : 'Move with mouse or touch — catch the falling orbs'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            aria-label={ar ? 'إغلاق' : 'Close'}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div ref={mountRef} className="relative w-full" style={{ height: 320 }}>
          {ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ backgroundColor: 'rgba(27,27,31,0.75)' }}>
              <p className="text-4xl font-bold font-timer" style={{ color: '#74c69d' }}>{score}</p>
              <p className="text-sm" style={{ color: '#e6e1e5' }}>
                {ar ? 'النقاط — وقت رائع!' : 'points — nice focus!'}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full font-semibold cursor-pointer"
                style={{ backgroundColor: '#74c69d', color: '#0b3b2e' }}
              >
                {ar ? 'حسناً' : 'Done'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-sm font-semibold"
          style={{ color: 'var(--md-sys-color-on-surface)' }}>
          <span>{ar ? 'الوقت' : 'Time'}: {timeLeft}s</span>
          <span>{ar ? 'النقاط' : 'Score'}: {score}</span>
        </div>
      </div>
    </div>
  );
};
