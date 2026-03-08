import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ZoomIn, ZoomOut, RotateCcw, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// More geographically accurate district paths
// ViewBox: 0 0 600 500 — Islands LEFT, Mainland RIGHT
const districtPaths: Record<string, { path: string; labelX: number; labelY: number; label: string }> = {
  // === ISLANDS ===
  acores: {
    label: "Açores",
    labelX: 75, labelY: 105,
    path: "M25,65 C28,60 38,56 48,55 C55,54 62,56 65,60 C68,64 66,70 60,74 C54,78 42,79 34,76 C28,74 24,70 25,65Z M72,75 C76,70 86,67 96,68 C103,69 108,72 109,77 C110,82 106,87 98,89 C90,91 80,88 75,84 C71,81 70,78 72,75Z M108,58 C112,53 122,50 132,51 C138,52 142,55 142,60 C142,65 138,70 130,72 C122,73 113,70 110,66 C107,63 107,60 108,58Z M48,92 C52,88 62,86 70,88 C76,90 80,93 79,98 C78,103 72,107 64,108 C56,109 48,106 46,101 C44,97 45,94 48,92Z M92,97 C96,93 106,91 114,93 C120,95 123,99 122,104 C121,109 115,113 107,114 C99,114 92,111 90,106 C89,102 90,99 92,97Z",
  },
  madeira: {
    label: "Madeira",
    labelX: 75, labelY: 255,
    path: "M35,238 C40,230 55,226 75,227 C90,228 105,232 112,240 C116,245 114,252 108,257 C100,263 82,267 65,266 C48,265 36,259 33,252 C31,247 32,242 35,238Z M62,272 C66,268 76,266 86,268 C93,270 97,274 96,279 C95,284 88,288 80,288 C72,288 65,285 63,280 C61,277 61,274 62,272Z",
  },
  // === MAINLAND ===
  viana_castelo: {
    label: "V. Castelo",
    labelX: 248, labelY: 55,
    path: "M222,28 L240,24 L258,26 L272,32 L280,42 L282,56 L278,68 L268,76 L255,78 L242,74 L232,66 L226,54 L222,42Z",
  },
  braga: {
    label: "Braga",
    labelX: 298, labelY: 52,
    path: "M272,32 L290,26 L308,28 L322,34 L330,44 L332,56 L326,66 L316,72 L302,74 L288,72 L278,68 L282,56 L280,42Z",
  },
  vila_real: {
    label: "Vila Real",
    labelX: 350, labelY: 52,
    path: "M322,34 L342,26 L362,24 L382,28 L392,38 L394,52 L388,64 L376,72 L360,76 L344,74 L332,68 L326,66 L332,56 L330,44Z",
  },
  braganca: {
    label: "Bragança",
    labelX: 435, labelY: 40,
    path: "M382,28 L405,18 L432,14 L458,16 L478,22 L488,34 L486,50 L478,64 L462,72 L442,76 L420,74 L400,68 L388,64 L394,52 L392,38Z",
  },
  porto: {
    label: "Porto",
    labelX: 258, labelY: 100,
    path: "M226,78 L242,74 L255,78 L268,76 L288,72 L302,74 L306,86 L300,100 L288,110 L272,114 L254,112 L240,106 L230,96 L224,86Z",
  },
  aveiro: {
    label: "Aveiro",
    labelX: 246, labelY: 142,
    path: "M218,114 L232,108 L254,112 L272,114 L278,128 L274,144 L264,156 L248,162 L232,158 L220,148 L214,134 L216,122Z",
  },
  viseu: {
    label: "Viseu",
    labelX: 325, labelY: 108,
    path: "M288,72 L302,74 L316,72 L332,68 L344,74 L360,76 L370,86 L372,100 L366,114 L352,124 L334,128 L316,126 L300,120 L290,112 L288,100 L292,86Z",
  },
  guarda: {
    label: "Guarda",
    labelX: 410, labelY: 108,
    path: "M360,76 L376,72 L400,68 L420,74 L442,76 L462,72 L472,84 L474,100 L468,114 L454,124 L436,128 L416,126 L396,122 L380,116 L372,100 L370,86Z",
  },
  coimbra: {
    label: "Coimbra",
    labelX: 280, labelY: 178,
    path: "M232,158 L248,162 L264,156 L278,150 L300,152 L316,158 L326,170 L322,186 L310,198 L292,204 L272,202 L254,196 L240,184 L234,172 L232,162Z",
  },
  castelo_branco: {
    label: "C. Branco",
    labelX: 390, labelY: 168,
    path: "M316,126 L334,128 L352,124 L380,116 L396,122 L416,126 L436,128 L454,138 L458,156 L452,174 L438,188 L416,196 L392,198 L368,194 L346,186 L330,176 L322,164 L318,148 L316,136Z",
  },
  leiria: {
    label: "Leiria",
    labelX: 248, labelY: 222,
    path: "M220,200 L240,196 L258,202 L276,210 L286,222 L284,238 L274,250 L258,256 L240,254 L226,244 L218,232 L216,218Z",
  },
  santarem: {
    label: "Santarém",
    labelX: 318, labelY: 234,
    path: "M276,210 L296,206 L318,210 L342,218 L358,228 L366,244 L362,260 L348,274 L328,280 L308,278 L290,272 L276,260 L270,248 L272,234Z",
  },
  portalegre: {
    label: "Portalegre",
    labelX: 425, labelY: 222,
    path: "M368,194 L392,198 L416,196 L438,200 L458,210 L468,226 L466,244 L454,258 L436,266 L414,268 L394,264 L378,254 L370,240 L366,226 L364,210Z",
  },
  lisboa: {
    label: "Lisboa",
    labelX: 240, labelY: 288,
    path: "M212,264 L228,258 L248,260 L266,266 L278,278 L280,294 L274,308 L260,318 L242,322 L226,318 L214,308 L208,294 L208,278Z",
  },
  setubal: {
    label: "Setúbal",
    labelX: 278, labelY: 336,
    path: "M242,322 L260,318 L280,322 L300,330 L314,344 L318,360 L310,376 L294,386 L274,390 L256,384 L242,372 L234,356 L234,340Z",
  },
  evora: {
    label: "Évora",
    labelX: 348, labelY: 306,
    path: "M290,272 L308,278 L328,280 L354,278 L378,282 L398,292 L408,308 L404,326 L392,340 L372,350 L348,354 L326,350 L306,342 L292,328 L284,312 L284,294Z",
  },
  beja: {
    label: "Beja",
    labelX: 350, labelY: 388,
    path: "M292,360 L312,354 L348,354 L372,350 L398,356 L420,368 L432,386 L428,406 L416,422 L396,432 L370,436 L344,434 L318,426 L298,414 L286,398 L282,380Z",
  },
  faro: {
    label: "Faro",
    labelX: 360, labelY: 456,
    path: "M286,434 L310,428 L344,434 L370,436 L400,438 L428,444 L448,454 L446,466 L434,476 L406,482 L372,484 L338,482 L306,478 L282,470 L274,458 L278,446Z",
  },
};

const districtKeyToId: Record<string, string> = Object.fromEntries(
  Object.keys(districtPaths).map(k => [k, k])
);

interface PlayerInDistrict {
  district: string;
  count: number;
  players: { id: string; display_name: string; nickname: string | null; village_level: number; xp: number }[];
}

interface PortugalMapProps {
  studentId?: string;
  district?: string | null;
}

export const PortugalMap = ({ studentId, district: myDistrict }: PortugalMapProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [prevSelected, setPrevSelected] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<Record<string, PlayerInDistrict>>({});
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('students')
        .select('id, display_name, nickname, village_level, xp, district')
        .not('district', 'is', null);

      if (data) {
        const grouped: Record<string, PlayerInDistrict> = {};
        for (const player of data) {
          const d = player.district as string;
          if (!grouped[d]) grouped[d] = { district: d, count: 0, players: [] };
          grouped[d].count++;
          grouped[d].players.push({
            id: player.id,
            display_name: player.display_name,
            nickname: player.nickname,
            village_level: player.village_level,
            xp: player.xp,
          });
        }
        for (const d of Object.values(grouped)) {
          d.players.sort((a, b) => b.xp - a.xp);
        }
        setDistrictData(grouped);
      }
      setLoading(false);
    };
    fetchPlayers();
  }, []);

  const totalPlayers = useMemo(() =>
    Object.values(districtData).reduce((sum, d) => sum + d.count, 0),
    [districtData]
  );

  const handleZoomIn = () => setZoom(z => Math.min(4, z * 1.4));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z / 1.4));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelectedDistrict(null); };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: panStart.x + (e.clientX - dragStart.x) / zoom,
      y: panStart.y + (e.clientY - dragStart.y) / zoom,
    });
  };
  const handleMouseUp = () => setDragging(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(4, z - e.deltaY * 0.002)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setPanStart({ ...pan });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setLastTouchDist(Math.sqrt(dx * dx + dy * dy));
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragging) {
      setPan({
        x: panStart.x + (e.touches[0].clientX - dragStart.x) / zoom,
        y: panStart.y + (e.touches[0].clientY - dragStart.y) / zoom,
      });
    } else if (e.touches.length === 2 && lastTouchDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setZoom(z => Math.max(0.5, Math.min(4, z * (dist / lastTouchDist))));
      setLastTouchDist(dist);
    }
  };
  const handleTouchEnd = () => { setDragging(false); setLastTouchDist(null); };

  const handleDistrictClick = (key: string) => {
    if (selectedDistrict === key) {
      const info = districtPaths[key];
      setZoom(2.5);
      setPan({ x: -(info.labelX - 300), y: -(info.labelY - 250) });
    } else {
      setPrevSelected(selectedDistrict);
      setSelectedDistrict(key);
    }
  };

  const showPlayerNames = zoom >= 2.5;
  const showPlayerCount = zoom >= 1.2;

  return (
    <div className="px-2 h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-display text-lg font-bold">🗺️ Mapa de Portugal</h2>
          <p className="font-body text-xs text-muted-foreground">
            {totalPlayers} jogador{totalPlayers !== 1 ? 'es' : ''} em {Object.keys(districtData).length} distritos
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-xl border-2 border-border cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ background: 'linear-gradient(180deg, hsl(210 50% 25%) 0%, hsl(210 60% 18%) 100%)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          viewBox="0 0 600 500"
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(210, 50%, 28%)" />
              <stop offset="100%" stopColor="hsl(210, 60%, 18%)" />
            </linearGradient>
            {/* Glow filter for selected district */}
            <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="hsl(45, 90%, 60%)" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Glow for "my district" */}
            <filter id="myDistrictGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="hsl(45, 80%, 55%)" floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Hover glow */}
            <filter id="hoverGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor="hsl(140, 50%, 50%)" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Pulse animation for selected */}
            <style>{`
              @keyframes districtPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
              @keyframes districtBounceIn {
                0% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.03); }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes badgePop {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes glowPulse {
                0%, 100% { filter: url(#selectedGlow); }
                50% { filter: url(#selectedGlow) brightness(1.15); }
              }
              .district-path {
                transition: fill 0.35s ease, stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
                transform-box: fill-box;
                transform-origin: center;
              }
              .district-path:hover {
                filter: url(#hoverGlow);
                stroke-width: 1.5;
              }
              .district-selected {
                animation: districtBounceIn 0.4s ease-out forwards;
                filter: url(#selectedGlow);
              }
              .district-selected-pulse {
                animation: districtPulse 2s ease-in-out infinite;
              }
              .district-mine {
                filter: url(#myDistrictGlow);
              }
              .badge-pop {
                animation: badgePop 0.3s ease-out forwards;
              }
              .district-label {
                transition: fill 0.3s ease, font-size 0.2s ease;
                pointer-events: none;
              }
              .player-dot {
                transition: r 0.2s ease, fill 0.2s ease;
              }
              .player-dot:hover {
                r: 5;
              }
            `}</style>
          </defs>

          <rect x="0" y="0" width="600" height="500" fill="url(#oceanGrad)" />

          {/* Ocean wave lines */}
          {[80, 160, 320, 400].map((y, i) => (
            <path
              key={i}
              d={`M0,${y} Q150,${y + (i % 2 ? 8 : -8)} 300,${y} Q450,${y + (i % 2 ? -8 : 8)} 600,${y}`}
              fill="none"
              stroke="hsl(210, 40%, 30%)"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}

          {/* Separator */}
          <line x1="170" y1="15" x2="170" y2="485" stroke="hsl(210, 30%, 35%)" strokeWidth="0.8" strokeDasharray="6,4" opacity="0.5" />
          <text x="175" y="250" fill="hsl(210, 30%, 50%)" fontSize="10" fontStyle="italic" opacity="0.6"
            transform="rotate(90, 175, 250)">Oceano Atlântico</text>

          {/* Island labels */}
          <text x="75" y="38" textAnchor="middle" fill="hsl(45, 60%, 70%)" fontSize="11" fontWeight="bold" opacity="0.8">Açores</text>
          <text x="75" y="218" textAnchor="middle" fill="hsl(45, 60%, 70%)" fontSize="11" fontWeight="bold" opacity="0.8">Madeira</text>

          {/* District regions */}
          {Object.entries(districtPaths).map(([key, info]) => {
            const isSelected = selectedDistrict === key;
            const isMine = myDistrict === key;
            const playerData = districtData[key];
            const count = playerData?.count || 0;
            const intensity = Math.min(1, count / 10);

            const fillColor = isSelected
              ? 'hsl(140, 55%, 42%)'
              : isMine
                ? 'hsl(45, 70%, 45%)'
                : count > 0
                  ? `hsl(140, ${25 + intensity * 35}%, ${28 + intensity * 15}%)`
                  : 'hsl(140, 15%, 25%)';

            const strokeColor = isSelected
              ? 'hsl(45, 90%, 65%)'
              : isMine
                ? 'hsl(45, 80%, 55%)'
                : 'hsl(140, 25%, 40%)';

            const classNames = [
              'district-path cursor-pointer',
              isSelected ? 'district-selected district-selected-pulse' : '',
              !isSelected && isMine ? 'district-mine' : '',
            ].filter(Boolean).join(' ');

            return (
              <g key={key} onClick={() => handleDistrictClick(key)}>
                <path
                  d={info.path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 2.5 : isMine ? 1.5 : 0.8}
                  strokeLinejoin="round"
                  opacity={isSelected ? 1 : selectedDistrict && !isSelected ? 0.6 : 0.92}
                  className={classNames}
                />

                {/* District label */}
                {(zoom >= 1.2 || isSelected || isMine) && (
                  <text
                    x={info.labelX}
                    y={info.labelY}
                    textAnchor="middle"
                    fill={isSelected ? 'hsl(45, 90%, 85%)' : isMine ? 'hsl(45, 80%, 75%)' : 'hsl(140, 20%, 75%)'}
                    fontSize={isSelected ? 12 : 9}
                    fontWeight={isSelected || isMine ? 'bold' : 'normal'}
                    className="district-label"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}
                  >
                    {info.label}
                  </text>
                )}

                {/* Player count badge */}
                {count > 0 && (showPlayerCount || isSelected) && (
                  <g className={isSelected ? 'badge-pop' : ''}>
                    <rect
                      x={info.labelX + 18}
                      y={info.labelY - 15}
                      width={count >= 100 ? 30 : count >= 10 ? 24 : 18}
                      height={16}
                      rx={8}
                      fill={isSelected ? 'hsl(45, 90%, 55%)' : 'hsl(45, 80%, 50%)'}
                      stroke={isSelected ? 'hsl(45, 70%, 35%)' : 'hsl(45, 60%, 30%)'}
                      strokeWidth="0.5"
                    />
                    <text
                      x={info.labelX + 18 + (count >= 100 ? 15 : count >= 10 ? 12 : 9)}
                      y={info.labelY - 4}
                      textAnchor="middle"
                      fill="hsl(45, 10%, 10%)"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {count}
                    </text>
                  </g>
                )}

                {/* Player dots at high zoom */}
                {showPlayerNames && playerData?.players.slice(0, 20).map((player, i) => {
                  const angle = (i / Math.max(1, playerData.players.length)) * Math.PI * 2;
                  const radius = 15 + (i % 3) * 8;
                  const px = info.labelX + Math.cos(angle) * radius;
                  const py = info.labelY + Math.sin(angle) * radius;
                  const isMe = player.id === studentId;

                  return (
                    <g key={player.id}>
                      <circle
                        cx={px}
                        cy={py}
                        r={isMe ? 4 : 3}
                        fill={isMe ? 'hsl(45, 90%, 55%)' : 'hsl(200, 70%, 60%)'}
                        stroke="#fff"
                        strokeWidth="0.5"
                        className="player-dot"
                      />
                      {zoom >= 3 && (
                        <text
                          x={px}
                          y={py + 8}
                          textAnchor="middle"
                          fill="#e0e0e0"
                          fontSize="5"
                          style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.9)' }}
                        >
                          {player.nickname || player.display_name.split(' ')[0]}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Zoom indicator */}
        <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-body text-muted-foreground border border-border">
          Zoom: {zoom.toFixed(1)}x
        </div>
        <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-body text-muted-foreground border border-border">
          Clica num distrito • 2x para zoom
        </div>

        {/* Legend */}
        <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1.5 text-[10px] font-body text-muted-foreground border border-border space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(45, 70%, 45%)' }} />
            <span>O teu distrito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(140, 55%, 42%)' }} />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(140, 50%, 36%)' }} />
            <span>Com jogadores</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(140, 15%, 25%)' }} />
            <span>Sem jogadores</span>
          </div>
        </div>
      </div>

      {/* Selected District Panel */}
      {selectedDistrict && (
        <div className="mt-2 bg-card rounded-xl border border-border p-3 max-h-40 overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {districtPaths[selectedDistrict]?.label}
              {myDistrict === selectedDistrict && (
                <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded font-body">O teu distrito!</span>
              )}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
              <Users className="w-3.5 h-3.5" />
              {districtData[selectedDistrict]?.count || 0} jogadores
            </div>
          </div>

          {districtData[selectedDistrict]?.players.length ? (
            <div className="space-y-1">
              {districtData[selectedDistrict].players.slice(0, 10).map((player, i) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between text-xs font-body px-2 py-1 rounded animate-fade-in ${
                    player.id === studentId ? 'bg-gold/10 border border-gold/30' : 'bg-muted/30'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-bold w-4">#{i + 1}</span>
                    <span className="font-semibold">
                      {player.nickname || player.display_name}
                      {player.id === studentId && ' (Tu)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Nv.{player.village_level}</span>
                    <span>{player.xp} XP</span>
                  </div>
                </div>
              ))}
              {districtData[selectedDistrict].players.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  +{districtData[selectedDistrict].players.length - 10} mais...
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body text-center py-2">
              Nenhum jogador neste distrito ainda. Sê o primeiro! 🏆
            </p>
          )}
        </div>
      )}
    </div>
  );
};
