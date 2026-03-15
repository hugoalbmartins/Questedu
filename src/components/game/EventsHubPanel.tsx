import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Star, Zap, Gift, ChevronRight, Clock, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  event_type: string;
  status: string;
  theme_color: string;
  starts_at: string;
  ends_at: string;
  bonus_xp_multiplier: number;
  bonus_coins_multiplier: number;
  special_currency: string | null;
  special_currency_icon: string | null;
  total_challenges: number;
}

interface HolidayBonus {
  id: string;
  name: string;
  xp_multiplier: number;
  coins_multiplier: number;
  starts_at: string;
  ends_at: string;
}

interface EventProgress {
  event_id: string;
  challenges_completed: number;
  special_currency_earned: number;
  rank: number | null;
}

interface EventsHubPanelProps {
  studentId: string;
  isPremium: boolean;
  onClose?: () => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  holiday: "Feriado",
  seasonal: "Sazonal",
  school: "Escolar",
  national: "Nacional",
  community: "Comunidade",
  special: "Especial",
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  holiday: "🎉",
  seasonal: "🌸",
  school: "📚",
  national: "🇵🇹",
  community: "🤝",
  special: "⭐",
};

function getTimeRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Terminado";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h restantes`;
  return `${hours}h restantes`;
}

export const EventsHubPanel = ({ studentId, isPremium, onClose }: EventsHubPanelProps) => {
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [holidayBonus, setHolidayBonus] = useState<HolidayBonus | null>(null);
  const [progress, setProgress] = useState<Record<string, EventProgress>>({});
  const [loading, setLoading] = useState(true);
  const [joiningEvent, setJoiningEvent] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SeasonalEvent | null>(null);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, holidayRes, progressRes] = await Promise.all([
        supabase
          .from("seasonal_events")
          .select("*")
          .in("status", ["active", "upcoming"])
          .order("starts_at", { ascending: true }),
        supabase.rpc("get_active_holiday_bonus" as any),
        supabase
          .from("student_event_progress")
          .select("*")
          .eq("student_id", studentId),
      ]);

      setEvents((eventsRes.data as SeasonalEvent[]) || []);
      setHolidayBonus((holidayRes.data as HolidayBonus) || null);

      const progressMap: Record<string, EventProgress> = {};
      ((progressRes.data as EventProgress[]) || []).forEach((p) => {
        progressMap[p.event_id] = p;
      });
      setProgress(progressMap);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleJoinEvent = async (eventId: string) => {
    setJoiningEvent(eventId);
    try {
      const { error } = await supabase.rpc("join_seasonal_event" as any, {
        p_student_id: studentId,
        p_event_id: eventId,
      });
      if (error) throw error;
      toast.success("Inscrito no evento com sucesso!");
      loadData();
    } catch {
      toast.error("Erro ao inscrever no evento");
    }
    setJoiningEvent(null);
  };

  const activeEvents = events.filter((e) => e.status === "active");
  const upcomingEvents = events.filter((e) => e.status === "upcoming");

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">A carregar eventos...</p>
      </div>
    );
  }

  if (selectedEvent) {
    return (
      <EventDetailView
        event={selectedEvent}
        progress={progress[selectedEvent.id]}
        studentId={studentId}
        isPremium={isPremium}
        onJoin={() => handleJoinEvent(selectedEvent.id)}
        joining={joiningEvent === selectedEvent.id}
        onBack={() => setSelectedEvent(null)}
        onRefresh={loadData}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Eventos</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {holidayBonus && (
        <div className="rounded-xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎉</div>
            <div className="flex-1">
              <p className="font-bold text-sm">{holidayBonus.name}</p>
              <p className="text-xs text-muted-foreground">Bónus ativo hoje!</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="bg-amber-500 text-white text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {holidayBonus.xp_multiplier}x XP
              </Badge>
              <Badge className="bg-yellow-500 text-white text-xs">
                {holidayBonus.coins_multiplier}x Moedas
              </Badge>
            </div>
          </div>
        </div>
      )}

      {activeEvents.length === 0 && upcomingEvents.length === 0 ? (
        <div className="text-center py-10 rounded-xl border-2 border-dashed border-border">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="font-body text-muted-foreground text-sm">Nenhum evento ativo de momento.</p>
          <p className="font-body text-xs text-muted-foreground mt-1">Volta mais tarde para eventos sazonais!</p>
        </div>
      ) : (
        <>
          {activeEvents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                A Decorrer
              </h4>
              {activeEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  progress={progress[event.id]}
                  isPremium={isPremium}
                  joining={joiningEvent === event.id}
                  onJoin={() => handleJoinEvent(event.id)}
                  onView={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          )}

          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Em Breve
              </h4>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  progress={progress[event.id]}
                  isPremium={isPremium}
                  joining={false}
                  onJoin={() => {}}
                  onView={() => setSelectedEvent(event)}
                  upcoming
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface EventCardProps {
  event: SeasonalEvent;
  progress?: EventProgress;
  isPremium: boolean;
  joining: boolean;
  onJoin: () => void;
  onView: () => void;
  upcoming?: boolean;
}

const EventCard = ({ event, progress, isPremium, joining, onJoin, onView, upcoming }: EventCardProps) => {
  const isJoined = !!progress;
  const timeRemaining = getTimeRemaining(upcoming ? event.starts_at : event.ends_at);
  const icon = EVENT_TYPE_ICONS[event.event_type] || "🎯";
  const label = EVENT_TYPE_LABELS[event.event_type] || event.event_type;

  return (
    <div
      className="rounded-xl border-2 border-border bg-card p-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm">{event.name}</p>
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              {label}
            </Badge>
            {!upcoming && isJoined && (
              <Badge className="bg-green-500 text-white text-[10px] h-4 px-1">
                Inscrito
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {event.bonus_xp_multiplier > 1 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                <Zap className="w-3 h-3" />
                {event.bonus_xp_multiplier}x XP
              </span>
            )}
            {event.bonus_coins_multiplier > 1 && (
              <span className="flex items-center gap-1 text-xs text-yellow-600 font-semibold">
                🪙 {event.bonus_coins_multiplier}x Moedas
              </span>
            )}
            {event.special_currency && (
              <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                {event.special_currency_icon || "✨"} {event.special_currency}
              </span>
            )}
          </div>

          {!upcoming && isJoined && event.total_challenges > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Desafios</span>
                <span className="text-xs font-semibold">
                  {progress?.challenges_completed || 0}/{event.total_challenges}
                </span>
              </div>
              <Progress
                value={((progress?.challenges_completed || 0) / event.total_challenges) * 100}
                className="h-1.5"
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {upcoming ? `Começa em: ${timeRemaining}` : timeRemaining}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {!upcoming && !isJoined && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            disabled={joining}
          >
            {joining ? "A inscrever..." : "Participar no evento"}
          </Button>
        </div>
      )}
    </div>
  );
};

interface EventDetailViewProps {
  event: SeasonalEvent;
  progress?: EventProgress;
  studentId: string;
  isPremium: boolean;
  onJoin: () => void;
  joining: boolean;
  onBack: () => void;
  onRefresh: () => void;
}

const EventDetailView = ({
  event,
  progress,
  studentId,
  isPremium,
  onJoin,
  joining,
  onBack,
}: EventDetailViewProps) => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [event.id]);

  const loadDetails = async () => {
    setLoadingDetails(true);
    try {
      const [challengesRes, leaderboardRes] = await Promise.all([
        supabase
          .from("event_challenges")
          .select("*")
          .eq("event_id", event.id)
          .order("difficulty_level", { ascending: true }),
        supabase.rpc("get_event_leaderboard" as any, {
          p_event_id: event.id,
          p_limit: 10,
        }),
      ]);
      setChallenges(challengesRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
    } catch {
      // silent
    }
    setLoadingDetails(false);
  };

  const isJoined = !!progress;
  const icon = EVENT_TYPE_ICONS[event.event_type] || "🎯";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Voltar
        </Button>
      </div>

      <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{icon}</div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold">{event.name}</h3>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.bonus_xp_multiplier > 1 && (
                <Badge className="bg-amber-500 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  {event.bonus_xp_multiplier}x XP
                </Badge>
              )}
              {event.bonus_coins_multiplier > 1 && (
                <Badge className="bg-yellow-500 text-white">
                  🪙 {event.bonus_coins_multiplier}x Moedas
                </Badge>
              )}
              {event.special_currency && (
                <Badge className="bg-blue-500 text-white">
                  {event.special_currency_icon || "✨"} {event.special_currency}
                </Badge>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.status === "active"
                ? `Termina: ${getTimeRemaining(event.ends_at)}`
                : `Começa: ${new Date(event.starts_at).toLocaleDateString("pt-PT")}`}
            </div>
          </div>
        </div>

        {isJoined && event.total_challenges > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">O teu progresso</span>
              <span className="text-sm font-bold text-primary">
                {progress?.challenges_completed || 0}/{event.total_challenges} desafios
              </span>
            </div>
            <Progress
              value={((progress?.challenges_completed || 0) / event.total_challenges) * 100}
              className="h-2"
            />
            {progress?.special_currency_earned && progress.special_currency_earned > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {event.special_currency_icon || "✨"} {progress.special_currency_earned}{" "}
                {event.special_currency} ganhos
              </p>
            )}
          </div>
        )}

        {!isJoined && event.status === "active" && (
          <Button
            className="w-full mt-4"
            onClick={onJoin}
            disabled={joining}
          >
            <Star className="w-4 h-4 mr-2" />
            {joining ? "A inscrever..." : "Participar no Evento"}
          </Button>
        )}
      </div>

      {loadingDetails ? (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {challenges.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Desafios do Evento
              </h4>
              {challenges.map((challenge, idx) => (
                <div
                  key={challenge.id}
                  className="rounded-lg border border-border bg-card p-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{challenge.name}</p>
                    {challenge.description && (
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {challenge.reward_xp > 0 && (
                        <span className="text-xs text-amber-600">+{challenge.reward_xp} XP</span>
                      )}
                      {challenge.reward_coins > 0 && (
                        <span className="text-xs text-yellow-600">+{challenge.reward_coins} 🪙</span>
                      )}
                      {challenge.reward_special_currency > 0 && (
                        <span className="text-xs text-blue-600">
                          +{challenge.reward_special_currency} {event.special_currency_icon || "✨"}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      challenge.difficulty_level <= 2
                        ? "border-green-500 text-green-600"
                        : challenge.difficulty_level <= 3
                        ? "border-yellow-500 text-yellow-600"
                        : "border-red-500 text-red-600"
                    }`}
                  >
                    {challenge.difficulty_level <= 2
                      ? "Fácil"
                      : challenge.difficulty_level <= 3
                      ? "Médio"
                      : "Difícil"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display text-base font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Classificação
              </h4>
              <div className="rounded-xl border border-border overflow-hidden">
                {leaderboard.slice(0, 5).map((entry: any, idx: number) => (
                  <div
                    key={entry.student_id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      idx % 2 === 0 ? "bg-card" : "bg-muted/30"
                    } ${entry.student_id === studentId ? "bg-primary/10" : ""}`}
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
                    <span className="flex-1 text-sm font-medium truncate">
                      {entry.display_name || entry.nickname || "Jogador"}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {entry.participation_score || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isPremium && (
            <div className="rounded-xl border-2 border-amber-400/50 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    Recompensas Exclusivas Premium
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Membros Premium ganham 1.5x mais recompensas em todos os eventos e têm acesso
                    a desafios exclusivos com prémios especiais.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
