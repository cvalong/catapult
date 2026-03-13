# Catapult Roadmap

> Critical path to publish is marked **[BLOCKER]**. Everything else can ship after.

---

## In Flight — current working tree

These changes are already written but uncommitted. Ship as individual PRs off `main`.

- [ ] **[BLOCKER]** `feat/backend-tests` — commit all test files (`license.test.ts`, `auth-middleware.test.ts`, `licenses.test.ts`, `user.test.ts`, `billing.test.ts`) + `vitest.config.ts`
- [ ] **[BLOCKER]** `feat/type-augmentation` — commit `src/types/hono.d.ts`, updated `auth-middleware.ts` (AppUser cast), `billing.ts` (`any` cast removal)
- [ ] **[BLOCKER]** `feat/user-routes` — commit `src/routes/user.ts`
- [ ] **[BLOCKER]** `feat/server-hardening` — commit `index.ts` (CORS, rate limiting, error handler), `.env.example` (CORS_ORIGIN), `bunfig.toml`, `bun.lock`

---

## Publish Blockers — must land before `npm publish`

- [ ] **[BLOCKER]** Uncomment `template-backend` CI job in `.github/workflows/ci.yml` (job exists, just commented out — unblock once tests pass)
- [ ] **[BLOCKER]** Uncomment and wire publish workflow in `.github/workflows/ci.yml` (job exists, just commented out — triggers on version tag)
- [ ] **[BLOCKER]** README setup guide — one-page walkthrough: `npx create-catapult`, env vars to fill in, `bun run dev`, first deploy
- [ ] **[BLOCKER]** Verify CLI scaffold end-to-end: `npx create-catapult my-app` produces a working project with `bun run dev` and `bun test` both passing

---

## Nice-to-Have Before v1.0

Low-lift polish that makes the first impression better.

- [ ] Remove committed `dist/` and `.vite/` cache from `template/frontend/marketing/` (add to `.gitignore` if missing)
- [ ] Replace placeholder content in `Features.astro` and `Pricing.astro` with real copy
- [ ] Document `TEMPLATE_DOWNLOAD_URL` in README (what it is, how to point it at a GitHub release asset)

---

## Post-Publish — v1.x

Ship these as follow-on releases after the initial publish.

- [ ] Playwright e2e tests for the React SPA (sign-in, sign-up, account management flows)
- [ ] Multi-plan Stripe support (array of price configs instead of a single env var)
- [ ] OAuth / social login — Google at minimum, via Better Auth
- [ ] Pre-commit DB migration step in CLI setup flow
