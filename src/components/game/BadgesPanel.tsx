import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Crown, Lock } from "lucide-react";
import { toast } from "sonner";

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xp_reward: number;
  coins_reward: number;
  diamonds_reward: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

interface Title {
  id: string;
  key: string;
  title: string;
  description: string;
  color: string;
  rarity: string;
  unlocked?: boolean;
}

interface BadgesPanelProps {
  studentId: string;
}

const rarityColors: Record<string, string> = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-amber-500",
};

const categoryLabels: Record<string, string> = {
  progression: "Progressão",
  accuracy: "Precisão",
  streaks: "Sequências",
  subjects: "Disciplinas",
  village: "Aldeia",
  wealth: "Riqueza",
  social: "Social",
};

export function BadgesPanel({ studentId }: BadgesPanelProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [equippedTitleId, setEquippedTitleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadgesAndTitles();
  }, [studentId]);

  const loadBadgesAndTitles = async () => {
    setLoading(true);
    try {
      const [badgesResult, studentBadgesResult, titlesResult, studentTitlesResult, studentResult] = await Promise.all([
        supabase.from("badges").select("*").order("sort_order"),
        supabase.from("student_badges").select("badge_id, unlocked_at").eq("student_id", studentId),
        supabase.from("achievement_titles").select("*"),
        supabase.from("student_titles").select("title_id").eq("student_id", studentId),
        supabase.from("students").select("equipped_title_id").eq("id", studentId).single(),
      ]);

      if (badgesResult.error) throw badgesResult.error;
      if (titlesResult.error) throw titlesResult.error;

      const unlockedBadgeIds = new Set(
        (studentBadgesResult.data || []).map((sb: any) => sb.badge_id)
      );

      const badgesWithStatus = (badgesResult.data || []).map((badge: any) => ({
        ...badge,
        unlocked: unlockedBadgeIds.has(badge.id),
        unlocked_at: (studentBadgesResult.data || []).find((sb: any) => sb.badge_id === badge.id)?.unlocked_at,
      }));

      const unlockedTitleIds = new Set(
        (studentTitlesResult.data || []).map((st: any) => st.title_id)
      );

      const titlesWithStatus = (titlesResult.data || []).map((title: any) => ({
        ...title,
        unlocked: unlockedTitleIds.has(title.id),
      }));

      setBadges(badgesWithStatus);
      setTitles(titlesWithStatus);
      setEquippedTitleId(studentResult.data?.equipped_title_id || null);
    } catch (error) {
      console.error("Error loading badges and titles:", error);
      toast.error("Erro ao carregar badges e títulos");
    } finally {
      setLoading(false);
    }
  };

  const equipTitle = async (titleId: string) => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ equipped_title_id: titleId })
        .eq("id", studentId);

      if (error) throw error;

      setEquippedTitleId(titleId);
      toast.success("Título equipado!");
    } catch (error) {
      console.error("Error equipping title:", error);
      toast.error("Erro ao equipar título");
    }
  };

  const unequipTitle = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ equipped_title_id: null })
        .eq("id", studentId);

      if (error) throw error;

      setEquippedTitleId(null);
      toast.success("Título removido");
    } catch (error) {
      console.error("Error unequipping title:", error);
      toast.error("Erro ao remover título");
    }
  };

  const badgesByCategory = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5" />
          Conquistas
        </CardTitle>
        <CardDescription>
          Desbloqueia badges e equipa títulos especiais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="badges">
          <TabsList className="w-full">
            <TabsTrigger value="badges" className="flex-1">
              <Award className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="titles" className="flex-1">
              <Crown className="w-4 h-4 mr-2" />
              Títulos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm mb-2">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className={`relative p-3 rounded-lg border transition-all ${
                            badge.unlocked
                              ? "bg-card border-primary/20 hover:border-primary/40"
                              : "bg-muted border-muted-foreground/20 opacity-60"
                          }`}
                        >
                          {!badge.unlocked && (
                            <div className="absolute top-2 right-2">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col items-center text-center space-y-2">
                            <span className="text-3xl">{badge.icon}</span>
                            <div className="space-y-1">
                              <p className="font-semibold text-sm">{badge.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {badge.description}
                              </p>
                              <BadgeUI className={rarityColors[badge.rarity]}>
                                {badge.rarity}
                              </BadgeUI>
                            </div>
                            {badge.unlocked && (
                              <div className="text-xs text-muted-foreground">
                                +{badge.coins_reward} 🪙 +{badge.diamonds_reward} 💎
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                {badges.filter((b) => b.unlocked).length} / {badges.length} badges desbloqueados
              </p>
            </div>
          </TabsContent>

          <TabsContent value="titles">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {titles.map((title) => (
                  <div
                    key={title.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      title.unlocked
                        ? equippedTitleId === title.id
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border hover:border-primary/50"
                        : "bg-muted border-muted-foreground/20 opacity-60 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (title.unlocked) {
                        if (equippedTitleId === title.id) {
                          unequipTitle();
                        } else {
                          equipTitle(title.id);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold"
                            style={{ color: title.unlocked ? title.color : undefined }}
                          >
                            {title.title}
                          </span>
                          {!title.unlocked && <Lock className="w-4 h-4" />}
                          {equippedTitleId === title.id && (
                            <BadgeUI className="bg-primary">Equipado</BadgeUI>
                          )}
                          <BadgeUI className={rarityColors[title.rarity]}>
                            {title.rarity}
                          </BadgeUI>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{title.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                {titles.filter((t) => t.unlocked).length} / {titles.length} títulos desbloqueados
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
