import { defineConfig } from 'drizzle-kit';

// Schema generation is offline: it never reads production credentials or connects.
export default defineConfig({ schema: './db/schema.ts', out: './db/migrations', dialect: 'mysql' });
