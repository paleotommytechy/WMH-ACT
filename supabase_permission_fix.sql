
-- ==============================================================================
-- MISSION CRITICAL: FIX PROFILE PERMISSIONS & RECURSION
-- ==============================================================================

-- 1. SCHEMA GRANTS
-- Ensure the authenticated role can actually see and use the public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 2. TABLE GRANTS
-- Explicitly grant permissions to the authenticated role for core tables
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- 3. FIX RECURSION (Policy Loops)
-- We need a function to check admin status that DOES NOT trigger RLS
-- Using SECURITY DEFINER bypasses RLS for the purpose of the check
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND community_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REBUILD PROFILE POLICIES
-- Drop existing ones first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users viewable by public or self" ON public.profiles;

-- Create a clean, non-recursive policy
CREATE POLICY "Profiles access policy" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id OR               -- User can see their own profile
  public_profile_enabled = true OR  -- Publicly shared profiles
  public.is_admin()                -- Admins can see everyone
);

-- 5. OTHER TABLE GRANTS (Just in case)
GRANT SELECT, INSERT, UPDATE ON public.submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_reviews TO authenticated;
GRANT SELECT ON public.submission_reviews TO authenticated;
GRANT SELECT ON public.announcements TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
