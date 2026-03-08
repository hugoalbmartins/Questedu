
-- Resource types enum
CREATE TYPE public.resource_type_natural AS ENUM ('wood', 'stone', 'iron', 'coal', 'food', 'leather', 'fish');

-- Player resources inventory
CREATE TABLE public.player_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  resource_type resource_type_natural NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, resource_type)
);

-- Gathering log (cooldown tracking + history)
CREATE TABLE public.gathering_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  resource_type resource_type_natural NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1,
  terrain_element_id INTEGER NOT NULL,
  gathered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gathering_log ENABLE ROW LEVEL SECURITY;

-- RLS: Students can view and manage own resources
CREATE POLICY "Students can view own resources" ON public.player_resources
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_resources.student_id AND students.user_id = auth.uid()));

CREATE POLICY "Students can manage own resources" ON public.player_resources
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_resources.student_id AND students.user_id = auth.uid()));

-- RLS: Parents can view children resources
CREATE POLICY "Parents can view children resources" ON public.player_resources
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_resources.student_id AND students.parent_id = auth.uid()));

-- RLS: Gathering log
CREATE POLICY "Students can manage own gathering log" ON public.gathering_log
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = gathering_log.student_id AND students.user_id = auth.uid()));

CREATE POLICY "Students can view own gathering log" ON public.gathering_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = gathering_log.student_id AND students.user_id = auth.uid()));
