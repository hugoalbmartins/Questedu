/*
  # Add insert policies for schools and user_roles
  
  1. Changes
    - Add policy to allow authenticated users to insert schools (for admin setup)
    - Add policy to allow users to insert their own user_roles during signup
    
  2. Security
    - These are temporary policies to allow initial setup
    - Schools can be inserted by authenticated users
    - User roles can be self-assigned during registration
*/

-- Add insert policy for schools
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'schools' AND policyname = 'Authenticated users can insert schools') THEN
    CREATE POLICY "Authenticated users can insert schools" 
    ON public.schools 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
  END IF;
END $$;

-- Add insert policy for user_roles during self-registration
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can insert their own roles') THEN
    CREATE POLICY "Users can insert their own roles" 
    ON public.user_roles 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
