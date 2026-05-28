-- SQL updates for Custom Weekly Goals
-- Run this in the Supabase Dashboard SQL Editor to update your tables

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_hour_goal integer DEFAULT 10;

-- Recreate the views to pick up the new column from profiles
CREATE OR REPLACE VIEW public.profiles_view AS
SELECT * FROM public.profiles;

CREATE OR REPLACE VIEW public.admin_student_management AS
SELECT 
    p.*,
    u.email as auth_email,
    u.last_sign_in_at as last_login,
    u.created_at as account_created
FROM 
    public.profiles p
JOIN 
    auth.users u ON p.id = u.id
WHERE 
    p.community_role = 'student';
