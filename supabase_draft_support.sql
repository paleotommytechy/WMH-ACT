-- Add is_draft column to submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;

-- Update recalculate_user_metrics to ignore drafts
CREATE OR REPLACE FUNCTION public.recalculate_user_metrics(target_user_id uuid)
RETURNS void AS $$
DECLARE
  final_current_streak integer := 0;
  final_longest_streak integer := 0;
  final_total_hours numeric := 0;
  final_total_tasks integer := 0;
  final_consistency numeric := 0;
  temp_streak integer := 0;
  is_current_streak_active boolean := true;
  last_date date;
  curr_date date;
BEGIN
  -- Total Tasks and Hours (unflagged only and NOT drafts)
  SELECT 
    coalesce(sum(s.time_spent), 0) / 60.0,
    count(*)
  FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.user_id = target_user_id
  AND (r.status IS NULL OR r.status != 'flagged')
  AND s.is_draft = false
  INTO final_total_hours, final_total_tasks;

  -- Day Streak Calculation (Strict logic, ignoring drafts)
  FOR curr_date IN 
    SELECT distinct submitted_date 
    FROM public.submissions s
    LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
    WHERE s.user_id = target_user_id 
    AND (r.status IS NULL OR r.status != 'flagged')
    AND s.is_draft = false
    ORDER BY submitted_date DESC
  LOOP
    IF last_date IS NULL THEN
      temp_streak := 1;
      -- Gap check: If first submission isn't today or yesterday, streak is dead
      IF curr_date < current_date - interval '1 day' THEN
        is_current_streak_active := false;
        final_current_streak := 0;
      END IF;
    ELSE
      -- Continuous day check
      IF last_date - curr_date = 1 THEN
        temp_streak := temp_streak + 1;
      ELSE
        -- Gap detected in history
        IF is_current_streak_active THEN
          final_current_streak := temp_streak;
          is_current_streak_active := false;
        END IF;
        
        IF temp_streak > final_longest_streak THEN
          final_longest_streak := temp_streak;
        END IF;
        temp_streak := 1;
      END IF;
    END IF;
    last_date := curr_date;
  END LOOP;

  -- Final Streak Resolution
  IF is_current_streak_active THEN
    final_current_streak := temp_streak;
  END IF;
  
  IF temp_streak > final_longest_streak THEN
    final_longest_streak := temp_streak;
  END IF;

  -- Catch case for no submissions
  IF last_date IS NULL THEN
    final_current_streak := 0;
  END IF;

  -- Consistency Score (Last 30 days, distinct days submitted, excluding drafts)
  SELECT 
    round((count(distinct s.submitted_date)::numeric / 30.0) * 100, 1)
  FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.user_id = target_user_id
  AND s.submitted_date > current_date - interval '30 days'
  AND (r.status IS NULL OR r.status != 'flagged')
  AND s.is_draft = false
  INTO final_consistency;

  -- Update User Profile with fresh verified data
  UPDATE public.profiles
  SET 
    current_streak = final_current_streak,
    longest_streak = final_longest_streak,
    total_focus_hours = round(final_total_hours, 2),
    total_tasks_completed = final_total_tasks,
    weekly_consistency_score = final_consistency,
    updated_at = now()
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_platform_analytics to ignore drafts
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS json AS $$
DECLARE
  result json;
  today_date date := current_date;
  yesterday_date date := current_date - interval '1 day';
  today_subs integer;
  yesterday_subs integer;
  velocity numeric;
BEGIN
  -- Valid submissions (unflagged and not drafts) for today and yesterday
  SELECT count(*) FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.submitted_date = today_date 
  AND (r.status IS NULL OR r.status != 'flagged')
  AND s.is_draft = false
  INTO today_subs;

  SELECT count(*) FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.submitted_date = yesterday_date 
  AND (r.status IS NULL OR r.status != 'flagged')
  AND s.is_draft = false
  INTO yesterday_subs;
  
  IF yesterday_subs = 0 THEN
    velocity := today_subs * 100;
  ELSE
    velocity := ((today_subs - yesterday_subs)::numeric / yesterday_subs::numeric) * 100;
  END IF;

  SELECT json_build_object(
    'active_students', (
      SELECT count(distinct s.user_id) FROM public.submissions s
      LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
      WHERE s.submitted_date = today_date 
      AND (r.status IS NULL OR r.status != 'flagged')
      AND s.is_draft = false
    ),
    'avg_persistence', (SELECT coalesce(avg(current_streak), 0) FROM public.profiles WHERE community_role = 'student'),
    'daily_submissions', today_subs,
    'total_users', (SELECT count(*) FROM public.profiles WHERE community_role = 'student'),
    'submission_velocity', round(velocity, 2),
    'pending_reviews', (
        SELECT count(*) FROM public.submissions s 
        LEFT JOIN public.submission_reviews r ON s.id = r.submission_id 
        WHERE (r.id IS NULL OR r.status = 'pending')
        AND s.is_draft = false
    ),
    'total_valid_tasks', (
      SELECT count(*) FROM public.submissions s
      LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
      WHERE (r.status IS NULL OR r.status != 'flagged')
      AND s.is_draft = false
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create review records for non-drafts
CREATE OR REPLACE FUNCTION public.handle_new_submission_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_draft = false THEN
    INSERT INTO public.submission_reviews (submission_id, status)
    VALUES (NEW.id, 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle draft becoming submission
CREATE OR REPLACE FUNCTION public.handle_submission_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If changed from draft to not draft
  IF OLD.is_draft = true AND NEW.is_draft = false THEN
    INSERT INTO public.submission_reviews (submission_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT (submission_id) DO NOTHING;
    
    -- Recalculate metrics
    PERFORM public.recalculate_user_metrics(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_status_change ON public.submissions;
CREATE TRIGGER trigger_handle_status_change
AFTER UPDATE ON public.submissions
FOR EACH ROW EXECUTE PROCEDURE public.handle_submission_status_change();
