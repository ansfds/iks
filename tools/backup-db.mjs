import 'dotenv/config';
import { createConnection } from 'mysql2/promise';
import { databaseOptions } from '../server/database-config.mjs';
import { backupDatabase } from './database-backup.mjs';
let connection;
try {
  const options = databaseOptions(process.env.SOURCE_MYSQL_DATABASE_URL, {});
  if (!['localhost', '127.0.0.1', '::1'].includes(options.host)) throw new Error('Legacy backup is restricted to the local source');
  connection = await createConnection({ ...options, dateStrings: true, bigNumberStrings: true });
  console.log(await backupDatabase(connection));
} catch (error) {
  console.error('Database backup failed:', error.code || 'BACKUP_FAILED');
  process.exitCode = 1;
} finally { if (connection) await connection.end(); }
