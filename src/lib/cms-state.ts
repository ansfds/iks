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
    const value = JSON.parse(sessionStorage.getItem("cms-last-save") || "null");
    return /^[a-f0-9]{40}$/.test(value?.commit) &&
      Number.isFinite(value?.savedAt)
      ? value
      : null;
  } catch {
    return null;
  }
}
export function confirmedCmsSave(commit: string, nextRevision: string) {
  if (!/^[a-f0-9]{40}$/.test(commit) || !/^[a-f0-9]{40}$/.test(nextRevision))
    return;
  revision = nextRevision;
  const value: CmsSave = { commit, savedAt: Date.now() };
  sessionStorage.setItem("cms-last-save", JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("cms-saved", { detail: value }));
}
