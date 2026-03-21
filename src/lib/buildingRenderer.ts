import { TILE_W, TILE_H, BUILDING_DEFS } from '@/lib/gameTypes';

interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  sx: number;
  sy: number;
  tw: number;
  th: number;
  level: number;
  progress: number;
  time: number;
}

function darken(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.max(0, Math.floor(r * (1 - amt)))},${Math.max(0, Math.floor(g * (1 - amt)))},${Math.max(0, Math.floor(b * (1 - amt)))})`;
}

function lighten(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.floor(r + (255 - r) * amt))},${Math.min(255, Math.floor(g + (255 - g) * amt))},${Math.min(255, Math.floor(b + (255 - b) * amt))})`;
}

// ===== CORE ISO PRIMITIVES WITH BOLD OUTLINES =====

function isoLeftFace(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string, outline = true) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx - w / 2, sy + h / 4);
  ctx.lineTo(sx - w / 2, sy + h / 4 - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = darken(fill, 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function isoRightFace(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string, outline = true) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + w / 2, sy + h / 4);
  ctx.lineTo(sx + w / 2, sy + h / 4 - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = darken(fill, 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function isoTopFace(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string, outline = true) {
  ctx.beginPath();
  ctx.moveTo(sx, sy - wallH);
  ctx.lineTo(sx + w / 2, sy - wallH + h / 4);
  ctx.lineTo(sx, sy - wallH + h / 2);
  ctx.lineTo(sx - w / 2, sy - wallH + h / 4);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = darken(fill, 0.35);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function isoBox(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, lightColor: string, outline = true) {
  isoLeftFace(ctx, sx, sy, w, h, wallH, darken(lightColor, 0.12), outline);
  isoRightFace(ctx, sx, sy, w, h, wallH, darken(lightColor, 0.28), outline);
  isoTopFace(ctx, sx, sy, w, h, wallH, lightColor, outline);
}

// Bold window with visible frame
function drawBoldWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, glowColor = '#7ec8e8') {
  ctx.fillStyle = '#2a3a55';
  ctx.fillRect(x - 0.5, y - 0.5, w + 1, h + 1);
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, lighten(glowColor, 0.3));
  grad.addColorStop(0.5, glowColor);
  grad.addColorStop(1, darken(glowColor, 0.2));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y, w * 0.4, h * 0.4);
  ctx.strokeStyle = '#3a2a15';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  if (w >= 4) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();
  }
  if (h >= 4) {
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
  }
}

function drawBoldDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = darken(color, 0.15);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w * 0.3);
  ctx.quadraticCurveTo(x + w / 2, y - 1, x + w, y + w * 0.3);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(x + 0.8, y + w * 0.4, w - 1.6, h - w * 0.4);
  ctx.strokeStyle = darken(color, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + w * 0.3);
  ctx.quadraticCurveTo(x + w / 2, y - 1, x + w, y + w * 0.3);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.fillStyle = '#daa520';
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.55, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

// Gable roof with bold strokes and ridge detail
function drawBoldGableRoof(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, th: number, wallH: number, roofH: number, color: string) {
  const topY = sy - wallH;
  const peakY = topY - roofH;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY + th / 2 + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(color, 0.18);
  ctx.beginPath();
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY + th / 2 + 1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx, topY + th / 2 + 1);
  ctx.stroke();
  ctx.strokeStyle = lighten(color, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY + th / 2 + 1);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.stroke();
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    ctx.strokeStyle = `rgba(0,0,0,0.08)`;
    ctx.lineWidth = 0.4;
    const fy = peakY + (topY + th / 4 + 1 - peakY) * t;
    ctx.beginPath();
    ctx.moveTo(sx - (tw / 2 + 2) * t, fy);
    ctx.lineTo(sx, fy + th / 4 * t);
    ctx.stroke();
  }
}

function drawHipRoof(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, th: number, wallH: number, roofH: number, color: string) {
  const topY = sy - wallH;
  const peakY = topY - roofH;
  const ridgeLen = tw * 0.2;
  // Front left face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx - ridgeLen / 2, peakY);
  ctx.lineTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY + th / 2 + 1);
  ctx.lineTo(sx + ridgeLen / 2, peakY);
  ctx.closePath();
  ctx.fill();
  // Front right face
  ctx.fillStyle = darken(color, 0.16);
  ctx.beginPath();
  ctx.moveTo(sx + ridgeLen / 2, peakY);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY + th / 2 + 1);
  ctx.closePath();
  ctx.fill();
  // Back left
  ctx.fillStyle = lighten(color, 0.06);
  ctx.beginPath();
  ctx.moveTo(sx - ridgeLen / 2, peakY);
  ctx.lineTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY);
  ctx.lineTo(sx + ridgeLen / 2, peakY);
  ctx.closePath();
  ctx.fill();
  // Back right
  ctx.fillStyle = darken(color, 0.22);
  ctx.beginPath();
  ctx.moveTo(sx + ridgeLen / 2, peakY);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY);
  ctx.closePath();
  ctx.fill();
  // Bold ridge + edge outlines
  ctx.strokeStyle = darken(color, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx - ridgeLen / 2, peakY);
  ctx.lineTo(sx + ridgeLen / 2, peakY);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sx - ridgeLen / 2, peakY);
  ctx.lineTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.moveTo(sx + ridgeLen / 2, peakY);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.moveTo(sx - ridgeLen / 2, peakY);
  ctx.lineTo(sx, topY);
  ctx.moveTo(sx + ridgeLen / 2, peakY);
  ctx.lineTo(sx, topY);
  ctx.moveTo(sx, topY + th / 2 + 1);
  ctx.lineTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.moveTo(sx, topY + th / 2 + 1);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.stroke();
  // Eave highlight
  ctx.strokeStyle = lighten(color, 0.25);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(sx - tw / 2 - 2, topY + th / 4 + 1);
  ctx.lineTo(sx, topY + th / 2 + 1);
  ctx.lineTo(sx + tw / 2 + 2, topY + th / 4 + 1);
  ctx.stroke();
}

function drawChimney(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, time: number) {
  isoBox(ctx, x, y + h, w, w * 0.5, h, color);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.18, w * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const so = Math.sin(time * 2 + i * 1.3) * 2;
    const alpha = 0.25 - i * 0.06;
    ctx.fillStyle = `rgba(160,160,160,${alpha})`;
    ctx.beginPath();
    ctx.arc(x + so, y - 2 - i * 4, 2.5 + i * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getPhases(progress: number) {
  return {
    foundPhase: Math.min(progress / 0.33, 1),
    wallPhase: Math.min(Math.max((progress - 0.33) / 0.33, 0), 1),
    roofPhase: Math.min(Math.max((progress - 0.66) / 0.34, 0), 1),
  };
}

function drawFoundation(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, th: number, color: string) {
  isoBox(ctx, sx, sy + 2, tw, th, 3, color);
}

function drawProgressBar(ctx: CanvasRenderingContext2D, sx: number, sy: number, topY: number, tw: number, progress: number) {
  const barW = tw * 0.55;
  const barX = sx - barW / 2;
  const barY = topY - 12;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(barX - 2, barY - 2, barW + 4, 10, 4);
  ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 6, 3);
  ctx.fill();
  const grad = ctx.createLinearGradient(barX, barY, barX + barW * progress, barY + 6);
  grad.addColorStop(0, '#f0a020');
  grad.addColorStop(1, '#e8d040');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * progress, 6, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.roundRect(barX + 1, barY, barW * progress - 2, 3, [2, 2, 0, 0]);
  ctx.fill();
}

function drawScaffolding(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, wallH: number) {
  ctx.strokeStyle = '#b08840';
  ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i += 2) {
    const px = sx + i * tw * 0.3;
    ctx.beginPath();
    ctx.moveTo(px, sy + 2);
    ctx.lineTo(px, sy + 2 - wallH * 1.05);
    ctx.stroke();
  }
  ctx.strokeStyle = '#c0a050';
  ctx.lineWidth = 1;
  for (let j = 1; j <= 3; j++) {
    const hy = sy + 2 - wallH * (j / 3.5);
    ctx.beginPath();
    ctx.moveTo(sx - tw * 0.3, hy);
    ctx.lineTo(sx + tw * 0.3, hy);
    ctx.stroke();
  }
}

// ===== BUILDING RENDERERS =====

function drawHouse(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallLight = level >= 4 ? '#f0dbb8' : level >= 3 ? '#e8d0a8' : level >= 2 ? '#dcc498' : '#d4b888';
  const roofColor = level >= 4 ? '#c44420' : level >= 3 ? '#b84828' : level >= 2 ? '#a85830' : '#8b6914';
  const wallH = Math.round((18 + level * 4) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#9a8868');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallLight);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallLight, 0.16));

  if (wallPhase > 0.3) {
    drawBoldDoor(ctx, sx - 3, sy - 9, 5, 8, '#6a3a15');
  }
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tw / 3.5, sy - wallH * 0.62, 5, 4);
  }
  if (level >= 2 && wallPhase > 0.7) {
    drawBoldWindow(ctx, sx + tw / 6 - 2, sy - wallH * 0.6 + th / 10, 5, 4, '#90d0f0');
  }
  if (level >= 4 && wallPhase > 0.8) {
    drawBoldWindow(ctx, sx - tw / 4, sy - wallH * 0.85, 4, 3, '#b0d8f0');
  }

  if (wallPhase < 0.95) drawScaffolding(ctx, sx, sy, tw, wallH);

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (12 + level * 3) * roofPhase;
    drawBoldGableRoof(ctx, sx, sy, tw * 1.1, th * 1.1, wallH - 1, rH, roofColor);
    if (level >= 3) {
      drawChimney(ctx, sx + tw * 0.22, sy - wallH - rH * 0.35, 6, 7, '#8a5040', time);
    }
    ctx.globalAlpha = 1;
  }
}

function drawMansion(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallLight = level >= 4 ? '#f4e8cc' : level >= 3 ? '#eadcb8' : '#dcd0a8';
  const trimColor = level >= 3 ? '#8a6a3a' : '#7a5a30';
  const wallH = Math.round((26 + level * 5) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#a09070');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallLight);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallLight, 0.14));

  // Corner pilasters
  if (wallPhase > 0.2) {
    ctx.fillStyle = trimColor;
    ctx.fillRect(sx - tw / 2 - 0.5, sy + th / 4 - wallH * 0.9, 2.5, wallH * 0.88);
    ctx.fillRect(sx + tw / 2 - 2, sy + th / 4 - wallH * 0.9, 2.5, wallH * 0.88);
    ctx.strokeStyle = darken(trimColor, 0.4);
    ctx.lineWidth = 0.6;
    ctx.strokeRect(sx - tw / 2 - 0.5, sy + th / 4 - wallH * 0.9, 2.5, wallH * 0.88);
  }

  if (wallPhase > 0.3) {
    drawBoldDoor(ctx, sx - 4, sy - 12, 8, 11, '#4a2a10');
    // Ornate doorframe
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 1);
    ctx.lineTo(sx - 5, sy - 13);
    ctx.lineTo(sx + 5, sy - 13);
    ctx.lineTo(sx + 5, sy - 1);
    ctx.stroke();
    ctx.fillStyle = trimColor;
    ctx.fillRect(sx - 6, sy - 14, 12, 2);
  }
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tw / 2.8, sy - wallH * 0.5, 6, 5);
    drawBoldWindow(ctx, sx + tw / 5 - 3, sy - wallH * 0.48 + th / 8, 6, 5);
  }
  if (level >= 2 && wallPhase > 0.7) {
    drawBoldWindow(ctx, sx - tw / 3, sy - wallH * 0.78, 5, 4, '#a0d0e8');
    drawBoldWindow(ctx, sx + tw / 5.5 - 2, sy - wallH * 0.76 + th / 10, 5, 4, '#a0d0e8');
  }

  if (wallPhase < 0.95) drawScaffolding(ctx, sx, sy, tw, wallH);

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (14 + level * 3) * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.08, th * 1.08, wallH - 1, rH, level >= 3 ? '#8a3015' : '#9a4820');
    drawChimney(ctx, sx + tw * 0.2, sy - wallH - rH * 0.25, 6, 8, '#8a5848', time);
    if (level >= 4) drawChimney(ctx, sx - tw * 0.15, sy - wallH - rH * 0.25, 5, 7, '#8a5848', time);
    ctx.globalAlpha = 1;
  }
}

function drawTower(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const tW = tw * 0.7;
  const tH = th * 0.7;
  const stone = level >= 3 ? '#b0a8a0' : '#989088';
  const wallH = Math.round((34 + level * 7) * foundPhase);

  drawFoundation(ctx, sx, sy, tW * 1.2, tH * 1.2, '#707068');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tW, tH, wallH, stone);
  isoRightFace(ctx, sx, sy, tW, tH, wallH, darken(stone, 0.18));

  // Stone block lines
  if (wallPhase > 0) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    for (let j = 1; j <= 5; j++) {
      const rowY = sy - wallH * (j / 6);
      ctx.beginPath();
      ctx.moveTo(sx, rowY);
      ctx.lineTo(sx - tW / 2, rowY + tH / 4);
      ctx.stroke();
    }
  }

  if (wallPhase > 0.3) {
    drawBoldDoor(ctx, sx - 2.5, sy - 8, 4, 7, '#3a2a10');
  }
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tW / 4, sy - wallH * 0.45, 3.5, 5, '#6ab0d8');
  }
  if (level >= 2 && wallPhase > 0.7) {
    drawBoldWindow(ctx, sx - tW / 5, sy - wallH * 0.7, 3, 4.5, '#6ab0d8');
  }

  if (wallPhase < 0.95) drawScaffolding(ctx, sx, sy, tW, wallH);

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    isoTopFace(ctx, sx, sy, tW, tH, wallH, lighten(stone, 0.12));
    // Merlons (battlements)
    const mH = 5 + level;
    const mW = tW * 0.18;
    for (let i = -1; i <= 1; i++) {
      const mx = sx + i * tW / 3.2;
      const myOff = Math.abs(i) * tH / 7;
      isoBox(ctx, mx, sy - wallH + myOff + 1, mW, mW * 0.5, mH, stone);
    }
    // Flag pole + flag
    ctx.strokeStyle = '#4a3a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH - mH);
    ctx.lineTo(sx, sy - wallH - mH - 14 * roofPhase);
    ctx.stroke();
    const flagWave = Math.sin(time * 3.5) * 1.5;
    ctx.fillStyle = '#d03030';
    ctx.beginPath();
    ctx.moveTo(sx + 1, sy - wallH - mH - 14 * roofPhase);
    ctx.lineTo(sx + 9, sy - wallH - mH - 10 * roofPhase + flagWave);
    ctx.lineTo(sx + 1, sy - wallH - mH - 6 * roofPhase);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#901515';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawWorkshop(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#d4b890' : '#c4a878';
  const wallH = Math.round((16 + level * 3) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#8a7050');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.16));

  // Wood beam pattern on left face
  ctx.strokeStyle = 'rgba(80,50,20,0.3)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH * (i / 3));
    ctx.lineTo(sx - tw / 2, sy + th / 4 - wallH * (i / 3));
    ctx.stroke();
  }

  if (wallPhase > 0.3) {
    drawBoldDoor(ctx, sx - 4, sy - 9, 7, 8, '#5a3518');
  }
  if (wallPhase > 0.6) {
    // Anvil / workbench on right
    ctx.fillStyle = '#5a5050';
    ctx.fillRect(sx + tw / 6, sy - 4, 5, 3);
    ctx.fillStyle = '#3a3030';
    ctx.fillRect(sx + tw / 6, sy - 5, 3, 1.5);
    ctx.strokeStyle = '#2a2020';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx + tw / 6, sy - 4, 5, 3);
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (10 + level * 2) * roofPhase;
    drawBoldGableRoof(ctx, sx, sy, tw * 1.08, th * 1.08, wallH - 1, rH, '#6a4a22');
    drawChimney(ctx, sx + tw * 0.18, sy - wallH - rH * 0.4, 7, 10 + level * 2, '#5a3a2a', time);
    ctx.globalAlpha = 1;
  }
}

function drawMarket(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = '#dcc498';
  const wallH = Math.round((13 + level * 2) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#a08858');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.14));

  // Market counter on front
  if (wallPhase > 0.3) {
    const counterH = 5;
    isoBox(ctx, sx, sy + 1, tw * 0.85, th * 0.85, counterH, '#b09050');
    // Goods on counter
    const goods = ['#cc3030', '#30aa30', '#ccaa30', '#3060cc', '#cc6030'];
    for (let i = 0; i < 3 + level; i++) {
      const gx = sx - tw / 4 + i * 5;
      const gy = sy - counterH + 1;
      ctx.fillStyle = goods[i % goods.length];
      ctx.beginPath();
      ctx.arc(gx, gy - 1.5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darken(goods[i % goods.length], 0.3);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    // Striped canopy
    const canopyH = wallH + 7;
    const canopyW = tw * 1.18;
    const canopyTH = th * 1.18;
    const stripe1 = level >= 3 ? '#cc2828' : '#d04040';
    const stripe2 = '#f0e8d0';

    // Canopy top face with stripes
    isoTopFace(ctx, sx, sy, canopyW, canopyTH, canopyH, stripe1);
    ctx.strokeStyle = stripe2;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + i * canopyW / 5.5, sy - canopyH + canopyTH * 0.05);
      ctx.lineTo(sx + i * canopyW / 5.5 + canopyW / 4, sy - canopyH + canopyTH / 4 + canopyTH * 0.05);
      ctx.stroke();
    }

    // Support poles
    ctx.strokeStyle = '#5a3a18';
    ctx.lineWidth = 2;
    for (let p = -1; p <= 1; p += 2) {
      const px = sx + p * tw * 0.38;
      ctx.beginPath();
      ctx.moveTo(px, sy + 3);
      ctx.lineTo(px, sy + 3 - canopyH);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawBarracks(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#908870' : '#807860';
  const wallH = Math.round((20 + level * 4) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#585040');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.16));

  // Stone pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.4;
  for (let j = 1; j <= 4; j++) {
    const ry = sy - wallH * (j / 5);
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx - tw / 2, ry + th / 4);
    ctx.stroke();
  }

  if (wallPhase > 0.3) drawBoldDoor(ctx, sx - 4, sy - 11, 7, 10, '#3a2815');
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tw / 3, sy - wallH * 0.55, 4, 3.5, '#6ab0c8');
    if (level >= 2) drawBoldWindow(ctx, sx + tw / 5, sy - wallH * 0.53 + th / 8, 4, 3.5, '#6ab0c8');
  }

  if (wallPhase < 0.95) drawScaffolding(ctx, sx, sy, tw, wallH);

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (11 + level * 2) * roofPhase;
    drawBoldGableRoof(ctx, sx, sy, tw * 1.06, th * 1.06, wallH - 1, rH, '#5a5840');
    // Flag
    ctx.strokeStyle = '#4a3a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH - rH);
    ctx.lineTo(sx, sy - wallH - rH - 14);
    ctx.stroke();
    const fw = Math.sin(time * 3) * 1.5;
    ctx.fillStyle = '#cc3030';
    ctx.beginPath();
    ctx.moveTo(sx + 1, sy - wallH - rH - 14);
    ctx.lineTo(sx + 9, sy - wallH - rH - 10 + fw);
    ctx.lineTo(sx + 1, sy - wallH - rH - 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#881515';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawFarm(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);

  // Rich soil base
  const soilGrad = ctx.createLinearGradient(sx - tw / 2, sy, sx + tw / 2, sy + th / 2);
  soilGrad.addColorStop(0, '#7a5a2a');
  soilGrad.addColorStop(1, '#5a3a1a');
  ctx.fillStyle = soilGrad;
  ctx.beginPath();
  ctx.moveTo(sx, sy + 2);
  ctx.lineTo(sx + tw / 2, sy + 2 + th / 4);
  ctx.lineTo(sx, sy + 2 + th / 2);
  ctx.lineTo(sx - tw / 2, sy + 2 + th / 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a2a10';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Furrows
  if (foundPhase > 0.3) {
    ctx.strokeStyle = '#4a3010';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 5; i++) {
      const t = (i + 1) / 6;
      const x1 = sx - tw / 2 * (1 - t) + tw / 2 * t;
      const y1 = sy + th / 4 * (1 - t) + 2;
      const x2 = sx + tw / 2 * t - tw / 2 * (1 - t);
      ctx.beginPath();
      ctx.moveTo(x1 - tw / 3, y1 + th / 8);
      ctx.lineTo(x2 + tw / 3, y1 - th / 8);
      ctx.stroke();
    }
  }

  // Fence
  if (wallPhase > 0) {
    ctx.strokeStyle = '#8a6a30';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - tw / 2 + 2, sy + th / 4 - 3);
    ctx.lineTo(sx, sy - 3);
    ctx.lineTo(sx + tw / 2 - 2, sy + th / 4 - 3);
    ctx.stroke();
    // Fence posts
    for (let i = 0; i <= 2; i++) {
      const t = i / 2;
      const px = sx - tw / 2 + 2 + (tw / 2 - 2) * t;
      const py = sy + th / 4 - 3 - th / 4 * t;
      ctx.fillStyle = '#7a5a20';
      ctx.fillRect(px - 1, py - 4 * wallPhase, 2, 5 * wallPhase);
    }
  }

  // Crops
  if (roofPhase > 0) {
    const cropTypes = [
      { stalk: '#1a6a10', head: '#30aa20', headSize: 2.2 },
      { stalk: '#2a7a18', head: '#e8c820', headSize: 2 },
      { stalk: '#1a5a08', head: '#d04020', headSize: 1.8 },
    ];
    const numCrops = 5 + level * 3;
    for (let i = 0; i < numCrops; i++) {
      const t = (i + 0.5) / numCrops;
      const row = i % 4;
      const cx = sx - tw / 3 + tw * 0.66 * t;
      const cy = sy + th / 8 - th / 4 * t + 2 + row * 2;
      const crop = cropTypes[i % cropTypes.length];
      const sway = Math.sin(time * 1.5 + i * 1.1) * 0.8;
      const h = (4 + level * 0.8) * roofPhase;
      ctx.strokeStyle = crop.stalk;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + sway, cy - h);
      ctx.stroke();
      ctx.fillStyle = crop.head;
      ctx.beginPath();
      ctx.arc(cx + sway, cy - h, crop.headSize * roofPhase, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darken(crop.head, 0.3);
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }
}

function drawHospital(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#f0ece0' : '#e4e0d4';
  const wallH = Math.round((22 + level * 4) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#b0a898');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.1));

  if (wallPhase > 0.3) drawBoldDoor(ctx, sx - 3.5, sy - 10, 6, 9, '#508050');
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tw / 2.8, sy - wallH * 0.5, 5, 4, '#90d8f0');
    drawBoldWindow(ctx, sx + tw / 5 - 2, sy - wallH * 0.48 + th / 8, 5, 4, '#90d8f0');
  }
  if (level >= 2 && wallPhase > 0.7) {
    drawBoldWindow(ctx, sx - tw / 3.5, sy - wallH * 0.78, 4.5, 3.5, '#a0e0f8');
  }

  if (wallPhase < 0.95) drawScaffolding(ctx, sx, sy, tw, wallH);

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (11 + level * 2) * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.05, th * 1.05, wallH - 1, rH, '#889088');
    // Red cross
    const crossY = sy - wallH - rH + 3;
    const pulse = Math.sin(time * 2) * 0.08 + 0.92;
    ctx.globalAlpha = roofPhase * pulse;
    ctx.fillStyle = '#dd2222';
    ctx.fillRect(sx - 2, crossY - 1, 4, 9);
    ctx.fillRect(sx - 5, crossY + 2, 10, 3);
    ctx.strokeStyle = '#aa1111';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(sx - 2, crossY - 1, 4, 9);
    ctx.strokeRect(sx - 5, crossY + 2, 10, 3);
    ctx.globalAlpha = 1;
  }
}

function drawSchool(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#f0e0b0' : '#e0d098';
  const wallH = Math.round((22 + level * 4) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#a09060');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.13));

  if (wallPhase > 0.3) drawBoldDoor(ctx, sx - 3.5, sy - 10, 6, 9, '#4a3018');
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tw / 2.8, sy - wallH * 0.5, 5, 4, '#80c8e8');
    drawBoldWindow(ctx, sx + tw / 5 - 2, sy - wallH * 0.48 + th / 8, 5, 4, '#80c8e8');
  }
  if (level >= 2 && wallPhase > 0.7) {
    drawBoldWindow(ctx, sx - tw / 3.5, sy - wallH * 0.78, 5, 4, '#90d0f0');
    drawBoldWindow(ctx, sx + tw / 6, sy - wallH * 0.76 + th / 10, 5, 4, '#90d0f0');
  }

  if (wallPhase < 0.95) drawScaffolding(ctx, sx, sy, tw, wallH);

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (14 + level * 2) * roofPhase;
    drawBoldGableRoof(ctx, sx, sy, tw * 1.08, th * 1.08, wallH - 1, rH, level >= 3 ? '#992820' : '#b84030');
    // Bell tower
    const btH = 10 + level * 3;
    const btW = 8;
    isoBox(ctx, sx, sy - wallH - rH + 3, btW, btW * 0.5, btH * roofPhase, '#d8c890');
    // Bell
    if (roofPhase > 0.5) {
      ctx.fillStyle = '#c0a030';
      ctx.beginPath();
      ctx.arc(sx, sy - wallH - rH + 3 - btH * roofPhase + 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a7020';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    // Pointed cap
    const capTop = sy - wallH - rH + 3 - btH * roofPhase;
    ctx.fillStyle = '#8a3020';
    ctx.beginPath();
    ctx.moveTo(sx, capTop - 5);
    ctx.lineTo(sx - btW / 2 - 1, capTop);
    ctx.lineTo(sx + btW / 2 + 1, capTop);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a2010';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawChurch(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#f0ece0' : '#e8e0d4';
  const wallH = Math.round((24 + level * 4) * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#b0a898');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.1));

  // Stone texture on left
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.4;
  for (let j = 1; j <= 4; j++) {
    const ry = sy - wallH * (j / 5);
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx - tw / 2, ry + th / 4);
    ctx.stroke();
  }

  if (wallPhase > 0.3) {
    drawBoldDoor(ctx, sx - 4.5, sy - 13, 8, 12, '#5a3818');
    // Arched doorway
    ctx.strokeStyle = '#9a7a50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx - 0.5, sy - 13, 5, Math.PI, 0);
    ctx.stroke();
  }
  if (wallPhase > 0.5) {
    // Rose window
    ctx.fillStyle = 'rgba(200,160,60,0.45)';
    ctx.beginPath();
    ctx.arc(sx - tw / 4, sy - wallH * 0.65, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b09050';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Inner cross pattern
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx - tw / 4 - 3, sy - wallH * 0.65);
    ctx.lineTo(sx - tw / 4 + 3, sy - wallH * 0.65);
    ctx.moveTo(sx - tw / 4, sy - wallH * 0.65 - 3);
    ctx.lineTo(sx - tw / 4, sy - wallH * 0.65 + 3);
    ctx.stroke();
  }

  if (wallPhase < 0.95) drawScaffolding(ctx, sx, sy, tw, wallH);

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (14 + level * 2) * roofPhase;
    drawBoldGableRoof(ctx, sx, sy, tw * 1.05, th * 1.05, wallH - 1, rH, '#6a6058');

    // Steeple
    const steepleH = 22 + level * 4;
    const stW = 8;
    isoBox(ctx, sx, sy - wallH - rH + 4, stW, stW * 0.5, steepleH * roofPhase * 0.5, wallColor);
    const spireBase = sy - wallH - rH + 4 - steepleH * roofPhase * 0.5;
    ctx.fillStyle = '#7a6858';
    ctx.beginPath();
    ctx.moveTo(sx, spireBase - 10 * roofPhase);
    ctx.lineTo(sx - stW / 2 - 1, spireBase);
    ctx.lineTo(sx + stW / 2 + 1, spireBase);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a4838';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Cross
    const crossTop = spireBase - 10 * roofPhase;
    ctx.strokeStyle = '#d0a030';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx, crossTop - 6);
    ctx.lineTo(sx, crossTop + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx - 3.5, crossTop - 3);
    ctx.lineTo(sx + 3.5, crossTop - 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawWell(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stone = '#b8b0a0';
  const wellW = tw * 0.65;
  const wellH = th * 0.65;
  const wH = Math.round(10 * foundPhase);

  drawFoundation(ctx, sx, sy, tw * 0.85, th * 0.85, '#908878');
  if (wH < 3) return;

  isoBox(ctx, sx, sy, wellW, wellH, wH, stone);

  // Water inside
  if (wallPhase > 0) {
    ctx.fillStyle = '#4080a0';
    ctx.beginPath();
    ctx.ellipse(sx, sy - wH + wellH * 0.22, wellW * 0.22, wellH * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    const shimmer = Math.sin(time * 2.5) * 0.12;
    ctx.fillStyle = `rgba(110,200,240,${0.35 + shimmer})`;
    ctx.beginPath();
    ctx.ellipse(sx - 1, sy - wH + wellH * 0.2, wellW * 0.14, wellH * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Roof structure
  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    // Posts
    ctx.strokeStyle = '#5a3a18';
    ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(sx + i * wellW * 0.35, sy - wH);
      ctx.lineTo(sx + i * wellW * 0.35, sy - wH - 12 * roofPhase);
      ctx.stroke();
    }
    // Roof beam
    const roofY = sy - wH - 12 * roofPhase;
    ctx.fillStyle = '#8a6030';
    ctx.beginPath();
    ctx.moveTo(sx, roofY - 5);
    ctx.lineTo(sx - wellW * 0.5, roofY + 2);
    ctx.lineTo(sx + wellW * 0.5, roofY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a3a18';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Rope + bucket
    ctx.strokeStyle = '#8a7040';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, roofY);
    ctx.lineTo(sx + 2, sy - wH - 2);
    ctx.stroke();
    ctx.fillStyle = '#7a5a28';
    ctx.fillRect(sx, sy - wH - 4, 4, 4);
    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(sx, sy - wH - 4, 4, 4);
    ctx.globalAlpha = 1;
  }
}

function drawFountain(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, roofPhase } = getPhases(progress);
  const stone = '#c0b8a0';

  drawFoundation(ctx, sx, sy, tw * 0.9, th * 0.9, '#a09880');

  if (foundPhase > 0.5) {
    const baseH = 6;
    isoBox(ctx, sx, sy, tw * 0.75, th * 0.75, baseH, stone);

    // Water basin
    ctx.fillStyle = '#3878a0';
    ctx.beginPath();
    ctx.ellipse(sx, sy - baseH + th * 0.08, tw * 0.23, th * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darken(stone, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy - baseH + th * 0.08, tw * 0.26, th * 0.13, 0, 0, Math.PI * 2);
    ctx.stroke();

    const shimmer = Math.sin(time * 3) * 0.15;
    ctx.fillStyle = `rgba(120,210,255,${0.4 + shimmer})`;
    ctx.beginPath();
    ctx.ellipse(sx - 1, sy - baseH + th * 0.06, tw * 0.15, th * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Central pillar + water spray
    if (roofPhase > 0) {
      ctx.fillStyle = stone;
      ctx.fillRect(sx - 1.5, sy - baseH - 6 * roofPhase, 3, 7 * roofPhase);
      ctx.strokeStyle = darken(stone, 0.3);
      ctx.lineWidth = 0.6;
      ctx.strokeRect(sx - 1.5, sy - baseH - 6 * roofPhase, 3, 7 * roofPhase);
      // Water drops
      for (let i = 0; i < 4; i++) {
        const dx = Math.sin(time * 4 + i * 1.7) * (3 + i);
        const dy = i * 2 + Math.abs(Math.sin(time * 3 + i)) * 2;
        ctx.fillStyle = `rgba(120,210,255,${0.6 - i * 0.12})`;
        ctx.beginPath();
        ctx.arc(sx + dx, sy - baseH - 6 * roofPhase + dy, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawWindmill(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stone = '#d8d0b8';
  const bodyW = tw * 0.55;
  const bodyH = th * 0.55;
  const wallH = Math.round((32 + level * 6) * foundPhase);

  drawFoundation(ctx, sx, sy, tw * 0.7, th * 0.7, '#908878');
  if (wallH < 4) return;

  // Tapered body
  isoLeftFace(ctx, sx, sy, bodyW, bodyH, wallH, stone);
  isoRightFace(ctx, sx, sy, bodyW, bodyH, wallH, darken(stone, 0.14));

  // Stone lines
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.4;
  for (let j = 1; j <= 5; j++) {
    const ry = sy - wallH * (j / 6);
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx - bodyW / 2, ry + bodyH / 4);
    ctx.stroke();
  }

  if (wallPhase > 0.3) drawBoldDoor(ctx, sx - 2.5, sy - 8, 4, 7, '#5a3818');
  if (wallPhase > 0.5) drawBoldWindow(ctx, sx - bodyW / 4, sy - wallH * 0.5, 3.5, 4.5, '#80c0e0');
  if (level >= 2 && wallPhase > 0.7) drawBoldWindow(ctx, sx - bodyW / 5, sy - wallH * 0.72, 3, 4, '#80c0e0');

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    // Conical cap
    const capColor = '#8a6a40';
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH - 10 * roofPhase);
    ctx.lineTo(sx - bodyW / 2 - 2, sy - wallH + bodyH / 4);
    ctx.lineTo(sx + bodyW / 2 + 2, sy - wallH + bodyH / 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(capColor, 0.4);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Sails
    const hubY = sy - wallH - 5 * roofPhase;
    const sailAngle = time * 1.4;
    const sailLen = 18 + level * 3;
    for (let i = 0; i < 4; i++) {
      const a = sailAngle + (i * Math.PI / 2);
      const endX = sx + Math.cos(a) * sailLen;
      const endY = hubY + Math.sin(a) * sailLen * 0.42;
      // Sail arm
      ctx.strokeStyle = '#5a3a15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, hubY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      // Sail canvas
      const nextA = a + 0.3;
      const midLen = sailLen * 0.85;
      const sideLen = sailLen * 0.7;
      ctx.fillStyle = 'rgba(240,230,200,0.7)';
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * sailLen * 0.22, hubY + Math.sin(a) * sailLen * 0.22 * 0.42);
      ctx.lineTo(sx + Math.cos(a) * midLen, hubY + Math.sin(a) * midLen * 0.42);
      ctx.lineTo(sx + Math.cos(nextA) * sideLen, hubY + Math.sin(nextA) * sideLen * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,60,20,0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    // Hub
    ctx.fillStyle = '#4a2a10';
    ctx.beginPath();
    ctx.arc(sx, hubY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1a08';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawWall(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress } = d;
  const { foundPhase } = getPhases(progress);
  const wH = Math.round((9 + level * 3) * foundPhase);
  if (wH < 2) return;

  const wallColor = level >= 3 ? '#9a8a68' : '#8a7a58';
  isoBox(ctx, sx, sy + 1, tw, th, wH, wallColor);

  // Pointed stakes on top
  for (let i = -2; i <= 2; i++) {
    const px = sx + i * tw / 5.5;
    const py = sy + 1 - wH + Math.abs(i) * th / 12;
    ctx.fillStyle = darken(wallColor, 0.05);
    ctx.beginPath();
    ctx.moveTo(px, py - 4);
    ctx.lineTo(px - 2, py);
    ctx.lineTo(px + 2, py);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(wallColor, 0.4);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  if (level >= 3) {
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.4;
    for (let j = 1; j <= 2; j++) {
      const ry = sy + 1 - wH * (j / 3);
      ctx.beginPath();
      ctx.moveTo(sx, ry);
      ctx.lineTo(sx - tw / 2, ry + th / 4);
      ctx.stroke();
    }
  }
}

function drawGarden(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { roofPhase } = getPhases(progress);

  drawFoundation(ctx, sx, sy, tw * 0.85, th * 0.85, '#5a8a3a');

  if (roofPhase > 0) {
    const bushColors = ['#2a8a1a', '#38a228', '#45b435', '#2d9020'];
    const numBushes = 2 + level;
    for (let i = 0; i < numBushes; i++) {
      const bx = sx + (i - numBushes / 2 + 0.5) * 6;
      const by = sy - 2 + Math.sin(i * 2.1) * 2;
      const size = (4 + level * 0.5) * roofPhase;
      const sway = Math.sin(time * 1.2 + i) * 0.5;
      // Shadow
      ctx.fillStyle = darken(bushColors[i % bushColors.length], 0.25);
      ctx.beginPath();
      ctx.arc(bx + sway + 1, by - size + 2, size * 0.85, 0, Math.PI * 2);
      ctx.fill();
      // Bush
      ctx.fillStyle = bushColors[i % bushColors.length];
      ctx.beginPath();
      ctx.arc(bx + sway, by - size, size, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = lighten(bushColors[i % bushColors.length], 0.25);
      ctx.beginPath();
      ctx.arc(bx + sway - size * 0.3, by - size - size * 0.3, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darken(bushColors[i % bushColors.length], 0.35);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(bx + sway, by - size, size, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (level >= 2) {
      const flowerColors = ['#e84060', '#f0d040', '#e88040', '#f060a0'];
      for (let i = 0; i < level + 1; i++) {
        const fx = sx + (i - level / 2) * 5;
        const fy = sy + 2;
        ctx.strokeStyle = '#2a7a10';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy - 4 * roofPhase);
        ctx.stroke();
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        ctx.beginPath();
        ctx.arc(fx, fy - 4 * roofPhase - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darken(flowerColors[i % flowerColors.length], 0.2);
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    }
  }
}

function drawStatue(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stone = '#b8b0a0';

  drawFoundation(ctx, sx, sy, tw * 0.7, th * 0.7, '#908878');

  if (foundPhase > 0.5) {
    const pedH = 9;
    isoBox(ctx, sx, sy, tw * 0.4, th * 0.4, pedH * foundPhase, stone);

    if (wallPhase > 0) {
      const figH = (14 + level * 2) * wallPhase;
      const figY = sy - pedH * foundPhase;
      // Body
      ctx.fillStyle = '#8a7a68';
      ctx.fillRect(sx - 2.5, figY - figH, 5, figH);
      ctx.strokeStyle = '#6a5a48';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(sx - 2.5, figY - figH, 5, figH);
      // Head
      ctx.fillStyle = '#8a7a68';
      ctx.beginPath();
      ctx.arc(sx, figY - figH - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6a5a48';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Arms
      if (roofPhase > 0) {
        ctx.strokeStyle = '#7a6a58';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - 2.5, figY - figH * 0.6);
        ctx.lineTo(sx - 6, figY - figH * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + 2.5, figY - figH * 0.6);
        ctx.lineTo(sx + 6, figY - figH * 0.4);
        ctx.stroke();
      }
    }
  }
}

// ===== MONUMENTS =====

function drawMonumentCastle(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stone = '#b8a898';
  const wallH = Math.round(36 * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#887868');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, stone);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(stone, 0.18));

  // Stone blocks
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  for (let j = 1; j <= 5; j++) {
    const ry = sy - wallH * (j / 6);
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx - tw / 2, ry + th / 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx + tw / 2, ry + th / 4);
    ctx.stroke();
  }

  if (wallPhase > 0.3) {
    drawBoldDoor(ctx, sx - 4, sy - 12, 7, 11, '#3a2510');
    ctx.fillStyle = darken(stone, 0.1);
    ctx.fillRect(sx - 5.5, sy - 13.5, 10, 2.5);
  }
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tw / 3, sy - wallH * 0.5, 3.5, 5, '#6ab0c8');
    drawBoldWindow(ctx, sx + tw / 5 - 1, sy - wallH * 0.48 + th / 8, 3.5, 5, '#6ab0c8');
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    isoTopFace(ctx, sx, sy, tw, th, wallH, lighten(stone, 0.1));

    // Merlons
    const mH = 6;
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const mx = sx + i * tw / 5;
      const myOff = Math.abs(i) * th / 10;
      isoBox(ctx, mx, sy - wallH + myOff + 1, tw * 0.11, th * 0.11, mH, stone);
    }

    // Corner towers with conical roofs
    for (let c = -1; c <= 1; c += 2) {
      const tx = sx + c * tw * 0.35;
      const tyOff = c > 0 ? th / 6 : 0;
      const towerH = 16 * roofPhase;
      isoBox(ctx, tx, sy - wallH + tyOff, tw * 0.2, th * 0.2, towerH, darken(stone, 0.05));
      // Conical roof
      const coneBase = sy - wallH + tyOff - towerH;
      ctx.fillStyle = '#8a3a18';
      ctx.beginPath();
      ctx.moveTo(tx, coneBase - 8);
      ctx.lineTo(tx - tw * 0.12, coneBase);
      ctx.lineTo(tx + tw * 0.12, coneBase);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6a2a10';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Central flag
    ctx.strokeStyle = '#4a3a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH - mH);
    ctx.lineTo(sx, sy - wallH - mH - 12);
    ctx.stroke();
    const fw = Math.sin(time * 3) * 1.5;
    ctx.fillStyle = '#d03030';
    ctx.beginPath();
    ctx.moveTo(sx + 1, sy - wallH - mH - 12);
    ctx.lineTo(sx + 8, sy - wallH - mH - 9 + fw);
    ctx.lineTo(sx + 1, sy - wallH - mH - 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#901515';
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.globalAlpha = 1;
  }
}

function drawTorreBelem(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stone = '#e8dcc0';
  const wallH = Math.round(40 * foundPhase);
  const mainW = tw * 0.75;
  const mainH = th * 0.75;

  drawFoundation(ctx, sx, sy, tw, th, '#c0b898');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, mainW, mainH, wallH, stone);
  isoRightFace(ctx, sx, sy, mainW, mainH, wallH, darken(stone, 0.14));

  // Gothic arches on left wall
  if (wallPhase > 0.3) {
    ctx.strokeStyle = 'rgba(180,160,110,0.7)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      const ay = sy - wallH * (0.3 + i * 0.2);
      const ax = sx - mainW / 4;
      ctx.beginPath();
      ctx.arc(ax, ay, 3, Math.PI, 0);
      ctx.stroke();
    }
  }
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - mainW / 4, sy - wallH * 0.6, 3.5, 5, '#7ec8e8');
    drawBoldWindow(ctx, sx + mainW / 5, sy - wallH * 0.55 + mainH / 8, 3.5, 5, '#7ec8e8');
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    isoTopFace(ctx, sx, sy, mainW, mainH, wallH, lighten(stone, 0.08));

    // Balcony ledge
    const balconyH = 4;
    isoBox(ctx, sx, sy - wallH * 0.5, tw * 0.9, th * 0.9, balconyH, darken(stone, 0.04));

    // Merlons
    for (let i = -1; i <= 1; i++) {
      const mx = sx + i * mainW / 3.5;
      const myOff = Math.abs(i) * mainH / 7;
      isoBox(ctx, mx, sy - wallH + myOff, mainW * 0.13, mainH * 0.13, 5, stone);
    }

    // Turrets on corners
    for (let c = -1; c <= 1; c += 2) {
      const tx = sx + c * mainW * 0.35;
      const tOff = c > 0 ? mainH / 7 : 0;
      isoBox(ctx, tx, sy - wallH + tOff, mainW * 0.18, mainH * 0.18, 10 * roofPhase, lighten(stone, 0.05));
      ctx.fillStyle = '#a08050';
      ctx.beginPath();
      ctx.arc(tx, sy - wallH + tOff - 10 * roofPhase - 1, mainW * 0.06, Math.PI, 0);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}

function drawUniversidade(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = '#e8d8a8';
  const wallH = Math.round(34 * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#b0a070');
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.14));

  if (wallPhase > 0.3) {
    drawBoldDoor(ctx, sx - 4, sy - 13, 7, 12, '#4a3018');
    ctx.fillStyle = darken(wallColor, 0.15);
    ctx.fillRect(sx - 5.5, sy - 14, 10, 2);
  }
  if (wallPhase > 0.5) {
    for (let r = 0; r < 2; r++) {
      for (let c = -1; c <= 1; c += 2) {
        drawBoldWindow(ctx, sx + c * tw / 3.5 - 2.5, sy - wallH * (0.4 + r * 0.22), 5, 4, '#80c8e8');
      }
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = 10 * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.05, th * 1.05, wallH - 1, rH, '#8a6030');

    // Clock tower
    const tH = 24 * roofPhase;
    const tW2 = 10;
    isoBox(ctx, sx, sy - wallH - rH + 4, tW2, tW2 * 0.5, tH, wallColor);
    // Clock face
    const clockY = sy - wallH - rH + 4 - tH * 0.45;
    ctx.fillStyle = '#f8f4e0';
    ctx.beginPath();
    ctx.arc(sx, clockY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4a30';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(sx, clockY);
    ctx.lineTo(sx, clockY - 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, clockY);
    ctx.lineTo(sx + 2, clockY + 0.5);
    ctx.stroke();
    // Dome on top
    const domeY = sy - wallH - rH + 4 - tH;
    ctx.fillStyle = '#6a4a28';
    ctx.beginPath();
    ctx.arc(sx, domeY + 2.5, tW2 * 0.38, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawTemploRomano(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stone = '#e0d8c8';
  const wallH = Math.round(30 * foundPhase);

  // Raised platform
  const platH = 6;
  isoBox(ctx, sx, sy + 2, tw * 1.08, th * 1.08, platH, darken(stone, 0.08));
  if (wallH < 6) return;

  // Columns
  if (wallPhase > 0) {
    const numCols = 5;
    for (let i = 0; i < numCols; i++) {
      const t = (i + 0.5) / numCols;
      const colX = sx - tw / 2 * 0.65 + tw * 0.65 * t;
      const colYBase = sy - platH + th / 4 * (0.5 - t) + 2;
      const colH = wallH * 0.8 * wallPhase;
      const colW = 3.5;
      // Column shaft
      isoBox(ctx, colX, colYBase, colW, colW * 0.5, colH, stone);
      // Capital (top)
      isoBox(ctx, colX, colYBase - colH + 0.5, colW + 1.5, colW * 0.5 + 0.5, 2, lighten(stone, 0.1));
      // Base
      isoBox(ctx, colX, colYBase + 0.5, colW + 1, colW * 0.5 + 0.3, 1.5, darken(stone, 0.05));
    }
  }

  // Entablature + pediment
  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const entH = 4;
    const entY = sy - platH - wallH * 0.8 + 2;
    isoBox(ctx, sx, entY, tw * 0.85, th * 0.85, entH, lighten(stone, 0.05));

    // Pediment (triangular)
    const pedH = 12 * roofPhase;
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.moveTo(sx, entY - entH - pedH);
    ctx.lineTo(sx - tw * 0.42, entY - entH);
    ctx.lineTo(sx, entY - entH + th * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(stone, 0.1);
    ctx.beginPath();
    ctx.moveTo(sx, entY - entH - pedH);
    ctx.lineTo(sx + tw * 0.42, entY - entH);
    ctx.lineTo(sx, entY - entH + th * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(stone, 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, entY - entH - pedH);
    ctx.lineTo(sx - tw * 0.42, entY - entH);
    ctx.moveTo(sx, entY - entH - pedH);
    ctx.lineTo(sx + tw * 0.42, entY - entH);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawBridge(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, progress } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const metal = '#a0a098';
  const bridgeH = 18 * foundPhase;

  drawFoundation(ctx, sx, sy, tw, th, '#707068');
  if (bridgeH < 4) return;

  isoBox(ctx, sx, sy, tw, th, bridgeH, metal);

  // Arches
  if (wallPhase > 0) {
    ctx.strokeStyle = 'rgba(40,40,40,0.3)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      const ax = sx + i * tw / 3;
      ctx.beginPath();
      ctx.arc(ax - tw / 6, sy - bridgeH * 0.35, bridgeH * 0.35, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }
  }

  // Railings
  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const railH = 5;
    // Posts
    for (let i = -2; i <= 2; i++) {
      const px = sx - tw / 2 + (i + 2) * tw / 4;
      const py = sy - bridgeH + th / 4 * ((i + 2) / 4);
      ctx.fillStyle = '#808078';
      ctx.fillRect(px - 1, py - railH, 2, railH);
    }
    // Rail line
    ctx.strokeStyle = '#909088';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - tw / 2, sy - bridgeH - railH + th / 4);
    ctx.lineTo(sx, sy - bridgeH - railH + th / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, sy - bridgeH - railH);
    ctx.lineTo(sx + tw / 2, sy - bridgeH - railH + th / 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawGenericMonument(d: DrawCtx, accentColor: string) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = lighten(accentColor, 0.4);
  const wallH = Math.round(30 * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, darken(accentColor, 0.2));
  if (wallH < 4) return;

  isoLeftFace(ctx, sx, sy, tw, th, wallH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wallH, darken(wallColor, 0.16));

  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.4;
  for (let j = 1; j <= 4; j++) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH * (j / 5));
    ctx.lineTo(sx - tw / 2, sy + th / 4 - wallH * (j / 5));
    ctx.stroke();
  }

  if (wallPhase > 0.3) drawBoldDoor(ctx, sx - 3.5, sy - 11, 6, 10, darken(accentColor, 0.4));
  if (wallPhase > 0.5) {
    drawBoldWindow(ctx, sx - tw / 2.8, sy - wallH * 0.5, 4.5, 4, '#80c8e8');
    drawBoldWindow(ctx, sx + tw / 5 - 2, sy - wallH * 0.48 + th / 8, 4.5, 4, '#80c8e8');
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = 12 * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.05, th * 1.05, wallH - 1, rH, darken(accentColor, 0.1));

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wallH - rH - 10 * roofPhase);
    ctx.lineTo(sx - 4, sy - wallH - rH);
    ctx.lineTo(sx + 4, sy - wallH - rH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(accentColor, 0.4);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ===== MAIN EXPORT =====

export function drawIsoBuilding(
  ctx: CanvasRenderingContext2D,
  defId: string,
  sx: number, sy: number,
  bw: number, bh: number,
  level: number, progress: number, time: number
) {
  const tw = TILE_W * bw;
  const th = TILE_H * bh;
  const d: DrawCtx = { ctx, sx, sy, tw, th, level, progress, time };

  if (progress < 0.01) {
    ctx.strokeStyle = '#c8963c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, sy - 2);
    ctx.lineTo(sx + tw / 2, sy - 2 + th / 4);
    ctx.lineTo(sx, sy - 2 + th / 2);
    ctx.lineTo(sx - tw / 2, sy - 2 + th / 4);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  switch (defId) {
    case 'house': drawHouse(d); break;
    case 'mansion': drawMansion(d); break;
    case 'tower': drawTower(d); break;
    case 'workshop': drawWorkshop(d); break;
    case 'market': drawMarket(d); break;
    case 'barracks': drawBarracks(d); break;
    case 'farm': drawFarm(d); break;
    case 'hospital': drawHospital(d); break;
    case 'school_building': drawSchool(d); break;
    case 'church': drawChurch(d); break;
    case 'well': drawWell(d); break;
    case 'fountain': drawFountain(d); break;
    case 'windmill': drawWindmill(d); break;
    case 'wall': drawWall(d); break;
    case 'road': break;
    case 'garden': drawGarden(d); break;
    case 'statue': drawStatue(d); break;
    case 'torre_belem': drawTorreBelem(d); break;
    case 'universidade_coimbra': drawUniversidade(d); break;
    case 'templo_romano': drawTemploRomano(d); break;
    case 'ponte_dom_luis':
    case 'moliceiro_aveiro': drawBridge(d); break;
    case 'castelo_guimaraes':
    case 'castelo_braganca':
    case 'castelo_beja':
    case 'castelo_leiria':
    case 'castelo_marvao':
    case 'castelo_almourol':
    case 'castelo_palmela': drawMonumentCastle(d); break;
    case 'fortaleza_sagres': drawGenericMonument(d, '#a09070'); break;
    case 'jardim_episcopal': drawGenericMonument(d, '#5a9a4a'); break;
    case 'se_guarda':
    case 'se_viseu': drawGenericMonument(d, '#b0a090'); break;
    case 'santuario_luzia': drawGenericMonument(d, '#c8b090'); break;
    case 'solar_mateus': drawGenericMonument(d, '#c8a868'); break;
    case 'lagoa_sete_cidades': drawGenericMonument(d, '#4a8a68'); break;
    case 'monte_funchal': drawGenericMonument(d, '#6a9a50'); break;
    default: {
      const def = BUILDING_DEFS[defId];
      if (def) drawGenericMonument(d, '#b0a080');
      break;
    }
  }

  // Construction overlay
  if (progress > 0.01 && progress < 1) {
    const wallH = 20 + level * 3;
    if (progress < 0.6) drawScaffolding(ctx, sx, sy, tw, Math.round(wallH * Math.min(progress / 0.33, 1)));
    drawProgressBar(ctx, sx, sy, sy - wallH - 10, tw, progress);
  }
}

export function drawConstructionDust(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, time: number) {
  ctx.strokeStyle = '#c8963c';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(sx, sy - 2);
  ctx.lineTo(sx + tw / 2, sy - 2 + TILE_H / 4);
  ctx.lineTo(sx, sy - 2 + TILE_H / 2);
  ctx.lineTo(sx - tw / 2, sy - 2 + TILE_H / 4);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  const puff = Math.abs(Math.sin(time * 4));
  ctx.fillStyle = `rgba(200,180,120,${puff * 0.4})`;
  ctx.beginPath();
  ctx.arc(sx, sy - 5, 6 * puff, 0, Math.PI * 2);
  ctx.fill();
}
