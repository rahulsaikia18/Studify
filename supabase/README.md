# Supabase Database Integration & Security Setup

This directory contains the production PostgreSQL schema and security policies for **Studify** on [Supabase](https://supabase.com).

---

## 1. Quick Setup (3 Minutes)

### Step 1: Create a Project on Supabase
1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose your organization, name it `studify`, and set a strong database password.

### Step 2: Run the SQL Schema & Security Policies
1. In your Supabase Project dashboard, navigate to **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Copy the entire contents of [`supabase/schema.sql`](./schema.sql) and paste it into the editor.
4. Click **Run** (or `Ctrl+Enter`).
   - This creates all 12 tables, indexes, triggers, and activates strict **Row-Level Security (RLS)** policies.

### Step 3: Copy Your Supabase Connection String
1. Go to **Project Settings** (gear icon) -> **Database**.
2. Scroll to the **Connection string** section.
3. Select **URI** (or **Transaction pooler** on port 6543):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
   Or Transaction Pooler (recommended for serverless/pooled connections):
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Step 4: Update Backend Environment
In your `backend/.env` file:
```env
# Set your Supabase PostgreSQL connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Optional Supabase API keys (from Settings -> API)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"
```

### Step 5: Generate Prisma Client & Sync
In the `backend` directory:
```bash
npm run prisma:pg:generate
npm run prisma:pg:push
```

---

## 2. Row Level Security (RLS) Architecture

Every table in `schema.sql` has Row-Level Security explicitly activated (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

| Table | Student RLS Policy | Backend Service Role |
|---|---|---|
| `users` | Can read and update own profile (`id = auth.uid()`) | Full CRUD |
| `refresh_tokens` | Isolated to backend session manager | Full CRUD |
| `cgpa_records` | Full CRUD on own records (`userId = auth.uid()`) | Full CRUD |
| `attendance_courses` | Full CRUD on own subjects (`userId = auth.uid()`) | Full CRUD |
| `attendance_logs` | Accessible only via owned courses | Full CRUD |
| `study_sessions` | Full CRUD on own sessions (`userId = auth.uid()`) | Full CRUD |
| `pomodoro_logs` | Full CRUD on own sessions (`userId = auth.uid()`) | Full CRUD |
| `notes` | Full CRUD on own notes (`userId = auth.uid()`) | Full CRUD |
| `todo_tasks` | Full CRUD on own tasks (`userId = auth.uid()`) | Full CRUD |
| `exams` | Full CRUD on own exams (`userId = auth.uid()`) | Full CRUD |
| `quiz_records` | Full CRUD on own practice tests (`userId = auth.uid()`) | Full CRUD |
| `ad_reward_logs` | Read-only for student; granted via verified server transaction | Full CRUD |

Anonymous/public access is completely blocked across all tables.
