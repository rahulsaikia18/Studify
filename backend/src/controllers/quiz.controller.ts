import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { QuizGeneratorService } from '../services/quizGenerator.service';

export const generateQuizSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().default('General Overview'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  count: z.number().int().min(3).max(20).default(5),
});

export const submitQuizSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  difficulty: z.string(),
  userAnswers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionIndex: z.number().nullable(),
    })
  ),
  questions: z.array(z.any()),
  timeTakenSeconds: z.number().int().min(0).default(0),
});

export class QuizController {
  static async generate(req: AuthenticatedRequest, res: Response) {
    try {
      const { subject, topic, difficulty, count } = req.body;
      const questions = await QuizGeneratorService.generateQuiz(subject, topic, difficulty, count);

      return res.json({
        success: true,
        data: {
          subject,
          topic,
          difficulty,
          totalQuestions: questions.length,
          questions,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to generate quiz' });
    }
  }

  static async submit(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { subject, topic, difficulty, userAnswers, questions, timeTakenSeconds } = req.body;

      let score = 0;
      const evaluatedQuestions = questions.map((q: any) => {
        const userAnswer = userAnswers.find((ua: any) => ua.questionId === q.id);
        const selectedIndex = userAnswer ? userAnswer.selectedOptionIndex : null;
        const isCorrect = selectedIndex === q.correctOptionIndex;

        if (isCorrect) {
          score += 1;
        }

        return {
          ...q,
          selectedOptionIndex: selectedIndex,
          isCorrect,
        };
      });

      const totalQuestions = questions.length;
      const percentage = Math.round((score / totalQuestions) * 100);

      // Save to database
      const record = await prisma.quizRecord.create({
        data: {
          userId,
          subject,
          topic,
          difficulty,
          score,
          totalQuestions,
          questionsData: JSON.stringify(evaluatedQuestions),
          timeTakenSeconds,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Quiz submitted successfully',
        data: {
          recordId: record.id,
          score,
          totalQuestions,
          percentage,
          timeTakenSeconds,
          evaluatedQuestions,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to submit quiz results' });
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const records = await prisma.quizRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return res.json({
        success: true,
        data: records.map((r) => ({
          ...r,
          questionsData: JSON.parse(r.questionsData),
        })),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch quiz history' });
    }
  }
}
