import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Gamepad2, Trophy, Music } from 'lucide-react';

// --- GAME CONSTANTS ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

// --- AUDIO TRACKS ---
const TRACKS = [
  {
    title: 'Cybernetic Echoes (AI Gen)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'Neon Pulse Synthesis (AI Gen)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    title: 'Algorithmic Overdrive (AI Gen)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  }
];

export default function App() {
  // --- STATE ---
  // Music State
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [nextDir, setNextDir] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  // --- AUDIO LOGIC ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  // --- GAME LOGIC ---
  const spawnFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // Ensure food doesn't spawn on snake
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDir(INITIAL_DIRECTION);
    setFood(spawnFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setGameActive(true);
    // Optionally auto-play music when starting game
    if (!isPlaying) setIsPlaying(true);
  };

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys if game is active
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameActive || gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (direction.y !== 1) setNextDir({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (direction.y !== -1) setNextDir({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (direction.x !== 1) setNextDir({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (direction.x !== -1) setNextDir({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameActive, gameOver]);

  // Game Loop
  useEffect(() => {
    if (!gameActive || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + nextDir.x,
          y: head.y + nextDir.y
        };

        setDirection(nextDir);

        // Check Wall Collision
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check Food
        if (newHead.x === food.x && newHead.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          setHighScore(prev => Math.max(prev, newScore));
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, 130); // 130ms speed
    return () => clearInterval(gameInterval);
  }, [gameActive, gameOver, nextDir, food, score, spawnFood]);

  return (
    <div 
      className="h-screen w-full text-white overflow-x-hidden overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-[280px_1fr_280px] lg:grid-rows-[80px_1fr_100px] gap-[1px]"
      style={{
        backgroundColor: '#050506',
        backgroundImage: 'linear-gradient(#1f1f27 1px, transparent 1px), linear-gradient(90deg, #1f1f27 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
      }}
    >
      <audio
        ref={audioRef}
        src={TRACKS[currentTrack].url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleTrackEnded}
      />

      <header className="lg:col-span-3 bg-[#0f0f12] border-b-2 border-[#00f3ff] flex items-center justify-between px-10 shadow-[0_0_20px_rgba(0,243,255,0.15)] z-10 py-5 lg:py-0">
        <div className="font-mono text-2xl font-extrabold tracking-[2px] text-[#00f3ff] uppercase flex items-center gap-3">
          <Gamepad2 className="w-6 h-6" />
          SYNTH//SNAKE
        </div>
        <div className="font-mono text-xs text-[#39ff14] hidden md:block">
          SYSTEM: OPTIMAL // GRID_SYNC: ACTIVE
        </div>
      </header>

      <aside className="bg-[#0f0f12] border-r border-[#1f1f27] p-5 flex flex-col order-3 lg:order-none h-full overflow-y-auto hidden lg:flex">
        <div className="text-[10px] uppercase tracking-[2px] text-[#8e9299] mb-5 border-l-[3px] border-[#ff00ff] pl-2.5 font-sans">
          Neural Library
        </div>
        {TRACKS.map((track, i) => (
          <div 
            key={i} 
            onClick={() => { setCurrentTrack(i); setIsPlaying(true); }}
            className={`p-[15px] mb-2.5 border rounded cursor-pointer transition-colors ${
              currentTrack === i 
                ? 'border-[#00f3ff] bg-[#00f3ff]/5' 
                : 'border-[#1f1f27] hover:border-[#8e9299]'
            }`}
          >
            <h4 className="text-[14px] mb-[4px] truncate">{track.title}</h4>
            <p className="text-[11px] text-[#8e9299] uppercase">AI ARCHITECT // {(i + 1).toString().padStart(2, '0')}</p>
          </div>
        ))}
      </aside>

      <main className="flex flex-col items-center justify-center bg-[#050506]/80 p-4 lg:p-6 lg:row-start-2 lg:col-start-2 relative z-0 flex-1 overflow-y-auto lg:overflow-hidden min-h-[500px] lg:min-h-0">
        <div className="relative w-full max-w-[440px] aspect-square bg-black border-4 border-[#1f1f27] shadow-[0_0_40px_rgba(0,0,0,0.5)] grid"
             style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
             }}>
             
            {snake.map((segment, index) => (
              <div
                key={index}
                className="bg-[#39ff14] border border-black shadow-[0_0_10px_#39ff14]"
                style={{
                  gridColumnStart: segment.x + 1,
                  gridRowStart: segment.y + 1,
                }}
              />
            ))}
            <div
              className="bg-[#ff00ff] rounded-full shadow-[0_0_15px_#ff00ff]"
              style={{
                gridColumnStart: food.x + 1,
                gridRowStart: food.y + 1,
              }}
            />

            {/* Overlays */}
            {!gameActive && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-20 backdrop-blur-sm">
                <h2 className="font-mono text-4xl font-black text-[#00f3ff] mb-2 drop-shadow-[0_0_15px_#00f3ff]">READY?</h2>
                <button 
                  onClick={resetGame}
                  className="mt-6 px-6 py-3 border border-[#00f3ff] text-[#00f3ff] rounded-full text-xs uppercase tracking-widest hover:bg-[#00f3ff]/10 transition-colors"
                >
                  Start System
                </button>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-20 backdrop-blur-md">
                <h2 className="font-mono text-4xl font-black text-[#ff00ff] mb-2 drop-shadow-[0_0_20px_#ff00ff]">CRITICAL FAILURE</h2>
                <button 
                  onClick={resetGame}
                  className="mt-6 px-6 py-3 border border-[#ff00ff] text-[#ff00ff] rounded-full text-xs uppercase tracking-widest hover:bg-[#ff00ff]/10 transition-colors"
                >
                  Reboot System
                </button>
              </div>
            )}
        </div>

        <div className="mt-8 px-[30px] py-[10px] border border-[#ff00ff] font-mono text-[#ff00ff] text-[20px]">
          SC0RE: {score.toString().padStart(6, '0')}
        </div>
      </main>

      <aside className="bg-[#0f0f12] border-l border-[#1f1f27] p-5 flex flex-col order-4 lg:order-none lg:row-start-2 lg:col-start-3 h-full overflow-y-auto hidden lg:flex">
        <div className="text-[10px] uppercase tracking-[2px] text-[#8e9299] mb-5 border-l-[3px] border-[#ff00ff] pl-2.5 font-sans">
          Game Diagnostics
        </div>
        
        <div className="mb-[30px]">
          <span className="text-[11px] text-[#8e9299] uppercase block mb-[5px]">High Score</span>
          <span className="font-mono text-[24px] text-[#00f3ff]">{highScore.toString().padStart(6, '0')}</span>
        </div>

        <div className="mb-[30px]">
          <span className="text-[11px] text-[#8e9299] uppercase block mb-[5px]">Current Score</span>
          <span className="font-mono text-[24px] text-white">{score.toString().padStart(6, '0')}</span>
        </div>

        <div className="mb-[30px]">
          <span className="text-[11px] text-[#8e9299] uppercase block mb-[5px]">Snake Length</span>
          <span className="font-mono text-[24px] text-white">{snake.length} UNITS</span>
        </div>

        <div className="mb-[30px]">
          <span className="text-[11px] text-[#8e9299] uppercase block mb-[5px]">Difficulty Level</span>
          <span className="font-mono text-[24px] text-white">OVERDRIVE</span>
        </div>
      </aside>

      <footer className="lg:col-span-3 bg-[#0f0f12] border-t border-[#1f1f27] grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] items-center px-5 py-4 lg:py-0 z-10 order-first lg:order-none">
        <div className="flex items-center gap-[15px] justify-center lg:justify-start mb-4 lg:mb-0">
          <div className="w-[50px] h-[50px] bg-[#1f1f27] rounded-[4px] flex items-center justify-center text-[#8e9299] text-[20px]">
            ♫
          </div>
          <div className="overflow-hidden flex flex-col">
            <div className="text-[13px] font-bold truncate max-w-[150px]">{TRACKS[currentTrack].title}</div>
            <div className="text-[11px] text-[#8e9299]">AI ARCHITECT</div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-[30px] mb-4 lg:mb-0">
          <button 
            onClick={prevTrack} 
            className="bg-transparent border border-[#1f1f27] text-white px-[20px] py-[10px] rounded-[20px] text-[12px] uppercase cursor-pointer hover:border-[#8e9299] transition-colors"
          >
            PREV
          </button>
          <button 
            onClick={togglePlay} 
            className="w-[50px] h-[50px] rounded-full bg-[#00f3ff] text-black border-none flex items-center justify-center text-[20px] transition-transform active:scale-95 shadow-[0_0_10px_#00f3ff]"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          <button 
            onClick={nextTrack} 
            className="bg-transparent border border-[#1f1f27] text-white px-[20px] py-[10px] rounded-[20px] text-[12px] uppercase cursor-pointer hover:border-[#8e9299] transition-colors"
          >
            NEXT
          </button>
        </div>

        <div className="flex flex-col items-center lg:items-end w-full">
           <div className="font-mono text-[12px] mb-[8px] text-[#8e9299]">
             {formatTime(currentTime)} / {formatTime(duration)}
           </div>
           <div className="w-[150px] md:w-[200px] h-[4px] bg-[#1f1f27] relative">
             <div 
                className="absolute left-0 top-0 h-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] transition-all duration-300"
                style={{ width: `${progress}%` }}
             />
           </div>
        </div>
      </footer>
    </div>
  );
}
