import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';
import { BUILDING_SPRITES, getSpriteImage, preloadSprites } from '@/lib/sprites';
import { updateParticles, drawParticles, addSmokeParticle, addSparkle, drawFlag, drawWaterShimmer } from '@/lib/canvasEffects';

interface IsometricCanvasProps {
  grid: GridTile[][];
  buildings: PlacedBuilding[];
  gridSize: number;
  selectedBuilding: string | null;
  ghostPos: { x: number; y: number } | null;
  canPlaceGhost: boolean;
  productionReady: Set<string>;
  onTileClick: (gx: number, gy: number) => void;
  onTileHover: (gx: number, gy: number) => void;
  onBuildingClick: (building: PlacedBuilding) => void;
}

const GRASS_COLORS = ['#4a7c3f', '#4e8243', '#467838', '#528645'];
const ROAD_COLOR = '#a09070';
const ROAD_BORDER = '#7a6a55';
const WALL_COLOR = '#6b6b6b';

export const IsometricCanvas = ({
  grid, buildings, gridSize, selectedBuilding, ghostPos, canPlaceGhost,
  productionReady, onTileClick, onTileHover, onBuildingClick,
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

  const fullGrid = useMemo(() => applyBuildingsToGrid(grid, buildings), [grid, buildings]);

  const originX = (gridSize * TILE_W) / 2;
  const originY = 50;

  // Preload sprites
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

  // Animation loop
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      timeRef.current += 0.016;
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [fullGrid, buildings, camera, zoom, ghostPos, selectedBuilding, canPlaceGhost, gridSize, spritesLoaded, productionReady]);

  // Add smoke to workshops periodically
  useEffect(() => {
    const interval = setInterval(() => {
      for (const b of buildings) {
        const def = BUILDING_DEFS[b.defId];
        if (!def) continue;
        if (def.id === 'workshop' || def.id === 'market') {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSmokeParticle(sx, sy - 20);
        }
        // Sparkles on buildings with ready production
        if (productionReady.has(b.id)) {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSparkle(sx, sy - 15);
        }
      }
    }, 800);
    return () => clearInterval(interval);
  }, [buildings, productionReady]);

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a3010';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(camera.x - originX, camera.y - originY);

    const time = timeRef.current;

    // Draw tiles
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = fullGrid[y]?.[x];
        if (!tile) continue;
        const { sx, sy } = gridToIso(x, y, TILE_W, TILE_H);
        drawIsoDiamond(ctx, sx, sy, tile.type, x, y);
      }
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
        // Ghost building preview
        const { sx, sy } = gridToIso(ghostPos.x, ghostPos.y, TILE_W, TILE_H);
        ctx.globalAlpha = 0.6;
        drawBuildingSprite(ctx, def.id, sx, sy, def.width, def.height, 1);
        ctx.globalAlpha = 1;
      }
    }

    // Draw buildings (sorted by depth)
    const sorted = [...buildings].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const b of sorted) {
      const def = BUILDING_DEFS[b.defId];
      if (!def) continue;

      const cx = b.x + def.width / 2 - 0.5;
      const cy = b.y + def.height / 2 - 0.5;
      const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);

      if (def.id === 'road' || def.id === 'wall') continue; // rendered as tile

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 4, 16 * def.width, 8 * def.height, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw sprite or emoji
      drawBuildingSprite(ctx, b.defId, sx, sy, def.width, def.height, b.level);

      // Flags on towers
      if (def.id === 'tower' || def.category === 'monument') {
        drawFlag(ctx, sx + 8, sy - 20 - (b.level - 1) * 2, time);
      }

      // Fountain water animation
      if (def.id === 'fountain') {
        drawWaterShimmer(ctx, sx, sy - 8, 20, time);
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

    // Draw particles
    updateParticles();
    drawParticles(ctx);

    ctx.restore();
  }

  function drawBuildingSprite(ctx: CanvasRenderingContext2D, defId: string, sx: number, sy: number, bw: number, bh: number, level: number) {
    const sprite = BUILDING_SPRITES[defId];
    const img = sprite ? getSpriteImage(sprite.image) : null;

    if (img && sprite) {
      const drawW = 32 + (bw - 1) * 24 + (level - 1) * 4;
      const drawH = drawW * (sprite.sh / sprite.sw);
      ctx.drawImage(
        img,
        sprite.sx, sprite.sy, sprite.sw, sprite.sh,
        sx - drawW / 2, sy - drawH + 8, drawW, drawH
      );
    } else {
      // Fallback to emoji
      const def = BUILDING_DEFS[defId];
      if (def) {
        const baseSize = 22 + (bw - 1) * 10;
        const levelSize = baseSize + (level - 1) * 3;
        ctx.font = `${levelSize}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(def.emoji, sx, sy - 6 - (level - 1) * 2);
      }
    }
  }

  function drawIsoDiamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, type: string, x: number, y: number) {
    let color: string;
    if (type === 'road') color = ROAD_COLOR;
    else if (type === 'wall') color = WALL_COLOR;
    else color = GRASS_COLORS[(x + y * 3) % GRASS_COLORS.length];

    drawDiamondPath(ctx, sx, sy);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = type === 'road' ? ROAD_BORDER : '#3a6030';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  function drawDiamondPath(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - TILE_H / 2);
    ctx.lineTo(sx + TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx - TILE_W / 2, sy);
    ctx.closePath();
  }

  // Mouse/touch handlers (same as before)
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
        if (pos) onTileClick(pos.gx, pos.gy);
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
