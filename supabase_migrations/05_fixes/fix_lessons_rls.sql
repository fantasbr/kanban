-- Temporary fix for RLS on erp_lessons
-- This removes the restrictive RLS policies and adds a permissive one for testing

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view lessons" ON erp_lessons;
DROP POLICY IF EXISTS "Users can manage lessons" ON erp_lessons;

-- Create permissive policy for authenticated users
CREATE POLICY "Authenticated users can view lessons"
  ON erp_lessons FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage lessons"
  ON erp_lessons FOR ALL
  USING (auth.role() = 'authenticated');
