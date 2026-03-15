import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus, Award, Brain, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PerformanceTrend {
  date: string;
  questions: number;
  accuracy: number;
  coins: number;
  xp: number;
  streak: number;
}

interface SubjectComparison {
  subject: string;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  recent_accuracy: number;
  trend: string;
}

interface StudentPerformanceAnalyticsProps {
  studentId: string;
  studentName: string;
}

const COLORS = {
  portugues: "#8B5CF6",
  matematica: "#3B82F6",
  estudo_meio: "#10B981",
  ingles: "#F59E0B",
};

const subjectLabels: Record<string, string> = {
  portugues: "Português",
  matematica: "Matemática",
  estudo_meio: "Estudo do Meio",
  ingles: "Inglês",
};

const trendIcons = {
  improving: <TrendingUp className="w-4 h-4 text-green-500" />,
  declining: <TrendingDown className="w-4 h-4 text-red-500" />,
  stable: <Minus className="w-4 h-4 text-gray-500" />,
};

export function StudentPerformanceAnalytics({
  studentId,
  studentName,
}: StudentPerformanceAnalyticsProps) {
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [subjects, setSubjects] = useState<SubjectComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30);

  useEffect(() => {
    loadAnalytics();
  }, [studentId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await supabase.rpc("record_daily_analytics", {
        student_id_param: studentId,
      });

      const [trendsResult, subjectsResult] = await Promise.all([
        supabase.rpc("get_performance_trends", {
          student_id_param: studentId,
          days_param: timeRange,
        }),
        supabase.rpc("get_subject_comparison", {
          student_id_param: studentId,
        }),
      ]);

      if (trendsResult.error) throw trendsResult.error;
      if (subjectsResult.error) throw subjectsResult.error;

      const formattedTrends = (trendsResult.data || []).map((item: any) => ({
        date: new Date(item.date).toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
        }),
        questions: item.questions || 0,
        accuracy: item.accuracy || 0,
        coins: item.coins || 0,
        xp: item.xp || 0,
        streak: item.streak || 0,
      }));

      setTrends(formattedTrends);
      setSubjects(subjectsResult.data || []);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalQuestions = subjects.reduce((sum, s) => sum + s.total_questions, 0);
  const avgAccuracy =
    subjects.reduce((sum, s) => sum + s.accuracy, 0) / (subjects.length || 1);

  const pieData = subjects.map((subject) => ({
    name: subjectLabels[subject.subject] || subject.subject,
    value: subject.total_questions,
    color: COLORS[subject.subject as keyof typeof COLORS] || "#6B7280",
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">A carregar análises...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Análise de Desempenho: {studentName}
          </CardTitle>
          <CardDescription>
            Visualização detalhada do progresso e tendências de aprendizagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-500" />
                <p className="text-sm font-semibold">Perguntas Totais</p>
              </div>
              <p className="text-3xl font-bold">{totalQuestions}</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <p className="text-sm font-semibold">Precisão Média</p>
              </div>
              <p className="text-3xl font-bold">{avgAccuracy.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <p className="text-sm font-semibold">Disciplinas Ativas</p>
              </div>
              <p className="text-3xl font-bold">{subjects.length}</p>
            </div>
          </div>

          <Tabs defaultValue="trends">
            <TabsList className="w-full">
              <TabsTrigger value="trends" className="flex-1">
                Tendências
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex-1">
                Por Disciplina
              </TabsTrigger>
              <TabsTrigger value="distribution" className="flex-1">
                Distribuição
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTimeRange(7)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeRange === 7 ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  7 dias
                </button>
                <button
                  onClick={() => setTimeRange(30)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeRange === 30 ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  30 dias
                </button>
                <button
                  onClick={() => setTimeRange(90)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeRange === 90 ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  90 dias
                </button>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="questions"
                      stroke="#3B82F6"
                      name="Perguntas"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10B981"
                      name="Precisão %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="xp"
                      stroke="#8B5CF6"
                      name="XP"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="coins"
                      stroke="#F59E0B"
                      name="Moedas"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjects}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="subject"
                      tickFormatter={(value) => subjectLabels[value] || value}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => subjectLabels[value] || value}
                    />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#10B981" name="Precisão Geral %" />
                    <Bar
                      dataKey="recent_accuracy"
                      fill="#3B82F6"
                      name="Precisão Recente %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {subjects.map((subject) => (
                  <div
                    key={subject.subject}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[subject.subject as keyof typeof COLORS] || "#6B7280",
                          }}
                        />
                        <div>
                          <p className="font-semibold">
                            {subjectLabels[subject.subject] || subject.subject}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {subject.total_questions} perguntas •{" "}
                            {subject.correct_answers} corretas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {subject.accuracy.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recente: {subject.recent_accuracy.toFixed(1)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {trendIcons[subject.trend as keyof typeof trendIcons]}
                          <Badge
                            variant={
                              subject.trend === "improving"
                                ? "default"
                                : subject.trend === "declining"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {subject.trend === "improving" && "A melhorar"}
                            {subject.trend === "declining" && "A descer"}
                            {subject.trend === "stable" && "Estável"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="distribution">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                {subjects.map((subject) => (
                  <div
                    key={subject.subject}
                    className="p-4 rounded-lg border"
                    style={{
                      borderColor:
                        COLORS[subject.subject as keyof typeof COLORS] + "40" || "#6B728040",
                      backgroundColor:
                        COLORS[subject.subject as keyof typeof COLORS] + "10" || "#6B728010",
                    }}
                  >
                    <p className="font-semibold mb-2">
                      {subjectLabels[subject.subject] || subject.subject}
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Perguntas:</span>
                        <span className="font-semibold">{subject.total_questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Corretas:</span>
                        <span className="font-semibold">{subject.correct_answers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa:</span>
                        <span className="font-semibold">{subject.accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
