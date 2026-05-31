
-- 1. Ensure the foreign key exists and is named correctly for PostgREST
ALTER TABLE public.submissions 
  DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;

ALTER TABLE public.submissions 
  ADD CONSTRAINT submissions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 2. Ensure relationship between submission_reviews and submissions
ALTER TABLE public.submission_reviews
  DROP CONSTRAINT IF EXISTS submission_reviews_submission_id_fkey;

ALTER TABLE public.submission_reviews
  ADD CONSTRAINT submission_reviews_submission_id_fkey
  FOREIGN KEY (submission_id)
  REFERENCES public.submissions(id)
  ON DELETE CASCADE;

-- 3. Fix RLS for Submissions so Admin can see everything
-- Re-defining the policy to be super clear
DROP POLICY IF EXISTS "Submissions visibility policy" ON public.submissions;
CREATE POLICY "Admins and owners view submissions" 
ON public.submissions FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Fix RLS for Submission Reviews
DROP POLICY IF EXISTS "Admins manage reviews" ON public.submission_reviews;
CREATE POLICY "Admins manage reviews" 
ON public.submission_reviews FOR ALL 
USING (
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users view own reviews" ON public.submission_reviews;
CREATE POLICY "Users view own reviews" 
ON public.submission_reviews FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
);

-- 5. Ensure Profiles are visible to Admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  public_profile_enabled = true OR 
  auth.uid() = id
);

-- 6. Trigger to create pending review automatically if missing
CREATE OR REPLACE FUNCTION public.ensure_pending_review() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.submission_reviews (submission_id, status)
  VALUES (NEW.id, 'pending')
  ON CONFLICT (submission_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_ensure_pending_review ON public.submissions;
CREATE TRIGGER trigger_ensure_pending_review
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE PROCEDURE public.ensure_pending_review();

-- 7. Grant access to views
GRANT SELECT ON public.admin_student_management TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.submissions TO authenticated;
GRANT SELECT ON public.submission_reviews TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
