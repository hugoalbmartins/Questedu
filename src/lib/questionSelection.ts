import { supabase } from "@/integrations/supabase/client";

export type SchoolPeriod = 'inicio_ano' | 'meio_ano' | 'fim_ano' | 'revisao';
export type Subject = 'portugues' | 'matematica' | 'estudo_meio' | 'ingles';

export interface SubjectPriority {
  subject: Subject;
  priority: number;
  priority_multiplier: number;
}

export function getCurrentSchoolPeriod(): SchoolPeriod {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (month >= 9 || month <= 12) {
    return 'inicio_ano';
  } else if (month >= 1 && month <= 3) {
    return 'meio_ano';
  } else if (month >= 4 && month <= 6) {
    return 'fim_ano';
  }

  return 'meio_ano';
}

export function getDifficultyDistribution(period: SchoolPeriod): { easy: number; medium: number; hard: number } {
  switch (period) {
    case 'inicio_ano':
      return { easy: 60, medium: 30, hard: 10 };
    case 'meio_ano':
      return { easy: 40, medium: 40, hard: 20 };
    case 'fim_ano':
      return { easy: 20, medium: 50, hard: 30 };
    case 'revisao':
      return { easy: 30, medium: 40, hard: 30 };
    default:
      return { easy: 40, medium: 40, hard: 20 };
  }
}

export async function getSubjectPriorities(studentId: string, parentId: string): Promise<SubjectPriority[]> {
  const { data, error } = await supabase
    .from('subject_priorities')
    .select('subject, priority, priority_multiplier')
    .eq('student_id', studentId)
    .eq('parent_id', parentId);

  if (error || !data || data.length === 0) {
    return [
      { subject: 'portugues', priority: 2, priority_multiplier: 1.0 },
      { subject: 'matematica', priority: 2, priority_multiplier: 1.0 },
      { subject: 'estudo_meio', priority: 2, priority_multiplier: 1.0 },
      { subject: 'ingles', priority: 2, priority_multiplier: 1.0 }
    ];
  }

  return data.map(d => ({
    subject: d.subject as Subject,
    priority: d.priority,
    priority_multiplier: d.priority_multiplier || 1.0
  }));
}

export function calculateSubjectDistribution(priorities: SubjectPriority[], totalQuestions: number = 5): Record<Subject, number> {
  const totalPriority = priorities.reduce((sum, p) => sum + (p.priority * p.priority_multiplier), 0);

  const distribution: Record<Subject, number> = {
    portugues: 0,
    matematica: 0,
    estudo_meio: 0,
    ingles: 0
  };

  let assigned = 0;

  priorities.forEach((p, index) => {
    const weight = (p.priority * p.priority_multiplier) / totalPriority;
    let count = Math.floor(weight * totalQuestions);

    if (index === priorities.length - 1) {
      count = totalQuestions - assigned;
    }

    distribution[p.subject] = Math.max(1, count);
    assigned += count;
  });

  return distribution;
}

export async function selectQuestionsWithPriorities(
  schoolYear: string,
  studentId: string,
  parentId: string,
  totalQuestions: number = 5,
  isRevisionMode: boolean = false
): Promise<any[]> {
  const currentPeriod = isRevisionMode ? 'revisao' : getCurrentSchoolPeriod();
  const difficultyDist = getDifficultyDistribution(currentPeriod);

  const priorities = await getSubjectPriorities(studentId, parentId);
  const subjectDist = calculateSubjectDistribution(priorities, totalQuestions);

  const selectedQuestions: any[] = [];

  for (const [subject, count] of Object.entries(subjectDist)) {
    if (count === 0) continue;

    const easyCount = Math.ceil(count * (difficultyDist.easy / 100));
    const mediumCount = Math.ceil(count * (difficultyDist.medium / 100));
    const hardCount = count - easyCount - mediumCount;

    const queries = [
      { difficulty: 1, count: easyCount },
      { difficulty: 2, count: mediumCount },
      { difficulty: 3, count: hardCount > 0 ? hardCount : 0 }
    ];

    for (const query of queries) {
      if (query.count === 0) continue;

      let queryBuilder = supabase
        .from('questions')
        .select('*')
        .eq('school_year', schoolYear)
        .eq('subject', subject)
        .eq('difficulty', query.difficulty);

      if (!isRevisionMode) {
        queryBuilder = queryBuilder.eq('school_period', currentPeriod);
      }

      const { data, error } = await queryBuilder.limit(query.count * 3);

      if (data && data.length > 0) {
        const shuffled = data.sort(() => Math.random() - 0.5);
        selectedQuestions.push(...shuffled.slice(0, query.count));
      }
    }
  }

  return selectedQuestions.sort(() => Math.random() - 0.5).slice(0, totalQuestions);
}

export async function getStreakInfo(studentId: string) {
  const { data, error } = await supabase
    .from('quiz_streaks')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error || !data) {
    return {
      current_streak: 0,
      longest_streak: 0,
      total_quizzes: 0,
      last_quiz_date: null
    };
  }

  return data;
}

export function calculateStreakBonus(currentStreak: number): number {
  if (currentStreak === 0 || currentStreak === 1) return 0;
  if (currentStreak === 2) return 5;
  if (currentStreak === 3) return 10;
  if (currentStreak >= 7) return 25;
  return 15;
}
