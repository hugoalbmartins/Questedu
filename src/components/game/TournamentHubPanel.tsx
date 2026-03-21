import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Users,
  Clock,
  Coins,
  Diamond,
  ChevronRight,
  Crown,
  Swords,
  Medal,
  Star,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  status: string;
  max_participants: number;
  current_participants: number;
  entry_fee_coins: number;
  entry_fee_diamonds: number;
  prize_pool_coins: number;
  prize_pool_diamonds: number;
  starts_at: string;
  ends_at: string;
  subject_filter: string | null;
  school_year_filter: string | null;
  is_premium_only: boolean;
  created_at: string;
}

interface TournamentParticipant {
  tournament_id: string;
  placement: number | null;
  is_eliminated: boolean;
  matches_won: number;
  matches_lost: number;
  total_score: number;
}

interface TournamentPrize {
  placement: number;
  prize_coins: number;
  prize_diamonds: number;
  special_badge: string | null;
  special_title: string | null;
}

interface TournamentHubPanelProps {
  studentId: string;
  isPremium: boolean;
  coins: number;
  diamonds: number;
  schoolYear: string;
  onClose?: () => void;
}

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminação Simples",
  double_elimination: "Eliminação Dupla",
  round_robin: "Todos contra Todos",
  swiss: "Suíço",
  ladder: "Escada",
};

const FORMAT_ICONS: Record<string, string> = {
  single_elimination: "⚔️",
  double_elimination: "🛡️",
  round_robin: "🔄",
  swiss: "🎯",
  ladder: "📈",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  registration: { label: "Inscrições Abertas", color: "bg-green-500" },
  upcoming: { label: "Em Breve", color: "bg-blue-500" },
  in_progress: { label: "A Decorrer", color: "bg-orange-500" },
  completed: { label: "Concluído", color: "bg-gray-400" },
  cancelled: { label: "Cancelado", color: "bg-red-400" },
};

const SUBJECT_LABELS: Record<string, string> = {
  matematica: "Matemática",
  portugues: "Português",
  estudo_meio: "Estudo do Meio",
  ingles: "Inglês",
};

function getTimeInfo(tournament: Tournament): string {
  const now = Date.now();
  if (tournament.status === "registration" || tournament.status === "upcoming") {
    const diff = new Date(tournament.starts_at).getTime() - now;
    if (diff <= 0) return "A iniciar";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `Começa em ${days}d ${hours}h`;
    return `Começa em ${hours}h`;
  }
  if (tournament.status === "in_progress") {
    const diff = new Date(tournament.ends_at).getTime() - now;
    if (diff <= 0) return "A terminar";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h restantes`;
  }
  return "";
}

export const TournamentHubPanel = ({
  studentId,
  isPremium,
  coins,
  diamonds,
  schoolYear,
  onClose,
}: TournamentHubPanelProps) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participations, setParticipations] = useState<Record<string, TournamentParticipant>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tournamentsRes, participationsRes] = await Promise.all([
        supabase
          .from("tournaments")
          .select("*")
          .in("status", ["registration", "upcoming", "in_progress"])
          .order("starts_at", { ascending: true }),
        supabase
          .from("tournament_participants")
          .select("*")
          .eq("student_id", studentId),
      ]);

      setTournaments((tournamentsRes.data as Tournament[]) || []);

      const partMap: Record<string, TournamentParticipant> = {};
      ((participationsRes.data as TournamentParticipant[]) || []).forEach((p) => {
        partMap[p.tournament_id] = p;
      });
      setParticipations(partMap);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleRegister = async (tournament: Tournament) => {
    if (!isPremium && tournament.is_premium_only) {
      toast.error("Este torneio é exclusivo para membros Premium.");
      return;
    }
    if (tournament.entry_fee_coins > 0 && coins < tournament.entry_fee_coins) {
      toast.error(`Precisas de ${tournament.entry_fee_coins} moedas para participar.`);
      return;
    }
    if (tournament.entry_fee_diamonds > 0 && diamonds < tournament.entry_fee_diamonds) {
      toast.error(`Precisas de ${tournament.entry_fee_diamonds} diamantes para participar.`);
      return;
    }

    setRegistering(tournament.id);
    try {
      const { error } = await supabase.rpc("register_for_tournament" as any, {
        p_student_id: studentId,
        p_tournament_id: tournament.id,
      });
      if (error) throw error;
      toast.success("Inscrito no torneio com sucesso!");
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao inscrever no torneio");
    }
    setRegistering(null);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">A carregar torneios...</p>
      </div>
    );
  }

  if (selectedTournament) {
    return (
      <TournamentDetailView
        tournament={selectedTournament}
        participation={participations[selectedTournament.id]}
        studentId={studentId}
        isPremium={isPremium}
        coins={coins}
        diamonds={diamonds}
        onRegister={() => handleRegister(selectedTournament)}
        registering={registering === selectedTournament.id}
        onBack={() => setSelectedTournament(null)}
      />
    );
  }

  const myTournaments = tournaments.filter((t) => participations[t.id]);
  const availableTournaments = tournaments.filter((t) => !participations[t.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-display text-lg font-bold">Torneios</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {myTournaments.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Os Meus Torneios
          </h4>
          {myTournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              participation={participations[t.id]}
              isPremium={isPremium}
              coins={coins}
              diamonds={diamonds}
              onView={() => setSelectedTournament(t)}
              onRegister={() => handleRegister(t)}
              registering={registering === t.id}
            />
          ))}
        </div>
      )}

      {availableTournaments.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Disponíveis
          </h4>
          {availableTournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              isPremium={isPremium}
              coins={coins}
              diamonds={diamonds}
              onView={() => setSelectedTournament(t)}
              onRegister={() => handleRegister(t)}
              registering={registering === t.id}
            />
          ))}
        </div>
      ) : (
        myTournaments.length === 0 && (
          <div className="text-center py-10 rounded-xl border-2 border-dashed border-border">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="font-body text-muted-foreground text-sm">
              Nenhum torneio disponível de momento.
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Volta mais tarde para novos torneios!
            </p>
          </div>
        )
      )}

      {!isPremium && (
        <div className="rounded-xl border-2 border-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                Torneios Premium Exclusivos
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Membros Premium têm acesso a torneios especiais com prémios maiores, emblemas
                exclusivos e títulos únicos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TournamentCardProps {
  tournament: Tournament;
  participation?: TournamentParticipant;
  isPremium: boolean;
  coins: number;
  diamonds: number;
  onView: () => void;
  onRegister: () => void;
  registering: boolean;
}

const TournamentCard = ({
  tournament,
  participation,
  isPremium,
  coins,
  diamonds,
  onView,
  onRegister,
  registering,
}: TournamentCardProps) => {
  const isRegistered = !!participation;
  const statusInfo = STATUS_LABELS[tournament.status] || { label: tournament.status, color: "bg-gray-400" };
  const formatIcon = FORMAT_ICONS[tournament.format] || "🏆";
  const timeInfo = getTimeInfo(tournament);
  const canAfford =
    coins >= tournament.entry_fee_coins && diamonds >= tournament.entry_fee_diamonds;
  const isLocked = tournament.is_premium_only && !isPremium;

  const fillPercent =
    tournament.max_participants > 0
      ? (tournament.current_participants / tournament.max_participants) * 100
      : 0;

  return (
    <div
      className={`rounded-xl border-2 bg-card p-4 cursor-pointer hover:shadow-md transition-all ${
        isLocked
          ? "border-border opacity-75"
          : isRegistered
          ? "border-primary/50"
          : "border-border hover:border-primary/40"
      }`}
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl mt-0.5">{isLocked ? "🔒" : formatIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm">{tournament.name}</p>
            <Badge className={`${statusInfo.color} text-white text-[10px] h-4 px-1.5`}>
              {statusInfo.label}
            </Badge>
            {isRegistered && (
              <Badge className="bg-green-500 text-white text-[10px] h-4 px-1">
                Inscrito
              </Badge>
            )}
            {tournament.is_premium_only && (
              <Badge className="bg-amber-500 text-white text-[10px] h-4 px-1">
                <Crown className="w-2.5 h-2.5 mr-0.5" /> Premium
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">
            {FORMAT_LABELS[tournament.format]} •{" "}
            {tournament.subject_filter
              ? SUBJECT_LABELS[tournament.subject_filter] || tournament.subject_filter
              : "Todas as disciplinas"}
          </p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {tournament.prize_pool_coins > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-600 font-semibold">
                🪙 {tournament.prize_pool_coins}
              </span>
            )}
            {tournament.prize_pool_diamonds > 0 && (
              <span className="flex items-center gap-1 text-xs text-blue-500 font-semibold">
                💎 {tournament.prize_pool_diamonds}
              </span>
            )}
            {(tournament.entry_fee_coins > 0 || tournament.entry_fee_diamonds > 0) && (
              <span className="text-xs text-muted-foreground">
                Entrada:{" "}
                {tournament.entry_fee_coins > 0 && `🪙${tournament.entry_fee_coins}`}
                {tournament.entry_fee_coins > 0 && tournament.entry_fee_diamonds > 0 && " + "}
                {tournament.entry_fee_diamonds > 0 && `💎${tournament.entry_fee_diamonds}`}
              </span>
            )}
            {tournament.entry_fee_coins === 0 && tournament.entry_fee_diamonds === 0 && (
              <span className="text-xs text-green-600 font-semibold">Entrada gratuita</span>
            )}
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {tournament.current_participants}/{tournament.max_participants}
              </span>
              {timeInfo && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeInfo}
                </span>
              )}
            </div>
            <Progress value={fillPercent} className="h-1.5" />
          </div>

          {isRegistered && participation && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="text-green-600 font-semibold">
                {participation.matches_won}V - {participation.matches_lost}D
              </span>
              {participation.placement && (
                <span className="text-amber-600 font-semibold">
                  #{participation.placement}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      {!isRegistered && tournament.status === "registration" && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRegister();
            }}
            disabled={registering || isLocked || !canAfford}
            variant={isLocked ? "outline" : "default"}
          >
            {isLocked ? (
              <>
                <Lock className="w-3 h-3 mr-1.5" /> Exclusivo Premium
              </>
            ) : !canAfford ? (
              "Recursos insuficientes"
            ) : registering ? (
              "A inscrever..."
            ) : (
              <>
                <Swords className="w-3 h-3 mr-1.5" /> Inscrever-me
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

interface TournamentDetailViewProps {
  tournament: Tournament;
  participation?: TournamentParticipant;
  studentId: string;
  isPremium: boolean;
  coins: number;
  diamonds: number;
  onRegister: () => void;
  registering: boolean;
  onBack: () => void;
}

const TournamentDetailView = ({
  tournament,
  participation,
  studentId,
  isPremium,
  coins,
  diamonds,
  onRegister,
  registering,
  onBack,
}: TournamentDetailViewProps) => {
  const [prizes, setPrizes] = useState<TournamentPrize[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [tournament.id]);

  const loadDetails = async () => {
    setLoadingDetails(true);
    try {
      const [prizesRes, standingsRes] = await Promise.all([
        supabase
          .from("tournament_prizes")
          .select("*")
          .eq("tournament_id", tournament.id)
          .order("placement", { ascending: true }),
        supabase.rpc("get_tournament_standings" as any, {
          p_tournament_id: tournament.id,
        }),
      ]);
      setPrizes((prizesRes.data as TournamentPrize[]) || []);
      setStandings(standingsRes.data || []);
    } catch {
      // silent
    }
    setLoadingDetails(false);
  };

  const isRegistered = !!participation;
  const statusInfo = STATUS_LABELS[tournament.status] || { label: tournament.status, color: "bg-gray-400" };
  const canAfford = coins >= tournament.entry_fee_coins && diamonds >= tournament.entry_fee_diamonds;
  const isLocked = tournament.is_premium_only && !isPremium;
  const timeInfo = getTimeInfo(tournament);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Voltar
        </Button>
      </div>

      <div className="rounded-xl border-2 border-yellow-400/40 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 p-5">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{FORMAT_ICONS[tournament.format] || "🏆"}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl font-bold">{tournament.name}</h3>
              <Badge className={`${statusInfo.color} text-white`}>{statusInfo.label}</Badge>
            </div>
            {tournament.description && (
              <p className="text-sm text-muted-foreground mt-1">{tournament.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {FORMAT_LABELS[tournament.format]}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Participantes</p>
            <p className="font-bold">
              {tournament.current_participants}/{tournament.max_participants}
            </p>
            <Progress
              value={(tournament.current_participants / tournament.max_participants) * 100}
              className="h-1 mt-1"
            />
          </div>
          <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              {tournament.status === "registration" ? "Entrada" : "Prémio"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {tournament.prize_pool_coins > 0 && (
                <span className="text-sm font-bold text-yellow-600">
                  🪙 {tournament.prize_pool_coins}
                </span>
              )}
              {tournament.prize_pool_diamonds > 0 && (
                <span className="text-sm font-bold text-blue-500">
                  💎 {tournament.prize_pool_diamonds}
                </span>
              )}
              {tournament.prize_pool_coins === 0 && tournament.prize_pool_diamonds === 0 && (
                <span className="text-sm text-muted-foreground">Glória!</span>
              )}
            </div>
          </div>
        </div>

        {timeInfo && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {timeInfo}
          </div>
        )}

        {isRegistered && participation && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm font-semibold mb-2">O teu desempenho</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{participation.matches_won}</p>
                <p className="text-xs text-muted-foreground">Vitórias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{participation.matches_lost}</p>
                <p className="text-xs text-muted-foreground">Derrotas</p>
              </div>
              {participation.placement && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">#{participation.placement}</p>
                  <p className="text-xs text-muted-foreground">Posição</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isRegistered && tournament.status === "registration" && (
          <Button
            className="w-full mt-4"
            onClick={onRegister}
            disabled={registering || isLocked || !canAfford}
            variant={isLocked ? "outline" : "default"}
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4 mr-2" /> Exclusivo Premium
              </>
            ) : !canAfford ? (
              "Recursos insuficientes"
            ) : registering ? (
              "A inscrever..."
            ) : (
              <>
                <Swords className="w-4 h-4 mr-2" />
                Inscrever-me no Torneio
                {(tournament.entry_fee_coins > 0 || tournament.entry_fee_diamonds > 0) && (
                  <span className="ml-2 text-xs opacity-80">
                    ({tournament.entry_fee_coins > 0 && `🪙${tournament.entry_fee_coins}`}
                    {tournament.entry_fee_diamonds > 0 && ` 💎${tournament.entry_fee_diamonds}`})
                  </span>
                )}
              </>
            )}
          </Button>
        )}
      </div>

      {loadingDetails ? (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {prizes.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-bold flex items-center gap-2">
                <Medal className="w-4 h-4 text-yellow-500" />
                Prémios
              </h4>
              <div className="space-y-2">
                {prizes.map((prize) => (
                  <div
                    key={prize.placement}
                    className={`flex items-center gap-3 rounded-lg p-3 border ${
                      prize.placement === 1
                        ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20"
                        : prize.placement === 2
                        ? "border-gray-300 bg-gray-50 dark:bg-gray-900/20"
                        : prize.placement === 3
                        ? "border-amber-600 bg-amber-50 dark:bg-amber-950/20"
                        : "border-border bg-card"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        prize.placement === 1
                          ? "bg-yellow-400 text-yellow-900"
                          : prize.placement === 2
                          ? "bg-gray-300 text-gray-700"
                          : prize.placement === 3
                          ? "bg-amber-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {prize.placement === 1
                        ? "🥇"
                        : prize.placement === 2
                        ? "🥈"
                        : prize.placement === 3
                        ? "🥉"
                        : `#${prize.placement}`}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {prize.prize_coins > 0 && (
                          <span className="text-sm font-semibold text-yellow-600">
                            🪙 {prize.prize_coins}
                          </span>
                        )}
                        {prize.prize_diamonds > 0 && (
                          <span className="text-sm font-semibold text-blue-500">
                            💎 {prize.prize_diamonds}
                          </span>
                        )}
                      </div>
                      {prize.special_badge && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Emblema: {prize.special_badge}
                        </p>
                      )}
                      {prize.special_title && (
                        <p className="text-xs text-primary mt-0.5">
                          Título: "{prize.special_title}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {standings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-bold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Classificação Atual
              </h4>
              <div className="rounded-xl border border-border overflow-hidden">
                {standings.slice(0, 8).map((entry: any, idx: number) => (
                  <div
                    key={entry.student_id || idx}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      idx % 2 === 0 ? "bg-card" : "bg-muted/30"
                    } ${entry.student_id === studentId ? "bg-primary/10 font-semibold" : ""}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? "bg-yellow-400 text-yellow-900"
                          : idx === 1
                          ? "bg-gray-300 text-gray-700"
                          : idx === 2
                          ? "bg-amber-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">
                      {entry.display_name || entry.nickname || "Jogador"}
                      {entry.student_id === studentId && " (Tu)"}
                    </span>
                    <span className="text-xs text-green-600 font-semibold">{entry.matches_won}V</span>
                    <span className="text-xs text-red-500 font-semibold">{entry.matches_lost}D</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
