import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const studySessionSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().optional(),
  plannedMinutes: z.number().int().positive(),
  actualMinutes: z.number().int().min(0).default(0),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  completed: z.boolean().default(false),
  scheduledDate: z.string(), // ISO date
  notes: z.string().optional(),
});

export class StudyController {
  static async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { date, startDate, endDate } = req.query;

      let whereClause: any = { userId };

      if (date) {
        const targetDate = new Date(date as string);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        whereClause.scheduledDate = { gte: startOfDay, lte: endOfDay };
      } else if (startDate && endDate) {
        whereClause.scheduledDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const sessions = await prisma.studySession.findMany({
        where: whereClause,
        orderBy: [{ scheduledDate: 'asc' }, { priority: 'desc' }],
      });

      return res.json({ success: true, data: sessions });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch study sessions' });
    }
  }

  static async createSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      const session = await prisma.studySession.create({
        data: {
          userId,
          subject: data.subject,
          topic: data.topic || null,
          plannedMinutes: data.plannedMinutes,
          actualMinutes: data.actualMinutes || 0,
          priority: data.priority || 'MEDIUM',
          completed: data.completed || false,
          scheduledDate: new Date(data.scheduledDate),
          notes: data.notes || null,
        },
      });

      return res.status(201).json({ success: true, data: session });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create study session' });
    }
  }

  static async updateSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const data = req.body;

      const updateData: any = {};
      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.topic !== undefined) updateData.topic = data.topic;
      if (data.plannedMinutes !== undefined) updateData.plannedMinutes = data.plannedMinutes;
      if (data.actualMinutes !== undefined) updateData.actualMinutes = data.actualMinutes;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.completed !== undefined) updateData.completed = data.completed;
      if (data.scheduledDate !== undefined) updateData.scheduledDate = new Date(data.scheduledDate);
      if (data.notes !== undefined) updateData.notes = data.notes;

      const session = await prisma.studySession.updateMany({
        where: { id, userId },
        data: updateData,
      });

      if (session.count === 0) {
        return res.status(404).json({ success: false, message: 'Study session not found' });
      }

      const updated = await prisma.studySession.findUnique({ where: { id } });
      return res.json({ success: true, data: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update study session' });
    }
  }

  static async deleteSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.studySession.deleteMany({
        where: { id, userId },
      });

      return res.json({ success: true, message: 'Study session deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete study session' });
    }
  }

  static async getWeeklyProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const today = new Date();
      const past7Days = new Date();
      past7Days.setDate(today.getDate() - 6);
      past7Days.setHours(0, 0, 0, 0);

      const [sessions, pomodoro] = await Promise.all([
        prisma.studySession.findMany({
          where: {
            userId,
            scheduledDate: { gte: past7Days },
          },
        }),
        prisma.pomodoroLog.findMany({
          where: {
            userId,
            startedAt: { gte: past7Days },
            sessionType: 'FOCUS',
          },
        }),
      ]);

      // Calculate day-by-day stats
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartData: { day: string; date: string; plannedMinutes: number; actualMinutes: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = days[d.getDay()];

        const daySessions = sessions.filter((s) => s.scheduledDate.toISOString().startsWith(dateStr));
        const dayPomodoro = pomodoro.filter((p) => p.startedAt.toISOString().startsWith(dateStr));

        const planned = daySessions.reduce((sum, s) => sum + s.plannedMinutes, 0);
        const actualFromSessions = daySessions.reduce((sum, s) => sum + s.actualMinutes, 0);
        const actualFromPomodoro = dayPomodoro.reduce((sum, p) => sum + p.durationMinutes, 0);

        chartData.push({
          day: dayLabel,
          date: dateStr,
          plannedMinutes: planned,
          actualMinutes: Math.max(actualFromSessions, actualFromPomodoro),
        });
      }

      // Today's summary
      const todayStr = today.toISOString().split('T')[0];
      const todayRecord = chartData.find((c) => c.date === todayStr) || { actualMinutes: 0, plannedMinutes: 0 };
      const todayHours = parseFloat((todayRecord.actualMinutes / 60).toFixed(1));

      // Calculate streak
      let streak = 0;
      for (let i = chartData.length - 1; i >= 0; i--) {
        if (chartData[i].actualMinutes > 0) {
          streak++;
        } else if (i === chartData.length - 1) {
          // If today has 0 so far, check if yesterday was active
          continue;
        } else {
          break;
        }
      }

      // Productivity score (0 - 100)
      const targetDailyMinutes = 120; // 2 hours goal
      const productivityScore = Math.min(100, Math.round((todayRecord.actualMinutes / targetDailyMinutes) * 100));

      return res.json({
        success: true,
        data: {
          chartData,
          todayHours,
          todayMinutes: todayRecord.actualMinutes,
          completedTasks: sessions.filter((s) => s.completed).length,
          pendingTasks: sessions.filter((s) => !s.completed).length,
          studyStreak: streak || 1,
          productivityScore,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to calculate weekly progress' });
    }
  }
}
