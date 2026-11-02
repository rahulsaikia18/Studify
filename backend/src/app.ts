import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import cgpaRoutes from './routes/cgpa.routes';
import attendanceRoutes from './routes/attendance.routes';
import studyRoutes from './routes/study.routes';
import pomodoroRoutes from './routes/pomodoro.routes';
import notesRoutes from './routes/notes.routes';
import todosRoutes from './routes/todos.routes';
import examsRoutes from './routes/exams.routes';
import quizRoutes from './routes/quiz.routes';
import pdfRoutes from './routes/pdf.routes';
import admobRoutes from './routes/admob.routes';
import { apiLimiter } from './middleware/rateLimiter';

const app = express();

// Trust Vercel / reverse proxy headers for rate limiting and IP resolution
app.set('trust proxy', 1);

// Security and middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter
app.use('/api', apiLimiter);

// Root Ping & Keep-Alive endpoint (for Uptime monitors & Vercel inspection)
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Studify API',
    version: '1.0.0',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Standalone',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      motivation: '/api/motivation',
      auth: '/api/auth',
      cgpa: '/api/cgpa',
      attendance: '/api/attendance',
      study: '/api/study',
      pomodoro: '/api/pomodoro',
      notes: '/api/notes',
      todos: '/api/todos',
      exams: '/api/exams',
      quiz: '/api/quiz',
      pdf: '/api/pdf',
      admob: '/api/admob',
    },
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Studify API',
    platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Standalone',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Daily Motivational Quote endpoint
app.get('/api/motivation', (req: Request, res: Response) => {
  const quotes = [
    { quote: "Success doesn't just find you. You have to go out and get it.", author: "Anonymous" },
    { quote: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
    { quote: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
    { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { quote: "Don't count the days, make the days count.", author: "Muhammad Ali" },
    { quote: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { quote: "Focus on progress, not perfection.", author: "Bill Phillips" },
  ];
  const dayIndex = new Date().getDay() % quotes.length;
  res.json({ success: true, data: quotes[dayIndex] });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cgpa', cgpaRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admob', admobRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred',
  });
});

export default app;
