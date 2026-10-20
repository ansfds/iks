import { describe, expect, it } from 'vitest';
import { databaseOptions } from './database-config.mjs';
describe('hosted MySQL configuration', () => {
  it('requires verified TLS for remote connections and ignores unsafe URL flags', () => {
    const options = databaseOptions('mysql://owner:p%40ss@mysql.example:25060/elwaseet_production?ssl=false&multipleStatements=true', { DATABASE_SSL_CA: 'certificate\\nbody' });
    expect(options.ssl).toEqual({ rejectUnauthorized: true, minVersion: 'TLSv1.2', ca: 'certificate\nbody' });
    expect(options.password).toBe('p@ss');
    expect(options.multipleStatements).toBeUndefined();
  });
  it('keeps local development usable without TLS', () => {
    expect(databaseOptions('mysql://local@127.0.0.1/elwaseet_dev', {}).ssl).toBeUndefined();
  });
  it('refuses a production configuration in preview and a mismatched database', () => {
    const url = 'mysql://owner@mysql.example/elwaseet_production';
    expect(() => databaseOptions(url, { VERCEL_ENV: 'preview', DATABASE_ENV: 'production' })).toThrow('DATABASE_ENV');
    expect(() => databaseOptions(url, { VERCEL_ENV: 'preview', DATABASE_ENV: 'preview', DATABASE_NAME: 'elwaseet_preview' })).toThrow('DATABASE_NAME');
    expect(() => databaseOptions('mysql://local@localhost/elwaseet_preview', { VERCEL_ENV: 'preview', DATABASE_ENV: 'preview', DATABASE_NAME: 'elwaseet_preview' })).toThrow('hosted');
  });
});
