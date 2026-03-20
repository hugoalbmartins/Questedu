import { useState, useEffect } from "react";
import { getRandomQuestions, Question } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, Check, X } from "lucide-react";

interface BattleQuizOverlayProps {
  student: {
    id: string;
    school_year: string;
    is_premium?: boolean;
  };
  enemyName: string;
  enemyEmoji: string;
  onResult: (correct: boolean) => void;
  onFlee: () => void;
}

export const BattleQuizOverlay = ({
  student,
  enemyName,
  enemyEmoji,
  onResult,
  onFlee,
}: BattleQuizOverlayProps) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const qs = getRandomQuestions(student.school_year, 1);
    setQuestion(qs[0] ?? null);
  }, [student.school_year]);

  useEffect(() => {
    if (done || !question) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, done, question]);

  const handleAnswer = (idx: number) => {
    if (done) return;
    setDone(true);
    setSelected(idx);
    const correct = question ? idx === question.correctAnswer : false;
    setTimeout(() => onResult(correct), 900);
  };

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Swords className="w-5 h-5" />
            <span className="font-bold text-lg">Batalha contra {enemyName} {enemyEmoji}</span>
          </div>
          <div className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
            {timeLeft}s
          </div>
        </div>

        <Progress value={(timeLeft / 15) * 100} className="h-1.5 rounded-none bg-red-100 [&>div]:bg-red-500" />

        <div className="p-6 space-y-5">
          <p className="text-slate-800 font-semibold text-center text-base leading-relaxed">
            {question.question}
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {question.options.map((opt, i) => {
              let cls = "border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50";
              if (done && selected === i) {
                cls = i === question.correctAnswer
                  ? "border-2 border-green-500 bg-green-50"
                  : "border-2 border-red-500 bg-red-50";
              } else if (done && i === question.correctAnswer) {
                cls = "border-2 border-green-500 bg-green-50";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={done}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 ${cls}`}
                >
                  {done && i === question.correctAnswer && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  {done && selected === i && i !== question.correctAnswer && <X className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onFlee}
            className="w-full text-slate-500 hover:text-slate-700"
            disabled={done}
          >
            Fugir da batalha
          </Button>
        </div>
      </div>
    </div>
  );
};
