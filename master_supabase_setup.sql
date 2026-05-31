-- ==============================================================================
-- MASTERY HUB: COMPLETE BACKEND UPDATE (Review Hub, Analytics & Metric Sync)
-- ==============================================================================

-- 1. TABLES & STRUCTURE
-- ------------------------------------------------------------------------------

-- Weekly Reviews Table
create table if not exists public.weekly_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start_date date not null,
  week_end_date date not null,
  total_hours numeric default 0,
  tasks_completed_count integer default 0,
  active_days_count integer default 0,
  streak_maintained integer default 0,
  learned_text text,
  challenge_text text,
  win_text text,
  focus_next_week_text text,
  status text check (status in ('Excellent', 'Consistent', 'Improving', 'At Risk')),
  created_at timestamptz default now(),
  unique(user_id, week_start_date)
);

-- Submission Reviews Table (The core of Review Hub)
create table if not exists public.submission_reviews (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  admin_id uuid references public.profiles(id) on delete set null,
  status text check (status in ('reviewed', 'excellent', 'flagged', 'pending')) default 'reviewed',
  admin_notes text,
  low_effort_detected boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(submission_id)
);

-- Announcements Table
create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  target_role text default 'all',
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- 2. VIEWS (Liking Auth and Profiles)
-- ------------------------------------------------------------------------------

-- Admin Student Management View
-- Links profiles with auth.users to show emails and last login
create or replace view admin_student_management as
select 
  p.*,
  u.email as auth_email,
  u.last_sign_in_at as last_login,
  u.created_at as account_created
from public.profiles p
join auth.users u on p.id = u.id
where p.community_role = 'student';

-- 3. FUNCTIONS (Analytics & Automatic Metrics)
-- ------------------------------------------------------------------------------

-- Recalculate Metrics Function
-- Manages streak logic (day streak), task count, and consistency rates
create or replace function public.recalculate_user_metrics(target_user_id uuid)
returns void as $$
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
  -- Total Tasks and Hours (unflagged only)
  SELECT 
    coalesce(sum(s.time_spent), 0) / 60.0,
    count(*)
  FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.user_id = target_user_id
  AND (r.status IS NULL OR r.status != 'flagged')
  INTO final_total_hours, final_total_tasks;

  -- Day Streak Calculation (Strict logic)
  FOR curr_date IN 
    SELECT distinct submitted_date 
    FROM public.submissions s
    LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
    WHERE s.user_id = target_user_id 
    AND (r.status IS NULL OR r.status != 'flagged')
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

  -- Consistency Score (Last 30 days, distinct days submitted)
  SELECT 
    round((count(distinct s.submitted_date)::numeric / 30.0) * 100, 1)
  FROM public.submissions s
  LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
  WHERE s.user_id = target_user_id
  AND s.submitted_date > current_date - interval '30 days'
  AND (r.status IS NULL OR r.status != 'flagged')
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

-- Platform Analytics Function
-- Powers the Admin Dashboard stats
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
  -- Valid submissions (unflagged) for today and yesterday
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
    'active_students', (
      SELECT count(distinct s.user_id) FROM public.submissions s
      LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
      WHERE s.submitted_date = today_date AND (r.status IS NULL OR r.status != 'flagged')
    ),
    'avg_persistence', (SELECT coalesce(avg(current_streak), 0) FROM public.profiles WHERE community_role = 'student'),
    'daily_submissions', today_subs,
    'total_users', (SELECT count(*) FROM public.profiles WHERE community_role = 'student'),
    'submission_velocity', round(velocity, 2),
    'pending_reviews', (
        SELECT count(*) FROM public.submissions s 
        LEFT JOIN public.submission_reviews r ON s.id = r.submission_id 
        WHERE r.id IS NULL OR r.status = 'pending'
    ),
    'total_valid_tasks', (
      SELECT count(*) FROM public.submissions s
      LEFT JOIN public.submission_reviews r ON s.id = r.submission_id
      WHERE r.status IS NULL OR r.status != 'flagged'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. AUTOMATION (Triggers)
-- ------------------------------------------------------------------------------

-- Sync Trigger on Submission Change
create or replace function public.on_submission_change() returns trigger as $$
begin PERFORM public.recalculate_user_metrics(new.user_id); return new; end;
$$ language plpgsql security definer;

drop trigger if exists trigger_recalculate_metrics_on_sub on public.submissions;
create trigger trigger_recalculate_metrics_on_sub after insert on public.submissions
for each row execute procedure public.on_submission_change();

-- Sync Trigger on Review Change (Flagging/Unflagging)
create or replace function public.on_review_change() returns trigger as $$
declare tgt_uid uuid;
begin
  SELECT user_id INTO tgt_uid FROM public.submissions WHERE id = new.submission_id;
  IF tgt_uid IS NOT NULL THEN PERFORM public.recalculate_user_metrics(tgt_uid); END IF;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_recalculate_metrics_on_review on public.submission_reviews;
create trigger trigger_recalculate_metrics_on_review after insert or update on public.submission_reviews
for each row execute procedure public.on_review_change();

-- 5. ACCESS CONTROL (RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Weekly Review Policies
CREATE POLICY "View own weekly reviews" ON public.weekly_reviews FOR SELECT USING (auth.uid() = user_id OR (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Manage own weekly reviews" ON public.weekly_reviews FOR ALL USING (auth.uid() = user_id OR (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Submission Review Policies (Admins only for write)
CREATE POLICY "Admins manage reviews" ON public.submission_reviews FOR ALL USING ((SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users view own reviews" ON public.submission_reviews FOR SELECT USING (EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid()));

-- Announcement Policies
CREATE POLICY "View current announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL USING ((SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 6. FINAL INITIALIZATION
-- Run recalculation for all existing users to fix streaks immediately
DO $$ DECLARE u record; BEGIN FOR u IN SELECT id FROM public.profiles LOOP PERFORM public.recalculate_user_metrics(u.id); END LOOP; END $$;
