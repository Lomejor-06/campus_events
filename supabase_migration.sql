-- 1. Create Tables

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'pending_lecturer', 'staff', 'admin')),
  matric_number TEXT,
  staff_id TEXT,
  phone TEXT,
  department_id INT8,
  preferred_language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  is_superadmin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  max_attendees INT8 DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  registration_count INT8 DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Saved Events (Bookmarks)
CREATE TABLE saved_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- 2. Enable Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_events ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Profile Policies
CREATE POLICY "Public profiles are viewable by everyone logged in." ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update any profile (for approvals/role changes)
CREATE POLICY "Admins can update any profile." ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to delete non-superadmin profiles
CREATE POLICY "Admins can delete non-superadmin profiles." ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND is_superadmin = false
  );

-- Category Policies
CREATE POLICY "Categories are viewable by everyone." ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories." ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Event Policies
CREATE POLICY "Events are viewable by everyone." ON events
  FOR SELECT USING (true);

CREATE POLICY "Staff and Admins can create events." ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin'))
  );

CREATE POLICY "Staff and Admins can update their own events or any as Admin." ON events
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Registration Policies
CREATE POLICY "Users can view their own registrations." ON registrations
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')));

CREATE POLICY "Users can register themselves." ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister themselves." ON registrations
  FOR DELETE USING (auth.uid() = user_id);

-- Saved Events Policies
CREATE POLICY "Users can manage their saved events." ON saved_events
  FOR ALL USING (auth.uid() = user_id);

-- 4. RPC Functions for Counter Increments

CREATE OR REPLACE FUNCTION increment_registration(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET registration_count = registration_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_registration(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET registration_count = registration_count - 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
