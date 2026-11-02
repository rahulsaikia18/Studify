import { PrismaClient } from '@prisma/client';

// Serverless-safe singleton pattern:
// Prevents exhausting PostgreSQL / Supabase connection limits during Vercel cold and warm reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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
