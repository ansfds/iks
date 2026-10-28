let revision = "";
export function currentCmsRevision() {
  return revision;
}
export function setCmsRevision(value: string) {
  revision = value;
}
export type CmsSave = { commit: string; savedAt: number };
export function lastCmsSave(): CmsSave | null {
  try {
    const value = JSON.parse(sessionStorage.getItem("supabase-last-save") || "null");
    return /^[a-zA-Z0-9-]{1,64}$/.test(value?.commit) &&
      Number.isFinite(value?.savedAt)
      ? value
      : null;
  } catch {
    return null;
  }
}
export function confirmedCmsSave(commit: string, nextRevision: string) {
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(commit) || !/^[a-zA-Z0-9-]{1,64}$/.test(nextRevision))
    return;
  revision = nextRevision;
  const value: CmsSave = { commit, savedAt: Date.now() };
  sessionStorage.setItem("supabase-last-save", JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("cms-saved", { detail: value }));
}
