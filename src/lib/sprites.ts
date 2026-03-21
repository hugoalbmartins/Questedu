import buildingsSprite from '@/assets/buildings-sprite.png';
import mansionSprite from '@/assets/building-mansion.png';
import monumentsSprite from '@/assets/monuments-sprite.png';

export interface SpriteRegion {
  image: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

// Only PNG sprites with transparency are included here.
// buildings-extra.png is a JPEG (no transparency) so those buildings
// are rendered procedurally instead.
export const BUILDING_SPRITES: Record<string, SpriteRegion> = {
  house:    { image: buildingsSprite, sx: 0,   sy: 0,   sw: 256, sh: 256 },
  workshop: { image: buildingsSprite, sx: 256, sy: 0,   sw: 256, sh: 256 },
  market:   { image: buildingsSprite, sx: 512, sy: 0,   sw: 256, sh: 256 },
  fountain: { image: buildingsSprite, sx: 768, sy: 0,   sw: 256, sh: 256 },
  wall:     { image: buildingsSprite, sx: 0,   sy: 512, sw: 256, sh: 256 },
  tower:    { image: buildingsSprite, sx: 256, sy: 460, sw: 256, sh: 564 },
  barracks: { image: buildingsSprite, sx: 512, sy: 512, sw: 256, sh: 256 },
  road:     { image: buildingsSprite, sx: 768, sy: 512, sw: 256, sh: 256 },
  mansion:  { image: mansionSprite,   sx: 0,   sy: 0,   sw: 512, sh: 512 },
  torre_belem:           { image: monumentsSprite, sx: 0,   sy: 0,   sw: 512, sh: 512 },
  templo_romano:         { image: monumentsSprite, sx: 512, sy: 0,   sw: 512, sh: 512 },
  castelo_guimaraes:     { image: monumentsSprite, sx: 0,   sy: 512, sw: 512, sh: 512 },
  universidade_coimbra:  { image: monumentsSprite, sx: 512, sy: 512, sw: 512, sh: 512 },
};

const imageCache = new Map<string, HTMLImageElement>();
const loadingImages = new Map<string, Promise<HTMLImageElement>>();

export function loadSpriteImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
  if (loadingImages.has(src)) return loadingImages.get(src)!;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      loadingImages.delete(src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
  loadingImages.set(src, promise);
  return promise;
}

export function getSpriteImage(src: string): HTMLImageElement | null {
  return imageCache.get(src) ?? null;
}

export function preloadSprites(): Promise<void> {
  const sources = [buildingsSprite, mansionSprite, monumentsSprite];
  return Promise.all(sources.map(loadSpriteImage)).then(() => {});
}
