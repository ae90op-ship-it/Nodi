import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Trophy, Settings, RefreshCw, Play, Pause } from 'lucide-react';
import { useSettings } from '../SettingsContext';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 20;

export function SnakeGame({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [nextDirection, setNextDirection] = useState<Direction>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('snake-high-score') || '0'));
  
  const [showSettings, setShowSettings] = useState(false);
  const [speed, setSpeed] = useState(150);
  const [snakeColor, setSnakeColor] = useState('#10b981'); // emerald-500
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point = { x: 0, y: 0 };
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('UP');
    setNextDirection('UP');
    setFood(generateFood([{ x: 10, y: 10 }]));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-high-score', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setNextDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setNextDirection('RIGHT');
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver]);

  // Game Loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { ...head };

        switch (nextDirection) {
          case 'UP': newHead.y -= 1; break;
          case 'DOWN': newHead.y += 1; break;
          case 'LEFT': newHead.x -= 1; break;
          case 'RIGHT': newHead.x += 1; break;
        }

        setDirection(nextDirection);

        // Check wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setIsGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [nextDirection, isGameOver, isPaused, food, generateFood, speed]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = settings.theme === 'dark' ? '#171717' : '#f5f5f5'; // neutral-900 / neutral-100
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = settings.theme === 'dark' ? '#262626' : '#e5e5e5';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.beginPath();
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE/2, food.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? snakeColor : `${snakeColor}aa`;
      ctx.fillRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      
      // Eyes for head
      if (index === 0) {
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        const offset = 4;
        let leftEye = {x:0,y:0}, rightEye = {x:0,y:0};
        
        switch (direction) {
          case 'UP':
            leftEye = {x: segment.x * CELL_SIZE + offset, y: segment.y * CELL_SIZE + offset};
            rightEye = {x: segment.x * CELL_SIZE + CELL_SIZE - offset - eyeSize, y: segment.y * CELL_SIZE + offset};
            break;
          case 'DOWN':
            leftEye = {x: segment.x * CELL_SIZE + offset, y: segment.y * CELL_SIZE + CELL_SIZE - offset - eyeSize};
            rightEye = {x: segment.x * CELL_SIZE + CELL_SIZE - offset - eyeSize, y: segment.y * CELL_SIZE + CELL_SIZE - offset - eyeSize};
            break;
          case 'LEFT':
            leftEye = {x: segment.x * CELL_SIZE + offset, y: segment.y * CELL_SIZE + offset};
            rightEye = {x: segment.x * CELL_SIZE + offset, y: segment.y * CELL_SIZE + CELL_SIZE - offset - eyeSize};
            break;
          case 'RIGHT':
            leftEye = {x: segment.x * CELL_SIZE + CELL_SIZE - offset - eyeSize, y: segment.y * CELL_SIZE + offset};
            rightEye = {x: segment.x * CELL_SIZE + CELL_SIZE - offset - eyeSize, y: segment.y * CELL_SIZE + CELL_SIZE - offset - eyeSize};
            break;
        }
        ctx.fillRect(leftEye.x, leftEye.y, eyeSize, eyeSize);
        ctx.fillRect(rightEye.x, rightEye.y, eyeSize, eyeSize);
      }
    });

  }, [snake, food, direction, settings.theme, snakeColor]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    if (!touchStartRef.current) return;

    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    
    // Require a minimum swipe distance
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && direction !== 'LEFT') setNextDirection('RIGHT');
      else if (deltaX < 0 && direction !== 'RIGHT') setNextDirection('LEFT');
    } else {
      if (deltaY > 0 && direction !== 'UP') setNextDirection('DOWN');
      else if (deltaY < 0 && direction !== 'DOWN') setNextDirection('UP');
    }
    
    touchStartRef.current = null;
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-w-md w-full relative">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-mono text-neutral-800 dark:text-neutral-200">SNAKE</h2>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500 uppercase font-bold">Score</span>
              <span className="text-lg font-mono font-bold leading-none">{score}</span>
            </div>
            <div className="flex flex-col items-center">
              <Trophy size={14} className="text-yellow-500 mb-1" />
              <span className="text-sm font-mono font-bold text-yellow-600 dark:text-yellow-500 leading-none">{highScore}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400">
              <Settings size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-red-500 hover:text-white rounded-full transition-colors text-neutral-600 dark:text-neutral-400">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-[73px] left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md z-10 border-b border-neutral-200 dark:border-neutral-800 p-4 shadow-xl">
            <h3 className="font-bold mb-4">Game Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Speed ({speed}ms)</label>
                <input 
                  type="range" min="50" max="300" step="10" 
                  value={350 - speed} 
                  onChange={(e) => setSpeed(350 - parseInt(e.target.value))} 
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>Slow</span><span>Fast</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Snake Color</label>
                <div className="flex gap-2">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setSnakeColor(color)}
                      className={`w-8 h-8 rounded-full ${snakeColor === color ? 'ring-2 ring-offset-2 ring-neutral-500' : ''}`}
                      style={{backgroundColor: color}}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="relative flex items-center justify-center p-4 bg-neutral-200 dark:bg-black touch-none">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="rounded-lg shadow-inner max-w-full h-auto bg-white dark:bg-neutral-900 touch-none"
            style={{ width: `${GRID_SIZE * CELL_SIZE}px`, height: `${GRID_SIZE * CELL_SIZE}px` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          
          {isGameOver && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg m-4 backdrop-blur-sm">
              <h2 className="text-4xl font-bold text-white mb-2 font-mono">GAME OVER</h2>
              <p className="text-white mb-6">Score: {score}</p>
              <button 
                onClick={resetGame}
                className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <RefreshCw size={20} /> Play Again
              </button>
            </div>
          )}
          
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg m-4 backdrop-blur-sm">
              <h2 className="text-4xl font-bold text-white tracking-widest font-mono">PAUSED</h2>
            </div>
          )}
        </div>

        {/* Controls Header (Mobile hint) */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-950 text-center text-sm text-neutral-500 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <span>Swipe or use Arrows to move</span>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="p-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700"
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>

      </div>
    </div>
  );
}
