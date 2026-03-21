import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';
import { preloadSprites } from '@/lib/sprites';
import { updateParticles, drawParticles, addSmokeParticle, addSparkle, addLeafParticle, addFirefly, drawFlag, drawWaterShimmer, drawAtmosphere } from '@/lib/canvasEffects';
import { AnimatedCitizen, Complaint } from '@/lib/simulation';
import { generateTerrain, drawTerrainElement, drawWildernessTile, getWildernessBorder, studentIdToSeed, TerrainElement } from '@/lib/terrainGeneration';

interface IsometricCanvasProps {
  grid: GridTile[][];
  buildings: PlacedBuilding[];
  gridSize: number;
  selectedBuilding: string | null;
  ghostPos: { x: number; y: number } | null;
  canPlaceGhost: boolean;
  productionReady: Set<string>;
  animatedCitizens: AnimatedCitizen[];
  complaints: Complaint[];
  studentId?: string;
  district?: string | null;
  cooldownElements?: Set<number>;
  constructingIds?: Set<string>;
  constructionProgress?: Map<string, number>;
  onTileClick: (gx: number, gy: number) => void;
  onTileHover: (gx: number, gy: number) => void;
  onBuildingClick: (building: PlacedBuilding) => void;
  onTerrainClick?: (element: TerrainElement) => void;
}

const GRASS_COLORS_LIGHT = ['#4e8243', '#528645', '#4a7e3f', '#558a48', '#4c8040'];
const GRASS_COLORS_DARK = ['#3a6a30', '#3e6e34', '#38662e', '#407038', '#3c6c32'];
const ROAD_COLOR = '#a09070';
const ROAD_BORDER = '#7a6a55';
const WALL_COLOR = '#6b6b6b';
const FARM_COLORS = ['#6b8e23', '#7a9e32', '#5a7e13', '#648a1e'];

export const IsometricCanvas = ({
  grid, buildings, gridSize, selectedBuilding, ghostPos, canPlaceGhost,
  productionReady, animatedCitizens, complaints, studentId, district, cooldownElements,
  constructingIds, constructionProgress,
  onTileClick, onTileHover, onBuildingClick, onTerrainClick,
}: IsometricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [camStart, setCamStart] = useState({ x: 0, y: 0 });
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastFrameTime = useRef(0);
  const canvasSize = useRef({ w: 0, h: 0 });

  const fullGrid = useMemo(() => applyBuildingsToGrid(grid, buildings), [grid, buildings]);

  // Generate terrain elements (deterministic based on student id)
  const terrainElements = useMemo(() => {
    const seed = studentId ? studentIdToSeed(studentId) : 12345;
    return generateTerrain({ district, gridSize, seed });
  }, [studentId, district, gridSize]);

  const wildernessBorder = getWildernessBorder();
  const originX = (gridSize * TILE_W) / 2;
  const originY = 50;

  useEffect(() => {
    preloadSprites().then(() => setSpritesLoaded(true));
  }, []);

  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const mx = (clientX - rect.left - w / 2) / zoom - camera.x + originX;
    const my = (clientY - rect.top - h / 2) / zoom - camera.y + originY;
    const gx = Math.floor((mx / (TILE_W / 2) + my / (TILE_H / 2)) / 2);
    const gy = Math.floor((my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2);
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) return { gx, gy };
    return null;
  }, [camera, zoom, gridSize, originX]);

  // Convert screen coords to fractional grid coords (for terrain element detection, supports outside grid)
  const screenToWorldGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const mx = (clientX - rect.left - w / 2) / zoom - camera.x + originX;
    const my = (clientY - rect.top - h / 2) / zoom - camera.y + originY;
    const gx = (mx / (TILE_W / 2) + my / (TILE_H / 2)) / 2;
    const gy = (my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2;
    return { gx, gy };
  }, [camera, zoom, originX]);

  // Find nearest terrain element to world coords
  const findTerrainElement = useCallback((worldGx: number, worldGy: number): TerrainElement | null => {
    let closest: TerrainElement | null = null;
    let closestDist = 1.5; // max click distance in grid units
    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile' || el.type === 'bush') continue;
      const dx = el.gx - worldGx;
      const dy = el.gy - worldGy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = el;
      }
    }
    return closest;
  }, [terrainElements]);

  // Animation loop - capped at ~30fps
  useEffect(() => {
    let running = true;
    const TARGET_FPS = 30;
    const FRAME_MS = 1000 / TARGET_FPS;
    const loop = (timestamp: number) => {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(loop);
      const elapsed = timestamp - lastFrameTime.current;
      if (elapsed < FRAME_MS) return;
      lastFrameTime.current = timestamp - (elapsed % FRAME_MS);
      timeRef.current += elapsed * 0.001;
      render();
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [fullGrid, buildings, camera, zoom, ghostPos, selectedBuilding, canPlaceGhost, gridSize, spritesLoaded, productionReady, animatedCitizens, complaints]);

  // Smoke, leaf and firefly effects
  useEffect(() => {
    const interval = setInterval(() => {
      for (const b of buildings) {
        const def = BUILDING_DEFS[b.defId];
        if (!def) continue;
        if (def.id === 'workshop' || def.id === 'market' || def.id === 'windmill') {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSmokeParticle(sx, sy - 20);
        }
        if (productionReady.has(b.id)) {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSparkle(sx, sy - 15);
        }
      }
      // Occasional leaf particles from trees in terrain
      if (Math.random() < 0.3) {
        const gx = Math.random() * gridSize;
        const gy = Math.random() * gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addLeafParticle(sx, sy - 20);
      }
      // Fireflies at dusk
      if (Math.random() < 0.15) {
        const gx = Math.random() * gridSize;
        const gy = Math.random() * gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addFirefly(sx, sy - 10);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [buildings, productionReady, gridSize]);

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvasSize.current.w !== w || canvasSize.current.h !== h) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvasSize.current = { w, h };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0e200a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(camera.x - originX, camera.y - originY);

    const time = timeRef.current;

    // Pre-compute water tile positions
    const waterTileSet = new Set<string>();
    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile') {
        waterTileSet.add(`${Math.floor(el.gx)},${Math.floor(el.gy)}`);
      }
    }

    // Draw wilderness tiles (outside village grid)
    const wb = wildernessBorder;
    for (let y = -wb; y < gridSize + wb; y++) {
      for (let x = -wb; x < gridSize + wb; x++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) continue;
        if (!waterTileSet.has(`${x},${y}`)) {
          drawWildernessTile(ctx, x, y, TILE_W, TILE_H, gridSize);
        }
      }
    }

    // Draw water terrain elements (tiles) first
    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile') {
        drawTerrainElement(ctx, el, TILE_W, TILE_H, time);
      }
    }

    // Draw village tiles
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = fullGrid[y]?.[x];
        if (!tile) continue;
        const { sx, sy } = gridToIso(x, y, TILE_W, TILE_H);
        drawIsoDiamond(ctx, sx, sy, tile.type, x, y, tile.buildingId, buildings);
      }
    }

    // Draw terrain elements (sorted by depth for proper overlap)
    const sortedTerrain = terrainElements
      .filter(el => el.type !== 'river_tile' && el.type !== 'lake_tile')
      .sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    for (const el of sortedTerrain) {
      drawTerrainElement(ctx, el, TILE_W, TILE_H, time);
    }

    // Draw ghost
    if (ghostPos && selectedBuilding) {
      const def = BUILDING_DEFS[selectedBuilding];
      if (def) {
        for (let dy = 0; dy < def.height; dy++) {
          for (let dx = 0; dx < def.width; dx++) {
            const { sx, sy } = gridToIso(ghostPos.x + dx, ghostPos.y + dy, TILE_W, TILE_H);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = canPlaceGhost ? '#00ff0066' : '#ff000066';
            drawDiamondPath(ctx, sx, sy);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        const { sx, sy } = gridToIso(ghostPos.x, ghostPos.y, TILE_W, TILE_H);
        ctx.globalAlpha = 0.6;
        drawIsoBuilding(ctx, def.id, sx, sy, def.width, def.height, 1, 1, 0);
        ctx.globalAlpha = 1;
      }
    }

    // Draw buildings sorted by depth
    const sorted = [...buildings].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const b of sorted) {
      const def = BUILDING_DEFS[b.defId];
      if (!def) continue;

      const cx = b.x + def.width / 2 - 0.5;
      const cy = b.y + def.height / 2 - 0.5;
      const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);

      if (def.id === 'road' || def.id === 'wall') continue;

      // Enhanced shadow with gradient
      const shadowGrad = ctx.createRadialGradient(sx + 3, sy + 5, 0, sx + 3, sy + 5, 18 * def.width);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(sx + 3, sy + 5, 18 * def.width, 9 * def.height, 0.15, 0, Math.PI * 2);
      ctx.fill();

      const isConstructing = constructingIds?.has(b.id) ?? false;
      const progress = constructionProgress?.get(b.id) ?? (isConstructing ? 0 : 1);

      drawIsoBuilding(ctx, b.defId, sx, sy, def.width, def.height, b.level, progress, time);

      if (!isConstructing) {
        // Flags on towers/monuments
        if (def.id === 'tower' || def.category === 'monument') {
          drawFlag(ctx, sx + 8, sy - 20 - (b.level - 1) * 2, time);
        }

        // Fountain water
        if (def.id === 'fountain' || def.id === 'well') {
          drawWaterShimmer(ctx, sx, sy - 8, 20, time);
        }

        // Farm crop animation
        if (def.id === 'farm') {
          drawFarmCrops(ctx, sx, sy, b.level, time);
        }

        // Hospital cross
        if (def.id === 'hospital') {
          drawCross(ctx, sx, sy - 25, time);
        }

        // Level badge
        if (b.level > 1) {
          ctx.fillStyle = '#f5a623';
          ctx.beginPath();
          ctx.arc(sx + 14, sy - 22 - (b.level - 1) * 2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${b.level}`, sx + 14, sy - 19 - (b.level - 1) * 2);
        }

        // Production ready indicator
        if (productionReady.has(b.id)) {
          const bobY = Math.sin(time * 4) * 3;
          ctx.fillStyle = '#f5a623';
          ctx.beginPath();
          ctx.arc(sx, sy - 30 + bobY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🪙', sx, sy - 27 + bobY);
        }
      }
    }

    // Draw animated citizens
    for (const citizen of animatedCitizens) {
      const { sx, sy } = gridToIso(citizen.x, citizen.y, TILE_W, TILE_H);
      drawCitizen(ctx, sx, sy, citizen, time);
    }

    // Draw particles
    updateParticles();
    drawParticles(ctx);

    ctx.restore();

    // Atmosphere overlay (drawn in screen space)
    drawAtmosphere(ctx, w, h, time);
  }

  function drawCitizen(ctx: CanvasRenderingContext2D, sx: number, sy: number, citizen: AnimatedCitizen, time: number) {
    const bobble = Math.sin(time * 8 + citizen.id) * 1;
    const walkLean = Math.sin(time * 4 + citizen.id * 2) * 0.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 4, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#4a3020';
    const footPhase = Math.sin(time * 8 + citizen.id);
    ctx.beginPath();
    ctx.ellipse(sx - 1.5 + footPhase * 0.5, sy + 0.5, 1.2, 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 1.5 - footPhase * 0.5, sy + 0.5, 1.2, 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body with clothing gradient
    const bodyGrad = ctx.createLinearGradient(sx - 3, sy - 2 + bobble, sx + 3, sy + 3 + bobble);
    bodyGrad.addColorStop(0, citizen.color);
    bodyGrad.addColorStop(1, darkenColor(citizen.color, 0.3));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(sx + walkLean, sy - 3 + bobble, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belt/waist detail
    ctx.strokeStyle = darkenColor(citizen.color, 0.5);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx - 3 + walkLean, sy - 1 + bobble);
    ctx.lineTo(sx + 3 + walkLean, sy - 1 + bobble);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = citizen.color;
    ctx.lineWidth = 1.5;
    const armSwing = Math.sin(time * 6 + citizen.id) * 2;
    ctx.beginPath();
    ctx.moveTo(sx - 3 + walkLean, sy - 4 + bobble);
    ctx.lineTo(sx - 5 + walkLean + armSwing, sy - 1 + bobble);
    ctx.moveTo(sx + 3 + walkLean, sy - 4 + bobble);
    ctx.lineTo(sx + 5 + walkLean - armSwing, sy - 1 + bobble);
    ctx.stroke();

    // Head with skin tone
    const skinTones = ['#f5d0a0', '#e8c090', '#d4a878', '#c49468'];
    const skinIdx = Math.abs(citizen.id) % skinTones.length;
    ctx.fillStyle = skinTones[skinIdx];
    ctx.beginPath();
    ctx.arc(sx + walkLean, sy - 9.5 + bobble, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    const hairColors = ['#3a2010', '#1a1008', '#6a4020', '#8a6030', '#2a1a08'];
    ctx.fillStyle = hairColors[Math.abs(citizen.id * 3) % hairColors.length];
    ctx.beginPath();
    ctx.arc(sx + walkLean, sy - 10.5 + bobble, 3, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(sx + walkLean - 1, sy - 9.5 + bobble, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + walkLean + 1, sy - 9.5 + bobble, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Complaint bubble (improved)
    if (citizen.complaint && citizen.complaintTimer > 0) {
      const alpha = Math.min(1, citizen.complaintTimer / 30);
      ctx.globalAlpha = alpha;
      // Bubble with pointer
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(sx - 20, sy - 28 + bobble, 40, 15, 5);
      ctx.fill();
      // Pointer triangle
      ctx.beginPath();
      ctx.moveTo(sx - 2, sy - 13 + bobble);
      ctx.lineTo(sx + 2, sy - 13 + bobble);
      ctx.lineTo(sx, sy - 11 + bobble);
      ctx.closePath();
      ctx.fill();
      // Shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(sx - 20, sy - 28 + bobble, 40, 15, 5);
      ctx.stroke();
      // Text
      ctx.fillStyle = '#333';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(citizen.complaint, sx, sy - 18 + bobble);
      ctx.globalAlpha = 1;
    }
  }

  // Utility to darken a hex color
  function darkenColor(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, Math.floor(r * (1 - amount)))}, ${Math.max(0, Math.floor(g * (1 - amount)))}, ${Math.max(0, Math.floor(b * (1 - amount)))})`;
  }

  function drawFarmCrops(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number, time: number) {
    // Draw little crop rows
    const cropColors = ['#228B22', '#32CD32', '#6B8E23', '#9ACD32'];
    for (let i = 0; i < 3 + level; i++) {
      const ox = (i - 2) * 6;
      const oy = (i % 2) * 3 - 2;
      const sway = Math.sin(time * 2 + i) * 1;
      ctx.fillStyle = cropColors[i % cropColors.length];
      ctx.beginPath();
      ctx.ellipse(sx + ox + sway, sy + oy - 3, 2, 3 + level * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCross(ctx: CanvasRenderingContext2D, sx: number, sy: number, time: number) {
    const pulse = Math.sin(time * 2) * 0.1 + 0.9;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(sx - 1.5, sy - 5, 3, 10);
    ctx.fillRect(sx - 5, sy - 1.5, 10, 3);
    ctx.globalAlpha = 1;
  }

  // ========== ISOMETRIC 3D BUILDING RENDERER ==========
  // All buildings are drawn procedurally with proper isometric perspective:
  // Each building has a top face, left face (NW), and right face (NE)
  // progress: 0=foundation, 0.33=walls, 0.66=roof, 1=complete

  function isoLeft(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - w / 2, sy + h / 4);
    ctx.lineTo(sx - w / 2, sy + h / 4 - wallH);
    ctx.lineTo(sx, sy - wallH);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function isoRight(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + w / 2, sy + h / 4);
    ctx.lineTo(sx + w / 2, sy + h / 4 - wallH);
    ctx.lineTo(sx, sy - wallH);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function isoTop(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH);
    ctx.lineTo(sx + w / 2, sy - wallH + h / 4);
    ctx.lineTo(sx, sy - wallH + h / 2);
    ctx.lineTo(sx - w / 2, sy - wallH + h / 4);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function isoEdges(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.8;
    // vertical edges
    ctx.beginPath();
    ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - wallH);
    ctx.moveTo(sx - w/2, sy + h/4); ctx.lineTo(sx - w/2, sy + h/4 - wallH);
    ctx.moveTo(sx + w/2, sy + h/4); ctx.lineTo(sx + w/2, sy + h/4 - wallH);
    // top diamond
    ctx.moveTo(sx, sy - wallH);
    ctx.lineTo(sx + w/2, sy - wallH + h/4);
    ctx.lineTo(sx, sy - wallH + h/2);
    ctx.lineTo(sx - w/2, sy - wallH + h/4);
    ctx.closePath();
    ctx.stroke();
  }

  function drawIsoBuilding(ctx: CanvasRenderingContext2D, defId: string, sx: number, sy: number, bw: number, bh: number, level: number, progress: number, time: number) {
    const tw = TILE_W * bw;
    const th = TILE_H * bh;
    // Base sizes for the isometric box
    const baseH = (14 + level * 4) * Math.min(progress / 0.33, 1);
    const fullWallH = 14 + level * 4;

    // Phase 0→0.33: foundation (flat platform rising)
    // Phase 0.33→0.66: walls rising
    // Phase 0.66→1: roof / details appearing

    const wallPhase = Math.min(Math.max((progress - 0.33) / 0.33, 0), 1);
    const roofPhase = Math.min(Math.max((progress - 0.66) / 0.34, 0), 1);

    if (progress < 0.01) {
      // Just foundation outline
      ctx.strokeStyle = '#c8963c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, sy - 2);
      ctx.lineTo(sx + tw/2, sy - 2 + th/4);
      ctx.lineTo(sx, sy - 2 + th/2);
      ctx.lineTo(sx - tw/2, sy - 2 + th/4);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    // Helper: draw a window
    const drawWindow = (wx: number, wy: number) => {
      ctx.fillStyle = 'rgba(180,220,255,0.8)';
      ctx.fillRect(wx, wy, 4, 4);
      ctx.strokeStyle = 'rgba(80,60,40,0.8)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(wx, wy, 4, 4);
      ctx.beginPath();
      ctx.moveTo(wx + 2, wy); ctx.lineTo(wx + 2, wy + 4);
      ctx.moveTo(wx, wy + 2); ctx.lineTo(wx + 4, wy + 2);
      ctx.stroke();
    };

    const def = BUILDING_DEFS[defId];
    if (!def) return;

    switch (defId) {
      // ---- HOUSE / PALHOÇA ----
      case 'house': {
        const wH = Math.round(fullWallH * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        // Foundation
        ctx.fillStyle = '#c4a882'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        // Walls
        isoLeft(ctx, sx, sy, tw, th, wH, '#d4b896');
        isoRight(ctx, sx, sy, tw, th, wH, '#c0a07a');
        if (wallPhase > 0) {
          // Wooden beam details on left face
          ctx.strokeStyle = 'rgba(100,70,40,0.4)'; ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(sx - 2, sy - wH * 0.4); ctx.lineTo(sx - tw/2, sy + th/4 - wH * 0.4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx - 2, sy - wH * 0.7); ctx.lineTo(sx - tw/2, sy + th/4 - wH * 0.7); ctx.stroke();
          // Window
          if (roofPhase > 0.3) drawWindow(sx - tw/4 - 2, sy - wH * 0.65);
        }
        // Roof (thatched gable)
        if (roofPhase > 0) {
          const rH = 12 * roofPhase;
          ctx.beginPath(); ctx.moveTo(sx, sy - wH - rH); ctx.lineTo(sx + tw/2, sy - wH + th/4); ctx.lineTo(sx, sy - wH + th/2); ctx.lineTo(sx - tw/2, sy - wH + th/4); ctx.closePath();
          ctx.fillStyle = '#8b6914'; ctx.fill();
          // Thatch texture
          ctx.strokeStyle = 'rgba(100,80,20,0.4)'; ctx.lineWidth = 0.6;
          for (let i = 0; i < 4; i++) {
            const t = (i + 1) / 5;
            ctx.beginPath();
            ctx.moveTo(sx - tw/2 * t, sy - wH + th/4 * t);
            ctx.lineTo(sx + tw/2 * t, sy - wH + th/4 * t);
            ctx.stroke();
          }
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- MANSION / CABANA GRANDE ----
      case 'mansion': {
        const wH = Math.round(fullWallH * 1.6 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#d8c090');
        isoRight(ctx, sx, sy, tw, th, wH, '#c4a878');
        if (wallPhase > 0) {
          // Stone border detail
          ctx.strokeStyle = 'rgba(120,90,50,0.5)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - tw/2, sy + th/4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + tw/2, sy + th/4); ctx.stroke();
          if (roofPhase > 0.2) { drawWindow(sx - tw/4, sy - wH * 0.6); drawWindow(sx + tw/4 - 4, sy - wH * 0.6 + th/8); }
        }
        if (roofPhase > 0) {
          const rH = 16 * roofPhase;
          isoTop(ctx, sx, sy, tw, th, wH + rH, '#7a5a20');
          ctx.beginPath(); ctx.moveTo(sx, sy - wH - rH); ctx.lineTo(sx + tw/2, sy - wH + th/4); ctx.closePath();
          ctx.strokeStyle = '#5a4010'; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, sy - wH - rH); ctx.lineTo(sx - tw/2, sy - wH + th/4); ctx.closePath(); ctx.stroke();
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- TOWER / ATALAIA ----
      case 'tower': {
        const tW = tw * 0.55; const tH = th * 0.55;
        const wH = Math.round((fullWallH * 2.5) * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tW/2, sy + 2 + tH/4); ctx.lineTo(sx, sy + 2 + tH/2); ctx.lineTo(sx - tW/2, sy + 2 + tH/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tW, tH, wH, '#909090');
        isoRight(ctx, sx, sy, tW, tH, wH, '#787878');
        if (wallPhase > 0) {
          // Stone block pattern
          ctx.strokeStyle = 'rgba(60,60,60,0.4)'; ctx.lineWidth = 0.6;
          for (let j = 0; j < 4; j++) {
            const rowY = sy - wH * ((j + 1) / 5);
            ctx.beginPath(); ctx.moveTo(sx, rowY); ctx.lineTo(sx - tW/2, rowY + tH/4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sx, rowY); ctx.lineTo(sx + tW/2, rowY + tH/4); ctx.stroke();
          }
          if (roofPhase > 0.2) drawWindow(sx - tW/4 - 1, sy - wH * 0.5);
        }
        if (roofPhase > 0) {
          // Battlements
          isoTop(ctx, sx, sy, tW, tH, wH, '#a0a0a0');
          const mH = 5 * roofPhase;
          for (let i = -1; i <= 1; i++) {
            const mx = sx + i * tW / 4;
            const my = sy - wH;
            ctx.fillStyle = '#888'; ctx.fillRect(mx - 2, my - mH, 4, mH);
          }
        }
        isoEdges(ctx, sx, sy, tW, tH, wH);
        break;
      }

      // ---- WORKSHOP / BANCADA ----
      case 'workshop': {
        const wH = Math.round(fullWallH * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#9a7a50'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#c8a870');
        isoRight(ctx, sx, sy, tw, th, wH, '#b09060');
        if (wallPhase > 0) {
          // Work bench on right face
          ctx.fillStyle = '#8a6030'; ctx.fillRect(sx + 2, sy - wH * 0.4, tw/4, 3);
        }
        if (roofPhase > 0) {
          const rH = 8 * roofPhase;
          isoTop(ctx, sx, sy, tw, th, wH, '#6a4a20');
          // Chimney
          ctx.fillStyle = '#5a3a18'; ctx.fillRect(sx + 3, sy - wH - rH - 4, 4, 5 * roofPhase);
          ctx.fillStyle = '#333'; ctx.fillRect(sx + 3, sy - wH - rH - 5, 4, 2 * roofPhase);
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- MARKET / BANCA ----
      case 'market': {
        const wH = Math.round(fullWallH * 0.9 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#a08050'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#d0a060');
        isoRight(ctx, sx, sy, tw, th, wH, '#bc8e50');
        if (roofPhase > 0) {
          // Awning / canopy
          const aAlpha = roofPhase;
          ctx.globalAlpha = aAlpha;
          isoTop(ctx, sx, sy + 2, tw * 1.1, th * 1.1, wH + 4, '#c04040');
          // Stripes
          ctx.strokeStyle = '#e06060'; ctx.lineWidth = 1;
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(sx + i * tw/6, sy - wH + 2);
            ctx.lineTo(sx + i * tw/6 + tw/4, sy - wH + 2 + th/4);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- BARRACKS / ACAMPAMENTO ----
      case 'barracks': {
        const wH = Math.round(fullWallH * 1.3 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#707050'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#90906a');
        isoRight(ctx, sx, sy, tw, th, wH, '#787856');
        if (wallPhase > 0) {
          ctx.strokeStyle = 'rgba(60,60,40,0.5)'; ctx.lineWidth = 0.7;
          for (let j = 1; j <= 3; j++) ctx.strokeRect(sx - tw/4 - 2, sy - wH * (j/4) - 3, 6, 5);
        }
        if (roofPhase > 0) {
          isoTop(ctx, sx, sy, tw, th, wH, '#606040');
          // Flag pole
          ctx.strokeStyle = '#4a4a20'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx, sy - wH); ctx.lineTo(sx, sy - wH - 10 * roofPhase); ctx.stroke();
          ctx.fillStyle = '#c04040'; ctx.beginPath(); ctx.moveTo(sx, sy - wH - 10 * roofPhase); ctx.lineTo(sx + 7, sy - wH - 7 * roofPhase); ctx.lineTo(sx, sy - wH - 4 * roofPhase); ctx.fill();
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- FARM / CANTEIRO ----
      case 'farm': {
        const wH = 4 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1);
        // Low soil mounds
        ctx.fillStyle = '#6a4a20';
        ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (roofPhase > 0) {
          // Soil rows
          ctx.strokeStyle = '#4a3010'; ctx.lineWidth = 1;
          for (let row = 1; row <= 3; row++) {
            const ry = sy + th/2 * (row / 4);
            ctx.beginPath(); ctx.moveTo(sx - tw/3, ry); ctx.lineTo(sx + tw/3, ry + th/8); ctx.stroke();
          }
          // Crop sprouts
          ctx.fillStyle = '#2d8020';
          for (let i = 0; i < 4; i++) {
            const cx2 = sx - tw/3 + i * (tw * 0.22);
            const cy2 = sy + th/4 * 0.6 + i * (th/4 * 0.2);
            ctx.beginPath(); ctx.arc(cx2, cy2 - wH - 2 * roofPhase, 2.5 * roofPhase, 0, Math.PI * 2); ctx.fill();
          }
        }
        break;
      }

      // ---- HOSPITAL / CURANDEIRO ----
      case 'hospital': {
        const wH = Math.round(fullWallH * 1.2 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#c0c0b0'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#e0e0d0');
        isoRight(ctx, sx, sy, tw, th, wH, '#c8c8b8');
        if (roofPhase > 0) {
          isoTop(ctx, sx, sy, tw, th, wH, '#d0d0c0');
          // Red cross on top
          const ca = roofPhase;
          ctx.globalAlpha = ca;
          ctx.fillStyle = '#cc2222'; ctx.fillRect(sx - 2, sy - wH - 6, 4, 8); ctx.fillRect(sx - 5, sy - wH - 3, 10, 3);
          ctx.globalAlpha = 1;
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- SCHOOL / MESTRE-ESCOLA ----
      case 'school_building': {
        const wH = Math.round(fullWallH * 1.1 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#c8b878'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#e8d898');
        isoRight(ctx, sx, sy, tw, th, wH, '#d4c484');
        if (wallPhase > 0) { if (roofPhase > 0.2) { drawWindow(sx - tw/4, sy - wH * 0.6); drawWindow(sx + tw/4 - 4, sy - wH * 0.6 + th/8); } }
        if (roofPhase > 0) {
          const rH = 14 * roofPhase;
          // Gabled roof
          ctx.beginPath(); ctx.moveTo(sx, sy - wH - rH); ctx.lineTo(sx + tw/2, sy - wH + th/4); ctx.lineTo(sx, sy - wH + th/2); ctx.lineTo(sx - tw/2, sy - wH + th/4); ctx.closePath();
          ctx.fillStyle = '#b84040'; ctx.fill();
          ctx.strokeStyle = '#8a2020'; ctx.lineWidth = 0.7; ctx.stroke();
          // Bell tower
          ctx.fillStyle = '#d0a030'; ctx.fillRect(sx - 3, sy - wH - rH - 5 * roofPhase, 6, 5 * roofPhase);
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- CHURCH / ALTAR ----
      case 'church': {
        const wH = Math.round(fullWallH * 1.4 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#d0c8b8'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#ece4d4');
        isoRight(ctx, sx, sy, tw, th, wH, '#d8d0c0');
        if (roofPhase > 0) {
          const rH = 20 * roofPhase;
          isoTop(ctx, sx, sy, tw, th, wH, '#d8d0c0');
          // Spire
          ctx.fillStyle = '#a89060'; ctx.beginPath(); ctx.moveTo(sx, sy - wH - rH); ctx.lineTo(sx - 5, sy - wH); ctx.lineTo(sx + 5, sy - wH); ctx.closePath(); ctx.fill();
          // Cross
          ctx.strokeStyle = '#c0a040'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(sx, sy - wH - rH - 5); ctx.lineTo(sx, sy - wH - rH + 4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx - 3, sy - wH - rH); ctx.lineTo(sx + 3, sy - wH - rH); ctx.stroke();
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      // ---- WELL / POÇA ----
      case 'well': {
        const wH = Math.round(10 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        // Stone base
        ctx.fillStyle = '#b0b0a0'; ctx.beginPath(); ctx.moveTo(sx, sy + 1); ctx.lineTo(sx + tw/2, sy + 1 + th/4); ctx.lineTo(sx, sy + 1 + th/2); ctx.lineTo(sx - tw/2, sy + 1 + th/4); ctx.closePath(); ctx.fill();
        if (wH > 1) {
          isoLeft(ctx, sx, sy, tw * 0.7, th * 0.7, wH, '#c0c0b0');
          isoRight(ctx, sx, sy, tw * 0.7, th * 0.7, wH, '#a8a898');
          isoTop(ctx, sx, sy, tw * 0.7, th * 0.7, wH, '#d0d0c0');
          if (roofPhase > 0) {
            // Roof beams
            ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(sx - 6, sy - wH - 2); ctx.lineTo(sx, sy - wH - 8 * roofPhase); ctx.lineTo(sx + 6, sy - wH - 2); ctx.stroke();
            // Bucket
            ctx.fillStyle = '#8a6030'; ctx.fillRect(sx - 2, sy - wH - 4 * roofPhase, 4, 4);
          }
        }
        break;
      }

      // ---- FOUNTAIN / PEDRA ----
      case 'fountain': {
        const wH = Math.round(8 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#c0b8a8'; ctx.beginPath(); ctx.arc(sx, sy - wH/2, tw/3, 0, Math.PI * 2); ctx.fill();
        if (wH > 2 && roofPhase > 0) {
          // Basin rim
          ctx.strokeStyle = '#a0988a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.ellipse(sx, sy - wH, tw/2.5, th/4, 0, 0, Math.PI * 2); ctx.stroke();
          // Water centre
          ctx.fillStyle = '#80b4d0';
          ctx.beginPath(); ctx.ellipse(sx, sy - wH + 1, tw/5, th/7, 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }

      // ---- WINDMILL / MÓ ----
      case 'windmill': {
        const wH = Math.round(fullWallH * 2 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#b8b0a0'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2*0.6, sy + 2 + th/4*0.6); ctx.lineTo(sx, sy + 2 + th/2*0.6); ctx.lineTo(sx - tw/2*0.6, sy + 2 + th/4*0.6); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw * 0.6, th * 0.6, wH, '#d0c8b8');
        isoRight(ctx, sx, sy, tw * 0.6, th * 0.6, wH, '#b8b0a0');
        if (roofPhase > 0) {
          isoTop(ctx, sx, sy, tw * 0.6, th * 0.6, wH, '#c8b898');
          // Sails
          const sa = time * 1.2;
          ctx.strokeStyle = '#8a6030'; ctx.lineWidth = 1.5;
          for (let i = 0; i < 4; i++) {
            const angle = sa + (i * Math.PI / 2);
            const len = 12 * roofPhase;
            ctx.beginPath(); ctx.moveTo(sx, sy - wH - 2); ctx.lineTo(sx + Math.cos(angle) * len, sy - wH - 2 + Math.sin(angle) * len * 0.5); ctx.stroke();
            // Sail canvas
            ctx.fillStyle = 'rgba(220,200,160,0.7)';
            ctx.beginPath();
            ctx.moveTo(sx, sy - wH - 2);
            ctx.lineTo(sx + Math.cos(angle) * len, sy - wH - 2 + Math.sin(angle) * len * 0.5);
            ctx.lineTo(sx + Math.cos(angle + 0.4) * len * 0.8, sy - wH - 2 + Math.sin(angle + 0.4) * len * 0.4);
            ctx.closePath(); ctx.fill();
          }
        }
        isoEdges(ctx, sx, sy, tw * 0.6, th * 0.6, wH);
        break;
      }

      // ---- WALL / PALIÇADA ----
      case 'wall': {
        const wH = Math.round(8 * level * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#8a7050';
        ctx.beginPath(); ctx.moveTo(sx, sy + 1); ctx.lineTo(sx + tw/2, sy + 1 + th/4); ctx.lineTo(sx, sy + 1 + th/2); ctx.lineTo(sx - tw/2, sy + 1 + th/4); ctx.closePath(); ctx.fill();
        if (wH > 1) {
          // Wooden stakes
          for (let i = -2; i <= 2; i++) {
            const px = sx + i * tw / 5;
            const py = sy + th / 4 * (i * 0.1);
            ctx.fillStyle = '#7a5a30';
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 2, py - wH); ctx.lineTo(px + 2, py - wH); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
        break;
      }

      // ---- ROAD / CAMINHO ----
      case 'road': {
        // Road is drawn as a tile, no 3D building needed
        break;
      }

      // ---- MONUMENTS (tower-like with distinctive forms) ----
      case 'torre_belem': {
        const wH = Math.round(fullWallH * 3 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#d4c898'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw * 0.8, th * 0.8, wH, '#e8dcb0');
        isoRight(ctx, sx, sy, tw * 0.8, th * 0.8, wH, '#d0c898');
        // Gothic arches on walls
        if (wallPhase > 0.5) {
          ctx.strokeStyle = 'rgba(160,140,80,0.7)'; ctx.lineWidth = 0.8;
          for (let i = -1; i <= 1; i++) {
            const ax = sx + i * tw / 5;
            ctx.beginPath(); ctx.arc(ax - tw*0.2, sy - wH * 0.5, wH * 0.18, Math.PI, 0); ctx.stroke();
          }
        }
        if (roofPhase > 0) {
          isoTop(ctx, sx, sy, tw * 0.8, th * 0.8, wH, '#d8cc90');
          // Turrets
          for (let i = -1; i <= 1; i += 2) {
            const tx2 = sx + i * tw / 5;
            isoLeft(ctx, tx2, sy, tw * 0.2, th * 0.2, wH * 0.3 * roofPhase, '#e0d4a0');
            isoTop(ctx, tx2, sy, tw * 0.2, th * 0.2, wH * 0.3 * roofPhase, '#c8bc80');
          }
        }
        isoEdges(ctx, sx, sy, tw * 0.8, th * 0.8, wH);
        break;
      }

      case 'castelo_guimaraes':
      case 'castelo_braganca':
      case 'castelo_beja':
      case 'castelo_leiria':
      case 'castelo_marvao':
      case 'castelo_almourol':
      case 'castelo_palmela': {
        const wH = Math.round(fullWallH * 2.8 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#9a8870'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#b0a090');
        isoRight(ctx, sx, sy, tw, th, wH, '#9c8c7c');
        if (roofPhase > 0) {
          isoTop(ctx, sx, sy, tw, th, wH, '#a89880');
          // Battlements on top
          for (let i = -2; i <= 2; i++) {
            const mx = sx + i * tw / 5;
            ctx.fillStyle = '#908070'; ctx.fillRect(mx - 2, sy - wH - 5 * roofPhase, 4, 5 * roofPhase);
          }
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      case 'universidade_coimbra': {
        const wH = Math.round(fullWallH * 2.2 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#c8b850'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, '#e8d870');
        isoRight(ctx, sx, sy, tw, th, wH, '#d0c060');
        if (roofPhase > 0) {
          isoTop(ctx, sx, sy, tw, th, wH, '#d8c860');
          // Clock tower
          ctx.fillStyle = '#b89840'; ctx.fillRect(sx - 4, sy - wH - 16 * roofPhase, 8, 16 * roofPhase);
          isoTop(ctx, sx, sy - wH * 0.01, tw * 0.15, th * 0.15, (wH + 16) * roofPhase, '#c0a830');
          // Clock face
          if (roofPhase > 0.6) {
            ctx.fillStyle = '#f0f0d0'; ctx.beginPath(); ctx.arc(sx, sy - wH - 8 * roofPhase, 3, 0, Math.PI * 2); ctx.fill();
          }
        }
        isoEdges(ctx, sx, sy, tw, th, wH);
        break;
      }

      case 'templo_romano': {
        const wH = Math.round(fullWallH * 2 * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        // Columns
        for (let i = -2; i <= 2; i++) {
          const cx2 = sx + i * tw / 5;
          isoLeft(ctx, cx2, sy + th/4 * (i * 0.1), tw * 0.1, th * 0.1, wH * 0.9, '#e8e0d0');
          isoTop(ctx, cx2, sy + th/4 * (i * 0.1), tw * 0.1, th * 0.1, wH * 0.9, '#d0c8b8');
        }
        if (roofPhase > 0) {
          // Pediment
          ctx.beginPath(); ctx.moveTo(sx, sy - wH - 12 * roofPhase); ctx.lineTo(sx + tw/2, sy - wH); ctx.lineTo(sx - tw/2, sy - wH + th/4); ctx.closePath();
          ctx.fillStyle = '#ccc4b0'; ctx.fill();
          ctx.strokeStyle = '#aaa098'; ctx.lineWidth = 0.8; ctx.stroke();
        }
        break;
      }

      // ---- DEFAULT (for any other building type) ----
      default: {
        const wH = Math.round(fullWallH * Math.min((progress < 0.33 ? progress / 0.33 : 1), 1));
        // Generic colored box
        const colors = ['#c8a870', '#a8c870', '#70a8c8', '#c870a8', '#70c8a8'];
        const ci = Math.abs(defId.charCodeAt(0) + defId.charCodeAt(1)) % colors.length;
        ctx.fillStyle = '#8a7850'; ctx.beginPath(); ctx.moveTo(sx, sy + 2); ctx.lineTo(sx + tw/2, sy + 2 + th/4); ctx.lineTo(sx, sy + 2 + th/2); ctx.lineTo(sx - tw/2, sy + 2 + th/4); ctx.closePath(); ctx.fill();
        if (wH < 2) { drawConstructionDust(ctx, sx, sy, tw, time); return; }
        isoLeft(ctx, sx, sy, tw, th, wH, colors[ci]);
        isoRight(ctx, sx, sy, tw, th, wH, colors[(ci + 1) % colors.length]);
        if (roofPhase > 0) isoTop(ctx, sx, sy, tw, th, wH, colors[(ci + 2) % colors.length]);
        isoEdges(ctx, sx, sy, tw, th, wH);
        // Emoji label for unrecognised types
        if (roofPhase > 0.5) {
          const def2 = BUILDING_DEFS[defId];
          if (def2) { ctx.font = `${10 + bw * 4}px serif`; ctx.textAlign = 'center'; ctx.fillText(def2.emoji, sx, sy - wH - 4); }
        }
        break;
      }
    }

    // Construction progress bar overlay
    if (progress < 1) {
      const barW = tw * 0.6;
      const barX = sx - barW / 2;
      const barY = sy - (fullWallH * 1.2) - 14;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(barX - 1, barY - 1, barW + 2, 8, 3); ctx.fill();
      ctx.fillStyle = '#f0a020';
      ctx.beginPath(); ctx.roundRect(barX, barY, barW * progress, 6, 2); ctx.fill();
      // Construction worker emoji bouncing
      const bounce = Math.sin(time * 5) * 1.5;
      ctx.font = '10px serif'; ctx.textAlign = 'center';
      ctx.fillText('🪖', sx, barY - 4 + bounce);
    }
  }

  function drawConstructionDust(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, time: number) {
    ctx.strokeStyle = '#c8963c'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, sy - 2); ctx.lineTo(sx + tw/2, sy - 2 + TILE_H/4); ctx.lineTo(sx, sy - 2 + TILE_H/2); ctx.lineTo(sx - tw/2, sy - 2 + TILE_H/4); ctx.closePath();
    ctx.stroke(); ctx.setLineDash([]);
    // Dust puffs
    const puff = Math.abs(Math.sin(time * 4));
    ctx.fillStyle = `rgba(200,180,120,${puff * 0.4})`;
    ctx.beginPath(); ctx.arc(sx, sy - 5, 6 * puff, 0, Math.PI * 2); ctx.fill();
  }

  function drawIsoDiamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, type: string, x: number, y: number, buildingId: string | undefined, allBuildings: PlacedBuilding[]) {
    drawDiamondPath(ctx, sx, sy);

    if (type === 'road') {
      // Road with worn texture gradient
      const roadGrad = ctx.createLinearGradient(sx - TILE_W / 4, sy - TILE_H / 4, sx + TILE_W / 4, sy + TILE_H / 4);
      roadGrad.addColorStop(0, '#b0a080');
      roadGrad.addColorStop(0.5, ROAD_COLOR);
      roadGrad.addColorStop(1, '#8a7a60');
      ctx.fillStyle = roadGrad;
      ctx.fill();
      // Wear marks
      ctx.strokeStyle = ROAD_BORDER;
      ctx.lineWidth = 0.4;
      ctx.stroke();
      // Center line
      ctx.strokeStyle = 'rgba(140, 120, 90, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy);
      ctx.lineTo(sx + 5, sy);
      ctx.stroke();
    } else if (type === 'wall') {
      ctx.fillStyle = WALL_COLOR;
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else {
      // Grass tile with gradient for 3D depth
      let isFarm = false;
      if (buildingId) {
        const b = allBuildings.find(b => b.id === buildingId);
        if (b && b.defId === 'farm') isFarm = true;
      }

      if (isFarm) {
        const farmGrad = ctx.createLinearGradient(sx - TILE_W / 4, sy - TILE_H / 2, sx + TILE_W / 4, sy + TILE_H / 2);
        farmGrad.addColorStop(0, FARM_COLORS[(x + y) % FARM_COLORS.length]);
        farmGrad.addColorStop(1, FARM_COLORS[(x + y + 1) % FARM_COLORS.length]);
        ctx.fillStyle = farmGrad;
      } else {
        const idx = (x + y * 3) % GRASS_COLORS_LIGHT.length;
        const grad = ctx.createLinearGradient(sx - TILE_W / 4, sy - TILE_H / 2, sx + TILE_W / 4, sy + TILE_H / 2);
        grad.addColorStop(0, GRASS_COLORS_LIGHT[idx]);
        grad.addColorStop(1, GRASS_COLORS_DARK[idx]);
        ctx.fillStyle = grad;
      }
      ctx.fill();
      ctx.strokeStyle = '#3a6030';
      ctx.lineWidth = 0.3;
      ctx.stroke();

      // Grass detail on some tiles
      if (!isFarm && !buildingId && (x * 7 + y * 11) % 5 === 0) {
        ctx.strokeStyle = 'rgba(100, 160, 80, 0.2)';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy + 1);
        ctx.lineTo(sx - 1, sy - 2);
        ctx.moveTo(sx + 1, sy + 2);
        ctx.lineTo(sx + 3, sy - 1);
        ctx.stroke();
      }
    }
  }


  function drawDiamondPath(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - TILE_H / 2);
    ctx.lineTo(sx + TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx - TILE_W / 2, sy);
    ctx.closePath();
  }

  // Mouse/touch handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCamStart({ ...camera });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setCamera({ x: camStart.x + (e.clientX - dragStart.x) / zoom, y: camStart.y + (e.clientY - dragStart.y) / zoom });
    } else {
      const pos = screenToGrid(e.clientX, e.clientY);
      if (pos) onTileHover(pos.gx, pos.gy);
    }
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragging) {
      const dist = Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y);
      if (dist < 5) {
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos) {
          const tile = fullGrid[pos.gy]?.[pos.gx];
          if (tile?.buildingId && !selectedBuilding) {
            const b = buildings.find(b => b.id === tile.buildingId);
            if (b) { onBuildingClick(b); setDragging(false); return; }
          }
          onTileClick(pos.gx, pos.gy);
        } else if (onTerrainClick) {
          // Clicked outside village grid — check for terrain elements
          const worldPos = screenToWorldGrid(e.clientX, e.clientY);
          if (worldPos) {
            const el = findTerrainElement(worldPos.gx, worldPos.gy);
            if (el) onTerrainClick(el);
          }
        }
      }
    }
    setDragging(false);
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setCamStart({ ...camera });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging && e.touches.length === 1) {
      setCamera({ x: camStart.x + (e.touches[0].clientX - dragStart.x) / zoom, y: camStart.y + (e.touches[0].clientY - dragStart.y) / zoom });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragging && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      if (Math.abs(t.clientX - dragStart.x) + Math.abs(t.clientY - dragStart.y) < 10) {
        const pos = screenToGrid(t.clientX, t.clientY);
        if (pos) {
          onTileClick(pos.gx, pos.gy);
        } else if (onTerrainClick) {
          const worldPos = screenToWorldGrid(t.clientX, t.clientY);
          if (worldPos) {
            const el = findTerrainElement(worldPos.gx, worldPos.gy);
            if (el) onTerrainClick(el);
          }
        }
      }
    }
    setDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDragging(false)}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};
