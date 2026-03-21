import { TILE_W, TILE_H, BUILDING_DEFS } from '@/lib/gameTypes';
import { BUILDING_SPRITES, getSpriteImage } from '@/lib/sprites';

const HW = TILE_W / 2;
const HH = TILE_H / 2;

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

function isoBox(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  boxW: number, boxD: number, boxH: number,
  topColor: string, leftColor: string, rightColor: string
) {
  const hw = boxW / 2;
  const hd = boxD / 2;
  const isoHW = hw + hd;
  const isoHH = (hw + hd) * (HH / HW);
  const leftX = cx - isoHW;
  const leftY = cy + (hd - hw) * (HH / HW);
  const rightX = cx + isoHW;
  const rightY = cy + (hw - hd) * (HH / HW);
  const bottomY = cy + isoHH;
  const topY = cy - isoHH;

  ctx.beginPath();
  ctx.moveTo(leftX, leftY - boxH);
  ctx.lineTo(cx, bottomY - boxH);
  ctx.lineTo(cx, bottomY);
  ctx.lineTo(leftX, leftY);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rightX, rightY - boxH);
  ctx.lineTo(cx, bottomY - boxH);
  ctx.lineTo(cx, bottomY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, topY - boxH);
  ctx.lineTo(rightX, rightY - boxH);
  ctx.lineTo(cx, bottomY - boxH);
  ctx.lineTo(leftX, leftY - boxH);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.3;
  ctx.stroke();
}

function isoRoof(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  roofHW: number, roofHH: number,
  wallHeight: number, ridgeHeight: number,
  color: string, highlight: string
) {
  const topY = cy - wallHeight;
  ctx.beginPath();
  ctx.moveTo(cx, topY - ridgeHeight);
  ctx.lineTo(cx + roofHW + 2, topY + roofHH);
  ctx.lineTo(cx, topY + roofHH * 2 + 1);
  ctx.lineTo(cx - roofHW - 2, topY + roofHH);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, topY - ridgeHeight);
  ctx.lineTo(cx - roofHW - 2, topY + roofHH);
  ctx.lineTo(cx, topY + roofHH * 2 + 1);
  ctx.closePath();
  ctx.fillStyle = highlight;
  ctx.fill();

  ctx.strokeStyle = 'rgba(60,20,5,0.15)';
  ctx.lineWidth = 0.4;
  const tileLines = Math.floor(ridgeHeight / 4);
  for (let i = 1; i <= tileLines; i++) {
    const t = i / (tileLines + 1);
    const ly = topY - ridgeHeight + (ridgeHeight + roofHH * 2 + 1) * t;
    const lx = (roofHW + 2) * (1 - Math.abs(t * 2 - 1));
    ctx.beginPath();
    ctx.moveTo(cx - lx, ly);
    ctx.lineTo(cx + lx, ly);
    ctx.stroke();
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(100,150,200,0.35)';
  ctx.fillRect(x + 1, y + 1, w / 2 - 1, h / 2 - 1);
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 0.6;
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
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.arc(x + w / 2, y, w / 2, Math.PI, 0);
  ctx.fillStyle = '#4a2a10';
  ctx.fill();
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.5, 1, 0, Math.PI * 2);
  ctx.fill();
}

function drawProceduralFarm(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const baseHW = HW * bw * 0.55;
  const baseHH = HH * bh * 0.55;
  const fenceH = 5 + level;

  ctx.beginPath();
  ctx.moveTo(sx, sy - baseHH);
  ctx.lineTo(sx + baseHW, sy);
  ctx.lineTo(sx, sy + baseHH);
  ctx.lineTo(sx - baseHW, sy);
  ctx.closePath();
  ctx.fillStyle = '#6B4226';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx - baseHW, sy);
  ctx.lineTo(sx, sy + baseHH);
  ctx.lineTo(sx, sy + baseHH + 3);
  ctx.lineTo(sx - baseHW, sy + 3);
  ctx.closePath();
  ctx.fillStyle = '#4a2a12';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + baseHW, sy);
  ctx.lineTo(sx, sy + baseHH);
  ctx.lineTo(sx, sy + baseHH + 3);
  ctx.lineTo(sx + baseHW, sy + 3);
  ctx.closePath();
  ctx.fillStyle = '#3a1a08';
  ctx.fill();

  const rows = 3 + level;
  const cols = 4 + level;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = (r + 0.5) / rows;
      const u = (c + 0.5) / cols;
      const green = 80 + Math.floor(((r * 7 + c * 3) % 5) * 20);
      ctx.fillStyle = `rgb(${40 + ((r + c) % 3) * 10}, ${green}, ${20 + ((r * c) % 4) * 5})`;
      const px = sx + (u - 0.5) * baseHW * 1.2 * (1 - Math.abs(t - 0.5) * 0.8);
      const py = sy + (t - 0.5) * baseHH * 1.2;
      ctx.beginPath();
      ctx.arc(px, py, 2 + level * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.2;
  const posts = [
    { x: sx - baseHW * 0.8, y: sy - baseHH * 0.1 },
    { x: sx + baseHW * 0.8, y: sy + baseHH * 0.1 },
    { x: sx - baseHW * 0.1, y: sy - baseHH * 0.8 },
    { x: sx + baseHW * 0.1, y: sy + baseHH * 0.8 },
  ];
  for (const p of posts) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - fenceH);
    ctx.stroke();
  }
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(posts[0].x, posts[0].y - fenceH * 0.6);
  ctx.lineTo(posts[2].x, posts[2].y - fenceH * 0.6);
  ctx.lineTo(posts[1].x, posts[1].y - fenceH * 0.6);
  ctx.lineTo(posts[3].x, posts[3].y - fenceH * 0.6);
  ctx.stroke();
}

function drawProceduralHospital(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const boxW = TILE_W * bw * 0.55;
  const boxD = TILE_W * bh * 0.55;
  const wallH = 24 + level * 4;

  isoBox(ctx, sx, sy, boxW, boxD, wallH, '#E8DDD0', '#C8BDB0', '#B8ADA0');

  const roofHW = (boxW + boxD) / 2 * 0.55;
  const roofHH = roofHW * (HH / HW);
  isoRoof(ctx, sx, sy, roofHW, roofHH, wallH, 12 + level * 2, '#A0522D', '#B8633E');

  drawDoor(ctx, sx - 3.5, sy - wallH * 0.08, 7, 11);

  ctx.fillStyle = '#CC0000';
  const crossX = sx + roofHW * 0.5;
  const crossY = sy - wallH * 0.55;
  ctx.fillRect(crossX - 1.5, crossY - 4, 3, 8);
  ctx.fillRect(crossX - 4, crossY - 1.5, 8, 3);

  if (level >= 2) {
    drawWindow(ctx, sx - roofHW * 0.5, sy - wallH * 0.6, 4, 5);
    drawWindow(ctx, sx - roofHW * 0.15, sy - wallH * 0.6, 4, 5);
  }
}

function drawProceduralSchool(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const boxW = TILE_W * bw * 0.58;
  const boxD = TILE_W * bh * 0.58;
  const wallH = 26 + level * 4;

  isoBox(ctx, sx, sy, boxW, boxD, wallH, '#F0E6D6', '#D0C6B6', '#C0B6A6');

  const roofHW = (boxW + boxD) / 2 * 0.58;
  const roofHH = roofHW * (HH / HW);
  isoRoof(ctx, sx, sy, roofHW, roofHH, wallH, 14 + level * 2, '#8B4513', '#A05828');

  drawDoor(ctx, sx - 3.5, sy - wallH * 0.06, 7, 12);

  const winCount = 2 + Math.floor(level / 2);
  for (let i = 0; i < winCount; i++) {
    const wx = sx + roofHW * 0.15 + (i / winCount) * roofHW * 0.7;
    drawWindow(ctx, wx, sy - wallH * 0.55, 4, 6);
  }
}

function drawProceduralChurch(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const boxW = TILE_W * bw * 0.5;
  const boxD = TILE_W * bh * 0.5;
  const wallH = 28 + level * 5;

  isoBox(ctx, sx, sy, boxW, boxD, wallH, '#E0D8CC', '#C0B8AC', '#B0A89C');

  const roofHW = (boxW + boxD) / 2 * 0.52;
  const roofHH = roofHW * (HH / HW);
  isoRoof(ctx, sx, sy, roofHW, roofHH, wallH, 16 + level * 3, '#7a3a0a', '#9a4a1a');

  const towerW = 8;
  const towerH = wallH * 0.6;
  const tx = sx - roofHW * 0.1;
  const ty = sy - wallH;

  ctx.fillStyle = '#D8D0C4';
  ctx.fillRect(tx - towerW / 2, ty - towerH, towerW, towerH);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.4;
  ctx.strokeRect(tx - towerW / 2, ty - towerH, towerW, towerH);

  ctx.beginPath();
  ctx.moveTo(tx, ty - towerH - 7 - level * 2);
  ctx.lineTo(tx - towerW / 2 - 1, ty - towerH);
  ctx.lineTo(tx + towerW / 2 + 1, ty - towerH);
  ctx.closePath();
  ctx.fillStyle = '#6a2a05';
  ctx.fill();

  ctx.fillStyle = '#C8A800';
  const crossTop = ty - towerH - 9 - level * 2;
  ctx.fillRect(tx - 0.8, crossTop - 4, 1.6, 5);
  ctx.fillRect(tx - 2, crossTop - 2.5, 4, 1.4);

  drawDoor(ctx, sx - 3, sy - wallH * 0.04, 6, 11);

  ctx.fillStyle = '#3a4a5a';
  ctx.beginPath();
  ctx.arc(sx + roofHW * 0.35, sy - wallH * 0.6, 3.5, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(100,140,180,0.2)';
  ctx.beginPath();
  ctx.arc(sx + roofHW * 0.35, sy - wallH * 0.6, 3, Math.PI, 0);
  ctx.fill();
}

function drawProceduralWell(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number) {
  const r = 10;
  const wallH = 7 + level * 2;

  ctx.beginPath();
  ctx.ellipse(sx, sy, r, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#5a7a9a';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(sx, sy, r * 0.7, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a5a80';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(sx, sy, r, r * 0.5, 0, Math.PI * 0.02, Math.PI * 0.98);
  ctx.lineTo(sx - r, sy + wallH);
  ctx.ellipse(sx, sy + wallH, r, r * 0.5, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(sx + r, sy);
  ctx.closePath();
  ctx.fillStyle = '#A09888';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.4;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(sx, sy - wallH + wallH, r, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#808888';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(sx, sy, r * 0.65, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#2a4a70';
  ctx.fill();

  if (level >= 2) {
    const postH = 12 + level * 2;
    ctx.strokeStyle = '#6a4a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.5, sy);
    ctx.lineTo(sx - r * 0.5, sy - postH);
    ctx.moveTo(sx + r * 0.5, sy);
    ctx.lineTo(sx + r * 0.5, sy - postH);
    ctx.moveTo(sx - r * 0.5, sy - postH);
    ctx.lineTo(sx + r * 0.5, sy - postH);
    ctx.stroke();

    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(sx, sy - postH);
    ctx.lineTo(sx, sy - postH + 5);
    ctx.stroke();
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(sx - 1.5, sy - postH + 5, 3, 2.5);
  }
}

function drawProceduralWindmill(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number, time: number) {
  const baseW = TILE_W * bw * 0.35;
  const baseD = TILE_W * bh * 0.35;
  const baseH = 12;
  isoBox(ctx, sx, sy, baseW, baseD, baseH, '#D8CFC0', '#B8AFA0', '#A89F90');

  const towerR = 6 + level;
  const towerH = 30 + level * 5;
  const towerBot = sy - baseH;

  for (let i = 0; i < towerH; i += 2) {
    const t = i / towerH;
    const cr = towerR * (1 - t * 0.35);
    const ty = towerBot - i;
    const brightness = 220 - t * 30;
    ctx.fillStyle = `rgb(${brightness}, ${brightness - 10}, ${brightness - 20})`;
    ctx.beginPath();
    ctx.ellipse(sx, ty, cr, cr * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < towerH; i += 2) {
    const t = i / towerH;
    const cr = towerR * (1 - t * 0.35);
    const ty = towerBot - i;
    ctx.beginPath();
    ctx.ellipse(sx + cr * 0.3, ty, cr * 0.3, cr * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const topY = towerBot - towerH;
  ctx.beginPath();
  ctx.moveTo(sx, topY - 6);
  ctx.lineTo(sx + towerR * 0.7, topY + 3);
  ctx.lineTo(sx - towerR * 0.7, topY + 3);
  ctx.closePath();
  ctx.fillStyle = '#A0522D';
  ctx.fill();

  drawDoor(ctx, sx - 2.5, towerBot - 8, 5, 8);

  if (level >= 2) {
    drawWindow(ctx, sx - 2, towerBot - towerH * 0.5, 3.5, 4);
  }

  const bladeLen = 20 + level * 3;
  const bladeCy = topY;
  const angle = time * 1.2;
  for (let i = 0; i < 4; i++) {
    const a = angle + (Math.PI / 2) * i;
    const ex = sx + Math.cos(a) * bladeLen;
    const ey = bladeCy + Math.sin(a) * bladeLen * 0.5;

    ctx.fillStyle = 'rgba(180, 160, 120, 0.5)';
    ctx.beginPath();
    const perpA = a + 0.2;
    ctx.moveTo(sx, bladeCy);
    ctx.lineTo(sx + Math.cos(a) * bladeLen * 0.8, bladeCy + Math.sin(a) * bladeLen * 0.4);
    ctx.lineTo(sx + Math.cos(perpA) * bladeLen * 0.7, bladeCy + Math.sin(perpA) * bladeLen * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#5a3a10';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, bladeCy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a3a1a';
  ctx.beginPath();
  ctx.arc(sx, bladeCy, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawProceduralGarden(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number, time: number) {
  const r = HW * 0.6;
  const rh = HH * 0.6;

  ctx.beginPath();
  ctx.moveTo(sx, sy - rh);
  ctx.lineTo(sx + r, sy);
  ctx.lineTo(sx, sy + rh);
  ctx.lineTo(sx - r, sy);
  ctx.closePath();
  ctx.fillStyle = '#3a5a2a';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx - r, sy);
  ctx.lineTo(sx, sy + rh);
  ctx.lineTo(sx, sy + rh + 3);
  ctx.lineTo(sx - r, sy + 3);
  ctx.closePath();
  ctx.fillStyle = '#2a4a1a';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx + r, sy);
  ctx.lineTo(sx, sy + rh);
  ctx.lineTo(sx, sy + rh + 3);
  ctx.lineTo(sx + r, sy + 3);
  ctx.closePath();
  ctx.fillStyle = '#1a3a0a';
  ctx.fill();

  const bushCount = 3 + level;
  for (let i = 0; i < bushCount; i++) {
    const angle = (i / bushCount) * Math.PI * 2 + time * 0.08;
    const dist = r * 0.45 * (0.5 + (i % 3) * 0.2);
    const bx = sx + Math.cos(angle) * dist;
    const by = sy + Math.sin(angle) * dist * 0.5;
    const br = 3 + (i % 3) + level * 0.4;
    ctx.fillStyle = `rgb(${30 + (i % 3) * 10}, ${70 + (i * 30) % 60}, ${20 + (i % 2) * 10})`;
    ctx.beginPath();
    ctx.arc(bx, by - br * 0.5, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgb(${40 + (i % 3) * 10}, ${90 + (i * 20) % 40}, ${30 + (i % 2) * 10})`;
    ctx.beginPath();
    ctx.arc(bx - 1, by - br * 0.7, br * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  if (level >= 2) {
    const colors = ['#FF6B6B', '#FFD93D', '#FF8CC8', '#6BCBFF', '#FFA94D'];
    for (let i = 0; i < level + 1; i++) {
      const fa = (i / (level + 1)) * Math.PI * 2 + time * 0.15;
      const fd = r * 0.35;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(sx + Math.cos(fa) * fd, sy + Math.sin(fa) * fd * 0.5 - 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawProceduralStatue(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number) {
  const baseW = HW * 0.6;
  const baseD = HW * 0.6;
  const baseH = 5;
  isoBox(ctx, sx, sy, baseW, baseD, baseH, '#A09890', '#807868', '#706858');

  const statueH = 16 + level * 3;
  const statueW = 4 + level;
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
  ctx.arc(sx, baseTop - statueH * 0.8, statueW * 0.38, 0, Math.PI * 2);
  ctx.fill();

  if (level >= 3) {
    ctx.strokeStyle = '#8a7a50';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx - statueW * 0.3, baseTop - statueH * 0.5);
    ctx.lineTo(sx - statueW, baseTop - statueH * 0.6);
    ctx.moveTo(sx + statueW * 0.3, baseTop - statueH * 0.5);
    ctx.lineTo(sx + statueW * 0.8, baseTop - statueH * 0.3);
    ctx.stroke();
  }
}

function drawGenericBuilding(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number, level: number) {
  const boxW = TILE_W * bw * 0.5;
  const boxD = TILE_W * bh * 0.5;
  const wallH = 20 + level * 4;

  isoBox(ctx, sx, sy, boxW, boxD, wallH, '#D8CFC0', '#B8AFA0', '#A89F90');

  const roofHW = (boxW + boxD) / 2 * 0.52;
  const roofHH = roofHW * (HH / HW);
  isoRoof(ctx, sx, sy, roofHW, roofHH, wallH, 10 + level * 2, '#A0522D', '#B8633E');

  drawDoor(ctx, sx - 2.5, sy - wallH * 0.06, 5, 9);

  if (level >= 2) {
    drawWindow(ctx, sx + roofHW * 0.3, sy - wallH * 0.55, 4, 5);
  }
}

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
