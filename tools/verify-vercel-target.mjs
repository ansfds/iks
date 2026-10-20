import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Read-only: resolve the real project from the alias rather than guessing its name.
const aliasName = 'iks-pearl.vercel.app';
let token;
async function get(endpoint, optional = false) {
  const response = await fetch('https://api.vercel.com' + endpoint, {
    method: 'GET', headers: { authorization: `Bearer ${token}` },
    redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  if (optional && [403, 404].includes(response.status)) return null;
  if (!response.ok) throw new Error(`Vercel read access failed (${response.status}); sign in to the account owning this alias`);
  return response.json();
}
try {
  let configuration = {};
  const directory = process.platform === 'win32'
    ? path.join(process.env.APPDATA, 'com.vercel.cli', 'Data')
    : path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), 'com.vercel.cli');
  token = process.env.VERCEL_TOKEN;
  if (!token) {
    const auth = JSON.parse(await readFile(path.join(directory, 'auth.json'), 'utf8'));
    const expiry = Number(auth.expiresAt);
    if (expiry && expiry * (expiry < 1e12 ? 1000 : 1) <= Date.now()) throw new Error('Vercel session expired. Run npx vercel login or reconnect the Vercel app first');
    token = auth.token;
    try { configuration = JSON.parse(await readFile(path.join(directory, 'config.json'), 'utf8')); } catch { /* Personal scope can still be resolved. */ }
  }
  if (!token) throw new Error('Vercel login required');
  const teamResponse = await get('/v2/teams?limit=100');
  if (teamResponse.pagination?.next) throw new Error('More than 100 teams: provide the intended Vercel account scope before continuing');
  const teams = teamResponse.teams || [];
  const scopes = [...new Set([configuration.currentTeam, '', ...teams.map(team => team.id)].filter(scope => typeof scope === 'string'))];
  let alias, scope;
  for (const candidate of scopes) {
    const suffix = candidate ? '?teamId=' + encodeURIComponent(candidate) : '';
    const result = await get('/v4/aliases/' + encodeURIComponent(aliasName) + suffix, true);
    if (result?.alias === aliasName && result.projectId) { alias = result; scope = candidate; break; }
  }
  if (!alias) throw new Error('The signed-in account cannot resolve the existing alias; no project was linked or created');
  const suffix = scope ? '?teamId=' + encodeURIComponent(scope) : '';
  const project = await get('/v9/projects/' + encodeURIComponent(alias.projectId) + suffix);
  const deploymentId = alias.deploymentId || alias.deployment?.id;
  if (!deploymentId) throw new Error('Alias deployment is unavailable');
  const deployment = await get('/v13/deployments/' + encodeURIComponent(deploymentId) + suffix);
  if (project.id !== alias.projectId || project.link?.type !== 'github' || project.link.org?.toLowerCase() !== 'ansfds' || project.link.repo?.toLowerCase() !== 'iks') throw new Error('Alias project does not match ansfds/iks; stop for review');
  if (!project.link.productionBranch || deployment.target !== 'production') throw new Error('Production branch or alias production target could not be verified');
  const summary = {
    verified: true, checkedAt: new Date().toISOString(), alias: aliasName,
    projectId: project.id, projectName: project.name, teamId: scope || null,
    teamSlug: teams.find(team => team.id === scope)?.slug || null,
    repository: 'ansfds/iks', productionBranch: project.link.productionBranch,
    deployedBranch: deployment.meta?.githubCommitRef || null,
    deployedCommit: deployment.meta?.githubCommitSha || null,
    deploymentId, deploymentUrl: deployment.url,
    rootDirectory: project.rootDirectory ?? null,
    environmentNames: project.env?.map(variable => ({ key: variable.key, targets: variable.target })) || [],
  };
  await mkdir('.cache', { recursive: true });
  await writeFile('.cache/vercel-target.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error('Target verification stopped:', error.code || error.cause?.code || error.message);
  process.exitCode = 1;
}
