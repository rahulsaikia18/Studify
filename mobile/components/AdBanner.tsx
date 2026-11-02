import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdConfig } from '../constants/AdConfig';
import { useThemeStore } from '../stores/themeStore';
import { Ionicons } from '@expo/vector-icons';
import { isNativeAdMobSupported } from '../services/AdManager';

interface AdBannerProps {
  placement?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement = 'Dashboard' }) => {
  const { colors, isDark } = useThemeStore();
  const [adFailed, setAdFailed] = useState(false);

  if (adFailed) {
    return null;
  }

  // Only attempt native BannerAd when RNGoogleMobileAdsModule is actually linked in the native binary
  if (isNativeAdMobSupported()) {
    try {
      const GoogleMobileAds = require('react-native-google-mobile-ads');
      if (GoogleMobileAds && GoogleMobileAds.BannerAd) {
        const { BannerAd, BannerAdSize, TestIds } = GoogleMobileAds;
        const adUnitId = AdConfig.isTestMode ? TestIds.ADAPTIVE_BANNER : (AdConfig.adUnits.banner || TestIds.ADAPTIVE_BANNER);

        return (
          <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F1F5F9' }]}>
            <View style={styles.adBadgeContainer}>
              <Text style={styles.adBadgeText}>SPONSORED</Text>
            </View>
            <BannerAd
              unitId={adUnitId}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdFailedToLoad={(err: any) => {
                console.log(`[AdMob Banner] Failed on ${placement}:`, err);
                setAdFailed(true);
              }}
            />
          </View>
        );
      }
    } catch (e) {
      // Graceful fallback to simulator container
    }
  }

  // Graceful compliant simulator placeholder for Expo Go & Web
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#161F30' : '#EFF6FF', borderColor: isDark ? '#2A364F' : '#BFDBFE' }]}>
      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={16} color="#3B82F6" />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.adBadge}>AD • Google AdMob Test</Text>
            <Text style={[styles.adPlacement, { color: isDark ? '#94A3B8' : '#64748B' }]}>{placement}</Text>
          </View>
          <Text style={[styles.adTitle, { color: colors.text }]}>Study Smarter with Student Buddy Pro</Text>
          <Text style={[styles.adSub, { color: colors.textMuted }]}>Compliant adaptive banner slot • Zero navigation overlap</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adBadgeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  adBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  adPlacement: {
    fontSize: 10,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  adSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
