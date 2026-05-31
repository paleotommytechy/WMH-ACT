
-- 1. Ensure admin_id is nullable in submission_reviews (fixes the not-null constraint error)
ALTER TABLE public.submission_reviews ALTER COLUMN admin_id DROP NOT NULL;

-- 2. Update status column to have 'pending' as default instead of 'reviewed'
ALTER TABLE public.submission_reviews ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Create a Trigger Function to automatically link every new submission to a review record
CREATE OR REPLACE FUNCTION public.handle_new_submission_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a blank review for the new submission
  INSERT INTO public.submission_reviews (submission_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the trigger to the submissions table
DROP TRIGGER IF EXISTS trigger_auto_review_link ON public.submissions;
CREATE TRIGGER trigger_auto_review_link
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_submission_review();

-- 5. Backfill: Create review records for any submissions that don't have one yet
INSERT INTO public.submission_reviews (submission_id, status)
SELECT id, 'pending'
FROM public.submissions s
WHERE NOT EXISTS (
  SELECT 1 FROM public.submission_reviews r WHERE r.submission_id = s.id
)
ON CONFLICT (submission_id) DO NOTHING;

-- 6. Add some indexes for faster joins (Performance optimization)
CREATE INDEX IF NOT EXISTS idx_submission_reviews_submission_id ON public.submission_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_reviews_status ON public.submission_reviews(status);
