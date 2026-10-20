import type { ConnectionOptions } from 'mysql2/promise';
export function databaseOptions(databaseUrl: string | undefined, environment?: Record<string, string | undefined>): ConnectionOptions;
