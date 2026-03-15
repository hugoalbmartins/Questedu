import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Flame, Gift, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface StreakBonus {
  streak_days: number;
  title: string;
  description: string;
  icon: string;
  bonus_coins: number;
  bonus_diamonds: number;
  bonus_xp: number;
  bonus_multiplier: number;
  is_milestone: boolean;
  claimed?: boolean;
}

interface StreakBonusesPanelProps {
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  onUpdate?: () => void;
}

export function StreakBonusesPanel({
  studentId,
  currentStreak,
  longestStreak,
  onUpdate,
}: StreakBonusesPanelProps) {
  const [streakBonuses, setStreakBonuses] = useState<StreakBonus[]>([]);
  const [claimedBonuses, setClaimedBonuses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakBonuses();
  }, [studentId]);

  const loadStreakBonuses = async () => {
    setLoading(true);
    try {
      const [bonusesResult, claimsResult] = await Promise.all([
        supabase.from("streak_bonuses").select("*").order("streak_days"),
        supabase
          .from("streak_bonus_claims")
          .select("streak_days")
          .eq("student_id", studentId),
      ]);

      if (bonusesResult.error) throw bonusesResult.error;

      const claimed = new Set(
        (claimsResult.data || []).map((claim: any) => claim.streak_days)
      );

      const bonusesWithStatus = (bonusesResult.data || []).map((bonus: any) => ({
        ...bonus,
        claimed: claimed.has(bonus.streak_days),
      }));

      setStreakBonuses(bonusesWithStatus);
      setClaimedBonuses(claimed);
    } catch (error) {
      console.error("Error loading streak bonuses:", error);
      toast.error("Erro ao carregar bónus");
    } finally {
      setLoading(false);
    }
  };

  const claimBonuses = async () => {
    try {
      const { data, error } = await supabase.rpc("check_and_award_streak_bonuses", {
        student_id_param: studentId,
      });

      if (error) throw error;

      if (data && data.awarded && data.awarded.length > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        const message = `Bónus Reclamados: +${data.total_coins}🪙 +${data.total_diamonds}💎 +${data.total_xp}⭐`;
        toast.success(message, {
          duration: 5000,
        });

        await loadStreakBonuses();
        if (onUpdate) onUpdate();
      } else {
        toast.info("Sem novos bónus disponíveis");
      }
    } catch (error) {
      console.error("Error claiming bonuses:", error);
      toast.error("Erro ao reclamar bónus");
    }
  };

  const nextBonus = streakBonuses.find(
    (bonus) => bonus.streak_days > currentStreak
  );

  const progressToNext = nextBonus
    ? (currentStreak / nextBonus.streak_days) * 100
    : 100;

  const unclaimedBonuses = streakBonuses.filter(
    (bonus) => bonus.streak_days <= currentStreak && !bonus.claimed
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Sequência de Estudo
          </CardTitle>
          <CardDescription>
            Mantém a tua sequência para ganhar bónus incríveis!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-bold text-orange-500">{currentStreak}</p>
              <p className="text-sm text-muted-foreground">Dias seguidos</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-muted-foreground">
                {longestStreak}
              </p>
              <p className="text-xs text-muted-foreground">Recorde pessoal</p>
            </div>
          </div>

          {nextBonus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Próximo bónus</span>
                <span className="font-semibold">
                  {nextBonus.streak_days} dias {nextBonus.icon}
                </span>
              </div>
              <Progress value={progressToNext} className="h-3" />
              <p className="text-xs text-center text-muted-foreground">
                Faltam {nextBonus.streak_days - currentStreak} dias para{" "}
                {nextBonus.title}
              </p>
            </div>
          )}

          {unclaimedBonuses.length > 0 && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold">
                    {unclaimedBonuses.length} Bónus Disponíveis!
                  </span>
                </div>
                <Button onClick={claimBonuses} className="bg-orange-500 hover:bg-orange-600">
                  Reclamar Todos
                </Button>
              </div>
              <div className="space-y-1">
                {unclaimedBonuses.map((bonus) => (
                  <div
                    key={bonus.streak_days}
                    className="text-sm flex items-center gap-2 bg-background/50 p-2 rounded"
                  >
                    <span>{bonus.icon}</span>
                    <span className="flex-1">{bonus.title}</span>
                    <span className="text-xs font-semibold">
                      +{bonus.bonus_coins}🪙 +{bonus.bonus_diamonds}💎 +{bonus.bonus_xp}⭐
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Todas as Recompensas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {streakBonuses.map((bonus) => {
              const isAchieved = currentStreak >= bonus.streak_days;
              const isClaimed = bonus.claimed;

              return (
                <div
                  key={bonus.streak_days}
                  className={`p-3 rounded-lg border transition-all ${
                    isAchieved
                      ? isClaimed
                        ? "bg-muted/50 border-muted"
                        : "bg-orange-500/5 border-orange-500/30 shadow-sm"
                      : "bg-card border-border opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bonus.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{bonus.title}</p>
                          {bonus.is_milestone && (
                            <Badge variant="outline" className="text-xs">
                              Marco
                            </Badge>
                          )}
                          {isClaimed && (
                            <Badge className="bg-green-500 text-xs">
                              ✓ Reclamado
                            </Badge>
                          )}
                          {isAchieved && !isClaimed && (
                            <Badge className="bg-orange-500 text-xs animate-pulse">
                              Disponível!
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {bonus.streak_days} dias consecutivos
                        </p>
                        {bonus.description && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {bonus.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm space-y-0.5">
                      <p className="font-bold text-amber-600">+{bonus.bonus_coins}🪙</p>
                      <p className="font-bold text-blue-600">+{bonus.bonus_diamonds}💎</p>
                      <p className="font-bold text-yellow-600">+{bonus.bonus_xp}⭐</p>
                      {bonus.bonus_multiplier > 1 && (
                        <p className="text-xs text-primary font-semibold">
                          {bonus.bonus_multiplier}x multiplicador
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
