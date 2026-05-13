-- 1. Create the robust profiles table
create table if not exists public.profiles (
  -- Core Identity
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  username text unique,
  email text unique,
  phone_number text,
  profile_image text,
  bio text,
  gender text,
  date_of_birth date,
  country text,
  state text,
  city text,
  timezone text default 'UTC',

  -- Professional / Learning
  role_title text, -- e.g. UI/UX Designer
  skill_level text check (skill_level in ('Beginner', 'Intermediate', 'Advanced')),
  primary_track text,
  secondary_track text,
  interests text[], -- Array of interests
  goals text,
  learning_focus text,
  portfolio_link text,
  github_link text,
  linkedin_link text,
  twitter_link text,
  personal_website text,

  -- Productivity & Accountability Metrics
  current_streak integer default 0,
  longest_streak integer default 0,
  total_focus_hours numeric default 0,
  total_tasks_completed integer default 0,
  total_submissions integer default 0,
  active_days integer default 0,
  weekly_consistency_score numeric default 0,
  monthly_consistency_score numeric default 0,
  productivity_rating numeric default 0,
  accountability_level text default 'Basic',
  last_submission_date date,
  last_active_at timestamptz default now(),

  -- Gamification
  xp_points integer default 0,
  current_level integer default 1,
  badges jsonb default '[]'::jsonb,
  achievements jsonb default '[]'::jsonb,
  rank_title text default 'Novice',
  reputation_score integer default 0,

  -- Weekly Review System
  current_week_status text default 'pending',
  weekly_goal text,
  weekly_focus text,
  reflection_completion_rate numeric default 0,
  proof_submission_rate numeric default 0,

  -- Public Profile / Community
  public_profile_enabled boolean default false,
  allow_leaderboard_visibility boolean default true,
  allow_public_portfolio boolean default false,
  community_role text default 'member',
  mentorship_status text default 'none',

  -- System Fields
  onboarding_completed boolean default false,
  onboarding_step integer default 1,
  preferred_theme text default 'dark',
  notification_preferences jsonb default '{"email": true, "push": true}'::jsonb,
  account_status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Indexes for performance
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_current_streak on public.profiles(current_streak);
create index if not exists idx_profiles_xp_points on public.profiles(xp_points);
create index if not exists idx_profiles_last_active_at on public.profiles(last_active_at);

-- 3. Trigger: Auto-profile creation on signup
-- This ensures every auth user has a profile record initialized.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, username)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || floor(random() * 1000)::text)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Re-attach trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. RLS POLICIES (No Recursion)
-- Simple policies using auth.uid() directly against the primary key.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (public_profile_enabled = true OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 5. Submissions Table Update (Linking to profiles)
-- Assuming submissions table exists, we ensure it links correctly.
ALTER TABLE IF EXISTS public.submissions 
  DROP CONSTRAINT IF EXISTS submissions_user_id_fkey,
  ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
CREATE POLICY "Users can view own submissions" 
  ON public.submissions FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own submissions" ON public.submissions;
CREATE POLICY "Users can insert own submissions" 
  ON public.submissions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 6. Updated user_stats view to use profiles
create or replace view user_stats as
with date_series as (
  select distinct user_id, submitted_date from submissions
),
streak_groups as (
  select 
    user_id,
    submitted_date,
    submitted_date - (row_number() over (partition by user_id order by submitted_date))::int as grp
  from date_series
),
streak_calculations as (
  select 
    user_id,
    count(*) as streak_length,
    min(submitted_date) as start_date,
    max(submitted_date) as end_date
  from streak_groups
  group by user_id, grp
),
current_streaks as (
  select 
    user_id,
    streak_length as current_streak
  from streak_calculations
  where end_date >= current_date - interval '1 day'
),
consistency as (
  select 
    user_id,
    (count(distinct submitted_date)::float / 30.0) * 100 as consistency_score
  from submissions
  where submitted_date > current_date - interval '30 days'
  group by user_id
)
select 
  p.id,
  p.full_name,
  p.email,
  p.username,
  p.xp_points,
  p.current_level,
  coalesce(cs.current_streak, 0) as current_streak,
  coalesce((select max(streak_length) from streak_calculations sc where sc.user_id = p.id), 0) as longest_streak,
  round(coalesce(con.consistency_score, 0)::numeric, 1) as consistency_percentage,
  (select count(*) from submissions s where s.user_id = p.id) as total_submissions
from profiles p
left join current_streaks cs on p.id = cs.user_id
left join consistency con on p.id = con.user_id;
