# 🚀 Deploying Studify Backend to Vercel (Serverless)

This backend is architected to run seamlessly on **Vercel Serverless Functions** with **Supabase PostgreSQL**.

---

## 1. Quick Deploy in 4 Steps

### Step 1: Push Code to GitHub
Ensure your repository is pushed to your GitHub account:
```bash
git push origin main
```

### Step 2: Import into Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Select your `app` repository and click **Import**.
3. In **Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: Click *Edit* and select **`backend`** (or leave as `./` if using root)
   - **Build Command**: `npm run vercel-build` (automatically detected from `vercel.json`)
   - **Output Directory**: Leave empty

### Step 3: Add Environment Variables in Vercel Dashboard
Under **Settings ➔ Environment Variables**, add the following:

| Variable Name | Example / Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PW]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase Transaction Pooler (port 6543) |
| `DIRECT_URL` | `postgresql://postgres:[PW]@db.[REF].supabase.co:5432/postgres` | Supabase Direct Connection (port 5432) |
| `JWT_ACCESS_SECRET` | `your_super_secret_jwt_access_key` | Access token signature |
| `JWT_REFRESH_SECRET` | `your_super_secret_jwt_refresh_key` | Refresh token signature |
| `NODE_ENV` | `production` | Production environment |
| `SUPABASE_URL` | `https://[REF].supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `your-anon-key` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Supabase admin key |
| `ADMOB_APP_ID` | `ca-app-pub-2168264599014117~2201830267` | AdMob App ID |
| `ADMOB_PROD_BANNER_ID` | `ca-app-pub-2168264599014117/8986730461` | AdMob Banner Unit |
| `ADMOB_PROD_INTERSTITIAL_ID` | `ca-app-pub-2168264599014117/4522365131` | AdMob Interstitial Unit |

### Step 4: Click Deploy
Vercel will:
1. Run `prisma generate --schema=prisma/schema.prisma`
2. Compile TypeScript into `dist`
3. Deploy serverless routes through `backend/api/index.ts`
4. Provide your live production URL (e.g., `https://studify-backend.vercel.app`)

---

## 2. Serverless Optimizations Implemented

1. **Singleton Database Client (`src/config/db.ts`):**
   - Automatically reuses Prisma client instances across warm serverless container invocations via `globalThis`.
   - Prevents Supabase connection pool exhaustion (`too many connections`).
   - Graceful lazy connection that never crashes worker boot.

2. **Serverless Routing (`vercel.json` & `api/index.ts`):**
   - All incoming API requests (`/api/auth`, `/api/cgpa`, `/api/health`, etc.) route directly into the Express application via Vercel edge rewrites.
   - Root ping route (`/`) provides instant inspection and status reporting.

3. **Reverse Proxy Trust:**
   - `app.set('trust proxy', 1)` correctly parses client IP addresses from Vercel edge reverse proxies for compliant rate limiting.

4. **"Anytime Live" & Zero Cold Starts:**
   - `backend/vercel.json` includes an automated Vercel Cron schedule:
     ```json
     "crons": [
       {
         "path": "/api/health",
         "schedule": "*/10 * * * *"
       }
     ]
     ```
   - Automatically pings the health endpoint every 10 minutes to keep your serverless container active and eliminate cold start latency.
   - You can also point [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) to `https://your-vercel-domain.vercel.app/api/health`.

5. **In-Memory PDF Handling:**
   - PDF merging, compression, and splitting operate 100% in-memory via buffers (`multer.memoryStorage()`), perfectly complying with Vercel's read-only serverless filesystem.

---

## 3. Connecting Mobile App to Vercel

Once deployed on Vercel, simply update `mobile/.env`:
```env
EXPO_PUBLIC_API_URL="https://studify-backend.vercel.app/api"
```
And your mobile app will communicate directly with your live Vercel backend!
