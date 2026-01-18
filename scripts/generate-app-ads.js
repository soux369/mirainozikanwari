const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../app.config.ts');
const outputPath = path.join(__dirname, '../website/app-ads.txt');

try {
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Extract Publisher ID (pub-xxxxxxxxxxxxxxxx) from androidAppId or iosAppId
    // Format: ca-app-pub-3270290917997751~3102586659
    const match = configContent.match(/ca-app-(pub-\d+)/);

    if (match && match[1]) {
        const publisherId = match[1];
        const content = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;

        // Ensure website directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, content);
        console.log(`Successfully generated app-ads.txt for ${publisherId}`);
    } else {
        console.error('Could not find AdMob App ID in app.config.ts');
        process.exit(1);
    }
} catch (error) {
    console.error('Error generating app-ads.txt:', error);
    process.exit(1);
}
