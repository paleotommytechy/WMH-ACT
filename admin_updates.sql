
-- Adding created_by column to profiles to track which admin created which student
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure account_status has default 'active' if not already set
ALTER TABLE public.profiles ALTER COLUMN account_status SET DEFAULT 'active';

-- Update community_role default to 'student' to match App.tsx logic
ALTER TABLE public.profiles ALTER COLUMN community_role SET DEFAULT 'student';

-- Update any existing 'member' roles to 'student' for consistency
UPDATE public.profiles SET community_role = 'student' WHERE community_role = 'member';

-- Add a column to track if a password reset is required (optional enhancement)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean DEFAULT false;

-- Helper function to check if current user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND community_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS Policies to allow admins full visibility
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (is_admin() OR auth.uid() = id OR public_profile_enabled = true);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (is_admin() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
CREATE POLICY "Admins can view all submissions" 
  ON public.submissions FOR SELECT 
  USING (is_admin() OR auth.uid() = user_id);

-- Analytics RPC Function
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM public.profiles WHERE community_role = 'student'),
    'active_students', (SELECT count(distinct id) FROM public.profiles WHERE last_active_at > now() - interval '24 hours' AND community_role = 'student'),
    'pending_reviews', (SELECT count(*) FROM public.submissions s LEFT JOIN public.submission_reviews r ON s.id = r.submission_id WHERE r.id IS NULL OR r.status = 'pending'),
    'avg_focus_hours', (SELECT coalesce(avg(total_focus_hours), 0) FROM public.profiles WHERE community_role = 'student')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
