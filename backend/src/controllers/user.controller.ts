import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          educationLevel: true,
          institution: true,
          courseName: true,
          semester: true,
          academicGoals: true,
          theme: true,
          notificationPrefs: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        data: {
          ...user,
          notificationPrefs: JSON.parse(user.notificationPrefs || '{}'),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        fullName,
        educationLevel,
        institution,
        courseName,
        semester,
        academicGoals,
        theme,
        notificationPrefs,
        avatarUrl,
      } = req.body;

      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (educationLevel !== undefined) updateData.educationLevel = educationLevel;
      if (institution !== undefined) updateData.institution = institution;
      if (courseName !== undefined) updateData.courseName = courseName;
      if (semester !== undefined) updateData.semester = semester;
      if (academicGoals !== undefined) updateData.academicGoals = academicGoals;
      if (theme !== undefined) updateData.theme = theme;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (notificationPrefs !== undefined) {
        updateData.notificationPrefs = typeof notificationPrefs === 'string'
          ? notificationPrefs
          : JSON.stringify(notificationPrefs);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          educationLevel: true,
          institution: true,
          courseName: true,
          semester: true,
          academicGoals: true,
          theme: true,
          notificationPrefs: true,
          avatarUrl: true,
        },
      });

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          ...updatedUser,
          notificationPrefs: JSON.parse(updatedUser.notificationPrefs || '{}'),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }

  static async exportData(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const [user, cgpa, attendance, study, pomodoro, notes, todos, exams, quizzes] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, fullName: true, educationLevel: true, institution: true, courseName: true, semester: true },
        }),
        prisma.cgpaRecord.findMany({ where: { userId } }),
        prisma.attendanceCourse.findMany({ where: { userId }, include: { logs: true } }),
        prisma.studySession.findMany({ where: { userId } }),
        prisma.pomodoroLog.findMany({ where: { userId } }),
        prisma.note.findMany({ where: { userId } }),
        prisma.todoTask.findMany({ where: { userId } }),
        prisma.exam.findMany({ where: { userId } }),
        prisma.quizRecord.findMany({ where: { userId } }),
      ]);

      const exportPayload = {
        app: 'Studify',
        exportedAt: new Date().toISOString(),
        user,
        cgpa,
        attendance,
        study,
        pomodoro,
        notes,
        todos,
        exams,
        quizzes,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=studify-data-${userId}.json`);
      return res.send(JSON.stringify(exportPayload, null, 2));
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to export student data' });
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      await prisma.user.delete({ where: { id: userId } });
      return res.json({ success: true, message: 'Account and associated data deleted permanently' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete account' });
    }
  }
}
