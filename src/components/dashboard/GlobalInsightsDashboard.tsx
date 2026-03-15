import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  Target,
  Award,
  Users,
  BookOpen,
  Zap,
  Star,
  Trophy,
  Calendar,
  Activity,
  Brain,
  Rocket
} from 'lucide-react';

interface GlobalInsights {
  totalStudents: number;
  activeToday: number;
  totalQuestions: number;
  averageAccuracy: number;
  totalAchievements: number;
  activeEvents: number;
  totalSchools: number;
  engagementRate: number;
}

interface TrendingTopic {
  subject: string;
  popularity: number;
  averageScore: number;
}

export function GlobalInsightsDashboard() {
  const [insights, setInsights] = useState<GlobalInsights | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalInsights();
  }, []);

  const loadGlobalInsights = async () => {
    try {
      const [studentsResult, questionsResult, achievementsResult, eventsResult, schoolsResult] = await Promise.all([
        supabase.from('students').select('id, last_login', { count: 'exact', head: true }),
        supabase.from('quiz_responses').select('id, is_correct', { count: 'exact' }),
        supabase.from('student_achievements').select('id', { count: 'exact', head: true }),
        supabase.from('seasonal_events').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('schools').select('id', { count: 'exact', head: true })
      ]);

      const totalStudents = studentsResult.count || 0;
      const totalQuestions = questionsResult.count || 0;
      const correctAnswers = questionsResult.data?.filter(q => q.is_correct).length || 0;
      const averageAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      const activeTodayResult = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const topicsResult = await supabase
        .from('quiz_responses')
        .select('subject, is_correct')
        .limit(1000);

      const topicsMap = new Map<string, { count: number; correct: number }>();
      topicsResult.data?.forEach(response => {
        const current = topicsMap.get(response.subject) || { count: 0, correct: 0 };
        topicsMap.set(response.subject, {
          count: current.count + 1,
          correct: current.correct + (response.is_correct ? 1 : 0)
        });
      });

      const topics = Array.from(topicsMap.entries())
        .map(([subject, data]) => ({
          subject,
          popularity: data.count,
          averageScore: (data.correct / data.count) * 100
        }))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5);

      setInsights({
        totalStudents,
        activeToday: activeTodayResult.count || 0,
        totalQuestions,
        averageAccuracy,
        totalAchievements: achievementsResult.count || 0,
        activeEvents: eventsResult.count || 0,
        totalSchools: schoolsResult.count || 0,
        engagementRate: totalStudents > 0 ? ((activeTodayResult.count || 0) / totalStudents) * 100 : 0
      });

      setTrendingTopics(topics);
    } catch (error) {
      console.error('Error loading global insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !insights) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Activity className="h-8 w-8 animate-pulse text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Insights Globais</h2>
        <p className="text-muted-foreground">
          Visão geral da plataforma e métricas de aprendizagem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {insights.activeToday} ativos hoje
            </p>
            <Progress value={insights.engagementRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perguntas Respondidas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalQuestions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {insights.averageAccuracy.toFixed(1)}% de precisão média
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conquistas Desbloqueadas</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalAchievements.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Média de {(insights.totalAchievements / Math.max(insights.totalStudents, 1)).toFixed(1)} por aluno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escolas Registadas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              {insights.activeEvents} eventos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trending">Tendências</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Métricas de Engajamento
              </CardTitle>
              <CardDescription>
                Análise do envolvimento dos alunos com a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Engajamento Diário</span>
                  <span className="text-sm text-muted-foreground">{insights.engagementRate.toFixed(1)}%</span>
                </div>
                <Progress value={insights.engagementRate} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Precisão Média</span>
                  <span className="text-sm text-muted-foreground">{insights.averageAccuracy.toFixed(1)}%</span>
                </div>
                <Progress value={insights.averageAccuracy} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                  <p className="text-2xl font-bold">{insights.activeToday}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Taxa de Retenção</p>
                  <p className="text-2xl font-bold">{insights.engagementRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos Alcançados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Conquistas</span>
                    </div>
                    <Badge variant="secondary">{insights.totalAchievements}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Perguntas</span>
                    </div>
                    <Badge variant="secondary">{insights.totalQuestions}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Eventos Ativos</span>
                    </div>
                    <Badge variant="secondary">{insights.activeEvents}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Atividade da Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Escolas Ativas</span>
                      <span className="text-sm font-bold">{insights.totalSchools}</span>
                    </div>
                    <Progress value={(insights.totalSchools / 100) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Alunos Online</span>
                      <span className="text-sm font-bold">{insights.activeToday}</span>
                    </div>
                    <Progress value={(insights.activeToday / Math.max(insights.totalStudents, 1)) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Tópicos em Destaque
              </CardTitle>
              <CardDescription>
                Disciplinas mais populares e desempenho médio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.subject} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{topic.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">
                          {topic.averageScore.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(topic.popularity / trendingTopics[0].popularity) * 100} className="flex-1" />
                      <span className="text-xs text-muted-foreground w-16">
                        {topic.popularity} respostas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Funcionalidades da Plataforma
              </CardTitle>
              <CardDescription>
                Sistema completo de aprendizagem gamificada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    Sistema de Aprendizagem
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Quizzes personalizados por ano escolar
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Caminhos de aprendizagem adaptativos
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Sistema de dificuldade progressiva
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Análise de lacunas de conhecimento
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Gamificação
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      Sistema de XP, níveis e rankings
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      50+ conquistas desbloqueáveis
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      Sistema de streaks e bónus diários
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      Marketplace com recompensas
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    Social & Colaborativo
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Sistema de amizades
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Grupos de estudo
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Duelos e batalhas de quiz
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Sistema de ajuda entre pares
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    Eventos & Torneios
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Eventos sazonais (Natal, Páscoa)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Torneios competitivos
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Missões diárias e semanais
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Bónus de feriados nacionais
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Para Pais e Encarregados</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Acompanhamento detalhado do progresso</li>
                  <li>• Relatórios semanais automáticos por email</li>
                  <li>• Controlo de tempo de jogo</li>
                  <li>• Gestão de prioridades de disciplinas</li>
                  <li>• Monitorização de chat e interações sociais</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}