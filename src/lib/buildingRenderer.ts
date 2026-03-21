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

function isoLeftFace(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx - w / 2, sy + h / 4);
  ctx.lineTo(sx - w / 2, sy + h / 4 - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function isoRightFace(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + w / 2, sy + h / 4);
  ctx.lineTo(sx + w / 2, sy + h / 4 - wallH);
  ctx.lineTo(sx, sy - wallH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function isoTopFace(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, fill: string) {
  ctx.beginPath();
  ctx.moveTo(sx, sy - wallH);
  ctx.lineTo(sx + w / 2, sy - wallH + h / 4);
  ctx.lineTo(sx, sy - wallH + h / 2);
  ctx.lineTo(sx - w / 2, sy - wallH + h / 4);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function isoBox(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, baseColor: string) {
  isoLeftFace(ctx, sx, sy, w, h, wallH, darken(baseColor, 0.15));
  isoRightFace(ctx, sx, sy, w, h, wallH, darken(baseColor, 0.28));
  isoTopFace(ctx, sx, sy, w, h, wallH, baseColor);
}

function isoBoxEdges(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, wallH: number, alpha = 0.2) {
  ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - wallH);
  ctx.moveTo(sx - w / 2, sy + h / 4); ctx.lineTo(sx - w / 2, sy + h / 4 - wallH);
  ctx.moveTo(sx + w / 2, sy + h / 4); ctx.lineTo(sx + w / 2, sy + h / 4 - wallH);
  ctx.moveTo(sx, sy - wallH);
  ctx.lineTo(sx + w / 2, sy - wallH + h / 4);
  ctx.lineTo(sx, sy - wallH + h / 2);
  ctx.lineTo(sx - w / 2, sy - wallH + h / 4);
  ctx.closePath();
  ctx.stroke();
}

function drawFoundation(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, th: number, color: string) {
  const fH = 3;
  isoLeftFace(ctx, sx, sy + 1, tw, th, fH, darken(color, 0.2));
  isoRightFace(ctx, sx, sy + 1, tw, th, fH, darken(color, 0.35));
  isoTopFace(ctx, sx, sy + 1, tw, th, fH, color);
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isLeft: boolean) {
  const shutterColor = '#5a4020';
  ctx.fillStyle = 'rgba(60,80,120,0.85)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(100,150,220,0.4)';
  ctx.fillRect(x + 0.5, y + 0.5, w * 0.45, h * 0.45);
  ctx.strokeStyle = isLeft ? '#7a5a30' : '#6a4a20';
  ctx.lineWidth = 0.4;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  if (w > 3) {
    ctx.fillStyle = shutterColor;
    ctx.fillRect(x - 1, y, 1, h);
    ctx.fillRect(x + w, y, 1, h);
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + 2);
  ctx.quadraticCurveTo(x + w / 2, y - 1, x + w, y + 2);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.3);
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.fillStyle = '#c0a040';
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.5, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawGableRoof(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, th: number, wallH: number, roofH: number, color: string) {
  const topY = sy - wallH;
  const peakY = topY - roofH;
  ctx.fillStyle = darken(color, 0.1);
  ctx.beginPath();
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx + tw / 2, topY + th / 4);
  ctx.lineTo(sx, topY + th / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx - tw / 2, topY + th / 4);
  ctx.lineTo(sx, topY + th / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.35);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx + tw / 2, topY + th / 4);
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx - tw / 2, topY + th / 4);
  ctx.moveTo(sx, peakY);
  ctx.lineTo(sx, topY + th / 2);
  ctx.stroke();
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = darken(color, 0.4);
    ctx.lineWidth = 0.3;
    const ly = peakY + (topY + th / 4 - peakY) * t;
    const lx1 = sx - (tw / 2) * t;
    const lx2 = sx;
    ctx.beginPath();
    ctx.moveTo(lx1, ly);
    ctx.lineTo(lx2, ly + th / 4 * t);
    ctx.stroke();
    const ry = peakY + (topY + th / 4 - peakY) * t;
    const rx1 = sx + (tw / 2) * t;
    ctx.beginPath();
    ctx.moveTo(rx1, ry);
    ctx.lineTo(sx, ry + th / 4 * t);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawHipRoof(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, th: number, wallH: number, roofH: number, color: string) {
  const topY = sy - wallH;
  const peakY = topY - roofH;
  const ridgeW = tw * 0.25;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx - ridgeW / 2, peakY);
  ctx.lineTo(sx - tw / 2, topY + th / 4);
  ctx.lineTo(sx, topY + th / 2);
  ctx.lineTo(sx + ridgeW / 2, peakY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(color, 0.12);
  ctx.beginPath();
  ctx.moveTo(sx + ridgeW / 2, peakY);
  ctx.lineTo(sx + tw / 2, topY + th / 4);
  ctx.lineTo(sx, topY + th / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(color, 0.05);
  ctx.beginPath();
  ctx.moveTo(sx - ridgeW / 2, peakY);
  ctx.lineTo(sx - tw / 2, topY + th / 4);
  ctx.lineTo(sx, topY);
  ctx.lineTo(sx + ridgeW / 2, peakY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(color, 0.18);
  ctx.beginPath();
  ctx.moveTo(sx + ridgeW / 2, peakY);
  ctx.lineTo(sx + tw / 2, topY + th / 4);
  ctx.lineTo(sx, topY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.35);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(sx - ridgeW / 2, peakY);
  ctx.lineTo(sx + ridgeW / 2, peakY);
  ctx.stroke();
}

function drawStoneTexture(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rows: number, isLeft: boolean) {
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.3;
  const rowH = h / rows;
  for (let r = 0; r < rows; r++) {
    const ry = y + r * rowH;
    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(x, ry);
      ctx.lineTo(x + w, ry - w * 0.25);
    } else {
      ctx.moveTo(x, ry);
      ctx.lineTo(x + w, ry - w * 0.25);
    }
    ctx.stroke();
    const offset = r % 2 === 0 ? w * 0.4 : w * 0.6;
    ctx.beginPath();
    ctx.moveTo(x + offset, ry);
    ctx.lineTo(x + offset, ry + rowH);
    ctx.stroke();
  }
}

function drawChimney(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, time: number) {
  isoLeftFace(ctx, x, y + h, w, w * 0.5, h, darken(color, 0.1));
  isoRightFace(ctx, x, y + h, w, w * 0.5, h, darken(color, 0.25));
  isoTopFace(ctx, x, y + h, w, w * 0.5, h, color);
  ctx.fillStyle = 'rgba(50,50,50,0.6)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.2, w * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  const smokeAlpha = (Math.sin(time * 3) + 1) * 0.15;
  for (let i = 0; i < 3; i++) {
    const so = Math.sin(time * 2 + i) * 2;
    ctx.fillStyle = `rgba(180,180,180,${smokeAlpha - i * 0.03})`;
    ctx.beginPath();
    ctx.arc(x + so, y - 3 - i * 4, 2 + i, 0, Math.PI * 2);
    ctx.fill();
  }
}

function woodBeamPattern(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, wallH: number, isLeft: boolean) {
  ctx.strokeStyle = 'rgba(90,60,30,0.35)';
  ctx.lineWidth = 0.8;
  const halfW = tw / 2;
  const qH = wallH / 3;
  for (let i = 1; i <= 2; i++) {
    const bY = sy - qH * i;
    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(sx, bY);
      ctx.lineTo(sx - halfW, bY + halfW * 0.25);
    } else {
      ctx.moveTo(sx, bY);
      ctx.lineTo(sx + halfW, bY + halfW * 0.25);
    }
    ctx.stroke();
  }
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(sx - halfW * 0.5, sy + halfW * 0.125);
    ctx.lineTo(sx - halfW * 0.5, sy + halfW * 0.125 - wallH);
  } else {
    ctx.moveTo(sx + halfW * 0.5, sy + halfW * 0.125);
    ctx.lineTo(sx + halfW * 0.5, sy + halfW * 0.125 - wallH);
  }
  ctx.stroke();
}

function getPhases(progress: number) {
  const wallPhase = Math.min(Math.max((progress - 0.33) / 0.33, 0), 1);
  const roofPhase = Math.min(Math.max((progress - 0.66) / 0.34, 0), 1);
  const foundPhase = Math.min(progress / 0.33, 1);
  return { foundPhase, wallPhase, roofPhase };
}

function drawConstructionScaffolding(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, wallH: number, time: number) {
  ctx.strokeStyle = '#a08040';
  ctx.lineWidth = 0.8;
  const poleH = wallH * 1.1;
  for (let i = -1; i <= 1; i += 2) {
    const px = sx + i * tw * 0.35;
    ctx.beginPath();
    ctx.moveTo(px, sy + 2);
    ctx.lineTo(px, sy + 2 - poleH);
    ctx.stroke();
  }
  for (let j = 1; j <= 3; j++) {
    const hy = sy + 2 - poleH * (j / 4);
    ctx.beginPath();
    ctx.moveTo(sx - tw * 0.35, hy);
    ctx.lineTo(sx + tw * 0.35, hy);
    ctx.stroke();
  }
  ctx.fillStyle = '#b09050';
  ctx.fillRect(sx - tw * 0.35, sy + 2 - poleH * 0.75, tw * 0.7, 2);
}

function drawProgressBar(ctx: CanvasRenderingContext2D, sx: number, sy: number, wallH: number, tw: number, progress: number, time: number) {
  const barW = tw * 0.5;
  const barX = sx - barW / 2;
  const barY = sy - wallH - 18;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(barX - 2, barY - 2, barW + 4, 10, 4);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 6, 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(barX, barY, barX + barW * progress, barY);
  grad.addColorStop(0, '#e8a020');
  grad.addColorStop(1, '#f0c040');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * progress, 6, 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * progress, 3, [2, 2, 0, 0]);
  ctx.fill();
}

// ===== INDIVIDUAL BUILDING RENDERERS =====

function drawHouse(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#c8b090' : '#d4b896';
  const roofColor = level >= 4 ? '#8b4513' : level >= 2 ? '#9a5a1a' : '#8b6914';
  const baseWallH = 16 + level * 3;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#a08868');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.14));

  if (wallPhase > 0) {
    woodBeamPattern(ctx, sx, sy, tw, wH, true);
    woodBeamPattern(ctx, sx, sy, tw, wH, false);

    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 3, sy - 8, 5, 7, '#5a3a18');
    }
    if (wallPhase > 0.7) {
      drawWindow(ctx, sx - tw / 4 - 1.5, sy - wH * 0.6, 4, 3.5, true);
    }
    if (level >= 2 && wallPhase > 0.8) {
      drawWindow(ctx, sx + tw / 4 - 3, sy - wH * 0.6 + th / 8, 4, 3.5, false);
    }
  }

  if (wallPhase < 1) {
    drawConstructionScaffolding(ctx, sx, sy, tw, wH, time);
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (10 + level * 2) * roofPhase;
    drawGableRoof(ctx, sx, sy, tw * 1.08, th * 1.08, wH - 1, rH, roofColor);
    if (level >= 3) {
      drawChimney(ctx, sx + tw * 0.25, sy - wH - rH * 0.4, 5, 6, '#8a6050', time);
    }
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.15);
}

function drawMansion(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#d8c8a0' : '#d0b888';
  const accentColor = level >= 4 ? '#a08050' : '#8a6a40';
  const baseWallH = 22 + level * 4;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#a09070');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.14));

  if (wallPhase > 0) {
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    const cornerH = wH * 0.8;
    ctx.beginPath();
    ctx.moveTo(sx - tw / 2, sy + th / 4 - 2);
    ctx.lineTo(sx - tw / 2, sy + th / 4 - 2 - cornerH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + tw / 2, sy + th / 4 - 2);
    ctx.lineTo(sx + tw / 2, sy + th / 4 - 2 - cornerH);
    ctx.stroke();

    woodBeamPattern(ctx, sx, sy, tw, wH, true);

    if (wallPhase > 0.4) {
      drawDoor(ctx, sx - 4, sy - 10, 7, 9, '#4a2a10');
      ctx.fillStyle = accentColor;
      ctx.fillRect(sx - 5, sy - 10 - 2, 9, 2);
    }
    if (wallPhase > 0.6) {
      drawWindow(ctx, sx - tw / 3, sy - wH * 0.55, 5, 4, true);
      drawWindow(ctx, sx + tw / 5 - 3, sy - wH * 0.55 + th / 6, 5, 4, false);
    }
    if (level >= 2 && wallPhase > 0.8) {
      drawWindow(ctx, sx - tw / 4 - 1, sy - wH * 0.8, 4, 3.5, true);
      drawWindow(ctx, sx + tw / 6, sy - wH * 0.8 + th / 8, 4, 3.5, false);
    }
  }

  if (wallPhase < 1) {
    drawConstructionScaffolding(ctx, sx, sy, tw, wH, time);
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (14 + level * 2) * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.06, th * 1.06, wH - 1, rH, level >= 3 ? '#7a3a10' : '#8b4513');
    drawChimney(ctx, sx + tw * 0.22, sy - wH - rH * 0.3, 6, 7, '#8a6850', time);
    if (level >= 4) {
      drawChimney(ctx, sx - tw * 0.18, sy - wH - rH * 0.3, 5, 6, '#8a6850', time);
    }
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.12);
}

function drawTower(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const tW = tw * 0.65;
  const tH = th * 0.65;
  const stoneColor = level >= 3 ? '#a0a098' : '#909088';
  const baseWallH = 30 + level * 6;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tW * 1.2, tH * 1.2, '#787870');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tW, tH, wH, stoneColor);
  isoRightFace(ctx, sx, sy, tW, tH, wH, darken(stoneColor, 0.16));

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - tW / 2, sy + tH / 4, tW / 2, wH, Math.floor(wH / 5), true);
    drawStoneTexture(ctx, sx, sy, tW / 2, wH, Math.floor(wH / 5), false);

    if (wallPhase > 0.5) {
      drawWindow(ctx, sx - tW / 4 - 1, sy - wH * 0.4, 3, 5, true);
    }
    if (level >= 2 && wallPhase > 0.7) {
      drawWindow(ctx, sx + tW / 6 - 1, sy - wH * 0.6 + tH / 8, 3, 5, false);
    }
    if (wallPhase > 0.6) {
      drawDoor(ctx, sx - 2.5, sy - 7, 4, 6, '#4a3a20');
    }
  }

  if (wallPhase < 1) {
    drawConstructionScaffolding(ctx, sx, sy, tW, wH, time);
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    isoTopFace(ctx, sx, sy, tW, tH, wH, lighten(stoneColor, 0.1));
    const merlonH = 4 + level;
    for (let i = -1; i <= 1; i++) {
      const mx = sx + i * tW / 3.5;
      const myBase = sy - wH + Math.abs(i) * tH / 8;
      isoLeftFace(ctx, mx, myBase + 1, tW * 0.2, tH * 0.2, merlonH, stoneColor);
      isoRightFace(ctx, mx, myBase + 1, tW * 0.2, tH * 0.2, merlonH, darken(stoneColor, 0.16));
      isoTopFace(ctx, mx, myBase + 1, tW * 0.2, tH * 0.2, merlonH, lighten(stoneColor, 0.15));
    }
    ctx.strokeStyle = '#5a4a30';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - merlonH);
    ctx.lineTo(sx, sy - wH - merlonH - 10 * roofPhase);
    ctx.stroke();
    ctx.fillStyle = '#c04040';
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - merlonH - 10 * roofPhase);
    ctx.lineTo(sx + 6, sy - wH - merlonH - 7 * roofPhase + Math.sin(time * 3) * 1);
    ctx.lineTo(sx, sy - wH - merlonH - 4 * roofPhase);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tW, tH, wH, 0.15);
}

function drawWorkshop(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#c4a878' : '#b89868';
  const baseWallH = 15 + level * 3;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#8a7050');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.14));

  if (wallPhase > 0) {
    woodBeamPattern(ctx, sx, sy, tw, wH, true);
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 4, sy - 9, 7, 8, '#5a3818');
    }
    if (wallPhase > 0.7) {
      ctx.fillStyle = '#6a4a20';
      ctx.fillRect(sx + tw / 5, sy - wH * 0.35, tw / 4, 2);
      ctx.fillStyle = '#8a6a30';
      ctx.fillRect(sx + tw / 5 + 1, sy - wH * 0.35 - 2, 2, 2);
      ctx.fillRect(sx + tw / 5 + 5, sy - wH * 0.35 - 3, 1.5, 3);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (8 + level * 1.5) * roofPhase;
    drawGableRoof(ctx, sx, sy, tw * 1.05, th * 1.05, wH - 1, rH, '#6a4a22');
    drawChimney(ctx, sx + tw * 0.2, sy - wH - rH * 0.5, 6, 8 + level, '#6a4a3a', time);
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.15);
}

function drawMarket(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const baseColor = '#c8a870';
  const baseWallH = 12 + level * 2;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#a08858');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, baseColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(baseColor, 0.14));

  if (wallPhase > 0) {
    ctx.fillStyle = '#6a4a20';
    ctx.fillRect(sx - tw / 4, sy - 2, tw / 2 * wallPhase, 2);
    const numItems = 2 + level;
    for (let i = 0; i < numItems; i++) {
      const ix = sx - tw / 4 + i * 6;
      const iy = sy - 4;
      const colors = ['#c84040', '#40a040', '#c0a040', '#4080c0', '#a06040'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(ix, iy - 2.5 * wallPhase, 3, 2.5);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const canopyH = wH + 6;
    const canopyW = tw * 1.15;
    const canopyTH = th * 1.15;
    const stripeColor1 = level >= 3 ? '#b83030' : '#c04040';
    const stripeColor2 = level >= 3 ? '#d8d0b0' : '#e0d8c0';
    isoTopFace(ctx, sx, sy, canopyW, canopyTH, canopyH, stripeColor1);
    ctx.strokeStyle = stripeColor2;
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + i * canopyW / 6, sy - canopyH);
      ctx.lineTo(sx + i * canopyW / 6 + canopyW / 4, sy - canopyH + canopyTH / 4);
      ctx.stroke();
    }
    ctx.strokeStyle = '#5a3a18';
    ctx.lineWidth = 1;
    for (let p = -1; p <= 1; p += 2) {
      const px = sx + p * tw * 0.4;
      ctx.beginPath();
      ctx.moveTo(px, sy + 2);
      ctx.lineTo(px, sy + 2 - canopyH);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.12);
}

function drawBarracks(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#8a8870' : '#7a7860';
  const baseWallH = 18 + level * 3;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#605840');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.14));

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - tw / 2, sy + th / 4, tw / 2, wH, Math.floor(wH / 6), true);
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 4, sy - 10, 7, 9, '#3a2a10');
    }
    if (wallPhase > 0.7) {
      drawWindow(ctx, sx - tw / 3, sy - wH * 0.6, 4, 3, true);
      if (level >= 2) {
        drawWindow(ctx, sx + tw / 5 - 2, sy - wH * 0.6 + th / 8, 4, 3, false);
      }
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (10 + level * 1.5) * roofPhase;
    drawGableRoof(ctx, sx, sy, tw * 1.04, th * 1.04, wH - 1, rH, '#5a5840');
    ctx.strokeStyle = '#4a4a30';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - rH);
    ctx.lineTo(sx, sy - wH - rH - 12 * roofPhase);
    ctx.stroke();
    const flagWave = Math.sin(time * 3) * 1.5;
    ctx.fillStyle = '#c04040';
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - rH - 12 * roofPhase);
    ctx.lineTo(sx + 8, sy - wH - rH - 9 * roofPhase + flagWave);
    ctx.lineTo(sx, sy - wH - rH - 6 * roofPhase);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#901010';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.15);
}

function drawFarm(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);

  ctx.fillStyle = '#7a5a2a';
  ctx.beginPath();
  ctx.moveTo(sx, sy + 2);
  ctx.lineTo(sx + tw / 2, sy + 2 + th / 4);
  ctx.lineTo(sx, sy + 2 + th / 2);
  ctx.lineTo(sx - tw / 2, sy + 2 + th / 4);
  ctx.closePath();
  ctx.fill();

  if (foundPhase > 0.3) {
    ctx.strokeStyle = '#5a3a10';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      const t = (i + 1) / 5;
      ctx.beginPath();
      ctx.moveTo(sx - tw / 2 * (1 - t), sy + th / 4 * (1 - t) + 2);
      ctx.lineTo(sx + tw / 2 * (1 - t), sy + th / 4 * (1 - t) + 2);
      ctx.stroke();
    }
  }

  if (wallPhase > 0) {
    ctx.strokeStyle = '#8a6a30';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(sx - tw / 2, sy + th / 4 + 1);
    ctx.lineTo(sx - tw / 2, sy + th / 4 - 3);
    ctx.lineTo(sx, sy - 3);
    ctx.lineTo(sx + tw / 2, sy + th / 4 - 3);
    ctx.lineTo(sx + tw / 2, sy + th / 4 + 1);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (roofPhase > 0) {
    const cropColors = ['#228B22', '#32CD32', '#6B8E23', '#9ACD32', '#3CB371'];
    const numCrops = 3 + level * 2;
    for (let i = 0; i < numCrops; i++) {
      const t = (i + 0.5) / numCrops;
      const cx = sx - tw / 3 + tw * 0.66 * t;
      const cy = sy + th / 8 - th / 4 * t + 2;
      const sway = Math.sin(time * 1.5 + i * 1.3) * 1;
      const h = (3 + level * 0.8) * roofPhase;
      ctx.strokeStyle = '#2a6a10';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + sway, cy - h);
      ctx.stroke();
      ctx.fillStyle = cropColors[i % cropColors.length];
      ctx.beginPath();
      ctx.ellipse(cx + sway, cy - h, 2 * roofPhase, 1.5 * roofPhase, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHospital(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#e8e4d8' : '#dcd8cc';
  const baseWallH = 20 + level * 3;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#b0a898');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.1));

  if (wallPhase > 0) {
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 3.5, sy - 9, 6, 8, '#6a8a6a');
    }
    if (wallPhase > 0.7) {
      drawWindow(ctx, sx - tw / 3, sy - wH * 0.55, 5, 4, true);
      drawWindow(ctx, sx + tw / 5 - 2, sy - wH * 0.55 + th / 6, 5, 4, false);
    }
    if (level >= 2 && wallPhase > 0.9) {
      drawWindow(ctx, sx - tw / 4, sy - wH * 0.8, 4, 3, true);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (10 + level * 2) * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.04, th * 1.04, wH - 1, rH, '#8a8a80');

    const pulse = Math.sin(time * 2) * 0.08 + 0.92;
    ctx.globalAlpha = roofPhase * pulse;
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(sx - 1.5, sy - wH - rH + 2, 3, 7);
    ctx.fillRect(sx - 4, sy - wH - rH + 4, 8, 3);
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.12);
}

function drawSchool(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#e0d098' : '#d8c890';
  const baseWallH = 20 + level * 3;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#a09060');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.12));

  if (wallPhase > 0) {
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 3.5, sy - 9, 6, 8, '#4a3a18');
    }
    if (wallPhase > 0.6) {
      drawWindow(ctx, sx - tw / 3, sy - wH * 0.55, 5, 4, true);
      drawWindow(ctx, sx + tw / 5 - 2, sy - wH * 0.55 + th / 6, 5, 4, false);
    }
    if (level >= 2 && wallPhase > 0.8) {
      drawWindow(ctx, sx - tw / 4 + 1, sy - wH * 0.8, 4, 3, true);
      drawWindow(ctx, sx + tw / 6 - 1, sy - wH * 0.8 + th / 8, 4, 3, false);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (12 + level * 2) * roofPhase;
    drawGableRoof(ctx, sx, sy, tw * 1.06, th * 1.06, wH - 1, rH, level >= 3 ? '#8a3020' : '#b04030');

    const bellTowerH = 8 + level * 2;
    const btW = 7;
    isoLeftFace(ctx, sx, sy - wH - rH + 2, btW, btW * 0.5, bellTowerH * roofPhase, '#d0c080');
    isoRightFace(ctx, sx, sy - wH - rH + 2, btW, btW * 0.5, bellTowerH * roofPhase, darken('#d0c080', 0.14));
    isoTopFace(ctx, sx, sy - wH - rH + 2, btW, btW * 0.5, bellTowerH * roofPhase, lighten('#d0c080', 0.1));
    if (roofPhase > 0.5) {
      ctx.fillStyle = '#c0a030';
      ctx.beginPath();
      ctx.arc(sx, sy - wH - rH - bellTowerH * roofPhase + 5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.12);
}

function drawChurch(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = level >= 3 ? '#ece8dc' : '#e4dcd0';
  const baseWallH = 22 + level * 4;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#b0a898');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.1));

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - tw / 2, sy + th / 4, tw / 2, wH, Math.floor(wH / 6), true);
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 4, sy - 11, 7, 10, '#5a3a18');
      ctx.strokeStyle = '#a08050';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(sx - 0.5, sy - 12, 4, Math.PI, 0);
      ctx.stroke();
    }
    if (wallPhase > 0.7) {
      ctx.fillStyle = 'rgba(200,160,60,0.4)';
      ctx.beginPath();
      ctx.arc(sx - tw / 4, sy - wH * 0.65, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a08040';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = (14 + level * 2) * roofPhase;
    drawGableRoof(ctx, sx, sy, tw * 1.04, th * 1.04, wH - 1, rH, '#7a7068');

    const spireH = 18 + level * 3;
    const spW = 7;
    isoLeftFace(ctx, sx, sy - wH - rH + 4, spW, spW * 0.5, spireH * roofPhase * 0.6, wallColor);
    isoRightFace(ctx, sx, sy - wH - rH + 4, spW, spW * 0.5, spireH * roofPhase * 0.6, darken(wallColor, 0.1));

    const spireTop = sy - wH - rH + 4 - spireH * roofPhase * 0.6;
    ctx.fillStyle = '#8a7868';
    ctx.beginPath();
    ctx.moveTo(sx, spireTop - 8 * roofPhase);
    ctx.lineTo(sx - 4, spireTop);
    ctx.lineTo(sx + 4, spireTop);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#c0a040';
    ctx.lineWidth = 1.2;
    const crossTop = spireTop - 8 * roofPhase;
    ctx.beginPath();
    ctx.moveTo(sx, crossTop - 5);
    ctx.lineTo(sx, crossTop + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx - 3, crossTop - 2);
    ctx.lineTo(sx + 3, crossTop - 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.1);
}

function drawWell(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stoneColor = '#b0a898';
  const wellW = tw * 0.7;
  const wellH = th * 0.7;
  const wH = Math.round(10 * foundPhase);

  drawFoundation(ctx, sx, sy, tw * 0.9, th * 0.9, '#908878');
  if (wH < 2) return;

  isoLeftFace(ctx, sx, sy, wellW, wellH, wH, stoneColor);
  isoRightFace(ctx, sx, sy, wellW, wellH, wH, darken(stoneColor, 0.14));
  isoTopFace(ctx, sx, sy, wellW, wellH, wH, lighten(stoneColor, 0.1));

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - wellW / 2, sy + wellH / 4, wellW / 2, wH, 3, true);
    ctx.fillStyle = '#406080';
    ctx.beginPath();
    ctx.ellipse(sx, sy - wH + wellH / 4, wellW * 0.25, wellH * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    const shimmer = Math.sin(time * 2) * 0.1;
    ctx.fillStyle = `rgba(100,180,220,${0.3 + shimmer})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy - wH + wellH / 4, wellW * 0.2, wellH * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    ctx.strokeStyle = '#6a4a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - wellW * 0.35, sy - wH);
    ctx.lineTo(sx - wellW * 0.35, sy - wH - 10 * roofPhase);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + wellW * 0.35, sy - wH);
    ctx.lineTo(sx + wellW * 0.35, sy - wH - 10 * roofPhase);
    ctx.stroke();
    const roofY = sy - wH - 10 * roofPhase;
    ctx.fillStyle = '#8a6a30';
    ctx.beginPath();
    ctx.moveTo(sx, roofY - 5);
    ctx.lineTo(sx - wellW * 0.5, roofY + 2);
    ctx.lineTo(sx + wellW * 0.5, roofY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a3a18';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - 2, sy - wH - 6 * roofPhase);
    ctx.lineTo(sx + wellW * 0.3, sy - wH - 3 * roofPhase);
    ctx.stroke();
    ctx.fillStyle = '#7a5a28';
    ctx.fillRect(sx + wellW * 0.28, sy - wH - 1, 3, -5 * roofPhase);
    ctx.globalAlpha = 1;
  }
}

function drawFountain(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, roofPhase } = getPhases(progress);
  const stoneColor = '#c0b8a8';
  const baseH = 5 * foundPhase;

  drawFoundation(ctx, sx, sy, tw * 0.95, th * 0.95, '#a09888');

  if (baseH > 1) {
    isoLeftFace(ctx, sx, sy, tw * 0.8, th * 0.8, baseH, stoneColor);
    isoRightFace(ctx, sx, sy, tw * 0.8, th * 0.8, baseH, darken(stoneColor, 0.14));
    isoTopFace(ctx, sx, sy, tw * 0.8, th * 0.8, baseH, lighten(stoneColor, 0.1));

    if (roofPhase > 0) {
      ctx.fillStyle = '#4080a0';
      ctx.beginPath();
      ctx.ellipse(sx, sy - baseH + th * 0.1, tw * 0.25, th * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      const shimmer = Math.sin(time * 3) * 0.12;
      ctx.fillStyle = `rgba(120,200,240,${0.35 + shimmer})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy - baseH + th * 0.1, tw * 0.18, th * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b0a898';
      ctx.fillRect(sx - 1, sy - baseH - 4 * roofPhase, 2, 5 * roofPhase);

      if (roofPhase > 0.5) {
        for (let i = 0; i < 3; i++) {
          const dropX = sx + Math.sin(time * 4 + i * 2) * 3;
          const dropY = sy - baseH - 4 + i * 2;
          ctx.fillStyle = `rgba(120,200,240,${0.5 - i * 0.15})`;
          ctx.beginPath();
          ctx.arc(dropX, dropY, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawWindmill(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = '#d0c8b0';
  const bodyW = tw * 0.55;
  const bodyH = th * 0.55;
  const baseWallH = 28 + level * 5;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw * 0.7, th * 0.7, '#908878');
  if (wH < 3) return;

  const taper = 0.85;
  isoLeftFace(ctx, sx, sy, bodyW, bodyH, wH, wallColor);
  isoRightFace(ctx, sx, sy, bodyW, bodyH, wH, darken(wallColor, 0.12));

  ctx.fillStyle = darken(wallColor, 0.05);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx - bodyW / 2, sy + bodyH / 4);
  ctx.lineTo(sx - bodyW / 2 * taper, sy + bodyH / 4 - wH);
  ctx.lineTo(sx, sy - wH);
  ctx.closePath();
  ctx.fill();

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - bodyW / 2, sy + bodyH / 4, bodyW / 2, wH, Math.floor(wH / 5), true);
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 2.5, sy - 7, 4, 6, '#5a3a18');
    }
    if (wallPhase > 0.7) {
      drawWindow(ctx, sx - bodyW / 4, sy - wH * 0.5, 3, 4, true);
    }
    if (level >= 2 && wallPhase > 0.9) {
      drawWindow(ctx, sx - bodyW / 5, sy - wH * 0.75, 3, 3, true);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const capH = 8;
    const capColor = '#8a6a40';
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - capH * roofPhase);
    ctx.lineTo(sx - bodyW / 2 * taper - 2, sy - wH + bodyH / 4);
    ctx.lineTo(sx + bodyW / 2 * taper + 2, sy - wH + bodyH / 4);
    ctx.closePath();
    ctx.fillStyle = capColor;
    ctx.fill();

    const hubY = sy - wH - capH * roofPhase * 0.5 + 2;
    const sailAngle = time * 1.2;
    const sailLen = 16 + level * 2;
    for (let i = 0; i < 4; i++) {
      const a = sailAngle + (i * Math.PI / 2);
      const endX = sx + Math.cos(a) * sailLen;
      const endY = hubY + Math.sin(a) * sailLen * 0.45;
      ctx.strokeStyle = '#6a4a20';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, hubY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      const nextA = a + 0.35;
      const midX = sx + Math.cos(a) * sailLen * 0.85;
      const midY = hubY + Math.sin(a) * sailLen * 0.85 * 0.45;
      const sideX = sx + Math.cos(nextA) * sailLen * 0.7;
      const sideY = hubY + Math.sin(nextA) * sailLen * 0.7 * 0.45;
      ctx.fillStyle = 'rgba(220,210,180,0.65)';
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * sailLen * 0.25, hubY + Math.sin(a) * sailLen * 0.25 * 0.45);
      ctx.lineTo(midX, midY);
      ctx.lineTo(sideX, sideY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#5a3a18';
    ctx.beginPath();
    ctx.arc(sx, hubY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, bodyW, bodyH, wH, 0.12);
}

function drawWall(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress } = d;
  const { foundPhase } = getPhases(progress);
  const wH = Math.round((8 + level * 2) * foundPhase);
  if (wH < 1) return;

  const wallColor = level >= 3 ? '#8a7a60' : '#7a6a50';
  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.14));
  isoTopFace(ctx, sx, sy, tw, th, wH, lighten(wallColor, 0.1));

  ctx.strokeStyle = 'rgba(60,40,20,0.25)';
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 3; i++) {
    const ry = sy - wH * ((i + 1) / 4);
    ctx.beginPath();
    ctx.moveTo(sx, ry);
    ctx.lineTo(sx - tw / 2, ry + th / 4);
    ctx.stroke();
  }

  if (level >= 2) {
    const mH = 3;
    for (let i = -1; i <= 1; i += 2) {
      const mx = sx + i * tw / 4;
      ctx.fillStyle = darken(wallColor, 0.05);
      ctx.fillRect(mx - 1.5, sy - wH - mH, 3, mH);
    }
  }
}

function drawGarden(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { roofPhase } = getPhases(progress);

  drawFoundation(ctx, sx, sy, tw * 0.9, th * 0.9, '#5a7a3a');

  if (roofPhase > 0) {
    const bushColors = ['#2d7a20', '#3a8a2a', '#4a9a3a', '#358a28'];
    const numBushes = 2 + level;
    for (let i = 0; i < numBushes; i++) {
      const bx = sx + (i - numBushes / 2 + 0.5) * 5;
      const by = sy - 2 + Math.sin(i * 2.3) * 2;
      const size = (3 + level * 0.5) * roofPhase;
      const sway = Math.sin(time * 1.2 + i) * 0.5;
      ctx.fillStyle = bushColors[i % bushColors.length];
      ctx.beginPath();
      ctx.arc(bx + sway, by - size, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = darken(bushColors[i % bushColors.length], 0.15);
      ctx.beginPath();
      ctx.arc(bx + sway - 1, by - size + 1, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    if (level >= 2) {
      const flowerColors = ['#e04060', '#e0e040', '#e08040', '#c040e0'];
      for (let i = 0; i < level + 1; i++) {
        const fx = sx + (i - level / 2) * 4;
        const fy = sy + 1;
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        ctx.beginPath();
        ctx.arc(fx, fy - 3 * roofPhase, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a6a10';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy - 2 * roofPhase);
        ctx.stroke();
      }
    }
  }
}

function drawStatue(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stoneColor = '#b0a898';

  drawFoundation(ctx, sx, sy, tw * 0.7, th * 0.7, '#908878');

  if (foundPhase > 0.5) {
    const pedH = 8 * foundPhase;
    isoLeftFace(ctx, sx, sy, tw * 0.4, th * 0.4, pedH, stoneColor);
    isoRightFace(ctx, sx, sy, tw * 0.4, th * 0.4, pedH, darken(stoneColor, 0.14));
    isoTopFace(ctx, sx, sy, tw * 0.4, th * 0.4, pedH, lighten(stoneColor, 0.1));

    if (wallPhase > 0) {
      ctx.fillStyle = '#8a7a68';
      const figH = (12 + level * 2) * wallPhase;
      ctx.fillRect(sx - 2, sy - pedH - figH, 4, figH);
      ctx.beginPath();
      ctx.arc(sx, sy - pedH - figH - 2.5, 3, 0, Math.PI * 2);
      ctx.fill();
      if (roofPhase > 0) {
        ctx.strokeStyle = '#7a6a58';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy - pedH - figH * 0.6);
        ctx.lineTo(sx - 5, sy - pedH - figH * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy - pedH - figH * 0.6);
        ctx.lineTo(sx + 5, sy - pedH - figH * 0.4);
        ctx.stroke();
      }
    }
  }
}

function drawMonumentCastle(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stoneColor = '#b0a090';
  const baseWallH = 32;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#8a7a68');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, stoneColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(stoneColor, 0.16));

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - tw / 2, sy + th / 4, tw / 2, wH, Math.floor(wH / 5), true);
    drawStoneTexture(ctx, sx, sy, tw / 2, wH, Math.floor(wH / 5), false);
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 4, sy - 11, 7, 10, '#3a2a10');
      ctx.fillStyle = darken(stoneColor, 0.1);
      ctx.fillRect(sx - 5, sy - 12, 9, 2);
    }
    if (wallPhase > 0.7) {
      drawWindow(ctx, sx - tw / 3, sy - wH * 0.5, 3, 5, true);
      drawWindow(ctx, sx + tw / 5 - 1, sy - wH * 0.5 + th / 8, 3, 5, false);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    isoTopFace(ctx, sx, sy, tw, th, wH, lighten(stoneColor, 0.08));

    const mH = 5;
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const mx = sx + i * tw / 5;
      const myOff = Math.abs(i) * th / 10;
      isoLeftFace(ctx, mx, sy - wH + myOff + 1, tw * 0.12, th * 0.12, mH, stoneColor);
      isoRightFace(ctx, mx, sy - wH + myOff + 1, tw * 0.12, th * 0.12, mH, darken(stoneColor, 0.16));
      isoTopFace(ctx, mx, sy - wH + myOff + 1, tw * 0.12, th * 0.12, mH, lighten(stoneColor, 0.1));
    }

    const towerH = 14;
    for (let c = -1; c <= 1; c += 2) {
      const tx = sx + c * tw * 0.35;
      const tyOff = c > 0 ? th / 6 : 0;
      isoLeftFace(ctx, tx, sy - wH + tyOff, tw * 0.22, th * 0.22, towerH * roofPhase, darken(stoneColor, 0.05));
      isoRightFace(ctx, tx, sy - wH + tyOff, tw * 0.22, th * 0.22, towerH * roofPhase, darken(stoneColor, 0.2));
      isoTopFace(ctx, tx, sy - wH + tyOff, tw * 0.22, th * 0.22, towerH * roofPhase, lighten(stoneColor, 0.12));

      const coneH = 6 * roofPhase;
      const coneBase = sy - wH + tyOff - towerH * roofPhase;
      ctx.fillStyle = '#8a4020';
      ctx.beginPath();
      ctx.moveTo(tx, coneBase - coneH);
      ctx.lineTo(tx - tw * 0.12, coneBase);
      ctx.lineTo(tx + tw * 0.12, coneBase);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#5a4a30';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - mH);
    ctx.lineTo(sx, sy - wH - mH - 10);
    ctx.stroke();
    const flagW = Math.sin(time * 3) * 1;
    ctx.fillStyle = '#c04040';
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - mH - 10);
    ctx.lineTo(sx + 7, sy - wH - mH - 7 + flagW);
    ctx.lineTo(sx, sy - wH - mH - 4);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.12);
}

function drawTorreBelem(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stoneColor = '#e0d8b8';
  const baseWallH = 36;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#c0b898');
  if (wH < 3) return;

  const mainW = tw * 0.75;
  const mainH = th * 0.75;
  isoLeftFace(ctx, sx, sy, mainW, mainH, wH, stoneColor);
  isoRightFace(ctx, sx, sy, mainW, mainH, wH, darken(stoneColor, 0.12));

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - mainW / 2, sy + mainH / 4, mainW / 2, wH, Math.floor(wH / 4), true);
    if (wallPhase > 0.5) {
      for (let i = 0; i < 3; i++) {
        const ay = sy - wH * (0.3 + i * 0.2);
        const ax = sx - mainW / 4 - 1;
        ctx.strokeStyle = 'rgba(180,160,100,0.6)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(ax, ay, 3, Math.PI, 0);
        ctx.stroke();
      }
    }
    if (wallPhase > 0.7) {
      drawWindow(ctx, sx - mainW / 4 - 1, sy - wH * 0.6, 3, 5, true);
      drawWindow(ctx, sx + mainW / 5 - 1, sy - wH * 0.5 + mainH / 8, 3, 5, false);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    isoTopFace(ctx, sx, sy, mainW, mainH, wH, lighten(stoneColor, 0.08));

    const mH = 5;
    for (let i = -1; i <= 1; i++) {
      const mx = sx + i * mainW / 3.5;
      const myOff = Math.abs(i) * mainH / 8;
      isoLeftFace(ctx, mx, sy - wH + myOff, mainW * 0.15, mainH * 0.15, mH, stoneColor);
      isoTopFace(ctx, mx, sy - wH + myOff, mainW * 0.15, mainH * 0.15, mH, lighten(stoneColor, 0.1));
    }

    const balconyW = tw * 0.9;
    const balconyH = th * 0.9;
    const balconyWallH = 4;
    isoLeftFace(ctx, sx, sy - wH * 0.5, balconyW, balconyH, balconyWallH, darken(stoneColor, 0.05));
    isoRightFace(ctx, sx, sy - wH * 0.5, balconyW, balconyH, balconyWallH, darken(stoneColor, 0.18));
    isoTopFace(ctx, sx, sy - wH * 0.5, balconyW, balconyH, balconyWallH, stoneColor);

    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, mainW, mainH, wH, 0.1);
}

function drawUniversidade(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = '#e0d0a0';
  const baseWallH = 30;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, '#b0a070');
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.14));

  if (wallPhase > 0) {
    if (wallPhase > 0.4) {
      drawDoor(ctx, sx - 4, sy - 12, 7, 11, '#4a3018');
      ctx.fillStyle = darken(wallColor, 0.15);
      ctx.fillRect(sx - 5.5, sy - 13, 10, 2);
    }
    if (wallPhase > 0.6) {
      for (let r = 0; r < 2; r++) {
        for (let c = -1; c <= 1; c += 2) {
          drawWindow(ctx, sx + c * tw / 4 - 2.5, sy - wH * (0.4 + r * 0.25), 5, 4, c < 0);
        }
      }
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = 10 * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.04, th * 1.04, wH - 1, rH, '#8a6030');

    const towerH = 22;
    const tW2 = 9;
    isoLeftFace(ctx, sx, sy - wH - rH + 4, tW2, tW2 * 0.5, towerH * roofPhase, wallColor);
    isoRightFace(ctx, sx, sy - wH - rH + 4, tW2, tW2 * 0.5, towerH * roofPhase, darken(wallColor, 0.14));

    const clockY = sy - wH - rH + 4 - towerH * roofPhase * 0.4;
    ctx.fillStyle = '#f0edd8';
    ctx.beginPath();
    ctx.arc(sx, clockY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4a30';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx, clockY);
    ctx.lineTo(sx, clockY - 2.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, clockY);
    ctx.lineTo(sx + 1.5, clockY + 0.5);
    ctx.stroke();

    const domeY = sy - wH - rH + 4 - towerH * roofPhase;
    ctx.fillStyle = '#6a4a28';
    ctx.beginPath();
    ctx.arc(sx, domeY + 2, tW2 * 0.35, Math.PI, 0);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.1);
}

function drawTemploRomano(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, level, progress } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const stoneColor = '#dcd4c4';
  const baseWallH = 28;
  const wH = Math.round(baseWallH * foundPhase);

  const platH = 5;
  isoLeftFace(ctx, sx, sy + 1, tw * 1.05, th * 1.05, platH, darken(stoneColor, 0.1));
  isoRightFace(ctx, sx, sy + 1, tw * 1.05, th * 1.05, platH, darken(stoneColor, 0.22));
  isoTopFace(ctx, sx, sy + 1, tw * 1.05, th * 1.05, platH, stoneColor);

  if (wH < 5) return;

  if (wallPhase > 0) {
    const numCols = 5;
    for (let i = 0; i < numCols; i++) {
      const t = (i + 0.5) / numCols;
      const colX = sx - tw / 2 * 0.7 + tw * 0.7 * t;
      const colYBase = sy - platH + th / 4 * (0.5 - t) + 1;
      const colW = 3;
      const colH = wH * 0.85 * wallPhase;
      isoLeftFace(ctx, colX, colYBase, colW, colW * 0.5, colH, stoneColor);
      isoRightFace(ctx, colX, colYBase, colW, colW * 0.5, colH, darken(stoneColor, 0.12));
      isoTopFace(ctx, colX, colYBase, colW + 1, colW * 0.5 + 0.5, colH, lighten(stoneColor, 0.08));
      isoTopFace(ctx, colX, colYBase + colH, colW + 1, colW * 0.5 + 0.5, 0, lighten(stoneColor, 0.05));
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const entH = 4;
    isoLeftFace(ctx, sx, sy - platH - wH * 0.85 + 1, tw * 0.85, th * 0.85, entH, stoneColor);
    isoRightFace(ctx, sx, sy - platH - wH * 0.85 + 1, tw * 0.85, th * 0.85, entH, darken(stoneColor, 0.12));
    isoTopFace(ctx, sx, sy - platH - wH * 0.85 + 1, tw * 0.85, th * 0.85, entH, lighten(stoneColor, 0.08));

    const pedH = 10 * roofPhase;
    const pedTop = sy - platH - wH * 0.85 - entH - pedH + 1;
    ctx.fillStyle = stoneColor;
    ctx.beginPath();
    ctx.moveTo(sx, pedTop);
    ctx.lineTo(sx + tw * 0.42, sy - platH - wH * 0.85 - entH + 1);
    ctx.lineTo(sx - tw * 0.42, sy - platH - wH * 0.85 - entH + 1 + th * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(stoneColor, 0.08);
    ctx.beginPath();
    ctx.moveTo(sx, pedTop);
    ctx.lineTo(sx + tw * 0.42, sy - platH - wH * 0.85 - entH + 1);
    ctx.lineTo(sx, sy - platH - wH * 0.85 - entH + 1 - th * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}

function drawBridge(d: DrawCtx) {
  const { ctx, sx, sy, tw, th, progress } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);

  drawFoundation(ctx, sx, sy, tw, th, '#808080');

  if (foundPhase > 0.5) {
    const archColor = '#a0a098';
    const bridgeH = 16;
    isoLeftFace(ctx, sx, sy, tw, th, bridgeH * foundPhase, darken(archColor, 0.05));
    isoRightFace(ctx, sx, sy, tw, th, bridgeH * foundPhase, darken(archColor, 0.18));
    isoTopFace(ctx, sx, sy, tw, th, bridgeH * foundPhase, archColor);

    if (wallPhase > 0) {
      ctx.strokeStyle = 'rgba(60,60,60,0.3)';
      ctx.lineWidth = 0.8;
      for (let i = -1; i <= 1; i++) {
        const ax = sx + i * tw / 3;
        const ay = sy - bridgeH * 0.3;
        ctx.beginPath();
        ctx.arc(ax - tw / 6, ay, bridgeH * 0.35, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
      }
    }

    if (roofPhase > 0) {
      ctx.globalAlpha = roofPhase;
      const railH = 4;
      ctx.fillStyle = '#707068';
      ctx.fillRect(sx - tw / 2, sy - bridgeH * foundPhase - railH, 1.5, railH);
      ctx.fillRect(sx + tw / 2 - 1.5, sy - bridgeH * foundPhase - railH + th / 4, 1.5, railH);
      ctx.strokeStyle = '#808078';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx - tw / 2, sy - bridgeH * foundPhase - railH * 0.5);
      ctx.lineTo(sx, sy - bridgeH * foundPhase - railH * 0.5 + th / 4);
      ctx.lineTo(sx + tw / 2, sy - bridgeH * foundPhase - railH * 0.5 + th / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function drawGenericMonument(d: DrawCtx, accentColor: string) {
  const { ctx, sx, sy, tw, th, level, progress, time } = d;
  const { foundPhase, wallPhase, roofPhase } = getPhases(progress);
  const wallColor = lighten(accentColor, 0.4);
  const baseWallH = 28;
  const wH = Math.round(baseWallH * foundPhase);

  drawFoundation(ctx, sx, sy, tw, th, darken(accentColor, 0.2));
  if (wH < 3) return;

  isoLeftFace(ctx, sx, sy, tw, th, wH, wallColor);
  isoRightFace(ctx, sx, sy, tw, th, wH, darken(wallColor, 0.14));

  if (wallPhase > 0) {
    drawStoneTexture(ctx, sx - tw / 2, sy + th / 4, tw / 2, wH, Math.floor(wH / 5), true);
    if (wallPhase > 0.5) {
      drawDoor(ctx, sx - 3.5, sy - 10, 6, 9, darken(accentColor, 0.4));
    }
    if (wallPhase > 0.7) {
      drawWindow(ctx, sx - tw / 3, sy - wH * 0.55, 4, 4, true);
      drawWindow(ctx, sx + tw / 5 - 2, sy - wH * 0.55 + th / 8, 4, 4, false);
    }
  }

  if (roofPhase > 0) {
    ctx.globalAlpha = roofPhase;
    const rH = 12 * roofPhase;
    drawHipRoof(ctx, sx, sy, tw * 1.04, th * 1.04, wH - 1, rH, darken(accentColor, 0.1));

    const spireH = 10;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(sx, sy - wH - rH - spireH * roofPhase);
    ctx.lineTo(sx - 4, sy - wH - rH);
    ctx.lineTo(sx + 4, sy - wH - rH);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  isoBoxEdges(ctx, sx, sy, tw, th, wH, 0.1);
}

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
    ctx.setLineDash([3, 3]);
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
    case 'jardim_episcopal': drawGenericMonument(d, '#6a9a5a'); break;
    case 'se_guarda':
    case 'se_viseu': drawGenericMonument(d, '#b0a898'); break;
    case 'santuario_luzia': drawGenericMonument(d, '#c8b898'); break;
    case 'solar_mateus': drawGenericMonument(d, '#c8a878'); break;
    case 'lagoa_sete_cidades': drawGenericMonument(d, '#5a8a70'); break;
    case 'monte_funchal': drawGenericMonument(d, '#7a9a60'); break;
    default: {
      const def = BUILDING_DEFS[defId];
      if (def) {
        drawGenericMonument(d, '#b0a080');
      }
      break;
    }
  }

  if (progress < 1 && progress > 0.01) {
    const fullWallH = 20 + level * 3;
    drawProgressBar(ctx, sx, sy, fullWallH, tw, progress, time);
    if (progress < 0.66) {
      drawConstructionScaffolding(ctx, sx, sy, tw, Math.round(fullWallH * Math.min(progress / 0.33, 1)), time);
    }
  }
}

export function drawConstructionDust(ctx: CanvasRenderingContext2D, sx: number, sy: number, tw: number, time: number) {
  ctx.strokeStyle = '#c8963c';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
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
