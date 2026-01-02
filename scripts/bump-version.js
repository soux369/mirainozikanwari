const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appConfigPath = path.join(__dirname, '..', 'app.config.ts');

try {
    // 1. Update package.json (Version)
    const packageJson = require(packageJsonPath);
    const versionParts = packageJson.version.split('.').map(Number);
    if (versionParts.length === 3) {
        versionParts[2] += 1; // Increment patch
        packageJson.version = versionParts.join('.');
    }
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated package.json version to: ${packageJson.version}`);

    // 2. Update app.config.ts (Android versionCode & iOS buildNumber)
    let appConfigContent = fs.readFileSync(appConfigPath, 'utf8');

    // Increment Android versionCode
    appConfigContent = appConfigContent.replace(/versionCode:\s*(\d+)/g, (match, code) => {
        const newCode = parseInt(code) + 1;
        console.log(`Updated Android versionCode to: ${newCode}`);
        return `versionCode: ${newCode}`;
    });

    // Increment iOS buildNumber
    appConfigContent = appConfigContent.replace(/buildNumber:\s*"(\d+)"/g, (match, num) => {
        const newNum = parseInt(num) + 1;
        console.log(`Updated iOS buildNumber to: ${newNum}`);
        return `buildNumber: "${newNum}"`;
    });

    fs.writeFileSync(appConfigPath, appConfigContent);

} catch (error) {
    console.error('Failed to bump version:', error);
    process.exit(1);
}
