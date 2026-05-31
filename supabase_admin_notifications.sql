-- Trigger to ensure admins receive a notification for every new final submission
CREATE OR REPLACE FUNCTION notify_admins_on_new_submission()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    student_name TEXT;
BEGIN
    -- Only trigger if the submission is NOT a draft 
    -- and (either it was inserted as a non-draft or updated from a draft to non-draft)
    IF (TG_OP = 'INSERT' AND NEW.is_draft = FALSE) OR 
       (TG_OP = 'UPDATE' AND OLD.is_draft = TRUE AND NEW.is_draft = FALSE) THEN
        
        -- Retrieve the student name from profiles
        SELECT COALESCE(full_name, username, 'A student') INTO student_name 
        FROM public.profiles 
        WHERE id = NEW.user_id;

        -- Loop through and dispatch to all registered admins
        FOR admin_record IN 
            SELECT id FROM public.profiles 
            WHERE community_role = 'admin' OR role_title ILIKE '%admin%'
        LOOP
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                priority,
                is_read,
                action_url,
                created_at
            ) VALUES (
                admin_record.id,
                'New Submission Received',
                student_name || ' submitted a new task: "' || NEW.task_completed || '" for review.',
                'admin',
                'normal',
                FALSE,
                '/admin',
                NOW()
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger safely
DROP TRIGGER IF EXISTS trg_notify_admins_on_new_submission ON public.submissions;
CREATE TRIGGER trg_notify_admins_on_new_submission
AFTER INSERT OR UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION notify_admins_on_new_submission();
