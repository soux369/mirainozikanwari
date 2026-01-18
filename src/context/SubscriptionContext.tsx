import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { PurchasesPackage, PurchasesEntitlementInfo, PurchasesOffering } from 'react-native-purchases';
import PurchasesUI from 'react-native-purchases-ui';

// Specific Configuration provided by user
const REVENUECAT_CONFIG = {
    apiKey: 'appl_CbUvztRxCondUASjOGCZgBUURPD',
    entitlementId: 'みらいの時間割 Pro',
};

interface SubscriptionContextType {
    isPremium: boolean;
    isInitializing: boolean;
    packages: PurchasesPackage[];
    purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
    restorePurchases: () => Promise<boolean>;
    presentPaywall: () => Promise<void>;
    presentCustomerCenter: () => Promise<void>;
    presentCodeRedemptionSheet: () => Promise<void>;
    debugLogs: string[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);

    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setDebugLogs(prev => [new Date().toLocaleTimeString() + ': ' + message, ...prev].slice(0, 20));
        console.log("RC_DEBUG:", message);
    };

    const loadOfferings = async () => {
        try {
            addLog("Fetching Offerings...");
            const offerings = await Purchases.getOfferings();
            addLog("Offerings fetched.");
            // console.log("DEBUG: Offerings loaded:", JSON.stringify(offerings, null, 2));

            if (offerings.current !== null) {
                addLog(`Current Offering: ${offerings.current.identifier}`);
                // console.log("DEBUG: Current offering found:", offerings.current.identifier);
                setCurrentOffering(offerings.current);
                if (offerings.current.availablePackages.length !== 0) {
                    addLog(`Packages found: ${offerings.current.availablePackages.length}`);
                    offerings.current.availablePackages.forEach(p =>
                        addLog(`- Pkg: ${p.identifier} / Prod: ${p.product.identifier}`)
                    );
                    setPackages(offerings.current.availablePackages);
                } else {
                    addLog("WARNING: Current offering has 0 packages.");
                    // console.warn("DEBUG: Current offering has NO packages.");
                }
            } else {
                addLog("WARNING: No 'Current' offering found.");
                addLog("Available Offerings: " + Object.keys(offerings.all).join(", "));
                // console.warn("DEBUG: No current offering found in RevenueCat response.");
            }
        } catch (e: any) {
            addLog("Load Offerings Error: " + e.message);
            // console.warn("Failed to load offerings", e);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                addLog("Initializing RevenueCat...");
                // Configure Purchases
                await Purchases.configure({ apiKey: REVENUECAT_CONFIG.apiKey });

                // Check Subscription Status
                const customerInfo = await Purchases.getCustomerInfo();
                addLog("Customer ID: " + customerInfo.originalAppUserId);
                updatePremiumStatus(customerInfo.entitlements.active);

                // Load Offerings
                await loadOfferings();

                // Listen for updates
                Purchases.addCustomerInfoUpdateListener((info) => {
                    updatePremiumStatus(info.entitlements.active);
                });

            } catch (e: any) {
                addLog("Init failed: " + e.message);
                console.warn('Subscription init failed:', e);
            } finally {
                setIsInitializing(false);
            }
        };

        init();
    }, []);

    const updatePremiumStatus = (activeEntitlements: { [key: string]: PurchasesEntitlementInfo }) => {
        // Use the specific Entitlement ID
        const isActive = !!activeEntitlements[REVENUECAT_CONFIG.entitlementId];
        setIsPremium(isActive);
        addLog(`Premium Status: ${isActive ? 'Active' : 'Inactive'}`);
    };

    const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
        try {
            addLog(`Purchasing package: ${pkg.identifier}`);
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            if (customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId]) {
                setIsPremium(true);
                return true;
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                addLog("Purchase Failed: " + e.message);
                console.error('Purchase failed:', e);
                Alert.alert("購入エラー", e.message);
            } else {
                addLog("Purchase Cancelled by user");
            }
        }
        return false;
    };

    const restorePurchases = async (): Promise<boolean> => {
        try {
            addLog("Restoring purchases...");
            const customerInfo = await Purchases.restorePurchases();
            if (customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId]) {
                setIsPremium(true);
                Alert.alert("復元完了", "購入情報の復元に成功しました。");
                return true;
            } else {
                Alert.alert("復元失敗", "有効な購入情報が見つかりませんでした。");
                addLog("Restore finished but no active entitlement.");
            }
        } catch (e: any) {
            addLog("Restore Error: " + e.message);
            console.error('Restore failed:', e);
            Alert.alert("エラー", "復元中にエラーが発生しました: " + e.message);
        }
        return false;
    };

    const presentPaywall = async () => {
        try {
            addLog("Attempting to present Paywall...");
            // Ensure we have an offering to show
            let targetOffering = currentOffering;
            if (!targetOffering) {
                addLog("Target offering is null. Retrying fetch...");
                const offerings = await Purchases.getOfferings();
                if (offerings.current) {
                    targetOffering = offerings.current;
                    setCurrentOffering(offerings.current);
                }
            }

            if (targetOffering) {
                addLog(`Presenting Paywall for: ${targetOffering.identifier}`);
                // Explicitly pass the offering to avoid ambiguity
                const result = await PurchasesUI.presentPaywall({ offering: targetOffering });
                addLog(`Paywall Result: ${result}`);
                // console.log('Paywall result:', result);
            } else {
                addLog("ERROR: Still no offering to show.");
                Alert.alert(
                    "準備中",
                    "現在、購入可能なプランが見つかりませんでした。設定を確認してください。\n(Error: No Current Offering)"
                );
                // Try reloading for next time
                loadOfferings();
                return;
            }

            // Re-check status just in case
            const customerInfo = await Purchases.getCustomerInfo();
            updatePremiumStatus(customerInfo.entitlements.active);
        } catch (e: any) {
            addLog(`Paywall Error Code: ${e.code}`);
            addLog(`Paywall Error Msg: ${e.message}`);
            console.error('Paywall error:', e);
            Alert.alert("エラー", `課金画面の表示に失敗しました。\nCode: ${e.code}\nMessage: ${e.message}`);
        }
    };

    const presentCustomerCenter = async () => {
        try {
            addLog("Presenting Customer Center");
            await PurchasesUI.presentCustomerCenter();
        } catch (e: any) {
            addLog("Customer Center Error: " + e.message);
            console.error('Customer Center error:', e);
        }
    };

    const presentCodeRedemptionSheet = async () => {
        if (Platform.OS === 'ios') {
            try {
                addLog("Presenting Code Redemption Sheet");
                await Purchases.presentCodeRedemptionSheet();
            } catch (e: any) {
                addLog("Redemption Sheet Error: " + e.message);
                console.error('Redemption Sheet error:', e);
            }
        } else {
            Alert.alert("Android", "Playストアアプリの「お支払いと定期購入」>「ギフトコードの利用」から入力してください。");
        }
    }

    return (
        <SubscriptionContext.Provider value={{
            isPremium,
            isInitializing,
            packages,
            purchasePackage,
            restorePurchases,
            presentPaywall,
            presentCustomerCenter,
            presentCodeRedemptionSheet,
            debugLogs // Export logs
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
