# Elwaseet Git-backed CMS experiment

This branch keeps the existing React admin and public website while storing editable public content in GitHub instead of a runtime database. Target: the EXISTING project serving https://iks-pearl.vercel.app; repository: ansfds/iks.

- [Engineering evaluation and limits (Arabic)](GIT_CMS_EVALUATION_AR.md)
- [Environment, Preview, backup and rollback guide (Arabic)](GIT_CMS_DEPLOYMENT_AR.md)
- [Work completed and access blockers (Arabic)](GIT_CMS_REPORT_AR.md)

No production deployment is authorized yet. The production branch must be verified through Vercel; do not assume it is main. Writes are disabled in .env.example.

Local development: npm ci, npm run auth:setup, npm run local. The setup writes credentials only to ignored .env. Public browsing needs no database or GitHub token; online saves require the CMS environment and target verification.

Checks: npm run check, npm run lint, npm test, npm run build, npm run verify:vercel-artifact, npm run test:browser. The browser test uses an isolated LOCAL Git repository and simulated provider APIs. It is not an online Vercel Preview test.

content/site.json contains only public CMS collections. Private contact messages and transactional financial data must never be placed in this public repository. db/schema.ts and db/migrations are preserved historical MySQL references, not the active persistence layer.
