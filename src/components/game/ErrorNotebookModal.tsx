import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookX, CircleCheck as CheckCircle2, Circle as XCircle, TrendingUp } from "lucide-react";

interface ErrorNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

interface ErrorEntry {
  id: string;
  question_id: string;
  student_answer: string;
  correct_answer: string;
  subject: string;
  school_year: number;
  reviewed: boolean;
  mastered: boolean;
  review_count: number;
  created_at: string;
  question?: {
    question_text: string;
    explanation?: string;
    options: string[];
  };
}

const SUBJECT_EMOJI: Record<string, string> = {
  portugues: "📚",
  matematica: "🔢",
  estudo_do_meio: "🌍",
  ingles: "🇬🇧",
};

export function ErrorNotebookModal({
  isOpen,
  onClose,
  studentId,
}: ErrorNotebookModalProps) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadErrors();
    }
  }, [isOpen, studentId]);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("error_notebook")
        .select(`
          *,
          question:questions(question_text, explanation, options)
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setErrors(data || []);
    } catch (error) {
      console.error("Error loading error notebook:", error);
      toast({
        title: "Erro ao carregar caderno",
        description: "Não foi possível carregar os teus erros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (errorId: string) => {
    try {
      const error = errors.find(e => e.id === errorId);
      if (!error) return;

      const { error: updateError } = await supabase
        .from("error_notebook")
        .update({
          reviewed: true,
          review_count: error.review_count + 1,
          last_reviewed_at: new Date().toISOString(),
        })
        .eq("id", errorId);

      if (updateError) throw updateError;

      toast({
        title: "Marcado como revisto",
        description: "Boa! Continua a rever os teus erros.",
      });

      loadErrors();
    } catch (error) {
      console.error("Error marking as reviewed:", error);
    }
  };

  const markAsMastered = async (errorId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("error_notebook")
        .update({
          mastered: true,
          reviewed: true,
        })
        .eq("id", errorId);

      if (updateError) throw updateError;

      toast({
        title: "Dominado!",
        description: "Excelente! Já dominas este conceito.",
      });

      loadErrors();
    } catch (error) {
      console.error("Error marking as mastered:", error);
    }
  };

  const filteredErrors = selectedSubject === "all"
    ? errors
    : errors.filter(e => e.subject === selectedSubject);

  const unreviewedCount = filteredErrors.filter(e => !e.reviewed).length;
  const masteredCount = filteredErrors.filter(e => e.mastered).length;

  const subjects = Array.from(new Set(errors.map(e => e.subject)));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookX className="h-5 w-5 text-primary" />
            Caderno de Erros
          </DialogTitle>
          <DialogDescription>
            Revê as questões que erraste e aprende com os teus erros
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{filteredErrors.length}</div>
              <div className="text-xs text-muted-foreground">Total de Erros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{unreviewedCount}</div>
              <div className="text-xs text-muted-foreground">Por Rever</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{masteredCount}</div>
              <div className="text-xs text-muted-foreground">Dominados</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" value={selectedSubject} onValueChange={setSelectedSubject}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {subjects.map(subject => (
              <TabsTrigger key={subject} value={subject}>
                {SUBJECT_EMOJI[subject] || "📖"}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedSubject} className="flex-1 overflow-y-auto space-y-3 max-h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">A carregar...</div>
            ) : filteredErrors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-muted-foreground">
                  {selectedSubject === "all"
                    ? "Ainda não tens erros registados! Continua assim!"
                    : "Sem erros nesta disciplina!"}
                </p>
              </div>
            ) : (
              filteredErrors.map((error) => (
                <Card key={error.id} className={error.mastered ? "bg-green-50 border-green-200" : ""}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {SUBJECT_EMOJI[error.subject]} {error.subject}
                          </Badge>
                          <Badge variant="secondary">{error.school_year}º ano</Badge>
                          {error.mastered && (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Dominado
                            </Badge>
                          )}
                          {!error.mastered && error.reviewed && (
                            <Badge variant="outline">
                              Revisto {error.review_count}x
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm mb-2">
                          {error.question?.question_text || "Pergunta não disponível"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">A tua resposta: </span>
                          <span className="text-red-600">{error.student_answer}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Resposta correta: </span>
                          <span className="text-green-600">{error.correct_answer}</span>
                        </div>
                      </div>
                      {error.question?.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-blue-900">Explicação: </span>
                              <span className="text-blue-800">{error.question.explanation}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!error.mastered && (
                      <div className="flex gap-2 pt-2">
                        {!error.reviewed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsReviewed(error.id)}
                          >
                            Marcar como Revisto
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => markAsMastered(error.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Já Domino
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-3 border-t">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
