const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'version.json');

try {
    const versionData = require(versionFilePath);

    // Increment version code
    versionData.code += 1;

    // Increment patch version in "x.y.z"
    const versionParts = versionData.version.split('.').map(Number);
    if (versionParts.length === 3) {
        versionParts[2] += 1; // Increment patch
        versionData.version = versionParts.join('.');
    }

    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
    console.log(`Updated version to: ${versionData.version} (Build: ${versionData.code})`);

} catch (error) {
    console.error('Failed to bump version:', error);
    process.exit(1);
}
