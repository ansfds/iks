import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

// Test-only local Git repository. It has NO remote and cannot reach the real GitHub repository.
export function gitFixture(directory) {
  const root = path.resolve(".cache");
  const cwd = path.resolve(directory);
  if (
    !cwd.startsWith(root + path.sep) ||
    !path.basename(cwd).startsWith("git-cms-qa-")
  )
    throw new Error("Unsafe test repository path");
  mkdirSync(cwd, { recursive: true });
  const branch = "experiment/git-backed-cms";
  const git = (args, input, environment = {}) =>
    execFileSync("git", args, {
      cwd,
      input,
      encoding: "utf8",
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        GIT_DIR: path.join(cwd, ".git"),
        GIT_WORK_TREE: cwd,
        GIT_INDEX_FILE: path.join(cwd, ".git", "index"),
        GIT_AUTHOR_NAME: "CMS QA",
        GIT_AUTHOR_EMAIL: "cms-qa@example.invalid",
        GIT_COMMITTER_NAME: "CMS QA",
        GIT_COMMITTER_EMAIL: "cms-qa@example.invalid",
        ...environment,
      },
    }).trim();
  const initialized = existsSync(path.join(cwd, ".git"));
  if (!initialized) {
    git(["init", "-b", branch]);
    const blob = git(
      ["hash-object", "-w", "--stdin"],
      readFileSync("content/site.json")
    );
    const tree = git(["mktree"], `100644 blob ${blob}\tsite.json\n`);
    const parentTree = git(["mktree"], `040000 tree ${tree}\tcontent\n`);
    const commit = git([
      "commit-tree",
      parentTree,
      "-m",
      "Initial isolated public-content fixture",
    ]);
    git(["update-ref", `refs/heads/${branch}`, commit]);
  }
  if (
    path.resolve(git(["rev-parse", "--show-toplevel"])) !== cwd ||
    git(["remote"])
  )
    throw new Error("QA Git repository must be isolated and have no remote");
  const head = () => git(["rev-parse", "HEAD"]);
  const fileSha = () => git(["rev-parse", "HEAD:content/site.json"]);
  const fileText = () => git(["show", "HEAD:content/site.json"]) + "\n";
  function treeWith(base, entries) {
    const indexPath = path.join(cwd, "qa-index");
    const environment = { GIT_INDEX_FILE: indexPath };
    git(["read-tree", base], undefined, environment);
    for (const entry of entries)
      git(
        [
          "update-index",
          "--add",
          "--cacheinfo",
          entry.mode,
          entry.sha,
          entry.path,
        ],
        undefined,
        environment
      );
    const tree = git(["write-tree"], undefined, environment);
    // Delete only the verified fixture index file; never a recursive path.
    rmSync(indexPath, { force: true });
    return tree;
  }
  const json = (value, status = 200) => Response.json(value, { status });
  const fetcher = async (url, init = {}) => {
    const parsed = new URL(url);
    const route = parsed.pathname.replace("/repos/ansfds/iks/", "");
    const body = init.body ? JSON.parse(String(init.body)) : {};
    if (parsed.hostname === "api.vercel.com") {
      if (route.includes("/aliases/"))
        return json({
          alias: "iks-pearl.vercel.app",
          projectId: "prj_qa_existing",
          deploymentId: "dpl_previous",
        });
      if (route.includes("/projects/"))
        return json({
          id: "prj_qa_existing",
          link: {
            type: "github",
            org: "ansfds",
            repo: "iks",
            productionBranch: "main",
          },
        });
      if (route.includes("/deployments")) {
        let state = "BUILDING";
        try {
          state = JSON.parse(
            readFileSync(path.join(cwd, "deployment-state.json"), "utf8")
          ).state;
        } catch {}
        return json({
          deployments:
            state === "SAVED"
              ? []
              : [
                  {
                    uid: "dpl_qa",
                    url: "iks-cms-qa.vercel.app",
                    readyState: state,
                    target: null,
                    meta: { githubCommitRef: branch, githubCommitSha: head() },
                  },
                ],
        });
      }
      return json({}, 404);
    }
    if (
      parsed.hostname !== "api.github.com" ||
      !parsed.pathname.startsWith("/repos/ansfds/iks/")
    )
      throw new Error("Fixture attempted external access");
    if (
      route.startsWith("contents/content/site.json") &&
      (!init.method || init.method === "GET")
    ) {
      const text = fileText();
      return json({
        type: "file",
        encoding: "base64",
        size: Buffer.byteLength(text),
        sha: fileSha(),
        content: Buffer.from(text).toString("base64"),
      });
    }
    if (route === "contents/content/site.json" && init.method === "PUT") {
      if (body.branch !== branch || body.sha !== fileSha())
        return json({}, 409);
      const parent = head(),
        blob = git(
          ["hash-object", "-w", "--stdin"],
          Buffer.from(body.content, "base64")
        );
      const tree = treeWith(parent, [
        { mode: "100644", sha: blob, path: "content/site.json" },
      ]);
      const commit = git([
        "commit-tree",
        tree,
        "-p",
        parent,
        "-m",
        body.message,
      ]);
      git(["update-ref", `refs/heads/${branch}`, commit, parent]);
      return json({ commit: { sha: commit }, content: { sha: blob } });
    }
    if (route.startsWith("git/ref/heads/"))
      return json({ object: { sha: head() } });
    if (route.startsWith("git/commits/") && !init.method)
      return json({ tree: { sha: git(["rev-parse", head() + "^{tree}"]) } });
    if (route === "git/blobs")
      return json({
        sha: git(
          ["hash-object", "-w", "--stdin"],
          Buffer.from(body.content, "base64")
        ),
      });
    if (route === "git/trees")
      return json({ sha: treeWith(body.base_tree, body.tree) });
    if (route === "git/commits")
      return json({
        sha: git([
          "commit-tree",
          body.tree,
          "-p",
          body.parents[0],
          "-m",
          body.message,
        ]),
      });
    if (route.startsWith("git/refs/heads/") && init.method === "PATCH") {
      if (body.force) return json({}, 409);
      git([
        "update-ref",
        `refs/heads/${branch}`,
        body.sha,
        git(["rev-parse", body.sha + "^"]),
      ]);
      return json({ object: { sha: body.sha } });
    }
    return json({}, 404);
  };
  return { fetcher, head, fileText, git, directory: cwd };
}
