import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';

// Safe import for Expo Go support
let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;
let isAdMobAvailable = false;
let nativeError: any = null;

try {
    const adMob = require('react-native-google-mobile-ads');
    BannerAd = adMob.BannerAd;
    BannerAdSize = adMob.BannerAdSize;
    TestIds = adMob.TestIds;
    isAdMobAvailable = true;
} catch (e) {
    nativeError = e;
    console.warn("AdMob native module not found.", e);
}

const adUnitId = isAdMobAvailable && (__DEV__)
    ? (TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111') // Default Test ID
    : Platform.select({
        ios: 'ca-app-pub-3270290917997751/5085574557',
        android: 'ca-app-pub-3270290917997751/7481455995',
        default: 'ca-app-pub-3270290917997751/5085574557',
    });

export const AdBanner = () => {
    const [error, setError] = useState<string | boolean>(false);

    if (!isAdMobAvailable) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: 'transparent' }}>
                <Text style={{ fontSize: 10, color: '#ef4444' }}>
                    [AdP Error] {nativeError ? String(nativeError) : "Requires Native Build"}
                </Text>
            </View>
        );
    }

    // Debug Mode: Show error instead of hiding
    if (error) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                <Text style={{ fontSize: 10, color: '#ef4444' }}>
                    [Load Error] {String(error)}
                </Text>
            </View>
        );
    }

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: 'transparent' }}>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={(error) => {
                    console.error('Ad failed to load: ', error);
                    setError(error.message || String(error) || "Failed to load");
                }}
            />
        </View>
    );
};
