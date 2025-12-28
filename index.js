import { registerRootComponent } from 'expo';
// Widget imports removed for Expo Go compatibility
// import { registerWidgetTaskHandler } from 'react-native-android-widget';
// import { widgetTaskHandler } from './src/widgets/android/widget-task-handler';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// registerWidgetTaskHandler(widgetTaskHandler);
try {
    // Only load widget task handler if not in Expo Go (or try/catch it)
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/widgets/android/widget-task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
} catch (e) {
    console.log("Skipping widget task handler (likely in Expo Go):", e.message);
}
