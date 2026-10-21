import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// This tool can only create branch-scoped Preview variables in the verified existing project.
// It never prints API response bodies, secret values or authorization headers.
const projectId = 'prj_x7OyV8frk1Nlr7ccRPEnczAzvKnd';
const teamId = 'team_VRkAxWqlSsvV8pEFVqodVKxC';
const branch = 'experiment/git-backed-cms';
const requiredSecrets = [
  'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'ADMIN_SESSION_SECRET',
  'CMS_GITHUB_TOKEN', 'CMS_VERCEL_TOKEN', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY',
];
const defaults = {
  ADMIN_SESSION_HOURS: '0.25',
  CMS_GITHUB_REPOSITORY: 'ansfds/iks',
  CMS_BRANCH: branch,
  CMS_PRODUCTION_BRANCH: 'main',
  CMS_WRITES_ENABLED: 'NO',
  CMS_PRODUCTION_WRITES_APPROVED: 'NO',
  CMS_VERCEL_PROJECT_ID: projectId,
  CMS_VERCEL_TEAM_ID: teamId,
  VITE_SITE_URL: 'https://iks-pearl.vercel.app',
};
try {
  const action = process.argv[2] || 'status';
  if (!['status', 'configure'].includes(action)) throw new Error('Use status or configure');
  const linked = JSON.parse(await readFile('.vercel/project.json', 'utf8'));
  if (linked.projectId !== projectId || linked.orgId !== teamId) throw new Error('Local link does not match the verified existing project');
  let token = process.env.VERCEL_TOKEN;
  if (!token) {
    const directory = process.platform === 'win32'
      ? path.join(process.env.APPDATA, 'com.vercel.cli', 'Data')
      : path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'com.vercel.cli');
    const auth = JSON.parse(await readFile(path.join(directory, 'auth.json'), 'utf8'));
    token = auth.token;
  }
  if (!token) throw new Error('Sign in to Vercel locally first');
  async function request(endpoint, variable) {
    // Deliberately no generic write API: the only permitted mutation is this exact env endpoint.
    if (variable && (endpoint !== `/v10/projects/${projectId}/env` || variable.gitBranch !== branch || variable.target?.length !== 1 || variable.target[0] !== 'preview' || !(variable.key in defaults) || variable.value !== defaults[variable.key] || variable.type !== 'plain')) throw new Error('Unsafe environment write rejected');
    const response = await fetch(`https://api.vercel.com${endpoint}${endpoint.includes('?') ? '&' : '?'}teamId=${teamId}`, {
      method: variable ? 'POST' : 'GET',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      ...(variable ? { body: JSON.stringify(variable) } : {}),
      redirect: 'error', signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      const code = /^[a-zA-Z0-9_]+$/.test(failure.error?.code || '') ? failure.error.code : 'unknown';
      const detail = variable ? String(failure.error?.message || '').replaceAll(token, '[redacted]').replace(/Bearer\s+\S+/gi, '[redacted]').slice(0, 250) : '';
      throw new Error(`Vercel request failed (${response.status}, ${code}, ${variable?.key || 'read'}): ${detail}`);
    }
    const result = await response.json();
    if (result.failed?.length || result.error) throw new Error('Vercel rejected environment configuration; inspect variable names in the dashboard');
    return result;
  }
  const [alias, project] = await Promise.all([
    request('/v4/aliases/iks-pearl.vercel.app'), request(`/v9/projects/${projectId}`),
  ]);
  if (alias.projectId !== projectId || alias.alias !== 'iks-pearl.vercel.app' || project.id !== projectId || project.link?.type !== 'github' || project.link?.org !== 'ansfds' || project.link?.repo !== 'iks' || project.link?.productionBranch !== 'main') throw new Error('Existing production target changed; stop for review');
  const existing = await request(`/v9/projects/${projectId}/env`);
  const variables = existing.envs || [];
  const localPreview = variable => variable.gitBranch === branch && variable.target?.length === 1 && variable.target[0] === 'preview';
  const broadlyExposed = variables.filter(variable => requiredSecrets.includes(variable.key) && variable.target?.includes('preview') && !localPreview(variable));
  if (broadlyExposed.length) throw new Error(`Restrict these variables to the trusted Preview branch first: ${broadlyExposed.map(variable => variable.key).join(', ')}`);
  const created = [];
  if (action === 'configure') {
    for (const [key, value] of Object.entries(defaults)) {
      if (variables.some(variable => variable.key === key && localPreview(variable))) continue;
      await request(`/v10/projects/${projectId}/env`, { key, value, type: 'plain', target: ['preview'], gitBranch: branch });
      created.push(key);
    }
  }
  const current = (await request(`/v9/projects/${projectId}/env`)).envs || [];
  const present = [...requiredSecrets, ...Object.keys(defaults)].filter(key => current.some(variable => variable.key === key && localPreview(variable)));
  const missing = [...requiredSecrets, ...Object.keys(defaults)].filter(key => !present.includes(key));
  const summary = {
    checkedAt: new Date().toISOString(), projectId, teamId, branch, productionBranch: 'main',
    productionDeploymentId: alias.deploymentId || alias.deployment?.id,
    systemEnvironmentVariablesEnabled: project.autoExposeSystemEnvs === true,
    created, present, missing,
    // Presence alone does not verify secret values, login, writes or successful deployment.
    readyForCredentialChecks: missing.length === 0,
  };
  await mkdir('.cache', { recursive: true });
  await writeFile('.cache/vercel-preview-environment.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error('Preview preparation stopped:', error.code || error.message);
  process.exitCode = 1;
}
