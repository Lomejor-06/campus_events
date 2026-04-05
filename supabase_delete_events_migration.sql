-- Adds DELETE policy to the events table so that event creators and admins can delete events.

-- Event Delete Policy
CREATE POLICY "Staff and Admins can delete their own events or any as Admin." ON events
  FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
