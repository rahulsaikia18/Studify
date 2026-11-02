import { Platform, NativeModules, TurboModuleRegistry } from 'react-native';
import { AdConfig } from '../constants/AdConfig';
import { ApiClient } from './api';

export interface AdReward {
  type: string;
  transactionId: string;
  grantedAt: string;
}

export type InterstitialCallback = () => void;

export function isNativeAdMobSupported(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    if (NativeModules && (NativeModules.RNGoogleMobileAdsModule || NativeModules.RNGoogleMobileAdsBannerViewManager)) {
      return true;
    }
    if ((TurboModuleRegistry as any)?.get) {
      return Boolean((TurboModuleRegistry as any).get('RNGoogleMobileAdsModule'));
    }
  } catch {
    return false;
  }
  return false;
}

class CentralizedAdManager {
  private lastInterstitialTime = 0;
  private hourlyInterstitialCount = 0;
  private hourWindowStart = Date.now();
  private userActionCount = 0;
  private isAdMobAvailable = false;
  private nativeModule: any = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (isNativeAdMobSupported()) {
        const GoogleMobileAds = require('react-native-google-mobile-ads');
        this.nativeModule = GoogleMobileAds;
        if (GoogleMobileAds.default) {
          await GoogleMobileAds.default().initialize();
          this.isAdMobAvailable = true;
          console.log('✅ Google AdMob SDK initialized successfully (Native Binary detected)');
          return;
        }
      }
    } catch (e) {
      this.isAdMobAvailable = false;
    }

    console.log('ℹ️ Running AdMob in simulated compliant test mode (Expo Go / Web environment)');
    this.isAdMobAvailable = false;
  }

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
      console.log(`[AdManager] Interstitial skipped at "${transitionName}" (cooldown/cap active)`);
      onClosed?.();
      return false;
    }

    console.log(`[AdManager] Showing interstitial at natural milestone: ${transitionName}`);
    this.lastInterstitialTime = Date.now();
    this.hourlyInterstitialCount++;

    if (this.isAdMobAvailable && this.nativeModule) {
      try {
        const { InterstitialAd, AdEventType } = this.nativeModule;
        const interstitial = InterstitialAd.createForAdRequest(AdConfig.adUnits.interstitial!, {
          requestNonPersonalizedAdsOnly: true,
        });

        interstitial.addAdEventListener(AdEventType.LOADED, () => {
          interstitial.show();
        });

        interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          onClosed?.();
        });

        interstitial.addAdEventListener(AdEventType.ERROR, () => {
          onClosed?.();
        });

        interstitial.load();
        return true;
      } catch (err) {
        console.warn('Native interstitial error, continuing seamlessly:', err);
        onClosed?.();
        return false;
      }
    } else {
      setTimeout(() => {
        onClosed?.();
      }, 500);
      return true;
    }
  }

  public async showRewardedAd(
    rewardType: 'EXTRA_QUIZ' | 'PREMIUM_UNLOCK_24H' | 'BONUS_ANALYTICS',
    onRewardEarned: (reward: AdReward) => void,
    onFailed?: (errorMsg: string) => void
  ): Promise<void> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const verifyWithServer = async () => {
      try {
        const res = await ApiClient.post('/admob/verify-reward', {
          rewardType,
          transactionId,
          rewardAmount: 1,
        });

        if (res.success) {
          onRewardEarned({
            type: rewardType,
            transactionId,
            grantedAt: new Date().toISOString(),
          });
        } else {
          onFailed?.(res.message || 'Reward verification failed');
        }
      } catch (e: any) {
        onRewardEarned({
          type: rewardType,
          transactionId,
          grantedAt: new Date().toISOString(),
        });
      }
    };

    if (this.isAdMobAvailable && this.nativeModule) {
      try {
        const { RewardedAd, RewardedAdEventType } = this.nativeModule;
        const rewarded = RewardedAd.createForAdRequest(AdConfig.adUnits.rewarded!);

        rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
          rewarded.show();
        });

        rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
          await verifyWithServer();
        });

        rewarded.addAdEventListener(RewardedAdEventType.ERROR, (error: any) => {
          onFailed?.(error?.message || 'Failed to load rewarded advertisement');
        });

        rewarded.load();
      } catch (err: any) {
        onFailed?.(err.message || 'Rewarded ad presentation failed');
      }
    } else {
      setTimeout(async () => {
        await verifyWithServer();
      }, 800);
    }
  }

  public getStatus() {
    return {
      isAdMobAvailable: this.isAdMobAvailable,
      userActionCount: this.userActionCount,
      hourlyInterstitialCount: this.hourlyInterstitialCount,
      cooldownRemainingSeconds: Math.max(
        0,
        Math.round((AdConfig.policies.interstitialCooldownMs - (Date.now() - this.lastInterstitialTime)) / 1000)
      ),
    };
  }
}

export const AdManager = new CentralizedAdManager();
