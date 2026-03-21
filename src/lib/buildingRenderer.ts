import { TILE_W, TILE_H, BUILDING_DEFS } from '@/lib/gameTypes';
import { BUILDING_SPRITES, getSpriteImage } from '@/lib/sprites';

// Monuments without their own sprite sheet entry use the closest visual match
const MONUMENT_SPRITE_MAP: Record<string, string> = {
  fortaleza_sagres: 'castelo_guimaraes',
  castelo_braganca: 'castelo_guimaraes',
  castelo_beja: 'castelo_guimaraes',
  castelo_leiria: 'castelo_guimaraes',
  castelo_marvao: 'castelo_guimaraes',
  castelo_almourol: 'castelo_guimaraes',
  castelo_palmela: 'castelo_guimaraes',
  jardim_episcopal: 'universidade_coimbra',
  se_guarda: 'universidade_coimbra',
  santuario_luzia: 'universidade_coimbra',
  solar_mateus: 'universidade_coimbra',
  se_viseu: 'universidade_coimbra',
  lagoa_sete_cidades: 'templo_romano',
  monte_funchal: 'templo_romano',
  ponte_dom_luis: 'torre_belem',
  moliceiro_aveiro: 'torre_belem',
};

function resolveSpriteKey(defId: string): string | null {
  if (BUILDING_SPRITES[defId]) return defId;
  return MONUMENT_SPRITE_MAP[defId] ?? null;
}

// ===== SPRITE RENDERING =====

function drawSprite(
  ctx: CanvasRenderingContext2D,
  defId: string,
  sx: number,
  sy: number,
  bw: number,
  bh: number,
  level: number,
  progress: number,
  time: number
): boolean {
  const spriteKey = resolveSpriteKey(defId);
  if (!spriteKey) return false;

  const sprite = BUILDING_SPRITES[spriteKey];
  if (!sprite) return false;

  const img = getSpriteImage(sprite.image);
  if (!img) return false;

  const aspect = sprite.sw / sprite.sh;
  const tileW = TILE_W * Math.max(bw, bh);
  const isMonument = BUILDING_DEFS[defId]?.category === 'monument';

  let baseW: number;
  if (defId === 'tower') {
    baseW = tileW * 0.9;
  } else if (isMonument || bw >= 2 || bh >= 2) {
    baseW = tileW * 1.3;
  } else {
    baseW = tileW * 1.05;
  }

  const scale = 1 + (level - 1) * 0.05;
  const drawW = baseW * scale;
  const drawH = drawW / aspect;
  const anchorY = TILE_H * Math.max(bw, bh) * 0.25;

  const drawX = sx - drawW / 2;
  const drawY = sy - drawH + anchorY;

  if (progress < 1) {
    const revealH = drawH * progress;
    const clipY = drawY + drawH - revealH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(drawX - 2, clipY, drawW + 4, revealH + 2);
    ctx.clip();
    ctx.globalAlpha = 0.5 + progress * 0.5;
    ctx.drawImage(img, sprite.sx, sprite.sy, sprite.sw, sprite.sh, drawX, drawY, drawW, drawH);
    ctx.globalAlpha = 1;
    ctx.restore();

    if (progress < 0.95) {
      drawScaffolding(ctx, sx, drawY + drawH, revealH, drawW * 0.35, time);
      drawProgressBar(ctx, sx, clipY - 8, progress);
    }
    return true;
  }

  ctx.drawImage(img, sprite.sx, sprite.sy, sprite.sw, sprite.sh, drawX, drawY, drawW, drawH);

  if (level >= 3) {
    const alpha = 0.06 + Math.sin(time * 1.5) * 0.03;
    const hue = level >= 5 ? '#FF6030' : level >= 4 ? '#FFA040' : '#FFD060';
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.ellipse(sx, sy - drawW * 0.15, drawW * 0.5, drawW * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return true;
}

// ===== SHARED HELPERS =====

function drawScaffolding(ctx: CanvasRenderingContext2D, cx: number, bottomY: number, revealH: number, halfW: number, time: number) {
  const topY = bottomY - revealH;
  ctx.strokeStyle = '#8B7332';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, bottomY);
  ctx.lineTo(cx - halfW, topY);
  ctx.moveTo(cx + halfW, bottomY);
  ctx.lineTo(cx + halfW, topY);
  ctx.stroke();
  for (let i = 1; i <= 3; i++) {
    const ry = bottomY - (revealH * i) / 4;
    if (ry >= topY) {
      ctx.beginPath();
      ctx.moveTo(cx - halfW, ry);
      ctx.lineTo(cx + halfW, ry);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 3; i++) {
    const phase = time * 2 + i * 2.1;
    const dx = cx + Math.sin(phase) * halfW * 0.8;
    const dy = bottomY - Math.abs(Math.sin(phase * 0.5)) * revealH * 0.4;
    ctx.fillStyle = `rgba(170, 150, 110, ${0.25 + Math.sin(phase) * 0.12})`;
    ctx.beginPath();
    ctx.arc(dx, dy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProgressBar(ctx: CanvasRenderingContext2D, cx: number, y: number, progress: number) {
  const barW = 28;
  const barH = 4;
  const bx = cx - barW / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(bx - 1, y - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(bx, y, barW, barH);
  ctx.fillStyle = `rgb(60, ${Math.floor(120 + progress * 135)}, 60)`;
  ctx.fillRect(bx, y, barW * progress, barH);
}

// ===== PROCEDURAL ISO PRIMITIVES =====

function isoLeftWall(ctx: CanvasRenderingContext2D, sx: number, sy: number, hw: number, hh: number, wallH: number, color: string, dark: string) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx - hw, sy + hh);
  ctx.lineTo(sx - hw, sy + hh - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(sx - hw, sy, sx, sy);
  grad.addColorStop(0, dark);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function isoRightWall(ctx: CanvasRenderingContext2D, sx: number, sy: number, hw: number, hh: number, wallH: number, color: string, dark: string) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + hw, sy + hh);
  ctx.lineTo(sx + hw, sy + hh - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(sx, sy, sx + hw, sy);
  grad.addColorStop(0, color);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function isoRoof(ctx: CanvasRenderingContext2D, sx: number, sy: number, hw: number, hh: number, wallH: number, roofH: number, color: string, highlight: string) {
  const topY = sy - wallH;
  ctx.beginPath();
  ctx.moveTo(sx, topY - roofH);
  ctx.lineTo(sx + hw + 2, topY + hh);
  ctx.lineTo(sx, topY + hh * 2 + 1);
  ctx.lineTo(sx - hw - 2, topY + hh);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,30,10,0.3)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx, topY - roofH);
  ctx.lineTo(sx - hw - 2, topY + hh);
  ctx.lineTo(sx, topY + hh * 2 + 1);
  ctx.closePath();
  ctx.fillStyle = highlight;
  ctx.fill();

  const tileLines = Math.floor(roofH / 4);
  ctx.strokeStyle = 'rgba(60,20,5,0.12)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i <= tileLines; i++) {
    const t = i / (tileLines + 1);
    const ly = topY - roofH + (roofH + hh * 2 + 1) * t;
    const lx = (hw + 2) * (1 - Math.abs(t * 2 - 1));
    ctx.beginPath();
    ctx.moveTo(sx - lx, ly);
    ctx.lineTo(sx + lx, ly);
    ctx.stroke();
  }
}

function drawStoneTexture(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  const rows = Math.floor(h / 5);
  for (let r = 0; r < rows; r++) {
    const ry = y + (r / rows) * h;
    let cx = x;
    const stoneW = w / (3 + (r % 2));
    for (let c = 0; c <= 4; c++) {
      const sw = stoneW * (0.8 + ((r * 3 + c * 7) % 5) * 0.1);
      ctx.strokeRect(cx, ry, sw, h / rows);
      cx += sw;
      if (cx > x + w) break;
    }
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(100,140,180,0.3)';
  ctx.fillRect(x + 1, y + 1, w / 2 - 1, h / 2 - 1);
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a2510';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.arc(x + w / 2, y, w / 2, Math.PI, 0);
  ctx.fillStyle = '#4a2a10';
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

// ===== PROCEDURAL BUILDING RENDERERS =====

function drawProceduralFarm(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const hw = tw * 0.45;
  const hh = th * 0.22;

  ctx.beginPath();
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = '#6B4226';
  ctx.fill();
  ctx.strokeStyle = '#4a2a12';
  ctx.lineWidth = 1;
  ctx.stroke();

  const rows = 3 + level;
  const cols = 4 + level;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = (r + 0.5) / rows;
      const u = (c + 0.5) / cols;
      const green = 80 + Math.floor(((r * 7 + c * 3) % 5) * 20);
      ctx.fillStyle = `rgb(${40 + ((r + c) % 3) * 10}, ${green}, ${20 + ((r * c) % 4) * 5})`;
      ctx.beginPath();
      ctx.arc(sx + (u - 0.5) * hw * (1 - Math.abs(t - 0.5)), sy + (t - 0.5) * hh * 1.5, 2 + level * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const fenceH = 8;
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx - hw * 0.3, sy - hh * 0.3 - fenceH);
  ctx.lineTo(sx - hw * 0.3, sy - hh * 0.3);
  ctx.moveTo(sx + hw * 0.3, sy - hh * 0.3 - fenceH);
  ctx.lineTo(sx + hw * 0.3, sy - hh * 0.3);
  ctx.moveTo(sx - hw * 0.3, sy - hh * 0.3 - fenceH * 0.6);
  ctx.lineTo(sx + hw * 0.3, sy - hh * 0.3 - fenceH * 0.6);
  ctx.stroke();
}

function drawProceduralHospital(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const hw = tw * 0.35;
  const hh = th * 0.18;
  const wallH = 28 + level * 5;

  isoLeftWall(ctx, sx, sy, hw, hh, wallH, '#E8DDD0', '#C8BDB0');
  isoRightWall(ctx, sx, sy, hw, hh, wallH, '#D8CDC0', '#B8ADA0');
  drawStoneTexture(ctx, sx - hw, sy + hh - wallH, hw, wallH);
  isoRoof(ctx, sx, sy, hw, hh, wallH, 14 + level * 2, '#A0522D', '#B8633E');
  drawDoor(ctx, sx - 4, sy - wallH * 0.05, 8, 12);

  ctx.fillStyle = '#CC0000';
  const crossX = sx + hw * 0.4;
  const crossY = sy - wallH * 0.55;
  ctx.fillRect(crossX - 1.5, crossY - 5, 3, 10);
  ctx.fillRect(crossX - 5, crossY - 1.5, 10, 3);

  if (level >= 2) {
    drawWindow(ctx, sx - hw * 0.4, sy - wallH * 0.6, 5, 6);
    drawWindow(ctx, sx - hw * 0.1, sy - wallH * 0.6, 5, 6);
  }
}

function drawProceduralSchool(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const hw = tw * 0.38;
  const hh = th * 0.19;
  const wallH = 30 + level * 5;

  isoLeftWall(ctx, sx, sy, hw, hh, wallH, '#F0E6D6', '#D0C6B6');
  isoRightWall(ctx, sx, sy, hw, hh, wallH, '#E0D6C6', '#C0B6A6');
  drawStoneTexture(ctx, sx - hw, sy + hh - wallH, hw, wallH);
  isoRoof(ctx, sx, sy, hw, hh, wallH, 16 + level * 2, '#8B4513', '#A05828');
  drawDoor(ctx, sx - 4, sy - wallH * 0.05, 8, 13);

  const winCount = 2 + Math.floor(level / 2);
  for (let i = 0; i < winCount; i++) {
    const wx = sx + hw * 0.15 + (i / winCount) * hw * 0.6;
    drawWindow(ctx, wx, sy - wallH * 0.55, 5, 7);
  }

  if (level >= 2) {
    ctx.fillStyle = '#2a7f2a';
    ctx.beginPath();
    ctx.arc(sx, sy + hh - wallH - 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProceduralChurch(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const hw = tw * 0.32;
  const hh = th * 0.16;
  const wallH = 32 + level * 6;

  isoLeftWall(ctx, sx, sy, hw, hh, wallH, '#E0D8CC', '#C0B8AC');
  isoRightWall(ctx, sx, sy, hw, hh, wallH, '#D0C8BC', '#B0A89C');
  drawStoneTexture(ctx, sx - hw * 0.5, sy + hh - wallH, hw * 0.5, wallH);
  isoRoof(ctx, sx, sy, hw, hh, wallH, 18 + level * 3, '#7a3a0a', '#9a4a1a');

  const towerW = hw * 0.3;
  const towerH = wallH * 0.6;
  const tx = sx - hw * 0.1;
  const ty = sy - wallH;

  ctx.fillStyle = '#D8D0C4';
  ctx.fillRect(tx - towerW / 2, ty - towerH, towerW, towerH);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(tx - towerW / 2, ty - towerH, towerW, towerH);

  ctx.beginPath();
  ctx.moveTo(tx, ty - towerH - 8 - level * 2);
  ctx.lineTo(tx - towerW / 2 - 1, ty - towerH);
  ctx.lineTo(tx + towerW / 2 + 1, ty - towerH);
  ctx.closePath();
  ctx.fillStyle = '#6a2a05';
  ctx.fill();

  ctx.fillStyle = '#C8A800';
  const crossTop = ty - towerH - 10 - level * 2;
  ctx.fillRect(tx - 0.8, crossTop - 5, 1.6, 6);
  ctx.fillRect(tx - 2.5, crossTop - 3, 5, 1.6);

  drawDoor(ctx, sx - 4, sy - wallH * 0.03, 7, 12);

  ctx.fillStyle = '#3a4a5a';
  ctx.beginPath();
  ctx.arc(sx + hw * 0.3, sy - wallH * 0.6, 4, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(100,140,180,0.25)';
  ctx.beginPath();
  ctx.arc(sx + hw * 0.3, sy - wallH * 0.6, 3.5, Math.PI, 0);
  ctx.fill();
}

function drawProceduralWell(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number) {
  const hw = TILE_W * 0.28;
  const hh = TILE_H * 0.14;
  const wallH = 8 + level * 2;

  ctx.beginPath();
  ctx.ellipse(sx, sy, hw, hh, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#4a6a90';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(sx, sy - 1, hw * 0.75, hh * 0.75, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a5a80';
  ctx.fill();

  isoLeftWall(ctx, sx, sy, hw, hh, wallH, '#A09888', '#807868');
  isoRightWall(ctx, sx, sy, hw, hh, wallH, '#908878', '#706858');

  ctx.beginPath();
  ctx.ellipse(sx, sy - wallH, hw, hh, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#707878';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(sx, sy - wallH, hw * 0.7, hh * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2a4a70';
  ctx.fill();

  if (level >= 2) {
    const postH = 14 + level * 2;
    ctx.strokeStyle = '#6a4a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - hw * 0.6, sy - wallH);
    ctx.lineTo(sx - hw * 0.6, sy - wallH - postH);
    ctx.moveTo(sx + hw * 0.6, sy - wallH);
    ctx.lineTo(sx + hw * 0.6, sy - wallH - postH);
    ctx.moveTo(sx - hw * 0.6, sy - wallH - postH);
    ctx.lineTo(sx + hw * 0.6, sy - wallH - postH);
    ctx.stroke();

    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH - postH);
    ctx.lineTo(sx, sy - wallH - postH + 6);
    ctx.stroke();
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(sx - 2, sy - wallH - postH + 6, 4, 3);
  }
}

function drawProceduralWindmill(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number, time: number) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const hw = tw * 0.2;
  const hh = th * 0.1;
  const wallH = 38 + level * 6;

  const baseHw = hw * 1.3;
  const baseHh = hh * 1.3;
  isoLeftWall(ctx, sx, sy, baseHw, baseHh, wallH * 0.3, '#D8CFC0', '#B8AFA0');
  isoRightWall(ctx, sx, sy, baseHw, baseHh, wallH * 0.3, '#C8BFB0', '#A89F90');

  const towerBot = sy - wallH * 0.3;
  const taperTop = 0.6;
  isoLeftWall(ctx, sx, towerBot, hw, hh, wallH * 0.7, '#F0E8D8', '#D0C8B8');
  isoRightWall(ctx, sx, towerBot, hw * taperTop, hh * taperTop, wallH * 0.7, '#E0D8C8', '#C0B8A8');

  drawStoneTexture(ctx, sx - hw * 0.5, towerBot - wallH * 0.5, hw, wallH * 0.4);

  const topY = sy - wallH;
  ctx.beginPath();
  ctx.moveTo(sx, topY - 8 - level);
  ctx.lineTo(sx + hw * taperTop + 2, topY + hh * taperTop);
  ctx.lineTo(sx - hw - 2, topY + hh);
  ctx.closePath();
  ctx.fillStyle = '#A0522D';
  ctx.fill();

  drawDoor(ctx, sx - 3, sy - wallH * 0.3 + 1, 6, 10);
  drawWindow(ctx, sx - hw * 0.3, towerBot - wallH * 0.4, 4, 5);

  const bladeLen = 22 + level * 3;
  const bladeCx = sx;
  const bladeCy = topY - 2;
  const angle = time * 1.2;
  ctx.strokeStyle = '#5a3a10';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const a = angle + (Math.PI / 2) * i;
    const ex = bladeCx + Math.cos(a) * bladeLen;
    const ey = bladeCy + Math.sin(a) * bladeLen * 0.5;
    ctx.beginPath();
    ctx.moveTo(bladeCx, bladeCy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.fillStyle = 'rgba(200, 180, 140, 0.5)';
    ctx.beginPath();
    const perpX = Math.cos(a + 0.3) * bladeLen * 0.9;
    const perpY = Math.sin(a + 0.3) * bladeLen * 0.45;
    ctx.moveTo(bladeCx, bladeCy);
    ctx.lineTo(bladeCx + Math.cos(a) * bladeLen * 0.3, bladeCy + Math.sin(a) * bladeLen * 0.15);
    ctx.lineTo(bladeCx + perpX * 0.3, bladeCy + perpY * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#4a3a1a';
  ctx.beginPath();
  ctx.arc(bladeCx, bladeCy, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawProceduralGarden(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number, time: number) {
  const hw = TILE_W * 0.35;
  const hh = TILE_H * 0.18;

  ctx.beginPath();
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = '#3a5a2a';
  ctx.fill();
  ctx.strokeStyle = '#2a4a1a';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  const bushCount = 3 + level;
  for (let i = 0; i < bushCount; i++) {
    const angle = (i / bushCount) * Math.PI * 2 + time * 0.1;
    const dist = hw * 0.4 * (0.5 + (i % 3) * 0.2);
    const bx = sx + Math.cos(angle) * dist * 0.8;
    const by = sy + Math.sin(angle) * dist * 0.4;
    const r = 3 + (i % 3) + level * 0.5;
    ctx.fillStyle = `rgb(${30 + (i % 3) * 10}, ${70 + (i * 30) % 60}, ${20 + (i % 2) * 10})`;
    ctx.beginPath();
    ctx.arc(bx, by - r * 0.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgb(${40 + (i % 3) * 10}, ${90 + (i * 20) % 40}, ${30 + (i % 2) * 10})`;
    ctx.beginPath();
    ctx.arc(bx - 1, by - r * 0.7, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  if (level >= 2) {
    const colors = ['#FF6B6B', '#FFD93D', '#FF8CC8', '#6BCBFF', '#FFA94D'];
    for (let i = 0; i < level + 1; i++) {
      const fa = (i / (level + 1)) * Math.PI * 2 + time * 0.2;
      const fd = hw * 0.3;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(sx + Math.cos(fa) * fd, sy + Math.sin(fa) * fd * 0.5 - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawProceduralStatue(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number) {
  const hw = TILE_W * 0.25;
  const hh = TILE_H * 0.12;
  const baseH = 6;

  isoLeftWall(ctx, sx, sy, hw, hh, baseH, '#908880', '#706860');
  isoRightWall(ctx, sx, sy, hw, hh, baseH, '#808070', '#605850');

  ctx.beginPath();
  ctx.moveTo(sx, sy - baseH - hh);
  ctx.lineTo(sx + hw, sy - baseH);
  ctx.lineTo(sx, sy - baseH + hh);
  ctx.lineTo(sx - hw, sy - baseH);
  ctx.closePath();
  ctx.fillStyle = '#A09890';
  ctx.fill();

  const statueH = 18 + level * 4;
  const statueW = 5 + level;
  const baseTop = sy - baseH - 1;

  ctx.fillStyle = '#B0A898';
  ctx.beginPath();
  ctx.moveTo(sx - statueW / 2, baseTop);
  ctx.lineTo(sx + statueW / 2, baseTop);
  ctx.lineTo(sx + statueW * 0.3, baseTop - statueH * 0.7);
  ctx.lineTo(sx - statueW * 0.3, baseTop - statueH * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#C0B8A8';
  ctx.beginPath();
  ctx.arc(sx, baseTop - statueH * 0.8, statueW * 0.4, 0, Math.PI * 2);
  ctx.fill();

  if (level >= 3) {
    ctx.strokeStyle = '#8a7a50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - statueW * 0.3, baseTop - statueH * 0.5);
    ctx.lineTo(sx - statueW, baseTop - statueH * 0.6);
    ctx.moveTo(sx + statueW * 0.3, baseTop - statueH * 0.5);
    ctx.lineTo(sx + statueW * 0.8, baseTop - statueH * 0.3);
    ctx.stroke();
  }
}

function drawGenericBuilding(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const hw = tw * 0.35;
  const hh = th * 0.18;
  const wallH = 22 + level * 5;

  isoLeftWall(ctx, sx, sy, hw, hh, wallH, '#D8CFC0', '#B8AFA0');
  isoRightWall(ctx, sx, sy, hw, hh, wallH, '#C8BFB0', '#A89F90');
  drawStoneTexture(ctx, sx - hw * 0.6, sy + hh - wallH, hw * 0.5, wallH);
  isoRoof(ctx, sx, sy, hw, hh, wallH, 12 + level * 2, '#A0522D', '#B8633E');
  drawDoor(ctx, sx - 3, sy - wallH * 0.05, 6, 10);

  if (level >= 2) {
    drawWindow(ctx, sx + hw * 0.3, sy - wallH * 0.55, 5, 6);
  }
}

// ===== PROCEDURAL DISPATCHER =====

type ProceduralFn = (ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number, time: number) => void;

const PROCEDURAL_BUILDINGS: Record<string, ProceduralFn> = {
  farm: (ctx, sx, sy, bw, bh, level) => drawProceduralFarm(ctx, sx, sy, bw, bh, level),
  hospital: (ctx, sx, sy, bw, bh, level) => drawProceduralHospital(ctx, sx, sy, bw, bh, level),
  school_building: (ctx, sx, sy, bw, bh, level) => drawProceduralSchool(ctx, sx, sy, bw, bh, level),
  church: (ctx, sx, sy, bw, bh, level) => drawProceduralChurch(ctx, sx, sy, bw, bh, level),
  well: (ctx, sx, sy, _bw, _bh, level) => drawProceduralWell(ctx, sx, sy, level),
  windmill: (ctx, sx, sy, bw, bh, level, time) => drawProceduralWindmill(ctx, sx, sy, bw, bh, level, time),
  garden: (ctx, sx, sy, _bw, _bh, level, time) => drawProceduralGarden(ctx, sx, sy, level, time),
  statue: (ctx, sx, sy, _bw, _bh, level) => drawProceduralStatue(ctx, sx, sy, level),
};

// ===== MAIN ENTRY =====

export function drawIsoBuilding(
  ctx: CanvasRenderingContext2D,
  defId: string,
  sx: number,
  sy: number,
  bw: number,
  bh: number,
  level: number,
  progress: number,
  time: number
) {
  if (defId === 'road' || defId === 'wall') return;

  ctx.save();

  if (progress < 1 && !resolveSpriteKey(defId)) {
    ctx.globalAlpha = 0.4 + progress * 0.6;
  }

  const spriteDrawn = drawSprite(ctx, defId, sx, sy, bw, bh, level, progress, time);

  if (!spriteDrawn) {
    const procedural = PROCEDURAL_BUILDINGS[defId];
    if (procedural) {
      procedural(ctx, sx, sy, bw, bh, level, time);
    } else {
      drawGenericBuilding(ctx, sx, sy, bw, bh, level);
    }
  }

  ctx.restore();
}

export function drawConstructionDust(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  time: number
) {
  for (let i = 0; i < 4; i++) {
    const angle = time * 2 + i * 1.57;
    const dx = Math.cos(angle) * 12;
    const dy = Math.sin(angle) * 6;
    const alpha = 0.3 + Math.sin(time * 3 + i) * 0.15;
    ctx.fillStyle = `rgba(180, 160, 120, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx + dx, sy - 5 + dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
