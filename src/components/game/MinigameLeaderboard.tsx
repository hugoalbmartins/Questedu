import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Clock, Zap } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  student_name: string;
  high_score: number;
  best_time: number;
  total_plays: number;
}

interface MinigameLeaderboardProps {
  minigameName: string;
  displayName: string;
  studentId: string;
}

export function MinigameLeaderboard({
  minigameName,
  displayName,
  studentId,
}: MinigameLeaderboardProps) {
  const [easyLeaderboard, setEasyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mediumLeaderboard, setMediumLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hardLeaderboard, setHardLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboards();
    loadPlayerStats();
  }, [minigameName, studentId]);

  const loadLeaderboards = async () => {
    try {
      const [easy, medium, hard] = await Promise.all([
        supabase.rpc("get_minigame_leaderboard", {
          minigame_name: minigameName,
          difficulty_param: "easy",
          limit_param: 10,
        }),
        supabase.rpc("get_minigame_leaderboard", {
          minigame_name: minigameName,
          difficulty_param: "medium",
          limit_param: 10,
        }),
        supabase.rpc("get_minigame_leaderboard", {
          minigame_name: minigameName,
          difficulty_param: "hard",
          limit_param: 10,
        }),
      ]);

      if (easy.data) setEasyLeaderboard(easy.data);
      if (medium.data) setMediumLeaderboard(medium.data);
      if (hard.data) setHardLeaderboard(hard.data);
    } catch (error) {
      console.error("Error loading leaderboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerStats = async () => {
    try {
      const { data: minigame } = await supabase
        .from("minigames")
        .select("id")
        .eq("name", minigameName)
        .single();

      if (!minigame) return;

      const { data: scores } = await supabase
        .from("minigame_scores")
        .select("*")
        .eq("student_id", studentId)
        .eq("minigame_id", minigame.id);

      if (scores) {
        const stats = {
          easy: scores.find((s) => s.difficulty === "easy"),
          medium: scores.find((s) => s.difficulty === "medium"),
          hard: scores.find((s) => s.difficulty === "hard"),
        };
        setPlayerStats(stats);
      }
    } catch (error) {
      console.error("Error loading player stats:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return <span className="w-5 h-5 flex items-center justify-center font-bold text-xs">{rank}</span>;
  };

  const renderLeaderboard = (entries: LeaderboardEntry[], difficulty: string) => {
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Ainda não há classificações para este nível.</p>
          <p className="text-sm mt-2">Sê o primeiro a jogar!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={`
              flex items-center justify-between p-3 rounded-lg border
              ${entry.rank <= 3 ? "bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border-yellow-500/20" : "bg-card"}
              hover:shadow-md transition-all
            `}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-10">
                {getRankIcon(entry.rank)}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{entry.student_name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {entry.total_plays} jogos
                  </span>
                  {entry.best_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(entry.best_time)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{entry.high_score}</p>
              <p className="text-xs text-muted-foreground">pontos</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">A carregar classificações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Classificações - {displayName}
        </CardTitle>
        <CardDescription>
          Vê como te compara com outros jogadores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {playerStats && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="font-semibold mb-3 text-sm">Os Teus Recordes:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Fácil</Badge>
                <p className="text-lg font-bold">
                  {playerStats.easy?.high_score || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {playerStats.easy?.total_plays || 0} jogos
                </p>
              </div>
              <div className="text-center">
                <Badge variant="default" className="mb-2">Médio</Badge>
                <p className="text-lg font-bold">
                  {playerStats.medium?.high_score || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {playerStats.medium?.total_plays || 0} jogos
                </p>
              </div>
              <div className="text-center">
                <Badge variant="destructive" className="mb-2">Difícil</Badge>
                <p className="text-lg font-bold">
                  {playerStats.hard?.high_score || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {playerStats.hard?.total_plays || 0} jogos
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="medium">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="easy">Fácil</TabsTrigger>
            <TabsTrigger value="medium">Médio</TabsTrigger>
            <TabsTrigger value="hard">Difícil</TabsTrigger>
          </TabsList>
          <TabsContent value="easy" className="mt-4">
            {renderLeaderboard(easyLeaderboard, "easy")}
          </TabsContent>
          <TabsContent value="medium" className="mt-4">
            {renderLeaderboard(mediumLeaderboard, "medium")}
          </TabsContent>
          <TabsContent value="hard" className="mt-4">
            {renderLeaderboard(hardLeaderboard, "hard")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
