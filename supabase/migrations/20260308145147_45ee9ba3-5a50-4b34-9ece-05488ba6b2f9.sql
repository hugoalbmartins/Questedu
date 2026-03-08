
-- In-app notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  icon text DEFAULT '🔔',
  type text NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = notifications.student_id AND students.user_id = auth.uid()));

CREATE POLICY "Students can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = notifications.student_id AND students.user_id = auth.uid()));

-- Allow inserts from service role and authenticated (for triggers/functions)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = notifications.student_id AND students.user_id = auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to auto-create notification on achievement unlock
CREATE OR REPLACE FUNCTION public.notify_achievement_unlocked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _achievement achievements%ROWTYPE;
BEGIN
  SELECT * INTO _achievement FROM achievements WHERE id = NEW.achievement_id;
  IF FOUND THEN
    INSERT INTO notifications (student_id, title, message, icon, type)
    VALUES (
      NEW.student_id,
      'Conquista desbloqueada!',
      _achievement.title || ' — ' || COALESCE(_achievement.description, ''),
      COALESCE(_achievement.icon, '🏆'),
      'achievement'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_achievement_unlocked
  AFTER INSERT ON public.player_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_achievement_unlocked();

-- Function to create daily quiz reminders (called by cron or edge function)
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
  WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.student_id = s.id
      AND n.type = 'quiz_reminder'
      AND n.created_at::date = CURRENT_DATE
  );
END;
$$;
