# 🎓 Student Buddy — Production-Ready Android Mobile Application

**Student Buddy** is a comprehensive, production-ready, Android-first academic productivity application built for school, college, and university students, as well as competitive examination aspirants. 

It unifies daily study management, credit-weighted GPA calculations, attendance target tracking, focus intervals, encrypted notes, prioritized to-dos, examination countdowns, client-side PDF document manipulation, AI-powered quiz practice, and compliant Google AdMob monetization.

---

## 🏗️ System Architecture & Tech Stack

```
student-buddy/
├── backend/                       # Node.js + Express.js + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL production database schema
│   │   └── schema.sqlite.prisma   # SQLite local development schema (zero-dependency)
│   ├── src/
│   │   ├── config/                # Database connection & environment variables
│   │   ├── controllers/           # Modular controllers (Auth, CGPA, Attendance, Study, Quiz, PDF, AdMob)
│   │   ├── middleware/            # JWT authentication, Zod validation, Rate limiters
│   │   ├── routes/                # REST API route endpoints
│   │   ├── services/              # Token rotation, AI Quiz generator, PDF in-memory processing
│   │   ├── app.ts                 # Express application configuration & security headers
│   │   └── server.ts              # Server bootstrap
│   └── test/
│       └── api.test.ts            # Automated integration test suite (15/15 tests passing)
│
└── mobile/                        # React Native + Expo (SDK 52) + TypeScript
    ├── app/                       # Expo Router file-based navigation
    │   ├── (auth)/                # Login, Register, Multi-step Student Onboarding
    │   ├── (tabs)/                # Home Dashboard, Planner, Tools Hub, Notes & Tasks, Profile
    │   ├── tools/                 # Dedicated screens for all 8 Academic Modules
    │   └── settings/privacy.tsx   # Privacy Policy & AdMob Disclosures
    ├── components/                # Reusable UI widgets (AdBanner, RewardedAdModal, CircularProgress, etc.)
    ├── constants/                 # Palette, AdMob Unit IDs & Policies, API config
    ├── services/                  # Centralized AdManager, ApiClient, Notifications, Haptics, Storage
    └── stores/                    # Zustand state management stores
```

### Technology Highlights

- **Mobile Frontend**: React Native, Expo, Expo Router v4, TypeScript, Zustand, TanStack Query, React Native SVG, Expo Haptics, Expo Notifications, Expo DocumentPicker, pdf-lib.
- **Backend Architecture**: Node.js, Express.js, TypeScript, REST API, JWT access tokens with Refresh Token Rotation, Zod schema validation, Helmet, CORS, and Express-Rate-Limit.
- **Database**: PostgreSQL & **Supabase** (Production) with Prisma ORM and Row-Level Security (RLS) policies; SQLite schema included for immediate offline development.
- **Supabase Integration**: Native `supabase/schema.sql` with full table DDL, automatic timestamp triggers, and student multi-tenant RLS policies.
- **AdMob Monetization**: Centralized `AdManager.ts` service with frequency capping, cooldown windows, test unit IDs, non-intrusive adaptive banners, natural-milestone interstitials, and user-initiated verified rewarded ads.

---

## 🚀 Core Modules & Capabilities

### Module A: CGPA / GPA Calculator
- **Semester-wise SGPA**: Enter subjects, credits, and grade points for instant weighted calculations.
- **Cumulative CGPA**: Track multiple semesters with credit weighting and percentage conversions.
- **Configurable Grading Systems**: Customize the university conversion multiplier (e.g. `9.5` for CBSE/VTU or `10.0`) and grade scales.
- **Persistent History**: Save, label, and retrieve calculation history.

### Module B: Attendance & Bunk Calculator
- **Instant Formula**: `Attendance % = (Attended / Total) × 100`.
- **Target Tracking**: Set thresholds (75%, 80%, 85%).
- **Safe Bunk Calculator**: Calculates the exact number of consecutive classes a student can safely skip:  
  $$\text{Safe Bunks} = \left\lfloor \frac{100 \times \text{Attended} - \text{Target} \times \text{Total}}{\text{Target}} \right\rfloor$$
- **Shortage Recovery**: Calculates consecutive classes required to restore eligibility:  
  $$\text{Classes Needed} = \left\lceil \frac{\text{Target} \times \text{Total} - 100 \times \text{Attended}}{100 - \text{Target}} \right\rceil$$
- **Course Manager**: Track individual subjects with 1-tap "Attended (+1)" and "Missed (+1)" logging.

### Module C: Study Planner
- Daily and weekly schedules with planned vs. actual study minutes.
- Priority tagging (`HIGH`, `MEDIUM`, `LOW`), calendar view, and session completion tracking.

### Module D: Pomodoro Focus Timer
- 25-minute focus intervals, 5-minute short breaks, 15-minute long breaks.
- **Background Accuracy**: Tracks exact target end timestamps to ensure zero time drift when the app is backgrounded.
- Haptic feedback and native completion alerts.
- Daily focus session history and statistics.

### Module E: Notes Manager
- Local-first architecture with background cloud synchronization.
- Subject-based categorization, full-text search, pinned notes, and tag filtering.

### Module F: To-Do Manager
- Daily priority checklists, deadline tracking, categories (`Assignment`, `Exam Prep`, `Project`, `Reading`), and completion statuses.

### Module G: Exam Countdown
- Multi-examination tracker with days-remaining countdown badges.
- Interactive syllabus completion progress stepper (+10% / -10%).
- Scheduled reminder alerts prior to test dates.

### Module H: PDF Tools & Optimizer
- **Merge PDFs**: Combine lecture slides, assignments, and notes into a single document.
- **Compress PDFs**: Optimize object streams to reduce file size for submissions.
- **Split & Extract**: Select and export specific page ranges.
- **Privacy Guarantee**: All processing occurs strictly in-memory or on-device; **zero student documents are retained on servers**.

### Module I: Quiz Generator & Practice
- Multi-subject practice engine (Computer Science, Mathematics, Physics, Chemistry, Biology, History, General).
- Configurable difficulties (`EASY`, `MEDIUM`, `HARD`) and question counts (5, 10, 15, 20).
- Detailed answer explanations for every multiple-choice option.
- Interstitial ad presentation exclusively after viewing quiz results (natural milestone).

---

## 💰 Google AdMob Monetization Architecture

The monetization system strictly follows **Google AdMob Policies** and **Google Play Families Policies**:

1. **Centralized `AdManager.ts`**:
   - Manages loading, caching, presentation, cooldowns, and error recovery.
   - Automatically utilizes official Google AdMob Test Ad Unit IDs during development.
   - Production ad units are loaded via configuration or environment variables.

2. **Adaptive Banners**:
   - Placed in dedicated non-intrusive container slots at the bottom of views.
   - Guaranteed **never to overlap navigation bars, buttons, or form inputs**.

3. **Interstitial Ads**:
   - Shown **only at natural user milestones** (e.g., after completing a quiz).
   - Strictly forbidden during active study, timer countdowns, calculations, or typing.
   - Frequency capping: Maximum 3 per hour with a 120-second cooldown window.

4. **Rewarded Ads**:
   - 100% user-initiated and optional. Essential core features remain completely accessible without watching ads.
   - `RewardedAdModal.tsx` explicitly explains the reward beforehand.
   - Server-side verification endpoint (`/api/admob/verify-reward`) validates and records transaction tokens before granting perks.

---

## ⚡ Quickstart Guide

### 1. Start the Backend API

```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Generate Prisma Client and sync local database
npm run prisma:generate
npm run prisma:push

# Seed with realistic student demo data
npm run seed

# Run automated integration tests (15/15 tests)
npm test

# Start development server
npm run dev
```

The API will be live at `http://localhost:5000/api` (Health check: `http://localhost:5000/api/health`).

### 2. Connect to Supabase PostgreSQL (Optional / Production)

To connect Student Buddy to your free Supabase cloud database:
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in the Supabase dashboard and run [`supabase/schema.sql`](./supabase/schema.sql) (creates tables, indexes, and Row-Level Security policies).
3. Copy your database connection string from **Project Settings -> Database** and set it in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```
4. Sync Prisma with your Supabase database:
   ```bash
   cd backend
   npm run prisma:pg:generate
   npm run prisma:pg:push
   ```
See [`supabase/README.md`](./supabase/README.md) for full security documentation.

### 3. Launch the Mobile Application

```bash
cd mobile

# Install dependencies (if not already installed)
npm install

# Start Expo development server
npm start

# Run on Android emulator / device
npm run android

# Run on Web browser
npm run web
```

### 3. Demo Student Credentials

For instant testing and evaluation:
- **Email**: `student@buddy.edu`
- **Password**: `Password123!`
- Or tap the **"1-Tap Demo Student Login"** button on the Login screen!

---

## 📋 Compliance & Privacy

- **Data Portability**: Users can export their complete study history as a JSON file at any time (`Profile -> Export All Student Data`).
- **Account Deletion**: Complete, irreversible account deletion cascades through all database records.
- **Privacy Disclosures**: Accessible anytime in `Profile -> Privacy Policy & AdMob Disclosures`.
