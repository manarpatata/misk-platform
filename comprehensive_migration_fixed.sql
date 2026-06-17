-- Comprehensive Supabase Migration Script
-- Purpose: Safely update existing tables and add triggers to save all registration info according to roles.
-- This aligns with the request to retain 'level' and 'cohort' in public.profiles,
-- and also save the university ID card and audio attachment to the profiles table.

-- 1. Create Enums (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
    END IF;
END
$$;

-- 2. Alter existing profiles table correctly based on the user's current schema
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_card_url text,
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure unique constraints
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

-- 3. Alter teacher_profiles table
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_time boolean,
  approved boolean DEFAULT false,
  CONSTRAINT teacher_profiles_pkey PRIMARY KEY (user_id)
);

ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- 4. Automatically sync Supabase Auth (Sign-Ups) to Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role public.user_role;
  extracted_username text;
  extracted_phone text;
  extracted_college text;
  extracted_cohort text;
  extracted_level text;
BEGIN
  -- Determine Role
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'STUDENT'::public.user_role);
  
  -- Extract username (which serves as the ID number for Login logic)
  extracted_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    NEW.raw_user_meta_data->>'student_id', 
    NEW.raw_user_meta_data->>'employee_id', 
    split_part(NEW.email, '@', 1)
  );

  extracted_phone := NEW.raw_user_meta_data->>'phone';
  extracted_college := COALESCE(NEW.raw_user_meta_data->>'college', 'OTHER');
  extracted_cohort := COALESCE(NEW.raw_user_meta_data->>'cohort', '2023');
  extracted_level := COALESCE(NEW.raw_user_meta_data->>'level', 'غير مصنف');

  -- Upsert Profile
  INSERT INTO public.profiles (
    id, email, username, first_name, last_name, father_name, grandfather_name, 
    role, phone_number, college, cohort, level, avatar_url, id_card_url, audio_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    extracted_username,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'father_name',
    NEW.raw_user_meta_data->>'grandfather_name',
    user_role::text,
    COALESCE(extracted_phone, ''),
    extracted_college,
    extracted_cohort,
    extracted_level,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'id_card_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'audio_url', NULL)
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
    level = EXCLUDED.level,
    avatar_url = EXCLUDED.avatar_url,
    id_card_url = EXCLUDED.id_card_url,
    audio_url = EXCLUDED.audio_url,
    updated_at = now();

  -- Specialized routing for Teachers
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

-- 5. Attach the Trigger to Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Setup Row-Level Security for ID Lookup Login Mechanism
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 7. Triggers for updated_at tracking
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
