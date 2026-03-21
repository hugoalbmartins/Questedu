import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';
import { preloadSprites } from '@/lib/sprites';
import { updateParticles, drawParticles, addSmokeParticle, addSparkle, addLeafParticle, addFirefly, drawFlag, drawWaterShimmer, drawAtmosphere } from '@/lib/canvasEffects';
import { AnimatedCitizen, Complaint } from '@/lib/simulation';
import { generateTerrain, drawTerrainElement, getWildernessBorder, studentIdToSeed, TerrainElement } from '@/lib/terrainGeneration';
import { drawIsoBuilding } from '@/lib/buildingRenderer';

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

const HW = TILE_W / 2;
const HH = TILE_H / 2;
const TILE_DEPTH = 8;
const GRASS_TOP = ['#4e8243', '#528645', '#4a7e3f', '#558a48', '#4c8040'];
const GRASS_LEFT = ['#3a6a30', '#3e6e34', '#38662e', '#407038', '#3c6c32'];
const GRASS_RIGHT = ['#2e5626', '#32592a', '#2c5224', '#345c2c', '#305828'];

export const IsometricCanvas = ({
  grid, buildings, gridSize, selectedBuilding, ghostPos, canPlaceGhost,
  productionReady, animatedCitizens, studentId, district,
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

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const mx = ((clientX - rect.left - w / 2) / zoom) - camera.x + originX;
    const my = ((clientY - rect.top - h / 2) / zoom) - camera.y + originY;
    return { mx, my };
  }, [camera, zoom, originX, originY]);

  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const world = screenToWorld(clientX, clientY);
    if (!world) return null;
    const { mx, my } = world;
    const gx = Math.floor((mx / HW + my / HH) / 2);
    const gy = Math.floor((my / HH - mx / HW) / 2);
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) return { gx, gy };
    return null;
  }, [screenToWorld, gridSize]);

  const screenToWorldGrid = useCallback((clientX: number, clientY: number) => {
    const world = screenToWorld(clientX, clientY);
    if (!world) return null;
    const { mx, my } = world;
    return { gx: (mx / HW + my / HH) / 2, gy: (my / HH - mx / HW) / 2 };
  }, [screenToWorld]);

  const findTerrainElement = useCallback((worldGx: number, worldGy: number): TerrainElement | null => {
    let closest: TerrainElement | null = null;
    let closestDist = 1.5;
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

  useEffect(() => {
    let running = true;
    const FRAME_MS = 1000 / 30;
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
  }, [fullGrid, buildings, camera, zoom, ghostPos, selectedBuilding, canPlaceGhost, gridSize, spritesLoaded, productionReady, animatedCitizens, constructingIds, constructionProgress]);

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
      if (Math.random() < 0.3) {
        const gx = Math.random() * gridSize;
        const gy = Math.random() * gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addLeafParticle(sx, sy - 20);
      }
      if (Math.random() < 0.15) {
        const gx = Math.random() * gridSize;
        const gy = Math.random() * gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addFirefly(sx, sy - 10);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [buildings, productionReady, gridSize]);

  // ===== 3D TILE DRAWING =====

  function draw3DTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, topColor: string, leftColor: string, rightColor: string, depth: number, strokeColor?: string) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - HH);
    ctx.lineTo(sx + HW, sy);
    ctx.lineTo(sx, sy + HH);
    ctx.lineTo(sx - HW, sy);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }

    if (depth > 0) {
      ctx.beginPath();
      ctx.moveTo(sx - HW, sy);
      ctx.lineTo(sx, sy + HH);
      ctx.lineTo(sx, sy + HH + depth);
      ctx.lineTo(sx - HW, sy + depth);
      ctx.closePath();
      ctx.fillStyle = leftColor;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx + HW, sy);
      ctx.lineTo(sx, sy + HH);
      ctx.lineTo(sx, sy + HH + depth);
      ctx.lineTo(sx + HW, sy + depth);
      ctx.closePath();
      ctx.fillStyle = rightColor;
      ctx.fill();
    }
  }

  function draw3DWildernessTile(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
    const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
    const distFromGrid = Math.max(
      Math.max(0, -gx), Math.max(0, gx - gridSize + 1),
      Math.max(0, -gy), Math.max(0, gy - gridSize + 1)
    );
    const darkness = Math.min(0.35, distFromGrid * 0.04);
    const noise = ((gx * 7 + gy * 13) % 7) - 3;
    const r = Math.max(18, 42 - darkness * 40 + noise);
    const g = Math.max(45, 85 - darkness * 50 + noise * 1.5);
    const b = Math.max(15, 35 - darkness * 25 + noise * 0.5);

    const top = `rgb(${r + 8}, ${g + 12}, ${b + 5})`;
    const left = `rgb(${Math.max(10, r - 8)}, ${Math.max(30, g - 12)}, ${Math.max(8, b - 6)})`;
    const right = `rgb(${Math.max(8, r - 14)}, ${Math.max(25, g - 18)}, ${Math.max(6, b - 10)})`;

    const edgeDepth = Math.max(2, TILE_DEPTH - distFromGrid);
    draw3DTile(ctx, sx, sy, top, left, right, edgeDepth, `rgba(30,55,22,0.15)`);
  }

  function draw3DWaterTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, time: number, baseColor: string) {
    const shimmer = Math.sin(time * 1.5 + sx * 0.05 + sy * 0.03) * 15;
    const topGrad = ctx.createLinearGradient(sx - HW / 2, sy - HH, sx + HW / 2, sy + HH);
    topGrad.addColorStop(0, baseColor);
    topGrad.addColorStop(0.5, `rgb(${58 + shimmer}, ${122 + shimmer}, ${189 + shimmer})`);
    topGrad.addColorStop(1, baseColor);

    ctx.beginPath();
    ctx.moveTo(sx, sy - HH);
    ctx.lineTo(sx + HW, sy);
    ctx.lineTo(sx, sy + HH);
    ctx.lineTo(sx - HW, sy);
    ctx.closePath();
    ctx.fillStyle = topGrad;
    ctx.fill();

    const depth = 6;
    ctx.beginPath();
    ctx.moveTo(sx - HW, sy);
    ctx.lineTo(sx, sy + HH);
    ctx.lineTo(sx, sy + HH + depth);
    ctx.lineTo(sx - HW, sy + depth);
    ctx.closePath();
    ctx.fillStyle = '#1a4a7a';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx + HW, sy);
    ctx.lineTo(sx, sy + HH);
    ctx.lineTo(sx, sy + HH + depth);
    ctx.lineTo(sx + HW, sy + depth);
    ctx.closePath();
    ctx.fillStyle = '#153a6a';
    ctx.fill();

    const waveAlpha = 0.15 + Math.sin(time * 1.2 + sy * 0.1) * 0.08;
    ctx.strokeStyle = `rgba(200, 235, 255, ${waveAlpha})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const waveY = Math.sin(time * 2 + sx * 0.2) * 1;
    ctx.moveTo(sx - 10, sy + waveY);
    ctx.quadraticCurveTo(sx - 3, sy - 1.5 + waveY, sx + 3, sy + 0.5 + waveY);
    ctx.quadraticCurveTo(sx + 6, sy + 1.5 + waveY, sx + 10, sy + waveY);
    ctx.stroke();
  }

  function drawVillageTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, type: string, x: number, y: number, buildingId: string | undefined, allBuildings: PlacedBuilding[]) {
    if (type === 'road') {
      const roadTop = ctx.createLinearGradient(sx - HW / 2, sy - HH, sx + HW / 2, sy + HH);
      roadTop.addColorStop(0, '#b0a080');
      roadTop.addColorStop(0.5, '#a09070');
      roadTop.addColorStop(1, '#8a7a60');
      draw3DTile(ctx, sx, sy, '', '#6a5a45', '#5a4a38', TILE_DEPTH - 2);
      ctx.beginPath();
      ctx.moveTo(sx, sy - HH);
      ctx.lineTo(sx + HW, sy);
      ctx.lineTo(sx, sy + HH);
      ctx.lineTo(sx - HW, sy);
      ctx.closePath();
      ctx.fillStyle = roadTop;
      ctx.fill();
      ctx.strokeStyle = '#7a6a55';
      ctx.lineWidth = 0.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(140, 120, 90, 0.25)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy);
      ctx.lineTo(sx + 5, sy);
      ctx.stroke();
      return;
    }

    if (type === 'wall') {
      draw3DTile(ctx, sx, sy, '#8a8a8a', '#6a6a6a', '#5a5a5a', TILE_DEPTH + 6, '#555');
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sx - HW * 0.3, sy - HH * 0.3);
      ctx.lineTo(sx + HW * 0.3, sy + HH * 0.3);
      ctx.stroke();
      return;
    }

    let isFarm = false;
    if (buildingId) {
      const b = allBuildings.find(bl => bl.id === buildingId);
      if (b && b.defId === 'farm') isFarm = true;
    }

    if (isFarm) {
      const farmColors = ['#6b8e23', '#7a9e32', '#5a7e13', '#648a1e'];
      const idx = (x + y) % farmColors.length;
      const farmGrad = ctx.createLinearGradient(sx - HW / 2, sy - HH, sx + HW / 2, sy + HH);
      farmGrad.addColorStop(0, farmColors[idx]);
      farmGrad.addColorStop(1, farmColors[(idx + 1) % farmColors.length]);

      ctx.beginPath();
      ctx.moveTo(sx, sy - HH);
      ctx.lineTo(sx + HW, sy);
      ctx.lineTo(sx, sy + HH);
      ctx.lineTo(sx - HW, sy);
      ctx.closePath();
      ctx.fillStyle = farmGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx - HW, sy);
      ctx.lineTo(sx, sy + HH);
      ctx.lineTo(sx, sy + HH + TILE_DEPTH);
      ctx.lineTo(sx - HW, sy + TILE_DEPTH);
      ctx.closePath();
      ctx.fillStyle = '#4a5e13';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx + HW, sy);
      ctx.lineTo(sx, sy + HH);
      ctx.lineTo(sx, sy + HH + TILE_DEPTH);
      ctx.lineTo(sx + HW, sy + TILE_DEPTH);
      ctx.closePath();
      ctx.fillStyle = '#3a4e0a';
      ctx.fill();

      ctx.strokeStyle = 'rgba(60,80,20,0.3)';
      ctx.lineWidth = 0.4;
      for (let i = 0; i < 3; i++) {
        const t = (i + 1) / 4;
        ctx.beginPath();
        ctx.moveTo(sx - HW * (1 - t), sy - HH * (1 - 2 * t));
        ctx.lineTo(sx + HW * (1 - t), sy + HH * (1 - 2 * t));
        ctx.stroke();
      }
      return;
    }

    const idx = (x + y * 3) % GRASS_TOP.length;
    const topGrad = ctx.createLinearGradient(sx - HW / 2, sy - HH, sx + HW / 2, sy + HH);
    topGrad.addColorStop(0, GRASS_TOP[idx]);
    topGrad.addColorStop(1, GRASS_LEFT[idx]);

    draw3DTile(ctx, sx, sy, '', GRASS_LEFT[idx], GRASS_RIGHT[idx], TILE_DEPTH);

    ctx.beginPath();
    ctx.moveTo(sx, sy - HH);
    ctx.lineTo(sx + HW, sy);
    ctx.lineTo(sx, sy + HH);
    ctx.lineTo(sx - HW, sy);
    ctx.closePath();
    ctx.fillStyle = topGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(50,80,40,0.15)';
    ctx.lineWidth = 0.3;
    ctx.stroke();

    if (!buildingId && (x * 7 + y * 11) % 5 === 0) {
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

  // ===== RENDER =====

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (canvasSize.current.w !== w || canvasSize.current.h !== h) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
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

    const waterTileSet = new Set<string>();
    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile') {
        waterTileSet.add(`${Math.floor(el.gx)},${Math.floor(el.gy)}`);
      }
    }

    const wb = wildernessBorder;
    for (let y = -wb; y < gridSize + wb; y++) {
      for (let x = -wb; x < gridSize + wb; x++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) continue;
        if (!waterTileSet.has(`${x},${y}`)) {
          draw3DWildernessTile(ctx, x, y);
        }
      }
    }

    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile') {
        const { sx, sy } = gridToIso(el.gx, el.gy, TILE_W, TILE_H);
        draw3DWaterTile(ctx, sx, sy, time + el.animOffset, el.type === 'river_tile' ? '#3a7abd' : '#2a6aad');
      }
    }

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = fullGrid[y]?.[x];
        if (!tile) continue;
        const { sx, sy } = gridToIso(x, y, TILE_W, TILE_H);
        drawVillageTile(ctx, sx, sy, tile.type, x, y, tile.buildingId, buildings);
      }
    }

    const sortedTerrain = terrainElements
      .filter(el => el.type !== 'river_tile' && el.type !== 'lake_tile')
      .sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    for (const el of sortedTerrain) {
      drawTerrainElement(ctx, el, TILE_W, TILE_H, time);
    }

    if (ghostPos && selectedBuilding) {
      const def = BUILDING_DEFS[selectedBuilding];
      if (def) {
        for (let dy = 0; dy < def.height; dy++) {
          for (let dx = 0; dx < def.width; dx++) {
            const { sx, sy } = gridToIso(ghostPos.x + dx, ghostPos.y + dy, TILE_W, TILE_H);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = canPlaceGhost ? '#00ff0044' : '#ff000044';
            ctx.beginPath();
            ctx.moveTo(sx, sy - HH);
            ctx.lineTo(sx + HW, sy);
            ctx.lineTo(sx, sy + HH);
            ctx.lineTo(sx - HW, sy);
            ctx.closePath();
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

    const sorted = [...buildings].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const b of sorted) {
      const def = BUILDING_DEFS[b.defId];
      if (!def) continue;
      if (def.id === 'road' || def.id === 'wall') continue;

      const cx = b.x + def.width / 2 - 0.5;
      const cy = b.y + def.height / 2 - 0.5;
      const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);

      const shadowGrad = ctx.createRadialGradient(sx + 3, sy + 5, 0, sx + 3, sy + 5, 16 * def.width);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(sx + 3, sy + 5, 16 * def.width, 8 * def.height, 0.15, 0, Math.PI * 2);
      ctx.fill();

      const isConstructing = constructingIds?.has(b.id) ?? false;
      const progress = constructionProgress?.get(b.id) ?? (isConstructing ? 0 : 1);

      drawIsoBuilding(ctx, b.defId, sx, sy, def.width, def.height, b.level, progress, time);

      if (!isConstructing) {
        if (def.id === 'tower' || def.category === 'monument') {
          drawFlag(ctx, sx + 8, sy - 20 - (b.level - 1) * 2, time);
        }
        if (def.id === 'fountain' || def.id === 'well') {
          drawWaterShimmer(ctx, sx, sy - 8, 20, time);
        }
        if (def.id === 'farm') {
          drawFarmCrops(ctx, sx, sy, b.level, time);
        }
        if (def.id === 'hospital') {
          drawCross(ctx, sx, sy - 25, time);
        }
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
        if (productionReady.has(b.id)) {
          const bobY = Math.sin(time * 4) * 3;
          ctx.fillStyle = '#f5a623';
          ctx.beginPath();
          ctx.arc(sx, sy - 30 + bobY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('\u{1FA99}', sx, sy - 27 + bobY);
        }
      }
    }

    for (const citizen of animatedCitizens) {
      const { sx, sy } = gridToIso(citizen.x, citizen.y, TILE_W, TILE_H);
      drawCitizen(ctx, sx, sy, citizen, time);
    }

    updateParticles();
    drawParticles(ctx);

    ctx.restore();
    drawAtmosphere(ctx, w, h, time);
  }

  function drawCitizen(ctx: CanvasRenderingContext2D, sx: number, sy: number, citizen: AnimatedCitizen, time: number) {
    const bobble = Math.sin(time * 8 + citizen.id) * 1;
    const walkLean = Math.sin(time * 4 + citizen.id * 2) * 0.5;

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 4, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a3020';
    const fp = Math.sin(time * 8 + citizen.id);
    ctx.beginPath();
    ctx.ellipse(sx - 1.5 + fp * 0.5, sy + 0.5, 1.2, 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 1.5 - fp * 0.5, sy + 0.5, 1.2, 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(sx - 3, sy - 2 + bobble, sx + 3, sy + 3 + bobble);
    bodyGrad.addColorStop(0, citizen.color);
    bodyGrad.addColorStop(1, darken(citizen.color, 0.3));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(sx + walkLean, sy - 3 + bobble, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = darken(citizen.color, 0.5);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx - 3 + walkLean, sy - 1 + bobble);
    ctx.lineTo(sx + 3 + walkLean, sy - 1 + bobble);
    ctx.stroke();

    ctx.strokeStyle = citizen.color;
    ctx.lineWidth = 1.5;
    const arm = Math.sin(time * 6 + citizen.id) * 2;
    ctx.beginPath();
    ctx.moveTo(sx - 3 + walkLean, sy - 4 + bobble);
    ctx.lineTo(sx - 5 + walkLean + arm, sy - 1 + bobble);
    ctx.moveTo(sx + 3 + walkLean, sy - 4 + bobble);
    ctx.lineTo(sx + 5 + walkLean - arm, sy - 1 + bobble);
    ctx.stroke();

    const skinTones = ['#f5d0a0', '#e8c090', '#d4a878', '#c49468'];
    ctx.fillStyle = skinTones[Math.abs(citizen.id) % skinTones.length];
    ctx.beginPath();
    ctx.arc(sx + walkLean, sy - 9.5 + bobble, 3, 0, Math.PI * 2);
    ctx.fill();

    const hairColors = ['#3a2010', '#1a1008', '#6a4020', '#8a6030', '#2a1a08'];
    ctx.fillStyle = hairColors[Math.abs(citizen.id * 3) % hairColors.length];
    ctx.beginPath();
    ctx.arc(sx + walkLean, sy - 10.5 + bobble, 3, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(sx + walkLean - 1, sy - 9.5 + bobble, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + walkLean + 1, sy - 9.5 + bobble, 0.5, 0, Math.PI * 2);
    ctx.fill();

    if (citizen.complaint && citizen.complaintTimer > 0) {
      const alpha = Math.min(1, citizen.complaintTimer / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(sx - 20, sy - 28 + bobble, 40, 15, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx - 2, sy - 13 + bobble);
      ctx.lineTo(sx + 2, sy - 13 + bobble);
      ctx.lineTo(sx, sy - 11 + bobble);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(citizen.complaint, sx, sy - 18 + bobble);
      ctx.globalAlpha = 1;
    }
  }

  function darken(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, Math.floor(r * (1 - amount)))}, ${Math.max(0, Math.floor(g * (1 - amount)))}, ${Math.max(0, Math.floor(b * (1 - amount)))})`;
  }

  function drawFarmCrops(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number, time: number) {
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

  // ===== INPUT HANDLERS =====

  const isDragBuildable = selectedBuilding === 'road' || selectedBuilding === 'wall';
  const lastDragPlaceRef = useRef<string | null>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

  const handleMouseDown = (e: React.MouseEvent) => {
    lastDragPlaceRef.current = null;
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCamStart({ ...camera });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = screenToGrid(e.clientX, e.clientY);
    if (dragging) {
      if (isDragBuildable && selectedBuilding && pos) {
        const key = `${pos.gx},${pos.gy}`;
        if (lastDragPlaceRef.current !== key) {
          lastDragPlaceRef.current = key;
          onTileClick(pos.gx, pos.gy);
        }
        onTileHover(pos.gx, pos.gy);
      } else {
        setCamera({
          x: camStart.x + (e.clientX - dragStart.x) / zoom,
          y: camStart.y + (e.clientY - dragStart.y) / zoom,
        });
      }
    } else {
      if (pos) onTileHover(pos.gx, pos.gy);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragging) {
      const dist = Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y);
      if (dist < 8) {
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos) {
          const tile = fullGrid[pos.gy]?.[pos.gx];
          if (tile?.buildingId && !selectedBuilding) {
            const b = buildings.find(bl => bl.id === tile.buildingId);
            if (b) { onBuildingClick(b); setDragging(false); return; }
          }
          onTileClick(pos.gx, pos.gy);
        } else if (onTerrainClick) {
          const worldPos = screenToWorldGrid(e.clientX, e.clientY);
          if (worldPos) {
            const el = findTerrainElement(worldPos.gx, worldPos.gy);
            if (el) onTerrainClick(el);
          }
        }
      }
    }
    setDragging(false);
    lastDragPlaceRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoom.current = zoom;
      return;
    }
    if (e.touches.length === 1) {
      lastDragPlaceRef.current = null;
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setCamStart({ ...camera });
      if (selectedBuilding) {
        const pos = screenToGrid(e.touches[0].clientX, e.touches[0].clientY);
        if (pos) onTileHover(pos.gx, pos.gy);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setZoom(Math.max(0.4, Math.min(2.5, pinchStartZoom.current * (dist / pinchStartDist.current))));
      return;
    }
    if (dragging && e.touches.length === 1) {
      const touch = e.touches[0];
      if (isDragBuildable && selectedBuilding) {
        const pos = screenToGrid(touch.clientX, touch.clientY);
        if (pos) {
          const key = `${pos.gx},${pos.gy}`;
          if (lastDragPlaceRef.current !== key) {
            lastDragPlaceRef.current = key;
            onTileClick(pos.gx, pos.gy);
          }
          onTileHover(pos.gx, pos.gy);
        }
      } else {
        setCamera({
          x: camStart.x + (touch.clientX - dragStart.x) / zoom,
          y: camStart.y + (touch.clientY - dragStart.y) / zoom,
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinchStartDist.current !== null && e.touches.length < 2) {
      pinchStartDist.current = null;
      return;
    }
    if (dragging && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const dist = Math.abs(t.clientX - dragStart.x) + Math.abs(t.clientY - dragStart.y);
      if (dist < 15 && !isDragBuildable) {
        const pos = screenToGrid(t.clientX, t.clientY);
        if (pos) {
          const tile = fullGrid[pos.gy]?.[pos.gx];
          if (tile?.buildingId && !selectedBuilding) {
            const b = buildings.find(bl => bl.id === tile.buildingId);
            if (b) { onBuildingClick(b); setDragging(false); return; }
          }
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
    lastDragPlaceRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { setDragging(false); lastDragPlaceRef.current = null; }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};
