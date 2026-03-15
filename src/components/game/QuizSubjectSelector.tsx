import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, BookOpen, Calculator, Globe, Languages, RefreshCw, Star, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QuizSubjectSelectorProps {
  student: {
    id: string;
    parent_id: string;
    school_year: string;
  };
  onSelectSubject: (subject: 'portugues' | 'matematica' | 'estudo_meio' | 'ingles' | null, isRevision: boolean) => void;
  onClose: () => void;
}

interface SubjectInfo {
  id: 'portugues' | 'matematica' | 'estudo_meio' | 'ingles';
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  priority: number;
  isPriority: boolean;
  lastAttempt?: string;
}

export const QuizSubjectSelector = ({ student, onSelectSubject, onClose }: QuizSubjectSelectorProps) => {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([
    { id: 'portugues', name: 'Português', icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/20 border-blue-500/40', priority: 1, isPriority: false },
    { id: 'matematica', name: 'Matemática', icon: Calculator, color: 'text-purple-500', bgColor: 'bg-purple-500/20 border-purple-500/40', priority: 1, isPriority: false },
    { id: 'estudo_meio', name: 'Estudo do Meio', icon: Globe, color: 'text-green-500', bgColor: 'bg-green-500/20 border-green-500/40', priority: 1, isPriority: false },
    { id: 'ingles', name: 'Inglês', icon: Languages, color: 'text-red-500', bgColor: 'bg-red-500/20 border-red-500/40', priority: 1, isPriority: false }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriorities();
  }, []);

  const loadPriorities = async () => {
    try {
      const { data: priorities } = await supabase
        .from('subject_priorities')
        .select('subject, priority')
        .eq('student_id', student.id)
        .eq('parent_id', student.parent_id);

      const { data: quizHistory } = await supabase
        .from('quiz_history')
        .select('answered_at, question_id')
        .eq('student_id', student.id)
        .order('answered_at', { ascending: false })
        .limit(100);

      const lastAttemptBySubject: Record<string, string> = {};

      if (quizHistory) {
        for (const entry of quizHistory) {
          const { data: question } = await supabase
            .from('questions')
            .select('subject')
            .eq('id', entry.question_id)
            .maybeSingle();

          if (question && !lastAttemptBySubject[question.subject]) {
            const date = new Date(entry.answered_at);
            const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
            lastAttemptBySubject[question.subject] = daysAgo === 0 ? 'hoje' : `há ${daysAgo} ${daysAgo === 1 ? 'dia' : 'dias'}`;
          }
        }
      }

      setSubjects(prev => prev.map(s => {
        const priority = priorities?.find(p => p.subject === s.id);
        return {
          ...s,
          priority: priority?.priority || 1,
          isPriority: priority && priority.priority >= 3,
          lastAttempt: lastAttemptBySubject[s.id]
        };
      }));
    } catch (err) {
      console.error('Error loading priorities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-center">
        <div className="game-border p-8 bg-card">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  const prioritySubjects = subjects.filter(s => s.isPriority).sort((a, b) => b.priority - a.priority);
  const otherSubjects = subjects.filter(s => !s.isPriority).sort((a, b) => {
    if (a.lastAttempt && !b.lastAttempt) return 1;
    if (!a.lastAttempt && b.lastAttempt) return -1;
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="w-full sm:max-w-2xl game-border p-6 bg-card relative animate-slide-up max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-xl">
        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>

        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold mb-2">Escolhe a Disciplina</h2>
          <p className="font-body text-muted-foreground">
            Seleciona a disciplina que queres praticar
          </p>
        </div>

        <div className="space-y-6">
          <Button
            onClick={() => onSelectSubject(null, false)}
            className="w-full py-8 text-left justify-start bg-gradient-to-r from-primary/80 to-primary border-2 border-primary hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="font-body text-xl font-bold text-white">Quiz Misto</p>
                <p className="font-body text-sm text-white/80">
                  Perguntas de todas as disciplinas
                </p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => onSelectSubject(null, true)}
            className="w-full py-8 text-left justify-start bg-gradient-to-r from-accent/60 to-accent border-2 border-accent hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="font-body text-xl font-bold">Quiz de Revisão</p>
                <p className="font-body text-sm text-muted-foreground">
                  Revê toda a matéria do ano
                </p>
              </div>
            </div>
          </Button>

          {prioritySubjects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-gold" />
                <h3 className="font-body font-bold text-sm uppercase text-gold">
                  Recomendado pelos teus pais
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prioritySubjects.map(subject => (
                  <Button
                    key={subject.id}
                    onClick={() => onSelectSubject(subject.id, false)}
                    variant="outline"
                    className={`w-full py-6 text-left justify-start border-2 ${subject.bgColor} hover:scale-[1.02] transition-all relative overflow-hidden`}
                  >
                    <div className="absolute top-2 right-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: subject.priority }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-12 h-12 rounded-lg ${subject.bgColor} flex items-center justify-center`}>
                        <subject.icon className={`w-6 h-6 ${subject.color}`} />
                      </div>
                      <div className="flex-1 pr-12">
                        <p className="font-body text-lg font-bold">{subject.name}</p>
                        {subject.lastAttempt && (
                          <p className="font-body text-xs text-muted-foreground">
                            Último: {subject.lastAttempt}
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-body font-bold text-sm uppercase text-muted-foreground mb-3">
              Outras Disciplinas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherSubjects.map(subject => (
                <Button
                  key={subject.id}
                  onClick={() => onSelectSubject(subject.id, false)}
                  variant="outline"
                  className={`w-full py-6 text-left justify-start border-2 ${subject.bgColor} hover:scale-[1.02] transition-all`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-12 h-12 rounded-lg ${subject.bgColor} flex items-center justify-center`}>
                      <subject.icon className={`w-6 h-6 ${subject.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-lg font-bold">{subject.name}</p>
                      {subject.lastAttempt ? (
                        <p className="font-body text-xs text-muted-foreground">
                          Último: {subject.lastAttempt}
                        </p>
                      ) : (
                        <p className="font-body text-xs text-secondary">
                          Ainda não praticaste!
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
