import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../SettingsContext';

interface GravityGameProps {
  onClose: () => void;
}

export function GravityGame({ onClose }: GravityGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let audioCtx: AudioContext | null = null;
    
    // Setup Audio
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
    }

    const playSound = (type: 'bounce' | 'collect' | 'gameover') => {
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'bounce') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'collect') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }
    };

    let width = 0;
    let height = 0;
    let center = { x: 0, y: 0 };
    let gameState = 'playing';

    const resize = () => {
      if (containerRef.current) {
        width = containerRef.current.clientWidth;
        height = containerRef.current.clientHeight;
        canvas.width = width;
        canvas.height = height;
        center = { x: width / 2, y: height / 2 };
      }
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      x: number; y: number; vx: number; vy: number; life: number; color: string; maxLife: number;
      constructor(x: number, y: number, color: string) {
        this.x = x; this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = Math.random() * 30 + 20;
        this.maxLife = this.life;
        this.color = color;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        this.life--;
      }
      draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    class Obstacle {
      x: number; y: number; vx: number; vy: number; radius: number; isEnergy: boolean;
      constructor() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(width, height) / 2 + 50;
        this.x = center.x + Math.cos(angle) * dist;
        this.y = center.y + Math.sin(angle) * dist;
        const speed = Math.random() * 2 + 1 + (score / 100);
        this.vx = -Math.cos(angle) * speed;
        this.vy = -Math.sin(angle) * speed;
        this.radius = Math.random() * 8 + 6;
        this.isEnergy = Math.random() > 0.8;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
      }
      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.isEnergy ? '#4ade80' : '#ef4444';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        if (this.isEnergy) {
           ctx.strokeStyle = '#22c55e';
           ctx.lineWidth = 2;
           ctx.stroke();
        }
      }
    }

    let particles: Particle[] = [];
    let obstacles: Obstacle[] = [];
    let barriers: {x1: number, y1: number, x2: number, y2: number, life: number}[] = [];
    let isDragging = false;
    let dragStart = {x: 0, y: 0};
    let dragCurrent = {x: 0, y: 0};
    
    let currentScore = 0;
    let currentEnergy = 100;
    let frame = 0;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (gameState === 'gameover') return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const rect = canvas.getBoundingClientRect();
      dragStart = { x: clientX - rect.left, y: clientY - rect.top };
      dragCurrent = { ...dragStart };
      isDragging = true;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const rect = canvas.getBoundingClientRect();
      dragCurrent = { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      const dx = dragCurrent.x - dragStart.x;
      const dy = dragCurrent.y - dragStart.y;
      const len = Math.hypot(dx, dy);
      if (len > 10 && currentEnergy >= 10) {
        barriers.push({ x1: dragStart.x, y1: dragStart.y, x2: dragCurrent.x, y2: dragCurrent.y, life: 100 });
        currentEnergy -= 10;
        setEnergy(currentEnergy);
      }
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    canvas.addEventListener('touchstart', handleStart, {passive: false});
    canvas.addEventListener('touchmove', handleMove, {passive: false});
    canvas.addEventListener('touchend', handleEnd);

    // Line intersection for barriers
    const lineIntersectCircle = (x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, r: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const t = ((cx - x1) * dx + (cy - y1) * dy) / (dx * dx + dy * dy);
      const closestX = x1 + Math.max(0, Math.min(1, t)) * dx;
      const closestY = y1 + Math.max(0, Math.min(1, t)) * dy;
      const dist = Math.hypot(cx - closestX, cy - closestY);
      if (dist < r) {
        // compute normal
        let nx = cx - closestX;
        let ny = cy - closestY;
        const nlen = Math.hypot(nx, ny);
        if (nlen > 0) { nx /= nlen; ny /= nlen; }
        return { hit: true, nx, ny };
      }
      return { hit: false };
    };

    const loop = () => {
      if (gameState !== 'playing') {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      ctx.fillStyle = settings.theme === 'dark' ? 'rgba(10, 10, 10, 0.3)' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, 0, width, height);

      // Center orb
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#60a5fa';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Spawn
      if (frame % Math.max(10, 60 - Math.floor(currentScore / 20)) === 0) {
        obstacles.push(new Obstacle());
      }

      // Update barriers
      for (let i = barriers.length - 1; i >= 0; i--) {
        barriers[i].life--;
        if (barriers[i].life <= 0) barriers.splice(i, 1);
      }

      // Draw barriers
      barriers.forEach(b => {
        ctx.strokeStyle = `rgba(168, 85, 247, ${b.life / 100})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
      });

      // Update obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.update();
        o.draw(ctx);

        // check barriers
        for (const b of barriers) {
           const res = lineIntersectCircle(b.x1, b.y1, b.x2, b.y2, o.x, o.y, o.radius);
           if (res.hit && res.nx !== undefined) {
             // reflect velocity
             const dot = o.vx * res.nx + o.vy * res.ny;
             o.vx -= 2 * dot * res.nx;
             o.vy -= 2 * dot * res.ny;
             playSound('bounce');
             for(let k=0; k<5; k++) particles.push(new Particle(o.x, o.y, '#a855f7'));
           }
        }

        // check center
        const distToCenter = Math.hypot(o.x - center.x, o.y - center.y);
        if (distToCenter < o.radius + 20) {
          if (o.isEnergy) {
             currentEnergy = Math.min(100, currentEnergy + 15);
             currentScore += 10;
             setEnergy(currentEnergy);
             setScore(currentScore);
             playSound('collect');
             for(let k=0; k<10; k++) particles.push(new Particle(o.x, o.y, '#4ade80'));
          } else {
             playSound('gameover');
             for(let k=0; k<30; k++) particles.push(new Particle(center.x, center.y, '#ef4444'));
             gameState = 'gameover';
             setIsGameOver(true);
             setHighScore(prev => Math.max(prev, currentScore));
          }
          obstacles.splice(i, 1);
        } else if (distToCenter > Math.max(width, height) + 100) {
          obstacles.splice(i, 1); // cleanup out of bounds
        }
      }

      // Draw drag line
      if (isDragging && currentEnergy >= 10) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(dragCurrent.x, dragCurrent.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) particles.splice(i, 1);
      }

      frame++;
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [settings.theme]);

  const restart = () => {
    setScore(0);
    setEnergy(100);
    setIsGameOver(false);
    // State is fully driven inside the effect, so we need to force re-render or handle it inside
    // For simplicity, we just remount the canvas by changing a key if needed, or pass it via ref.
    // Given the effect dependencies, we can just close and reopen, or add a reset trigger.
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div ref={containerRef} className="w-full max-w-4xl h-[70vh] bg-neutral-900 rounded-3xl overflow-hidden relative shadow-2xl border border-neutral-800">
        <canvas ref={canvasRef} className="block w-full h-full touch-none" />
        
        {/* UI Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between text-white pointer-events-none">
          <div>
            <div className="text-xl font-bold font-mono">SCORE: {score}</div>
            <div className="text-sm text-neutral-400 font-mono">HIGH: {highScore}</div>
          </div>
          <div className="w-48">
            <div className="text-sm text-right mb-1 font-mono text-purple-400">ENERGY</div>
            <div className="h-3 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
              <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300" style={{width: `${energy}%`}} />
            </div>
          </div>
        </div>

        {isGameOver && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
            <h2 className="text-4xl font-bold mb-4 text-red-500">GAME OVER</h2>
            <div className="text-xl mb-8">Score: {score}</div>
            <button 
              onClick={() => {
                // To reset easily without refactoring the effect, we can just remount this component
                onClose(); // Then the user can open it again, or we can use a key.
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95"
            >
              CLOSE
            </button>
          </div>
        )}
        
        <button 
          onClick={onClose}
          className="absolute top-4 left-1/2 -translate-x-1/2 p-2 bg-neutral-800/80 hover:bg-red-500 text-white rounded-full transition-all"
        >
          <X size={20} />
        </button>
      </div>
      <div className="text-neutral-400 text-sm mt-4 text-center max-w-lg">
        {settings.language === 'ar' 
          ? 'اسحب لرسم حواجز واستهلاك الطاقة. قم بتوجيه النقاط الخضراء للمركز وصد الحمراء.' 
          : 'Drag to draw barriers. Use energy to guide green orbs to center and deflect red ones.'}
      </div>
    </div>
  );
}
