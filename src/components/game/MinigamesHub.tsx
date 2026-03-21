import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MemoryGameModal } from "@/components/game/MemoryGameModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Gamepad2, Play, Trophy, Clock, Zap, ArrowLeft, Star } from "lucide-react";

interface Minigame {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  reward_coins_base: number;
  reward_xp_base: number;
  is_active: boolean;
}

interface MinigamesHubProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolYear: string | number;
  isPremium?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  correct_answer: string;
  wrong_answers: string[];
  subject: string;
}

interface ActiveGame {
  minigame: Minigame;
  sessionId: string | null;
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  timeLeft: number;
  totalTime: number;
  started: boolean;
  finished: boolean;
  rewards: { coins_earned: number; diamonds_earned: number; xp_earned: number; accuracy: number; is_new_high_score: boolean } | null;
}

export const MinigamesHub = ({
  isOpen,
  onClose,
  studentId,
  schoolYear,
  isPremium,
}: MinigamesHubProps) => {
  const [games, setGames] = useState<Minigame[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMemory, setOpenMemory] = useState(false);
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadGames();
  }, [isOpen]);

  const loadGames = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("minigames")
      .select("*")
      .eq("is_active", true)
      .order("display_name");
    setGames((data as Minigame[]) || []);
    setLoading(false);
  };

  const launchGame = async (game: Minigame) => {
    if (game.name === "memory_cards") {
      onClose();
      setOpenMemory(true);
      return;
    }

    const yearNum = typeof schoolYear === "string" ? parseInt(schoolYear) : schoolYear;
    const { data: questions } = await supabase
      .from("questions")
      .select("id, question, correct_answer, wrong_answers, subject")
      .eq("school_year", yearNum)
      .limit(50);

    if (!questions || questions.length < 5) {
      toast.error("Sem perguntas disponíveis para este jogo.");
      return;
    }

    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, getQuestionCount(game.name));

    const { data: sessionId, error: sessionError } = await supabase.rpc(
      "start_minigame_session",
      {
        student_id_param: studentId,
        minigame_name: game.name,
        difficulty_param: "medium",
      }
    );

    if (sessionError) {
      toast.error("Erro ao iniciar sessão do minijogo.");
      return;
    }

    const totalTime = getTimeLimit(game.name);
    setActiveGame({
      minigame: game,
      sessionId: sessionId as string,
      questions: shuffled as QuizQuestion[],
      currentIndex: 0,
      score: 0,
      timeLeft: totalTime,
      totalTime,
      started: false,
      finished: false,
      rewards: null,
    });
  };

  const getQuestionCount = (name: string): number => {
    switch (name) {
      case "speed_quiz": return 20;
      case "math_duel": return 15;
      case "true_false": return 20;
      default: return 10;
    }
  };

  const getTimeLimit = (name: string): number => {
    switch (name) {
      case "speed_quiz": return 60;
      case "math_duel": return 90;
      case "true_false": return 45;
      default: return 120;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl">
              <Gamepad2 className="w-5 h-5 text-amber-500" />
              Minijogos Educativos
            </DialogTitle>
          </DialogHeader>

          {activeGame ? (
            <MinigamePlay
              game={activeGame}
              setGame={setActiveGame}
              studentId={studentId}
              onBack={() => setActiveGame(null)}
            />
          ) : (
            <div className="space-y-2.5 py-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : games.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">Sem minijogos disponíveis.</p>
              ) : (
                games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-start gap-3 p-3 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:border-amber-400 transition-all"
                  >
                    <span className="text-2xl leading-none mt-0.5">{game.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{game.display_name}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{game.description}</p>
                      <div className="flex gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">{game.reward_coins_base} moedas</Badge>
                        <Badge variant="outline" className="text-[10px]">{game.reward_xp_base} XP</Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
                      onClick={() => launchGame(game)}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Jogar
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MemoryGameModal
        isOpen={openMemory}
        onClose={() => setOpenMemory(false)}
        studentId={studentId}
        schoolYear={typeof schoolYear === "string" ? parseInt(schoolYear) : (schoolYear as number)}
      />
    </>
  );
};

function MinigamePlay({
  game,
  setGame,
  studentId,
  onBack,
}: {
  game: ActiveGame;
  setGame: (g: ActiveGame | null) => void;
  studentId: string;
  onBack: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!game.finished && game.started && game.currentIndex < game.questions.length) {
      setShuffledAnswers(shuffleAnswers(game.questions[game.currentIndex]));
    }
  }, [game.currentIndex, game.started, game.finished]);

  useEffect(() => {
    if (!game.started || game.finished) return;
    if (game.timeLeft <= 0) {
      finishGame();
      return;
    }
    const timer = setInterval(() => {
      setGame({ ...game, timeLeft: game.timeLeft - 1 });
    }, 1000);
    return () => clearInterval(timer);
  }, [game.started, game.finished, game.timeLeft]);

  const startGame = () => {
    setGame({ ...game, started: true });
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    const correct = answer === game.questions[game.currentIndex].correct_answer;
    const newScore = correct ? game.score + 1 : game.score;

    setTimeout(() => {
      const nextIndex = game.currentIndex + 1;
      if (nextIndex >= game.questions.length || game.timeLeft <= 0) {
        const finished = { ...game, score: newScore, finished: true, currentIndex: nextIndex };
        setGame(finished);
        saveResults(finished);
      } else {
        setGame({ ...game, score: newScore, currentIndex: nextIndex });
      }
      setSelectedAnswer(null);
      setShowResult(false);
    }, 800);
  };

  const finishGame = useCallback(() => {
    const finished = { ...game, finished: true };
    setGame(finished);
    saveResults(finished);
  }, [game]);

  const saveResults = async (finishedGame: ActiveGame) => {
    if (completedRef.current || !finishedGame.sessionId) return;
    completedRef.current = true;

    try {
      const score = finishedGame.score * 100;
      const maxScore = finishedGame.questions.length * 100;
      const timeSeconds = finishedGame.totalTime - finishedGame.timeLeft;

      const { data, error } = await supabase.rpc("complete_minigame_session", {
        session_id_param: finishedGame.sessionId,
        score_param: score,
        max_score_param: maxScore,
        time_seconds_param: timeSeconds,
        moves_param: finishedGame.currentIndex,
        items_matched_param: finishedGame.score,
      });

      if (error) throw error;

      setGame({
        ...finishedGame,
        rewards: data as ActiveGame["rewards"],
      });

      if (data.is_new_high_score) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      } else {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }

      toast.success(
        `Jogo Completo! +${data.coins_earned} moedas +${data.xp_earned} XP`,
        { duration: 3000 }
      );
    } catch {
      toast.error("Erro ao guardar resultados.");
    }
  };

  if (!game.started) {
    return (
      <div className="text-center py-6 space-y-4">
        <span className="text-5xl">{game.minigame.icon}</span>
        <h3 className="text-lg font-bold">{game.minigame.display_name}</h3>
        <p className="text-sm text-muted-foreground">{game.minigame.description}</p>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {game.totalTime}s
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            {game.questions.length} perguntas
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={startGame}>
            <Play className="w-4 h-4 mr-1" />
            Começar!
          </Button>
        </div>
      </div>
    );
  }

  if (game.finished) {
    const total = game.questions.length;
    const pct = Math.round((game.score / total) * 100);

    return (
      <div className="text-center py-6 space-y-4">
        <Trophy className={`w-12 h-12 mx-auto ${pct >= 70 ? 'text-amber-500' : 'text-muted-foreground'}`} />
        <h3 className="text-lg font-bold">
          {pct >= 90 ? 'Incrível!' : pct >= 70 ? 'Muito Bem!' : pct >= 50 ? 'Bom trabalho!' : 'Continua a tentar!'}
        </h3>
        <div className="text-3xl font-bold text-amber-600">{game.score}/{total}</div>
        <p className="text-sm text-muted-foreground">{pct}% corretas</p>
        {game.rewards ? (
          <div className="flex justify-center gap-3">
            <Badge className="bg-amber-100 text-amber-800">{game.rewards.coins_earned} moedas</Badge>
            <Badge className="bg-blue-100 text-blue-800">{game.rewards.diamonds_earned} diamantes</Badge>
            <Badge className="bg-green-100 text-green-800">{game.rewards.xp_earned} XP</Badge>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {game.rewards?.is_new_high_score && (
          <Badge className="bg-yellow-500 text-white">Novo Recorde!</Badge>
        )}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onBack}>Voltar</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => {
              completedRef.current = false;
              launchReplay();
            }}
          >
            Jogar Outra Vez
          </Button>
        </div>
      </div>
    );
  }

  async function launchReplay() {
    const { data: sessionId } = await supabase.rpc("start_minigame_session", {
      student_id_param: studentId,
      minigame_name: game.minigame.name,
      difficulty_param: "medium",
    });

    setGame({
      ...game,
      sessionId: (sessionId as string) || null,
      currentIndex: 0,
      score: 0,
      timeLeft: game.totalTime,
      started: false,
      finished: false,
      rewards: null,
    });
  }

  const q = game.questions[game.currentIndex];
  const progress = ((game.currentIndex) / game.questions.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{game.currentIndex + 1}/{game.questions.length}</span>
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="font-bold">{game.score}</span>
        </div>
        <div className={`flex items-center gap-1 ${game.timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{game.timeLeft}s</span>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-4">
        <p className="text-sm font-medium text-center leading-relaxed">{q.question}</p>
      </Card>

      <div className="grid grid-cols-1 gap-2">
        {shuffledAnswers.map((ans, i) => {
          let variant: "outline" | "default" | "destructive" = "outline";
          let extraClass = "hover:bg-slate-100";

          if (showResult) {
            if (ans === q.correct_answer) {
              variant = "default";
              extraClass = "bg-green-500 hover:bg-green-500 text-white border-green-500";
            } else if (ans === selectedAnswer) {
              variant = "destructive";
              extraClass = "";
            } else {
              extraClass = "opacity-50";
            }
          }

          return (
            <Button
              key={i}
              variant={variant}
              className={`text-left justify-start h-auto py-3 px-4 text-sm whitespace-normal ${extraClass}`}
              onClick={() => handleAnswer(ans)}
              disabled={showResult}
            >
              {ans}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function shuffleAnswers(q: QuizQuestion): string[] {
  const wrongs = Array.isArray(q.wrong_answers) ? q.wrong_answers : [];
  const answers = [q.correct_answer, ...wrongs.slice(0, 3)];
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  return answers;
}
