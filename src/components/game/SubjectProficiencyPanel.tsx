import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SubjectLevel {
  subject: string;
  current_level: number;
  accuracy_percentage: number;
  recent_performance: number;
  total_questions_answered: number;
}

interface SubjectProficiencyPanelProps {
  studentId: string;
}

const subjectLabels: Record<string, string> = {
  portugues: "Português",
  matematica: "Matemática",
  estudo_meio: "Estudo do Meio",
  ingles: "Inglês",
};

const levelLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Iniciante", color: "bg-gray-500" },
  2: { label: "Aprendiz", color: "bg-blue-500" },
  3: { label: "Competente", color: "bg-green-500" },
  4: { label: "Avançado", color: "bg-purple-500" },
  5: { label: "Mestre", color: "bg-amber-500" },
};

export function SubjectProficiencyPanel({ studentId }: SubjectProficiencyPanelProps) {
  const [subjectLevels, setSubjectLevels] = useState<SubjectLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjectLevels();
  }, [studentId]);

  const loadSubjectLevels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_subject_levels")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;

      setSubjectLevels(data || []);
    } catch (error) {
      console.error("Error loading subject levels:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (recentPerformance: number) => {
    if (recentPerformance >= 0.8) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (recentPerformance >= 0.6) {
      return <Minus className="w-4 h-4 text-yellow-500" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">A carregar proficiência...</p>
        </CardContent>
      </Card>
    );
  }

  if (subjectLevels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Proficiência por Disciplina
          </CardTitle>
          <CardDescription className="text-xs">
            Responde a quizzes para começar a desenvolver as tuas competências
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-center text-muted-foreground">
            Ainda não respondeste a nenhuma pergunta. Começa agora!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Proficiência por Disciplina
        </CardTitle>
        <CardDescription className="text-xs">
          O sistema adapta-se ao teu desempenho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjectLevels.map((level) => {
          const levelConfig = levelLabels[level.current_level] || levelLabels[1];
          const progressToNextLevel = ((level.recent_performance * 100) % 20) * 5;

          return (
            <div key={level.subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {subjectLabels[level.subject] || level.subject}
                  </span>
                  {getTrendIcon(level.recent_performance)}
                </div>
                <Badge className={levelConfig.color}>
                  Nível {level.current_level} - {levelConfig.label}
                </Badge>
              </div>

              <div className="space-y-1">
                <Progress value={progressToNextLevel} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precisão: {level.accuracy_percentage.toFixed(0)}%</span>
                  <span>{level.total_questions_answered} perguntas</span>
                </div>
              </div>

              {level.current_level < 5 && (
                <p className="text-xs text-muted-foreground">
                  {level.recent_performance >= 0.85
                    ? "Continua assim! Estás prestes a subir de nível!"
                    : level.recent_performance >= 0.70
                    ? "Bom desempenho! Mantém a consistência."
                    : "Treina mais para melhorar o teu nível."}
                </p>
              )}
            </div>
          );
        })}

        <div className="pt-2 border-t">
          <p className="text-xs text-center text-muted-foreground">
            As perguntas adaptam-se automaticamente ao teu nível
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
