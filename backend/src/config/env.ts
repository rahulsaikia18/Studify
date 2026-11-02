import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_IPV4_POOLER_URL =
  'postgresql://postgres.zaurjcjenwwyswmdavfw:GTB87E9pQB1Qx4F5@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
const resolvedDatabaseUrl =
  !rawUrl || rawUrl.includes('.supabase.co:5432')
    ? SUPABASE_IPV4_POOLER_URL
    : rawUrl;

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: resolvedDatabaseUrl,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'student_buddy_super_secure_access_secret_2026_xyz123',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'student_buddy_super_secure_refresh_secret_2026_abc456',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  ADMOB_SSV_KEY: process.env.ADMOB_SSV_KEY || 'student_buddy_admob_reward_secret_key',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};
