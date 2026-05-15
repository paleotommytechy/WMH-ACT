-- 1. Function to recalculate user stats excluding flagged submissions
create or replace function public.recalculate_user_metrics(target_user_id uuid)
returns void as $$
DECLARE
  final_current_streak integer := 0;
  final_longest_streak integer := 0;
  final_total_hours numeric := 0;
  final_total_tasks integer := 0;
  final_consistency numeric := 0;
  temp_streak integer := 0;
  last_date date;
  curr_date date;
BEGIN
  -- Total Tasks and Hours (unflagged)
  SELECT 
    coalesce(sum(s.time_spent), 0) / 60.0,
    count(*)
  FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.user_id = target_user_id
  AND (r.status IS NULL OR r.status != 'flagged')
  INTO final_total_hours, final_total_tasks;

  -- Streak Calculation (unflagged)
  -- Logic: Find continuous days of non-flagged submissions
  FOR curr_date IN 
    SELECT distinct submitted_date 
    FROM public.submissions s
    LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
    WHERE s.user_id = target_user_id 
    AND (r.status IS NULL OR r.status != 'flagged')
    ORDER BY submitted_date DESC
  LOOP
    IF last_date IS NULL THEN
      -- Start with the most recent date
      -- If it's today or yesterday, start the streak
      IF curr_date >= current_date - interval '1 day' THEN
        temp_streak := 1;
      ELSE
        temp_streak := 0;
      END IF;
      final_current_streak := temp_streak;
    ELSE
      IF last_date - curr_date = 1 THEN
        temp_streak := temp_streak + 1;
      ELSE
        -- Streak broken
        -- Store the longest if this was it
        IF temp_streak > final_longest_streak THEN
          final_longest_streak := temp_streak;
        END IF;
        -- Current streak was already set if it started from today/yesterday
        temp_streak := 1; 
      END IF;
    END IF;
    last_date := curr_date;
  END LOOP;

  -- Final cleanup for longest streak
  IF temp_streak > final_longest_streak THEN
    final_longest_streak := temp_streak;
  END IF;

  -- Consistency Score (Last 30 days)
  SELECT 
    (count(distinct s.submitted_date)::numeric / 30.0) * 100
  FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.user_id = target_user_id
  AND s.submitted_date > current_date - interval '30 days'
  AND (r.status IS NULL OR r.status != 'flagged')
  INTO final_consistency;

  -- Update Profile
  UPDATE public.profiles
  SET 
    current_streak = final_current_streak,
    longest_streak = final_longest_streak,
    total_focus_hours = round(final_total_hours, 2),
    total_tasks_completed = final_total_tasks,
    weekly_consistency_score = round(final_consistency, 1),
    updated_at = now()
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Triggers to auto-update metrics
create or replace function public.on_submission_change()
returns trigger as $$
begin
  PERFORM public.recalculate_user_metrics(new.user_id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new submissions
drop trigger if exists trigger_recalculate_metrics_on_sub on public.submissions;
create trigger trigger_recalculate_metrics_on_sub
after insert on public.submissions
for each row execute procedure public.on_submission_change();

-- Trigger for reviews (since flagging/unflagging changes metrics)
create or replace function public.on_review_change()
returns trigger as $$
declare
  tgt_uid uuid;
begin
  SELECT user_id INTO tgt_uid FROM public.submissions WHERE id = new.submission_id;
  IF tgt_uid IS NOT NULL THEN
    PERFORM public.recalculate_user_metrics(tgt_uid);
  END IF;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_recalculate_metrics_on_review on public.submission_reviews;
create trigger trigger_recalculate_metrics_on_review
after insert or update on public.submission_reviews
for each row execute procedure public.on_review_change();

-- 3. Run initial recalculation for everyone
DO $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalculate_user_metrics(u.id);
  END LOOP;
END $$;
