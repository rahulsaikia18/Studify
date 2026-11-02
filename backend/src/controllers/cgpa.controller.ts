import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export interface SubjectEntry {
  subjectName: string;
  credits: number;
  grade: string;
  gradePoint: number;
}

export interface SemesterEntry {
  semesterNumber: number;
  semesterName: string;
  subjects: SubjectEntry[];
  sgpa: number;
  totalCredits: number;
}

export interface GradingScaleConfig {
  scaleType: string; // "10_POINT", "4_POINT", "CUSTOM"
  percentageMultiplier: number; // e.g. 9.5 (CBSE/VTU) or 10.0 or (CGPA - 0.75) * 10
  gradeToPoint: Record<string, number>;
}

export const DEFAULT_10_POINT_SCALE: GradingScaleConfig = {
  scaleType: '10_POINT',
  percentageMultiplier: 9.5,
  gradeToPoint: {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0,
  },
};

export const DEFAULT_4_POINT_SCALE: GradingScaleConfig = {
  scaleType: '4_POINT',
  percentageMultiplier: 25.0,
  gradeToPoint: {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'F': 0.0,
  },
};

export const calculateSgpaSchema = z.object({
  subjects: z.array(
    z.object({
      subjectName: z.string(),
      credits: z.number().positive(),
      grade: z.string().optional(),
      gradePoint: z.number().min(0),
    })
  ),
});

export const saveCgpaRecordSchema = z.object({
  title: z.string().min(1),
  scaleType: z.string(),
  scaleConfig: z.record(z.any()),
  semesters: z.array(z.any()),
  cgpa: z.number(),
  percentage: z.number().optional(),
  totalCredits: z.number(),
});

export class CgpaController {
  static calculateSgpa(req: AuthenticatedRequest, res: Response) {
    const { subjects } = req.body;
    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const sub of subjects) {
      totalGradePoints += sub.gradePoint * sub.credits;
      totalCredits += sub.credits;
    }

    const sgpa = totalCredits > 0 ? parseFloat((totalGradePoints / totalCredits).toFixed(2)) : 0;
    return res.json({
      success: true,
      data: {
        sgpa,
        totalCredits,
        totalGradePoints,
      },
    });
  }

  static calculateCgpa(req: AuthenticatedRequest, res: Response) {
    const { semesters, percentageMultiplier = 9.5 } = req.body;
    let totalCredits = 0;
    let weightedSgpaSum = 0;

    for (const sem of semesters) {
      weightedSgpaSum += sem.sgpa * sem.totalCredits;
      totalCredits += sem.totalCredits;
    }

    const cgpa = totalCredits > 0 ? parseFloat((weightedSgpaSum / totalCredits).toFixed(2)) : 0;
    const percentage = parseFloat((cgpa * percentageMultiplier).toFixed(2));

    return res.json({
      success: true,
      data: {
        cgpa,
        percentage,
        totalCredits,
      },
    });
  }

  static async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const records = await prisma.cgpaRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        success: true,
        data: records.map((r) => ({
          ...r,
          scaleConfig: JSON.parse(r.scaleConfig),
          semesters: JSON.parse(r.semesters),
        })),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch calculation history' });
    }
  }

  static async saveRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { title, scaleType, scaleConfig, semesters, cgpa, percentage, totalCredits } = req.body;

      const record = await prisma.cgpaRecord.create({
        data: {
          userId,
          title,
          scaleType,
          scaleConfig: JSON.stringify(scaleConfig),
          semesters: JSON.stringify(semesters),
          cgpa,
          percentage: percentage || null,
          totalCredits,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'CGPA record saved successfully',
        data: {
          ...record,
          scaleConfig: JSON.parse(record.scaleConfig),
          semesters: JSON.parse(record.semesters),
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to save CGPA record' });
    }
  }

  static async deleteRecord(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await prisma.cgpaRecord.deleteMany({
        where: { id, userId },
      });

      return res.json({ success: true, message: 'CGPA record deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete CGPA record' });
    }
  }
}
