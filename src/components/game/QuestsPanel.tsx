import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Target, Clock, Gift, CircleCheck as CheckCircle, Calendar, CalendarDays, Sparkles } from "lucide-react";

interface Quest {
  id: string;
  template_id: string;
  frequency: "daily" | "weekly";
  current_progress: number;
  target_value: number;
  is_completed: boolean;
  completed_at: string | null;
  rewards_claimed: boolean;
  expires_at: string;
  quest_data: {
    name: string;
    description: string;
    icon: string;
    quest_type: string;
    reward_coins: number;
    reward_diamonds: number;
    reward_xp: number;
  };
}

interface QuestsPanelProps {
  studentId: string;
  onClose?: () => void;
}

export function QuestsPanel({ studentId, onClose }: QuestsPanelProps) {
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
    const interval = setInterval(loadQuests, 30000);
    return () => clearInterval(interval);
  }, [studentId]);

  const loadQuests = async () => {
    try {
      await generateQuestsIfNeeded();

      const { data, error } = await supabase
        .from("active_quests")
        .select("*")
        .eq("student_id", studentId)
        .gte("expires_at", new Date().toISOString())
        .order("frequency", { ascending: true })
        .order("is_completed", { ascending: true });

      if (error) throw error;

      const daily = data?.filter((q) => q.frequency === "daily") || [];
      const weekly = data?.filter((q) => q.frequency === "weekly") || [];

      setDailyQuests(daily);
      setWeeklyQuests(weekly);
    } catch (error) {
      console.error("Error loading quests:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestsIfNeeded = async () => {
    try {
      await Promise.all([
        supabase.rpc("generate_daily_quests", {
          student_id_param: studentId,
        }),
        supabase.rpc("generate_weekly_quests", {
          student_id_param: studentId,
        }),
      ]);
    } catch (error) {
      console.error("Error generating quests:", error);
    }
  };

  const claimRewards = async (questId: string) => {
    setClaiming(questId);
    try {
      const { data, error } = await supabase.rpc("claim_quest_rewards", {
        quest_id_param: questId,
      });

      if (error) throw error;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(
        `Recompensas recebidas! +${data.coins}🪙 +${data.diamonds}💎 +${data.xp}⭐`,
        { duration: 4000 }
      );

      loadQuests();
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
      toast.error(error.message || "Erro ao reclamar recompensas");
    } finally {
      setClaiming(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expirado";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const renderQuest = (quest: Quest) => {
    const progress = (quest.current_progress / quest.target_value) * 100;
    const isCompleted = quest.is_completed && !quest.rewards_claimed;
    const isClaimed = quest.rewards_claimed;

    return (
      <Card
        key={quest.id}
        className={`
          transition-all duration-300
          ${isCompleted ? "border-green-500 bg-green-500/5" : ""}
          ${isClaimed ? "opacity-60" : ""}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="text-3xl">{quest.quest_data.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{quest.quest_data.name}</h4>
                  {isClaimed && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Concluída
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {quest.quest_data.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeRemaining(quest.expires_at)}</span>
                </div>
              </div>
            </div>

            {!isClaimed && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm mb-1">
                  <span className="text-yellow-600 font-semibold">
                    {quest.quest_data.reward_coins}
                  </span>
                  <span>🪙</span>
                </div>
                <div className="flex items-center gap-1 text-sm mb-1">
                  <span className="text-blue-600 font-semibold">
                    {quest.quest_data.reward_diamonds}
                  </span>
                  <span>💎</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-purple-600 font-semibold">
                    {quest.quest_data.reward_xp}
                  </span>
                  <span>⭐</span>
                </div>
              </div>
            )}
          </div>

          {!isClaimed && (
            <>
              <div className="mb-2">
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {quest.current_progress} / {quest.target_value}
                </span>
                {isCompleted && (
                  <Button
                    size="sm"
                    onClick={() => claimRewards(quest.id)}
                    disabled={claiming === quest.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {claiming === quest.id ? "A reclamar..." : "Reclamar"}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">A carregar missões...</p>
        </CardContent>
      </Card>
    );
  }

  const dailyCompleted = dailyQuests.filter((q) => q.is_completed).length;
  const weeklyCompleted = weeklyQuests.filter((q) => q.is_completed).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            Missões Diárias e Semanais
          </CardTitle>
          <CardDescription>
            Completa missões para ganhar recompensas extra!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <span className="font-semibold">Diárias</span>
              </div>
              <p className="text-2xl font-bold">
                {dailyCompleted}/{dailyQuests.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Concluídas hoje
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Semanais</span>
              </div>
              <p className="text-2xl font-bold">
                {weeklyCompleted}/{weeklyQuests.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Concluídas esta semana
              </p>
            </div>
          </div>

          <Tabs defaultValue="daily">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">
                <Calendar className="w-4 h-4 mr-2" />
                Diárias ({dailyQuests.length})
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <CalendarDays className="w-4 h-4 mr-2" />
                Semanais ({weeklyQuests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-3 mt-4">
              {dailyQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma missão diária disponível</p>
                </div>
              ) : (
                dailyQuests.map((quest) => renderQuest(quest))
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-3 mt-4">
              {weeklyQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma missão semanal disponível</p>
                </div>
              ) : (
                weeklyQuests.map((quest) => renderQuest(quest))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {(dailyCompleted > 0 || weeklyCompleted > 0) && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎉</div>
              <div>
                <p className="font-semibold text-green-600">Ótimo trabalho!</p>
                <p className="text-sm text-muted-foreground">
                  Continua a completar missões para ganhar mais recompensas!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
