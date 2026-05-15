-- Refined Analytics to ignore flagged submissions
create or replace function public.get_platform_analytics()
returns json as $$
DECLARE
  result json;
  today_date date := current_date;
  yesterday_date date := current_date - interval '1 day';
  today_subs integer;
  yesterday_subs integer;
  velocity numeric;
BEGIN
  -- We now only count submissions that are NOT flagged
  -- A submission is considered valid if it hasn't been reviewed yet OR its review status is not 'flagged'
  
  SELECT count(*) FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.submitted_date = today_date 
  AND (r.status IS NULL OR r.status != 'flagged')
  INTO today_subs;

  SELECT count(*) FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.submitted_date = yesterday_date 
  AND (r.status IS NULL OR r.status != 'flagged')
  INTO yesterday_subs;
  
  IF yesterday_subs = 0 THEN
    velocity := today_subs * 100;
  ELSE
    velocity := ((today_subs - yesterday_subs)::numeric / yesterday_subs::numeric) * 100;
  END IF;

  SELECT json_build_object(
    -- 1. Active today card (unflagged submissions)
    'active_students', (
      SELECT count(distinct s.user_id) 
      FROM public.submissions s
      LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
      WHERE s.submitted_date = today_date
      AND (r.status IS NULL OR r.status != 'flagged')
    ),
    
    -- 2. Average persistence card (Avg streak from profiles)
    -- Profiles streak calculation should ideally also account for flags, but for now we use the profile field
    'avg_persistence', (SELECT coalesce(avg(current_streak), 0) FROM public.profiles WHERE community_role = 'student'),
    
    -- 3. Goal tracking
    'daily_submissions', today_subs,
    'total_users', (SELECT count(*) FROM public.profiles WHERE community_role = 'student'),
    
    -- 4. Submission velocity
    'submission_velocity', round(velocity, 2),
    
    -- Pending reviews for the notification badge
    'pending_reviews', (
        SELECT count(*) 
        FROM public.submissions s 
        LEFT JOIN public.submission_reviews r ON s.id = r.submission_id 
        WHERE r.id IS NULL OR r.status = 'pending'
    ),
    
    -- General Health (Total unflagged tasks ever)
    'total_valid_tasks', (
      SELECT count(*) 
      FROM public.submissions s
      LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
      WHERE r.status IS NULL OR r.status != 'flagged'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
