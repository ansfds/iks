// Shared by the runtime and administrative CLI. Never accept SSL options from a URL.
export function databaseOptions(databaseUrl, environment = process.env) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  let url;
  try { url = new URL(databaseUrl); } catch { throw new Error('Invalid DATABASE_URL'); }
  if (url.protocol !== 'mysql:' || !url.hostname || !url.pathname.slice(1)) throw new Error('Invalid MySQL connection configuration');
  const database = decodeURIComponent(url.pathname.slice(1));
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const deployment = environment.VERCEL_ENV;
  if (deployment) {
    if (!['production', 'preview', 'development'].includes(deployment) || environment.DATABASE_ENV !== deployment) {
      throw new Error('DATABASE_ENV must match VERCEL_ENV');
    }
    if (!environment.DATABASE_NAME || environment.DATABASE_NAME !== database) throw new Error('DATABASE_NAME does not match the selected database');
    if (local) throw new Error('Vercel requires a hosted MySQL database');
  }
  const ca = environment.DATABASE_SSL_CA?.replaceAll('\\n', '\n');
  return {
    host: url.hostname.replace(/^\[|\]$/g, ''),
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    charset: 'utf8mb4',
    connectTimeout: 10000,
    supportBigNumbers: true,
    bigNumberStrings: false,
    ...(!local ? { ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2', ...(ca ? { ca } : {}) } } : {}),
  };
}
