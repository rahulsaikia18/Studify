import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export function calculateAttendanceStats(attended: number, total: number, targetPercentage: number = 75) {
  if (total === 0) {
    return {
      percentage: 100,
      targetPercentage,
      status: 'ON_TRACK',
      classesToAttend: 0,
      classesCanMiss: 0,
      message: 'No classes held yet. You have full attendance.',
    };
  }

  const percentage = parseFloat(((attended / total) * 100).toFixed(1));

  if (percentage >= targetPercentage) {
    // How many classes can be missed consecutively before falling below target:
    // Attended / (Total + y) >= target / 100
    // y <= (100 * Attended - target * Total) / target
    const classesCanMiss = Math.floor((100 * attended - targetPercentage * total) / targetPercentage);
    return {
      percentage,
      targetPercentage,
      status: 'ON_TRACK',
      classesToAttend: 0,
      classesCanMiss: Math.max(0, classesCanMiss),
      message: classesCanMiss > 0
        ? `You can safely miss ${classesCanMiss} ${classesCanMiss === 1 ? 'class' : 'classes'} and stay above ${targetPercentage}%.`
        : `You are exactly on track! Do not miss the next class.`,
    };
  } else {
    // How many consecutive classes needed to reach target:
    // (Attended + x) / (Total + x) >= target / 100
    // x * (100 - target) >= target * Total - 100 * Attended
    const numerator = targetPercentage * total - 100 * attended;
    const denominator = 100 - targetPercentage;
    const classesToAttend = denominator > 0 ? Math.ceil(numerator / denominator) : 0;
    return {
      percentage,
      targetPercentage,
      status: 'SHORTAGE',
      classesToAttend: Math.max(1, classesToAttend),
      classesCanMiss: 0,
      message: `Attendance shortage! You must attend next ${classesToAttend} ${classesToAttend === 1 ? 'class' : 'classes'} consecutively to reach ${targetPercentage}%.`,
    };
  }
}

export const courseSchema = z.object({
  courseName: z.string().min(1),
  courseCode: z.string().optional(),
  totalClasses: z.number().int().min(0).default(0),
  attendedClasses: z.number().int().min(0).default(0),
  targetPercentage: z.number().min(1).max(100).default(75),
  color: z.string().optional(),
});

export class AttendanceController {
  static quickCalculate(req: AuthenticatedRequest, res: Response) {
    const total = Number(req.query.total || req.body.total || 0);
    const attended = Number(req.query.attended || req.body.attended || 0);
    const target = Number(req.query.target || req.body.target || 75);

    if (attended > total) {
      return res.status(400).json({ success: false, message: 'Attended classes cannot exceed total classes' });
    }

    const stats = calculateAttendanceStats(attended, total, target);
    return res.json({ success: true, data: stats });
  }

  static async getCourses(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const courses = await prisma.attendanceCourse.findMany({
        where: { userId },
        include: {
          logs: {
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const coursesWithStats = courses.map((course) => {
        const stats = calculateAttendanceStats(course.attendedClasses, course.totalClasses, course.targetPercentage);
        return {
          ...course,
          stats,
        };
      });

      // Overall calculations
      const totalAll = courses.reduce((sum, c) => sum + c.totalClasses, 0);
      const attendedAll = courses.reduce((sum, c) => sum + c.attendedClasses, 0);
      const overallStats = calculateAttendanceStats(attendedAll, totalAll, 75);

      return res.json({
        success: true,
        data: {
          courses: coursesWithStats,
          overallStats,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch attendance courses' });
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      if (data.attendedClasses > data.totalClasses) {
        return res.status(400).json({ success: false, message: 'Attended classes cannot exceed total classes' });
      }

      const course = await prisma.attendanceCourse.create({
        data: {
          userId,
          courseName: data.courseName,
          courseCode: data.courseCode || null,
          totalClasses: data.totalClasses || 0,
          attendedClasses: data.attendedClasses || 0,
          targetPercentage: data.targetPercentage || 75.0,
          color: data.color || '#3B82F6',
        },
      });

      const stats = calculateAttendanceStats(course.attendedClasses, course.totalClasses, course.targetPercentage);
      return res.status(201).json({ success: true, data: { ...course, stats } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create course' });
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const data = req.body;

      const existing = await prisma.attendanceCourse.findFirst({ where: { id, userId } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const totalClasses = data.totalClasses !== undefined ? data.totalClasses : existing.totalClasses;
      const attendedClasses = data.attendedClasses !== undefined ? data.attendedClasses : existing.attendedClasses;

      if (attendedClasses > totalClasses) {
        return res.status(400).json({ success: false, message: 'Attended classes cannot exceed total classes' });
      }

      const updated = await prisma.attendanceCourse.update({
        where: { id },
        data: {
          courseName: data.courseName ?? existing.courseName,
          courseCode: data.courseCode !== undefined ? data.courseCode : existing.courseCode,
          totalClasses,
          attendedClasses,
          targetPercentage: data.targetPercentage ?? existing.targetPercentage,
          color: data.color ?? existing.color,
        },
      });

      const stats = calculateAttendanceStats(updated.attendedClasses, updated.totalClasses, updated.targetPercentage);
      return res.json({ success: true, data: { ...updated, stats } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update course' });
    }
  }

  static async logAttendance(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { status, note } = req.body; // status: "ATTENDED" | "MISSED" | "CANCELLED"

      const course = await prisma.attendanceCourse.findFirst({ where: { id, userId } });
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      let newTotal = course.totalClasses;
      let newAttended = course.attendedClasses;

      if (status === 'ATTENDED') {
        newTotal += 1;
        newAttended += 1;
      } else if (status === 'MISSED') {
        newTotal += 1;
      }
      // CANCELLED doesn't increment total or attended

      const [updatedCourse, log] = await prisma.$transaction([
        prisma.attendanceCourse.update({
          where: { id },
          data: {
            totalClasses: newTotal,
            attendedClasses: newAttended,
          },
        }),
        prisma.attendanceLog.create({
          data: {
            courseId: id,
            status,
            note: note || null,
          },
        }),
      ]);

      const stats = calculateAttendanceStats(updatedCourse.attendedClasses, updatedCourse.totalClasses, updatedCourse.targetPercentage);
      return res.json({
        success: true,
        message: `Marked as ${status}`,
        data: {
          course: { ...updatedCourse, stats },
          log,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to log attendance' });
    }
  }

  static async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.attendanceCourse.deleteMany({
        where: { id, userId },
      });

      return res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete course' });
    }
  }
}
