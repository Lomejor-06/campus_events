-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Migration: Auto-notify admins when a new lecturer registers
-- ============================================

-- This trigger fires when a new profile with role 'pending_lecturer' is inserted.
-- It creates a notification for every admin user.

CREATE OR REPLACE FUNCTION notify_admins_on_pending_lecturer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire for pending_lecturer registrations
    IF NEW.role = 'pending_lecturer' THEN
        INSERT INTO notifications (user_id, title, message, event_id)
        SELECT 
            id,
            'New Lecturer Pending Approval',
            NEW.full_name || ' (' || NEW.email || ') has registered as a lecturer and is awaiting your approval.',
            NULL
        FROM profiles
        WHERE role = 'admin';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_pending_lecturer_notify_admins ON profiles;
CREATE TRIGGER on_pending_lecturer_notify_admins
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_admins_on_pending_lecturer();

-- Allow admins to insert notifications for any user (for the frontend notification method)
DROP POLICY IF EXISTS "Admins can create notifications for any user." ON notifications;
CREATE POLICY "Admins can create notifications for any user." ON notifications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Notify Supabase cache to reload schema
NOTIFY pgrst, 'reload schema';
