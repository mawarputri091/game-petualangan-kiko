export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  theme: 'grass' | 'forest' | 'desert' | 'temple';
  gridSize: { width: number; depth: number };
  startPos: Position3D;
  chestPos: Position3D;
  keyPos: Position3D;
  coins: Position3D[];
  obstacles: {
    type: 'tree' | 'rock' | 'mushroom' | 'spike' | 'cactus' | 'lava';
    pos: Position3D;
    size?: number;
    bouncy?: boolean;
    dangerous?: boolean;
  }[];
  monsters: {
    id: number;
    type: 'slime' | 'bubu';
    startPos: Position3D;
    endPos: Position3D;
    speed: number;
  }[];
  tips: string;
}

export type GameStatus = 'MENU' | 'PLAYING' | 'WIN_LEVEL' | 'GAME_OVER' | 'VICTORY';

export interface GameStats {
  health: number;
  coinsCount: number;
  hasKey: boolean;
  timer: number;
  score: number;
  level: number;
  lives: number;
}
