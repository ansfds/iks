import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubContentRepository, cmsConfiguration } from "./cms/github";
import { bundledSnapshot } from "./cms/store";
import { deploymentStatus, verifyExistingProject } from "./cms/deployment";

const old = "a".repeat(40),
  next = "b".repeat(40),
  commit = "c".repeat(40);
const json = (value: unknown, status = 200, headers = {}) =>
  Response.json(value, { status, headers });
beforeEach(() => {
  vi.stubEnv("CMS_GITHUB_REPOSITORY", "ansfds/iks");
  vi.stubEnv("CMS_BRANCH", "experiment/git-backed-cms");
  vi.stubEnv("CMS_PRODUCTION_BRANCH", "main");
  vi.stubEnv("CMS_GITHUB_TOKEN", "test-only-token");
  vi.stubEnv("CMS_WRITES_ENABLED", "YES");
  vi.stubEnv("VERCEL", "0");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("CMS_VERCEL_PROJECT_ID", "prj_existing");
  vi.stubEnv("CMS_VERCEL_TOKEN", "server-only-read-token");
  vi.stubEnv("VERCEL_PROJECT_ID", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GitHub compare-and-swap transport and environment isolation", () => {
  it("reads and validates only the fixed content file at the configured branch", async () => {
    const document = bundledSnapshot().document;
    const fetcher = vi.fn<typeof fetch>(async () =>
      json({
        type: "file",
        encoding: "base64",
        size: 10000,
        sha: old,
        content: Buffer.from(JSON.stringify(document)).toString("base64"),
      })
    );
    const result = await new GitHubContentRepository(fetcher).read();
    expect(result.revision).toBe(old);
    expect(result.document.collections.giftCards).toHaveLength(9);
    expect(String(fetcher.mock.calls[0][0])).toContain(
      "/repos/ansfds/iks/contents/content/site.json?ref=experiment%2Fgit-backed-cms"
    );
  });
  it("uses the file SHA, fixed branch and server credential and waits for GitHub confirmation", async () => {
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.sha).toBe(old);
      expect(body.branch).toBe("experiment/git-backed-cms");
      expect(body.message).toBe("cms: confirmed");
      expect((init?.headers as Record<string, string>).authorization).toBe(
        "Bearer test-only-token"
      );
      return json({ commit: { sha: commit }, content: { sha: next } });
    });
    expect(
      await new GitHubContentRepository(fetcher).write(
        bundledSnapshot().document,
        old,
        "cms: confirmed"
      )
    ).toEqual({ commit, revision: next });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([409, 422])(
    "rejects a GitHub %i conflict without retrying or force-pushing",
    async status => {
      const fetcher = vi.fn<typeof fetch>(async () =>
        json({ message: "SECRET MUST NOT LEAK" }, status)
      );
      await expect(
        new GitHubContentRepository(fetcher).write(
          bundledSnapshot().document,
          old,
          "cms: conflict"
        )
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  );
  it.each([401, 403, 404, 500])(
    "sanitizes GitHub %i errors without returning their body",
    async status => {
      const fetcher = vi.fn<typeof fetch>(async () =>
        json({ message: "SECRET MUST NOT LEAK" }, status)
      );
      await expect(
        new GitHubContentRepository(fetcher).read()
      ).rejects.not.toHaveProperty(
        "message",
        expect.stringContaining("SECRET")
      );
    }
  );
  it("reports rate limits distinctly", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      json({}, 403, { "x-ratelimit-remaining": "0" })
    );
    await expect(
      new GitHubContentRepository(fetcher).read()
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
  it("does not retry an ambiguous network failure", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => {
      throw new Error("network");
    });
    await expect(
      new GitHubContentRepository(fetcher).write(
        bundledSnapshot().document,
        old,
        "cms: uncertain"
      )
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects absent or invalid content instead of reverting to old bundled data", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      json({
        type: "file",
        encoding: "base64",
        size: 10,
        sha: old,
        content: Buffer.from('{"users":[]}').toString("base64"),
      })
    );
    await expect(
      new GitHubContentRepository(fetcher).read()
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
  it("blocks Preview or local writes to the production branch", () => {
    vi.stubEnv("CMS_BRANCH", "main");
    expect(() => cmsConfiguration()).toThrow();
  });
  it("requires the exact Vercel source repository and source branch", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "untrusted-preview");
    vi.stubEnv("VERCEL_GIT_REPO_OWNER", "ansfds");
    vi.stubEnv("VERCEL_GIT_REPO_SLUG", "iks");
    expect(() => cmsConfiguration()).toThrow();
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "experiment/git-backed-cms");
    expect(cmsConfiguration().branch).toBe("experiment/git-backed-cms");
    vi.stubEnv("VERCEL_GIT_REPO_OWNER", "another-owner");
    expect(() => cmsConfiguration()).toThrow();
  });
  it("keeps production writes locked until explicitly enabled after approval", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_GIT_REPO_OWNER", "ansfds");
    vi.stubEnv("VERCEL_GIT_REPO_SLUG", "iks");
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "main");
    vi.stubEnv("CMS_BRANCH", "main");
    vi.stubEnv("CMS_PRODUCTION_WRITES_APPROVED", "");
    const fetcher = vi.fn();
    await expect(
      new GitHubContentRepository(fetcher).write(
        bundledSnapshot().document,
        old,
        "cms"
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects local development configured with a production environment by mistake", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("CMS_BRANCH", "main");
    expect(() => cmsConfiguration()).toThrow();
  });
  it("writes the image and content atomically in one non-forced Git tree commit", async () => {
    const methods: string[] = [];
    const fetcher: typeof fetch = vi.fn<typeof fetch>(async (url, init) => {
      const path = String(url);
      methods.push(init?.method || "GET");
      if (path.includes("/git/ref/heads/"))
        return json({ object: { sha: old } });
      if (path.includes("/contents/"))
        return json({
          type: "file",
          encoding: "base64",
          size: 10,
          sha: old,
          content: "",
        });
      if (path.endsWith("/git/commits/" + old))
        return json({ tree: { sha: old } });
      if (path.endsWith("/git/blobs")) return json({ sha: next });
      if (path.endsWith("/git/trees")) {
        const body = JSON.parse(String(init?.body));
        expect(body.tree).toHaveLength(2);
        expect(body.base_tree).toBe(old);
        return json({ sha: next });
      }
      if (path.endsWith("/git/commits")) return json({ sha: commit });
      if (path.includes("/git/refs/heads/")) {
        expect(JSON.parse(String(init?.body))).toEqual({
          sha: commit,
          force: false,
        });
        return json({ object: { sha: commit } });
      }
      throw new Error("Unexpected endpoint");
    });
    const result = await new GitHubContentRepository(fetcher).write(
      bundledSnapshot().document,
      old,
      "cms: image",
      [
        {
          path: "public/images/cms/" + "a".repeat(64) + ".png",
          content: "AAAA",
        },
      ]
    );
    expect(result.commit).toBe(commit);
    expect(methods.at(-1)).toBe("PATCH");
  });
});

describe("same-project Vercel deployment confirmation", () => {
  function mockVercel(
    options: {
      state?: string;
      branch?: string;
      aliasId?: string;
      projectId?: string;
      target?: string | null;
    } = {}
  ) {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (url, init) => {
        expect(init?.method || "GET").toBe("GET");
        if (String(url).includes("/aliases/"))
          return json({
            alias: "iks-pearl.vercel.app",
            projectId: options.projectId || "prj_existing",
            deploymentId: options.aliasId || "dpl_previous",
          });
        if (String(url).includes("/projects/"))
          return json({
            id: "prj_existing",
            link: {
              type: "github",
              org: "ansfds",
              repo: "iks",
              productionBranch: "main",
            },
          });
        if (String(url).includes("/deployments?"))
          return json({
            deployments: [
              {
                uid: "dpl_new",
                url: "iks-preview.vercel.app",
                readyState: options.state || "BUILDING",
                target: options.target ?? null,
                meta: {
                  githubCommitSha: commit,
                  githubCommitRef:
                    options.branch || "experiment/git-backed-cms",
                },
              },
            ],
          });
        throw new Error("Unexpected Vercel URL");
      })
    );
  }
  it("rejects an alias linked to another project before allowing a content write", async () => {
    mockVercel({ projectId: "prj_wrong" });
    await expect(verifyExistingProject()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("tracks building, ready and failed Preview builds for the exact saved commit", async () => {
    mockVercel();
    expect((await deploymentStatus(commit)).state).toBe("deploying");
    mockVercel({ state: "READY" });
    expect(await deploymentStatus(commit)).toEqual({
      state: "deployed",
      url: "https://iks-preview.vercel.app",
    });
    mockVercel({ state: "ERROR" });
    expect((await deploymentStatus(commit)).state).toBe("failed");
  });
  it("does not attribute a build from another branch to the saved content", async () => {
    mockVercel({ state: "READY", branch: "main" });
    expect((await deploymentStatus(commit)).state).toBe("saved");
  });
  it("does not call a production build deployed before its official alias changes", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CMS_BRANCH", "main");
    vi.stubEnv("VERCEL_GIT_REPO_OWNER", "ansfds");
    vi.stubEnv("VERCEL_GIT_REPO_SLUG", "iks");
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "main");
    mockVercel({ state: "READY", branch: "main", target: "production" });
    expect((await deploymentStatus(commit)).state).toBe("deploying");
    mockVercel({
      state: "READY",
      branch: "main",
      target: "production",
      aliasId: "dpl_new",
    });
    expect(await deploymentStatus(commit)).toEqual({
      state: "deployed",
      url: "https://iks-pearl.vercel.app",
    });
  });
});
