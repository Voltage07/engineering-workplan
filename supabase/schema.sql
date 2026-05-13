-- =====================================================
-- ROAD WORKPLAN — SUPABASE DATABASE SCHEMA
-- =====================================================
-- 
-- HOW TO RUN THIS:
-- 1. Go to https://supabase.com and open your project
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Copy this entire file and paste it in
-- 5. Click "Run" (or press Ctrl+Enter / Cmd+Enter)
--
-- Run this file ONCE. It creates all your tables,
-- security rules, and starter data.
-- =====================================================


-- =====================================================
-- STEP 1: PROFILES TABLE
-- =====================================================
-- 
-- Supabase Auth handles login/signup automatically and
-- stores users in a special hidden table called "auth.users".
-- 
-- We create our own "profiles" table to store EXTRA info
-- about each user — like their role (admin or staff).
-- 
-- Whenever a new user signs up, Supabase will automatically
-- copy their ID into our profiles table (via a trigger below).

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- id is the user's unique ID. It links directly to Supabase Auth.
  -- "ON DELETE CASCADE" means: if the auth user is deleted, delete their profile too.

  full_name   TEXT,
  -- The person's display name (e.g. "Engr Faith Emeka")

  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  -- 'role' can only ever be 'admin' or 'staff'. 
  -- CHECK constraint stops any other value from being saved.
  -- DEFAULT 'staff' means new signups start as staff, not admin.

  created_at  TIMESTAMPTZ DEFAULT NOW()
  -- TIMESTAMPTZ = timestamp with timezone. Always use this over plain TIMESTAMP.
);

-- This function runs automatically when a new user signs up.
-- It creates a matching row in our profiles table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
    -- raw_user_meta_data is extra info we send at signup time (like their name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This "trigger" watches the auth.users table.
-- The moment a new user is inserted, it calls our function above.
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =====================================================
-- STEP 2: PROJECTS TABLE
-- =====================================================
-- 
-- A project is a road construction job. Each project
-- has a name, location, budget, and current status.

CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- gen_random_uuid() auto-generates a unique ID for every new row.
  -- We use UUID (looks like: "a3f2-...") instead of 1, 2, 3 for security.

  name        TEXT NOT NULL,
  location    TEXT NOT NULL,

  budget      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  -- NUMERIC(15, 2) = up to 15 digits, 2 decimal places. Good for money.
  -- e.g. 1500000.00 (₦1.5 million)

  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'ongoing', 'completed', 'paused')),
  -- Only these 4 values are allowed as status.

  start_date  DATE,
  end_date    DATE,

  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Which admin created this project? References their profile.
  -- "SET NULL" means: if the admin is deleted, project stays but created_by becomes null.

  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- STEP 3: WORKPLANS TABLE
-- =====================================================
--
-- A work plan is a specific activity scheduled for a
-- particular road, under a project.
-- Example: "Asphalt laying — Abuja-Keffi Road — 14 days"

CREATE TABLE IF NOT EXISTS public.workplans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Every work plan MUST belong to a project.
  -- If the project is deleted, all its work plans are deleted too.

  activity    TEXT NOT NULL,
  -- What is being done? e.g. "Asphalt laying", "Culvert installation"

  road        TEXT NOT NULL,
  -- Which road? e.g. "Abuja-Keffi Road"

  start_date  DATE,
  end_date    DATE,
  -- Real dates instead of just typing "2 weeks"

  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- STEP 4: TASKS TABLE
-- =====================================================
--
-- A task is a specific assignment given to a worker
-- under a work plan. The supervisor is responsible.

CREATE TABLE IF NOT EXISTS public.tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  workplan_id   UUID REFERENCES public.workplans(id) ON DELETE CASCADE,
  -- Task links to a workplan. Optional — some tasks may be project-level.

  project_id    UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  -- We also link directly to project for easy querying.

  worker_name   TEXT NOT NULL,
  -- For now we store the worker's name as text.
  -- (Future upgrade: link to profiles table when workers have accounts)

  task          TEXT NOT NULL,
  -- Description of the task. e.g. "Mix and lay asphalt on stretch 3"

  supervisor    TEXT NOT NULL,
  -- Name of the supervisor responsible.

  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  due_date      DATE,

  priority      TEXT NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- STEP 5: MESSAGES TABLE (Inbox)
-- =====================================================
--
-- Real messages between users. Replaces the fake hardcoded inbox.
-- Supabase Realtime will push new messages instantly.

CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  sender_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Both sender and recipient must be existing users.

  body          TEXT NOT NULL,
  -- The message content.

  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Has the recipient read this message?

  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================
-- STEP 6: ROW LEVEL SECURITY (RLS)
-- =====================================================
--
-- RLS is Supabase's security system. It controls WHO can
-- read, insert, update, or delete each row in a table.
--
-- Without RLS, ANY logged-in user can read ALL data.
-- With RLS, we add rules like:
--   "staff can only see their own tasks"
--   "admin can see everything"
--
-- We ENABLE RLS on every table, then write the rules (policies).

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages  ENABLE ROW LEVEL SECURITY;


-- ======= PROFILES POLICIES =======

-- Anyone logged in can view any profile (needed for showing names)
CREATE POLICY "profiles: authenticated users can view"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their OWN profile
CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);


-- ======= PROJECTS POLICIES =======

-- All logged-in users can VIEW projects
CREATE POLICY "projects: staff can view"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can CREATE projects
CREATE POLICY "projects: admin can insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can UPDATE projects
CREATE POLICY "projects: admin can update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can DELETE projects
CREATE POLICY "projects: admin can delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ======= WORKPLANS POLICIES =======

CREATE POLICY "workplans: staff can view"
  ON public.workplans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "workplans: admin can insert"
  ON public.workplans FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "workplans: admin can update"
  ON public.workplans FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "workplans: admin can delete"
  ON public.workplans FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ======= TASKS POLICIES =======

CREATE POLICY "tasks: staff can view"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks: admin can insert"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "tasks: admin can update"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "tasks: admin can delete"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );


-- ======= MESSAGES POLICIES =======

-- Users can only see messages they SENT or RECEIVED
CREATE POLICY "messages: see own"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- Any logged-in user can SEND a message
CREATE POLICY "messages: authenticated can send"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Recipients can mark messages as read
CREATE POLICY "messages: recipient can update (mark read)"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id);


-- =====================================================
-- STEP 7: PERFORMANCE INDEXES
-- =====================================================
--
-- Indexes make database queries faster.
-- Without indexes, Postgres scans EVERY row to find data.
-- With indexes, it jumps straight to the right rows.
-- Think of it like a book index vs reading every page.

CREATE INDEX IF NOT EXISTS idx_workplans_project_id ON public.workplans(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workplan_id    ON public.tasks(workplan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id     ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient   ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender      ON public.messages(sender_id);


-- =====================================================
-- DONE!
-- =====================================================
--
-- After running this, go to Table Editor in Supabase.
-- You should see 5 tables:
--   profiles, projects, workplans, tasks, messages
--
-- Next: read 02-NEXTJS-SETUP.md
