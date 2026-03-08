
CREATE OR REPLACE FUNCTION public.create_daily_quiz_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (student_id, title, message, icon, type)
  SELECT s.id, 'Quiz diário! 📚', 'Não te esqueças de responder aos quizzes de hoje para ganhar moedas e XP!', '📚', 'quiz_reminder'
  FROM students s
  WHERE s.quiz_reminders_enabled = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.student_id = s.id
        AND n.type = 'quiz_reminder'
        AND n.created_at::date = CURRENT_DATE
    );
END;
$$;
