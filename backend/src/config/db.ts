import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to Database successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}
