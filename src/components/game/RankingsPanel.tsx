import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, MapPin, School, Globe, Clock, Calendar } from "lucide-react";

interface RankingEntry {
  student_id: string;
  student_name: string;
  rank_position: number;
  score: number;
  rank_tier: string;
  questions_answered: number;
  accuracy_percentage: number;
  streak_days: number;
  school_name: string | null;
}

interface StudentRank {
  rank_position: number;
  score: number;
  rank_tier: string;
  total_participants: number;
}

interface RankingsPanelProps {
  studentId: string;
  district: string | null;
  schoolName: string | null;
}

const districtLabels: Record<string, string> = {
  aveiro: "Aveiro", beja: "Beja", braga: "Braga", braganca: "Bragança",
  castelo_branco: "Castelo Branco", coimbra: "Coimbra", evora: "Évora",
  faro: "Faro", guarda: "Guarda", leiria: "Leiria", lisboa: "Lisboa",
  portalegre: "Portalegre", porto: "Porto", santarem: "Santarém",
  setubal: "Setúbal", viana_castelo: "Viana do Castelo", vila_real: "Vila Real",
  viseu: "Viseu", acores: "Açores", madeira: "Madeira",
};

export const RankingsPanel = ({ studentId, district, schoolName }: RankingsPanelProps) => {
  const [globalRanking, setGlobalRanking] = useState<RankingEntry[]>([]);
  const [schoolRanking, setSchoolRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const [myRank, setMyRank] = useState<StudentRank | null>(null);

  useEffect(() => {
    fetchRankings();
  }, [studentId, period]);

  const fetchRankings = async () => {
    setLoading(true);

    try {
      const { data: globalData, error: globalError } = await supabase
        .rpc('get_leaderboard_rankings', {
          leaderboard_type_param: 'global',
          period_param: period,
          limit_param: 50
        });

      if (globalError) throw globalError;
      if (globalData) setGlobalRanking(globalData);

      const { data: schoolData, error: schoolError } = await supabase
        .rpc('get_leaderboard_rankings', {
          leaderboard_type_param: 'school',
          period_param: period,
          limit_param: 50
        });

      if (schoolError) throw schoolError;
      if (schoolData) setSchoolRanking(schoolData);

      const { data: rankData, error: rankError } = await supabase
        .rpc('get_student_rank', {
          student_id_param: studentId,
          leaderboard_type_param: 'global',
          period_param: period
        });

      if (rankError) throw rankError;
      if (rankData && rankData.length > 0) setMyRank(rankData[0]);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>;
  };

  const getTierBadge = (tier: string) => {
    const tierColors: Record<string, string> = {
      bronze: 'bg-orange-900/20 text-orange-600 border-orange-600/30',
      silver: 'bg-gray-400/20 text-gray-600 border-gray-600/30',
      gold: 'bg-yellow-500/20 text-yellow-600 border-yellow-600/30',
      platinum: 'bg-cyan-500/20 text-cyan-600 border-cyan-600/30',
      diamond: 'bg-blue-500/20 text-blue-600 border-blue-600/30',
      master: 'bg-purple-500/20 text-purple-600 border-purple-600/30',
      grandmaster: 'bg-red-500/20 text-red-600 border-red-600/30'
    };
    const tierIcons: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
      diamond: '💠',
      master: '👑',
      grandmaster: '⭐'
    };
    return (
      <Badge className={`text-xs ${tierColors[tier] || tierColors.bronze}`}>
        {tierIcons[tier] || ''} {tier.toUpperCase()}
      </Badge>
    );
  };

  const RankingList = ({ entries, currentStudentId }: { entries: RankingEntry[]; currentStudentId: string }) => (
    <div className="space-y-2">
      {entries.map(entry => (
        <div
          key={entry.student_id}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            entry.student_id === currentStudentId ? "bg-primary/10 border border-primary" : "bg-muted/50"
          }`}
        >
          <div className="w-8 text-center">
            {getRankIcon(entry.rank_position)}
          </div>
          <div className="flex-1">
            <p className="font-body font-semibold text-sm">
              {entry.student_name}
              {entry.student_id === currentStudentId && <span className="text-primary ml-1">(Tu)</span>}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {getTierBadge(entry.rank_tier)}
              <p className="text-xs text-muted-foreground">
                {entry.accuracy_percentage.toFixed(0)}% precisão
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="font-mono">
              {entry.score.toLocaleString()} pts
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {entry.questions_answered} perguntas
            </p>
          </div>
        </div>
      ))}
      {entries.length === 0 && (
        <p className="text-center text-muted-foreground py-4">Sem dados disponíveis</p>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">A carregar rankings...</div>;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Rankings
        </h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={period === 'weekly' ? 'default' : 'ghost'}
            onClick={() => setPeriod('weekly')}
            className="text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            Semanal
          </Button>
          <Button
            size="sm"
            variant={period === 'monthly' ? 'default' : 'ghost'}
            onClick={() => setPeriod('monthly')}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Mensal
          </Button>
          <Button
            size="sm"
            variant={period === 'all_time' ? 'default' : 'ghost'}
            onClick={() => setPeriod('all_time')}
            className="text-xs"
          >
            <Trophy className="w-3 h-3 mr-1" />
            Total
          </Button>
        </div>
      </div>

      {myRank && (
        <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">A Tua Posição</p>
              <p className="text-2xl font-bold text-primary">
                #{myRank.rank_position}
              </p>
              <p className="text-xs text-muted-foreground">
                de {myRank.total_participants} participantes
              </p>
            </div>
            <div className="text-right">
              {getTierBadge(myRank.rank_tier)}
              <p className="text-sm font-mono mt-1">
                {myRank.score.toLocaleString()} pts
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="global">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="global" className="gap-1 text-xs">
            <Globe className="w-3 h-3" /> Global
          </TabsTrigger>
          <TabsTrigger value="school" className="gap-1 text-xs" disabled={!schoolName}>
            <School className="w-3 h-3" /> Escola
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Top 50 Global
            {myRank && myRank.rank_position <= 10 && (
              <Badge className="ml-auto">Top 10! 🎉</Badge>
            )}
          </div>
          <RankingList entries={globalRanking} currentStudentId={studentId} />
        </TabsContent>

        <TabsContent value="school">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <School className="w-3 h-3" /> Top 50 da {schoolName || "Escola"}
          </div>
          <RankingList entries={schoolRanking} currentStudentId={studentId} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};