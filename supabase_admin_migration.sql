-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Migration: Add admin system features
-- ============================================

-- 1. Add is_superadmin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false;

-- 2. Update role constraint to include pending_lecturer
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'pending_lecturer', 'staff', 'admin'));

-- 3. Add staff_id column if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_id TEXT;

-- 4. Allow admins to update any profile (for approvals/role changes)
-- Drop existing policy if it exists to avoid conflict
DROP POLICY IF EXISTS "Admins can update any profile." ON profiles;
CREATE POLICY "Admins can update any profile." ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Allow admins to delete non-superadmin profiles
DROP POLICY IF EXISTS "Admins can delete non-superadmin profiles." ON profiles;
CREATE POLICY "Admins can delete non-superadmin profiles." ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND is_superadmin = false
  );

-- Done!
