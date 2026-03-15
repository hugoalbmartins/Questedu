import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Brain, TrendingUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle, BookOpen, Target } from 'lucide-react';

interface StudentAnalytics {
  studentId: string;
  studentName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  subjectPerformance: SubjectPerformance[];
  weeklyProgress: WeeklyProgress[];
  strengthsWeaknesses: { strengths: string[]; weaknesses: string[] };
}

interface SubjectPerformance {
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface WeeklyProgress {
  week: string;
  questions: number;
  accuracy: number;
}

interface Props {
  studentId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function LearningAnalyticsDashboard({ studentId }: Props) {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      loadAnalytics();
    }
  }, [studentId]);

  const loadAnalytics = async () => {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      const { data: responses } = await supabase
        .from('quiz_responses')
        .select('subject, is_correct, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (!responses) return;

      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      const subjectMap = new Map<string, { total: number; correct: number }>();
      responses.forEach(response => {
        const current = subjectMap.get(response.subject) || { total: 0, correct: 0 };
        subjectMap.set(response.subject, {
          total: current.total + 1,
          correct: current.correct + (response.is_correct ? 1 : 0)
        });
      });

      const subjectPerformance: SubjectPerformance[] = Array.from(subjectMap.entries())
        .map(([subject, data]) => ({
          subject,
          total: data.total,
          correct: data.correct,
          accuracy: (data.correct / data.total) * 100
        }))
        .sort((a, b) => b.total - a.total);

      const weekMap = new Map<string, { total: number; correct: number }>();
      responses.forEach(response => {
        const date = new Date(response.created_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        const current = weekMap.get(weekKey) || { total: 0, correct: 0 };
        weekMap.set(weekKey, {
          total: current.total + 1,
          correct: current.correct + (response.is_correct ? 1 : 0)
        });
      });

      const weeklyProgress: WeeklyProgress[] = Array.from(weekMap.entries())
        .map(([week, data]) => ({
          week: new Date(week).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
          questions: data.total,
          accuracy: (data.correct / data.total) * 100
        }))
        .slice(-8);

      const strengths = subjectPerformance
        .filter(s => s.accuracy >= 75)
        .map(s => s.subject)
        .slice(0, 3);

      const weaknesses = subjectPerformance
        .filter(s => s.accuracy < 60)
        .map(s => s.subject)
        .slice(0, 3);

      setAnalytics({
        studentId,
        studentName: student?.name || 'Aluno',
        totalQuestions,
        correctAnswers,
        accuracy,
        subjectPerformance,
        weeklyProgress,
        strengthsWeaknesses: { strengths, weaknesses }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <Brain className="h-8 w-8 animate-pulse text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics de Aprendizagem</h2>
        <p className="text-muted-foreground">
          Análise detalhada do desempenho de {analytics.studentName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Perguntas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.correctAnswers} respostas certas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisão Geral</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.accuracy.toFixed(1)}%</div>
            <Progress value={analytics.accuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.subjectPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.strengthsWeaknesses.strengths.length} pontos fortes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progresso Semanal
            </CardTitle>
            <CardDescription>
              Evolução de perguntas e precisão ao longo das semanas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="questions"
                  stroke="#3b82f6"
                  name="Perguntas"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  name="Precisão (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Disciplina</CardTitle>
            <CardDescription>
              Precisão em cada área de estudo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="accuracy" fill="#3b82f6" name="Precisão (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Pontos Fortes
            </CardTitle>
            <CardDescription>
              Disciplinas com melhor desempenho (≥75%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.strengthsWeaknesses.strengths.length > 0 ? (
              <div className="space-y-3">
                {analytics.strengthsWeaknesses.strengths.map(subject => {
                  const perf = analytics.subjectPerformance.find(s => s.subject === subject);
                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{subject}</span>
                        <span className="text-sm text-muted-foreground">
                          {perf?.accuracy.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={perf?.accuracy || 0} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Continua a praticar para identificar pontos fortes!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Áreas a Melhorar
            </CardTitle>
            <CardDescription>
              Disciplinas que precisam de mais atenção (&lt;60%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.strengthsWeaknesses.weaknesses.length > 0 ? (
              <div className="space-y-3">
                {analytics.strengthsWeaknesses.weaknesses.map(subject => {
                  const perf = analytics.subjectPerformance.find(s => s.subject === subject);
                  return (
                    <div key={subject} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{subject}</span>
                        <span className="text-sm text-muted-foreground">
                          {perf?.accuracy.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={perf?.accuracy || 0} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Excelente! Nenhuma área crítica identificada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Atividade</CardTitle>
          <CardDescription>
            Proporção de perguntas por disciplina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.subjectPerformance}
                dataKey="total"
                nameKey="subject"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ subject, total }) => `${subject}: ${total}`}
              >
                {analytics.subjectPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}