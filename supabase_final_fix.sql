
-- 1. FIX RECURSION AND PERMISSIONS FOR PROFILES
-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles visibility" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a robust admin check function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND community_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple, non-recursive policies for profiles
CREATE POLICY "Self view" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin view all" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Public profiles" ON public.profiles
  FOR SELECT USING (public_profile_enabled = true);

-- 2. ENSURE GRANTS
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.submissions TO authenticated;
GRANT SELECT ON public.submission_reviews TO authenticated;
GRANT ALL ON public.submission_reviews TO authenticated;

-- 3. FIX SUBMISSIONS RLS
DROP POLICY IF EXISTS "Admins and owners view submissions" ON public.submissions;
CREATE POLICY "Submissions access" 
ON public.submissions FOR SELECT 
USING (
  auth.uid() = user_id OR public.is_admin()
);

-- 4. FIX SUBMISSION REVIEWS RLS
DROP POLICY IF EXISTS "Admins manage reviews" ON public.submission_reviews;
CREATE POLICY "Reviews management" 
ON public.submission_reviews FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Users view own reviews" ON public.submission_reviews;
CREATE POLICY "Users view reviews" 
ON public.submission_reviews FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
);

-- 5. ENSURE VIEWS ARE ACCESSIBLE
GRANT SELECT ON public.admin_student_management TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
