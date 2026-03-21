/*
  # Seed game data for all menu features

  1. Shop Items - 18 items across 4 types
  2. Missions - 15 missions (daily, weekly, monthly)
  3. Monthly Tests - 15 tests for March 2026
  4. Tournaments - 3 tournaments with prizes
  5. Seasonal Events - Update to active + add challenges
  6. Additional Minigames - 6 new games (jsonb format)
*/

-- 1. SHOP ITEMS
INSERT INTO shop_items (name, description, item_type, rarity, price_coins, price_diamonds, min_village_level, defense_bonus, citizen_bonus, xp_bonus, is_available) VALUES
  ('Paliçada Reforçada', 'Melhora a defesa da tua aldeia', 'defense', 'common', 50, 0, 1, 5, 0, 0, true),
  ('Muralha de Pedra', 'Parede forte de pedra para proteger a aldeia', 'defense', 'rare', 150, 2, 2, 15, 0, 10, true),
  ('Torre de Vigia Avançada', 'Detecta invasores mais cedo', 'defense', 'epic', 300, 5, 3, 25, 0, 20, true),
  ('Escudo Real', 'O melhor escudo do reino', 'defense', 'legendary', 500, 10, 4, 50, 0, 50, true),
  ('Estandarte de Aldeia', 'Decora a tua aldeia com um estandarte', 'decoration', 'common', 20, 0, 1, 0, 1, 5, true),
  ('Fonte Ornamental', 'Uma bela fonte para a praça', 'decoration', 'rare', 80, 1, 1, 0, 3, 10, true),
  ('Jardim Real', 'Jardim decorativo com flores', 'decoration', 'rare', 120, 2, 2, 0, 5, 15, true),
  ('Estátua do Herói', 'Estátua que inspira os cidadãos', 'decoration', 'epic', 250, 5, 3, 0, 10, 30, true),
  ('Monumento Nacional', 'Orgulho da nação inteira', 'decoration', 'legendary', 500, 10, 4, 5, 15, 50, true),
  ('Casa Melhorada', 'Melhora uma casa existente', 'building', 'common', 40, 0, 1, 0, 3, 5, true),
  ('Mercado Expandido', 'Mais espaço para trocas', 'building', 'rare', 100, 2, 2, 0, 5, 15, true),
  ('Biblioteca', 'Aumenta o conhecimento da aldeia', 'building', 'epic', 200, 4, 2, 0, 8, 25, true),
  ('Palácio', 'O edifício mais grandioso', 'building', 'legendary', 400, 8, 4, 10, 20, 50, true),
  ('Poção de XP Duplo', 'Ganha XP a dobrar durante 1 hora', 'powerup', 'common', 30, 0, 1, 0, 0, 10, true),
  ('Ímã de Moedas', 'Ganha mais moedas nas próximas 5 perguntas', 'powerup', 'rare', 60, 1, 1, 0, 0, 20, true),
  ('Escudo Temporário', 'Protege contra 1 ataque', 'powerup', 'rare', 80, 2, 1, 10, 0, 5, true),
  ('Bónus de Streak', 'Adiciona +2 ao teu streak atual', 'powerup', 'epic', 150, 3, 2, 0, 0, 30, true),
  ('Pacote Lendário', 'Bónus em tudo durante 1 dia', 'powerup', 'legendary', 300, 8, 3, 10, 5, 50, true)
ON CONFLICT DO NOTHING;

-- 2. MISSIONS
INSERT INTO missions (title, description, mission_type, target_count, reward_coins, reward_diamonds, reward_xp, subject, is_active) VALUES
  ('Quiz Diário', 'Responde a 5 perguntas do quiz', 'daily', 5, 15, 0, 30, NULL, true),
  ('Mestre de Português', 'Acerta 3 perguntas de Português', 'daily', 3, 10, 0, 25, 'portugues', true),
  ('Génio Matemático', 'Acerta 3 perguntas de Matemática', 'daily', 3, 10, 0, 25, 'matematica', true),
  ('Explorador do Meio', 'Acerta 3 perguntas de Estudo do Meio', 'daily', 3, 10, 0, 25, 'estudo_meio', true),
  ('English Star', 'Acerta 3 perguntas de Inglês', 'daily', 3, 10, 0, 25, 'ingles', true),
  ('Construtor', 'Constrói 1 edifício na tua aldeia', 'daily', 1, 20, 0, 15, NULL, true),
  ('Maratona Semanal', 'Responde a 30 perguntas esta semana', 'weekly', 30, 50, 2, 100, NULL, true),
  ('Estudante Dedicado', 'Acerta 20 perguntas esta semana', 'weekly', 20, 40, 1, 80, NULL, true),
  ('Polímata', 'Responde a perguntas de todas as disciplinas', 'weekly', 12, 60, 3, 120, NULL, true),
  ('Mestre Construtor', 'Constrói 5 edifícios esta semana', 'weekly', 5, 50, 2, 80, NULL, true),
  ('Amigo Social', 'Envia 10 mensagens no chat', 'weekly', 10, 30, 1, 50, NULL, true),
  ('Campeão Mensal', 'Responde a 100 perguntas este mês', 'monthly', 100, 200, 10, 500, NULL, true),
  ('Sábio do Mês', 'Acerta 80 perguntas este mês', 'monthly', 80, 150, 8, 400, NULL, true),
  ('Streak de Fogo', 'Mantém um streak de 7 dias', 'monthly', 7, 100, 5, 300, NULL, true),
  ('Aldeão Supremo', 'Atinge nível 3 da aldeia', 'monthly', 3, 200, 10, 500, NULL, true)
ON CONFLICT DO NOTHING;

-- 3. MONTHLY TESTS
INSERT INTO monthly_tests (title, description, school_year, subject, month, year, question_count, bonus_coins, bonus_diamonds, bonus_xp, is_active) VALUES
  ('Teste Março - Português 1º Ano', 'Teste mensal de Português para o 1º ano', '1', 'portugues', 3, 2026, 15, 80, 5, 300, true),
  ('Teste Março - Matemática 1º Ano', 'Teste mensal de Matemática para o 1º ano', '1', 'matematica', 3, 2026, 15, 80, 5, 300, true),
  ('Teste Março - Estudo Meio 1º Ano', 'Teste mensal de Estudo do Meio para o 1º ano', '1', 'estudo_meio', 3, 2026, 15, 80, 5, 300, true),
  ('Teste Março - Português 2º Ano', 'Teste mensal de Português para o 2º ano', '2', 'portugues', 3, 2026, 18, 100, 6, 350, true),
  ('Teste Março - Matemática 2º Ano', 'Teste mensal de Matemática para o 2º ano', '2', 'matematica', 3, 2026, 18, 100, 6, 350, true),
  ('Teste Março - Estudo Meio 2º Ano', 'Teste mensal de Estudo do Meio para o 2º ano', '2', 'estudo_meio', 3, 2026, 18, 100, 6, 350, true),
  ('Teste Março - Inglês 2º Ano', 'Teste mensal de Inglês para o 2º ano', '2', 'ingles', 3, 2026, 15, 100, 6, 350, true),
  ('Teste Março - Português 3º Ano', 'Teste mensal de Português para o 3º ano', '3', 'portugues', 3, 2026, 20, 120, 8, 400, true),
  ('Teste Março - Matemática 3º Ano', 'Teste mensal de Matemática para o 3º ano', '3', 'matematica', 3, 2026, 20, 120, 8, 400, true),
  ('Teste Março - Estudo Meio 3º Ano', 'Teste mensal de Estudo do Meio para o 3º ano', '3', 'estudo_meio', 3, 2026, 20, 120, 8, 400, true),
  ('Teste Março - Inglês 3º Ano', 'Teste mensal de Inglês para o 3º ano', '3', 'ingles', 3, 2026, 18, 120, 8, 400, true),
  ('Teste Março - Português 4º Ano', 'Teste mensal de Português para o 4º ano', '4', 'portugues', 3, 2026, 20, 150, 10, 500, true),
  ('Teste Março - Matemática 4º Ano', 'Teste mensal de Matemática para o 4º ano', '4', 'matematica', 3, 2026, 20, 150, 10, 500, true),
  ('Teste Março - Estudo Meio 4º Ano', 'Teste mensal de Estudo do Meio para o 4º ano', '4', 'estudo_meio', 3, 2026, 20, 150, 10, 500, true),
  ('Teste Março - Inglês 4º Ano', 'Teste mensal de Inglês para o 4º ano', '4', 'ingles', 3, 2026, 20, 150, 10, 500, true)
ON CONFLICT DO NOTHING;

-- 4. TOURNAMENTS
INSERT INTO tournaments (name, description, subject, school_year, format, status, min_participants, max_participants, registration_deadline, starts_at, ends_at, entry_fee_coins, entry_fee_diamonds, prize_pool_coins, prize_pool_diamonds, questions_per_match, time_limit_seconds, difficulty, rules) VALUES
  ('Torneio da Primavera', 'O grande torneio da Primavera! Compete contra outros alunos em Matemática!', 'matematica', NULL, 'single_elimination', 'registration', 4, 32, NOW() + interval '7 days', NOW() + interval '8 days', NOW() + interval '15 days', 10, 0, 500, 20, 10, 180, 'intermediate', 'Cada ronda tem 10 perguntas. O aluno com mais respostas certas avança.'),
  ('Copa de Português', 'Mostra o teu domínio da Língua Portuguesa!', 'portugues', NULL, 'round_robin', 'registration', 4, 16, NOW() + interval '5 days', NOW() + interval '6 days', NOW() + interval '10 days', 5, 0, 300, 10, 8, 240, 'intermediate', 'Round-robin: cada jogador enfrenta todos os outros.'),
  ('Desafio do Conhecimento', 'Torneio multi-disciplinar para os mais corajosos!', NULL, NULL, 'swiss', 'upcoming', 8, 64, NOW() + interval '14 days', NOW() + interval '15 days', NOW() + interval '22 days', 20, 1, 1000, 50, 12, 300, 'advanced', 'Sistema suíço com 5 rondas de todas as disciplinas.')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  t_id uuid;
BEGIN
  SELECT id INTO t_id FROM tournaments WHERE name = 'Torneio da Primavera' LIMIT 1;
  IF t_id IS NOT NULL THEN
    INSERT INTO tournament_prizes (tournament_id, placement, prize_coins, prize_diamonds, special_title) VALUES
      (t_id, 1, 300, 15, 'Campeão da Primavera'),
      (t_id, 2, 150, 8, 'Vice-Campeão'),
      (t_id, 3, 80, 4, 'Terceiro Lugar')
    ON CONFLICT DO NOTHING;
  END IF;
  SELECT id INTO t_id FROM tournaments WHERE name = 'Copa de Português' LIMIT 1;
  IF t_id IS NOT NULL THEN
    INSERT INTO tournament_prizes (tournament_id, placement, prize_coins, prize_diamonds, special_title) VALUES
      (t_id, 1, 200, 10, 'Mestre da Língua'),
      (t_id, 2, 100, 5, 'Escritor Brilhante'),
      (t_id, 3, 50, 3, 'Poeta Promissor')
    ON CONFLICT DO NOTHING;
  END IF;
  SELECT id INTO t_id FROM tournaments WHERE name = 'Desafio do Conhecimento' LIMIT 1;
  IF t_id IS NOT NULL THEN
    INSERT INTO tournament_prizes (tournament_id, placement, prize_coins, prize_diamonds, special_title) VALUES
      (t_id, 1, 600, 30, 'Sábio Supremo'),
      (t_id, 2, 350, 18, 'Grande Pensador'),
      (t_id, 3, 200, 10, 'Mente Brilhante')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 5. FIX SEASONAL EVENT
UPDATE seasonal_events 
SET status = 'active', 
    starts_at = NOW() - interval '2 days',
    ends_at = NOW() + interval '28 days',
    name = 'Festival da Primavera 2026',
    description = 'Celebra a Primavera com desafios especiais e recompensas exclusivas!',
    special_currency = 'Flor de Ouro',
    special_currency_icon = '🌸',
    theme_color = '#22C55E'
WHERE name = 'Volta às Aulas 2026';

DO $$
DECLARE
  ev_id uuid;
BEGIN
  SELECT id INTO ev_id FROM seasonal_events WHERE status = 'active' LIMIT 1;
  IF ev_id IS NOT NULL THEN
    INSERT INTO event_challenges (event_id, challenge_name, challenge_description, challenge_type, difficulty, target_value, reward_xp, reward_coins, reward_special_currency, challenge_order) VALUES
      (ev_id, 'Primeiro Passo', 'Responde a 5 perguntas do quiz', 'quiz_complete', 'beginner', 5, 50, 20, 2, 1),
      (ev_id, 'Estudante Dedicado', 'Acerta 10 perguntas seguidas', 'quiz_streak', 'intermediate', 10, 100, 40, 5, 2),
      (ev_id, 'Construtor da Primavera', 'Constrói 3 edifícios durante o evento', 'build_count', 'intermediate', 3, 80, 30, 3, 3),
      (ev_id, 'Maratonista', 'Responde a 50 perguntas durante o evento', 'quiz_complete', 'advanced', 50, 200, 80, 10, 4),
      (ev_id, 'Defensor da Aldeia', 'Ganha 3 batalhas', 'battle_wins', 'intermediate', 3, 100, 50, 5, 5),
      (ev_id, 'Mestre do Conhecimento', 'Acerta 100 perguntas durante o evento', 'quiz_correct', 'expert', 100, 500, 200, 25, 6)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 6. ADD MORE MINIGAMES (jsonb columns)
INSERT INTO minigames (name, display_name, description, icon, difficulty_levels, reward_coins_base, reward_diamonds_base, reward_xp_base, min_school_year, max_school_year, subjects, is_active) VALUES
  ('speed_quiz', 'Quiz Relâmpago', 'Responde ao máximo de perguntas em 60 segundos!', '⚡', '["easy","medium","hard"]'::jsonb, 15, 1, 60, 1, 4, '["matematica","portugues","estudo_meio","ingles"]'::jsonb, true),
  ('puzzle_solver', 'Quebra-Cabeças', 'Resolve puzzles lógicos e enigmas!', '🧩', '["easy","medium","hard"]'::jsonb, 12, 1, 55, 1, 4, '["matematica","estudo_meio"]'::jsonb, true),
  ('geo_challenge', 'Desafio Geográfico', 'Identifica locais e monumentos de Portugal!', '🗺️', '["easy","medium","hard"]'::jsonb, 12, 1, 55, 2, 4, '["estudo_meio"]'::jsonb, true),
  ('spell_bee', 'Soletrando', 'Soletra as palavras corretamente!', '🐝', '["easy","medium","hard"]'::jsonb, 10, 1, 50, 1, 4, '["portugues","ingles"]'::jsonb, true),
  ('math_duel', 'Duelo Matemático', 'Resolve operações mais rápido que o computador!', '🎯', '["easy","medium","hard"]'::jsonb, 15, 2, 65, 1, 4, '["matematica"]'::jsonb, true),
  ('true_false', 'Verdadeiro ou Falso', 'Decide rapidamente se as afirmações são verdadeiras!', '✅', '["easy","medium","hard"]'::jsonb, 10, 1, 45, 1, 4, '["matematica","portugues","estudo_meio","ingles"]'::jsonb, true)
ON CONFLICT DO NOTHING;
