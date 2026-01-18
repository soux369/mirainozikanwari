import { ExpoConfig, ConfigContext } from 'expo/config';
import pkg from './package.json';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "みらいの時間割",
    slug: "university-timetable-mobile",
    version: pkg.version,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#FFFFFF"
    },
    assetBundlePatterns: [
        "**/*"
    ],
    ios: {
        supportsTablet: true,
        buildNumber: "53",
        bundleIdentifier: "com.mono0261.universitytimetablemobile",
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
            NSUserTrackingUsageDescription: "広告の関連性を高めるために、ユーザーの行動履歴を使用します。"
        },
        entitlements: {
        }
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/icon.png",
            backgroundColor: "#FFFFFF"
        },
        package: "com.mono0261.universitytimetablemobile",
        permissions: [
            "CAMERA",
            "READ_EXTERNAL_STORAGE",
            "WRITE_EXTERNAL_STORAGE",
            "NOTIFICATIONS",
            "SCHEDULE_EXACT_ALARM",

        ],
        versionCode: 55
    },
    web: {
        favicon: "./assets/favicon.png"
    },
    plugins: [
        "./plugins/withSwiftVersion",
        [
            "expo-camera",
            {
                "cameraPermission": "時間割をスキャンするためにカメラを使用します。"
            }
        ],
        [
            "expo-image-picker",
            {
                "photosPermission": "時間割の画像を読み込むためにフォトライブラリにアクセスします。"
            }
        ],
        "expo-video",

        "@react-native-community/datetimepicker",
        [
            "react-native-google-mobile-ads",
            {
                "androidAppId": "ca-app-pub-3270290917997751~3102586659",
                "iosAppId": "ca-app-pub-3270290917997751~3201647240"
            }
        ],
        [
            "expo-build-properties",
            {
                "android": {
                    "enableProguardInReleaseBuilds": false,
                    "enableShrinkResourcesInReleaseBuilds": false
                },
                "ios": {
                    "useFrameworks": "static"
                }
            }
        ],
        [
            "react-native-android-widget",
            {
                "widgets": [
                    {
                        "name": "TimetableWidget",
                        "label": "今日の時間割",
                        "minWidth": "320dp",
                        "minHeight": "180dp",
                        "description": "今日の授業を表示します",
                        "previewImage": "./assets/widget_timetable_large.jpg",
                        "updatePeriodMillis": 1800000
                    },
                    {
                        "name": "TimetableWidgetSmall",
                        "label": "今日の時間割 (小)",
                        "minWidth": "160dp",
                        "minHeight": "160dp",
                        "description": "今日の授業をコンパクトに表示します",
                        "previewImage": "./assets/widget_timetable_small.jpg",
                        "updatePeriodMillis": 1800000
                    },
                    {
                        "name": "CountdownWidget",
                        "label": "課題カウントダウン",
                        "minWidth": "320dp",
                        "minHeight": "180dp",
                        "description": "提出期限の近い課題を表示します",
                        "previewImage": "./assets/widget_countdown_large.jpg",
                        "updatePeriodMillis": 1800000
                    },
                    {
                        "name": "CountdownWidgetSmall",
                        "label": "課題カウントダウン (小)",
                        "minWidth": "160dp",
                        "minHeight": "160dp",
                        "description": "提出期限の近い課題をコンパクトに表示します",
                        "previewImage": "./assets/widget_countdown_small.jpg",
                        "updatePeriodMillis": 1800000
                    }
                ]
            }
        ],
        [
            "@bittingz/expo-widgets",
            {
                "ios": {
                    "src": "widgets/ios",
                    "mode": "production"
                }
            }
        ]
    ],
    extra: {
        eas: {
            projectId: "3ad63ff1-5cc8-45aa-aae4-81461d8e5d9f"
        }
    }
});
// End of file
