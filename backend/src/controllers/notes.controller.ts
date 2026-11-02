import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const noteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  subject: z.string().optional(),
  tags: z.string().optional(),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
});

export class NotesController {
  static async getNotes(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { search, subject, pinnedOnly } = req.query;

      let whereClause: any = { userId, isArchived: false };

      if (subject) {
        whereClause.subject = subject as string;
      }

      if (pinnedOnly === 'true') {
        whereClause.isPinned = true;
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: search as string } },
          { content: { contains: search as string } },
          { tags: { contains: search as string } },
        ];
      }

      const notes = await prisma.note.findMany({
        where: whereClause,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      });

      return res.json({ success: true, data: notes });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
  }

  static async createNote(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      const note = await prisma.note.create({
        data: {
          userId,
          title: data.title,
          content: data.content || '',
          subject: data.subject || null,
          tags: data.tags || null,
          isPinned: data.isPinned || false,
          isArchived: data.isArchived || false,
        },
      });

      return res.status(201).json({ success: true, data: note });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create note' });
    }
  }

  static async updateNote(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const data = req.body;

      const updated = await prisma.note.updateMany({
        where: { id, userId },
        data: {
          title: data.title,
          content: data.content,
          subject: data.subject,
          tags: data.tags,
          isPinned: data.isPinned,
          isArchived: data.isArchived,
        },
      });

      if (updated.count === 0) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }

      const note = await prisma.note.findUnique({ where: { id } });
      return res.json({ success: true, data: note });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update note' });
    }
  }

  static async deleteNote(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.note.deleteMany({
        where: { id, userId },
      });

      return res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete note' });
    }
  }

  // Batch sync endpoint for offline-first reconciliation
  static async syncNotes(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { localNotes = [], lastSyncedAt } = req.body;

      // 1. Upsert incoming local notes
      for (const item of localNotes) {
        if (item.id) {
          await prisma.note.upsert({
            where: { id: item.id },
            update: {
              title: item.title,
              content: item.content,
              subject: item.subject,
              tags: item.tags,
              isPinned: item.isPinned,
              isArchived: item.isArchived,
            },
            create: {
              id: item.id,
              userId,
              title: item.title,
              content: item.content,
              subject: item.subject,
              tags: item.tags,
              isPinned: item.isPinned,
              isArchived: item.isArchived,
            },
          });
        }
      }

      // 2. Fetch all updated notes from server since last sync
      const serverNotes = await prisma.note.findMany({
        where: { userId },
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      });

      return res.json({
        success: true,
        data: {
          notes: serverNotes,
          syncedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Notes synchronization failed' });
    }
  }
}
