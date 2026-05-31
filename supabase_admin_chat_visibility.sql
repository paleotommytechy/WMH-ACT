-- ==============================================================================
-- MISSION CRITICAL: SQL to ensure all users with 'admin' roles are displayed/visible in chat
-- ==============================================================================

-- 1. Drop existing selector policies on public.profiles to avoid conflicts/redundancies
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Self view" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view admins" ON public.profiles;

-- 2. Create the unified clear profile access policy
-- This allows:
-- - Anyone to view their own profile
-- - Anyone to view any profile that has public sharing enabled
-- - Anyone to view any admin profile (so students can see available admins in Chat/Mentorship sections)
-- - Admins to view all profiles for student tracking and moderation
CREATE POLICY "Profiles access policy" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id OR                                                           -- A user can see their own profile
  public_profile_enabled = true OR                                             -- Publicly enabled/shared profiles
  community_role = 'admin' OR                                                  -- Anyone can view accounts with 'admin' community_role 
  role_title ILIKE '%admin%' OR                                                -- Anyone can view accounts with 'admin' role_title
  (SELECT p.community_role FROM public.profiles p WHERE p.id = auth.uid()) = 'admin' -- Administrators can see all student profiles
);

-- 3. Notify PostgREST to reload the schema and pick up updated configurations
NOTIFY pgrst, 'reload schema';
