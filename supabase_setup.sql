-- 1. FIX: Auto-profile creation on signup
-- This ensures the 'users' table always has the ID, preventing the foreign key error.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new auth users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. STREAK & CONSISTENCY LOGIC
-- A view to calculate stats for every user
create or replace view user_stats as
with date_series as (
  -- Get unique submission days per user
  select distinct user_id, submitted_date
  from submissions
),
streak_groups as (
  -- Group consecutive dates together using the 'date - row_number' trick
  select 
    user_id,
    submitted_date,
    submitted_date - (row_number() over (partition by user_id order by submitted_date))::int as grp
  from date_series
),
streak_calculations as (
  -- Calculate length of each streak group
  select 
    user_id,
    count(*) as streak_length,
    min(submitted_date) as start_date,
    max(submitted_date) as end_date
  from streak_groups
  group by user_id, grp
),
current_streaks as (
  -- Find streaks that end today or yesterday
  select 
    user_id,
    streak_length as current_streak
  from streak_calculations
  where end_date >= current_date - interval '1 day'
),
consistency as (
  -- Calculate % of days active in the last 30 days
  select 
    user_id,
    (count(distinct submitted_date)::float / 30.0) * 100 as consistency_score
  from submissions
  where submitted_date > current_date - interval '30 days'
  group by user_id
)
select 
  u.id,
  u.name,
  u.email,
  coalesce(cs.current_streak, 0) as current_streak,
  coalesce((select max(streak_length) from streak_calculations sc where sc.user_id = u.id), 0) as longest_streak,
  round(coalesce(con.consistency_score, 0)::numeric, 1) as consistency_percentage,
  (select count(*) from submissions s where s.user_id = u.id) as total_submissions
from users u
left join current_streaks cs on u.id = cs.user_id
left join consistency con on u.id = con.user_id;

-- 3. STORAGE BUCKET (Optional but recommended for proof uploads)
-- insert into storage.buckets (id, name, public) values ('proofs', 'proofs', true);
