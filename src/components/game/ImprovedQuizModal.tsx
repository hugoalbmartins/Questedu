import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Coins, Diamond, Users, Crown, Flame, TrendingUp, Star } from "lucide-react";
import { selectQuestionsWithPriorities, getStreakInfo, calculateStreakBonus } from "@/lib/questionSelection";

interface ImprovedQuizModalProps {
  student: {
    id: string;
    user_id: string;
    parent_id: string;
    school_year: string;
    is_premium?: boolean;
    xp?: number;
  };
  onClose: () => void;
  subjectFilter?: 'portugues' | 'matematica' | 'estudo_meio' | 'ingles' | null;
  isRevisionMode?: boolean;
}

const rewardTypes = [
  { type: "coins", icon: Coins, label: "Moedas", amount: 25, color: "text-gold" },
  { type: "diamonds", icon: Diamond, label: "Diamantes", amount: 8, color: "text-diamond" },
  { type: "citizens", icon: Users, label: "Cidadãos", amount: 3, color: "text-citizen" },
];

const motivationalMessages = [
  "Excelente trabalho!",
  "Brilhante!",
  "És um génio!",
  "Fantástico!",
  "Impressionante!",
  "Espetacular!",
  "Incrível!",
];

export const ImprovedQuizModal = ({ student, onClose, subjectFilter, isRevisionMode = false }: ImprovedQuizModalProps) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [reward, setReward] = useState(rewardTypes[0]);
  const [loading, setLoading] = useState(true);
  const [streakInfo, setStreakInfo] = useState({ current_streak: 0, longest_streak: 0 });
  const [showCelebration, setShowCelebration] = useState(false);

  const isPremium = student.is_premium || false;
  const studentXp = student.xp || 0;

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    setLoading(true);

    const streak = await getStreakInfo(student.id);
    setStreakInfo(streak);

    const selectedQuestions = await selectQuestionsWithPriorities(
      student.school_year,
      student.id,
      student.parent_id,
      5,
      isRevisionMode
    );

    setQuestions(selectedQuestions);
    setReward(rewardTypes[Math.floor(Math.random() * rewardTypes.length)]);
    setLoading(false);
  };

  const triggerCelebration = () => {
    setShowCelebration(true);

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 70 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    const starBurst = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
        zIndex: 70
      });
    };

    starBurst();
    setTimeout(starBurst, 500);
    setTimeout(starBurst, 1000);

    setTimeout(() => setShowCelebration(false), 3500);
  };

  const handleAnswer = async (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === questions[currentIndex].correct_answer;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    await supabase.from("quiz_history").insert({
      student_id: student.id,
      question_id: questions[currentIndex].id,
      answered_correctly: isCorrect,
      reward_type: reward.type,
      reward_amount: 0
    });
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);

      const percentage = (correctCount / questions.length) * 100;

      if (percentage >= 80) {
        triggerCelebration();
      }

      if (correctCount >= 3) {
        const streakBonus = calculateStreakBonus(streakInfo.current_streak);
        const premiumMultiplier = isPremium ? 1.15 : 1;
        const baseReward = reward.amount * (correctCount / 5);
        const totalReward = Math.round(baseReward * premiumMultiplier * (1 + streakBonus / 100));
        const xpGain = Math.round(correctCount * 12 * premiumMultiplier * (1 + streakBonus / 100));

        const { data: currentStudent } = await supabase
          .from("students")
          .select("coins, diamonds, citizens, xp")
          .eq("id", student.id)
          .maybeSingle();

        if (currentStudent) {
          const updateData: Record<string, number> = {};
          if (reward.type === "coins") updateData.coins = currentStudent.coins + totalReward;
          else if (reward.type === "diamonds") updateData.diamonds = currentStudent.diamonds + totalReward;
          else updateData.citizens = currentStudent.citizens + totalReward;
          updateData.xp = currentStudent.xp + xpGain;

          await supabase.from("students").update(updateData).eq("id", student.id);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-center">
        <div className="game-border p-8 bg-card">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="font-body mt-4 text-center">A preparar quiz...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-center px-4">
        <div className="game-border p-8 bg-card max-w-md">
          <p className="font-body text-center mb-4">Não foram encontradas perguntas disponíveis.</p>
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const percentage = (correctCount / questions.length) * 100;
  const streakBonus = calculateStreakBonus(streakInfo.current_streak);

  const baseReward = reward.amount * (correctCount / 5);
  const premiumMultiplier = isPremium ? 1.15 : 1;
  const withPremium = baseReward * premiumMultiplier;
  const finalReward = Math.round(withPremium * (1 + streakBonus / 100));

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="w-full sm:max-w-2xl game-border p-4 sm:p-6 bg-card relative animate-slide-up max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl">
        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>

        {!quizComplete && (
          <div className="mb-6 p-4 bg-accent/20 rounded-lg border-2 border-accent/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <reward.icon className={`w-8 h-8 ${reward.color}`} />
                <div>
                  <p className="font-body text-sm font-bold">Recompensa Potencial</p>
                  <p className="font-body text-xs text-muted-foreground">
                    3/5 acertos: +{Math.round(reward.amount * 0.6)} | 5/5 acertos: +{reward.amount}
                  </p>
                </div>
              </div>

              {streakInfo.current_streak > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-full border border-orange-500/40">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-body text-sm font-bold">{streakInfo.current_streak} dias</span>
                  {streakBonus > 0 && (
                    <span className="font-body text-xs text-orange-500">+{streakBonus}%</span>
                  )}
                </div>
              )}

              {isPremium && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gold/20 rounded">
                  <Crown className="w-4 h-4 text-gold" />
                  <span className="font-body text-xs text-gold font-bold">+15%</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-secondary to-gold transition-all duration-300"
                  style={{ width: `${(correctCount / questions.length) * 100}%` }}
                />
              </div>
              <span className="font-body text-xs font-bold whitespace-nowrap">
                {correctCount}/{questions.length}
              </span>
            </div>
          </div>
        )}

        {quizComplete ? (
          <div className="text-center py-8 relative">
            {showCelebration && percentage >= 80 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl animate-bounce">⭐</div>
              </div>
            )}

            <div className="mb-6">
              {percentage >= 80 ? (
                <>
                  <Star className="w-20 h-20 text-gold mx-auto mb-4 animate-pulse" />
                  <h2 className="font-display text-3xl font-bold mb-2 text-gold">
                    {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
                  </h2>
                </>
              ) : correctCount >= 3 ? (
                <>
                  <TrendingUp className="w-16 h-16 text-secondary mx-auto mb-4" />
                  <h2 className="font-display text-2xl font-bold mb-2">Bom trabalho!</h2>
                </>
              ) : (
                <h2 className="font-display text-2xl font-bold mb-2">Continua a praticar!</h2>
              )}
            </div>

            <div className="mb-6 p-6 bg-accent/10 rounded-lg border-2 border-accent/30">
              <p className="font-body text-4xl font-bold mb-2">
                {correctCount}/{questions.length}
              </p>
              <p className="font-body text-lg text-muted-foreground">
                {percentage.toFixed(0)}% de acertos
              </p>
            </div>

            {correctCount >= 3 && (
              <div className="mb-6 space-y-3">
                <div className="parchment-bg rounded-lg p-4 inline-flex items-center gap-3">
                  <reward.icon className={`w-8 h-8 ${reward.color}`} />
                  <div className="text-left">
                    <p className="font-body text-2xl font-bold">+{finalReward}</p>
                    <p className="font-body text-sm text-muted-foreground">{reward.label}</p>
                  </div>
                </div>

                {(streakBonus > 0 || isPremium) && (
                  <div className="flex gap-2 justify-center flex-wrap">
                    {streakBonus > 0 && (
                      <div className="text-xs px-3 py-1 bg-orange-500/20 rounded-full border border-orange-500/40 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        <span>Bónus Streak: +{streakBonus}%</span>
                      </div>
                    )}
                    {isPremium && (
                      <div className="text-xs px-3 py-1 bg-gold/20 rounded-full border border-gold/40 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        <span>Bónus Premium: +15%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button onClick={onClose} className="bg-primary text-primary-foreground font-bold px-8">
                Voltar à Aldeia
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-sm font-bold">
                  Pergunta {currentIndex + 1}/{questions.length}
                </span>
                {isRevisionMode && (
                  <span className="text-xs px-3 py-1 bg-accent rounded-full font-body">
                    📖 Modo Revisão
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="mb-4">
              <span className="text-sm font-body px-3 py-1 rounded-full bg-accent text-accent-foreground font-bold">
                {currentQuestion.subject === "portugues" ? "📚 Português" :
                 currentQuestion.subject === "matematica" ? "🔢 Matemática" :
                 currentQuestion.subject === "estudo_meio" ? "🌍 Estudo do Meio" : "🇬🇧 Inglês"}
              </span>
              {currentQuestion.topic && (
                <span className="text-xs font-body ml-2 text-muted-foreground">
                  · {currentQuestion.topic}
                </span>
              )}
            </div>

            <h2 className="font-body text-xl font-bold mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option: string, i: number) => {
                let btnClass = "w-full text-left justify-start py-4 px-5 font-body border-2 transition-all ";
                if (showResult) {
                  if (i === currentQuestion.correct_answer) {
                    btnClass += "border-secondary bg-secondary/20 shadow-lg ";
                  } else if (i === selectedAnswer) {
                    btnClass += "border-destructive bg-destructive/20 ";
                  } else {
                    btnClass += "border-border opacity-50 ";
                  }
                } else {
                  btnClass += "border-border hover:border-primary hover:shadow-md ";
                }
                return (
                  <Button
                    key={i}
                    variant="outline"
                    className={btnClass}
                    onClick={() => handleAnswer(i)}
                    disabled={showResult}
                  >
                    <span className="mr-3 font-bold text-lg text-primary">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="text-base">{option}</span>
                  </Button>
                );
              })}
            </div>

            {showResult && (
              <div className="text-center">
                <p className={`font-body text-xl font-bold mb-4 ${
                  selectedAnswer === currentQuestion.correct_answer ? "text-secondary" : "text-destructive"
                }`}>
                  {selectedAnswer === currentQuestion.correct_answer ? "✅ Correto!" : "❌ Incorreto!"}
                </p>
                <Button onClick={handleNext} className="bg-primary text-primary-foreground font-bold px-8 py-3">
                  {currentIndex + 1 < questions.length ? "Próxima Pergunta ➡️" : "Ver Resultado Final 🏆"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
