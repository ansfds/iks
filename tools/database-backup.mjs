import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { escapeId } from 'mysql2';

export async function backupDatabase(connection) {
  const [tables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const backup = { format: 'elwaseet-mysql-backup-v1', generatedAt: new Date().toISOString(), tables: {} };
  const [engines] = await connection.query('SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = \'BASE TABLE\'');
  if (engines.some(row => row.ENGINE !== 'InnoDB')) throw new Error('Backup requires InnoDB tables; use the provider snapshot for other engines.');
  await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
  try {
    for (const table of tables.map(row => Object.values(row)[0])) {
      const [ddl] = await connection.query(`SHOW CREATE TABLE ${escapeId(table)}`);
      const [rows] = await connection.query(`SELECT * FROM ${escapeId(table)}`);
      backup.tables[table] = { createTable: ddl[0]['Create Table'], rows };
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  await mkdir('backups', { recursive: true });
  const filename = path.resolve('backups', `db-${Date.now()}.json`);
  const content = JSON.stringify(backup, null, 2);
  await writeFile(filename, content, { mode: 0o600, flag: 'wx' });
  await writeFile(filename + '.sha256', createHash('sha256').update(content).digest('hex'), { mode: 0o600, flag: 'wx' });
  return filename;
}

// Restore only into an empty, separately created recovery database.
export async function restoreDatabase(connection, filename) {
  const content = await readFile(filename, 'utf8');
  const expected = (await readFile(filename + '.sha256', 'utf8')).trim();
  if (createHash('sha256').update(content).digest('hex') !== expected) throw new Error('Backup checksum mismatch');
  const backup = JSON.parse(content);
  if (backup.format !== 'elwaseet-mysql-backup-v1') throw new Error('Unsupported backup format');
  const [tables] = await connection.query('SHOW TABLES');
  if (tables.length) throw new Error('Restore target must be an empty recovery database');
  for (const entry of Object.values(backup.tables)) await connection.query(entry.createTable);
  await connection.beginTransaction();
  try {
    for (const [table, entry] of Object.entries(backup.tables)) {
      for (const row of entry.rows) {
        const columns = Object.keys(row);
        const values = Object.values(row).map(value => value?.type === 'Buffer' && Array.isArray(value.data) ? Buffer.from(value.data) : value);
        await connection.execute(`INSERT INTO ${escapeId(table)} (${columns.map(escapeId).join(',')}) VALUES (${columns.map(() => '?').join(',')})`, values);
      }
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  return Object.fromEntries(Object.entries(backup.tables).map(([table, entry]) => [table, entry.rows.length]));
}
