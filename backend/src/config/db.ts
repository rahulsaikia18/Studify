import { PrismaClient } from '@prisma/client';

// Supabase IPv4 Pooler URL (compatible with Vercel Serverless & AWS Lambda which require IPv4):
const SUPABASE_IPV4_POOLER_URL =
  'postgresql://postgres.zaurjcjenwwyswmdavfw:GTB87E9pQB1Qx4F5@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

function resolveDatabaseUrl(): string {
  const current = process.env.DATABASE_URL || process.env.DIRECT_URL;

  // If environment variable is missing, or contains direct IPv6 domain db.xxx.supabase.co:5432,
  // automatically intercept and rewrite to the IPv4-enabled Supabase Connection Pooler.
  if (!current || current.includes('.supabase.co:5432')) {
    return SUPABASE_IPV4_POOLER_URL;
  }

  return current;
}

const databaseUrl = resolveDatabaseUrl();
// Set process.env.DATABASE_URL so Prisma internals always use the IPv4 pooler
process.env.DATABASE_URL = databaseUrl;

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
    console.log('✅ Connected to Database successfully via IPv4 Pooler');
  } catch (error) {
    // Non-blocking log in serverless environments to prevent container boot termination
    console.warn('⚠️ Database connection deferred to first query invocation:', error);
  }
}
