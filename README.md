# GitHub Automation Bot

Event-driven GitHub automation: connect a repo, receive webhooks (issues, pull
requests, pushes), evaluate configurable rules, write back to GitHub (labels/
comments), notify Slack, and review everything in a dashboard.

This build implements the **Recommended Minimum Feature Set** from the source
implementation plan. AI triage (Gemini/Groq), GitHub App auth, and multi-repo
polish are intentionally deferred — see `AI_NOTES.md`.

## Project structure

```
backend/    Node.js + Express + TypeScript API (Mongoose models in backend/src/models/)
frontend/   Angular dashboard
```

## Prerequisites

- Node.js 20+
- A MongoDB database that's a **replica set** (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas) —
  every Atlas cluster, including the free tier, is a replica set by default).
  This matters because the job worker (`backend/src/jobs/worker.ts`) uses
  multi-document transactions, which plain standalone `mongod` doesn't support.
- A GitHub OAuth App: https://github.com/settings/developers
  - Homepage URL: your frontend URL
  - Authorization callback URL: `<BACKEND_URL>/api/auth/github/callback`
- (Optional) A Slack app with a bot token and `chat:write` scope

## Environment variables

Copy `.env.example` to `.env` in the repo root and fill in real values.
`backend/src/env.ts` (Zod-validated) reads from this file. Secrets are never
logged (see `backend/src/logger.ts` redaction config) and must only live in
environment variables — never commit `.env`.

## Local setup

```bash
# from the repo root
npm install --prefix backend
npm install --prefix frontend

# run both apps (separate terminals) — no migration step needed, Mongoose
# creates collections/indexes on first use
npm run dev --prefix backend      # http://localhost:4000
npm run start --prefix frontend   # http://localhost:4200
```

> **Note on this session:** the sandbox this project was built in could not
> reach the npm registry (`npm login`/E401 on any install), so `npm install`,
> `tsc`, and `ng build` were **not** run here. The code was written to be
> internally consistent (correct imports, Mongoose model/field names, Octokit
> and Express APIs), but you should run `npm install` and the typecheck/build
> commands yourself as the first step before trusting it compiles.

## Testing the webhook endpoint without a live GitHub repo

Once a repository is connected (`Repository.webhookSecret` is stored), you can
replay a fake `issues` event locally:

```bash
BODY='{"action":"opened","repository":{"id":123,"full_name":"octocat/hello"},"issue":{"number":1,"title":"Bug: crash on startup","user":{"login":"octocat"},"labels":[]}}'
SECRET='the-repository-webhookSecret-value'
SIG="sha256=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')"

curl -X POST http://localhost:4000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Delivery: test-delivery-1" \
  -H "X-GitHub-Event: issues" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$BODY"
```

Re-sending the same `X-GitHub-Delivery` value should return `{"status":"duplicate"}`
and not create a second event (idempotency check in
`backend/src/controllers/webhookController.ts`).

## Deployment

- Frontend → Vercel using `frontend/vercel.json` (build: `npm run build`,
  output: `dist/frontend/browser`).
- Backend → Render using `backend/render.yaml` (build installs deps and
  compiles TypeScript; start runs the compiled server).
- Database → MongoDB Atlas; set `MONGODB_URI` on the backend service.
- After deploying, update the GitHub OAuth App's callback URL and re-register
  webhooks (reconnect each repository) to point at the production
  `BACKEND_URL`.

None of this was executed in this session — no hosting/DB/GitHub accounts
were available — so treat the config files as a starting point to verify
against each provider's current dashboard.

## What's not implemented

- AI triage (Phase 9) — see `AI_NOTES.md`.
- GitHub App / JWT installation tokens (uses a simpler OAuth App flow instead).
- A message broker for background jobs — the worker (`backend/src/jobs/worker.ts`)
  is a simple in-process DB-polling loop, sufficient for the MVP's scale.

testing rule
