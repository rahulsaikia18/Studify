-- ==============================================================================
-- STUDENT BUDDY — SUPABASE PRODUCTION DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================
-- Engine: PostgreSQL 15+ (Supabase Native)
-- Security: Strict Row-Level Security (RLS) on all tables
-- Architecture: Multi-tenant student isolation with foreign key cascades
-- Compatibility: Fully compatible with Prisma ORM and Supabase Client SDK
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. AUTOMATIC TIMESTAMP UPDATE FUNCTION
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "educationLevel" TEXT,
    "institution" TEXT,
    "courseName" TEXT,
    "semester" TEXT,
    "academicGoals" TEXT,
    "theme" TEXT DEFAULT 'system',
    "notificationPrefs" TEXT DEFAULT '{"studyReminders":true,"examAlerts":true,"taskReminders":true,"pomodoroSound":true}',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- Table: refresh_tokens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "tokenHash" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "revokedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- Table: cgpa_records (Module A: CGPA / GPA Calculator)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cgpa_records (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "scaleType" TEXT DEFAULT '10_POINT' NOT NULL,
    "scaleConfig" TEXT NOT NULL,
    "semesters" TEXT NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "totalCredits" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_cgpa_updated_at
BEFORE UPDATE ON public.cgpa_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- Table: attendance_courses (Module B: Attendance Calculator)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_courses (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "courseName" TEXT NOT NULL,
    "courseCode" TEXT,
    "totalClasses" INTEGER DEFAULT 0 NOT NULL,
    "attendedClasses" INTEGER DEFAULT 0 NOT NULL,
    "targetPercentage" DOUBLE PRECISION DEFAULT 75.0 NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_attendance_courses_updated_at
BEFORE UPDATE ON public.attendance_courses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- Table: attendance_logs (Individual lecture attendance logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "courseId" TEXT NOT NULL REFERENCES public.attendance_courses("id") ON DELETE CASCADE,
    "date" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "status" TEXT NOT NULL, -- ATTENDED, MISSED, CANCELLED
    "note" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- Table: study_sessions (Module C: Daily Study Planner)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "plannedMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER DEFAULT 0 NOT NULL,
    "priority" TEXT DEFAULT 'MEDIUM' NOT NULL,
    "completed" BOOLEAN DEFAULT FALSE NOT NULL,
    "scheduledDate" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_study_sessions_updated_at
BEFORE UPDATE ON public.study_sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- Table: pomodoro_logs (Module D: Pomodoro Timer)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pomodoro_logs (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "sessionType" TEXT NOT NULL, -- FOCUS, SHORT_BREAK, LONG_BREAK
    "durationMinutes" INTEGER NOT NULL,
    "completed" BOOLEAN DEFAULT TRUE NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL,
    "endedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- Table: notes (Module E: Notes & Organization)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "tags" TEXT,
    "isPinned" BOOLEAN DEFAULT FALSE NOT NULL,
    "isArchived" BOOLEAN DEFAULT FALSE NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- Table: todo_tasks (Module F: Student To-Do List)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.todo_tasks (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMPTZ,
    "priority" TEXT DEFAULT 'MEDIUM' NOT NULL,
    "category" TEXT DEFAULT 'General' NOT NULL,
    "isCompleted" BOOLEAN DEFAULT FALSE NOT NULL,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_todo_tasks_updated_at
BEFORE UPDATE ON public.todo_tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- Table: exams (Module G: Exam Countdown & Syllabus Tracker)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "examDate" TIMESTAMPTZ NOT NULL,
    "subjects" TEXT NOT NULL,
    "syllabusProgress" DOUBLE PRECISION DEFAULT 0 NOT NULL,
    "priority" TEXT DEFAULT 'HIGH' NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- Table: quiz_records (Module I: Quiz Generator)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_records (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "questionsData" TEXT NOT NULL,
    "timeTakenSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- Table: ad_reward_logs (Compliant AdMob Monetization Server-Side Verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ad_reward_logs (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public.users("id") ON DELETE CASCADE,
    "rewardType" TEXT NOT NULL,
    "adNetwork" TEXT DEFAULT 'Google AdMob' NOT NULL,
    "transactionId" TEXT UNIQUE NOT NULL,
    "grantedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users("email");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_userId ON public.refresh_tokens("userId");
CREATE INDEX IF NOT EXISTS idx_cgpa_userId ON public.cgpa_records("userId");
CREATE INDEX IF NOT EXISTS idx_attendance_courses_userId ON public.attendance_courses("userId");
CREATE INDEX IF NOT EXISTS idx_attendance_logs_courseId ON public.attendance_logs("courseId");
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions("userId", "scheduledDate");
CREATE INDEX IF NOT EXISTS idx_pomodoro_logs_user_date ON public.pomodoro_logs("userId", "startedAt");
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned ON public.notes("userId", "isPinned");
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_completed ON public.todo_tasks("userId", "isCompleted");
CREATE INDEX IF NOT EXISTS idx_exams_user_date ON public.exams("userId", "examDate");
CREATE INDEX IF NOT EXISTS idx_quiz_records_userId ON public.quiz_records("userId");
CREATE INDEX IF NOT EXISTS idx_ad_reward_logs_userId ON public.ad_reward_logs("userId");

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Every table has RLS explicitly enabled.
-- Rule 1: Service role (backend application) has full CRUD access to all tables.
-- Rule 2: Authenticated Supabase users can strictly only access and modify their own data.
-- Rule 3: Anonymous public users are blocked from reading or tampering with student data.
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgpa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_reward_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Helper Function for RLS: Match Current Authenticated User
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claim.sub', true),
        (auth.uid())::text
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Policies: users
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to users"
    ON public.users FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING ("id" = public.requesting_user_id());

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING ("id" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: refresh_tokens
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role manages refresh tokens"
    ON public.refresh_tokens FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

-- ------------------------------------------------------------------------------
-- Policies: cgpa_records
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to cgpa_records"
    ON public.cgpa_records FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own CGPA calculations"
    ON public.cgpa_records FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own CGPA calculations"
    ON public.cgpa_records FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "Students can update own CGPA calculations"
    ON public.cgpa_records FOR UPDATE
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can delete own CGPA calculations"
    ON public.cgpa_records FOR DELETE
    USING ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: attendance_courses
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to attendance_courses"
    ON public.attendance_courses FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own attendance courses"
    ON public.attendance_courses FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own attendance courses"
    ON public.attendance_courses FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "Students can update own attendance courses"
    ON public.attendance_courses FOR UPDATE
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can delete own attendance courses"
    ON public.attendance_courses FOR DELETE
    USING ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: attendance_logs
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to attendance_logs"
    ON public.attendance_logs FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own attendance logs"
    ON public.attendance_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.attendance_courses
            WHERE public.attendance_courses."id" = public.attendance_logs."courseId"
            AND public.attendance_courses."userId" = public.requesting_user_id()
        )
    );

CREATE POLICY "Students can insert own attendance logs"
    ON public.attendance_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance_courses
            WHERE public.attendance_courses."id" = public.attendance_logs."courseId"
            AND public.attendance_courses."userId" = public.requesting_user_id()
        )
    );

CREATE POLICY "Students can delete own attendance logs"
    ON public.attendance_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.attendance_courses
            WHERE public.attendance_courses."id" = public.attendance_logs."courseId"
            AND public.attendance_courses."userId" = public.requesting_user_id()
        )
    );

-- ------------------------------------------------------------------------------
-- Policies: study_sessions
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to study_sessions"
    ON public.study_sessions FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own study sessions"
    ON public.study_sessions FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own study sessions"
    ON public.study_sessions FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "Students can update own study sessions"
    ON public.study_sessions FOR UPDATE
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can delete own study sessions"
    ON public.study_sessions FOR DELETE
    USING ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: pomodoro_logs
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to pomodoro_logs"
    ON public.pomodoro_logs FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own pomodoro logs"
    ON public.pomodoro_logs FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own pomodoro logs"
    ON public.pomodoro_logs FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: notes
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to notes"
    ON public.notes FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own notes"
    ON public.notes FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own notes"
    ON public.notes FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "Students can update own notes"
    ON public.notes FOR UPDATE
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can delete own notes"
    ON public.notes FOR DELETE
    USING ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: todo_tasks
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to todo_tasks"
    ON public.todo_tasks FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own tasks"
    ON public.todo_tasks FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own tasks"
    ON public.todo_tasks FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "Students can update own tasks"
    ON public.todo_tasks FOR UPDATE
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can delete own tasks"
    ON public.todo_tasks FOR DELETE
    USING ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: exams
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to exams"
    ON public.exams FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own exams"
    ON public.exams FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own exams"
    ON public.exams FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "Students can update own exams"
    ON public.exams FOR UPDATE
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can delete own exams"
    ON public.exams FOR DELETE
    USING ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: quiz_records
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to quiz_records"
    ON public.quiz_records FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own quiz records"
    ON public.quiz_records FOR SELECT
    USING ("userId" = public.requesting_user_id());

CREATE POLICY "Students can insert own quiz records"
    ON public.quiz_records FOR INSERT
    WITH CHECK ("userId" = public.requesting_user_id());

-- ------------------------------------------------------------------------------
-- Policies: ad_reward_logs
-- ------------------------------------------------------------------------------
CREATE POLICY "Service role has full access to ad_reward_logs"
    ON public.ad_reward_logs FOR ALL
    USING (auth.role() = 'service_role' OR current_user = 'postgres');

CREATE POLICY "Students can view own reward logs"
    ON public.ad_reward_logs FOR SELECT
    USING ("userId" = public.requesting_user_id());
