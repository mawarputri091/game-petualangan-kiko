import { LevelConfig } from './types';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Pulau Hijau Kiko (Kiko\'s Green Island)',
    theme: 'grass',
    gridSize: { width: 16, depth: 16 },
    startPos: { x: -6, y: 0.6, z: 6 },
    chestPos: { x: 6, y: 0.5, z: -6 },
    keyPos: { x: -6, y: 0.5, z: -6 },
    coins: [
      { x: -3, y: 0.5, z: 3 },
      { x: 0, y: 0.5, z: 1 },
      { x: 3, y: 0.5, z: -1 },
      { x: 6, y: 0.5, z: 2 },
      { x: -2, y: 0.5, z: -4 },
      { x: 2, y: 0.5, z: -6 },
    ],
    obstacles: [
      // Standard trees
      { type: 'tree', pos: { x: -6, y: 0, z: 0 }, size: 1.2 },
      { type: 'tree', pos: { x: 6, y: 0, z: 0 }, size: 1.4 },
      { type: 'tree', pos: { x: 0, y: 0, z: -6 }, size: 1.0 },
      { type: 'tree', pos: { x: 0, y: 0, z: 6 }, size: 1.1 },
      // Rocks
      { type: 'rock', pos: { x: -3, y: 0, z: -3 }, size: 1.2 },
      { type: 'rock', pos: { x: 3, y: 0, z: 3 }, size: 1.5 },
      // Tutorial helper mushrooms
      { type: 'mushroom', pos: { x: -2, y: 0, z: 2 }, bouncy: true },
      { type: 'mushroom', pos: { x: 2, y: 0, z: -2 }, bouncy: true },
    ],
    monsters: [
      {
        id: 101,
        type: 'slime',
        startPos: { x: -2, y: 0.4, z: -2 },
        endPos: { x: 2, y: 0.4, z: -2 },
        speed: 1.5,
      },
    ],
    tips: 'Gunakan tombol WASD / Arah untuk bergerak, dan SPASI untuk melompat! Cari Kunci perak berkilau untuk membuka Peti Emas.',
  },
  {
    id: 2,
    name: 'Hutan Jamur Ajaib (Magic Mushroom Forest)',
    theme: 'forest',
    gridSize: { width: 22, depth: 22 },
    startPos: { x: -8, y: 0.6, z: 8 },
    chestPos: { x: 8, y: 2.0, z: -8 }, // Located on elevated tree/mushroom platform
    keyPos: { x: 8, y: 0.5, z: 8 },
    coins: [
      { x: -4, y: 0.5, z: 4 },
      { x: 0, y: 1.5, z: 0 }, // Floating high
      { x: 4, y: 0.5, z: -4 },
      { x: -8, y: 0.5, z: -2 },
      { x: -2, y: 1.5, z: -8 }, // High up
      { x: 8, y: 0.5, z: 0 },
      { x: -4, y: 0.5, z: 8 },
      { x: 4, y: 0.5, z: 8 },
    ],
    obstacles: [
      // Bouncy mushrooms that lead to key/chest elevations
      { type: 'mushroom', pos: { x: 0, y: 0, z: 0 }, size: 1.8, bouncy: true },
      { type: 'mushroom', pos: { x: -2, y: 0, z: -8 }, size: 1.5, bouncy: true },
      { type: 'mushroom', pos: { x: 8, y: 0, z: -5 }, size: 2.2, bouncy: true }, // bounce to chest platform
      // Dense trees
      { type: 'tree', pos: { x: -8, y: 0, z: 4 }, size: 1.3 },
      { type: 'tree', pos: { x: -4, y: 0, z: -4 }, size: 1.6 },
      { type: 'tree', pos: { x: 4, y: 0, z: 4 }, size: 1.4 },
      { type: 'tree', pos: { x: -8, y: 0, z: -8 }, size: 1.8 },
      { type: 'tree', pos: { x: 8, y: 0, z: 4 }, size: 1.2 },
      // Logs
      { type: 'rock', pos: { x: -2, y: 0, z: 6 }, size: 1.1 },
      { type: 'rock', pos: { x: 2, y: 0, z: -6 }, size: 1.1 },
    ],
    monsters: [
      {
        id: 201,
        type: 'bubu',
        startPos: { x: -4, y: 0.5, z: 0 },
        endPos: { x: 4, y: 0.5, z: 0 },
        speed: 2.5, // Faster rolling monster (Bubu!)
      },
      {
        id: 202,
        type: 'slime',
        startPos: { x: 0, y: 0.4, z: -4 },
        endPos: { x: 0, y: 0.4, z: 4 },
        speed: 1.8,
      },
    ],
    tips: 'Beberapa jamur raksasa sangat membal (bouncy)! Lompat tepat di atas jamur merah untuk melambung ke tempat yang tinggi.',
  },
  {
    id: 3,
    name: 'Gurun Pasir Berduri (Prickly Sand Desert)',
    theme: 'desert',
    gridSize: { width: 24, depth: 24 },
    startPos: { x: -9, y: 0.6, z: 9 },
    chestPos: { x: 9, y: 0.5, z: -9 },
    keyPos: { x: -9, y: 0.5, z: -9 },
    coins: [
      { x: -5, y: 0.5, z: 5 },
      { x: 0, y: 0.5, z: 5 },
      { x: 5, y: 0.5, z: 5 },
      { x: -5, y: 0.5, z: -5 },
      { x: 5, y: 0.5, z: -5 },
      { x: 0, y: 0.5, z: -8 },
      { x: -8, y: 0.5, z: 0 },
      { x: 8, y: 0.5, z: 0 },
    ],
    obstacles: [
      // Beautiful Cactuses and Spike hazards
      { type: 'cactus', pos: { x: -4, y: 0, z: 1 }, size: 1.3, dangerous: true },
      { type: 'cactus', pos: { x: 4, y: 0, z: -1 }, size: 1.5, dangerous: true },
      { type: 'cactus', pos: { x: -1, y: 0, z: -4 }, size: 1.2, dangerous: true },
      { type: 'cactus', pos: { x: 1, y: 0, z: 4 }, size: 1.4, dangerous: true },
      // Spikes on ground (need to jump over!)
      { type: 'spike', pos: { x: 0, y: 0.1, z: 0 }, size: 1.0, dangerous: true },
      { type: 'spike', pos: { x: -3, y: 0.1, z: -7 }, size: 1.0, dangerous: true },
      { type: 'spike', pos: { x: 3, y: 0.1, z: -7 }, size: 1.0, dangerous: true },
      // Rocks
      { type: 'rock', pos: { x: -9, y: 0, z: 3 }, size: 2.0 },
      { type: 'rock', pos: { x: 9, y: 0, z: -3 }, size: 2.0 },
    ],
    monsters: [
      {
        id: 301,
        type: 'bubu',
        startPos: { x: -6, y: 0.5, z: -2 },
        endPos: { x: 6, y: 0.5, z: -2 },
        speed: 2.8,
      },
      {
        id: 302,
        type: 'bubu',
        startPos: { x: -2, y: 0.5, z: 6 },
        endPos: { x: -2, y: 0.5, z: -6 },
        speed: 2.2,
      },
    ],
    tips: 'Awas Kaktus dan Ranjau Duri berwarna merah! Menyentuhnya akan mengurangi HP Kiko. Lompat dengan hati-hati.',
  },
  {
    id: 4,
    name: 'Kuil Lava Kuno (Ancient Lava Temple)',
    theme: 'temple',
    gridSize: { width: 28, depth: 28 },
    startPos: { x: -11, y: 0.6, z: 11 },
    chestPos: { x: 11, y: 0.5, z: -11 },
    keyPos: { x: 0, y: 1.5, z: 0 }, // Sparking key on elevated lava center!
    coins: [
      { x: -8, y: 0.5, z: 8 },
      { x: -4, y: 0.5, z: 4 },
      { x: 4, y: 0.5, z: -4 },
      { x: 8, y: 0.5, z: -8 },
      { x: 0, y: 1.5, z: 4 },
      { x: 0, y: 1.5, z: -4 },
      { x: -11, y: 0.5, z: -6 },
      { x: 11, y: 0.5, z: 6 },
    ],
    obstacles: [
      // Lava blocks that are highly dangerous
      { type: 'lava', pos: { x: -2, y: 0.05, z: 2 }, size: 3.0, dangerous: true },
      { type: 'lava', pos: { x: 2, y: 0.05, z: -2 }, size: 3.0, dangerous: true },
      { type: 'lava', pos: { x: 0, y: 0.05, z: 0 }, size: 4.0, dangerous: true }, // under the key!
      // Bouncy mushroom to jump over the lava center to grab the key
      { type: 'mushroom', pos: { x: -4, y: 0, z: 0 }, size: 1.5, bouncy: true },
      { type: 'mushroom', pos: { x: 4, y: 0, z: 0 }, size: 1.5, bouncy: true },
      // Pillars (represented as tall tree trunk models)
      { type: 'tree', pos: { x: -11, y: 0, z: -11 }, size: 2.0 },
      { type: 'tree', pos: { x: 11, y: 0, z: 11 }, size: 2.0 },
      { type: 'rock', pos: { x: -8, y: 0, z: 0 }, size: 1.8 },
      { type: 'rock', pos: { x: 8, y: 0, z: 0 }, size: 1.8 },
    ],
    monsters: [
      {
        id: 401,
        type: 'bubu',
        startPos: { x: -8, y: 0.5, z: -6 },
        endPos: { x: 8, y: 0.5, z: -6 },
        speed: 3.2, // Elite fast monster!
      },
      {
        id: 402,
        type: 'bubu',
        startPos: { x: -8, y: 0.5, z: 6 },
        endPos: { x: 8, y: 0.5, z: 6 },
        speed: 3.2,
      },
      {
        id: 403,
        type: 'slime',
        startPos: { x: -6, y: 0.4, z: -11 },
        endPos: { x: 6, y: 0.4, z: -11 },
        speed: 2.0,
      },
    ],
    tips: 'Lantai Kuil dipenuhi cairan Lava panas membara! Cari jamur loncat (bouncy mushroom) di samping untuk melakukan loncatan luar biasa melewati lava!',
  },
];
