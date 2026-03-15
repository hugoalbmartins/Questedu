import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BookOpen, Target, Calendar, Award, TriangleAlert as AlertTriangle } from "lucide-react";

interface Student {
  id: string;
  display_name: string;
  school_year: string;
}

interface ProgressAnalytics {
  total_questions_answered: number;
  correct_answers: number;
  portuguese_correct: number;
  portuguese_total: number;
  math_correct: number;
  math_total: number;
  science_correct: number;
  science_total: number;
  english_correct: number;
  english_total: number;
  average_time_per_question: number;
  longest_streak: number;
  current_streak: number;
  last_quiz_date: string;
}

interface ErrorNotebookEntry {
  subject: string;
  reviewed: boolean;
  mastered: boolean;
}

interface StudentProgressDashboardProps {
  student: Student;
}

const SUBJECT_NAMES: Record<string, string> = {
  portugues: "Português",
  matematica: "Matemática",
  estudo_do_meio: "Estudo do Meio",
  ingles: "Inglês",
};

const SUBJECT_COLORS: Record<string, string> = {
  portugues: "bg-blue-500",
  matematica: "bg-purple-500",
  estudo_do_meio: "bg-green-500",
  ingles: "bg-orange-500",
};

export function StudentProgressDashboard({ student }: StudentProgressDashboardProps) {
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [errorStats, setErrorStats] = useState<{ total: number; unreviewed: number; mastered: number }>({
    total: 0,
    unreviewed: 0,
    mastered: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [student.id]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // Load analytics
      const { data: analyticsData } = await supabase
        .from("student_progress_analytics")
        .select("*")
        .eq("student_id", student.id)
        .single();

      if (analyticsData) {
        setAnalytics(analyticsData);
      }

      // Load error notebook stats
      const { data: errorData } = await supabase
        .from("error_notebook")
        .select("subject, reviewed, mastered")
        .eq("student_id", student.id);

      if (errorData) {
        setErrorStats({
          total: errorData.length,
          unreviewed: errorData.filter(e => !e.reviewed).length,
          mastered: errorData.filter(e => e.mastered).length,
        });
      }
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">A carregar progresso...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Ainda não há dados de progresso disponíveis.
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallAccuracy = analytics.total_questions_answered > 0
    ? Math.round((analytics.correct_answers / analytics.total_questions_answered) * 100)
    : 0;

  const subjects = [
    {
      key: "portugues",
      name: "Português",
      correct: analytics.portuguese_correct,
      total: analytics.portuguese_total,
      color: SUBJECT_COLORS.portugues,
    },
    {
      key: "matematica",
      name: "Matemática",
      correct: analytics.math_correct,
      total: analytics.math_total,
      color: SUBJECT_COLORS.matematica,
    },
    {
      key: "estudo_do_meio",
      name: "Estudo do Meio",
      correct: analytics.science_correct,
      total: analytics.science_total,
      color: SUBJECT_COLORS.estudo_do_meio,
    },
    {
      key: "ingles",
      name: "Inglês",
      correct: analytics.english_correct,
      total: analytics.english_total,
      color: SUBJECT_COLORS.ingles,
    },
  ];

  const daysSinceLastQuiz = analytics.last_quiz_date
    ? Math.floor((Date.now() - new Date(analytics.last_quiz_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo do Progresso - {student.display_name}
          </CardTitle>
          <CardDescription>{student.school_year}º Ano</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Precisão Global
              </div>
              <div className="text-3xl font-bold">{overallAccuracy}%</div>
              <Progress value={overallAccuracy} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Total de Questões
              </div>
              <div className="text-3xl font-bold">{analytics.total_questions_answered}</div>
              <div className="text-xs text-muted-foreground">
                {analytics.correct_answers} corretas
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                Sequência Atual
              </div>
              <div className="text-3xl font-bold">{analytics.current_streak} 🔥</div>
              <div className="text-xs text-muted-foreground">
                Máxima: {analytics.longest_streak} dias
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Último Quiz
              </div>
              <div className="text-xl font-bold">
                {daysSinceLastQuiz === null
                  ? "Nunca"
                  : daysSinceLastQuiz === 0
                  ? "Hoje"
                  : daysSinceLastQuiz === 1
                  ? "Ontem"
                  : `Há ${daysSinceLastQuiz}d`}
              </div>
              {daysSinceLastQuiz !== null && daysSinceLastQuiz > 3 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Inativo
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Disciplina</CardTitle>
          <CardDescription>Taxas de acerto por matéria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map((subject) => {
              const accuracy = subject.total > 0
                ? Math.round((subject.correct / subject.total) * 100)
                : 0;

              return (
                <div key={subject.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                      <span className="font-medium">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {subject.correct}/{subject.total}
                      </span>
                      <span className="font-bold text-lg min-w-[50px] text-right">
                        {subject.total > 0 ? `${accuracy}%` : "—"}
                      </span>
                    </div>
                  </div>
                  <Progress value={accuracy} className="h-2" />
                  {accuracy < 50 && subject.total >= 5 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Precisa de mais prática</span>
                    </div>
                  )}
                  {accuracy >= 80 && subject.total >= 10 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Award className="h-3 w-3" />
                      <span>Excelente desempenho!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caderno de Erros</CardTitle>
          <CardDescription>Acompanhamento de dificuldades e evolução</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600">{errorStats.total}</div>
              <div className="text-sm text-red-700 mt-1">Erros Registados</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-3xl font-bold text-amber-600">{errorStats.unreviewed}</div>
              <div className="text-sm text-amber-700 mt-1">Por Rever</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">{errorStats.mastered}</div>
              <div className="text-sm text-green-700 mt-1">Dominados</div>
            </div>
          </div>
          {errorStats.unreviewed > 5 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Sugestão:</strong> O seu educando tem {errorStats.unreviewed} erros por rever.
                  Incentive-o a usar o Caderno de Erros para consolidar a aprendizagem.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
