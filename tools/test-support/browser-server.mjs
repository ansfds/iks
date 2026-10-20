import { gitFixture } from "./git-fixture.mjs";
import { pathToFileURL } from "node:url";
import path from "node:path";
if (
  !process.env.QA_GIT_DIRECTORY ||
  process.env.VERCEL === "1" ||
  !process.env.QA_SERVER_ARTIFACT
)
  throw new Error("Local isolated QA server configuration required");
const fixture = gitFixture(process.env.QA_GIT_DIRECTORY);
const original = globalThis.fetch;
globalThis.fetch = (url, init) =>
  ["api.github.com", "api.vercel.com"].includes(
    new URL(url instanceof Request ? url.url : url).hostname
  )
    ? fixture.fetcher(url, init)
    : original(url, init);
await import(pathToFileURL(path.resolve(process.env.QA_SERVER_ARTIFACT)).href);
