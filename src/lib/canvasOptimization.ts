export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function calculateViewportBounds(
  cameraX: number,
  cameraY: number,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number = 1,
  padding: number = 2
): ViewportBounds {
  const effectiveWidth = canvasWidth / zoom;
  const effectiveHeight = canvasHeight / zoom;

  return {
    minX: Math.floor(cameraX - padding),
    maxX: Math.ceil(cameraX + effectiveWidth / 64 + padding),
    minY: Math.floor(cameraY - padding),
    maxY: Math.ceil(cameraY + effectiveHeight / 32 + padding)
  };
}

export function isInViewport(
  x: number,
  y: number,
  bounds: ViewportBounds
): boolean {
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

export class SpriteCache {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private maxSize: number = 100;

  get(key: string): HTMLCanvasElement | undefined {
    return this.cache.get(key);
  }

  set(key: string, canvas: HTMLCanvasElement): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, canvas);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class AnimationThrottler {
  private lastFrameTime: number = 0;
  private targetFPS: number = 30;
  private frameInterval: number;

  constructor(targetFPS: number = 30) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  shouldRender(currentTime: number): boolean {
    if (currentTime - this.lastFrameTime >= this.frameInterval) {
      this.lastFrameTime = currentTime;
      return true;
    }
    return false;
  }

  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function drawShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  buildingLevel: number = 1
): void {
  ctx.save();

  const shadowOffsetX = buildingLevel * 2;
  const shadowOffsetY = buildingLevel * 4;

  const gradient = ctx.createRadialGradient(
    x + width / 2,
    y + height,
    0,
    x + width / 2,
    y + height,
    width * 0.8
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(
    x + width / 2 + shadowOffsetX,
    y + height + shadowOffsetY,
    width * 0.6,
    height * 0.3,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

export interface ParallaxLayer {
  image: HTMLImageElement | null;
  speedX: number;
  speedY: number;
  opacity: number;
}

export function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayer,
  cameraX: number,
  cameraY: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!layer.image) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity;

  const offsetX = -(cameraX * layer.speedX) % layer.image.width;
  const offsetY = -(cameraY * layer.speedY) % layer.image.height;

  for (let x = offsetX - layer.image.width; x < canvasWidth; x += layer.image.width) {
    for (let y = offsetY - layer.image.height; y < canvasHeight; y += layer.image.height) {
      ctx.drawImage(layer.image, x, y);
    }
  }

  ctx.restore();
}

export function createGlowEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string = '#FFD700',
  pulsePhase: number = 0
): void {
  ctx.save();

  const intensity = 0.5 + 0.5 * Math.sin(pulsePhase);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, `${color}80`);
  gradient.addColorStop(1, `${color}00`);

  ctx.globalAlpha = intensity;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawFloatingIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
  size: number,
  bouncePhase: number
): void {
  ctx.save();

  const bounceOffset = Math.sin(bouncePhase) * 5;

  ctx.font = `${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(icon, x, y + bounceOffset);

  ctx.restore();
}
