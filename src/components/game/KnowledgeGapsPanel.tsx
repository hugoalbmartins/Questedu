import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TriangleAlert as AlertTriangle, Brain, CircleCheck as CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface KnowledgeGap {
  subject: string;
  topic: string;
  severity: string;
  accuracy: number;
  recommended_questions: number;
  tip: string;
}

interface TopicPerformance {
  subject: string;
  topic: string;
  accuracy_percentage: number;
  total_questions: number;
  mastery_level: string;
  needs_review: boolean;
}

interface KnowledgeGapsPanelProps {
  studentId: string;
  onStartPractice?: (subject: string, topic: string) => void;
}

const subjectLabels: Record<string, string> = {
  portugues: "Português",
  matematica: "Matemática",
  estudo_meio: "Estudo do Meio",
  ingles: "Inglês",
};

const severityConfig: Record<string, { label: string; color: string; icon: any }> = {
  high: { label: "Alta Prioridade", color: "bg-red-500", icon: AlertTriangle },
  medium: { label: "Média Prioridade", color: "bg-yellow-500", icon: TrendingUp },
  low: { label: "Baixa Prioridade", color: "bg-blue-500", icon: Brain },
};

const masteryConfig: Record<string, { label: string; color: string }> = {
  master: { label: "Mestre", color: "text-amber-500" },
  proficient: { label: "Proficiente", color: "text-green-500" },
  competent: { label: "Competente", color: "text-blue-500" },
  developing: { label: "Em Desenvolvimento", color: "text-yellow-500" },
  novice: { label: "Iniciante", color: "text-gray-500" },
};

export function KnowledgeGapsPanel({ studentId, onStartPractice }: KnowledgeGapsPanelProps) {
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKnowledgeData();
  }, [studentId]);

  const loadKnowledgeData = async () => {
    setLoading(true);
    try {
      await supabase.rpc("identify_knowledge_gaps", {
        student_id_param: studentId,
      });

      const { data: gapsData, error: gapsError } = await supabase.rpc(
        "get_practice_recommendations",
        {
          student_id_param: studentId,
        }
      );

      if (gapsError) throw gapsError;

      const { data: topicsData, error: topicsError } = await supabase
        .from("topic_performance")
        .select("*")
        .eq("student_id", studentId)
        .order("accuracy_percentage", { ascending: true })
        .limit(10);

      if (topicsError) throw topicsError;

      setGaps(gapsData || []);
      setTopicPerformance(topicsData || []);
    } catch (error) {
      console.error("Error loading knowledge data:", error);
      toast.error("Erro ao carregar análise de conhecimento");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">A analisar o teu progresso...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Áreas de Melhoria
          </CardTitle>
          <CardDescription>
            Recomendações personalizadas baseadas no teu desempenho
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gaps.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-semibold mb-1">Excelente Trabalho!</p>
              <p className="text-sm text-muted-foreground">
                Não tens lacunas de conhecimento identificadas. Continua assim!
              </p>
            </div>
          ) : (
            gaps.map((gap, index) => {
              const config = severityConfig[gap.severity];
              const Icon = config.icon;

              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" />
                        <h4 className="font-semibold">
                          {subjectLabels[gap.subject] || gap.subject}
                        </h4>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{gap.topic}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{gap.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">Precisão</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Progress value={gap.accuracy} className="h-2" />
                  </div>

                  <div className="bg-muted/50 p-3 rounded-md mb-3">
                    <p className="text-sm">{gap.tip}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Recomendado: {gap.recommended_questions} perguntas
                    </p>
                    {onStartPractice && (
                      <Button
                        size="sm"
                        onClick={() => onStartPractice(gap.subject, gap.topic)}
                      >
                        Praticar Agora
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {topicPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desempenho por Tópico</CardTitle>
            <CardDescription>
              Acompanha o teu progresso em cada área de estudo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topicPerformance.map((topic, index) => {
                const mastery = masteryConfig[topic.mastery_level] || masteryConfig.novice;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">
                          {subjectLabels[topic.subject] || topic.subject}
                        </p>
                        {topic.needs_review && (
                          <Badge variant="outline" className="text-xs">
                            Precisa Revisão
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{topic.topic}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={topic.accuracy_percentage} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium">
                          {topic.accuracy_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-xs font-semibold ${mastery.color}`}>
                        {mastery.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {topic.total_questions} questões
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
