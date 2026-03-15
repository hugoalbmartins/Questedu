import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Trophy, Clock, Zap, Star, RefreshCw, Chrome as Home, Award } from "lucide-react";

interface Question {
  id: string;
  question: string;
  correct_answer: string;
  subject: string;
}

interface MemoryCard {
  id: string;
  content: string;
  type: "question" | "answer";
  questionId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  schoolYear: number;
  difficulty?: "easy" | "medium" | "hard";
}

export function MemoryGameModal({
  isOpen,
  onClose,
  studentId,
  schoolYear,
  difficulty = "medium",
}: MemoryGameModalProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<any>(null);

  const pairCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8;

  useEffect(() => {
    if (isOpen) {
      initializeGame();
    } else {
      resetGame();
    }
  }, [isOpen]);

  useEffect(() => {
    if (gameStarted && !gameCompleted) {
      const timer = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameCompleted]);

  useEffect(() => {
    if (matchedPairs.length === pairCount && gameStarted) {
      completeGame();
    }
  }, [matchedPairs.length]);

  const initializeGame = async () => {
    setLoading(true);
    try {
      const { data: questions, error } = await supabase
        .from("questions")
        .select("id, question, correct_answer, subject")
        .eq("school_year", schoolYear)
        .limit(pairCount);

      if (error) throw error;

      if (!questions || questions.length < pairCount) {
        toast.error("Não há perguntas suficientes disponíveis");
        onClose();
        return;
      }

      const { data: sessionIdData, error: sessionError } = await supabase.rpc(
        "start_minigame_session",
        {
          student_id_param: studentId,
          minigame_name: "memory_cards",
          difficulty_param: difficulty,
        }
      );

      if (sessionError) throw sessionError;

      setSessionId(sessionIdData);

      const gameCards: MemoryCard[] = [];
      questions.forEach((q) => {
        gameCards.push({
          id: `q-${q.id}`,
          content: q.question,
          type: "question",
          questionId: q.id,
          isFlipped: false,
          isMatched: false,
        });
        gameCards.push({
          id: `a-${q.id}`,
          content: q.correct_answer,
          type: "answer",
          questionId: q.id,
          isFlipped: false,
          isMatched: false,
        });
      });

      const shuffled = gameCards.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setGameStarted(true);
    } catch (error) {
      console.error("Error initializing game:", error);
      toast.error("Erro ao iniciar jogo");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (
      flippedCards.length >= 2 ||
      flippedCards.includes(cardId) ||
      cards.find((c) => c.id === cardId)?.isMatched
    ) {
      return;
    }

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    const newCards = cards.map((card) =>
      card.id === cardId ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      checkMatch(newFlipped);
    }
  };

  const checkMatch = (flipped: string[]) => {
    const [first, second] = flipped;
    const firstCard = cards.find((c) => c.id === first);
    const secondCard = cards.find((c) => c.id === second);

    if (!firstCard || !secondCard) return;

    const isMatch = firstCard.questionId === secondCard.questionId;

    setTimeout(() => {
      if (isMatch) {
        setCards((prev) =>
          prev.map((card) =>
            card.questionId === firstCard.questionId
              ? { ...card, isMatched: true }
              : card
          )
        );
        setMatchedPairs((prev) => [...prev, firstCard.questionId]);
        toast.success("Par encontrado!", { duration: 1000 });
      } else {
        setCards((prev) =>
          prev.map((card) =>
            flipped.includes(card.id) ? { ...card, isFlipped: false } : card
          )
        );
      }
      setFlippedCards([]);
    }, 1000);
  };

  const completeGame = async () => {
    if (!sessionId) return;

    setGameCompleted(true);

    try {
      const { data, error } = await supabase.rpc("complete_minigame_session", {
        session_id_param: sessionId,
        score_param: matchedPairs.length * 100,
        max_score_param: pairCount * 100,
        time_seconds_param: timeSeconds,
        moves_param: moves,
        items_matched_param: matchedPairs.length,
      });

      if (error) throw error;

      setRewards(data);

      if (data.is_new_high_score) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
        });
      } else {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      toast.success(
        `Jogo Completo! +${data.coins_earned}🪙 +${data.diamonds_earned}💎 +${data.xp_earned}⭐`,
        { duration: 4000 }
      );
    } catch (error) {
      console.error("Error completing game:", error);
      toast.error("Erro ao finalizar jogo");
    }
  };

  const resetGame = () => {
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setTimeSeconds(0);
    setGameStarted(false);
    setGameCompleted(false);
    setSessionId(null);
    setRewards(null);
  };

  const handleRestart = () => {
    resetGame();
    initializeGame();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="py-8 text-center">
            <p className="text-lg">A preparar o jogo...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            🎴 Jogo da Memória
            <Badge variant={difficulty === "easy" ? "secondary" : difficulty === "medium" ? "default" : "destructive"}>
              {difficulty === "easy" ? "Fácil" : difficulty === "medium" ? "Médio" : "Difícil"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Encontra os pares de perguntas e respostas!
          </DialogDescription>
        </DialogHeader>

        {!gameCompleted ? (
          <>
            <div className="flex justify-around items-center p-4 bg-muted rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                  <p className="text-xl font-bold">{formatTime(timeSeconds)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Jogadas</p>
                  <p className="text-xl font-bold">{moves}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pares</p>
                  <p className="text-xl font-bold">
                    {matchedPairs.length}/{pairCount}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`grid gap-3 ${
                pairCount === 4
                  ? "grid-cols-4"
                  : pairCount === 6
                  ? "grid-cols-4"
                  : "grid-cols-4"
              }`}
            >
              {cards.map((card) => (
                <Card
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`
                    aspect-square cursor-pointer transition-all duration-300 transform
                    ${card.isFlipped || card.isMatched ? "scale-105" : "hover:scale-105"}
                    ${card.isMatched ? "opacity-50" : ""}
                  `}
                >
                  <div className="w-full h-full flex items-center justify-center p-3">
                    {card.isFlipped || card.isMatched ? (
                      <div className="text-center">
                        <div
                          className={`text-xs font-semibold mb-1 ${
                            card.type === "question"
                              ? "text-blue-500"
                              : "text-green-500"
                          }`}
                        >
                          {card.type === "question" ? "Pergunta" : "Resposta"}
                        </div>
                        <p className="text-xs leading-tight">{card.content}</p>
                      </div>
                    ) : (
                      <div className="text-4xl">🎴</div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <Trophy className="w-24 h-24 text-yellow-500 animate-bounce" />
            </div>

            <div>
              <h3 className="text-3xl font-bold mb-2">Parabéns!</h3>
              <p className="text-muted-foreground">
                Completaste o jogo da memória!
              </p>
            </div>

            {rewards && (
              <>
                {rewards.is_new_high_score && (
                  <Badge className="text-lg px-4 py-2 bg-yellow-500">
                    <Award className="w-5 h-5 mr-2" />
                    Novo Recorde Pessoal!
                  </Badge>
                )}

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">
                      +{rewards.coins_earned}
                    </p>
                    <p className="text-sm text-muted-foreground">Moedas</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">
                      +{rewards.diamonds_earned}
                    </p>
                    <p className="text-sm text-muted-foreground">Diamantes</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">
                      +{rewards.xp_earned}
                    </p>
                    <p className="text-sm text-muted-foreground">XP</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
                  <div>
                    <p className="text-muted-foreground">Tempo</p>
                    <p className="font-bold">{formatTime(timeSeconds)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Jogadas</p>
                    <p className="font-bold">{moves}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Precisão</p>
                    <p className="font-bold">{rewards.accuracy.toFixed(0)}%</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={handleRestart} size="lg">
                <RefreshCw className="w-5 h-5 mr-2" />
                Jogar Novamente
              </Button>
              <Button onClick={onClose} variant="outline" size="lg">
                <Home className="w-5 h-5 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
