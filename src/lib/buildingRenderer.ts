import { TILE_W, TILE_H, BUILDING_DEFS } from '@/lib/gameTypes';
import { BUILDING_SPRITES, getSpriteImage } from '@/lib/sprites';

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

const DECORATION_SPRITE_MAP: Record<string, string> = {
  garden: 'fountain',
  statue: 'fountain',
};

function getSpriteKey(defId: string): string | null {
  if (BUILDING_SPRITES[defId]) return defId;
  if (MONUMENT_SPRITE_MAP[defId]) return MONUMENT_SPRITE_MAP[defId];
  if (DECORATION_SPRITE_MAP[defId]) return DECORATION_SPRITE_MAP[defId];
  return null;
}

function drawSpriteBuilding(
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
  const spriteKey = getSpriteKey(defId);
  if (!spriteKey) return false;

  const sprite = BUILDING_SPRITES[spriteKey];
  if (!sprite) return false;

  const img = getSpriteImage(sprite.image);
  if (!img) return false;

  const tilePixelW = TILE_W * Math.max(bw, bh);
  const tilePixelH = TILE_H * Math.max(bw, bh);

  const spriteAspect = sprite.sw / sprite.sh;

  let drawW: number;
  let drawH: number;

  const isMonument = BUILDING_DEFS[defId]?.category === 'monument';
  const isTall = defId === 'tower' || defId === 'torre_belem' || defId === 'ponte_dom_luis' || defId === 'moliceiro_aveiro';

  if (isTall) {
    drawH = tilePixelH * 3.5;
    drawW = drawH * spriteAspect;
  } else if (isMonument) {
    drawW = tilePixelW * 1.6;
    drawH = drawW / spriteAspect;
  } else if (bw >= 2 || bh >= 2) {
    drawW = tilePixelW * 1.5;
    drawH = drawW / spriteAspect;
  } else {
    drawW = tilePixelW * 1.2;
    drawH = drawW / spriteAspect;
  }

  const levelScale = 1 + (level - 1) * 0.06;
  drawW *= levelScale;
  drawH *= levelScale;

  const drawX = sx - drawW / 2;
  const drawY = sy - drawH + tilePixelH * 0.35;

  if (progress < 1) {
    drawConstructionState(ctx, sx, sy, drawX, drawY, drawW, drawH, progress, img, sprite, time);
    return true;
  }

  ctx.drawImage(
    img,
    sprite.sx, sprite.sy, sprite.sw, sprite.sh,
    drawX, drawY, drawW, drawH
  );

  if (level >= 3) {
    drawLevelGlow(ctx, sx, sy, drawW, level, time);
  }

  return true;
}

function drawConstructionState(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  progress: number,
  img: HTMLImageElement,
  sprite: { sx: number; sy: number; sw: number; sh: number },
  time: number
) {
  const revealH = drawH * progress;
  const clipY = drawY + drawH - revealH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(drawX - 2, clipY, drawW + 4, revealH + 2);
  ctx.clip();

  ctx.globalAlpha = 0.4 + progress * 0.6;
  ctx.drawImage(
    img,
    sprite.sx, sprite.sy, sprite.sw, sprite.sh,
    drawX, drawY, drawW, drawH
  );
  ctx.globalAlpha = 1;
  ctx.restore();

  if (progress < 0.95) {
    drawScaffolding(ctx, sx, sy, drawW, drawH, time);
    drawProgressBar(ctx, sx, sy - drawH * 0.3, progress);
  }
}

function drawScaffolding(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  w: number,
  h: number,
  time: number
) {
  const halfW = w * 0.4;
  const topY = sy - h * 0.6;

  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(sx - halfW, sy);
  ctx.lineTo(sx - halfW, topY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx + halfW, sy);
  ctx.lineTo(sx + halfW, topY);
  ctx.stroke();

  const rungs = 3;
  for (let i = 0; i < rungs; i++) {
    const ry = sy - (h * 0.6 * (i + 1)) / (rungs + 1);
    ctx.beginPath();
    ctx.moveTo(sx - halfW, ry);
    ctx.lineTo(sx + halfW, ry);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(sx - halfW, sy);
  ctx.lineTo(sx + halfW, topY);
  ctx.stroke();

  const dustCount = 3;
  for (let i = 0; i < dustCount; i++) {
    const phase = time * 2 + i * 2.1;
    const dx = sx + Math.sin(phase) * halfW * 0.8;
    const dy = sy - Math.abs(Math.sin(phase * 0.5)) * h * 0.3;
    const alpha = 0.3 + Math.sin(phase) * 0.15;
    ctx.fillStyle = `rgba(180, 160, 120, ${alpha})`;
    ctx.beginPath();
    ctx.arc(dx, dy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  progress: number
) {
  const barW = 30;
  const barH = 4;
  const bx = sx - barW / 2;
  const by = sy - 5;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

  ctx.fillStyle = '#333';
  ctx.fillRect(bx, by, barW, barH);

  const green = Math.floor(100 + progress * 155);
  ctx.fillStyle = `rgb(50, ${green}, 50)`;
  ctx.fillRect(bx, by, barW * progress, barH);
}

function drawLevelGlow(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  w: number,
  level: number,
  time: number
) {
  const glowAlpha = 0.08 + Math.sin(time * 2) * 0.04;
  const colors = ['', '', '', '#FFD700', '#FFA500', '#FF4500'];
  const color = colors[Math.min(level, 5)] || '#FFD700';

  const grad = ctx.createRadialGradient(sx, sy - w * 0.3, 0, sx, sy - w * 0.3, w * 0.6);
  grad.addColorStop(0, color.replace(')', `, ${glowAlpha})`).replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(sx, sy - w * 0.2, w * 0.6, w * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

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
  if (defId === 'road') {
    drawRoadSprite(ctx, sx, sy);
    return;
  }

  if (defId === 'wall') {
    drawWallSprite(ctx, sx, sy, level);
    return;
  }

  const drawn = drawSpriteBuilding(ctx, defId, sx, sy, bw, bh, level, progress, time);
  if (!drawn) {
    drawFallbackBuilding(ctx, defId, sx, sy, bw, bh, level, progress);
  }
}

function drawRoadSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const sprite = BUILDING_SPRITES['road'];
  if (!sprite) return;
  const img = getSpriteImage(sprite.image);
  if (!img) return;

  const dw = TILE_W * 1.1;
  const dh = dw * (sprite.sh / sprite.sw);
  ctx.drawImage(
    img,
    sprite.sx, sprite.sy, sprite.sw, sprite.sh,
    sx - dw / 2, sy - dh / 2, dw, dh
  );
}

function drawWallSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number) {
  const sprite = BUILDING_SPRITES['wall'];
  if (!sprite) return;
  const img = getSpriteImage(sprite.image);
  if (!img) return;

  const scale = 1 + (level - 1) * 0.04;
  const dw = TILE_W * 1.1 * scale;
  const dh = dw * (sprite.sh / sprite.sw);
  ctx.drawImage(
    img,
    sprite.sx, sprite.sy, sprite.sw, sprite.sh,
    sx - dw / 2, sy - dh * 0.7, dw, dh
  );
}

function drawFallbackBuilding(
  ctx: CanvasRenderingContext2D,
  defId: string,
  sx: number,
  sy: number,
  bw: number,
  bh: number,
  level: number,
  progress: number
) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const wallH = 20 + level * 4;
  const hw = tw / 2;
  const hh = th / 4;

  ctx.globalAlpha = progress < 1 ? 0.5 + progress * 0.5 : 1;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx - hw, sy + hh);
  ctx.lineTo(sx - hw, sy + hh - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  ctx.fillStyle = '#9B8B7A';
  ctx.fill();
  ctx.strokeStyle = '#6B5B4A';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + hw, sy + hh);
  ctx.lineTo(sx + hw, sy + hh - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  ctx.fillStyle = '#8A7B6A';
  ctx.fill();
  ctx.stroke();

  const roofH = 12 + level * 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy - wallH - roofH);
  ctx.lineTo(sx - hw - 3, sy + hh - wallH + 2);
  ctx.lineTo(sx, sy - wallH + 2);
  ctx.lineTo(sx + hw + 3, sy + hh - wallH + 2);
  ctx.closePath();
  ctx.fillStyle = '#B85C38';
  ctx.fill();
  ctx.strokeStyle = '#8B3A1A';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.globalAlpha = 1;
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
