/*
  # Student Profiles and Avatar System

  1. New Tables
    - `student_profiles` - Extended profile information
    - `avatar_items` - Available avatar customization items
    - `student_avatar_inventory` - Items owned by students
    - `title_templates` - Available titles (renamed to avoid conflict)
    
  2. Features
    - Customizable avatars
    - Profile statistics
    - Unlockable avatar items
    - Title system
    - Bio and motto
    - Profile themes
*/

-- Avatar Item Categories
DO $$ BEGIN
  CREATE TYPE avatar_category AS ENUM (
    'hair',
    'face',
    'clothing',
    'accessory',
    'background',
    'pet'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Student Profiles Extended
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  bio text,
  motto text,
  favorite_subject text,
  profile_theme text DEFAULT 'default',
  avatar_config jsonb DEFAULT '{
    "hair": "hair_default",
    "face": "face_happy",
    "clothing": "clothes_casual",
    "accessory": null,
    "background": "bg_classroom",
    "pet": null
  }'::jsonb,
  showcase_badges uuid[] DEFAULT ARRAY[]::uuid[],
  active_title text,
  is_profile_public boolean DEFAULT false,
  total_playtime_minutes integer DEFAULT 0,
  favorite_minigame text,
  best_subject text,
  profile_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own profile"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_profiles.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_profiles.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_profiles.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view public profiles"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (is_profile_public = true);

CREATE POLICY "Parents can view children's profiles"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_profiles.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Avatar Items Shop
CREATE TABLE IF NOT EXISTS avatar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category avatar_category NOT NULL,
  item_key text UNIQUE NOT NULL,
  icon text,
  rarity text DEFAULT 'common',
  price_coins integer DEFAULT 0,
  price_diamonds integer DEFAULT 0,
  required_level integer DEFAULT 1,
  is_premium boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE avatar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available avatar items"
  ON avatar_items FOR SELECT
  TO authenticated
  USING (is_available = true);

-- Student Avatar Inventory
CREATE TABLE IF NOT EXISTS student_avatar_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES avatar_items(id) ON DELETE CASCADE,
  acquired_at timestamptz DEFAULT now(),
  acquired_method text DEFAULT 'purchase',
  UNIQUE(student_id, item_id)
);

ALTER TABLE student_avatar_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own inventory"
  ON student_avatar_inventory FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_avatar_inventory.student_id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children's inventory"
  ON student_avatar_inventory FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_avatar_inventory.student_id
      AND students.parent_id = auth.uid()
    )
  );

-- Insert default avatar items
INSERT INTO avatar_items (name, description, category, item_key, icon, rarity, price_coins, price_diamonds) VALUES
('Cabelo Padrão', 'Estilo clássico', 'hair', 'hair_default', '💇', 'common', 0, 0),
('Cabelo Espetado', 'Para os corajosos!', 'hair', 'hair_spiky', '💇‍♂️', 'uncommon', 100, 0),
('Cabelo Comprido', 'Elegante e bonito', 'hair', 'hair_long', '👱‍♀️', 'uncommon', 100, 0),
('Cabelo Colorido', 'Arco-íris de estilo!', 'hair', 'hair_rainbow', '🌈', 'rare', 0, 5),
('Cara Feliz', 'Sempre a sorrir!', 'face', 'face_happy', '😊', 'common', 0, 0),
('Cara Concentrada', 'Foco total', 'face', 'face_focused', '😤', 'common', 50, 0),
('Cara Cool', 'Calma e estilo', 'face', 'face_cool', '😎', 'uncommon', 150, 0),
('Roupa Casual', 'Confortável', 'clothing', 'clothes_casual', '👕', 'common', 0, 0),
('Roupa Desportiva', 'Para os ativos', 'clothing', 'clothes_sport', '🏃', 'uncommon', 200, 0),
('Roupa Elegante', 'Com estilo', 'clothing', 'clothes_formal', '🎩', 'rare', 300, 0),
('Super-Herói', 'Salva o dia!', 'clothing', 'clothes_hero', '🦸', 'epic', 0, 10),
('Óculos', 'Visão perfeita', 'accessory', 'acc_glasses', '👓', 'common', 80, 0),
('Chapéu Giro', 'Protege do sol', 'accessory', 'acc_hat', '🎩', 'uncommon', 120, 0),
('Coroa', 'Para verdadeiros reis', 'accessory', 'acc_crown', '👑', 'legendary', 0, 20),
('Sala de Aula', 'Aprender é fixe', 'background', 'bg_classroom', '🏫', 'common', 0, 0),
('Biblioteca', 'Entre livros', 'background', 'bg_library', '📚', 'uncommon', 150, 0),
('Espaço', 'Às estrelas!', 'background', 'bg_space', '🚀', 'epic', 0, 15),
('Gato', 'Miau!', 'pet', 'pet_cat', '🐱', 'uncommon', 250, 0),
('Cão', 'Au au!', 'pet', 'pet_dog', '🐶', 'uncommon', 250, 0),
('Dragão', 'Lendário!', 'pet', 'pet_dragon', '🐉', 'legendary', 0, 25)
ON CONFLICT (item_key) DO NOTHING;

-- Function to purchase avatar item
CREATE OR REPLACE FUNCTION purchase_avatar_item(
  student_id_param uuid,
  item_id_param uuid
)
RETURNS jsonb AS $$
DECLARE
  item_record RECORD;
  student_record RECORD;
BEGIN
  SELECT * INTO item_record
  FROM avatar_items
  WHERE id = item_id_param
  AND is_available = true;

  IF item_record IS NULL THEN
    RAISE EXCEPTION 'Item not available';
  END IF;

  SELECT * INTO student_record
  FROM students
  WHERE id = student_id_param;

  IF student_record IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM student_avatar_inventory
    WHERE student_id = student_id_param
    AND item_id = item_id_param
  ) THEN
    RAISE EXCEPTION 'Item already owned';
  END IF;

  IF item_record.price_coins > student_record.coins THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  IF item_record.price_diamonds > student_record.diamonds THEN
    RAISE EXCEPTION 'Insufficient diamonds';
  END IF;

  UPDATE students
  SET
    coins = coins - item_record.price_coins,
    diamonds = diamonds - item_record.price_diamonds
  WHERE id = student_id_param;

  INSERT INTO student_avatar_inventory (
    student_id,
    item_id,
    acquired_method
  ) VALUES (
    student_id_param,
    item_id_param,
    'purchase'
  );

  RETURN jsonb_build_object(
    'success', true,
    'item', item_record.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update avatar configuration
CREATE OR REPLACE FUNCTION update_avatar_config(
  student_id_param uuid,
  avatar_config_param jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO student_profiles (student_id, avatar_config)
  VALUES (student_id_param, avatar_config_param)
  ON CONFLICT (student_id)
  DO UPDATE SET
    avatar_config = avatar_config_param,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_student
  ON student_profiles(student_id);

CREATE INDEX IF NOT EXISTS idx_student_profiles_public
  ON student_profiles(is_profile_public);

CREATE INDEX IF NOT EXISTS idx_avatar_inventory_student
  ON student_avatar_inventory(student_id);

CREATE INDEX IF NOT EXISTS idx_avatar_items_category
  ON avatar_items(category, is_available);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION purchase_avatar_item TO authenticated;
GRANT EXECUTE ON FUNCTION update_avatar_config TO authenticated;