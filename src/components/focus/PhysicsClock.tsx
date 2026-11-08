import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { useAppStore } from '../../store/useAppStore';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export const PhysicsClock: React.FC = () => {
  const {
    locale,
    todaySessionsCount,
    isRunning,
    reduceAnimations,
    physicsClockEnabled,
    physicsClockLowMotion,
    interactiveSoundEnabled,
  } = useAppStore();
  const ar = locale === 'ar';

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [speech, setSpeech] = useState<string | null>(null);
  const [clockTime, setClockTime] = useState<{ hh: string; mm: string; ss: string }>({
    hh: '12',
    mm: '00',
    ss: '00',
  });

  // Matter JS Engine references
  const engineRef = useRef<Matter.Engine | null>(null);
  const clockBodyRef = useRef<Matter.Body | null>(null);
  const buttonBodiesRef = useRef<Matter.Body[]>([]);

  // Clock Hand Angles for Analogue rendering
  const [angles, setAngles] = useState({ sec: 0, min: 0, hr: 0 });

  // Web Audio Synth for Impact Sounds and Ticks
  const playImpactSound = (intensity: number) => {
    if (!interactiveSoundEnabled) return;
    try {
      if (typeof window === 'undefined') return;
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') ctx?.resume();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 400 + Math.random() * 200;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

      const vol = Math.min(0.4, 0.05 + intensity * 0.03);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext fallback
    }
  };

  // Real-time Clock Hands Tick
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const s = d.getSeconds();
      const m = d.getMinutes();
      const h = d.getHours() % 12;

      setClockTime({
        hh: d.getHours().toString().padStart(2, '0'),
        mm: m.toString().padStart(2, '0'),
        ss: s.toString().padStart(2, '0'),
      });

      setAngles({
        sec: (s / 60) * 360,
        min: ((m + s / 60) / 60) * 360,
        hr: ((h + m / 60) / 12) * 360,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dust Particle Burst Generator on Impact
  const spawnImpactParticles = (x: number, y: number, count = 8) => {
    const colors = ['var(--md-sys-color-primary)', 'var(--md-sys-color-tertiary)', '#e2e8f0'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 60;
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        alpha: 1,
        color: colors[i % colors.length],
      });
    }
  };

  // Particle Canvas Render Loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 2.5;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initialize Matter.js Physics World & DOM Button Rigid Bodies
  useEffect(() => {
    if (!containerRef.current || reduceAnimations || physicsClockLowMotion) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = 450;

    // Create Matter Engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.2, scale: 0.001 },
    });
    engineRef.current = engine;

    // Create Boundaries (Floor, Left, Right)
    const ground = Matter.Bodies.rectangle(width / 2, height + 20, width * 2, 40, {
      isStatic: true,
      friction: 0.8,
      restitution: 0.5,
    });
    const leftWall = Matter.Bodies.rectangle(-20, height / 2, 40, height * 2, {
      isStatic: true,
    });
    const rightWall = Matter.Bodies.rectangle(width + 20, height / 2, 40, height * 2, {
      isStatic: true,
    });

    // Create Clock Rigid Body (Circle)
    const clockBody = Matter.Bodies.circle(width / 2, 60, 26, {
      restitution: 0.65,
      friction: 0.2,
      density: 0.005,
      label: 'physics_clock',
    });
    clockBodyRef.current = clockBody;

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall, clockBody]);

    // Query visible buttons on screen and build static obstacle boxes
    const updateButtonObstacles = () => {
      buttonBodiesRef.current.forEach((b) => Matter.Composite.remove(engine.world, b));
      buttonBodiesRef.current = [];

      if (typeof document === 'undefined') return;
      const parentRect = container.getBoundingClientRect();
      const buttons = Array.from(document.querySelectorAll('button'));

      buttons.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
          const bx = rect.left - parentRect.left + rect.width / 2;
          const by = rect.top - parentRect.top + rect.height / 2;

          if (bx >= -50 && bx <= width + 50 && by >= 0 && by <= height + 100) {
            const btnBody = Matter.Bodies.rectangle(bx, by, rect.width, rect.height, {
              isStatic: true,
              chamfer: { radius: 12 },
              friction: 0.5,
              restitution: 0.7,
              label: 'button_obstacle',
            });
            buttonBodiesRef.current.push(btnBody);
            Matter.Composite.add(engine.world, btnBody);
          }
        }
      });
    };

    updateButtonObstacles();
    window.addEventListener('resize', updateButtonObstacles);

    // Physics Engine Step Loop
    let animId: number;
    let lastStep = performance.now();

    const renderLoop = (now: number) => {
      const delta = Math.min(now - lastStep, 32);
      lastStep = now;

      Matter.Engine.update(engine, delta);

      if (clockBodyRef.current && containerRef.current) {
        const clockElem = containerRef.current.querySelector('.physics-clock-body') as HTMLElement;
        if (clockElem) {
          const { x, y } = clockBodyRef.current.position;
          const angle = clockBodyRef.current.angle;
          clockElem.style.transform = `translate3d(${x - 28}px, ${y - 28}px, 0) rotate(${angle}rad)`;
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    // Collision Impact Event Listener
    Matter.Events.on(engine, 'collisionStart', (evt) => {
      evt.pairs.forEach((pair) => {
        if (pair.bodyA === clockBody || pair.bodyB === clockBody) {
          const speed = Matter.Vector.magnitude(clockBody.velocity);
          if (speed > 1.5) {
            playImpactSound(speed);
            spawnImpactParticles(clockBody.position.x, clockBody.position.y, Math.min(12, Math.floor(speed * 3)));
          }
        }
      });
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateButtonObstacles);
      Matter.Engine.clear(engine);
    };
  }, [reduceAnimations]);

  // Handle User Clicking / Launching the Physics Clock
  const handleClockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clockBodyRef.current) return;

    // Apply sudden upward force & torque impulse!
    const forceX = (Math.random() - 0.5) * 0.05;
    const forceY = -0.08 - Math.random() * 0.04;
    Matter.Body.applyForce(clockBodyRef.current, clockBodyRef.current.position, {
      x: forceX,
      y: forceY,
    });
    Matter.Body.setAngularVelocity(clockBodyRef.current, (Math.random() - 0.5) * 0.3);

    playImpactSound(6);
    spawnImpactParticles(clockBodyRef.current.position.x, clockBodyRef.current.position.y, 10);

    const quotes = ar
      ? [
          'أنا ساعة الفيزياء الحقيقية! ⏰',
          todaySessionsCount >= 4 ? 'أنت بطل! فتحت لعبة 3D Arcade! 🎮' : `جلسة ${todaySessionsCount + 1} من 4 لإلغاء قفل 3D Arcade! 🎮`,
          'ركز واستمر في الإنجاز! ⚡',
          'كل ثانية تحسب لصالح هدفك! 🚀',
          isRunning ? 'المؤقت يعمل.. تركيز كامل! 🤫' : 'جاهز للبدء؟ اضغط ابدأ! ▶️',
        ]
      : [
          'I am the 2D Physics Clock! ⏰',
          todaySessionsCount >= 4 ? 'Awesome! 3D Focus Arcade unlocked! 🎮' : `Session ${todaySessionsCount + 1} of 4 to unlock 3D Arcade 🎮`,
          'Great momentum! Keep it up! ⚡',
          'Every second brings you closer to your goal! 🚀',
          isRunning ? 'Timer is ticking.. zero distractions! 🤫' : 'Ready to start? Press Play! ▶️',
        ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setSpeech(randomQuote);
    setTimeout(() => setSpeech(null), 4000);
  };

  if (!physicsClockEnabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-[450px] overflow-hidden pointer-events-none z-20"
    >
      {/* Particle Canvas for Collision Dust */}
      <canvas
        ref={canvasRef}
        width={600}
        height={450}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Interactive 2D Physics Clock Body */}
      <div
        className="physics-clock-body absolute top-0 left-0 w-14 h-14 pointer-events-auto cursor-grab active:cursor-grabbing select-none transition-shadow"
        onClick={handleClockClick}
        title={ar ? 'ساعة الفيزياء تفاعلية! انقر لإطلاقها في الهواء!' : 'Interactive 2D Physics Clock! Click to fling into the air!'}
      >
        {/* Speech Bubble */}
        {speech && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-lg border animate-bounce z-40 pointer-events-none"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            {speech}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{ backgroundColor: 'var(--md-sys-color-primary-container)' }}
            />
          </div>
        )}

        {/* Analogue Physics Clock Graphic */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Top Twin Alarm Bells */}
          <div
            className="absolute -top-1.5 left-1 w-4 h-4 rounded-full border-2 shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-tertiary)',
              borderColor: 'var(--md-sys-color-on-tertiary)',
            }}
          />
          <div
            className="absolute -top-1.5 right-1 w-4 h-4 rounded-full border-2 shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-tertiary)',
              borderColor: 'var(--md-sys-color-on-tertiary)',
            }}
          />

          {/* Clock Face Plate */}
          <div
            className="w-13 h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-xl relative overflow-hidden"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            {/* Expressive Visor Eyes */}
            <div className="flex items-center gap-1.5 mb-1 z-10 opacity-90">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              />
            </div>

            {/* Analogue Hands */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Hour Hand */}
              <div
                className="absolute w-1 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom"
                style={{
                  height: '10px',
                  bottom: '50%',
                  transform: `rotate(${angles.hr}deg)`,
                }}
              />
              {/* Minute Hand */}
              <div
                className="absolute w-0.5 bg-slate-700 dark:bg-slate-300 rounded-full origin-bottom"
                style={{
                  height: '14px',
                  bottom: '50%',
                  transform: `rotate(${angles.min}deg)`,
                }}
              />
              {/* Second Hand */}
              <div
                className="absolute w-0.5 rounded-full origin-bottom"
                style={{
                  height: '16px',
                  bottom: '50%',
                  backgroundColor: 'var(--md-sys-color-tertiary)',
                  transform: `rotate(${angles.sec}deg)`,
                }}
              />
              {/* Center Pin */}
              <div
                className="w-1.5 h-1.5 rounded-full z-20"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              />
            </div>

            {/* Digital Sub-display */}
            <div className="absolute bottom-1.5 text-[8px] font-mono font-bold opacity-80">
              {clockTime.hh}:{clockTime.mm}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
