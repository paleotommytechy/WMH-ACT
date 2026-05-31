
-- Create a view for profiles that bypasses RLS if needed, or just provides a clean interface
-- This helps avoid recursion in RLS policies
CREATE OR REPLACE VIEW public.profiles_view AS
SELECT * FROM public.profiles;

-- Ensure the view is accessible to authenticated users
GRANT SELECT ON public.profiles_view TO authenticated;
GRANT SELECT ON public.profiles_view TO service_role;

-- Update the admin student management view if needed
CREATE OR REPLACE VIEW public.admin_student_management AS
SELECT 
    p.*,
    u.email as auth_email,
    u.last_sign_in_at
FROM 
    public.profiles p
LEFT JOIN 
    auth.users u ON p.id = u.id;

GRANT SELECT ON public.admin_student_management TO authenticated;
