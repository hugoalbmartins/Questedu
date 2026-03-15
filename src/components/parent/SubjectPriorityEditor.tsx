import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calculator, Globe, Languages, Star, Save, CircleAlert as AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubjectPriorityEditorProps {
  studentId: string;
  parentId: string;
  schoolYear: string;
}

const subjects = [
  { id: 'portugues', name: 'Português', icon: BookOpen, color: 'text-blue-500' },
  { id: 'matematica', name: 'Matemática', icon: Calculator, color: 'text-purple-500' },
  { id: 'estudo_meio', name: 'Estudo do Meio', icon: Globe, color: 'text-green-500' },
  { id: 'ingles', name: 'Inglês', icon: Languages, color: 'text-red-500' }
];

export const SubjectPriorityEditor = ({ studentId, parentId, schoolYear }: SubjectPriorityEditorProps) => {
  const [priorities, setPriorities] = useState<Record<string, number>>({
    portugues: 2,
    matematica: 2,
    estudo_meio: 2,
    ingles: 2
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPriorities();
  }, [studentId]);

  const loadPriorities = async () => {
    try {
      const { data, error } = await supabase
        .from('subject_priorities')
        .select('subject, priority')
        .eq('student_id', studentId)
        .eq('parent_id', parentId);

      if (error) throw error;

      if (data && data.length > 0) {
        const priorityMap: Record<string, number> = {};
        data.forEach(item => {
          priorityMap[item.subject] = item.priority;
        });
        setPriorities(priorityMap);
      }
    } catch (err) {
      console.error('Error loading priorities:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePriority = (subject: string, priority: number) => {
    setPriorities(prev => ({
      ...prev,
      [subject]: priority
    }));
  };

  const savePriorities = async () => {
    setSaving(true);
    try {
      for (const [subject, priority] of Object.entries(priorities)) {
        const multiplier = priority >= 3 ? 1.5 : priority === 2 ? 1.0 : 0.75;

        const { data: existing } = await supabase
          .from('subject_priorities')
          .select('id')
          .eq('student_id', studentId)
          .eq('parent_id', parentId)
          .eq('subject', subject)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('subject_priorities')
            .update({
              priority,
              priority_multiplier: multiplier
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('subject_priorities')
            .insert({
              student_id: studentId,
              parent_id: parentId,
              subject,
              priority,
              priority_multiplier: multiplier
            });
        }
      }

      toast.success('Prioridades guardadas com sucesso!');
    } catch (err) {
      console.error('Error saving priorities:', err);
      toast.error('Erro ao guardar prioridades');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-gold" />
          Prioridades de Disciplinas
        </CardTitle>
        <CardDescription>
          Defina quais as disciplinas que o seu educando deve focar mais. Disciplinas com maior prioridade
          aparecem com mais frequência nos quizzes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-accent/20 border border-accent/40 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="font-body text-sm">
            <p className="font-bold mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>4 estrelas:</strong> Prioridade máxima (~40% das perguntas)</li>
              <li><strong>3 estrelas:</strong> Prioridade alta (~30% das perguntas)</li>
              <li><strong>2 estrelas:</strong> Prioridade normal (~20% das perguntas)</li>
              <li><strong>1 estrela:</strong> Prioridade baixa (~10% das perguntas)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {subjects.map(subject => (
            <div key={subject.id} className="p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <subject.icon className={`w-5 h-5 ${subject.color}`} />
                  </div>
                  <span className="font-body font-bold">{subject.name}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(level => (
                    <button
                      key={level}
                      onClick={() => updatePriority(subject.id, level)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          level <= priorities[subject.id]
                            ? 'fill-gold text-gold'
                            : 'fill-transparent text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                {priorities[subject.id] === 4 && 'Prioridade máxima - Esta disciplina aparecerá com mais frequência'}
                {priorities[subject.id] === 3 && 'Prioridade alta - Esta disciplina aparecerá frequentemente'}
                {priorities[subject.id] === 2 && 'Prioridade normal - Distribuição equilibrada'}
                {priorities[subject.id] === 1 && 'Prioridade baixa - Esta disciplina aparecerá menos vezes'}
              </p>
            </div>
          ))}
        </div>

        <Button
          onClick={savePriorities}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-bold"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'A guardar...' : 'Guardar Prioridades'}
        </Button>
      </CardContent>
    </Card>
  );
};
