const fs = require('fs');
const path = require('path');

const secretsPath = path.join(__dirname, '../src/secrets.ts');

// On EAS, we want to generate the file using the Env Var.
// If the file already exists (Local dev), we leave it alone (or overwrite if we want consistency).
// Since EAS cleans the directory, it likely won't exist.

const content = `export const SECURE_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';`;

console.log('Generating src/secrets.ts for EAS Build...');
fs.writeFileSync(secretsPath, content);
console.log('Done.');
