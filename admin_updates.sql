
-- Adding created_by column to profiles to track which admin created which student
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure account_status has default 'active' if not already set
ALTER TABLE public.profiles ALTER COLUMN account_status SET DEFAULT 'active';

-- Update community_role default to 'student' to match App.tsx logic
ALTER TABLE public.profiles ALTER COLUMN community_role SET DEFAULT 'student';

-- Add a column to track if a password reset is required (optional enhancement)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_reset boolean DEFAULT false;
