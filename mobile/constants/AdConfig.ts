import { Platform } from 'react-native';

export const AdConfig = {
  // App IDs
  appId: {
    android: 'ca-app-pub-2168264599014117~2201830267',
    ios: 'ca-app-pub-3940256099942544~1458002511',
  },

  // Toggle between test IDs and production unit IDs (__DEV__ safely uses test ads to prevent account bans)
  isTestMode: __DEV__,

  // Official Test Ad Units for Development
  testUnits: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    appOpen: 'ca-app-pub-3940256099942544/9257390515',
  },

  // Your Production Ad Units (configured from AdMob Console)
  productionUnits: {
    banner: {
      android: 'ca-app-pub-2168264599014117/8986730461',
      ios: 'ca-app-pub-3940256099942544/2934735716',
    },
    interstitial: {
      android: 'ca-app-pub-2168264599014117/4522365131',
      ios: 'ca-app-pub-3940256099942544/4411468910',
    },
    rewarded: {
      android: 'ca-app-pub-3940256099942544/5224354917',
      ios: 'ca-app-pub-3940256099942544/1712485313',
    },
    appOpen: {
      android: 'ca-app-pub-3940256099942544/9257390515',
      ios: 'ca-app-pub-3940256099942544/5575463023',
    },
  },

  // Active Ad Units (automatically selects test units in development and production units in release)
  get adUnits() {
    if (this.isTestMode) {
      return {
        banner: this.testUnits.banner,
        interstitial: this.testUnits.interstitial,
        rewarded: this.testUnits.rewarded,
        appOpen: this.testUnits.appOpen,
      };
    }

    return {
      banner: Platform.OS === 'android' ? this.productionUnits.banner.android : this.productionUnits.banner.ios,
      interstitial: Platform.OS === 'android' ? this.productionUnits.interstitial.android : this.productionUnits.interstitial.ios,
      rewarded: Platform.OS === 'android' ? this.productionUnits.rewarded.android : this.productionUnits.rewarded.ios,
      appOpen: Platform.OS === 'android' ? this.productionUnits.appOpen.android : this.productionUnits.appOpen.ios,
    };
  },

  // Compliant Frequency & Cooldown policies
  policies: {
    // Interstitials: Cooldown between showings (in milliseconds)
    interstitialCooldownMs: 120 * 1000, // 2 minutes
    // Max interstitials allowed per 1-hour window
    interstitialMaxPerHour: 3,
    // Minimum user activity/actions required before first interstitial
    actionsBeforeFirstInterstitial: 4,
    // Never show interstitial during critical student actions (timer running, calculation, input)
    forbiddenScreens: ['PomodoroActive', 'CgpaCalculating', 'QuizInProgress'],
  },

  // Rewarded Perks
  rewards: {
    EXTRA_QUIZ: {
      type: 'EXTRA_QUIZ',
      title: 'Bonus Quiz Practice',
      description: 'Unlock an extra 10-question practice set for any subject of your choice.',
      icon: 'school',
    },
    PREMIUM_UNLOCK_24H: {
      type: 'PREMIUM_UNLOCK_24H',
      title: '24-Hour Analytics Unlock',
      description: 'Unlock in-depth study analytics, trends, and unlimited PDF compression for 24 hours.',
      icon: 'insights',
    },
    BONUS_ANALYTICS: {
      type: 'BONUS_ANALYTICS',
      title: 'Advanced Analytics Sprint',
      description: 'Unlock detailed subject-wise mastery curves and productivity reports.',
      icon: 'bar-chart',
    },
  },
};
