
-- 1. FIX SUBMISSIONS RLS
-- Ensure admins can view all submissions for review
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
CREATE POLICY "Submissions visibility policy" ON public.submissions FOR SELECT
USING (
  auth.uid() = user_id OR 
  (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. AUTOMATIC REVIEW CREATION
-- Automatically create a 'pending' review entry whenever a submission is made
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

-- 3. TEST DATA GENERATION SCRIPT
-- This script finds the first student and creates a submission for them.
-- Run this in your Supabase SQL Editor to test the Review Hub.

/*
DO $$ 
DECLARE 
    target_user_id uuid;
BEGIN
    -- Find a student to create a submission for
    SELECT id INTO target_user_id FROM public.profiles WHERE community_role = 'student' LIMIT 1;
    
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.submissions (user_id, task_completed, time_spent, reflection, submitted_date)
        VALUES (
            target_user_id, 
            'Advanced React Performance Optimization', 
            120, 
            'I mastered useMemo and useCallback today. Felt like a massive breakthrough in thinking about rendering cycles.',
            current_date
        );
        RAISE NOTICE 'Test submission created for user %', target_user_id;
    ELSE
        RAISE NOTICE 'No student found to create a test submission for.';
    END IF;
END $$;
*/
