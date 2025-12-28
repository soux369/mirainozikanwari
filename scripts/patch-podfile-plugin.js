const fs = require('fs');
const path = require('path');

console.log('Running patch-podfile-plugin.js...');

// 1. Patch withPodfile.js
const podfilePluginPath = path.join(
    process.cwd(),
    'node_modules',
    '@bittingz',
    'expo-widgets',
    'plugin',
    'build',
    'ios',
    'withPodfile.js'
);

if (fs.existsSync(podfilePluginPath)) {
    let content = fs.readFileSync(podfilePluginPath, 'utf-8');

    // Check if already patched to avoid double patching
    if (!content.includes('// Patched by script') && !content.includes('Mock result')) {

        // Use Regex to find the variable declaration block:
        // const withAppExtFix = (0, generateCode_1.mergeContents)({ ... });
        const blockRegex = /const\s+withAppExtFix\s*=\s*\([^)]+\)\(\{[\s\S]*?\}\);/;

        if (blockRegex.test(content)) {
            content = content.replace(blockRegex, (match) => {
                return `// Patched by script: commented out
        const withAppExtFix = { contents: podFileContent }; // Mock result
        /* ${match} */`;
            });

            // Replace usage
            content = content.replace(
                /src:\s*withAppExtFix\.contents,/,
                `src: podFileContent, // Patched: use original content`
            );

            fs.writeFileSync(podfilePluginPath, content, 'utf-8');
            console.log('Patched withPodfile.js successfully using RegExp');
        } else {
            console.log('Could not find target code block in withPodfile.js to patch.');
        }
    } else {
        console.log('withPodfile.js already patched');
    }
} else {
    // It's possible the package is not installed or path is different
    console.error('withPodfile.js not found at expected path');
}

// 2. Patch logger.js to silence ALL debug logs globally
const loggerPath = path.join(
    process.cwd(),
    'node_modules',
    '@bittingz',
    'expo-widgets',
    'plugin',
    'build',
    'utils',
    'logger.js'
);

if (fs.existsSync(loggerPath)) {
    let content = fs.readFileSync(loggerPath, 'utf-8');
    // Force showDebug to false regardless of environment
    const target = `this.showDebug = process.env.NODE_ENV?.toLowerCase() === 'development' || false;`;
    const replacement = `this.showDebug = false; // Patched: forced silence`;

    if (content.includes('this.showDebug = process.env.NODE_ENV')) {
        content = content.replace(target, replacement);
        // Also handle cases where whitespace might differ or if it was already patched differently?
        // Let's also do a broader regex just in case
        content = content.replace(/this\.showDebug\s*=\s*process\.env\.NODE_ENV.*?false;/s, replacement);

        fs.writeFileSync(loggerPath, content, 'utf-8');
        console.log('Successfully patched logger.js (GLOBAL SILENCE)');
    } else if (content.includes('Patched: forced silence')) {
        console.log('logger.js already patched');
    } else {
        console.log('Could not match logging logic in logger.js');
    }
} else {
    console.error('logger.js not found at ' + loggerPath);
}
