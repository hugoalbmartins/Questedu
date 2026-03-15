import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';
import { preloadSprites } from '@/lib/sprites';
import {
  calculateViewportBounds,
  isInViewport,
  SpriteCache,
  AnimationThrottler,
  throttle,
  drawShadow,
  createGlowEffect,
  drawFloatingIcon
} from '@/lib/canvasOptimization';
import { generateTerrain, getWildernessBorder, studentIdToSeed, TerrainElement } from '@/lib/terrainGeneration';
import { AnimatedCitizen, Complaint } from '@/lib/simulation';

interface OptimizedIsometricCanvasProps {
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
  onTileClick: (gx: number, gy: number) => void;
  onTileHover: (gx: number, gy: number) => void;
  onBuildingClick: (building: PlacedBuilding) => void;
  onTerrainClick?: (element: TerrainElement) => void;
}

export const OptimizedIsometricCanvas = ({
  grid,
  buildings,
  gridSize,
  selectedBuilding,
  ghostPos,
  canPlaceGhost,
  productionReady,
  animatedCitizens,
  complaints,
  studentId,
  district,
  cooldownElements,
  onTileClick,
  onTileHover,
  onBuildingClick,
  onTerrainClick,
}: OptimizedIsometricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [camStart, setCamStart] = useState({ x: 0, y: 0 });
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'low'>('high');

  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const spriteCache = useRef(new SpriteCache());
  const throttler = useRef(new AnimationThrottler(performanceMode === 'high' ? 30 : 24));

  const fullGrid = useMemo(() => applyBuildingsToGrid(grid, buildings), [grid, buildings]);

  const terrainElements = useMemo(() => {
    const seed = studentId ? studentIdToSeed(studentId) : 12345;
    return generateTerrain({ district, gridSize, seed });
  }, [studentId, district, gridSize]);

  const originX = (gridSize * TILE_W) / 2;
  const originY = 50;

  useEffect(() => {
    preloadSprites().then(() => setSpritesLoaded(true));
  }, []);

  const throttledHover = useCallback(
    throttle((gx: number, gy: number) => {
      onTileHover(gx, gy);
    }, 100),
    [onTileHover]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setCamera({
        x: camStart.x + dx / zoom,
        y: camStart.y + dy / zoom
      });
    } else {
      const rect = canvas.getBoundingClientRect();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const mx = (e.clientX - rect.left - w / 2) / zoom - camera.x + originX;
      const my = (e.clientY - rect.top - h / 2) / zoom - camera.y + originY;
      const gx = Math.floor((mx / (TILE_W / 2) + my / (TILE_H / 2)) / 2);
      const gy = Math.floor((my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2);

      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        throttledHover(gx, gy);
      }
    }
  }, [dragging, dragStart, camStart, camera, zoom, gridSize, throttledHover, originX]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev * delta)));
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spritesLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(camera.x, camera.y);

    const viewportBounds = calculateViewportBounds(
      -camera.x / TILE_W,
      -camera.y / TILE_H,
      w,
      h,
      zoom
    );

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(-originX - 500, -originY - 500, (gridSize * TILE_W) + 1000, (gridSize * TILE_H) + 1000);
    ctx.globalAlpha = 1;

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        if (!isInViewport(gx, gy, viewportBounds)) continue;

        const tile = fullGrid[gy][gx];
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + TILE_W / 2, sy + TILE_H / 2);
        ctx.lineTo(sx, sy + TILE_H);
        ctx.lineTo(sx - TILE_W / 2, sy + TILE_H / 2);
        ctx.closePath();

        const grassIndex = (gx + gy * 7) % 5;
        ctx.fillStyle = GRASS_COLORS[grassIndex];
        ctx.fill();
        ctx.strokeStyle = '#2a4a20';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    for (const building of buildings) {
      const def = BUILDING_DEFS[building.defId];
      if (!def) continue;
      if (!isInViewport(building.x, building.y, viewportBounds)) continue;

      const { sx, sy } = gridToIso(building.x, building.y, TILE_W, TILE_H);

      if (performanceMode === 'high') {
        drawShadow(ctx, sx - 20, sy + 10, 80, 40, building.level || 1);
      }

      ctx.fillStyle = '#8B4513';
      ctx.fillRect(sx - 20, sy, 40, 50);

      if (productionReady.has(building.id) && performanceMode === 'high') {
        createGlowEffect(ctx, sx, sy - 25, 30, '#FFD700', timeRef.current * 2);
        drawFloatingIcon(ctx, sx, sy - 50, '✨', 24, timeRef.current * 3);
      }
    }

    ctx.restore();
  }, [
    spritesLoaded,
    camera,
    zoom,
    fullGrid,
    buildings,
    gridSize,
    productionReady,
    performanceMode,
    originX,
    originY
  ]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      const currentTime = performance.now();

      if (throttler.current.shouldRender(currentTime)) {
        timeRef.current += 0.016;
        render();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move touch-none"
        onMouseDown={(e) => {
          setDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
          setCamStart({ ...camera });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onClick={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          const mx = (e.clientX - rect.left - w / 2) / zoom - camera.x + originX;
          const my = (e.clientY - rect.top - h / 2) / zoom - camera.y + originY;
          const gx = Math.floor((mx / (TILE_W / 2) + my / (TILE_H / 2)) / 2);
          const gy = Math.floor((my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2);
          if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
            onTileClick(gx, gy);
          }
        }}
      />

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setPerformanceMode(prev => prev === 'high' ? 'low' : 'high')}
          className="px-3 py-1 bg-card/90 backdrop-blur-sm border-2 border-border rounded-lg text-xs font-bold hover:bg-card transition-colors"
        >
          {performanceMode === 'high' ? '🎨 Alta Qualidade' : '⚡ Modo Rápido'}
        </button>
      </div>
    </div>
  );
};

const GRASS_COLORS = ['#4e8243', '#528645', '#4a7e3f', '#558a48', '#4c8040'];
