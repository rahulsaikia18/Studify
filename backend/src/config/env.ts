import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    'postgresql://postgres:GTB87E9pQB1Qx4F5@db.zaurjcjenwwyswmdavfw.supabase.co:5432/postgres',
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
