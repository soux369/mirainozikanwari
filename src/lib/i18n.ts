export const translations = {
    ja: {
        // App / Tabs
        schedule: '予定',
        timetable: '時間割',
        settings: '設定',

        // Settings Sections
        term: '学期',
        display: '表示',
        timeDetails: '時間詳細',
        general: '全般',
        beta: 'ベータ機能',
        danger: '危険な操作',

        // Settings Labels
        currentTerm: '現在の学期',
        maxPeriods: '最大時限数',
        visibleDays: '表示する曜日',
        firstPeriodStart: '1限開始',
        thirdPeriodStart: '3限開始',
        classDuration: '授業時間 (分)',
        breakDuration: '休憩時間 (分)',
        backgroundImage: '背景画像',
        selectImage: '画像を選択',
        darkMode: 'ダークモード',
        systemFont: '端末のフォント (標準)',
        language: '言語 (Language)',

        // Buttons
        save: '保存',
        cancel: 'キャンセル',
        delete: '削除',
        ok: 'OK',

        // NextClassView
        todaySchedule: '今日の予定',
        tomorrowSchedule: '明日の予定',
        yesterdaySchedule: '昨日の予定',
        scheduleFor: 'の予定',
        noSchedule: '予定はありません',
        goodTime: '有意義な時間を過ごしましょう！',
        assignments: '課題',
        deadline: '期限',
        todo: '未完了の課題',
        holiday: '休日',
        periodSuffix: '限',
        roomUndecided: '教室未定',
        detectedCourses: '検出された授業',
        selectCoursesToAdd: '追加する授業を選択してください',
        addWithCount: (count: number) => `追加する (${count})`,

        // Greeting
        goodMorning: 'おはようございます',
        hello: 'こんにちは',
        goodEvening: 'こんばんは',

        // Settings - Notifications
        notifications: '通知',
        enableNotifications: '通知を有効にする',
        holidaySettings: '休暇期間設定 (通知OFF)',
        holidayDescription: '指定した期間は通知がスキップされます',
        enableHoliday: '休暇期間を有効にする',
        startDate: '開始日',
        endDate: '終了日',
        clearSettings: '設定を解除',
        firstClassNotify: '最初の授業 (分前)',
        otherClassNotify: 'その他の授業 (分前)',
        sendTestNotification: '通知をテスト送信する',
        testNotificationDone: '送信完了',
        testNotificationMessage: '5秒後にテスト通知が届きます。\n届かない場合は本体の通知設定を確認してください。',

        // Settings - Data Sharing
        dataSharing: 'データ共有',
        shareTimetable: '時間割を共有',
        shareQrDescription: 'QRコードで友達に送る',
        friendsTimetable: '友達の時間割',
        friendsTimetableDescription: '保存した友達の時間割を見る',
        importTimetable: '時間割を読み込む',
        importDescription: 'QRコードまたは画像から',
        swipeNavigation: '画面スワイプでタブ切り替え',
        swipeNavigationDescription: 'OFFにすると、左右スワイプでの画面移動が無効になります。',
        friendNameTitle: '友達の名前',
        friendNameSubtitle: 'この時間割の持ち主の名前を入力してください',
        namePlaceholder: '名前',

        // Settings - Appearance
        appearance: '外観',
        backgroundTheme: '背景色テーマ',
        backgroundImageDescription: '※選択画面の枠内がそのまま背景になります',
        change: '変更',
        select: '選択',

        // Settings - Fonts
        fonts: 'フォント',

        // Settings - Beta
        betaDisclaimer: 'この機能はテスト版です。OSの制限により、正しく動作しない場合があります。',
        adDebug: 'AdMob デバッグ',
        adDebugDescription: 'デバイスIDの確認・登録',

        // Settings - Danger
        deleteAllData: '全データを削除',
        deleteConfirmTitle: '確認',
        deleteConfirmMessage: '現在の学期の授業データを全て削除しますか？\nこの操作は元に戻せません。',
        deleteDoneTitle: '削除完了',
        deleteDoneMessage: '削除しました',

        // Settings - Support/Legal
        legal: '規約',
        privacyPolicy: 'プライバシーポリシー',

        // Pro Plan (Subscription)
        proPlanSection: 'プロプラン',
        proPlanStatusActive: 'プロプラン加入中',
        proPlanDescriptionActive: '全てのプロ機能が有効です。ありがとうございます！',
        proPlanDescriptionInactive: '広告の削除、追加テーマ、無制限のメディア添付が利用可能になります。',
        viewDetails: '詳細を見る',
        manageSubscription: '管理',
        restorePurchases: '購入を復元する',
        redeemCode: 'ギフトコードを使う',
        loadingInfo: '情報の取得中',
        loadingInfoMessage: 'ショップ情報を読み込んでいます。しばらくしてから再度お試しください。',

        // Vision / OCR
        error: 'エラー',
        detectionError: '授業を検出できませんでした(AI)',
        visionBusyTitle: '処理が混雑しています',
        visionBusyMessage: '別の画像認識処理が実行中です。しばらく待ってからもう一度お試しください。',
        visionBusyLocalMessage: '画像認識処理が実行中です。完了するまでお待ちください。',
        tryAgain: 'もう一度試す',
        apiError: 'APIエラーが発生しました。しばらくした後にお試しください',
        confirm: '確認',
        startAiAnalysis: 'AI解析を開始します',
        close: '閉じる',
        failedToLoadImage: '画像の読み込みに失敗しました',
        selectImageTitle: '画像の選択',
        pickTimetableMessage: '時間割を取り込みますか？',
        takePhoto: '写真を撮る',
        pickFromGallery: 'ギャラリーから選ぶ',
        permissionRestricted: '制限事項',
        cameraPermissionDenied: 'カメラへのアクセスが許可されていません。設定から許可してください。',
        galleryPermissionDenied: 'ギャラリーへのアクセスが許可されていません。設定から許可してください。',

        // Course Detail
        deleteAssignment: '課題の削除',
        deleteAssignmentConfirm: (title: string) => `「${title}」を削除しますか？`,
        deleteImage: '画像の削除',
        deleteImageConfirm: 'この画像を削除しますか？',
        imageLimitReached: (limit: number) => `無料版では1つの授業につき${limit}枚まで画像を添付できます。無制限に添付するにはプロプランをご検討ください。`,

        // Common Labels
        courseName: '授業名',
        professor: '教員',
        room: '教室',
        courseCode: '授業コード (5桁)',
        notes: 'メモ',
        syllabus: 'シラバス',
        attendance: '出席',
        absent: '欠席',
        late: '遅刻',
        cancelled: '休講',
        add: '追加',
        edit: '編集',
        courseRequired: '授業名、曜日、時限は必須です',
        deleteConfirm: '本当に削除しますか？',
        basicInfo: '基本情報',
        timetableInfo: '時間割',
        detailedInfo: '詳細情報',
        themeColor: 'テーマカラー',
        saveAction: '保存する',
        courseNamePlaceholder: '授業名 (必須)',
        placeholderProfessor: '教員',
        placeholderRoom: '教室',
        placeholderCourseCode: 'コード',
        placeholderSyllabus: 'シラバスURL',

        // Friends
        friendImportSuccess: (name: string) => `${name}さんの時間割を保存しました`,
        noFriends: '友達がいません',
        noFriendsDescription: '友達の時間割をQRコードや画像から読み込んで保存できます。',
        addFriend: '友達を追加する',
        classesRegistered: (count: number) => `${count} 授業登録済み`,
        deleteFriendSpecific: (name: string) => `${name}を削除しますか？`,

        // Import
        importData: 'データの読み込み',
        coursesFound: (count: number) => `${count}件の授業が見つかりました。\nどのように保存しますか？`,
        saveAsFriendAction: '友達として保存',
        overwriteSelfAction: '自分のに上書き',
        importError: 'データの解析に失敗しました。形式を確認してください。',

        // Share
        text: 'テキスト',
        file: 'ファイル',
        qrCode: 'QRコード',
        scanInstruction: '相手の「読み込み」→「スキャン」で読み取ってください',
        tooManyCourses: '授業数が多すぎます',
        qrLimitInstruction: (now: number) => `15件以内に減らしてください\n(現在: ${now}件)`,
        selectCourses: '授業を選択してください',
        selectedCount: (count: number) => `${count}件選択中`,
        selectCoursesWithCount: (selected: number, total: number) => `授業を選択 (${selected}/${total})`,
        selectAll: '全選択',
        deselectAll: '全解除',
        shareAsFile: 'ファイルとして共有',
        shareAsText: 'テキストとして共有',
        shareDataTitle: '時間割データ',
        shareError: '共有に失敗しました',
        selectCoursesError: '共有する授業を選択してください',
        shareFileError: 'ファイルの生成または共有に失敗しました',

        // Friend Detail
        friendTimetableTitle: (name: string) => `${name}の時間割`,
        classesCount: (count: number) => `${count} 授業`,

        // Term Selection
        termSelectAdd: '学期を選択 / 追加',
        newTermPlaceholder: '新しい学期名 (例: 2028-Spring)',
        cannotDeleteTerm: '削除できません',
        atLeastOneTermRequired: '少なくとも一つの学期が必要です。',
        cannotDeleteActiveTerm: '現在選択中の学期は削除できません。',
        deleteTermTitle: '学期を削除',
        deleteTermConfirm: 'この学期を削除しますか？\n(授業データもアクセスできなくなりますが、データ自体は残ります)',

        // Settings - Misc
        premiumFunction: 'プロ機能',
        premiumThemeOnly: 'このテーマはプロプラン限定です。詳細をご確認ください。',
        premiumFontOnly: 'このフォントはプロプラン限定です。詳細をご確認ください。',
        backgroundImageDelete: '背景画像を削除しますか？',
        done: '完了',
        imageSetDone: '背景画像を設定しました。',
        imageDeleteDone: '背景画像を削除しました。',
        customPeriodSettings: '授業時間の個別設定',
        customPeriodDescriptionCommon: '共通の時限を個別に設定します。',
        customPeriodDescriptionDay: (day: string) => `${day}曜日の時限を個別に設定します。(未設定の場合は共通設定が適用されます)`,
        minutes: '分',
        customPeriodDone: '授業時間を個別に設定しました。',
        lateCountSetting: '遅刻カウント設定',
        lateCountDescription: '何回遅刻で1回欠席扱いにするか',
        common: '共通',

        // Days
        Mon: '月',
        Tue: '火',
        Wed: '水',
        Thu: '木',
        Fri: '金',
        Sat: '土',
    },
    en: {
        // App / Tabs
        schedule: 'Schedule',
        timetable: 'Timetable',
        settings: 'Settings',

        // Settings Sections
        term: 'Term',
        display: 'Display',
        timeDetails: 'Time Details',
        general: 'General',
        beta: 'Beta Features',
        danger: 'Danger Zone',

        // Settings Labels
        currentTerm: 'Current Term',
        maxPeriods: 'Max Periods',
        visibleDays: 'Visible Days',
        firstPeriodStart: '1st Period Start',
        thirdPeriodStart: '3rd Period Start',
        classDuration: 'Duration (min)',
        breakDuration: 'Break (min)',
        backgroundImage: 'Background Image',
        selectImage: 'Select Image',
        darkMode: 'Dark Mode',
        systemFont: 'System Font',
        language: 'Language',

        // Buttons
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        ok: 'OK',

        // NextClassView
        todaySchedule: "Today's Schedule",
        tomorrowSchedule: "Tomorrow's Schedule",
        yesterdaySchedule: "Yesterday's Schedule",
        scheduleFor: "Schedule",
        noSchedule: 'No classes today',
        goodTime: 'Have a great day!',
        assignments: 'Assignments',
        deadline: 'Due',
        todo: 'To-Do',
        holiday: 'Holiday',
        periodSuffix: '',
        roomUndecided: 'Room TBD',
        detectedCourses: 'Detected Courses',
        selectCoursesToAdd: 'Select courses to add',
        addWithCount: (count: number) => `Add (${count})`,
        friendNameTitle: 'Friend\'s Name',
        friendNameSubtitle: 'Please enter the name of this timetable\'s owner',
        namePlaceholder: 'Name',

        // Greeting
        goodMorning: 'Good Morning',
        hello: 'Hello',
        goodEvening: 'Good Evening',

        // Settings - Notifications
        notifications: 'Notifications',
        enableNotifications: 'Enable Notifications',
        holidaySettings: 'Holiday Settings (Mute)',
        holidayDescription: 'Notifications will be skipped during this period',
        enableHoliday: 'Enable Holiday Mode',
        startDate: 'Start Date',
        endDate: 'End Date',
        clearSettings: 'Clear Settings',
        firstClassNotify: 'First Class (min before)',
        otherClassNotify: 'Other Classes (min before)',
        sendTestNotification: 'Send Test Notification',
        testNotificationDone: 'Sent',
        testNotificationMessage: 'Test notification will arrive in 5 seconds.\nCheck system settings if not received.',

        // Settings - Data Sharing
        dataSharing: 'Data Sharing',
        shareTimetable: 'Share Timetable',
        shareQrDescription: 'Share via QR Code',
        friendsTimetable: "Friend's Timetable",
        friendsTimetableDescription: "View saved friend's timetables",
        importTimetable: 'Import Timetable',
        importDescription: 'From QR Code or Image',
        swipeNavigation: 'Swipe Navigation',
        swipeNavigationDescription: 'Disable to prevent swiping between tabs.',

        // Settings - Appearance
        appearance: 'Appearance',
        backgroundTheme: 'Background Theme',
        backgroundImageDescription: '*The selection area will be used as background',
        change: 'Change',
        select: 'Select',

        // Settings - Fonts
        fonts: 'Fonts',

        // Settings - Beta
        betaDisclaimer: 'This is a beta feature. It may not work correctly due to OS limitations.',
        adDebug: 'AdMob Debug',
        adDebugDescription: 'Check/Register Device ID',

        // Settings - Danger
        deleteAllData: 'Delete All Data',
        deleteConfirmTitle: 'Confirm',
        deleteConfirmMessage: 'Are you sure you want to delete all course data for the current term?\nThis cannot be undone.',
        deleteDoneTitle: 'Deleted',
        deleteDoneMessage: 'Deleted successfully',

        // Settings - Support/Legal
        legal: 'Legal',
        privacyPolicy: 'Privacy Policy',

        // Pro Plan (Subscription)
        proPlanSection: 'Pro Plan',
        proPlanStatusActive: 'Pro Plan Active',
        proPlanDescriptionActive: 'All Pro features are active. Thank you!',
        proPlanDescriptionInactive: 'Remove ads, unlock themes, and unlimited media attachments.',
        viewDetails: 'View Details',
        manageSubscription: 'Manage',
        restorePurchases: 'Restore Purchases',
        redeemCode: 'Redeem Code',
        loadingInfo: 'Loading Info',
        loadingInfoMessage: 'Loading shop information. Please try again in a moment.',

        // Vision / OCR
        error: 'Error',
        detectionError: 'Could not detect classes (AI)',
        visionBusyTitle: 'Process Busy',
        visionBusyMessage: 'Another image recognition process is running. Please wait and try again.',
        visionBusyLocalMessage: 'Image recognition is in progress. Please wait until it completes.',
        tryAgain: 'Try Again',
        apiError: 'An API error occurred. Please try again later.',
        confirm: 'Confirm',
        startAiAnalysis: 'Start AI Analysis',
        close: 'Close',
        failedToLoadImage: 'Failed to load image',
        selectImageTitle: 'Select Image',
        pickTimetableMessage: 'Would you like to import the timetable?',
        takePhoto: 'Take Photo',
        pickFromGallery: 'Pick from Gallery',
        permissionRestricted: 'Permissions',
        cameraPermissionDenied: 'Camera access is not allowed. Please enable it in settings.',
        galleryPermissionDenied: 'Gallery access is not allowed. Please enable it in settings.',

        // Course Detail
        deleteAssignment: 'Delete Assignment',
        deleteAssignmentConfirm: (title: string) => `Delete "${title}"?`,
        deleteImage: 'Delete Image',
        deleteImageConfirm: 'Delete this image?',
        imageLimitReached: (limit: number) => `Free version allows up to ${limit} images per class. Consider Pro Plan for unlimited attachments.`,

        // Common Labels
        courseName: 'Course Name',
        professor: 'Professor',
        room: 'Room',
        courseCode: 'Course Code (5 digits)',
        notes: 'Notes',
        syllabus: 'Syllabus',
        attendance: 'Attendance',
        absent: 'Absent',
        late: 'Late',
        cancelled: 'Cancelled',
        add: 'Add',
        edit: 'Edit',
        courseRequired: 'Course name, day, and period are required',
        deleteConfirm: 'Are you sure you want to delete this?',
        basicInfo: 'Basic Info',
        timetableInfo: 'Timetable',
        detailedInfo: 'Detailed Info',
        themeColor: 'Theme Color',
        saveAction: 'Save',
        courseNamePlaceholder: 'Course Name (Required)',
        placeholderProfessor: 'Professor',
        placeholderRoom: 'Room',
        placeholderCourseCode: 'Code',
        placeholderSyllabus: 'Syllabus URL',

        // Friends
        friendImportSuccess: (name: string) => `Saved ${name}'s timetable`,
        noFriends: 'No Friends',
        noFriendsDescription: 'You can import and save friends\' timetables from QR codes or images.',
        addFriend: 'Add Friend',
        classesRegistered: (count: number) => `${count} classes registered`,
        deleteFriendSpecific: (name: string) => `Delete ${name}?`,

        // Import
        importData: 'Import Data',
        coursesFound: (count: number) => `Found ${count} classes.\nHow would you like to save them?`,
        saveAsFriendAction: 'Save as Friend',
        overwriteSelfAction: 'Overwrite My Schedule',
        importError: 'Failed to parse data. Please check the format.',

        // Share
        text: 'Text',
        file: 'File',
        qrCode: 'QR Code',
        scanInstruction: 'Ask the other person to "Import" -> "Scan"',
        tooManyCourses: 'Too Many Classes',
        qrLimitInstruction: (now: number) => `Please reduce to 15 or fewer\n(Current: ${now})`,
        selectCourses: 'Please select classes',
        selectedCount: (count: number) => `${count} selected`,
        selectCoursesWithCount: (selected: number, total: number) => `Select Classes (${selected}/${total})`,
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        shareAsFile: 'Share as File',
        shareAsText: 'Share as Text',
        shareDataTitle: 'Timetable Data',
        shareError: 'Failed to share',
        selectCoursesError: 'Please select classes to share',
        shareFileError: 'Failed to generate or share file',

        // Friend Detail
        friendTimetableTitle: (name: string) => `${name}'s Timetable`,
        classesCount: (count: number) => `${count} classes`,

        // Term Selection
        termSelectAdd: 'Select / Add Term',
        newTermPlaceholder: 'New term label (e.g., 2028-Spring)',
        cannotDeleteTerm: 'Cannot Delete',
        atLeastOneTermRequired: 'At least one term is required.',
        cannotDeleteActiveTerm: 'The active term cannot be deleted.',
        deleteTermTitle: 'Delete Term',
        deleteTermConfirm: 'Are you sure you want to delete this term?\n(You will not be able to access its course data, but the data will not be destroyed)',

        // Settings - Misc
        premiumFunction: 'Pro Feature',
        premiumThemeOnly: 'This theme is for Pro Plan only. Please check the details.',
        premiumFontOnly: 'This font is for Pro Plan only. Please check the details.',
        backgroundImageDelete: 'Are you sure you want to delete the background image?',
        done: 'Done',
        imageSetDone: 'Background image set.',
        imageDeleteDone: 'Background image deleted.',
        customPeriodSettings: 'Custom Period Times',
        customPeriodDescriptionCommon: 'Set custom times for each period.',
        customPeriodDescriptionDay: (day: string) => `Set custom times for ${day}. (Global settings apply if not set)`,
        minutes: 'min',
        customPeriodDone: 'Custom period times saved.',
        lateCountSetting: 'Late Count Setting',
        lateCountDescription: 'How many lates equal one absence',
        common: 'Common',

        // Days
        Mon: 'Mon',
        Tue: 'Tue',
        Wed: 'Wed',
        Thu: 'Thu',
        Fri: 'Fri',
        Sat: 'Sat',
    }
};

export type LanguageCode = keyof typeof translations;
