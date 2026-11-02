import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const todoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  category: z.string().default('General'),
  isCompleted: z.boolean().default(false),
});

export class TodosController {
  static async getTodos(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { category, priority, status } = req.query;

      let whereClause: any = { userId };

      if (category && category !== 'All') {
        whereClause.category = category as string;
      }

      if (priority) {
        whereClause.priority = priority as string;
      }

      if (status === 'completed') {
        whereClause.isCompleted = true;
      } else if (status === 'pending') {
        whereClause.isCompleted = false;
      }

      const tasks = await prisma.todoTask.findMany({
        where: whereClause,
        orderBy: [{ isCompleted: 'asc' }, { dueDate: 'asc' }, { priority: 'desc' }],
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < tomorrow);
      const upcomingTasks = tasks.filter((t) => !t.dueDate || new Date(t.dueDate) >= tomorrow);

      return res.json({
        success: true,
        data: {
          all: tasks,
          dailyTasks,
          upcomingTasks,
          totalCount: tasks.length,
          completedCount: tasks.filter((t) => t.isCompleted).length,
          pendingCount: tasks.filter((t) => !t.isCompleted).length,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch to-dos' });
    }
  }

  static async createTodo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      const task = await prisma.todoTask.create({
        data: {
          userId,
          title: data.title,
          description: data.description || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          priority: data.priority || 'MEDIUM',
          category: data.category || 'General',
          isCompleted: data.isCompleted || false,
        },
      });

      return res.status(201).json({ success: true, data: task });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create to-do' });
    }
  }

  static async updateTodo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const data = req.body;

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isCompleted !== undefined) {
        updateData.isCompleted = data.isCompleted;
        updateData.completedAt = data.isCompleted ? new Date() : null;
      }

      const updated = await prisma.todoTask.updateMany({
        where: { id, userId },
        data: updateData,
      });

      if (updated.count === 0) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const task = await prisma.todoTask.findUnique({ where: { id } });
      return res.json({ success: true, data: task });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update to-do' });
    }
  }

  static async toggleTodo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const existing = await prisma.todoTask.findFirst({ where: { id, userId } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const isCompleted = !existing.isCompleted;
      const task = await prisma.todoTask.update({
        where: { id },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      return res.json({ success: true, data: task });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to toggle task' });
    }
  }

  static async deleteTodo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.todoTask.deleteMany({
        where: { id, userId },
      });

      return res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete to-do' });
    }
  }
}
