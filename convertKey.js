import fs from 'fs';

const rawKey = fs.readFileSync('serviceAccountKey.json', 'utf8');
const json = JSON.parse(rawKey);
const privateKey = json.private_key.replace(/\n/g, '\\n');

console.log(`FIREBASE_PRIVATE_KEY="${privateKey}"`);