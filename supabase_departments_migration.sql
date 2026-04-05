-- =============================================
-- LASUSTECH Campus Events — Departments & Event Filtering Migration
-- Run this AFTER supabase_migration.sql and supabase_admin_migration.sql
-- =============================================

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  college TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments are viewable by everyone." ON departments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage departments." ON departments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Insert all LASUSTECH departments
INSERT INTO departments (id, name, code, college) VALUES
  -- College of Engineering and Technology
  (1, 'Agricultural and Biosystems Engineering', 'ABE', 'College of Engineering and Technology'),
  (2, 'Chemical Engineering', 'CHE', 'College of Engineering and Technology'),
  (3, 'Civil and Construction Engineering', 'CVE', 'College of Engineering and Technology'),
  (4, 'Computer Engineering', 'CPE', 'College of Engineering and Technology'),
  (5, 'Electrical/Electronics Engineering', 'EEE', 'College of Engineering and Technology'),
  (6, 'Mechanical Engineering', 'MEE', 'College of Engineering and Technology'),
  (7, 'Mechatronics Engineering', 'MCE', 'College of Engineering and Technology'),
  (8, 'Biotechnology and Food Technology', 'BFT', 'College of Engineering and Technology'),

  -- College of Basic Sciences
  (9, 'Botany', 'BOT', 'College of Basic Sciences'),
  (10, 'Chemistry / Industrial Chemistry', 'CHM', 'College of Basic Sciences'),
  (11, 'Computer Science', 'CSC', 'College of Basic Sciences'),
  (12, 'Mathematics / Industrial Mathematics', 'MTH', 'College of Basic Sciences'),
  (13, 'Microbiology', 'MCB', 'College of Basic Sciences'),
  (14, 'Physics with Electronics', 'PHY', 'College of Basic Sciences'),
  (15, 'Statistics', 'STA', 'College of Basic Sciences'),
  (16, 'Zoology', 'ZOO', 'College of Basic Sciences'),

  -- College of Applied Social Sciences
  (17, 'Accounting', 'ACC', 'College of Applied Social Sciences'),
  (18, 'Actuarial Science', 'ACS', 'College of Applied Social Sciences'),
  (19, 'Banking and Finance', 'BFN', 'College of Applied Social Sciences'),
  (20, 'Business Administration', 'BUS', 'College of Applied Social Sciences'),
  (21, 'Economics', 'ECO', 'College of Applied Social Sciences'),
  (22, 'Insurance', 'INS', 'College of Applied Social Sciences'),
  (23, 'Marketing', 'MKT', 'College of Applied Social Sciences'),
  (24, 'Mass Communication', 'MAC', 'College of Applied Social Sciences'),
  (25, 'Office and Information Technology', 'OIT', 'College of Applied Social Sciences'),
  (26, 'Tourism and Hospitality Management', 'THM', 'College of Applied Social Sciences'),

  -- College of Environmental Design and Technology
  (27, 'Architecture', 'ARC', 'College of Environmental Design and Technology'),
  (28, 'Art and Industrial Design', 'AID', 'College of Environmental Design and Technology'),
  (29, 'Building Technology', 'BLD', 'College of Environmental Design and Technology'),
  (30, 'Estate Management and Valuation', 'EMV', 'College of Environmental Design and Technology'),
  (31, 'Quantity Surveying', 'QSV', 'College of Environmental Design and Technology'),
  (32, 'Urban and Regional Planning', 'URP', 'College of Environmental Design and Technology'),

  -- College of Agriculture
  (33, 'Agricultural Economics and Farm Management', 'AEM', 'College of Agriculture'),
  (34, 'Agricultural Extension and Rural Development', 'AER', 'College of Agriculture'),
  (35, 'Animal Breeding and Genetics', 'ABG', 'College of Agriculture'),
  (36, 'Animal Production', 'ANP', 'College of Agriculture'),
  (37, 'Aquaculture and Fisheries Management', 'AFM', 'College of Agriculture'),
  (38, 'Crop Production', 'CRP', 'College of Agriculture'),
  (39, 'Horticulture and Landscape Management', 'HLM', 'College of Agriculture')
ON CONFLICT (code) DO NOTHING;

-- 4. Add department_id to events table (for department-based filtering)
ALTER TABLE events ADD COLUMN IF NOT EXISTS department_id INT8 REFERENCES departments(id) ON DELETE SET NULL;

-- 5. Add RLS policy to allow staff/admins to DELETE events they created (or any as admin)
-- First drop if it already exists to make this idempotent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Staff can delete own events, admins can delete any.' AND tablename = 'events'
  ) THEN
    EXECUTE 'CREATE POLICY "Staff can delete own events, admins can delete any." ON events
      FOR DELETE USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;
END $$;

-- 6. Reset the departments sequence to avoid conflicts with future inserts
SELECT setval('departments_id_seq', 39, true);

-- 7. Reload PostgREST schema cache so the API recognizes the new column immediately
NOTIFY pgrst, 'reload schema';
