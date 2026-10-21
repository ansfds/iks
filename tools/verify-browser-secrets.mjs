import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const names = ['CMS_GITHUB_TOKEN', 'CMS_VERCEL_TOKEN', 'ADMIN_PASSWORD_HASH', 'ADMIN_SESSION_SECRET', 'TURNSTILE_SECRET_KEY'];
const values = names.map(name => process.env[name]).filter(value => value && value.length >= 12);
let checked = 0;
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (/\.(js|css|html|json|map)$/i.test(entry.name)) {
      const content = await readFile(file, 'utf8');
      if (names.some(name => content.includes(name)) || values.some(value => content.includes(value)) || /(github_pat_[A-Za-z0-9_]{20,}|ghp_[A-Za-z0-9]{20,})/.test(content)) {
        // Only the file path is printed; never the matched secret or excerpt.
        throw new Error(`Server credential reference found in browser artifact: ${file}`);
      }
      checked++;
    }
  }
}
try {
  await scan('dist/public');
  console.log(`Browser secret check passed: ${checked} files; no server secret names, configured values or GitHub token patterns.`);
} catch (error) {
  console.error(error.code || error.message);
  process.exitCode = 1;
}
