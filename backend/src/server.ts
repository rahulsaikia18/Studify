import app from './app';
import { ENV } from './config/env';
import { connectDB } from './config/db';

async function bootstrap() {
  await connectDB();

  app.listen(ENV.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Studify API running on port ${ENV.PORT}`);
    console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`🩺 Health check: http://localhost:${ENV.PORT}/api/health`);
    console.log(`===============================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
