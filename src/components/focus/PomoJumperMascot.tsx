import React, { useEffect, useRef, useState } from 'react';
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

export const PomoJumperMascot: React.FC = () => {
  const { locale, todaySessionsCount, isRunning, reduceAnimations } = useAppStore();
  const ar = locale === 'ar';

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [scaleY, setScaleY] = useState(1);
  const [scaleX, setScaleX] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [speech, setSpeech] = useState<string | null>(null);
  const [isJumping, setIsJumping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play procedural cute Web Audio blip on pet
  const playPetSound = () => {
    try {
      if (typeof window === 'undefined') return;
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore audio context restrictions
    }
  };

  // Particle dust effect on landing
  const spawnLandingParticles = (lx: number, ly: number) => {
    const newParticles: Particle[] = [];
    const colors = ['var(--md-sys-color-primary)', 'var(--md-sys-color-tertiary)', '#e2e8f0'];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * (i + Math.random())) / 8 + Math.PI; // spread downwards/outwards
      const speed = 30 + Math.random() * 50;
      newParticles.push({
        id: Math.random(),
        x: lx,
        y: ly,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.5,
        radius: 2 + Math.random() * 3,
        alpha: 1,
        color: colors[i % colors.length],
      });
    }
    particlesRef.current.push(...newParticles);
  };

  // Particle animation loop
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

  // Jump physics trajectory implementation
  const jumpToTarget = (targetX: number, targetY: number) => {
    if (isJumping || reduceAnimations) return;
    setIsJumping(true);

    const startX = position.x;
    const startY = position.y;
    const duration = 650; // ms
    const startTime = performance.now();
    const peakHeight = 70; // px arc height

    // Initial squash before launch
    setScaleY(0.7);
    setScaleX(1.3);

    setTimeout(() => {
      // Stretch during takeoff
      setScaleY(1.35);
      setScaleX(0.75);

      const animateJump = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Horizontal linear, vertical parabolic arc: y = lerp - peak * sin(progress * PI)
        const currentX = startX + (targetX - startX) * progress;
        const linearY = startY + (targetY - startY) * progress;
        const arcY = linearY - peakHeight * Math.sin(progress * Math.PI);

        setPosition({ x: currentX, y: arcY });

        // Spin rotation mid-air
        setRotation(progress * 360);

        if (progress < 1) {
          requestAnimationFrame(animateJump);
        } else {
          // Impact landing!
          setPosition({ x: targetX, y: targetY });
          setRotation(0);
          setScaleY(0.65); // Squash on land
          setScaleX(1.35);
          spawnLandingParticles(targetX + 24, targetY + 48);

          setTimeout(() => {
            // Spring back to normal shape
            setScaleY(1.05);
            setScaleX(0.95);
            setTimeout(() => {
              setScaleY(1);
              setScaleX(1);
              setIsJumping(false);
            }, 120);
          }, 120);
        }
      };

      requestAnimationFrame(animateJump);
    }, 150);
  };

  // Find candidate buttons to hop on
  const hopToRandomTarget = () => {
    if (typeof document === 'undefined') return;
    const buttons = Array.from(document.querySelectorAll('button'));
    if (buttons.length === 0) return;

    // Pick a random interactive button (Timer Start/Pause, mode selectors, etc)
    const validBtns = buttons.filter((b) => {
      const rect = b.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top > 0 && rect.top < window.innerHeight;
    });

    if (validBtns.length === 0) return;
    const target = validBtns[Math.floor(Math.random() * validBtns.length)];
    const rect = target.getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    const targetX = rect.left - parentRect.left + rect.width / 2 - 24;
    const targetY = rect.top - parentRect.top - 48; // Sit right on top of button

    jumpToTarget(Math.max(10, targetX), Math.max(10, targetY));
  };

  // Auto-hop timer
  useEffect(() => {
    if (reduceAnimations) return;

    const interval = setInterval(() => {
      if (!isJumping && Math.random() > 0.3) {
        hopToRandomTarget();
      }
    }, 9000);

    return () => clearInterval(interval);
  }, [isJumping, reduceAnimations]);

  // Handle click / pet mascot
  const handlePet = () => {
    playPetSound();
    setRotation((r) => r + 360);
    setScaleY(1.3);
    setScaleX(0.7);

    setTimeout(() => {
      setScaleY(1);
      setScaleX(1);
    }, 200);

    // Context-aware speech bubbles
    const quotes = ar
      ? [
          'ركز جيداً! 🎯',
          todaySessionsCount >= 4 ? 'أنت بطل! فتحت لعبة 3D Arcade! 🎮' : `جلسة ${todaySessionsCount + 1} من 4 لإلغاء قفل اللعبة 🎮`,
          'جلسة رائعة، استمر! ⚡',
          'كل دقيقة تركيز تقربك من هدفك! 🚀',
          isRunning ? 'المؤقت يعمل.. لا تشتت نفسك! 🤫' : 'جاهز للبدء؟ اضغط ابدأ! ▶️',
        ]
      : [
          'Stay in the zone! 🎯',
          todaySessionsCount >= 4 ? 'Awesome! 3D Focus Arcade unlocked! 🎮' : `Session ${todaySessionsCount + 1} of 4 to unlock 3D Arcade 🎮`,
          'Great momentum! Keep it up! ⚡',
          'Every session brings you closer to your goal! 🚀',
          isRunning ? 'Timer is ticking.. zero distractions! 🤫' : 'Ready to start? Press Play! ▶️',
        ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setSpeech(randomQuote);
    setTimeout(() => setSpeech(null), 4500);
  };

  if (reduceAnimations) return null;

  return (
    <div ref={containerRef} className="relative w-full h-0 z-20 pointer-events-none">
      {/* Dust particles canvas overlay */}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Mascot Body Container */}
      <div
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
          transition: isJumping ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        className="absolute top-0 left-0 pointer-events-auto cursor-pointer group select-none"
        onClick={handlePet}
        title={ar ? 'انقر للمداعبة أو التحفيز!' : 'Click to pet Pomo mascot!'}
      >
        {/* Speech Bubble */}
        {speech && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-md border animate-bounce z-30"
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

        {/* Pomo Mascot Graphic (Material 3 Expressive Clock) */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Ringing Bells on top */}
          <div
            className="absolute -top-1 left-1 w-3.5 h-3.5 rounded-full border-2 shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-tertiary)',
              borderColor: 'var(--md-sys-color-on-tertiary)',
            }}
          />
          <div
            className="absolute -top-1 right-1 w-3.5 h-3.5 rounded-full border-2 shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-tertiary)',
              borderColor: 'var(--md-sys-color-on-tertiary)',
            }}
          />

          {/* Clock Face Surface */}
          <div
            className="w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center shadow-lg relative overflow-hidden"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
          >
            {/* Expressive Visor / Eyes */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              />
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              />
            </div>

            {/* Cute Smile / Hands */}
            <div
              className="w-3 h-1.5 border-b-2 rounded-full"
              style={{ borderColor: 'var(--md-sys-color-primary)' }}
            />
          </div>

          {/* Shadow disk beneath */}
          <div
            className="absolute -bottom-1 left-1.2 w-9 h-1.5 rounded-full opacity-30 blur-[1px]"
            style={{ backgroundColor: 'var(--md-sys-color-scrim)' }}
          />
        </div>
      </div>
    </div>
  );
};
