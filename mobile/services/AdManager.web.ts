import { AdConfig } from '../constants/AdConfig';
import { ApiClient } from './api';

export interface AdReward {
  type: string;
  transactionId: string;
  grantedAt: string;
}

export type InterstitialCallback = () => void;

export function isNativeAdMobSupported(): boolean {
  return false;
}

class WebCentralizedAdManager {
  private lastInterstitialTime = 0;
  private hourlyInterstitialCount = 0;
  private hourWindowStart = Date.now();
  private userActionCount = 0;

  public registerUserAction(): void {
    this.userActionCount++;
  }

  public canShowInterstitial(currentScreenName?: string): boolean {
    if (currentScreenName && AdConfig.policies.forbiddenScreens.includes(currentScreenName)) {
      return false;
    }
    if (this.userActionCount < AdConfig.policies.actionsBeforeFirstInterstitial) {
      return false;
    }
    const now = Date.now();
    if (now - this.hourWindowStart > 60 * 60 * 1000) {
      this.hourlyInterstitialCount = 0;
      this.hourWindowStart = now;
    }
    if (this.hourlyInterstitialCount >= AdConfig.policies.interstitialMaxPerHour) {
      return false;
    }
    if (now - this.lastInterstitialTime < AdConfig.policies.interstitialCooldownMs) {
      return false;
    }
    return true;
  }

  public async showInterstitialAtTransition(
    transitionName: string,
    onClosed?: InterstitialCallback
  ): Promise<boolean> {
    if (!this.canShowInterstitial()) {
      onClosed?.();
      return false;
    }
    this.lastInterstitialTime = Date.now();
    this.hourlyInterstitialCount++;
    setTimeout(() => {
      onClosed?.();
    }, 500);
    return true;
  }

  public async showRewardedAd(
    rewardType: 'EXTRA_QUIZ' | 'PREMIUM_UNLOCK_24H' | 'BONUS_ANALYTICS',
    onRewardEarned: (reward: AdReward) => void,
    onFailed?: (errorMsg: string) => void
  ): Promise<void> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    setTimeout(async () => {
      try {
        await ApiClient.post('/admob/verify-reward', {
          rewardType,
          transactionId,
          rewardAmount: 1,
        });
      } catch {}
      onRewardEarned({
        type: rewardType,
        transactionId,
        grantedAt: new Date().toISOString(),
      });
    }, 600);
  }

  public getStatus() {
    return {
      isAdMobAvailable: false,
      userActionCount: this.userActionCount,
      hourlyInterstitialCount: this.hourlyInterstitialCount,
      cooldownRemainingSeconds: 0,
    };
  }
}

export const AdManager = new WebCentralizedAdManager();
