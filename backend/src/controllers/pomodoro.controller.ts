import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const logPomodoroSchema = z.object({
  sessionType: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']),
  durationMinutes: z.number().int().positive(),
  completed: z.boolean().default(true),
  startedAt: z.string(),
  endedAt: z.string().optional(),
});

export class PomodoroController {
  static async logSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      const log = await prisma.pomodoroLog.create({
        data: {
          userId,
          sessionType: data.sessionType,
          durationMinutes: data.durationMinutes,
          completed: data.completed,
          startedAt: new Date(data.startedAt),
          endedAt: data.endedAt ? new Date(data.endedAt) : new Date(),
        },
      });

      return res.status(201).json({ success: true, data: log });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to record pomodoro session' });
    }
  }

  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayLogs, allLogs] = await Promise.all([
        prisma.pomodoroLog.findMany({
          where: {
            userId,
            startedAt: { gte: today },
            sessionType: 'FOCUS',
            completed: true,
          },
          orderBy: { startedAt: 'desc' },
        }),
        prisma.pomodoroLog.findMany({
          where: {
            userId,
            sessionType: 'FOCUS',
            completed: true,
          },
          take: 50,
          orderBy: { startedAt: 'desc' },
        }),
      ]);

      const todayFocusMinutes = todayLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
      const totalFocusMinutes = allLogs.reduce((sum, l) => sum + l.durationMinutes, 0);

      return res.json({
        success: true,
        data: {
          todayFocusMinutes,
          todaySessionsCount: todayLogs.length,
          totalFocusMinutes,
          totalSessionsCount: allLogs.length,
          recentLogs: allLogs.slice(0, 10),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch pomodoro stats' });
    }
  }
}
