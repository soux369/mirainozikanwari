import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useSubscription } from '../context/SubscriptionContext';

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
    const { isPremium } = useSubscription();
    const [error, setError] = useState<string | boolean>(false);
    const [requestNpa, setRequestNpa] = useState<boolean>(true);

    useEffect(() => {
        const checkPermission = async () => {
            if (Platform.OS === 'ios') {
                const { status } = await getTrackingPermissionsAsync();
                // If granted, we can serve personalized ads (npa=false).
                // Otherwise (denied, restricted, undetermined), stick to npa=true.
                setRequestNpa(status !== 'granted');
            } else {
                // Android/Other: Default to personalized unless specific logic exists
                setRequestNpa(false);
            }
        };
        checkPermission();
    }, []);

    if (isPremium) {
        return null;
    }

    if (!isAdMobAvailable) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: 'transparent' }}>
                <Text style={{ fontSize: 10, color: '#ef4444' }}>
                    [AdP Error] {nativeError ? String(nativeError) : "Requires Native Build"}
                </Text>
            </View>
        );
    }

    // Debug Mode: Show error only in DEV
    if (error) {
        if (__DEV__) {
            return (
                <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                    <Text style={{ fontSize: 10, color: '#ef4444' }}>
                        [Load Error] {String(error)}
                    </Text>
                </View>
            );
        }
        return null; // Hide completely in production
    }

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: 'transparent' }}>
            <BannerAd
                key={`banner-${requestNpa}`} // Re-mount if NPA status changes
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: requestNpa,
                }}
                onAdFailedToLoad={(error) => {
                    console.error('Ad failed to load: ', error);
                    setError(error.message || String(error) || "Failed to load");
                }}
            />
        </View>
    );
};
