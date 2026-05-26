import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Coins,
  Key,
  Volume2,
  VolumeX,
  Trophy,
  Play,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Crown,
  Gamepad2,
  HelpCircle,
  Skull,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { GameStats, GameStatus, LevelConfig } from '../types';
import { LEVELS } from '../levels';
import { AudioFX } from '../utils/audio';

interface GameUIProps {
  stats: GameStats;
  gameState: GameStatus;
  currentLevel: LevelConfig;
  levelsList: LevelConfig[];
  damageReason: string;
  isMuted: boolean;
  onStartGame: (levelId: number) => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
  onResetToMenu: () => void;
  onToggleMute: () => void;
  onControllerChange: (key: string, value: boolean) => void;
}

export default function GameUI({
  stats,
  gameState,
  currentLevel,
  levelsList,
  damageReason,
  isMuted,
  onStartGame,
  onRestartLevel,
  onNextLevel,
  onResetToMenu,
  onToggleMute,
  onControllerChange,
}: GameUIProps) {
  const [showHowTo, setShowHowTo] = useState(false);
  const [highScore, setHighScore] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('kiko_highscore_score');
    if (saved) {
      setHighScore(parseInt(saved) || 0);
    }
  }, [gameState]);

  // Touch and hold controls for mobile screen joystick/buttons
  const handleTouchStart = (key: string) => {
    onControllerChange(key, true);
  };

  const handleTouchEnd = (key: string) => {
    onControllerChange(key, false);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none font-sans flex flex-col justify-between p-4">
      {/* =======================================================
          TOP ROW DESG: COINS COUNTER, KEY STATE, ACTIVE HP BAR
         ======================================================= */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        {/* Left Side: HP & Level Status Info */}
        <div className="flex flex-col gap-2">
          <div className="backdrop-blur-md bg-white/20 hover:bg-white/25 text-white p-3 rounded-2xl flex items-center gap-3 border border-white/40 shadow-xl transition-all duration-300">
            <div className="relative">
              <Heart className={`w-8 h-8 text-rose-500 fill-rose-500 ${stats.health < 40 ? 'animate-bounce' : ''}`} />
              <span className="absolute -bottom-1 -right-1 bg-rose-600 text-[10px] text-white px-1.5 rounded-full font-bold">
                {stats.lives}
              </span>
            </div>
            <div>
              <div className="flex justify-between items-center w-36 text-xs mb-1">
                <span className="font-bold text-white drop-shadow-sm">Darah Kiko</span>
                <span className={`font-mono font-bold ${stats.health < 40 ? 'text-rose-300 animate-pulse' : 'text-emerald-300'}`}>
                  {stats.health}%
                </span>
              </div>
              <div className="w-36 bg-black/20 rounded-full h-3.5 overflow-hidden border border-white/20">
                <motion.div
                  className="bg-gradient-to-r from-rose-400 via-pink-400 to-emerald-400 h-full rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: `${stats.health}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-emerald-500/25 text-white px-3 py-1.5 rounded-full border border-emerald-300/40 text-xs w-fit flex items-center gap-2 shadow-md">
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            <span className="font-medium text-[11px] font-mono">Lvl {stats.level}: {currentLevel.name}</span>
          </div>
        </div>

        {/* Center top notification helper when playing */}
        {gameState === 'PLAYING' && (
          <div className="hidden md:flex flex-col items-center gap-1">
            <div className="backdrop-blur-md bg-white/15 border border-white/30 px-4 py-2 rounded-2xl text-center text-[11px] text-white max-w-sm shadow-xl">
              💡 <span className="text-white font-medium">{currentLevel.tips}</span>
            </div>
          </div>
        )}

        {/* Right Side: Treasure count and Key Finder status */}
        <div className="flex items-start gap-2">
          {/* Coins Count HUD */}
          <div className="backdrop-blur-md bg-white/20 text-white px-4 py-3 rounded-2xl flex items-center gap-2 border border-white/40 shadow-xl font-mono text-center">
            <Coins className="w-6 h-6 text-amber-300 animate-pulse drop-shadow" />
            <div className="flex flex-col align-left justify-center text-left">
              <span className="text-[9px] text-slate-200 uppercase leading-none font-sans">Harta</span>
              <span className="font-extrabold text-md md:text-xl text-yellow-300 drop-shadow">{stats.coinsCount} G</span>
            </div>
          </div>

          {/* Key status HUD */}
          <div className={`transition-all duration-300 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-2 border shadow-xl ${
            stats.hasKey
              ? 'bg-cyan-500/30 text-white border-cyan-300/50 animate-bounce'
              : 'bg-white/10 text-white/50 border-white/20'
          }`}>
            <Key className={`w-6 h-6 ${stats.hasKey ? 'text-cyan-300 animate-pulse' : 'text-white/40'}`} />
            <div className="flex flex-col text-left">
              <span className="text-[9px] uppercase leading-none font-sans">Kunci</span>
              <span className={`font-bold text-xs ${stats.hasKey ? 'text-cyan-200' : 'text-white/40'}`}>
                {stats.hasKey ? 'ADA (Buka Peti!)' : 'Belum Ada'}
              </span>
            </div>
          </div>

          {/* Sound Control HUD */}
          <button
            onClick={onToggleMute}
            className="p-3.5 rounded-2xl backdrop-blur-md bg-white/20 hover:bg-white/30 text-white hover:text-yellow-200 transition-all border border-white/40 shadow-xl cursor-pointer"
            title="Mute / Unmute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* =======================================================
          MIDDLE MODALS & STATE VIEWS (MENU, GAME OVER, WIN, ETC)
         ======================================================= */}
      <div className="flex-1 w-full flex items-center justify-center pointer-events-auto my-4">
        <AnimatePresence mode="wait">
          {/* 1. STATE: MENU SCREEN */}
          {gameState === 'MENU' && (
            <motion.div
              key="menu-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl backdrop-blur-xl bg-white/15 border border-white/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[85vh] text-center flex flex-col items-center text-white"
            >
              {/* Cute Badge */}
              <div className="flex items-center gap-1 px-3 py-1 bg-white/10 text-yellow-300 border border-white/30 text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>3D Adventure Treasure Hunt</span>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>

              {/* Game Title */}
              <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-md tracking-tight leading-tight">
                Petualangan Kiko
              </h1>
              <p className="text-white/80 text-sm md:text-base mt-2 max-w-md mx-auto leading-relaxed">
                Kendalikan Kiko, karakter lucu nan menggemaskan, mengarungi pulau-pulau ajaib untuk melacak harta karun legendaris!
              </p>

              {/* Character Splash Box */}
              <div className="my-6 relative bg-white/10 w-32 h-32 md:w-36 md:h-36 rounded-2xl border border-white/20 flex flex-col justify-center items-center shadow-inner overflow-hidden">
                {/* 2D cute mascot drawing inside */}
                <div className="w-16 h-16 bg-gradient-to-tr from-pink-400 to-yellow-300 rounded-full flex items-center justify-center border-4 border-white/60 animate-bounce shadow-lg">
                  <span className="text-3xl">🦖</span>
                </div>
                <div className="absolute top-1 right-2 animate-pulse text-[10px] text-yellow-300 font-mono font-bold">Halo! Kiko</div>
                {/* Cheeks and eye simulation */}
                <div className="flex gap-4 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-300 blur-[1px]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-300 blur-[1px]"></span>
                </div>
              </div>

              {/* Level Selector */}
              <div className="w-full text-left mb-6">
                <span className="text-xs font-semibold uppercase text-white/50 mb-2 block font-mono">Pilih Level Pulau:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {levelsList.map((lvl) => {
                    const isSelected = currentLevel.id === lvl.id;
                    const iconMap = ['🌴', '🍄', '🌵', '🌋'];
                    const icon = iconMap[lvl.id - 1] || '🗺️';

                    const themeColor =
                      lvl.theme === 'grass'
                        ? 'border-emerald-300/60 bg-emerald-500/20'
                        : lvl.theme === 'forest'
                        ? 'border-green-300/60 bg-green-500/20'
                        : lvl.theme === 'desert'
                        ? 'border-amber-300/60 bg-amber-500/20'
                        : 'border-red-300/60 bg-red-500/20';

                    return (
                      <button
                        key={lvl.id}
                        onClick={() => onStartGame(lvl.id)}
                        className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                          isSelected
                            ? `${themeColor} ring-2 ring-yellow-300 bg-white/20`
                            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex gap-2 items-center">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <span className="text-[10px] font-mono text-white/60 uppercase leading-none block">Pulau {lvl.id}</span>
                            <span className="text-xs md:text-sm font-bold text-white leading-tight block">{lvl.name.split(' (')[0]}</span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-yellow-300 animate-ping' : 'text-white/40'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions & Highscore Display */}
              <div className="w-full flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-white/15 pt-5">
                <div className="text-left">
                  <span className="text-[10px] text-white/55 font-mono uppercase leading-none block">Rekor Skor Tertinggi</span>
                  <span className="text-sm font-bold text-yellow-300 flex items-center gap-1 font-mono">
                    <Trophy className="w-4 h-4 text-yellow-300" /> {highScore} G Emas
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHowTo(true)}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-2 border border-white/20 transition cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" /> Cara Main
                  </button>

                  <button
                    onClick={() => onStartGame(currentLevel.id)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 hover:from-amber-200 hover:to-orange-300 text-slate-900 font-extrabold text-sm md:text-base flex items-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95 transition cursor-pointer border border-white/20"
                  >
                    <Play className="w-5 h-5 fill-slate-900" /> MULAI BERMAIN!
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. STATE: GAME OVER MODAL */}
          {gameState === 'GAME_OVER' && (
            <motion.div
              key="gameover-panel"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-md backdrop-blur-xl bg-white/15 border border-red-400/40 rounded-3xl p-6 text-center shadow-2xl text-white"
            >
              <div className="w-16 h-16 bg-rose-500/20 text-rose-300 border border-rose-300/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <Skull className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-rose-300 drop-shadow">Kiko Pingsan!</h2>
              <p className="text-white/80 text-xs mt-1">
                Kiko terluka terlalu parah dan kehabisan tenaga untuk melanjutkan perjalanan.
              </p>

              {damageReason && (
                <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 my-4 text-xs text-rose-200">
                  Defeated by: <span className="font-bold underline text-white">{damageReason}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-white/70 text-xs font-mono my-4 bg-black/10 border border-white/10 p-3 rounded-2xl">
                <div>
                  <span className="text-white/40 block text-[9px] uppercase font-sans">Koin Terkumpul</span>
                  <p className="text-lg font-bold text-yellow-300">{stats.coinsCount} G</p>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px] uppercase font-sans">Status Kunci</span>
                  <p className="text-lg font-bold text-cyan-300">{stats.hasKey ? 'Dapat' : 'Tidak Ada'}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={onResetToMenu}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-bold border border-white/20 transition cursor-pointer"
                >
                  Kembali ke Menu
                </button>
                <button
                  onClick={onRestartLevel}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-300 hover:to-pink-400 text-xs text-white font-extrabold flex items-center gap-2 border border-white/20 shadow-lg cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Ulangi Level
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. STATE: WIN LEVEL MODAL */}
          {gameState === 'WIN_LEVEL' && (
            <motion.div
              key="winlevel-panel"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-md backdrop-blur-xl bg-white/15 border border-amber-300/40 rounded-3xl p-6 text-center shadow-2xl text-white"
            >
              <div className="w-16 h-16 bg-amber-500/20 text-amber-300 border border-amber-300/40 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <h2 className="text-2xl font-black text-amber-300 drop-shadow">Peti Harta Dibuka!</h2>
              <p className="text-white/80 text-xs mt-1">
                Luar biasa! Kiko berhasil menemukan kunci dan menyelamatkan koin-koin di {currentLevel.name.split(' (')[0]}.
              </p>

              <div className="my-4 bg-white/5 border border-white/15 py-3 rounded-2xl font-mono">
                <div className="flex justify-around text-center">
                  <div>
                    <span className="text-[10px] text-white/60 block font-sans">Koin Level</span>
                    <span className="text-xl font-bold text-yellow-300">+{currentLevel.coins.length * 10}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/60 block font-sans">Skor Bawaan</span>
                    <span className="text-xl font-bold text-yellow-300">+{stats.score}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={onResetToMenu}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white border border-white/20 font-bold transition cursor-pointer"
                >
                  Ke Menu
                </button>
                <button
                  onClick={onNextLevel}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-300 to-orange-400 hover:from-amber-200 hover:to-orange-300 text-slate-900 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg border border-white/20"
                >
                  Lanjut Pulau Berikutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* 4. STATE: GRAND GRAND VICTORY MODAL */}
          {gameState === 'VICTORY' && (
            <motion.div
              key="victory-panel"
              initial={{ scale: 0.8, fillOpacity: 0 }}
              animate={{ scale: 1, fillOpacity: 1 }}
              exit={{ scale: 0.8 }}
              className="w-full max-w-md backdrop-blur-xl bg-gradient-to-b from-white/20 to-white/10 border border-yellow-300 rounded-3xl p-6 text-center shadow-2xl text-white relative overflow-hidden"
            >
              {/* Confetti sparkle overlay emitters */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 via-yellow-300 to-emerald-400 animate-pulse" />

              <div className="w-20 h-20 bg-amber-400/20 text-yellow-300 border-2 border-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <Crown className="w-10 h-10 text-yellow-300" />
              </div>

              <span className="text-xs uppercase tracking-widest text-yellow-300 font-bold font-mono">Pencapaian Sang Ahli!</span>
              <h2 className="text-3xl font-black text-white leading-none mt-1 drop-shadow">Petualangan Selesai!</h2>
              <p className="text-white/80 text-xs mt-3">
                Kiko resmi dinobatkan sebagai Raja Penemu Harta Karun Purba! Semua 4 pulau ajaib telah dipecahkan sepenuhnya.
              </p>

              <div className="bg-white/5 my-5 p-4 rounded-2xl border border-white/15 text-left space-y-2">
                <div className="flex justify-between items-center text-xs text-white/80">
                  <span>Sisa Nyawa Kiko:</span>
                  <span className="font-mono font-bold text-rose-300">{stats.lives} Jantung ♥</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/80">
                  <span>Total Koin Emas Ditabung:</span>
                  <span className="font-mono font-bold text-yellow-300">{stats.coinsCount} G Emas</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/80">
                  <span>Peringkat Petualang:</span>
                  <span className="font-bold text-sky-300">Master Kiko Gold 👑</span>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={onResetToMenu}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-amber-200 hover:to-yellow-300 text-slate-900 font-black text-sm transition cursor-pointer border border-white/20 shadow-lg"
                >
                  Ulangi Eksplorasi
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =======================================================
          BOTTOM ROW DESIGN: MOBILE CONTROLS & HOW TO DIALOGS
         ======================================================= */}
      <div className="w-full flex justify-between items-end pointer-events-auto">
        {/* Left corner: Control summary info for desktop */}
        <div className="hidden lg:flex backdrop-blur-md bg-white/10 text-white/80 px-3 py-2 rounded-xl text-[10px] font-mono leading-relaxed border border-white/20 select-none shadow-lg">
          🎮 DESKTOP CONTROLS:
          <br />• Gerakan: WASD atau PANAH tombol
          <br />• Melompat: SPASI (Spacebar)
          <br />• Rotasi Kamera: Tahan & Seret mouse kursor
        </div>

        {/* Center / Right Bottom Row: Mobile visual Joystick panel D-PAD */}
        {gameState === 'PLAYING' && (
          <div className="w-full flex justify-between items-end gap-4 max-w-4xl mx-auto">
            {/* Directional Pad Container */}
            <div className="backdrop-blur-xl bg-white/15 border border-white/30 p-2.5 rounded-3xl flex flex-col items-center justify-center shadow-2xl relative w-36 h-36">
              <span className="absolute text-[8px] uppercase font-mono text-white/40 top-1">Gigi Arah</span>
              {/* Up button */}
              <button
                onTouchStart={() => handleTouchStart('forward')}
                onTouchEnd={() => handleTouchEnd('forward')}
                onMouseDown={() => handleTouchStart('forward')}
                onMouseUp={() => handleTouchEnd('forward')}
                onMouseLeave={() => handleTouchEnd('forward')}
                className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 active:bg-amber-400 active:text-slate-950 shadow flex items-center justify-center cursor-pointer transition-colors"
              >
                <ArrowUp className="w-5 h-5" />
              </button>

              <div className="flex justify-between w-full mt-1.5 px-1">
                {/* Left */}
                <button
                  onTouchStart={() => handleTouchStart('left')}
                  onTouchEnd={() => handleTouchEnd('left')}
                  onMouseDown={() => handleTouchStart('left')}
                  onMouseUp={() => handleTouchEnd('left')}
                  onMouseLeave={() => handleTouchEnd('left')}
                  className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 active:bg-amber-400 active:text-slate-950 shadow flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Center / Anchor */}
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse" />
                </div>

                {/* Right */}
                <button
                  onTouchStart={() => handleTouchStart('right')}
                  onTouchEnd={() => handleTouchEnd('right')}
                  onMouseDown={() => handleTouchStart('right')}
                  onMouseUp={() => handleTouchEnd('right')}
                  onMouseLeave={() => handleTouchEnd('right')}
                  className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 active:bg-amber-400 active:text-slate-950 shadow flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Down button */}
              <button
                onTouchStart={() => handleTouchStart('backward')}
                onTouchEnd={() => handleTouchEnd('backward')}
                onMouseDown={() => handleTouchStart('backward')}
                onMouseUp={() => handleTouchEnd('backward')}
                onMouseLeave={() => handleTouchEnd('backward')}
                className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 active:bg-amber-400 active:text-slate-950 shadow flex items-center justify-center mt-1.5 cursor-pointer transition-colors"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            {/* Back to menu button */}
            <button
              onClick={onResetToMenu}
              className="mb-2 px-3 py-2 backdrop-blur-md bg-white/10 border border-white/20 text-white/80 hover:bg-white/25 hover:text-white font-mono text-[9px] uppercase rounded-xl flex items-center gap-1 cursor-pointer transition"
            >
              🚪 Menu
            </button>

            {/* Massive Jump Action Button */}
            <button
              onTouchStart={() => handleTouchStart('jump')}
              onTouchEnd={() => handleTouchEnd('jump')}
              onMouseDown={() => handleTouchStart('jump')}
              onMouseUp={() => handleTouchEnd('jump')}
              className="w-20 h-20 rounded-full backdrop-blur-md bg-sky-500/75 hover:bg-sky-400/80 active:scale-95 text-white font-extrabold text-xs shadow-2xl border-2 border-white/40 flex flex-col items-center justify-center cursor-pointer select-none"
            >
              <span>LOMPAT</span>
              <span className="text-[9px] font-mono block opacity-60">(SPASI)</span>
            </button>
          </div>
        )}
      </div>

      {/* =======================================================
          HOW-TO DIALOG OVERLAY (DRAWER POPUP)
         ======================================================= */}
      <AnimatePresence>
        {showHowTo && (
          <div className="fixed inset-0 bg-black/70 z-25 flex items-center justify-center p-4 pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="backdrop-blur-xl bg-slate-900/85 border border-white/20 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4 text-white"
            >
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
                Cara Bermain Kiko Adventure 3D
              </h3>

              <div className="space-y-3 text-xs text-slate-200 leading-relaxed font-sans">
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-white text-center flex items-center justify-center font-bold">1</div>
                  <p>Misi utama adalah menemukan <b>Kunci Perak</b> di sekitar pulau tersembunyi, lalu bawalah ke <b>Peti Harta Karun Emas</b> untuk melewatinya.</p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-white text-center flex items-center justify-center font-bold">2</div>
                  <p>Kumpulkan koin emas yang tersebar untuk menambah HP bonus dan melipatgandakan skor petualanganmu.</p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-white text-center flex items-center justify-center font-bold">3</div>
                  <p>Hindari <b>Jelly Slime</b> dan <b>Monster Bubu Berduri</b>. <b>Trik Rahasia:</b> kamu bisa mengalahkan mereka dengan cara melompat tepat di atas kepala mereka (Jump Stomp)!</p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-white text-center flex items-center justify-center font-bold">4</div>
                  <p>Waspada rintangan rona merah seperti Ranjau Duri, Kaktus Gurun, dan Lantai Lava Merah yang akan melepaskan racun parah pada HP Kiko.</p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-white text-center flex items-center justify-center font-bold">5</div>
                  <p>Seret/genggam areanya untuk mengitari/memutar pandangan Kamera 3D agar tidak tersesat!</p>
                </div>
              </div>

              <button
                onClick={() => setShowHowTo(false)}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-xs font-bold text-white rounded-xl border border-white/20 transition cursor-pointer"
              >
                Mengerti, Mengerti!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
