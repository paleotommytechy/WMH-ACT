
-- 1. Create Weekly Reviews Table
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

-- 2. Create Submission Reviews Table
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

-- 3. Create Announcements Table
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

-- 4. Unified Admin Analytics View/Function
-- This function calculates the 4 requested metrics plus extra insights
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
  -- Calculate today's and yesterday's submissions for velocity
  SELECT count(*) FROM public.submissions WHERE submitted_date = today_date INTO today_subs;
  SELECT count(*) FROM public.submissions WHERE submitted_date = yesterday_date INTO yesterday_subs;
  
  IF yesterday_subs = 0 THEN
    velocity := today_subs * 100;
  ELSE
    velocity := ((today_subs - yesterday_subs)::numeric / yesterday_subs::numeric) * 100;
  END IF;

  SELECT json_build_object(
    -- 1. Active today card
    'active_students', (SELECT count(distinct user_id) FROM public.submissions WHERE submitted_date = today_date),
    
    -- 2. Average persistence card (Avg streak or consistency score)
    'avg_persistence', (SELECT coalesce(avg(current_streak), 0) FROM public.profiles WHERE community_role = 'student'),
    
    -- 3. Goal tracking (Today's submissions vs target - for now just today total)
    'daily_submissions', today_subs,
    'total_users', (SELECT count(*) FROM public.profiles WHERE community_role = 'student'),
    
    -- 4. Submission velocity
    'submission_velocity', round(velocity, 2),
    
    -- Extra: Pending reviews for the notification badge
    'pending_reviews', (
        SELECT count(*) 
        FROM public.submissions s 
        LEFT JOIN public.submission_reviews r ON s.id = r.submission_id 
        WHERE r.id IS NULL OR r.status = 'pending'
    ),
    
    -- General Health
    'avg_focus_hours', (SELECT coalesce(avg(total_focus_hours), 0) FROM public.profiles WHERE community_role = 'student')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Student List View with Auth linkage
-- This links profiles with auth.users to show emails and last sign in for admins
create or replace view admin_student_management as
select 
  p.*,
  u.email as auth_email,
  u.last_sign_in_at as last_login,
  u.created_at as account_created
from public.profiles p
join auth.users u on p.id = u.id
where p.community_role = 'student';

-- 6. Enable RLS on new tables
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 7. Policies for Weekly Reviews
DROP POLICY IF EXISTS "Users can view own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can view own weekly reviews" 
  ON public.weekly_reviews FOR SELECT 
  USING (auth.uid() = user_id OR (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can manage own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can manage own weekly reviews" 
  ON public.weekly_reviews FOR ALL 
  USING (auth.uid() = user_id OR (SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 8. Policies for Submission Reviews
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.submission_reviews;
CREATE POLICY "Admins can manage reviews" 
  ON public.submission_reviews FOR ALL 
  USING ((SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can view reviews for their submissions" ON public.submission_reviews;
CREATE POLICY "Users can view reviews for their submissions" 
  ON public.submission_reviews FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid()));

-- 9. Policies for Announcements
DROP POLICY IF EXISTS "Everyone can view announcements" ON public.announcements;
CREATE POLICY "Everyone can view announcements" 
  ON public.announcements FOR SELECT 
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" 
  ON public.announcements FOR ALL 
  USING ((SELECT community_role FROM public.profiles WHERE id = auth.uid()) = 'admin');
