import { TRPCError } from "@trpc/server";
import { cmsConfiguration } from "./github";

type Alias = {
  projectId?: string;
  alias?: string;
  deploymentId?: string;
  deployment?: { id?: string };
};
type Project = {
  id?: string;
  link?: {
    type?: string;
    org?: string;
    repo?: string;
    productionBranch?: string;
  };
};
type Deployment = {
  uid: string;
  url: string;
  state?: string;
  readyState?: string;
  target?: string | null;
  meta?: Record<string, string>;
};
async function vercelGet<T>(endpoint: string): Promise<T> {
  if (!process.env.CMS_VERCEL_TOKEN || !process.env.CMS_VERCEL_PROJECT_ID)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "يلزم توثيق مشروع Vercel الحالي قبل تفعيل الحفظ.",
    });
  const separator = endpoint.includes("?") ? "&" : "?";
  const scope = process.env.CMS_VERCEL_TEAM_ID
    ? `${separator}teamId=${encodeURIComponent(process.env.CMS_VERCEL_TEAM_ID)}`
    : "";
  try {
    const response = await fetch("https://api.vercel.com" + endpoint + scope, {
      headers: { authorization: `Bearer ${process.env.CMS_VERCEL_TOKEN}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Access denied");
    return (await response.json()) as T;
  } catch {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "تعذر التحقق من مشروع Vercel أو حالة النشر. لم تُؤكَّد نتيجة النشر.",
    });
  }
}
export async function verifyExistingProject() {
  const { productionBranch } = cmsConfiguration();
  const id = process.env.CMS_VERCEL_PROJECT_ID;
  if (process.env.VERCEL_PROJECT_ID && process.env.VERCEL_PROJECT_ID !== id)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "مشروع Vercel لا يطابق المشروع المعتمد.",
    });
  const [alias, project] = await Promise.all([
    vercelGet<Alias>("/v4/aliases/iks-pearl.vercel.app"),
    vercelGet<Project>("/v9/projects/" + encodeURIComponent(id || "")),
  ]);
  if (
    alias.projectId !== id ||
    alias.alias !== "iks-pearl.vercel.app" ||
    project.id !== id ||
    project.link?.type !== "github" ||
    project.link.org?.toLowerCase() !== "ansfds" ||
    project.link.repo?.toLowerCase() !== "iks" ||
    project.link.productionBranch !== productionBranch
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "الرابط الحالي أو المستودع أو فرع الإنتاج لا يطابق الإعداد المعتمد.",
    });
  return { alias, project };
}
export async function deploymentStatus(commit: string) {
  const { branch, production } = cmsConfiguration();
  const { alias } = await verifyExistingProject();
  const result = await vercelGet<{ deployments?: Deployment[] }>(
    `/v6/deployments?projectId=${encodeURIComponent(process.env.CMS_VERCEL_PROJECT_ID!)}&limit=100`
  );
  const deployments = result.deployments || [];
  const deployment = deployments.find(
    item =>
      item.meta?.githubCommitSha === commit &&
      item.meta?.githubCommitRef === branch &&
      (production ? item.target === "production" : item.target !== "production")
  );
  if (!deployment) return { state: "saved" as const, url: null };
  const state = deployment.readyState || deployment.state;
  if (state === "ERROR" || state === "CANCELED")
    return { state: "failed" as const, url: null };
  // READY alone does not prove the production alias switched to this deployment.
  if (
    state === "READY" &&
    (!production ||
      (alias.deploymentId || alias.deployment?.id) === deployment.uid)
  ) {
    if (!/^[a-zA-Z0-9-]+\.vercel\.app$/.test(deployment.url))
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "رابط النشر غير صالح.",
      });
    return {
      state: "deployed" as const,
      url: production
        ? "https://iks-pearl.vercel.app"
        : `https://${deployment.url}`,
    };
  }
  return { state: "deploying" as const, url: null };
}
