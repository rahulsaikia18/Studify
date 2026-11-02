import { PrismaClient } from '@prisma/client';

const DEFAULT_SUPABASE_URL =
  'postgresql://postgres:GTB87E9pQB1Qx4F5@db.zaurjcjenwwyswmdavfw.supabase.co:5432/postgres';

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  DEFAULT_SUPABASE_URL;

// Serverless-safe singleton pattern:
// Prevents exhausting PostgreSQL / Supabase connection limits during Vercel cold and warm reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Cache instance globally in serverless execution environments
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
  globalForPrisma.prisma = prisma;
}

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to Database successfully');
  } catch (error) {
    // Non-blocking log in serverless environments to prevent container boot termination
    console.warn('⚠️ Database connection deferred to first query invocation:', error);
  }
}
