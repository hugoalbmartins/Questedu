import { useState, useEffect } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStreakInfo } from '@/lib/questionSelection';

interface StreakIndicatorProps {
  studentId: string;
  onClickQuiz?: () => void;
}

export const StreakIndicator = ({ studentId, onClickQuiz }: StreakIndicatorProps) => {
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    longest_streak: 0,
    last_quiz_date: null as Date | null
  });
  const [loading, setLoading] = useState(true);
  const [showEncouragement, setShowEncouragement] = useState(false);

  useEffect(() => {
    loadStreak();
    const interval = setInterval(loadStreak, 60000);
    return () => clearInterval(interval);
  }, [studentId]);

  const loadStreak = async () => {
    try {
      const data = await getStreakInfo(studentId);
      setStreakData({
        current_streak: data.current_streak,
        longest_streak: data.longest_streak,
        last_quiz_date: data.last_quiz_date ? new Date(data.last_quiz_date) : null
      });

      if (data.last_quiz_date) {
        const lastDate = new Date(data.last_quiz_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastDate.setHours(0, 0, 0, 0);

        const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince >= 1 && data.current_streak > 0) {
          setShowEncouragement(true);
        }
      }
    } catch (err) {
      console.error('Error loading streak:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const hasStreak = streakData.current_streak > 0;
  const isNewRecord = streakData.current_streak === streakData.longest_streak && streakData.current_streak > 1;

  return (
    <button
      onClick={onClickQuiz}
      className={`relative group ${
        hasStreak
          ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/40'
          : 'bg-card border-2 border-border'
      } px-4 py-2 rounded-xl hover:scale-105 transition-all duration-200 shadow-lg`}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <Flame
            className={`w-6 h-6 ${
              hasStreak ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'
            }`}
          />
          {hasStreak && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce">
              {streakData.current_streak}
            </div>
          )}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1">
            <span className="font-body text-sm font-bold">
              {hasStreak ? `${streakData.current_streak} dia${streakData.current_streak > 1 ? 's' : ''}` : 'Streak'}
            </span>
            {isNewRecord && (
              <TrendingUp className="w-3.5 h-3.5 text-gold animate-bounce" />
            )}
          </div>
          <span className="font-body text-[10px] text-muted-foreground">
            {hasStreak ? `Recorde: ${streakData.longest_streak}` : 'Faz um quiz!'}
          </span>
        </div>
      </div>

      {showEncouragement && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-lg animate-bounce">
          ⚡ Mantém a streak!
        </div>
      )}

      <div className="absolute hidden group-hover:block -bottom-20 left-1/2 transform -translate-x-1/2 bg-card border-2 border-border rounded-lg p-3 shadow-xl whitespace-nowrap z-50">
        <div className="font-body text-xs space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold">Streak Atual: {streakData.current_streak} dia{streakData.current_streak !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            <span className="font-bold">Melhor Streak: {streakData.longest_streak} dia{streakData.longest_streak !== 1 ? 's' : ''}</span>
          </div>
          {hasStreak && (
            <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
              <p className="font-bold text-secondary">Bónus ativo!</p>
              <p>
                {streakData.current_streak === 2 && '+5% nas recompensas'}
                {streakData.current_streak === 3 && '+10% nas recompensas'}
                {streakData.current_streak >= 7 && '+25% nas recompensas'}
                {streakData.current_streak > 3 && streakData.current_streak < 7 && '+15% nas recompensas'}
              </p>
            </div>
          )}
          {!hasStreak && (
            <p className="mt-2 pt-2 border-t border-border text-muted-foreground">
              Completa um quiz por dia para ganhar bónus!
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
