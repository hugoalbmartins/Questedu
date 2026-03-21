/*
  # Fix user_roles RLS - allow users to read their own role

  The existing SELECT policy uses is_admin() which queries user_roles recursively,
  causing infinite recursion. A user cannot read their own role to determine if they
  are an admin.

  This migration adds a non-recursive policy that allows any authenticated user to
  read their own row in user_roles, which is required for the post-login routing
  to work correctly.
*/

CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
