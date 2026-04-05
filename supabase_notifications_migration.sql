-- Supabase Notifications Migration
-- Create the Notifications Table and the Trigger for new Events

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can view and manage their own notifications
CREATE POLICY "Users can manage their own notifications." ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- 4. Create Notification Function for Triggers
CREATE OR REPLACE FUNCTION notify_students_on_new_event()
RETURNS TRIGGER AS $$
DECLARE
    creator_dept_id INT;
    lecturer_name TEXT;
BEGIN
    -- Get lecturer info (only if they are staff or admin, though standard 'role' could be sufficient)
    SELECT department_id, full_name INTO creator_dept_id, lecturer_name
    FROM profiles WHERE id = NEW.created_by;

    -- If the creator has a department, notify students in the same department
    IF creator_dept_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, event_id)
        SELECT 
            id, 
            'New Department Event',
            lecturer_name || ' just posted a new event: ' || NEW.title,
            NEW.id
        FROM profiles 
        WHERE role = 'student' AND department_id = creator_dept_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Trigger for New Events
DROP TRIGGER IF EXISTS on_new_event_notify_students ON events;
CREATE TRIGGER on_new_event_notify_students
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION notify_students_on_new_event();

-- Notify Supabase cache to reload schema
NOTIFY pgrst, 'reload schema';
