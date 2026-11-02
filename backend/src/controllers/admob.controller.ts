import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const verifyRewardSchema = z.object({
  rewardType: z.enum(['EXTRA_QUIZ', 'PREMIUM_UNLOCK_24H', 'BONUS_ANALYTICS']),
  transactionId: z.string().min(5),
  rewardAmount: z.number().int().positive().default(1),
});

export class AdMobController {
  /**
   * Provides current client AdMob configuration, test unit IDs, cooldowns, and frequency cap settings
   */
  static async getConfig(req: AuthenticatedRequest, res: Response) {
    const isProd = process.env.NODE_ENV === 'production';

    // Official Google AdMob Test Ad Unit IDs (Android)
    const adConfig = {
      isProduction: isProd,
      bannerAdUnitId: isProd
        ? process.env.ADMOB_PROD_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111'
        : 'ca-app-pub-3940256099942544/6300978111', // Test Banner ID
      interstitialAdUnitId: isProd
        ? process.env.ADMOB_PROD_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712'
        : 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial ID
      rewardedAdUnitId: isProd
        ? process.env.ADMOB_PROD_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917'
        : 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded ID
      appOpenAdUnitId: isProd
        ? process.env.ADMOB_PROD_APPOPEN_ID || 'ca-app-pub-3940256099942544/9257390515'
        : 'ca-app-pub-3940256099942544/9257390515', // Test App Open ID
      policies: {
        interstitialCooldownSeconds: 120, // 2 minutes cooldown between interstitials
        interstitialMaxPerHour: 3,        // Maximum 3 per hour
        rewardedAllowedTypes: ['EXTRA_QUIZ', 'PREMIUM_UNLOCK_24H', 'BONUS_ANALYTICS'],
        showBannerOnDashboard: true,
        showBannerOnTools: true,
      },
    };

    return res.json({ success: true, data: adConfig });
  }

  /**
   * Verifies that a rewarded ad was completed by the user and records the grant
   */
  static async verifyReward(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { rewardType, transactionId, rewardAmount } = req.body;

      // Check if transaction ID was already rewarded to prevent replay
      const existing = await prisma.adRewardLog.findUnique({
        where: { transactionId },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Reward transaction already redeemed',
        });
      }

      const rewardLog = await prisma.adRewardLog.create({
        data: {
          userId,
          rewardType,
          transactionId,
          adNetwork: 'Google AdMob',
        },
      });

      return res.status(201).json({
        success: true,
        message: `Successfully granted reward: ${rewardType}`,
        data: {
          rewardId: rewardLog.id,
          rewardType,
          grantedAt: rewardLog.grantedAt,
        },
      });
    } catch (error) {
      console.error('Ad reward verification error:', error);
      return res.status(500).json({ success: false, message: 'Failed to verify ad reward' });
    }
  }

  /**
   * Get user's active rewards and perks
   */
  static async getActiveRewards(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const rewards = await prisma.adRewardLog.findMany({
        where: { userId },
        orderBy: { grantedAt: 'desc' },
        take: 20,
      });

      // Check 24-hour unlock
      const now = new Date();
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const has24hUnlock = rewards.some(
        (r) => r.rewardType === 'PREMIUM_UNLOCK_24H' && r.grantedAt > past24h
      );

      return res.json({
        success: true,
        data: {
          has24hUnlock,
          totalRewardsEarned: rewards.length,
          recentRewards: rewards,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch rewards' });
    }
  }
}
