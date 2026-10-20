import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { validateContent, type ContentDocument } from "./document";

export const contentPath = "content/site.json";
export const repositoryName = "ansfds/iks";
const sha = z.string().regex(/^[a-f0-9]{40}$/);
const gitObject = z.object({ sha });
const gitFile = z.object({
  sha,
  type: z.literal("file"),
  encoding: z.literal("base64"),
  size: z.number().max(900000),
  content: z.string().max(1300000),
});
export type Snapshot = { document: ContentDocument; revision: string };
export type CommitResult = { commit: string; revision: string };
export type ContentAsset = { path: string; content: string };
export interface ContentRepository {
  read(): Promise<Snapshot>;
  write(
    document: ContentDocument,
    revision: string,
    message: string,
    assets?: ContentAsset[]
  ): Promise<CommitResult>;
}
export function cmsConfiguration() {
  const branch = process.env.CMS_BRANCH;
  const productionBranch = process.env.CMS_PRODUCTION_BRANCH;
  if (
    process.env.CMS_GITHUB_REPOSITORY !== repositoryName ||
    !branch ||
    !productionBranch ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_./-]{0,150}$/.test(branch) ||
    branch.includes("..") ||
    branch.endsWith("/") ||
    branch.endsWith(".lock")
  )
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "إعداد مستودع المحتوى وفرعه غير مكتمل.",
    });
  const production = process.env.VERCEL_ENV === "production";
  if (production && process.env.VERCEL !== "1")
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "تعديل فرع الإنتاج متاح من بيئة Vercel الإنتاجية المعتمدة فقط.",
    });
  if (
    (production && branch !== productionBranch) ||
    (!production && branch === productionBranch)
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "فرع المحتوى لا يطابق بيئة النشر.",
    });
  if (
    process.env.VERCEL === "1" &&
    (process.env.VERCEL_GIT_REPO_OWNER !== "ansfds" ||
      process.env.VERCEL_GIT_REPO_SLUG !== "iks" ||
      process.env.VERCEL_GIT_COMMIT_REF !== branch)
  )
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "هذه المعاينة غير مخوّلة بتعديل هذا الفرع.",
    });
  return { branch, productionBranch, production };
}
export async function githubRequest(
  endpoint: string,
  init: RequestInit = {},
  fetcher = fetch
) {
  if (!process.env.CMS_GITHUB_TOKEN)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "صلاحية GitHub غير مهيّأة على الخادم.",
    });
  let response;
  try {
    response = await fetcher(
      `https://api.github.com/repos/${repositoryName}/${endpoint}`,
      {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${process.env.CMS_GITHUB_TOKEN}`,
          "x-github-api-version": "2022-11-28",
          "content-type": "application/json",
          ...init.headers,
        },
      }
    );
  } catch {
    throw new TRPCError({
      code: "TIMEOUT",
      message: "تعذر تأكيد الاتصال بـGitHub. حدّث المحتوى قبل إعادة المحاولة.",
    });
  }
  if (!response.ok) {
    const code = [409, 422].includes(response.status)
      ? "CONFLICT"
      : response.status === 429 ||
          (response.status === 403 &&
            response.headers.get("x-ratelimit-remaining") === "0")
        ? "TOO_MANY_REQUESTS"
        : "PRECONDITION_FAILED";
    throw new TRPCError({
      code,
      message:
        code === "CONFLICT"
          ? "تغيّر المحتوى أثناء التحرير. حدّث الصفحة وراجع تعديلاتك قبل إعادة الحفظ."
          : "رفض GitHub العملية. تحقق من صلاحيات المستودع والفرع وحدود الطلبات.",
    });
  }
  return response.json();
}
export class GitHubContentRepository implements ContentRepository {
  private fetcher: typeof fetch;
  constructor(fetcher: typeof fetch = fetch) {
    this.fetcher = fetcher;
  }
  async read(): Promise<Snapshot> {
    const { branch } = cmsConfiguration();
    const response = gitFile.parse(
      await githubRequest(
        `contents/${contentPath}?ref=${encodeURIComponent(branch)}`,
        {},
        this.fetcher
      )
    );
    if (
      response.type !== "file" ||
      response.encoding !== "base64" ||
      !/^[0-9a-f]{40}$/.test(response.sha) ||
      response.size > 900000
    )
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "ملف المحتوى غير صالح أو تجاوز الحجم المحدد.",
      });
    try {
      return {
        document: validateContent(
          JSON.parse(Buffer.from(response.content, "base64").toString("utf8"))
        ),
        revision: response.sha,
      };
    } catch {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "فشل التحقق من ملف المحتوى في GitHub.",
      });
    }
  }
  async write(
    document: ContentDocument,
    revision: string,
    message: string,
    assets: ContentAsset[] = []
  ): Promise<CommitResult> {
    const { branch, production } = cmsConfiguration();
    if (
      process.env.CMS_WRITES_ENABLED !== "YES" ||
      (production && process.env.CMS_PRODUCTION_WRITES_APPROVED !== "YES")
    )
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "حفظ المحتوى غير مفعّل لهذه البيئة.",
      });
    const body = JSON.stringify(validateContent(document), null, 2) + "\n";
    if (Buffer.byteLength(body) > 900000)
      throw new TRPCError({
        code: "PAYLOAD_TOO_LARGE",
        message: "تجاوز المحتوى الحجم المناسب لهذا النظام.",
      });
    if (assets.length) {
      const ref = z
        .object({ object: gitObject })
        .parse(
          await githubRequest(
            `git/ref/heads/${encodeURIComponent(branch)}`,
            {},
            this.fetcher
          )
        );
      const head = ref.object?.sha;
      if (!/^[0-9a-f]{40}$/.test(head))
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      const current = gitFile.parse(
        await githubRequest(
          `contents/${contentPath}?ref=${head}`,
          {},
          this.fetcher
        )
      );
      if (current.sha !== revision)
        throw new TRPCError({
          code: "CONFLICT",
          message: "تغيّر المحتوى أثناء رفع الصورة. حدّث الصفحة أولًا.",
        });
      const parent = z
        .object({ tree: gitObject })
        .parse(await githubRequest(`git/commits/${head}`, {}, this.fetcher));
      const entries = [
        { path: contentPath, content: Buffer.from(body).toString("base64") },
        ...assets,
      ];
      const blobs = await Promise.all(
        entries.map(async entry => {
          if (
            entry.path !== contentPath &&
            !/^public\/images\/cms\/[0-9a-f]{64}\.(png|jpg|webp)$/.test(
              entry.path
            )
          )
            throw new TRPCError({ code: "BAD_REQUEST" });
          const blob = gitObject.parse(
            await githubRequest(
              "git/blobs",
              {
                method: "POST",
                body: JSON.stringify({
                  encoding: "base64",
                  content: entry.content,
                }),
              },
              this.fetcher
            )
          );
          return {
            path: entry.path,
            mode: "100644",
            type: "blob",
            sha: blob.sha,
          };
        })
      );
      const tree = gitObject.parse(
        await githubRequest(
          "git/trees",
          {
            method: "POST",
            body: JSON.stringify({ base_tree: parent.tree.sha, tree: blobs }),
          },
          this.fetcher
        )
      );
      const commit = gitObject.parse(
        await githubRequest(
          "git/commits",
          {
            method: "POST",
            body: JSON.stringify({ message, tree: tree.sha, parents: [head] }),
          },
          this.fetcher
        )
      );
      await githubRequest(
        `git/refs/heads/${encodeURIComponent(branch)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ sha: commit.sha, force: false }),
        },
        this.fetcher
      );
      return { commit: commit.sha, revision: blobs[0].sha };
    }
    // The file SHA is GitHub's compare-and-swap guard. No force push, overwrite or automatic retry.
    const result = z
      .object({ commit: gitObject, content: gitObject })
      .parse(
        await githubRequest(
          `contents/${contentPath}`,
          {
            method: "PUT",
            body: JSON.stringify({
              branch,
              sha: revision,
              content: Buffer.from(body).toString("base64"),
              message,
            }),
          },
          this.fetcher
        )
      );
    if (
      !/^[0-9a-f]{40}$/.test(result.commit?.sha) ||
      !/^[0-9a-f]{40}$/.test(result.content?.sha)
    )
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "لم يمكن تأكيد commit. حدّث المحتوى قبل تكرار العملية.",
      });
    return { commit: result.commit.sha, revision: result.content.sha };
  }
}
