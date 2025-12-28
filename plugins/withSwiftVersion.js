const { withXcodeProject } = require('expo/config-plugins');

const withSwiftVersion = (config) => {
    return withXcodeProject(config, async (config) => {
        const xcodeProject = config.modResults;
        const pbxProjectSection = xcodeProject.pbxProjectSection();
        const projectUuid = Object.keys(pbxProjectSection)
            .filter(id => id.indexOf('comment') === -1)[0];

        const project = pbxProjectSection[projectUuid];

        // Iterate through all build configurations (Debug, Release, etc.)
        const configurations = xcodeProject.pbxXCBuildConfigurationSection();

        for (const key in configurations) {
            const config = configurations[key];
            // Ensure we are modifying build settings
            if (config.buildSettings) {
                // Set Swift Version to 5.4
                config.buildSettings.SWIFT_VERSION = '5.4';
            }
        }

        return config;
    });
};

module.exports = withSwiftVersion;
