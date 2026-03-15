# 📚 PLANO PEDAGÓGICO AVANÇADO
## Sistema de Aprendizagem Adaptativa e Inteligente

**Data**: 15 de Março de 2026
**Versão**: 1.0
**Objetivo**: Transformar a Vila dos Sabichões na melhor plataforma educativa de Portugal

---

## 🎯 VISÃO PEDAGÓGICA

### Missão
Proporcionar uma experiência de aprendizagem personalizada, adaptativa e comprovadamente eficaz para cada criança, respeitando o seu ritmo, estilo e necessidades específicas.

### Princípios Fundamentais
1. **Aprendizagem Ativa**: Learning by doing
2. **Feedback Imediato**: Correção e explicação instantânea
3. **Dificuldade Adaptativa**: Zona de Desenvolvimento Proximal (Vygotsky)
4. **Gamificação Motivacional**: Recompensas e progresso visível
5. **Metacognição**: Ensinar a criança a aprender
6. **Inclusão**: Acessível a TODAS as crianças

---

## 🧠 FASE 1: SISTEMA DE DIFICULDADE ADAPTATIVA

### Conceito
Ajustar automaticamente o nível de dificuldade das questões baseado no desempenho em tempo real.

### Algoritmo de Ajuste

#### Base de Dados
```sql
-- Migration: add_adaptive_difficulty_system.sql

-- Tracking de dificuldade por disciplina
CREATE TABLE student_subject_difficulty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  current_difficulty integer DEFAULT 0, -- -1 (fácil), 0 (normal), +1 (difícil)
  target_school_year integer NOT NULL,
  consecutive_correct integer DEFAULT 0,
  consecutive_wrong integer DEFAULT 0,
  accuracy_rate decimal DEFAULT 0,
  total_questions integer DEFAULT 0,
  last_adjusted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject)
);

CREATE INDEX idx_student_difficulty ON student_subject_difficulty(student_id, subject);

-- RLS
ALTER TABLE student_subject_difficulty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own difficulty"
  ON student_subject_difficulty FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "System updates difficulty"
  ON student_subject_difficulty FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Função para ajustar dificuldade
CREATE OR REPLACE FUNCTION adjust_difficulty_after_answer()
RETURNS TRIGGER AS $$
DECLARE
  difficulty_rec student_subject_difficulty;
BEGIN
  -- Buscar registro de dificuldade
  SELECT * INTO difficulty_rec
  FROM student_subject_difficulty
  WHERE student_id = NEW.student_id
  AND subject = NEW.subject;

  -- Se não existe, criar
  IF NOT FOUND THEN
    INSERT INTO student_subject_difficulty (
      student_id,
      subject,
      target_school_year,
      total_questions,
      accuracy_rate,
      consecutive_correct,
      consecutive_wrong
    ) VALUES (
      NEW.student_id,
      NEW.subject,
      (SELECT school_year FROM users WHERE id = NEW.student_id),
      1,
      CASE WHEN NEW.is_correct THEN 1.0 ELSE 0.0 END,
      CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
      CASE WHEN NEW.is_correct THEN 0 ELSE 1 END
    );
    RETURN NEW;
  END IF;

  -- Atualizar estatísticas
  UPDATE student_subject_difficulty
  SET
    total_questions = total_questions + 1,
    accuracy_rate = (
      (accuracy_rate * total_questions + CASE WHEN NEW.is_correct THEN 1.0 ELSE 0.0 END)
      / (total_questions + 1)
    ),
    consecutive_correct = CASE
      WHEN NEW.is_correct THEN consecutive_correct + 1
      ELSE 0
    END,
    consecutive_wrong = CASE
      WHEN NOT NEW.is_correct THEN consecutive_wrong + 1
      ELSE 0
    END,
    updated_at = now()
  WHERE student_id = NEW.student_id
  AND subject = NEW.subject;

  -- Lógica de ajuste
  -- 5 acertos seguidos = aumentar dificuldade
  IF difficulty_rec.consecutive_correct >= 4 AND NEW.is_correct THEN
    UPDATE student_subject_difficulty
    SET
      current_difficulty = LEAST(current_difficulty + 1, 2),
      consecutive_correct = 0,
      last_adjusted_at = now()
    WHERE student_id = NEW.student_id
    AND subject = NEW.subject;
  END IF;

  -- 3 erros seguidos = diminuir dificuldade
  IF difficulty_rec.consecutive_wrong >= 2 AND NOT NEW.is_correct THEN
    UPDATE student_subject_difficulty
    SET
      current_difficulty = GREATEST(current_difficulty - 1, -2),
      consecutive_wrong = 0,
      last_adjusted_at = now()
    WHERE student_id = NEW.student_id
    AND subject = NEW.subject;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger após responder questão
CREATE TRIGGER on_answer_adjust_difficulty
AFTER INSERT ON student_answers
FOR EACH ROW
EXECUTE FUNCTION adjust_difficulty_after_answer();

-- Função para selecionar questões adaptativas
CREATE OR REPLACE FUNCTION get_adaptive_questions(
  p_student_id uuid,
  p_subject text,
  p_count integer DEFAULT 10
)
RETURNS SETOF questions AS $$
DECLARE
  student_year integer;
  difficulty_level integer;
  target_year integer;
BEGIN
  -- Buscar ano e dificuldade do aluno
  SELECT
    u.school_year,
    COALESCE(ssd.current_difficulty, 0)
  INTO student_year, difficulty_level
  FROM users u
  LEFT JOIN student_subject_difficulty ssd
    ON ssd.student_id = u.id AND ssd.subject = p_subject
  WHERE u.id = p_student_id;

  -- Calcular ano alvo baseado na dificuldade
  target_year := student_year + difficulty_level;

  -- Limitar entre 1º e 4º ano
  target_year := GREATEST(1, LEAST(4, target_year));

  -- Buscar questões ainda não respondidas ou há muito tempo
  RETURN QUERY
  SELECT q.*
  FROM questions q
  LEFT JOIN student_answers sa
    ON sa.question_id = q.id
    AND sa.student_id = p_student_id
    AND sa.created_at > now() - interval '7 days'
  WHERE q.subject = p_subject
  AND q.school_year = target_year
  AND sa.id IS NULL
  ORDER BY RANDOM()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Frontend - Difficulty Indicator
```typescript
// src/components/game/DifficultyIndicator.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DifficultyIndicatorProps {
  subject: string;
}

export const DifficultyIndicator = ({ subject }: DifficultyIndicatorProps) => {
  const [difficulty, setDifficulty] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    fetchDifficulty();
  }, [subject]);

  const fetchDifficulty = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('student_subject_difficulty')
      .select('current_difficulty, accuracy_rate')
      .eq('student_id', user.id)
      .eq('subject', subject)
      .maybeSingle();

    if (data) {
      setDifficulty(data.current_difficulty);
      setAccuracy(Math.round(data.accuracy_rate * 100));
    }
  };

  const getDifficultyInfo = () => {
    if (difficulty <= -2) return {
      label: "Muito Fácil",
      color: "bg-blue-500",
      icon: <TrendingDown className="w-3 h-3" />
    };
    if (difficulty === -1) return {
      label: "Fácil",
      color: "bg-green-500",
      icon: <TrendingDown className="w-3 h-3" />
    };
    if (difficulty === 0) return {
      label: "Normal",
      color: "bg-yellow-500",
      icon: <Minus className="w-3 h-3" />
    };
    if (difficulty === 1) return {
      label: "Difícil",
      color: "bg-orange-500",
      icon: <TrendingUp className="w-3 h-3" />
    };
    return {
      label: "Muito Difícil",
      color: "bg-red-500",
      icon: <TrendingUp className="w-3 h-3" />
    };
  };

  const info = getDifficultyInfo();

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${info.color} text-white gap-1`}>
        {info.icon}
        {info.label}
      </Badge>
      <span className="text-xs text-muted-foreground">
        Precisão: {accuracy}%
      </span>
    </div>
  );
};
```

#### Notificação de Ajuste
```typescript
// Notificar quando dificuldade muda
const notifyDifficultyChange = (newDifficulty: number, oldDifficulty: number) => {
  if (newDifficulty > oldDifficulty) {
    toast.success(
      "🎉 Subiste de nível! As perguntas ficaram mais desafiantes!",
      { duration: 5000 }
    );
  } else if (newDifficulty < oldDifficulty) {
    toast.info(
      "💡 Vamos praticar um pouco mais para consolidares o conhecimento!",
      { duration: 5000 }
    );
  }
};
```

---

## 📊 FASE 2: ANÁLISE DE LACUNAS DE CONHECIMENTO

### Objetivo
Identificar tópicos específicos onde o aluno tem dificuldade para prática focada.

### Taxonomia de Tópicos

#### Base de Dados
```sql
-- Migration: add_knowledge_gap_analysis_fixed.sql

-- Hierarquia de tópicos
CREATE TABLE topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  parent_topic_id uuid REFERENCES topics(id),
  name text NOT NULL,
  description text,
  school_year integer,
  order_index integer DEFAULT 0,
  curriculum_ref text, -- Referência ao currículo nacional
  created_at timestamptz DEFAULT now()
);

-- Associar questões a tópicos
CREATE TABLE question_topics (
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, topic_id)
);

-- Análise de lacunas por estudante
CREATE TABLE knowledge_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  total_attempts integer DEFAULT 0,
  correct_attempts integer DEFAULT 0,
  accuracy_rate decimal DEFAULT 0,
  needs_practice boolean DEFAULT false,
  last_attempted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, topic_id)
);

CREATE INDEX idx_knowledge_gaps_student ON knowledge_gaps(student_id);
CREATE INDEX idx_knowledge_gaps_needs_practice
  ON knowledge_gaps(student_id, needs_practice)
  WHERE needs_practice = true;

-- RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view topics"
  ON topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view question topics"
  ON question_topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students view own gaps"
  ON knowledge_gaps FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Função para atualizar lacunas de conhecimento
CREATE OR REPLACE FUNCTION update_knowledge_gaps()
RETURNS TRIGGER AS $$
DECLARE
  topic_rec RECORD;
BEGIN
  -- Para cada tópico associado à questão
  FOR topic_rec IN
    SELECT topic_id
    FROM question_topics
    WHERE question_id = NEW.question_id
  LOOP
    -- Inserir ou atualizar gap
    INSERT INTO knowledge_gaps (
      student_id,
      topic_id,
      total_attempts,
      correct_attempts,
      accuracy_rate,
      needs_practice,
      last_attempted_at
    ) VALUES (
      NEW.student_id,
      topic_rec.topic_id,
      1,
      CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
      CASE WHEN NEW.is_correct THEN 1.0 ELSE 0.0 END,
      NOT NEW.is_correct,
      now()
    )
    ON CONFLICT (student_id, topic_id)
    DO UPDATE SET
      total_attempts = knowledge_gaps.total_attempts + 1,
      correct_attempts = knowledge_gaps.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
      accuracy_rate = (
        (knowledge_gaps.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::decimal
        / (knowledge_gaps.total_attempts + 1)
      ),
      needs_practice = (
        (knowledge_gaps.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::decimal
        / (knowledge_gaps.total_attempts + 1)
      ) < 0.7,
      last_attempted_at = now(),
      updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_answer_update_gaps
AFTER INSERT ON student_answers
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_gaps();
```

#### Seed de Tópicos (Exemplo Matemática 2º Ano)
```sql
-- Seed topics para Matemática 2º ano
INSERT INTO topics (subject, name, description, school_year, order_index) VALUES
-- Números e Operações
('Matemática', 'Números até 100', 'Leitura, escrita e representação de números até 100', 2, 1),
('Matemática', 'Adição até 100', 'Operações de adição com números até 100', 2, 2),
('Matemática', 'Subtração até 100', 'Operações de subtração com números até 100', 2, 3),
('Matemática', 'Multiplicação Simples', 'Introdução à multiplicação (2x, 5x, 10x)', 2, 4),
('Matemática', 'Números Pares e Ímpares', 'Identificação e classificação', 2, 5),

-- Geometria
('Matemática', 'Formas Geométricas', 'Identificação de formas básicas', 2, 6),
('Matemática', 'Simetria', 'Conceito de simetria e eixos de simetria', 2, 7),

-- Medida
('Matemática', 'Tempo', 'Horas, minutos, calendário', 2, 8),
('Matemática', 'Dinheiro', 'Euros e cêntimos', 2, 9),
('Matemática', 'Comprimento', 'Metro, centímetro', 2, 10);

-- Subtópicos (exemplo)
DO $$
DECLARE
  adicao_id uuid;
BEGIN
  SELECT id INTO adicao_id FROM topics WHERE name = 'Adição até 100';

  INSERT INTO topics (subject, parent_topic_id, name, school_year) VALUES
  ('Matemática', adicao_id, 'Adição sem transporte', 2),
  ('Matemática', adicao_id, 'Adição com transporte', 2),
  ('Matemática', adicao_id, 'Propriedades da adição', 2);
END $$;
```

#### Frontend - Knowledge Gaps Panel
```typescript
// src/components/game/KnowledgeGapsPanel.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, Target, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KnowledgeGap {
  topic: {
    name: string;
    subject: string;
  };
  accuracy_rate: number;
  total_attempts: number;
  needs_practice: boolean;
}

export const KnowledgeGapsPanel = () => {
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("Matemática");

  useEffect(() => {
    fetchGaps();
  }, [selectedSubject]);

  const fetchGaps = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('knowledge_gaps')
      .select(`
        *,
        topic:topic_id(name, subject)
      `)
      .eq('student_id', user.id)
      .eq('topic.subject', selectedSubject)
      .gte('total_attempts', 3)
      .order('accuracy_rate', { ascending: true });

    setGaps(data || []);
  };

  const practiceGap = async (topicId: string) => {
    // Iniciar quiz focado neste tópico
    // TODO: Implementar quiz por tópico
  };

  const strongTopics = gaps.filter(g => g.accuracy_rate >= 0.8);
  const needsPractice = gaps.filter(g => g.needs_practice);
  const improving = gaps.filter(g => !g.needs_practice && g.accuracy_rate < 0.8);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Análise de Conhecimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            {['Matemática', 'Português', 'Estudo do Meio', 'Inglês'].map(subject => (
              <Button
                key={subject}
                variant={selectedSubject === subject ? 'default' : 'outline'}
                onClick={() => setSelectedSubject(subject)}
                size="sm"
              >
                {subject}
              </Button>
            ))}
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{strongTopics.length}</p>
                <p className="text-xs text-muted-foreground">Tópicos Dominados</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{improving.length}</p>
                <p className="text-xs text-muted-foreground">A Melhorar</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-4 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{needsPractice.length}</p>
                <p className="text-xs text-muted-foreground">Precisam Prática</p>
              </CardContent>
            </Card>
          </div>

          {/* Tópicos que Precisam Prática */}
          {needsPractice.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Foca Nestes Tópicos
              </h3>
              <div className="space-y-3">
                {needsPractice.map((gap, i) => (
                  <Card key={i} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{gap.topic.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {gap.total_attempts} tentativas
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {Math.round(gap.accuracy_rate * 100)}%
                        </Badge>
                      </div>
                      <Progress
                        value={gap.accuracy_rate * 100}
                        className="mb-3"
                      />
                      <Button
                        size="sm"
                        onClick={() => practiceGap(gap.topic.id)}
                        className="w-full"
                      >
                        Praticar Este Tópico
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tópicos Dominados */}
          {strongTopics.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Parabéns! Dominas Estes Tópicos
              </h3>
              <div className="flex flex-wrap gap-2">
                {strongTopics.map((gap, i) => (
                  <Badge key={i} variant="outline" className="border-green-500">
                    {gap.topic.name} ({Math.round(gap.accuracy_rate * 100)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 📈 FASE 3: RELATÓRIOS SEMANAIS PARA PAIS

### Objetivo
Email automático todos os domingos com progresso da semana.

### Edge Function
```typescript
// supabase/functions/send-weekly-reports/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

interface WeeklyReport {
  student_name: string;
  parent_email: string;
  quizzes_completed: number;
  total_questions: number;
  accuracy_rate: number;
  streak_current: number;
  time_played_minutes: number;
  achievements_unlocked: number;
  subjects: {
    name: string;
    accuracy: number;
    questions: number;
  }[];
  gaps: {
    topic: string;
    accuracy: number;
  }[];
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Data range: última semana
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Buscar todos os pais com filhos ativos
  const { data: parents } = await supabase
    .from('users')
    .select('id, email, display_name')
    .eq('role', 'parent');

  let sentCount = 0;

  for (const parent of parents || []) {
    // Buscar filhos do pai
    const { data: students } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('parent_id', parent.id)
      .eq('role', 'student');

    for (const student of students || []) {
      // Compilar relatório
      const report = await compileWeeklyReport(supabase, student.id);

      // Enviar email
      await supabase.functions.invoke('send-email', {
        body: {
          to: parent.email,
          subject: `📊 Relatório Semanal - ${student.display_name}`,
          html: generateReportHTML(report)
        }
      });

      sentCount++;
    }
  }

  return new Response(
    JSON.stringify({ success: true, reports_sent: sentCount }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

async function compileWeeklyReport(supabase: any, studentId: string): Promise<WeeklyReport> {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Buscar dados da semana
  const { data: answers } = await supabase
    .from('student_answers')
    .select(`
      *,
      question:question_id(subject)
    `)
    .eq('student_id', studentId)
    .gte('created_at', lastWeek.toISOString());

  const { data: student } = await supabase
    .from('users')
    .select('display_name, parent_id, email')
    .eq('id', studentId)
    .single();

  const { data: parent } = await supabase
    .from('users')
    .select('email')
    .eq('id', student.parent_id)
    .single();

  // Calcular métricas
  const totalQuestions = answers?.length || 0;
  const correctAnswers = answers?.filter((a: any) => a.is_correct).length || 0;
  const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

  // Por disciplina
  const subjects: any = {};
  answers?.forEach((a: any) => {
    const subject = a.question.subject;
    if (!subjects[subject]) {
      subjects[subject] = { correct: 0, total: 0 };
    }
    subjects[subject].total++;
    if (a.is_correct) subjects[subject].correct++;
  });

  const subjectsArray = Object.entries(subjects).map(([name, data]: [string, any]) => ({
    name,
    accuracy: data.total > 0 ? data.correct / data.total : 0,
    questions: data.total
  }));

  // Conquistas
  const { data: achievements } = await supabase
    .from('player_achievements')
    .select('*')
    .eq('student_id', studentId)
    .gte('unlocked_at', lastWeek.toISOString());

  // Lacunas
  const { data: gaps } = await supabase
    .from('knowledge_gaps')
    .select(`
      *,
      topic:topic_id(name)
    `)
    .eq('student_id', studentId)
    .eq('needs_practice', true)
    .limit(5);

  return {
    student_name: student.display_name,
    parent_email: parent.email,
    quizzes_completed: Math.ceil(totalQuestions / 10),
    total_questions: totalQuestions,
    accuracy_rate: accuracy,
    streak_current: 0, // TODO: calcular
    time_played_minutes: Math.ceil(totalQuestions * 1.5), // estimativa
    achievements_unlocked: achievements?.length || 0,
    subjects: subjectsArray,
    gaps: gaps?.map((g: any) => ({
      topic: g.topic.name,
      accuracy: g.accuracy_rate
    })) || []
  };
}

function generateReportHTML(report: WeeklyReport): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .metric-card { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .metric-value { font-size: 28px; font-weight: bold; color: #333; }
        .subject-list { list-style: none; padding: 0; }
        .subject-item { padding: 10px; background: white; margin: 5px 0; border-radius: 5px; display: flex; justify-between; }
        .progress-bar { height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin-top: 5px; }
        .progress-fill { height: 100%; background: #28a745; }
        .gap-item { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Relatório Semanal</h1>
        <h2>${report.student_name}</h2>
        <p>Semana de ${new Date().toLocaleDateString('pt-PT')}</p>
      </div>

      <div style="margin-top: 20px;">
        <h3>Resumo da Semana</h3>

        <div class="metric-card">
          <div class="metric-label">Quizzes Completados</div>
          <div class="metric-value">${report.quizzes_completed}</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Taxa de Acerto</div>
          <div class="metric-value">${Math.round(report.accuracy_rate * 100)}%</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Tempo Jogado</div>
          <div class="metric-value">${report.time_played_minutes} min</div>
        </div>

        <div class="metric-card">
          <div class="metric-label">Conquistas Desbloqueadas</div>
          <div class="metric-value">🏆 ${report.achievements_unlocked}</div>
        </div>
      </div>

      <div style="margin-top: 30px;">
        <h3>Desempenho por Disciplina</h3>
        <ul class="subject-list">
          ${report.subjects.map(s => `
            <li class="subject-item">
              <div style="flex: 1;">
                <strong>${s.name}</strong>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${s.accuracy * 100}%"></div>
                </div>
                <small>${s.questions} questões</small>
              </div>
              <div style="font-size: 20px; font-weight: bold; color: ${s.accuracy >= 0.7 ? '#28a745' : '#dc3545'};">
                ${Math.round(s.accuracy * 100)}%
              </div>
            </li>
          `).join('')}
        </ul>
      </div>

      ${report.gaps.length > 0 ? `
        <div style="margin-top: 30px;">
          <h3>⚠️ Áreas que Precisam Atenção</h3>
          ${report.gaps.map(g => `
            <div class="gap-item">
              <strong>${g.topic}</strong> - ${Math.round(g.accuracy * 100)}% de acerto
            </div>
          `).join('')}
          <p style="margin-top: 10px; font-size: 14px; color: #666;">
            Sugestão: Pratiquem juntos estes tópicos durante a semana!
          </p>
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>Continue assim! 🎉</strong></p>
        <p>A consistência é a chave para o sucesso na aprendizagem.</p>
        <a href="https://viladossabichoes.pt/parent" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          Ver Dashboard Completo →
        </a>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>Vila dos Sabichões - Plataforma Educativa</p>
        <p>Para deixar de receber estes emails, aceda às definições parentais.</p>
      </div>
    </body>
    </html>
  `;
}
```

---

## 🎯 CRONOGRAMA DE IMPLEMENTAÇÃO

### Sprint Pedagógico 1 (Semanas 5-6)
- [ ] Dificuldade Adaptativa (DB + Algoritmo)
- [ ] Frontend Difficulty Indicator
- [ ] Testing com beta testers
- [ ] Seed de tópicos Matemática

### Sprint Pedagógico 2 (Semanas 7-8)
- [ ] Knowledge Gaps System (DB)
- [ ] Seed de todos os tópicos (4 disciplinas)
- [ ] Frontend Knowledge Gaps Panel
- [ ] Associar questões existentes a tópicos

### Sprint Pedagógico 3 (Semanas 9-10)
- [ ] Weekly Reports Edge Function
- [ ] Email Template
- [ ] Cron Setup
- [ ] Testing & Refinement

---

## 📊 MÉTRICAS DE SUCESSO PEDAGÓGICO

### Eficácia
- Melhoria após revisão erro: +20%
- Accuracy em gaps após prática: +25%
- Retention com adaptive: +15%

### Engagement
- Uso Knowledge Gaps: >40% dos alunos
- Parent dashboard views: +30%
- Email open rate: >50%

### Satisfação
- NPS Pais: >70
- Testemunhos positivos: >50
- Referências: +20%

---

**Status**: 📋 PLANO COMPLETO
**Próxima Ação**: Começar Dificuldade Adaptativa
**Owner**: Equipa Pedagógica + Dev