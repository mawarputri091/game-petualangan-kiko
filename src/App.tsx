import React, { useEffect, useState, useRef } from 'react';
import { GameStats, GameStatus, Position3D } from './types';
import { LEVELS } from './levels';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import { AudioFX } from './utils/audio';
import { Trophy, HelpCircle, Heart, Star, Compass, Layers } from 'lucide-react';

export default function App() {
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  const currentLevel = LEVELS.find((l) => l.id === activeLevelId) || LEVELS[0];

  const [gameState, setGameState] = useState<GameStatus>('MENU');
  const [damageReason, setDamageReason] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Stats setup
  const [stats, setStats] = useState<GameStats>({
    health: 100,
    coinsCount: 0,
    hasKey: false,
    timer: 0,
    score: 0,
    level: 1,
    lives: 3,
  });

  // Controller keys state mapping
  const [controller, setController] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  // Track Kiko coordinates
  const [kikoCords, setKikoCords] = useState<Position3D>({ x: 0, y: 0, z: 0 });

  // Handle music state initially upon first user interaction
  useEffect(() => {
    const handleFirstClick = () => {
      AudioFX.startBGM();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, []);

  // Sync Audio FX mute status
  useEffect(() => {
    AudioFX.setMute(isMuted);
  }, [isMuted]);

  // Global window keyboard events handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setController((prev) => ({ ...prev, forward: true }));
          break;
        case 's':
        case 'arrowdown':
          setController((prev) => ({ ...prev, backward: true }));
          break;
        case 'a':
        case 'arrowleft':
          setController((prev) => ({ ...prev, left: true }));
          break;
        case 'd':
        case 'arrowright':
          setController((prev) => ({ ...prev, right: true }));
          break;
        case ' ': // Spacebar
          // Prevent standard page scroll
          e.preventDefault();
          setController((prev) => ({ ...prev, jump: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setController((prev) => ({ ...prev, forward: false }));
          break;
        case 's':
        case 'arrowdown':
          setController((prev) => ({ ...prev, backward: false }));
          break;
        case 'a':
        case 'arrowleft':
          setController((prev) => ({ ...prev, left: false }));
          break;
        case 'd':
        case 'arrowright':
          setController((prev) => ({ ...prev, right: false }));
          break;
        case ' ':
          setController((prev) => ({ ...prev, jump: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Game active timer ticker
  useEffect(() => {
    let timerId: any;
    if (gameState === 'PLAYING') {
      timerId = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          timer: prev.timer + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [gameState]);

  // Handlers for interactions triggered by canvas loop
  const handleCoinCollected = (index: number) => {
    setStats((prev) => {
      const nextCoins = prev.coinsCount + 10;
      const nextScore = prev.score + 100;
      updateHighScoreLocally(nextCoins + nextScore);
      return {
        ...prev,
        coinsCount: nextCoins,
        score: nextScore,
      };
    });
    AudioFX.playCoin();
  };

  const handleKeyCollected = () => {
    setStats((prev) => ({
      ...prev,
      hasKey: true,
      score: prev.score + 250,
    }));
    AudioFX.playKey();
  };

  const handleDamage = (amount: number, reason: string) => {
    setDamageReason(reason);
    setStats((prev) => {
      const nextHealth = Math.max(0, prev.health - amount);
      if (nextHealth <= 0) {
        // Lose one life
        const nextLives = prev.lives - 1;
        if (nextLives <= 0) {
          // Trigger Game over
          setGameState('GAME_OVER');
          AudioFX.playGameOver();
          return {
            ...prev,
            health: 0,
            lives: 0,
          };
        } else {
          // Restart on same level with deducted life
          AudioFX.playDamage();
          // Short delay to let player breathe, reset coordinates and recover HP
          setTimeout(() => {
            setStats((statsPrev) => ({
              ...statsPrev,
              health: 100,
              hasKey: false, // keys reset to starting slots
            }));
          }, 300);
          return {
            ...prev,
            health: 100,
            lives: nextLives,
            hasKey: false,
          };
        }
      } else {
        AudioFX.playDamage();
        return {
          ...prev,
          health: nextHealth,
        };
      }
    });
  };

  const handleMonsterStomped = (id: number) => {
    setStats((prev) => ({
      ...prev,
      score: prev.score + 500,
      coinsCount: prev.coinsCount + 20,
    }));
    AudioFX.playCoin();
  };

  const handleChestReached = () => {
    // If it's the final level (Level 4): trigger complete victory
    if (activeLevelId === 4) {
      setGameState('VICTORY');
      AudioFX.playVictory();
    } else {
      setGameState('WIN_LEVEL');
      AudioFX.playVictory();
    }
  };

  const updateHighScoreLocally = (scoreVal: number) => {
    const currentHigh = localStorage.getItem('kiko_highscore_score');
    if (!currentHigh || scoreVal > parseInt(currentHigh)) {
      localStorage.setItem('kiko_highscore_score', scoreVal.toString());
    }
  };

  // UI callbacks
  const handleStartGame = (levelId: number) => {
    setActiveLevelId(levelId);
    setGameState('PLAYING');
    setStats({
      health: 100,
      coinsCount: 0,
      hasKey: false,
      timer: 0,
      score: 0,
      level: levelId,
      lives: 3,
    });
    AudioFX.startBGM();
  };

  const handleRestartLevel = () => {
    setGameState('PLAYING');
    setStats((prev) => ({
      ...prev,
      health: 100,
      hasKey: false,
      lives: 3,
    }));
    AudioFX.startBGM();
  };

  const handleNextLevel = () => {
    const nextLvl = Math.min(4, activeLevelId + 1);
    setActiveLevelId(nextLvl);
    setGameState('PLAYING');
    setStats((prev) => ({
      ...prev,
      health: 100,
      hasKey: false,
      level: nextLvl,
    }));
    AudioFX.startBGM();
  };

  const handleResetToMenu = () => {
    setGameState('MENU');
    setController({
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    });
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleControllerChange = (key: string, value: boolean) => {
    setController((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col justify-between">
      {/* Background stars / grid mesh decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.5)_0%,rgba(15,23,42,0.9)_100%)] z-0 pointer-events-none" />

      {/* Primary 3D View Screen Layer */}
      <section className="relative flex-1 w-full h-full z-10">
        <GameCanvas
          level={currentLevel}
          gameState={gameState}
          controller={controller}
          hasKey={stats.hasKey}
          onCoinCollected={handleCoinCollected}
          onKeyCollected={handleKeyCollected}
          onDamage={handleDamage}
          onMonsterStomped={handleMonsterStomped}
          onChestReached={handleChestReached}
          onUpdateStats={(pos) => setKikoCords(pos)}
        />

        {/* Floating Game HUD, menus, and overlays */}
        <GameUI
          stats={stats}
          gameState={gameState}
          currentLevel={currentLevel}
          levelsList={LEVELS}
          damageReason={damageReason}
          isMuted={isMuted}
          onStartGame={handleStartGame}
          onRestartLevel={handleRestartLevel}
          onNextLevel={handleNextLevel}
          onResetToMenu={handleResetToMenu}
          onToggleMute={handleToggleMute}
          onControllerChange={handleControllerChange}
        />
      </section>

      {/* Floating coordinates debugger toolbar, fits cute mono theme */}
      {gameState === 'PLAYING' && (
        <footer className="absolute bottom-5 right-5 z-20 pointer-events-none flex flex-col items-end gap-1 select-none">
          <div className="bg-slate-900/95 border border-slate-700/60 text-[9px] font-mono text-slate-400 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-amber-400 font-bold uppercase tracking-wider">Kiko Radar GPS 🧭</span>
            <span>X: <b className="text-white">{kikoCords.x.toFixed(2)}</b></span>
            <span>Y: <b className="text-white">{kikoCords.y.toFixed(2)}</b></span>
            <span>Z: <b className="text-white">{kikoCords.z.toFixed(2)}</b></span>
          </div>
        </footer>
      )}
    </main>
  );
}
