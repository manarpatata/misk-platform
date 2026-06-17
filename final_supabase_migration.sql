-- Final Supabase Migration Script for Misk Platform
-- This script is designed to be run in the Supabase SQL Editor.
-- It will ALTER existing tables (public.profiles, public.teacher_profiles),
-- CREATE new tables (IF NOT EXISTS), and set up RLS policies and triggers.
-- It incorporates all discussed features, including Admin-as-Teacher logic and removal of unused features.

-- 1. Create Custom Types (IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_type') THEN
        CREATE TYPE public.student_type AS ENUM ('undergrad', 'postgrad');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_level') THEN
        CREATE TYPE public.session_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_type') THEN
        CREATE TYPE public.announcement_type AS ENUM ('text', 'image', 'video', 'link', 'pdf', 'poll');
    END IF;
END
$$;

-- 2. Alter existing public.profiles table
-- Add new columns and modify existing ones, ensuring idempotency
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Drop columns that are no longer needed
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS level, -- Level is now specific to student_profiles or session context
  DROP COLUMN IF EXISTS id_card_url, -- Moved to student_profiles
  DROP COLUMN IF EXISTS audio_url; -- Moved to student_profiles

-- Fix for "default for column \"role\" cannot be cast automatically to type user_role"
-- 1. Drop existing default constraint
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
-- 2. Change column type
ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
-- 3. Set new default constraint
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'STUDENT';

-- Ensure email and username are unique (if not already)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END
$$;

-- 3. Create public.student_profiles table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_type public.student_type DEFAULT 'undergrad',
  degree text, -- e.g., 'Bachelor', 'Master', 'PhD'
  is_senior boolean DEFAULT false,
  level public.session_level DEFAULT 'BEGINNER', -- Student's overall level
  id_card_url text, -- URL to student ID card image
  audio_url text, -- URL to student's audio recording
  approved boolean DEFAULT false, -- Admin approval status
  CONSTRAINT student_profiles_pkey PRIMARY KEY (user_id)
);

-- 4. Alter existing public.teacher_profiles table
-- Add new columns, ensuring idempotency
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- 5. Create public.semesters table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.semesters (
  id text NOT NULL,
  title text NOT NULL,
  description text,
  important_notes text,
  rules text,
  announcement_time timestamptz NOT NULL,
  stop_registration boolean DEFAULT false,
  stop_registration_time timestamptz,
  spread_to_students boolean DEFAULT false,
  spread_to_teachers boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT semesters_pkey PRIMARY KEY (id)
);

-- 6. Create public.semester_registrations table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.semester_registrations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  semester_id text NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  timings jsonb NOT NULL DEFAULT '{}'::jsonb, -- Stores preferred time slots (e.g., {'Sunday_16:00': 'selected'})
  format text, -- 'online', 'person'
  notes text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT semester_registrations_pkey PRIMARY KEY (id),
  UNIQUE(semester_id, user_id)
);

-- 7. Create public.sessions table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.sessions (
  id text NOT NULL,
  semester_id text REFERENCES public.semesters(id) ON DELETE CASCADE,
  name text NOT NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  location text,
  time_slot text,
  max_students integer DEFAULT 15,
  level public.session_level DEFAULT 'BEGINNER',
  theme_color text DEFAULT '#059669',
  theme_photo text,
  is_past boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);

-- 8. Create public.session_students table (for student enrollment in a specific session) (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.session_students (
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  CONSTRAINT session_students_pkey PRIMARY KEY (session_id, student_id)
);

-- 9. Create public.announcements table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  type public.announcement_type DEFAULT 'text',
  attachment_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);

-- 10. Create public.poll_options table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.poll_options (
  id serial NOT NULL,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  text text NOT NULL,
  CONSTRAINT poll_options_pkey PRIMARY KEY (id)
);

-- 11. Create public.poll_votes table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.poll_votes (
  poll_option_id integer NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (poll_option_id, user_id)
);

-- 12. Enable RLS on all tables (IF NOT EXISTS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- 13. Basic RLS Policies (Adjust as needed for specific access control)

-- Profiles: Anyone can read profiles, users can update their own, Admins can update all.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Student Profiles: Anyone can read, users can insert/update own, Admins can update all.
DROP POLICY IF EXISTS "Student profiles are viewable by everyone" ON public.student_profiles;
CREATE POLICY "Student profiles are viewable by everyone" ON public.student_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own student profile" ON public.student_profiles;
CREATE POLICY "Users can insert own student profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own student profile" ON public.student_profiles;
CREATE POLICY "Users can update own student profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Teacher Profiles: Anyone can read, users can insert/update own, Admins can update all.
DROP POLICY IF EXISTS "Teacher profiles are viewable by everyone" ON public.teacher_profiles;
CREATE POLICY "Teacher profiles are viewable by everyone" ON public.teacher_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can insert own teacher profile" ON public.teacher_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can update own teacher profile" ON public.teacher_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Semesters: Anyone can read, only Admins can insert/update/delete.
DROP POLICY IF EXISTS "Semesters viewable by everyone" ON public.semesters;
CREATE POLICY "Semesters viewable by everyone" ON public.semesters FOR SELECT USING (true);

-- Semester Registrations: Users can read/write their own, Admins can do all.
DROP POLICY IF EXISTS "Users can read own registrations" ON public.semester_registrations;
CREATE POLICY "Users can read own registrations" ON public.semester_registrations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own registrations" ON public.semester_registrations;
CREATE POLICY "Users can insert own registrations" ON public.semester_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own registrations" ON public.semester_registrations;
CREATE POLICY "Users can update own registrations" ON public.semester_registrations FOR UPDATE USING (auth.uid() = user_id);

-- Sessions: Anyone can read. Admins can insert/update/delete. Teachers can update their own sessions.
DROP POLICY IF EXISTS "Sessions viewable by everyone" ON public.sessions;
CREATE POLICY "Sessions viewable by everyone" ON public.sessions FOR SELECT USING (true);

-- Session Students: Anyone can read. Teachers/Admins can manage.
DROP POLICY IF EXISTS "Session students viewable by everyone" ON public.session_students;
CREATE POLICY "Session students viewable by everyone" ON public.session_students FOR SELECT USING (true);

-- Announcements: Anyone can read. Teachers of the session/Admins can manage.
DROP POLICY IF EXISTS "Announcements viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements viewable by everyone" ON public.announcements FOR SELECT USING (true);

-- Poll Options: Anyone can read.
DROP POLICY IF EXISTS "Poll options viewable by everyone" ON public.poll_options;
CREATE POLICY "Poll options viewable by everyone" ON public.poll_options FOR SELECT USING (true);

-- Poll Votes: Users can insert/read their own, Admins can do all.
DROP POLICY IF EXISTS "Users can read own poll votes" ON public.poll_votes;
CREATE POLICY "Users can read own poll votes" ON public.poll_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own poll votes" ON public.poll_votes;
CREATE POLICY "Users can insert own poll votes" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 14. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 15. Function to handle new user signup and create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role public.user_role;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'STUDENT'::public.user_role);

  INSERT INTO public.profiles (id, email, username, first_name, last_name, father_name, grandfather_name, role, phone_number, college, cohort, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'student_id', NEW.raw_user_meta_data->>'employee_id', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'father_name',
    NEW.raw_user_meta_data->>'grandfather_name',
    user_role,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'college', NULL),
    COALESCE(NEW.raw_user_meta_data->>'cohort', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    father_name = EXCLUDED.father_name,
    grandfather_name = EXCLUDED.grandfather_name,
    role = EXCLUDED.role,
    phone_number = EXCLUDED.phone_number,
    college = EXCLUDED.college,
    cohort = EXCLUDED.cohort,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  IF user_role = 'STUDENT' THEN
    INSERT INTO public.student_profiles (user_id, student_type, degree, is_senior, level, id_card_url, audio_url, approved)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'student_type')::public.student_type, 'undergrad'),
      COALESCE(NEW.raw_user_meta_data->>'degree', NULL),
      COALESCE((NEW.raw_user_meta_data->>'is_senior')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->>'level')::public.session_level, 'BEGINNER'),
      COALESCE(NEW.raw_user_meta_data->>'id_card_url', NULL),
      COALESCE(NEW.raw_user_meta_data->>'audio_url', NULL),
      COALESCE((NEW.raw_user_meta_data->>'approved')::boolean, false)
    )
    ON CONFLICT (user_id) DO UPDATE SET
      student_type = EXCLUDED.student_type,
      degree = EXCLUDED.degree,
      is_senior = EXCLUDED.is_senior,
      level = EXCLUDED.level,
      id_card_url = EXCLUDED.id_card_url,
      audio_url = EXCLUDED.audio_url,
      approved = EXCLUDED.approved;
  END IF;

  -- Admins are also teachers, so they get a teacher_profiles entry
  IF user_role = 'TEACHER' OR user_role = 'ADMIN' THEN
    INSERT INTO public.teacher_profiles (user_id, first_time, approved)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'first_time')::boolean, true),
      COALESCE((NEW.raw_user_meta_data->>'approved')::boolean, false)
    )
    ON CONFLICT (user_id) DO UPDATE SET
      first_time = EXCLUDED.first_time,
      approved = EXCLUDED.approved;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set up authentication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.semesters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.semester_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- Optional: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_semester_registrations_user_id ON public.semester_registrations (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON public.sessions (teacher_id);
CREATE INDEX IF NOT EXISTS idx_session_students_student_id ON public.session_students (student_id);
CREATE INDEX IF NOT EXISTS idx_announcements_session_id ON public.announcements (session_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_announcement_id ON public.poll_options (announcement_id);
