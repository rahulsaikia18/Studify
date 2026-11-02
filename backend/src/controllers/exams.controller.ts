import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const examSchema = z.object({
  title: z.string().min(1),
  examDate: z.string(), // ISO date
  subjects: z.array(z.string()).or(z.string()),
  syllabusProgress: z.number().min(0).max(100).default(0),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('HIGH'),
  notes: z.string().optional(),
});

export class ExamsController {
  static async getExams(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const exams = await prisma.exam.findMany({
        where: { userId },
        orderBy: { examDate: 'asc' },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const formatted = exams.map((exam) => {
        const examDate = new Date(exam.examDate);
        const diffMs = examDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let subjectList: string[] = [];
        try {
          subjectList = typeof exam.subjects === 'string' ? JSON.parse(exam.subjects) : exam.subjects;
        } catch {
          subjectList = [exam.subjects];
        }

        return {
          ...exam,
          subjects: subjectList,
          daysRemaining,
          isPassed: daysRemaining < 0,
          isToday: daysRemaining === 0,
        };
      });

      return res.json({ success: true, data: formatted });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch exams' });
    }
  }

  static async createExam(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      const exam = await prisma.exam.create({
        data: {
          userId,
          title: data.title,
          examDate: new Date(data.examDate),
          subjects: typeof data.subjects === 'string' ? data.subjects : JSON.stringify(data.subjects),
          syllabusProgress: data.syllabusProgress || 0,
          priority: data.priority || 'HIGH',
          notes: data.notes || null,
        },
      });

      return res.status(201).json({ success: true, data: exam });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create exam' });
    }
  }

  static async updateExam(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const data = req.body;

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.examDate !== undefined) updateData.examDate = new Date(data.examDate);
      if (data.subjects !== undefined) {
        updateData.subjects = typeof data.subjects === 'string' ? data.subjects : JSON.stringify(data.subjects);
      }
      if (data.syllabusProgress !== undefined) updateData.syllabusProgress = data.syllabusProgress;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const updated = await prisma.exam.updateMany({
        where: { id, userId },
        data: updateData,
      });

      if (updated.count === 0) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const exam = await prisma.exam.findUnique({ where: { id } });
      return res.json({ success: true, data: exam });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update exam' });
    }
  }

  static async deleteExam(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.exam.deleteMany({
        where: { id, userId },
      });

      return res.json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete exam' });
    }
  }
}
