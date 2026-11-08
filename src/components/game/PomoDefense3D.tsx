import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';

interface PomoDefense3DProps {
  onClose: () => void;
}

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type Team = 'focus' | 'distraction';

interface ChessPiece {
  id: string;
  type: PieceType;
  team: Team;
  row: number;
  col: number;
  mesh: THREE.Group;
  nameEn: string;
  nameAr: string;
}

export const PomoDefense3D: React.FC<PomoDefense3DProps> = ({ onClose }) => {
  const { locale, coins } = useAppStore();
  const ar = locale === 'ar';

  const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
  const [turnTimer, setTurnTimer] = useState(15);
  const [score, setScore] = useState(0);
  const [captures, setCaptures] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [activeRule, setActiveRule] = useState<string>(
    ar ? 'قاعدة عشوائية: صدمة التركيز! أكل الجنديون يمنحك 5 عملات وإطلاق زمني!' : 'Random Rule: Focus Strike! Capturing pawns awards +5 coins & boost!'
  );
  const [audioMode, setAudioMode] = useState<'pinknoise' | 'ticks' | 'mute'>('pinknoise');

  const mountRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pinkNoiseNodeRef = useRef<AudioNode | null>(null);

  // References for 3D Board and Pieces
  const piecesRef = useRef<ChessPiece[]>([]);
  const boardTilesRef = useRef<THREE.Mesh[][]>([]);

  // Web Audio Mechanical Clock Tick Sound Effect
  const playClockSound = (type: 'tick' | 'tock' | 'capture' | 'victory' = 'tick') => {
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

      if (type === 'tick' || type === 'tock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'tick' ? 1200 : 800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      } else if (type === 'capture') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      } else {
        // Victory chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // audio fallback
    }
  };

  // Web Audio Pink Noise Focus Soundscape
  const startPinkNoise = () => {
    try {
      if (typeof window === 'undefined') return;
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      if (pinkNoiseNodeRef.current) pinkNoiseNodeRef.current.disconnect();

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      noiseSource.connect(gain);
      gain.connect(ctx.destination);
      noiseSource.start();

      pinkNoiseNodeRef.current = noiseSource;
    } catch {
      // noise fallback
    }
  };

  const stopPinkNoise = () => {
    if (pinkNoiseNodeRef.current) {
      try {
        pinkNoiseNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      pinkNoiseNodeRef.current = null;
    }
  };

  useEffect(() => {
    if (audioMode === 'pinknoise') startPinkNoise();
    else stopPinkNoise();
    return () => stopPinkNoise();
  }, [audioMode]);

  // Turn Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      setTurnTimer((t) => {
        if (t <= 1) {
          playClockSound('tock');
          return 15; // reset turn timer
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Main 3D Focus Chess Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 10, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    // 2. Studio Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;
    roomEnv.dispose();

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 12, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0x818cf8, 0.6);
    scene.add(ambLight);

    // 3. 3D 8x8 Checkered Chessboard
    const boardGroup = new THREE.Group();
    const boardTiles: THREE.Mesh[][] = [];

    for (let r = 0; r < 8; r++) {
      boardTiles[r] = [];
      for (let c = 0; c < 8; c++) {
        const isDark = (r + c) % 2 === 1;
        const tileGeo = new THREE.BoxGeometry(1.1, 0.2, 1.1);
        const tileMat = new THREE.MeshStandardMaterial({
          color: isDark ? 0x1e293b : 0x38bdf8,
          roughness: 0.3,
          metalness: 0.2,
        });
        const tileMesh = new THREE.Mesh(tileGeo, tileMat);
        tileMesh.position.set((c - 3.5) * 1.2, -0.1, (r - 3.5) * 1.2);
        tileMesh.receiveShadow = true;
        boardGroup.add(tileMesh);
        boardTiles[r][c] = tileMesh;
      }
    }
    scene.add(boardGroup);
    boardTilesRef.current = boardTiles;

    // Helper to Create Procedural App UI Chess Piece 3D Group
    const createPieceMesh = (type: PieceType, team: Team): THREE.Group => {
      const g = new THREE.Group();
      const isFocus = team === 'focus';
      const color = isFocus ? 0x3b82f6 : 0xef4444;

      if (type === 'king') {
        // Master Alarm Clock Logo
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 24);
        const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        g.add(body);

        const bellMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bellMat);
        b1.position.set(-0.3, 0.35, 0);
        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bellMat);
        b2.position.set(0.3, 0.35, 0);
        g.add(b1);
        g.add(b2);
      } else if (type === 'queen') {
        // AI Gemini Star
        const starGeo = new THREE.OctahedronGeometry(0.45);
        const starMat = new THREE.MeshStandardMaterial({ color: isFocus ? 0xa855f7 : 0xec4899, emissive: 0x581c87 });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.y = 0.2;
        g.add(star);
      } else if (type === 'rook') {
        // 3D Clock Tower
        const towerGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 16);
        const towerMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        g.add(tower);
      } else if (type === 'bishop') {
        // Test Score Card
        const cardGeo = new THREE.BoxGeometry(0.5, 0.7, 0.1);
        const cardMat = new THREE.MeshStandardMaterial({ color: isFocus ? 0x10b981 : 0xf59e0b, roughness: 0.3 });
        const card = new THREE.Mesh(cardGeo, cardMat);
        g.add(card);
      } else if (type === 'knight') {
        // Wavy Ring Pomodoro
        const ringGeo = new THREE.TorusGeometry(0.35, 0.1, 12, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
      } else {
        // Mini Task Pawn
        const pawnGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const pawnMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
        const pawn = new THREE.Mesh(pawnGeo, pawnMat);
        g.add(pawn);
      }

      g.position.y = 0.4;
      return g;
    };

    // Initialize Chess Pieces Setup
    const pieces: ChessPiece[] = [];

    const setupPieces = () => {
      const layout: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

      // Focus Team (Bottom, Row 6 & 7)
      for (let c = 0; c < 8; c++) {
        // Pawns (Mini Tasks)
        const pawnMesh = createPieceMesh('pawn', 'focus');
        pawnMesh.position.set((c - 3.5) * 1.2, 0.4, (6 - 3.5) * 1.2);
        scene.add(pawnMesh);
        pieces.push({
          id: `f_pawn_${c}`,
          type: 'pawn',
          team: 'focus',
          row: 6,
          col: c,
          mesh: pawnMesh,
          nameEn: 'Task Pawn',
          nameAr: 'جندي المهام',
        });

        // Major pieces
        const type = layout[c];
        const majorMesh = createPieceMesh(type, 'focus');
        majorMesh.position.set((c - 3.5) * 1.2, 0.4, (7 - 3.5) * 1.2);
        scene.add(majorMesh);
        pieces.push({
          id: `f_major_${c}`,
          type,
          team: 'focus',
          row: 7,
          col: c,
          mesh: majorMesh,
          nameEn: type.toUpperCase(),
          nameAr: type,
        });
      }

      // Distraction Team (Top, Row 0 & 1)
      for (let c = 0; c < 8; c++) {
        const pawnMesh = createPieceMesh('pawn', 'distraction');
        pawnMesh.position.set((c - 3.5) * 1.2, 0.4, (1 - 3.5) * 1.2);
        scene.add(pawnMesh);
        pieces.push({
          id: `d_pawn_${c}`,
          type: 'pawn',
          team: 'distraction',
          row: 1,
          col: c,
          mesh: pawnMesh,
          nameEn: 'Doomscroll Pawn',
          nameAr: 'جندي التشتيت',
        });

        const type = layout[c];
        const majorMesh = createPieceMesh(type, 'distraction');
        majorMesh.position.set((c - 3.5) * 1.2, 0.4, (0 - 3.5) * 1.2);
        scene.add(majorMesh);
        pieces.push({
          id: `d_major_${c}`,
          type,
          team: 'distraction',
          row: 0,
          col: c,
          mesh: majorMesh,
          nameEn: `Dark ${type}`,
          nameAr: `تشتيت ${type}`,
        });
      }

      piecesRef.current = pieces;
    };

    setupPieces();

    // 4. Render Animation Loop
    let animId: number;
    const renderLoop = () => {
      // Gently rotate active pieces
      piecesRef.current.forEach((p) => {
        p.mesh.rotation.y += 0.01;
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    // Raycaster for Piece Selection & Tile Movement
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find clicked tile or piece
        let clickedObj = intersects[0].object;
        while (clickedObj.parent && clickedObj.parent !== scene) {
          clickedObj = clickedObj.parent;
        }

        // Match piece
        const matchedPiece = piecesRef.current.find((p) => p.mesh === clickedObj);
        if (matchedPiece && matchedPiece.team === 'focus') {
          playClockSound('tick');
          setSelectedPiece(matchedPiece);
        } else if (selectedPiece) {
          // Attempt move to clicked tile
          const clickedTile = boardTiles.flat().find((t) => t === intersects[0].object);
          if (clickedTile) {
            const targetC = Math.round(clickedTile.position.x / 1.2 + 3.5);
            const targetR = Math.round(clickedTile.position.z / 1.2 + 3.5);

            // Execute Move
            playClockSound('capture');
            selectedPiece.row = targetR;
            selectedPiece.col = targetC;
            selectedPiece.mesh.position.set((targetC - 3.5) * 1.2, 0.4, (targetR - 3.5) * 1.2);

            // Check if captured enemy piece
            const enemyIndex = piecesRef.current.findIndex(
              (p) => p.team === 'distraction' && p.row === targetR && p.col === targetC
            );

            if (enemyIndex !== -1) {
              const enemy = piecesRef.current[enemyIndex];
              scene.remove(enemy.mesh);
              piecesRef.current.splice(enemyIndex, 1);

              setScore((s) => s + 250);
              setCaptures((c) => c + 1);

              if (enemy.type === 'king') {
                playClockSound('victory');
                setGameState('victory');
              }
            }

            setSelectedPiece(null);
            setTurnTimer(15);
          }
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      pmremGenerator.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleClaimReward = () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    useAppStore.setState((s) => ({ coins: s.coins + 15 }));
    playClockSound('victory');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top HUD Bar */}
      <div className="relative z-10 p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
            <MaterialIcon name="grid_view" size={24} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold font-display">
              {ar ? 'شطرنج التركيز 3D • قطع واجهة التطبيق' : '3D Focus Chess • App UI Pieces'}
            </h1>
            <p className="text-xs text-slate-400">
              {ar ? `النقاط: ${score} | القطع المأسورة: ${captures}` : `Score: ${score} | Captured: ${captures}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Turn Timer Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-mono font-bold flex items-center gap-1.5">
            <MaterialIcon name="timer" size={16} />
            <span>{turnTimer}s {ar ? 'للنقلة' : 'move clock'}</span>
          </div>

          {/* Sound Mode Toggle */}
          <button
            onClick={() => setAudioMode(audioMode === 'pinknoise' ? 'ticks' : audioMode === 'ticks' ? 'mute' : 'pinknoise')}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-700"
          >
            <MaterialIcon name={audioMode === 'pinknoise' ? 'graphic_eq' : audioMode === 'ticks' ? 'volume_up' : 'volume_off'} size={16} />
            <span>{audioMode === 'pinknoise' ? (ar ? 'ضوضاء وردية' : 'Pink Noise') : audioMode === 'ticks' ? (ar ? 'نقرات الساعة' : 'Clock Ticks') : (ar ? 'صامت' : 'Mute')}</span>
          </button>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-slate-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Active Wild Rule Banner */}
      <div className="relative z-10 px-4 py-2 bg-blue-900/40 border-b border-blue-800/50 text-center text-xs font-bold text-blue-300">
        ⚡ {activeRule}
      </div>

      {/* Selected Piece Info Card */}
      {selectedPiece && gameState === 'playing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 p-3.5 rounded-2xl bg-slate-900/90 border border-blue-500 shadow-2xl flex items-center gap-3 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            ♟
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              {ar ? `القطعة المختارة: ${selectedPiece.nameAr}` : `Selected: ${selectedPiece.nameEn}`}
            </h4>
            <p className="text-[11px] text-slate-400">
              {ar ? 'انقر على أي مربع في الرقعة للنقل أو الأسر!' : 'Click any square on the 3D board to move or capture!'}
            </p>
          </div>
        </div>
      )}

      {/* Victory / Defeat Overlay */}
      {(gameState === 'victory' || gameState === 'defeat') && (
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500 flex items-center justify-center mx-auto text-amber-400">
              <MaterialIcon name="emoji_events" size={36} />
            </div>

            <h2 className="text-xl font-bold">
              {ar ? 'كش ملك للتشتيت! انتصار التركيز!' : 'Checkmate Distractions! Focus Victory!'}
            </h2>

            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{ar ? 'النتيجة النهائي:' : 'Final Score:'}</span>
                <span className="font-bold text-blue-400 font-mono text-sm">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{ar ? 'القطع المأسورة:' : 'Captured Pieces:'}</span>
                <span className="font-bold font-mono text-sm">{captures}</span>
              </div>
            </div>

            <button
              onClick={handleClaimReward}
              disabled={rewardClaimed}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <MaterialIcon name="monetization_on" size={18} />
              <span>{rewardClaimed ? (ar ? 'تمت إضافة +15 عملة تركيز!' : 'Added +15 Focus Coins!') : (ar ? 'مطالبة +15 عملة تركيز' : 'Claim +15 Focus Coins')}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
            >
              {ar ? 'العودة للتطبيق' : 'Return to App'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
