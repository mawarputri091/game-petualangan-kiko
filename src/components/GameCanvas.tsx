import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameStatus, LevelConfig, Position3D } from '../types';
import { AudioFX } from '../utils/audio';

interface GameCanvasProps {
  level: LevelConfig;
  gameState: GameStatus;
  controller: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
  };
  hasKey: boolean;
  onCoinCollected: (index: number) => void;
  onKeyCollected: () => void;
  onDamage: (amount: number, reason: string) => void;
  onMonsterStomped: (id: number) => void;
  onChestReached: () => void;
  onUpdateStats: (pos: Position3D) => void;
}

export default function GameCanvas({
  level,
  gameState,
  controller,
  hasKey,
  onCoinCollected,
  onKeyCollected,
  onDamage,
  onMonsterStomped,
  onChestReached,
  onUpdateStats,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for sharing the character state with loop & parent
  const kikoPos = useRef<Position3D>({ ...level.startPos });
  const kikoVel = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isJumping = useRef<boolean>(false);
  const isFainting = useRef<boolean>(false);
  const invincibleCooldown = useRef<number>(0);

  // Lists of active level elements
  const [activeCoins, setActiveCoins] = useState<Position3D[]>([]);
  const [activeMonsters, setActiveMonsters] = useState<any[]>([]);
  const [isChestUnlocked, setIsChestUnlocked] = useState<boolean>(false);
  const [isKeyAvailable, setIsKeyAvailable] = useState<boolean>(true);

  // Camera Orbit angles
  const cameraAngleX = useRef<number>(0); // Left-Right rotation
  const cameraAngleY = useRef<number>(0.3); // Altitude angle
  const isMouseDown = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update level states on level change
  useEffect(() => {
    kikoPos.current = { ...level.startPos };
    kikoVel.current.set(0, 0, 0);
    isJumping.current = false;
    isFainting.current = false;
    setActiveCoins([...level.coins]);
    setActiveMonsters(
      level.monsters.map((m) => ({
        ...m,
        currentPos: { ...m.startPos },
        direction: 1, // 1 for start->end, -1 for end->start
        t: 0,
        alive: true,
      }))
    );
    setIsChestUnlocked(false);
    setIsKeyAvailable(true);
    invincibleCooldown.current = 0;
  }, [level]);

  // Handle Game Over or Restart Reset
  useEffect(() => {
    if (gameState === 'GAME_OVER') {
      isFainting.current = true;
    } else if (gameState === 'PLAYING') {
      isFainting.current = false;
    }
  }, [gameState]);

  // Main Three.js renderer effect
  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#d0efff'); // Gentle sky blue
    scene.fog = new THREE.FogExp2('#d0efff', 0.015);

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Clear previous canvasses
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fffdf0', 1.2);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    const d = 15;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Cute soft point light near Kiko
    const playerLight = new THREE.PointLight('#ffebb3', 1.0, 5);
    playerLight.castShadow = false;
    scene.add(playerLight);

    // --- PLATFORM / ISLAND STYLING ---
    const gridW = level.gridSize.width;
    const gridD = level.gridSize.depth;

    // Colors according to theme
    let groundColor = '#7bc676'; // Lush Grass
    let sideColor = '#8d6e63';   // Rich Dirt
    let gridLineColor = '#60ad5b';

    if (level.theme === 'forest') {
      groundColor = '#2e7d32'; // Moody Forest Green
      sideColor = '#5d4037';
      gridLineColor = '#1b5e20';
    } else if (level.theme === 'desert') {
      groundColor = '#f0d38d'; // Warm Sand
      sideColor = '#ca9b52';
      gridLineColor = '#dcb260';
    } else if (level.theme === 'temple') {
      groundColor = '#3e2723'; // Obsidian dark brick
      sideColor = '#212121';
      gridLineColor = '#4e342e';
    }

    // Ground platform group
    const island = new THREE.Group();

    // Top layer
    const groundGeom = new THREE.BoxGeometry(gridW + 2, 1, gridD + 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.8,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.position.y = -0.5; // Top face rests at y = 0
    groundMesh.receiveShadow = true;
    island.add(groundMesh);

    // Outer rock frame/cliff (underneath top layer)
    const baseGeom = new THREE.BoxGeometry(gridW + 1.8, 3, gridD + 1.8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.9,
    });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = -2.5;
    baseMesh.receiveShadow = true;
    island.add(baseMesh);

    // Add decorative grid tiles for alignment and retro feeling
    const gridHelper = new THREE.GridHelper(Math.max(gridW, gridD) + 2, Math.max(gridW, gridD) + 2, '#444444', gridLineColor);
    gridHelper.position.y = 0.01;
    island.add(gridHelper);

    scene.add(island);

    // --- KIKO (CHARACTER) CREATION ---
    const kikoGroup = new THREE.Group();
    kikoGroup.castShadow = true;

    // Main circular cute body
    const bodyGeom = new THREE.SphereGeometry(0.5, 32, 32);
    const bodyColor = level.theme === 'desert' ? '#26c6da' : level.theme === 'temple' ? '#e040fb' : '#ff7043'; // Vibrant dynamic color
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.5,
      metalness: 0.1,
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    kikoGroup.add(bodyMesh);

    // Two big cute anime-style eyes
    const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const pupilGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });

    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.2, 0.15, 0.43);
    const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
    leftPupil.position.set(0.22, 0.15, 0.53);
    kikoGroup.add(leftEye);
    kikoGroup.add(leftPupil);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-0.2, 0.15, 0.43);
    const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
    rightPupil.position.set(-0.22, 0.15, 0.53);
    kikoGroup.add(rightEye);
    kikoGroup.add(rightPupil);

    // Pink cheeks
    const cheekGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const cheekMat = new THREE.MeshBasicMaterial({ color: '#ff4081' });
    const leftCheek = new THREE.Mesh(cheekGeom, cheekMat);
    leftCheek.position.set(0.35, 0.0, 0.4);
    const rightCheek = new THREE.Mesh(cheekGeom, cheekMat);
    rightCheek.position.set(-0.35, 0.0, 0.4);
    kikoGroup.add(leftCheek);
    kikoGroup.add(rightCheek);

    // Happy open mouth
    const mouthGeom = new THREE.BoxGeometry(0.12, 0.06, 0.05);
    const mouthMat = new THREE.MeshBasicMaterial({ color: '#5c0000' });
    const mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.position.set(0, 0.02, 0.47);
    kikoGroup.add(mouth);

    // Cute small backpack (yellow-orange)
    const packGeom = new THREE.BoxGeometry(0.35, 0.4, 0.2);
    const packMat = new THREE.MeshStandardMaterial({
      color: '#ffca28',
      roughness: 0.6,
    });
    const backpack = new THREE.Mesh(packGeom, packMat);
    backpack.position.set(0, 0, -0.45);
    backpack.castShadow = true;
    kikoGroup.add(backpack);

    // Tiny ears / small horns decoration
    const hornGeom = new THREE.ConeGeometry(0.08, 0.2, 4);
    const hornMat = new THREE.MeshStandardMaterial({ color: '#ffd54f' });
    const leftHorn = new THREE.Mesh(hornGeom, hornMat);
    leftHorn.position.set(0.25, 0.5, 0);
    leftHorn.rotation.z = -0.3;
    const rightHorn = new THREE.Mesh(hornGeom, hornMat);
    rightHorn.position.set(-0.25, 0.5, 0);
    rightHorn.rotation.z = 0.3;
    kikoGroup.add(leftHorn);
    kikoGroup.add(rightHorn);

    // Feet
    const footGeom = new THREE.SphereGeometry(0.16, 16, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: '#ffd54f', roughness: 0.7 });

    const leftFoot = new THREE.Mesh(footGeom, footMat);
    leftFoot.position.set(0.22, -0.45, 0);
    leftFoot.castShadow = true;
    kikoGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeom, footMat);
    rightFoot.position.set(-0.22, -0.45, 0);
    rightFoot.castShadow = true;
    kikoGroup.add(rightFoot);

    scene.add(kikoGroup);

    // --- COINS MODELS ---
    const coinsGroup = new THREE.Group();
    const coinGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 16);
    coinGeom.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: '#ffea00',
      metalness: 0.9,
      roughness: 0.1,
    });

    const coinMeshes: THREE.Mesh[] = [];
    activeCoins.forEach((c) => {
      const coinMesh = new THREE.Mesh(coinGeom, coinMat);
      coinMesh.position.set(c.x, c.y, c.z);
      coinMesh.castShadow = true;
      coinsGroup.add(coinMesh);
      coinMeshes.push(coinMesh);

      // Mini ring glow helper for each coin
      const ringGlow = new THREE.PointLight('#ffea00', 0.2, 2);
      ringGlow.position.copy(coinMesh.position);
      coinsGroup.add(ringGlow);
    });
    scene.add(coinsGroup);

    // --- GOLDEN TREASURE CHEST ---
    const chestGroup = new THREE.Group();
    chestGroup.position.set(level.chestPos.x, level.chestPos.y, level.chestPos.z);

    // Base box
    const chestBaseGeom = new THREE.BoxGeometry(1.2, 0.6, 0.8);
    const chestBaseMat = new THREE.MeshStandardMaterial({
      color: '#5d4037', // Wood color
      roughness: 0.7,
    });
    const chestBase = new THREE.Mesh(chestBaseGeom, chestBaseMat);
    chestBase.position.y = 0.3;
    chestBase.castShadow = true;
    chestBase.receiveShadow = true;
    chestGroup.add(chestBase);

    // Lid (Upper dome)
    const chestLidGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI);
    chestLidGeom.rotateZ(Math.PI / 2);
    chestLidGeom.translate(0, 0.6, 0); // hinges offset
    const chestLidMat = new THREE.MeshStandardMaterial({
      color: '#4e342e',
      roughness: 0.6,
    });
    const chestLid = new THREE.Mesh(chestLidGeom, chestLidMat);
    chestLid.castShadow = true;
    chestGroup.add(chestLid);

    // Golden lock & borders
    const lockGeom = new THREE.BoxGeometry(0.2, 0.3, 0.1);
    const lockMat = new THREE.MeshStandardMaterial({
      color: '#ffd54f',
      metalness: 0.9,
      roughness: 0.1,
    });
    const lockMesh = new THREE.Mesh(lockGeom, lockMat);
    lockMesh.position.set(0, 0.45, 0.41);
    chestGroup.add(lockMesh);

    // Magical treasure sparkles emitter / glowing spotlight on chest
    const chestLight = new THREE.PointLight('#ffa000', 1.5, 4);
    chestLight.position.set(0, 1.2, 0);
    chestGroup.add(chestLight);

    // Star sparkle particles around chest
    const chestSparksGeo = new THREE.BufferGeometry();
    const sparksCount = 12;
    const sparkPositions = new Float32Array(sparksCount * 3);
    for (let s = 0; s < sparksCount; s++) {
      sparkPositions[s * 3] = (Math.random() - 0.5) * 2;
      sparkPositions[s * 3 + 1] = 0.3 + Math.random() * 1.5;
      sparkPositions[s * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    chestSparksGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparksMat = new THREE.PointsMaterial({
      color: '#ffff8d',
      size: 0.15,
      transparent: true,
      opacity: 0.8,
    });
    const chestSparksPoints = new THREE.Points(chestSparksGeo, sparksMat);
    chestGroup.add(chestSparksPoints);

    scene.add(chestGroup);

    // --- SILVER GLOWING KEY MODEL ---
    let keyMesh: THREE.Group | null = null;
    let keyLight: THREE.PointLight | null = null;

    if (isKeyAvailable && !hasKey) {
      keyMesh = new THREE.Group();
      keyMesh.position.set(level.keyPos.x, level.keyPos.y + 0.3, level.keyPos.z);

      const ringGeo = new THREE.TorusGeometry(0.18, 0.06, 8, 24);
      const metalMat = new THREE.MeshStandardMaterial({
        color: '#e0f7fa',
        metalness: 0.9,
        roughness: 0.1,
      });
      const ring = new THREE.Mesh(ringGeo, metalMat);
      keyMesh.add(ring);

      const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
      shaftGeo.translate(0, -0.25, 0);
      const shaft = new THREE.Mesh(shaftGeo, metalMat);
      keyMesh.add(shaft);

      const toothGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
      toothGeo.translate(0.08, -0.4, 0);
      const tooth = new THREE.Mesh(toothGeo, metalMat);
      keyMesh.add(tooth);

      keyLight = new THREE.PointLight('#4dd0e1', 1.5, 3);
      keyLight.position.set(0, 0, 0);
      keyMesh.add(keyLight);

      scene.add(keyMesh);
    }

    // --- SCENE OBSTACLES IMPLEMENTATION ---
    const obstacleColliders: { type: string; box: THREE.Box3; bouncy?: boolean; dangerous?: boolean; center: THREE.Vector3 }[] = [];

    level.obstacles.forEach((obs) => {
      const obstacleGroup = new THREE.Group();
      obstacleGroup.position.set(obs.pos.x, obs.pos.y, obs.pos.z);

      const scale = obs.size || 1.0;

      if (obs.type === 'tree') {
        // Double/triple stacked round leaves for the cute low-poly shape
        const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.25 * scale, 1.5 * scale, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: '#795548', roughness: 0.85 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = (1.5 * scale) / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        obstacleGroup.add(trunk);

        const leafColor = level.theme === 'forest' ? '#1b5e20' : '#4caf50';
        const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.6 });

        const leaf1Geo = new THREE.SphereGeometry(0.7 * scale, 8, 8);
        const leaf1 = new THREE.Mesh(leaf1Geo, leafMat);
        leaf1.position.set(0, 1.4 * scale, 0);
        leaf1.castShadow = true;
        obstacleGroup.add(leaf1);

        const leaf2Geo = new THREE.SphereGeometry(0.55 * scale, 8, 8);
        const leaf2 = new THREE.Mesh(leaf2Geo, leafMat);
        leaf2.position.set(0, 2.0 * scale, 0);
        leaf2.castShadow = true;
        obstacleGroup.add(leaf2);

        scene.add(obstacleGroup);

        // Add cylinder collider
        const boundingBox = new THREE.Box3().setFromObject(obstacleGroup);
        obstacleColliders.push({
          type: 'tree',
          box: boundingBox,
          center: new THREE.Vector3(obs.pos.x, obs.pos.y, obs.pos.z),
        });
      } else if (obs.type === 'rock') {
        const rockGeo = new THREE.DodecahedronGeometry(0.5 * scale, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: '#90a4ae', roughness: 0.9 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.y = (0.4 * scale);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        obstacleGroup.add(rock);

        scene.add(obstacleGroup);

        const boundingBox = new THREE.Box3().setFromObject(obstacleGroup);
        obstacleColliders.push({
          type: 'rock',
          box: boundingBox,
          center: new THREE.Vector3(obs.pos.x, obs.pos.y, obs.pos.z),
        });
      } else if (obs.type === 'mushroom') {
        // Red mushroom with bouncy properties
        const stemGeo = new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 0.6 * scale, 8);
        const stemMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.8 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = (0.6 * scale) / 2;
        obstacleGroup.add(stem);

        const capGeo = new THREE.SphereGeometry(0.6 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({ color: '#e53935', roughness: 0.4 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.5 * scale;
        cap.castShadow = true;
        obstacleGroup.add(cap);

        // Cute white dots on mushroom cap
        for (let i = 0; i < 6; i++) {
          const dotGeo = new THREE.SphereGeometry(0.08 * scale, 8, 8);
          const dotMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
          const dot = new THREE.Mesh(dotGeo, dotMat);
          const angle = (i * Math.PI * 2) / 6;
          dot.position.set(Math.cos(angle) * 0.45 * scale, 0.75 * scale, Math.sin(angle) * 0.45 * scale);
          obstacleGroup.add(dot);
        }

        scene.add(obstacleGroup);

        const boundingBox = new THREE.Box3().setFromObject(obstacleGroup);
        obstacleColliders.push({
          type: 'mushroom',
          box: boundingBox,
          bouncy: obs.bouncy,
          center: new THREE.Vector3(obs.pos.x, obs.pos.y, obs.pos.z),
        });
      } else if (obs.type === 'cactus') {
        const trunkGeo = new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 1.2 * scale, 8);
        const cactusMat = new THREE.MeshStandardMaterial({ color: '#00897b', roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, cactusMat);
        trunk.position.y = (1.2 * scale) / 2;
        trunk.castShadow = true;
        obstacleGroup.add(trunk);

        // Branch 1
        const branchGeo = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.4 * scale, 8);
        const branch1 = new THREE.Mesh(branchGeo, cactusMat);
        branch1.rotation.z = Math.PI / 2;
        branch1.position.set(0.2 * scale, 0.7 * scale, 0);
        obstacleGroup.add(branch1);

        const branch1Tip = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.3 * scale, 8), cactusMat);
        branch1Tip.position.set(0.4 * scale, 0.85 * scale, 0);
        obstacleGroup.add(branch1Tip);

        scene.add(obstacleGroup);

        const boundingBox = new THREE.Box3().setFromObject(obstacleGroup);
        obstacleColliders.push({
          type: 'cactus',
          box: boundingBox,
          dangerous: obs.dangerous,
          center: new THREE.Vector3(obs.pos.x, obs.pos.y, obs.pos.z),
        });
      } else if (obs.type === 'spike') {
        const spikeBase = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 0.1, 0.8 * scale), new THREE.MeshStandardMaterial({ color: '#37474f' }));
        spikeBase.position.y = 0.05;
        obstacleGroup.add(spikeBase);

        // Array of spiky cones
        const coneGeo = new THREE.ConeGeometry(0.1 * scale, 0.4 * scale, 4);
        const coneMat = new THREE.MeshStandardMaterial({ color: '#f44336', roughness: 0.4, metalness: 0.5 });
        for (let r = -1; r <= 1; r += 2) {
          for (let c = -1; c <= 1; c += 2) {
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.position.set(r * 0.25 * scale, 0.25 * scale, c * 0.25 * scale);
            cone.castShadow = true;
            obstacleGroup.add(cone);
          }
        }

        scene.add(obstacleGroup);

        const boundingBox = new THREE.Box3().setFromObject(obstacleGroup);
        obstacleColliders.push({
          type: 'spike',
          box: boundingBox,
          dangerous: obs.dangerous,
          center: new THREE.Vector3(obs.pos.x, obs.pos.y, obs.pos.z),
        });
      } else if (obs.type === 'lava') {
        // Flat lava surface
        const lavaGeo = new THREE.BoxGeometry(obs.size || 2.0, 0.1, obs.size || 2.0);
        const lavaMat = new THREE.MeshStandardMaterial({
          color: '#ff3d00',
          emissive: '#ff3d00',
          emissiveIntensity: 1.2,
          roughness: 0.2,
        });
        const lava = new THREE.Mesh(lavaGeo, lavaMat);
        lava.position.y = 0.05;
        obstacleGroup.add(lava);

        // Flame glow light
        const fireLight = new THREE.PointLight('#ff3d00', 1.0, 4);
        fireLight.position.set(0, 0.5, 0);
        obstacleGroup.add(fireLight);

        scene.add(obstacleGroup);

        const boundingBox = new THREE.Box3().setFromObject(obstacleGroup);
        obstacleColliders.push({
          type: 'lava',
          box: boundingBox,
          dangerous: obs.dangerous,
          center: new THREE.Vector3(obs.pos.x, obs.pos.y, obs.pos.z),
        });
      }
    });

    // --- MONSTERS MODELS CREATION ---
    const monsterGroups: { id: number; group: THREE.Group; type: string; alive: boolean }[] = [];

    activeMonsters.forEach((mon) => {
      const monsterGroup = new THREE.Group();
      monsterGroup.position.set(mon.currentPos.x, mon.currentPos.y, mon.currentPos.z);

      if (mon.type === 'slime') {
        // Cute green bobbing jelly slime with eyes
        const slimeGeo = new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.7);
        slimeGeo.scale(1.1, 0.8, 1.1);
        const slimeMat = new THREE.MeshStandardMaterial({
          color: '#81c784',
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.9,
        });
        const slimeBody = new THREE.Mesh(slimeGeo, slimeMat);
        slimeBody.castShadow = true;
        monsterGroup.add(slimeBody);

        // Tiny cute angry eyes
        const angryEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
        const evilPupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: '#d32f2f' }));
        angryEye.add(evilPupil);
        evilPupil.position.set(0, 0, 0.05);

        const eyeL = angryEye.clone();
        eyeL.position.set(0.12, 0.1, 0.3);
        monsterGroup.add(eyeL);

        const eyeR = angryEye.clone();
        eyeR.position.set(-0.12, 0.1, 0.3);
        monsterGroup.add(eyeR);
      } else if (mon.type === 'bubu') {
        // Cute spiky round Bubu (angry red/purple sphere)
        const bubuGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const bubuMat = new THREE.MeshStandardMaterial({ color: '#7e57c2', roughness: 0.6 });
        const bubuMesh = new THREE.Mesh(bubuGeo, bubuMat);
        bubuMesh.castShadow = true;
        monsterGroup.add(bubuMesh);

        // Add 6 tiny pointy yellow horns (spikes) indices
        const horn = new THREE.ConeGeometry(0.08, 0.18, 4);
        const hornMat = new THREE.MeshStandardMaterial({ color: '#ffb300' });
        for (let i = 0; i < 6; i++) {
          const mHorn = new THREE.Mesh(horn, hornMat);
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI;
          mHorn.position.set(
            0.4 * Math.sin(v) * Math.cos(u),
            0.4 * Math.sin(v) * Math.sin(u),
            0.4 * Math.cos(v)
          );
          mHorn.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mHorn.position.clone().normalize());
          monsterGroup.add(mHorn);
        }

        // Angry yellow cat eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffeb3b' });
        const catEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
        catEyeL.position.set(0.15, 0.1, 0.35);
        monsterGroup.add(catEyeL);

        const catEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
        catEyeR.position.set(-0.15, 0.1, 0.35);
        monsterGroup.add(catEyeR);
      }

      scene.add(monsterGroup);
      monsterGroups.push({ id: mon.id, group: monsterGroup, type: mon.type, alive: mon.alive });
    });

    // --- MOUSE CLICK/DRAG TO ROTATE CANVAS CAMERA ---
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isMouseDown.current = true;
        prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;

      // Adjust camera rotation angle
      cameraAngleX.current -= deltaX * 0.007;
      cameraAngleY.current = Math.max(0.1, Math.min(1.2, cameraAngleY.current + deltaY * 0.007));

      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isMouseDown.current || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevMousePos.current.x;
      const deltaY = e.touches[0].clientY - prevMousePos.current.y;

      cameraAngleX.current -= deltaX * 0.008;
      cameraAngleY.current = Math.max(0.1, Math.min(1.2, cameraAngleY.current + deltaY * 0.008));

      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    // Attach local dragging element events
    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    domEl.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    domEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    // --- CORE GAME LOOP CONTROL ---
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = Math.min(0.03, clock.getDelta()); // Cap delta to avoid heavy simulation gaps

      // Decrease invincibility cooldown
      if (invincibleCooldown.current > 0) {
        invincibleCooldown.current -= delta;
        // Make body flickers to show invincibility
        bodyMesh.visible = Math.floor(clock.getElapsedTime() * 10) % 2 === 0;
      } else {
        bodyMesh.visible = true;
      }

      // 1. UPDATE PLAYABLE CHARACTER MOTION (KIKO)
      if (gameState === 'PLAYING' && !isFainting.current) {
        // Speed rates
        const moveSpeed = 4.5 * delta;
        const rotateSpeed = 10.0 * delta;

        // Calculate view-related forward/right vector based on camera rotation angle
        const viewForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX.current).normalize();
        const viewRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX.current).normalize();

        const moveDir = new THREE.Vector3(0, 0, 0);

        if (controller.forward) moveDir.add(viewForward);
        if (controller.backward) moveDir.sub(viewForward);
        if (controller.left) moveDir.sub(viewRight);
        if (controller.right) moveDir.add(viewRight);

        // Normalize movement vector to avoid double diagonals
        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();

          // Smoothly rotate character to look at movement direction
          const targetRotation = Math.atan2(moveDir.x, moveDir.z);
          // Simple slerp approximation
          let curRot = kikoGroup.rotation.y;
          let diff = targetRotation - curRot;
          // Normalise to -PI to PI
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          kikoGroup.rotation.y += diff * rotateSpeed;

          // Cute walking foot swing animations
          const swing = Math.sin(clock.getElapsedTime() * 15) * 0.3;
          leftFoot.position.z = swing;
          leftFoot.position.y = -0.45 + Math.max(0, -swing * 0.3);
          rightFoot.position.z = -swing;
          rightFoot.position.y = -0.45 + Math.max(0, swing * 0.3);

          // Bounce body up and down as they run
          bodyMesh.position.y = Math.abs(Math.sin(clock.getElapsedTime() * 15)) * 0.08;
        } else {
          // Standing idle: breathe slowly
          const breath = Math.sin(clock.getElapsedTime() * 3) * 0.02;
          bodyMesh.position.y = breath;
          leftFoot.position.set(0.22, -0.45, 0);
          rightFoot.position.set(-0.22, -0.45, 0);
        }

        // Apply velocities & gravity
        const walkFactor = 1.0;
        kikoVel.current.x = moveDir.x * moveSpeed * walkFactor;
        kikoVel.current.z = moveDir.z * moveSpeed * walkFactor;

        // Jump trigger
        if (controller.jump && !isJumping.current) {
          isJumping.current = true;
          kikoVel.current.y = 12.0 * delta; // Jump impulse
          AudioFX.playJump();
        }

        // Gravity acceleration
        kikoVel.current.y -= 32.0 * delta * delta;

        // Update Kiko Position
        kikoPos.current.x += kikoVel.current.x;
        kikoPos.current.y += kikoVel.current.y;
        kikoPos.current.z += kikoVel.current.z;

        // Collision: Terrain floor bounds
        const defaultFloor = 0.5; // default center of Kiko is at y = 0.5 (radius 0.5 resting on y=0)
        if (kikoPos.current.y <= defaultFloor) {
          kikoPos.current.y = defaultFloor;
          kikoVel.current.y = 0;
          isJumping.current = false;
        }

        // Keep character inside level island margins with rubber-band/wall clamping
        const limitW = gridW / 2 + 0.5;
        const limitD = gridD / 2 + 0.5;
        kikoPos.current.x = Math.max(-limitW, Math.min(limitW, kikoPos.current.x));
        kikoPos.current.z = Math.max(-limitD, Math.min(limitD, kikoPos.current.z));

        // --- COLLISION: SOLID SHADED OBSTACLES & BOUNCY MUSHROOMS ---
        const playerRadius = 0.45;
        const kikoWorldBox = new THREE.Box3(
          new THREE.Vector3(kikoPos.current.x - playerRadius, kikoPos.current.y - playerRadius, kikoPos.current.z - playerRadius),
          new THREE.Vector3(kikoPos.current.x + playerRadius, kikoPos.current.y + playerRadius, kikoPos.current.z + playerRadius)
        );

        obstacleColliders.forEach((collider) => {
          if (kikoWorldBox.intersectsBox(collider.box)) {
            // If bouncy mushroom and Kiko is dropping down from above: bounce!
            if (collider.type === 'mushroom' && collider.bouncy && kikoVel.current.y <= 0 && kikoPos.current.y > collider.center.y + 0.4) {
              kikoVel.current.y = 20.0 * delta; // Massive launch bounce!
              kikoPos.current.y = collider.center.y + 0.9; // push up
              isJumping.current = true;
              AudioFX.playJump();
            } else if (collider.dangerous) {
              // Trigger hazard spike/lava damage periodic tick
              if (invincibleCooldown.current <= 0) {
                const amount = collider.type === 'lava' ? 15 : 10;
                onDamage(amount, collider.type === 'lava' ? 'Lantai Lava Panas' : 'Ranjau Duri Tajam');
                invincibleCooldown.current = 1.0; // 1 second immunity
                // Red flash feedback
                bodyMat.color.set('#b71c1c');
                setTimeout(() => bodyMat.color.set(bodyColor), 200);
              }
            } else {
              // Standard wall physics pushing out: push character back relative to collider center
              const pushVec = new THREE.Vector3(kikoPos.current.x, 0, kikoPos.current.z)
                .sub(new THREE.Vector3(collider.center.x, 0, collider.center.z));
              if (pushVec.length() > 0) {
                pushVec.normalize().multiplyScalar(0.08);
                kikoPos.current.x += pushVec.x;
                kikoPos.current.z += pushVec.z;
              }
            }
          }
        });

        // --- COLLISION: COIN COLLECTING GATHERER ---
        coinMeshes.forEach((mesh, index) => {
          if (mesh.visible) {
            const distance = mesh.position.distanceTo(kikoGroup.position);
            if (distance < 0.72) {
              mesh.visible = false;
              onCoinCollected(index);
            }
          }
        });

        // --- COLLISION: SILVER KEY PICK-UP ---
        if (keyMesh && isKeyAvailable && !hasKey) {
          const keyDist = keyMesh.position.distanceTo(kikoGroup.position);
          if (keyDist < 0.75) {
            setIsKeyAvailable(false);
            onKeyCollected();
          }
        }

        // --- COLLISION: CHEST UNLOCKING FINALE ---
        if (hasKey && !isChestUnlocked) {
          const chestDist = chestBase.getWorldPosition(new THREE.Vector3()).distanceTo(kikoGroup.position);
          if (chestDist < 1.0) {
            setIsChestUnlocked(true);
            // Animate open lid
            let lidRotProgress = 0;
            const openLidAnim = () => {
              if (lidRotProgress < Math.PI * 0.6) {
                lidRotProgress += 0.1;
                chestLid.rotation.x = -lidRotProgress;
                requestAnimationFrame(openLidAnim);
              }
            };
            openLidAnim();
            onChestReached();
          }
        }

        // --- COLLISION: MONSTERS PATROLLING & JUMP STOMB MECHANIC ---
        monsterGroups.forEach((mGroup) => {
          if (!mGroup.alive) return;

          const distanceXYZ = mGroup.group.position.distanceTo(kikoGroup.position);
          if (distanceXYZ < 0.8) {
            // Check if player is falling on top of the monster (Jump Stomp!)
            if (kikoVel.current.y < -0.01 && kikoPos.current.y > mGroup.group.position.y + 0.25) {
              mGroup.alive = false;
              mGroup.group.scale.set(1.2, 0.1, 1.2); // flat flatten squash effect
              // Bounce player high in response!
              kikoVel.current.y = 12.0 * delta;
              kikoPos.current.y += 0.2;
              onMonsterStomped(mGroup.id);

              // Spawn tiny sparkling coins or points
              const blastLight = new THREE.PointLight('#ffea00', 2, 3);
              blastLight.position.copy(mGroup.group.position);
              scene.add(blastLight);
              setTimeout(() => {
                scene.remove(blastLight);
                scene.remove(mGroup.group);
              }, 1000);
            } else {
              // Damage Kiko from side collision
              if (invincibleCooldown.current <= 0) {
                onDamage(20, mGroup.type === 'bubu' ? 'Monster Bubu Berduri' : 'Jelly Slime');
                invincibleCooldown.current = 1.2;

                // Push-back impulse
                const pushDirection = kikoGroup.position.clone().sub(mGroup.group.position).normalize();
                kikoPos.current.x += pushDirection.x * 0.4;
                kikoPos.current.z += pushDirection.z * 0.4;

                // Color flash feedback
                bodyMat.color.set('#e91e63');
                setTimeout(() => bodyMat.color.set(bodyColor), 250);
              }
            }
          }
        });
      }

      // 2. FAINTING / SQUASH DEATH DRAMATIC ANIMATION
      if (isFainting.current) {
        kikoGroup.rotation.z += 0.15;
        kikoGroup.rotation.x += 0.08;
        if (kikoGroup.scale.y > 0.1) {
          kikoGroup.scale.y -= 0.02;
          kikoGroup.scale.x += 0.01;
          kikoGroup.scale.z += 0.01;
        }
      } else {
        kikoGroup.scale.set(1, 1, 1);
        if (gameState === 'PLAYING') {
          kikoGroup.rotation.z = 0;
          kikoGroup.rotation.x = 0;
        }
      }

      // Sync rendered 3D position state
      kikoGroup.position.set(kikoPos.current.x, kikoPos.current.y, kikoPos.current.z);
      playerLight.position.set(kikoPos.current.x, kikoPos.current.y + 0.8, kikoPos.current.z);

      // 3. SPINNING COINS, KEYS & SPARKLE DECORATIVE EFFECTS
      coinMeshes.forEach((mesh) => {
        if (mesh.visible) {
          mesh.rotation.y += 2.0 * delta;
        }
      });

      if (keyMesh && isKeyAvailable) {
        keyMesh.rotation.y += 1.8 * delta;
        // Floating hover effect
        keyMesh.position.y = level.keyPos.y + 0.3 + Math.sin(clock.getElapsedTime() * 4) * 0.12;
      }

      // Rotate chest emitter particles
      chestSparksPoints.rotation.y += 0.3 * delta;

      // 4. ANIMATE ACTIVE MONSTERS INDIVIDUALLY along path
      activeMonsters.forEach((mon) => {
        if (!mon.alive) return;
        const matchingGroup = monsterGroups.find((g) => g.id === mon.id);
        if (matchingGroup && matchingGroup.alive) {
          // Patrol between start and end position based on time speed factor
          mon.t += delta * (mon.speed / 8);
          if (mon.t >= 1) {
            mon.t = 0;
            mon.direction *= -1; // reverse
          }

          const startVec = new THREE.Vector3(mon.startPos.x, mon.startPos.y, mon.startPos.z);
          const endVec = new THREE.Vector3(mon.endPos.x, mon.endPos.y, mon.endPos.z);

          let nextPos = new THREE.Vector3();
          if (mon.direction === 1) {
            nextPos.lerpVectors(startVec, endVec, mon.t);
          } else {
            nextPos.lerpVectors(endVec, startVec, mon.t);
          }

          // Orient monsters to look where they walk
          const dirVec = nextPos.clone().sub(matchingGroup.group.position).normalize();
          if (dirVec.lengthSq() > 0.01) {
            const rotY = Math.atan2(dirVec.x, dirVec.z);
            matchingGroup.group.rotation.y = rotY;
          }

          matchingGroup.group.position.copy(nextPos);

          // Bobbing custom animation per type
          if (mon.type === 'slime') {
            matchingGroup.group.position.y += Math.abs(Math.sin(clock.getElapsedTime() * 8)) * 0.15;
          } else if (mon.type === 'bubu') {
            // Spin rolling texturing
            matchingGroup.group.rotation.x += 4 * delta;
          }
        }
      });

      // 5. THIRD-PERSON CAMERA ORBIT & SMOOTH INTERPOLATING FOLLOW
      // camera angle controls the displacement vector from Kiko
      const radius = 6.8;
      const targetCamX = kikoPos.current.x + radius * Math.sin(cameraAngleX.current) * Math.cos(cameraAngleY.current);
      const targetCamZ = kikoPos.current.z + radius * Math.cos(cameraAngleX.current) * Math.cos(cameraAngleY.current);
      const targetCamY = kikoPos.current.y + radius * Math.sin(cameraAngleY.current) + 0.3;

      // Smooth camera lerp follow
      camera.position.x += (targetCamX - camera.position.x) * 0.12;
      camera.position.y += (targetCamY - camera.position.y) * 0.12;
      camera.position.z += (targetCamZ - camera.position.z) * 0.12;

      // Point camera focus on Kiko's head position
      camera.lookAt(kikoPos.current.x, kikoPos.current.y + 0.2, kikoPos.current.z);

      // Render execution
      renderer.render(scene, camera);

      // Send position up to parent stats
      onUpdateStats({ ...kikoPos.current });
    };

    // Trigger loop start
    animate();

    // Resize observer handling to prevent canvas stretching
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // CLEANUP ACTIONS
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      domEl.removeEventListener('mousedown', handleMouseDown);
      domEl.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domEl.removeEventListener('touchstart', handleTouchStart);
      domEl.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [level, activeCoins, activeMonsters, isKeyAvailable, hasKey]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 3D Rendering container */}
      <div id="canvas-container" ref={containerRef} className="w-full h-full max-h-full cursor-grab active:cursor-grabbing rounded-xl overflow-hidden shadow-inner border border-stone-200/40 bg-radial from-slate-100 to-slate-200" />

      {/* Camera Guidance Prompt overlays on center top */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/85 text-xs text-sky-100 px-3 py-1.5 rounded-full pointer-events-none select-none flex items-center gap-2 backdrop-blur-sm shadow border border-slate-700/50">
        <span className="w-2.5 h-2.5 bg-sky-400 animate-ping rounded-full" />
        <span>Gores / Seret layar untuk memutar kamera 3D ↺</span>
      </div>
    </div>
  );
}
