import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, School, Map, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { InteractivePortugalMap } from "./InteractivePortugalMap";

interface FriendResult {
  id: string;
  nickname: string | null;
  display_name: string;
  village_level: number;
  district: string | null;
  school_name: string | null;
  school_id: string | null;
}

interface FriendSearchPanelProps {
  studentId: string;
  existingFriendIds: Set<string>;
  onSendRequest: (receiverId: string) => Promise<void>;
}

export const FriendSearchPanel = ({ studentId, existingFriendIds, onSendRequest }: FriendSearchPanelProps) => {
  const [nicknameQuery, setNicknameQuery] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [searchResults, setSearchResults] = useState<FriendResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [studentSchoolId, setStudentSchoolId] = useState<string | null>(null);

  const filterExistingFriends = (results: FriendResult[]) => {
    return results.filter(r => !existingFriendIds.has(r.id) && r.id !== studentId);
  };

  const handleNicknameSearch = async () => {
    if (!nicknameQuery.trim() || nicknameQuery.trim().length < 2) {
      toast.error("Escreve pelo menos 2 caracteres");
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("students")
      .select("id, nickname, display_name, village_level, district, school_name, school_id")
      .neq("id", studentId)
      .ilike("nickname", `%${nicknameQuery.trim()}%`)
      .limit(20);

    setSearchResults(filterExistingFriends(data || []));
    setSearching(false);
  };

  const handleEmailSearch = async () => {
    if (!emailQuery.trim() || !emailQuery.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    setSearching(true);
    const { data: userData } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", emailQuery.trim())
      .eq("role", "student")
      .maybeSingle();

    if (!userData) {
      toast.error("Nenhum estudante encontrado com este email");
      setSearching(false);
      return;
    }

    const { data: studentData } = await supabase
      .from("students")
      .select("id, nickname, display_name, village_level, district, school_name, school_id")
      .eq("user_id", userData.user_id)
      .maybeSingle();

    if (studentData) {
      setSearchResults(filterExistingFriends([studentData]));
    } else {
      toast.error("Estudante não encontrado");
      setSearchResults([]);
    }

    setSearching(false);
  };

  const handleLoadMySchoolmates = async () => {
    const { data: currentStudent } = await supabase
      .from("students")
      .select("school_id")
      .eq("id", studentId)
      .maybeSingle();

    if (!currentStudent?.school_id) {
      toast.error("Tens de ter uma escola associada para ver colegas");
      return;
    }

    setStudentSchoolId(currentStudent.school_id);
    setSearching(true);

    const { data } = await supabase
      .from("students")
      .select("id, nickname, display_name, village_level, district, school_name, school_id")
      .eq("school_id", currentStudent.school_id)
      .neq("id", studentId)
      .limit(50);

    setSearchResults(filterExistingFriends(data || []));
    setSearching(false);
  };

  const handleSchoolSearch = async () => {
    if (!selectedSchoolId) {
      toast.error("Seleciona uma escola");
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("students")
      .select("id, nickname, display_name, village_level, district, school_name, school_id")
      .eq("school_id", selectedSchoolId)
      .neq("id", studentId)
      .limit(50);

    setSearchResults(filterExistingFriends(data || []));
    setSearching(false);
  };

  const loadSchools = async (district: string) => {
    setLoadingSchools(true);
    const { data } = await supabase
      .from("schools")
      .select("id, name, district")
      .eq("district", district)
      .order("name")
      .limit(100);

    setSchools(data || []);
    setLoadingSchools(false);
  };

  const handleMapStudentSelect = (student: FriendResult) => {
    if (!existingFriendIds.has(student.id) && student.id !== studentId) {
      setSearchResults([student]);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="nickname" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nickname" className="text-xs">
            <Search className="w-3 h-3 mr-1" /> Nickname
          </TabsTrigger>
          <TabsTrigger value="email" className="text-xs">
            <Mail className="w-3 h-3 mr-1" /> Email
          </TabsTrigger>
          <TabsTrigger value="school" className="text-xs">
            <School className="w-3 h-3 mr-1" /> Escola
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs">
            <Map className="w-3 h-3 mr-1" /> Mapa
          </TabsTrigger>
        </TabsList>

        {/* Nickname Search */}
        <TabsContent value="nickname" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nickname do jogador..."
              value={nicknameQuery}
              onChange={e => setNicknameQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNicknameSearch()}
              maxLength={20}
            />
            <Button size="sm" onClick={handleNicknameSearch} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </TabsContent>

        {/* Email Search */}
        <TabsContent value="email" className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={emailQuery}
              onChange={e => setEmailQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmailSearch()}
            />
            <Button size="sm" onClick={handleEmailSearch} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            </Button>
          </div>
        </TabsContent>

        {/* School Search */}
        <TabsContent value="school" className="space-y-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadMySchoolmates}
            disabled={searching}
            className="w-full mb-2"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <School className="w-4 h-4 mr-2" />
            )}
            Ver colegas da minha escola
          </Button>

          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Ou pesquisa por outra escola:</p>
            <Select onValueChange={loadSchools}>
              <SelectTrigger>
                <SelectValue placeholder="Escolhe um distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aveiro">Aveiro</SelectItem>
                <SelectItem value="Beja">Beja</SelectItem>
                <SelectItem value="Braga">Braga</SelectItem>
                <SelectItem value="Bragança">Bragança</SelectItem>
                <SelectItem value="Castelo Branco">Castelo Branco</SelectItem>
                <SelectItem value="Coimbra">Coimbra</SelectItem>
                <SelectItem value="Évora">Évora</SelectItem>
                <SelectItem value="Faro">Faro</SelectItem>
                <SelectItem value="Guarda">Guarda</SelectItem>
                <SelectItem value="Leiria">Leiria</SelectItem>
                <SelectItem value="Lisboa">Lisboa</SelectItem>
                <SelectItem value="Portalegre">Portalegre</SelectItem>
                <SelectItem value="Porto">Porto</SelectItem>
                <SelectItem value="Santarém">Santarém</SelectItem>
                <SelectItem value="Setúbal">Setúbal</SelectItem>
                <SelectItem value="Viana do Castelo">Viana do Castelo</SelectItem>
                <SelectItem value="Vila Real">Vila Real</SelectItem>
                <SelectItem value="Viseu">Viseu</SelectItem>
                <SelectItem value="Açores">Açores</SelectItem>
                <SelectItem value="Madeira">Madeira</SelectItem>
              </SelectContent>
            </Select>

            {schools.length > 0 && (
              <div className="mt-2 flex gap-2">
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolhe uma escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleSchoolSearch} disabled={searching || !selectedSchoolId}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Map Search */}
        <TabsContent value="map">
          <InteractivePortugalMap
            currentStudentId={studentId}
            onSelectStudent={handleMapStudentSelect}
          />
        </TabsContent>
      </Tabs>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="game-border bg-card p-3">
          <h4 className="font-display text-sm font-bold mb-2">
            Resultados ({searchResults.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map(player => (
              <div key={player.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <div>
                  <span className="font-body font-bold text-sm">
                    {player.nickname || player.display_name}
                  </span>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>Nv.{player.village_level}</span>
                    {player.school_name && <span>• {player.school_name}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onSendRequest(player.id)}>
                  <UserPlus className="w-4 h-4 mr-1" /> Pedir
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
