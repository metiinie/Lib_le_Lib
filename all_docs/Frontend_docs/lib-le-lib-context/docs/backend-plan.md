# Backend Development Plan

## Scope of this document

This covers the NestJS API only. `lib-le-lib-schema.sql` (already written and tested
against Postgres 16) is the database source of truth — this plan builds the API layer on
top of it. The Expo client is out of scope here. Read this alongside `architecture.md`
(layering/module boundaries), `constraints.md` (hard limits), and `testing.md` (the test
table every phase below has to satisfy).

## Decisions made so far

So these don't get re-litigated mid-build:

- **ORM: TypeORM**, not Prisma/Drizzle. Its `Repository<T>` class maps directly onto the
  Repository pattern in `patterns.md`, and `@nestjs/typeorm` is the most-documented path
  in NestJS itself.
- **Migrations, not auto-sync.** `synchronize: false`, permanently. Migration `0001` is
  `lib-le-lib-schema.sql` verbatim. All future schema changes are hand-written SQL
  migrations in the same style — TypeORM's auto-diff generator doesn't handle custom
  enums, multiple schemas, or triggers well, and this schema uses all three.
- **Auth: phone/email OTP only for v1.** No password flow — matches the `otp_codes`
  table already in the schema. Add password auth later only for a real reason.
- **Jobs: `@nestjs/schedule`** for the two background jobs the schema implies
  (re-verification reminders, document retention purge). No separate queue
  infrastructure needed at this scale yet.
- **Logging: `nestjs-pino`**, with redaction wired in from day one, not bolted on later.
- **Testing: `testcontainers`** spins up a real ephemeral Postgres per CI run with
  `lib-le-lib-schema.sql` applied — integration tests run against the real schema.

If the team disagrees with any of these, fine — update this file and `stack.md` together
so they don't drift apart.

## Phase 0 — Project Setup & Tooling

**Duration: 3–4 days**

- [ ] `nest new lib-le-lib-api` on Node 24 LTS / NestJS 11.x / TypeScript 6.0.x (`stack.md`)
- [ ] Install: `@nestjs/config @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer @nestjs/swagger @nestjs/throttler @nestjs/schedule nestjs-pino helmet`
- [ ] Module skeleton matching `architecture.md` exactly: `auth/ users/ profiles/ photos/ discovery/ matches/ messages/ safety/ verification/ resources/ qa/ subscriptions/`
- [ ] `docker-compose.yml`: a `postgres:18` service + the API service, so `docker compose up` gives any new dev a working stack with zero manual steps
- [ ] Copy `lib-le-lib-schema.sql` into `migrations/0001_initial_schema.ts` as a raw-SQL TypeORM migration; run it against the dev container
- [ ] Wire up `nestjs-pino` redaction for the fields in `conventions.md` (phone, email, `ciphertext`, `storage_ref`, message bodies)
- [ ] GitHub Actions: lint → build → unit test → integration test (against a `testcontainers` Postgres) on every PR — build this CI gate now, not retroactively in Phase 8

**Done when:** a fresh clone + `docker compose up` gives a running API with the full schema applied, and an empty PR triggers a green CI run.

## Phase 1 — Auth & Core Identity

**Duration: 1 week** · Modules: `auth/`, `users/`, `devices/`

- [ ] `POST /auth/otp/request` — phone or email, writes `otp_codes`, sends via Twilio/SES (stub the send in dev)
- [ ] `POST /auth/otp/verify` — validates code, creates/finds the `users` row, issues access + refresh JWT
- [ ] `POST /auth/refresh` — rotates the refresh token
- [ ] `POST /devices` — registers push token + E2E public key for the current device
- [ ] Repositories: `UsersRepository`, `OtpCodesRepository`, `DevicesRepository`
- [ ] `JwtAuthGuard` + a `RolesGuard` reading `users.role` — every later role-gated route (verification officer, moderator, admin, health professional) depends on this guard existing now
- [ ] Tests: OTP expiry, OTP attempt rate-limiting, duplicate phone/email rejected at signup, protected route rejects a missing/expired token

**Done when:** a real device can sign up via OTP and call one protected route end to end, against the dev Postgres — no mocks.

## Phase 2 — Profiles & Photos

**Duration: 1.5 weeks** · Modules: `profiles/`, `photos/`

- [ ] `GET/POST/PATCH /profiles/me`
- [ ] `GET /regions`, `GET /interest-tags` (read endpoints over seeded data)
- [ ] `POST /photos/upload-url` → short-lived signed PUT URL into the **profile photo bucket** (not the verification bucket — separate from day one)
- [ ] `POST /photos` → registers the row once the client-side upload completes
- [ ] `GET /photos/:id` → resolves blur/reveal: checks `photo_reveal_grants` for (photo, viewer); returns the blurred asset or a signed URL to the original
- [ ] `POST /photos/:id/reveal-grants` (grant) / `DELETE /photos/:id/reveal-grants/:userId` (revoke) — the Reveal Grant pattern, built here for the first time, reused in Phase 5
- [ ] Tests: the **Blur/reveal** and **Revoked reveal** rows from `testing.md`, written now as real automated tests

**Done when:** an automated test proves an ungranted viewer cannot retrieve an unblurred photo, including by guessing the storage key.

## Phase 3 — Verification Module

**Duration: 1.5–2 weeks** · Module: `verification/` — isolated schema, narrow interface
**Higher care here than anywhere else in the backend.** This is the module the rest of the product's trust depends on.

- [ ] `POST /verification/submissions` — signed upload into the **isolated** verification bucket (separate credentials from the profile photo bucket); creates `verification.verification_records` (`status = submitted`)
- [ ] `GET /verification/me/status`
- [ ] `GET /verification/queue` — `verification_officer` role only
- [ ] `POST /verification/:id/decision` — approve/reject + reason; sets `expiry_date` on approval; writes an `audit_logs` row **in the same transaction**
- [ ] Cron: expiry reminder — `verification_records` within N days of `expiry_date`
- [ ] Cron: retention purge — null `storage_ref`, set `deleted_at` on `verification.documents` ~30 days after `decision_at`
- [ ] Tests: the **Verification isolation** row from `testing.md` — a non-officer reading `verification.documents` gets a hard denial, never a quietly filtered empty list

**Done when:** submit → review → decide works end to end, and an automated test — not a manual check — proves the role gate actually denies.

## Phase 4 — Discovery & Matching

**Duration: 1 week** · Modules: `discovery/`, `matches/`, `compatibility-quiz/`

- [ ] `GET /discovery` — age range, gender, region, relationship-goal filters; excludes blocked users both directions (depends on Phase 6 — see note)
- [ ] `POST /swipes` — like/pass; the match itself is created by the DB trigger already in `lib-le-lib-schema.sql`, so this endpoint inserts the swipe and reports back whether a match resulted
- [ ] `GET /matches`
- [ ] `GET /compatibility-quiz/questions`, `POST /compatibility-quiz/responses`
- [ ] Tests: the **Mutual match** row from `testing.md` — already proven at the database layer; prove it again through the real service/API layer

**Dependency:** block-exclusion in `/discovery` and `/matches` needs the `blocks` table from Phase 6. Land the block-check before or alongside this phase — don't ship discovery "temporarily visible to a blocked user," which is exactly the kind of gap `scope.md` exists to prevent.

**Done when:** two test users complete like → like → match through the real API, and a blocked user never appears for the user who blocked them.

## Phase 5 — Messaging

**Duration: 1.5 weeks** · Modules: `messages/`, `video-calls/`
**The most technically involved phase — budget the extra time, don't compress it.**

- [ ] Device public-key distribution endpoint (client-side E2E session setup — matrix-js-sdk/Olm per `stack.md`)
- [ ] `POST /matches/:id/messages` — accepts `ciphertext` + `nonce` only; the service has **no code path** that attempts to read plaintext
- [ ] `GET /matches/:id/messages` — paginated
- [ ] WebSocket gateway for real-time delivery + read receipts (suppressed when `discreet_mode` is on, per `business-rules.md`)
- [ ] Message attachments — reuse the Reveal Grant pattern from Phase 2
- [ ] `POST /matches/:id/video-calls` (schedule) + status updates — metadata only, no video infra in v1
- [ ] Tests: the **Chat confidentiality** row from `testing.md` — inspect the raw `messages.ciphertext` column and assert no fixture plaintext is recoverable

**Done when:** two matched test clients exchange a message over the real socket, and the database row is unintelligible without the clients' own keys.

## Phase 6 — Safety & Trust

**Duration: 1 week** · Modules: `safety/`, `moderation/`

- [ ] `POST /blocks`, `DELETE /blocks/:id` — retrofit the exclusion check into Phase 4/5 queries if it wasn't already landed there
- [ ] `POST /reports`, `GET /reports` (moderator queue, severity-sorted), `POST /reports/:id/actions`
- [ ] Every decision writes `audit_logs` in the same transaction as the action itself
- [ ] Tests: the **Block visibility** row from `testing.md` — both directions, across discovery, matches, and messages

**Done when:** an automated test blocks user A from user B, then asserts B is invisible to A and vice versa across every surface — not just the one the feature was originally built for.

## Phase 7 — Support & Monetization

**Duration: 1 week** · Modules: `resources/`, `qa/`, `success-stories/`, `subscriptions/`

- [ ] `resources/` — admin-only write, public read of `published = true` only
- [ ] `qa/` — member opens a thread; `health_professional`-role users pick it up and reply
- [ ] `success-stories/` — submission + admin approval; **`submitted_by_user_id` is never serialized in any public-facing response** — enforce in the DTO, not just by convention
- [ ] `subscriptions/` — payment-provider webhook handler + a `PlanGuard` checking `status`/`plan` before premium-gated actions

**Done when:** a free-tier test user is correctly rejected by `PlanGuard` on a premium route, and a simulated webhook correctly upgrades their plan.

## Phase 8 — Cross-Cutting Hardening

**Duration: 1 week** — can run partly in parallel with Phases 6–7

- [ ] `@nestjs/throttler` on `/auth/otp/*`, `/swipes`, `/reports` specifically — the abuse-prone routes
- [ ] Global exception filter producing the exact error shape from `conventions.md`
- [ ] Every row of the `testing.md` security table running as a real CI-gated test — this is a checkpoint, not a new feature
- [ ] Swagger docs generated, with `verification/` and `moderation/` routes excluded from the public spec
- [ ] A basic load test against the budgets in `constraints.md` — just enough to catch an obviously missing index, not a full perf pass

**Done when:** the full security test table in `testing.md` is green in CI, and nothing in this list is still a TODO.

## Phase 9 — Pre-Integration Readiness

**Duration: 3–4 days**

- [ ] Seed script: regions, interest tags, compatibility quiz questions — a fresh `docker compose up` should be usable immediately, not empty
- [ ] Export the OpenAPI spec for the Expo team to generate a typed client from
- [ ] Staging deploy

This hands off into **Step 9 (Security Hardening & Compliance Review)** in the master build documentation — the penetration test and legal review there are organization-level steps, not backend tickets, so they're intentionally not duplicated here.

## Timeline summary

| Phase | Duration | Can run in parallel with |
|---|---|---|
| 0 — Setup | 3–4 days | — |
| 1 — Auth & identity | 1 week | — |
| 2 — Profiles & photos | 1.5 weeks | — |
| 3 — Verification | 1.5–2 weeks | Phase 2 (different engineer — little shared surface) |
| 4 — Discovery & matching | 1 week | — |
| 5 — Messaging | 1.5 weeks | Phase 6 (different engineer) |
| 6 — Safety & trust | 1 week | Phase 5 |
| 7 — Support & monetization | 1 week | Phase 8 |
| 8 — Hardening | 1 week | Phase 7 |
| 9 — Pre-integration | 3–4 days | — |

**Solo backend engineer:** roughly **10–11 weeks**, sequential.
**Two backend engineers:** roughly **7–8 weeks**, using the parallel pairings above.

This is more granular — and a bit longer — than the "6–8 weeks" in the original build
documentation's high-level roadmap. That number was a placeholder written before the
schema and module boundaries existed. Trust this version; update the build
documentation's Step 5 estimate to match if the discrepancy comes up later.

## Deliberately out of scope for this plan

Telehealth-partner integration, liveness-check ML, and live video calls are Phase 2/3
*product* features per the master roadmap, and intentionally have no phase above. They
get their own scope card (`scope.md`) when their turn comes, rather than being
half-built here as a "while I'm in this module anyway" addition.
