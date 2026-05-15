
-- 1. HARDEN PROFILES RLS
-- Allow admins to see ALL profiles (needed for showing names in reviews)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles visibility policy" ON public.profiles FOR SELECT
USING (
  public_profile_enabled = true OR 
  auth.uid() = id OR
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. HARDEN SUBMISSIONS RLS
-- Allow admins to see ALL submissions
DROP POLICY IF EXISTS "Submissions visibility policy" ON public.submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
CREATE POLICY "Submissions visibility policy" ON public.submissions FOR SELECT
USING (
  auth.uid() = user_id OR 
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. SUBMISSION REVIEWS TABLE & RLS
CREATE TABLE IF NOT EXISTS public.submission_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE UNIQUE,
  admin_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'excellent', 'flagged')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full control on reviews" ON public.submission_reviews;
CREATE POLICY "Admin full control on reviews" ON public.submission_reviews 
FOR ALL TO authenticated
USING (
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Students see own reviews" ON public.submission_reviews;
CREATE POLICY "Students see own reviews" ON public.submission_reviews
FOR SELECT TO authenticated
USING (
  submission_id IN (SELECT id FROM public.submissions WHERE user_id = auth.uid())
);

-- 4. AUTOMATIC PENDING REVIEW TRIGGER
CREATE OR REPLACE FUNCTION public.create_pending_review() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.submission_reviews (submission_id, status)
  VALUES (NEW.id, 'pending')
  ON CONFLICT (submission_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_pending_review ON public.submissions;
CREATE TRIGGER trigger_create_pending_review
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE PROCEDURE public.create_pending_review();

-- 5. ENSURE CURRENT USER IS ADMIN (Set role for the user requesting)
UPDATE public.profiles 
SET community_role = 'admin' 
WHERE email = 'olusegunifetomiwa2000@gmail.com';

-- 6. TEST DATA GENERATION (Create a student and a submission)
DO $$ 
DECLARE 
    test_student_id uuid;
BEGIN
    -- 1. Create a dummy student profile if none exists
    INSERT INTO public.profiles (id, email, full_name, username, community_role, onboarding_completed)
    VALUES (
        '00000000-0000-0000-0000-000000000001', 
        'test_student@mastery.com', 
        'Test Student Alpha', 
        'student_alpha', 
        'student',
        true
    )
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    test_student_id := '00000000-0000-0000-0000-000000000001';

    -- 2. Create a submission for this student
    INSERT INTO public.submissions (user_id, task_completed, time_spent, reflection, submitted_date)
    VALUES (
        test_student_id, 
        'Mastering Supabase RLS and Admin Dashboarding', 
        150, 
        'I finally understood how to link reviews with submissions and handle RLS triggers. The dashboard now pulls live data correctly.',
        current_date
    );

    -- Note: The trigger will automatically create a 'pending' review for this submission.
    -- To test the 'Admin Automatic Assignment', as an admin, edit this review in the UI.
END $$;
