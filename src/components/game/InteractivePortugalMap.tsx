import { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Student {
  id: string;
  nickname: string | null;
  display_name: string;
  village_level: number;
  school_name: string | null;
  district: string | null;
}

interface InteractivePortugalMapProps {
  currentStudentId: string;
  onSelectStudent: (student: Student) => void;
}

const districtMap: Record<string, { name: string; color: string }> = {
  aveiro: { name: "Aveiro", color: "#e3f2fd" },
  beja: { name: "Beja", color: "#fff3e0" },
  braga: { name: "Braga", color: "#f3e5f5" },
  braganca: { name: "Bragança", color: "#e8f5e9" },
  castelo_branco: { name: "Castelo Branco", color: "#fce4ec" },
  coimbra: { name: "Coimbra", color: "#e0f2f1" },
  evora: { name: "Évora", color: "#fff9c4" },
  faro: { name: "Faro", color: "#ffe0b2" },
  guarda: { name: "Guarda", color: "#f1f8e9" },
  leiria: { name: "Leiria", color: "#e1f5fe" },
  lisboa: { name: "Lisboa", color: "#ffd54f" },
  portalegre: { name: "Portalegre", color: "#ffccbc" },
  porto: { name: "Porto", color: "#c5cae9" },
  santarem: { name: "Santarém", color: "#dcedc8" },
  setubal: { name: "Setúbal", color: "#ffecb3" },
  viana_castelo: { name: "Viana do Castelo", color: "#b2dfdb" },
  vila_real: { name: "Vila Real", color: "#c8e6c9" },
  viseu: { name: "Viseu", color: "#d1c4e9" },
  acores: { name: "Açores", color: "#b3e5fc" },
  madeira: { name: "Madeira", color: "#c5e1a5" },
};

export const InteractivePortugalMap = ({ currentStudentId, onSelectStudent }: InteractivePortugalMapProps) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  useEffect(() => {
    loadDistrictCounts();
  }, []);

  const loadDistrictCounts = async () => {
    const { data } = await supabase
      .from("students")
      .select("district");

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(s => {
        if (s.district) {
          counts[s.district] = (counts[s.district] || 0) + 1;
        }
      });
      setDistrictCounts(counts);
    }
  };

  const handleDistrictClick = async (district: string) => {
    setSelectedDistrict(district);
    setLoadingStudents(true);

    const { data, error } = await supabase
      .from("students")
      .select("id, nickname, display_name, village_level, school_name, district")
      .eq("district", district)
      .neq("id", currentStudentId)
      .limit(50);

    if (error) {
      toast.error("Erro ao carregar jogadores");
    } else {
      setStudents(data || []);
    }

    setLoadingStudents(false);
  };

  return (
    <div className="space-y-4">
      <div className="game-border bg-card p-4">
        <h3 className="font-display text-lg font-bold mb-3">Mapa de Portugal</h3>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Clica num distrito para ver jogadores dessa região. Usa os botões ou gestos de pinch para zoom.
        </p>

        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          centerOnInit={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <div>
              <div className="flex gap-2 mb-3">
                <Button size="sm" variant="outline" onClick={() => zoomIn()}>
                  <ZoomIn className="w-4 h-4 mr-1" /> Ampliar
                </Button>
                <Button size="sm" variant="outline" onClick={() => zoomOut()}>
                  <ZoomOut className="w-4 h-4 mr-1" /> Reduzir
                </Button>
                <Button size="sm" variant="outline" onClick={() => resetTransform()}>
                  <Maximize2 className="w-4 h-4 mr-1" /> Centrar
                </Button>
              </div>

              <TransformComponent
                wrapperClass="!w-full !h-[500px] border border-border rounded-lg bg-blue-50/30"
                contentClass="!w-full !h-full"
              >
                <svg
                  viewBox="0 0 600 800"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Portugal Continental - Simplified regions */}

                  {/* Viana do Castelo */}
                  <path
                    d="M 150,80 L 180,70 L 200,85 L 190,110 L 160,120 L 145,100 Z"
                    fill={districtMap.viana_castelo.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("viana_castelo")}
                    onMouseEnter={() => setHoveredDistrict("viana_castelo")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Braga */}
                  <path
                    d="M 180,110 L 210,95 L 230,115 L 220,140 L 190,145 L 175,125 Z"
                    fill={districtMap.braga.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("braga")}
                    onMouseEnter={() => setHoveredDistrict("braga")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Porto */}
                  <path
                    d="M 165,145 L 195,130 L 225,150 L 215,180 L 185,190 L 160,170 Z"
                    fill={districtMap.porto.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("porto")}
                    onMouseEnter={() => setHoveredDistrict("porto")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Vila Real */}
                  <path
                    d="M 230,125 L 265,120 L 280,145 L 270,170 L 235,165 L 225,145 Z"
                    fill={districtMap.vila_real.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("vila_real")}
                    onMouseEnter={() => setHoveredDistrict("vila_real")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Bragança */}
                  <path
                    d="M 280,110 L 320,105 L 335,130 L 325,160 L 290,155 L 280,130 Z"
                    fill={districtMap.braganca.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("braganca")}
                    onMouseEnter={() => setHoveredDistrict("braganca")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Aveiro */}
                  <path
                    d="M 160,195 L 190,180 L 220,200 L 210,230 L 180,240 L 155,220 Z"
                    fill={districtMap.aveiro.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("aveiro")}
                    onMouseEnter={() => setHoveredDistrict("aveiro")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Viseu */}
                  <path
                    d="M 220,185 L 260,175 L 280,200 L 270,235 L 230,240 L 215,215 Z"
                    fill={districtMap.viseu.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("viseu")}
                    onMouseEnter={() => setHoveredDistrict("viseu")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Guarda */}
                  <path
                    d="M 270,190 L 310,185 L 330,215 L 315,250 L 280,250 L 270,225 Z"
                    fill={districtMap.guarda.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("guarda")}
                    onMouseEnter={() => setHoveredDistrict("guarda")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Coimbra */}
                  <path
                    d="M 180,250 L 220,240 L 245,265 L 235,300 L 200,310 L 175,285 Z"
                    fill={districtMap.coimbra.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("coimbra")}
                    onMouseEnter={() => setHoveredDistrict("coimbra")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Castelo Branco */}
                  <path
                    d="M 280,260 L 320,255 L 340,290 L 325,330 L 285,330 L 275,295 Z"
                    fill={districtMap.castelo_branco.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("castelo_branco")}
                    onMouseEnter={() => setHoveredDistrict("castelo_branco")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Leiria */}
                  <path
                    d="M 175,320 L 210,310 L 235,335 L 225,370 L 190,380 L 170,355 Z"
                    fill={districtMap.leiria.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("leiria")}
                    onMouseEnter={() => setHoveredDistrict("leiria")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Santarém */}
                  <path
                    d="M 210,350 L 250,340 L 280,370 L 270,410 L 230,420 L 205,390 Z"
                    fill={districtMap.santarem.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("santarem")}
                    onMouseEnter={() => setHoveredDistrict("santarem")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Portalegre */}
                  <path
                    d="M 280,350 L 320,345 L 340,380 L 330,420 L 290,420 L 280,385 Z"
                    fill={districtMap.portalegre.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("portalegre")}
                    onMouseEnter={() => setHoveredDistrict("portalegre")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Lisboa */}
                  <path
                    d="M 170,390 L 205,380 L 235,405 L 225,445 L 190,455 L 165,425 Z"
                    fill={districtMap.lisboa.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("lisboa")}
                    onMouseEnter={() => setHoveredDistrict("lisboa")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Setúbal */}
                  <path
                    d="M 190,460 L 225,450 L 250,475 L 240,510 L 205,520 L 185,490 Z"
                    fill={districtMap.setubal.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("setubal")}
                    onMouseEnter={() => setHoveredDistrict("setubal")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Évora */}
                  <path
                    d="M 250,440 L 290,430 L 315,465 L 305,510 L 260,520 L 245,480 Z"
                    fill={districtMap.evora.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("evora")}
                    onMouseEnter={() => setHoveredDistrict("evora")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Beja */}
                  <path
                    d="M 240,525 L 285,515 L 310,550 L 295,595 L 250,600 L 235,560 Z"
                    fill={districtMap.beja.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("beja")}
                    onMouseEnter={() => setHoveredDistrict("beja")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Faro */}
                  <path
                    d="M 210,610 L 260,605 L 290,630 L 275,670 L 230,675 L 205,645 Z"
                    fill={districtMap.faro.color}
                    stroke="#333"
                    strokeWidth="1.5"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleDistrictClick("faro")}
                    onMouseEnter={() => setHoveredDistrict("faro")}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  />

                  {/* Açores - simplified representation */}
                  <g transform="translate(400, 150)">
                    <circle
                      cx="30" cy="30" r="25"
                      fill={districtMap.acores.color}
                      stroke="#333"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleDistrictClick("acores")}
                      onMouseEnter={() => setHoveredDistrict("acores")}
                      onMouseLeave={() => setHoveredDistrict(null)}
                    />
                    <text x="30" y="35" textAnchor="middle" className="text-xs font-bold fill-gray-700">
                      Açores
                    </text>
                  </g>

                  {/* Madeira - simplified representation */}
                  <g transform="translate(400, 250)">
                    <circle
                      cx="30" cy="30" r="25"
                      fill={districtMap.madeira.color}
                      stroke="#333"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleDistrictClick("madeira")}
                      onMouseEnter={() => setHoveredDistrict("madeira")}
                      onMouseLeave={() => setHoveredDistrict(null)}
                    />
                    <text x="30" y="35" textAnchor="middle" className="text-xs font-bold fill-gray-700">
                      Madeira
                    </text>
                  </g>

                  {/* District labels and counts */}
                  {Object.entries(districtCounts).map(([district, count]) => {
                    if (count > 0) {
                      return (
                        <text
                          key={district}
                          className="text-xs font-bold fill-gray-800 pointer-events-none"
                          textAnchor="middle"
                        >
                          {count}
                        </text>
                      );
                    }
                    return null;
                  })}
                </svg>
              </TransformComponent>
            </div>
          )}
        </TransformWrapper>

        {/* Tooltip for hovered district */}
        {hoveredDistrict && (
          <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="font-body text-sm">
              <strong>{districtMap[hoveredDistrict]?.name}</strong>
              {districtCounts[hoveredDistrict] > 0 && (
                <span className="ml-2 text-muted-foreground">
                  ({districtCounts[hoveredDistrict]} jogadores)
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Student list for selected district */}
      {selectedDistrict && (
        <div className="game-border bg-card p-4">
          <h4 className="font-display text-md font-bold mb-3">
            Jogadores de {districtMap[selectedDistrict]?.name}
          </h4>

          {loadingStudents ? (
            <p className="text-sm text-muted-foreground">A carregar...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum jogador encontrado neste distrito.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-body font-bold text-sm">
                      {student.nickname || student.display_name}
                    </span>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      <span>Nv.{student.village_level}</span>
                      {student.school_name && <span>• {student.school_name}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectStudent(student)}
                  >
                    Ver Perfil
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
